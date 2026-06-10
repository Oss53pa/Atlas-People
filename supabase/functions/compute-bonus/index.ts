// Edge Function : compute-bonus (mise à jour M3 §8, §10)
// Calcule les bonus variables de manière AUTORITATIVE et DÉTERMINISTE côté
// serveur (jamais le LLM), en Money.ts bigint (FCFA entier, zéro float, R5) :
//   • DSL contrôlé (SCORE/COEF/SAL_MENS/SAL_ANN, + − × ÷, parenthèses) — jamais
//     d'eval libre (R2) ;
//   • 3 modes d'enveloppe (A prorata + réconciliation itérative des caps /
//     B plafonnée / C libre) ;
//   • action 'simulate' (sans persistance, what-if §8) ou 'calcul' (persiste
//     bonus_calculs statut 'calcule', gating R6 — affichage seulement après
//     rpc_valide_repartition).
//
// Réplique fidèle du moteur testé src/engine/bonus. Réservé RH/admin.
// Déploiement : supabase functions deploy compute-bonus
import { CORS, json } from '../_shared/cors.ts';
import { callerClient, resolveCaller, isHrOrAdmin, serviceClient } from '../_shared/supabase.ts';
import { Money, type Currency } from '../_shared/money.ts';

/* ── DSL contrôlé : rationnels exacts BigInt ──────────────────────────────── */
interface Rational { n: bigint; d: bigint }
const rgcd = (a: bigint, b: bigint): bigint => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a || 1n; };
function rat(n: bigint, d = 1n): Rational { if (d === 0n) throw new Error('DSL: division par zéro'); if (d < 0n) { n = -n; d = -d; } const g = rgcd(n, d); return { n: n / g, d: d / g }; }
const rAdd = (a: Rational, b: Rational) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
const rSub = (a: Rational, b: Rational) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
const rMul = (a: Rational, b: Rational) => rat(a.n * b.n, a.d * b.d);
const rDiv = (a: Rational, b: Rational) => { if (b.n === 0n) throw new Error('DSL: division par zéro'); return rat(a.n * b.d, a.d * b.n); };
function ratFromDecimal(s: string): Rational { const [i, f = ''] = s.split('.'); return rat(BigInt(i + f), 10n ** BigInt(f.length)); }
function roundRat(r: Rational): bigint { const neg = r.n < 0n; const n = neg ? -r.n : r.n; const q = (n * 2n + r.d) / (r.d * 2n); return neg ? -q : q; }
function numToRat(x: number): Rational { if (!Number.isFinite(x)) throw new Error('DSL: valeur non finie'); return ratFromDecimal(x.toString().includes('e') ? x.toFixed(12) : x.toString()); }

const VARS = new Set(['SCORE', 'COEF', 'SAL_MENS', 'SAL_ANN']);
type Tok = { t: 'num'; v: Rational } | { t: 'var'; v: string } | { t: 'op'; v: '+' | '-' | '*' | '/' } | { t: 'lp' } | { t: 'rp' };
function tokenize(src: string): Tok[] {
  const out: Tok[] = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }
    if (c === '(') { out.push({ t: 'lp' }); i++; continue; }
    if (c === ')') { out.push({ t: 'rp' }); i++; continue; }
    if (c === '+' || c === '-') { out.push({ t: 'op', v: c }); i++; continue; }
    if (c === '*' || c === '×') { out.push({ t: 'op', v: '*' }); i++; continue; }
    if (c === '/' || c === '÷') { out.push({ t: 'op', v: '/' }); i++; continue; }
    if (c >= '0' && c <= '9') { let j = i + 1; while (j < src.length && ((src[j] >= '0' && src[j] <= '9') || src[j] === '.')) j++; out.push({ t: 'num', v: ratFromDecimal(src.slice(i, j)) }); i = j; continue; }
    if (/[A-Za-z_]/.test(c)) { let j = i + 1; while (j < src.length && /[A-Za-z_]/.test(src[j])) j++; const name = src.slice(i, j); if (!VARS.has(name)) throw new Error(`DSL: identifiant non autorisé « ${name} »`); out.push({ t: 'var', v: name }); i = j; continue; }
    throw new Error(`DSL: caractère non autorisé « ${c} »`);
  }
  return out;
}
const PREC: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
function toRpn(toks: Tok[]): Tok[] {
  const out: Tok[] = []; const st: Tok[] = [];
  for (const tk of toks) {
    if (tk.t === 'num' || tk.t === 'var') out.push(tk);
    else if (tk.t === 'op') { while (st.length && st[st.length - 1].t === 'op' && PREC[(st[st.length - 1] as { v: string }).v] >= PREC[tk.v]) out.push(st.pop()!); st.push(tk); }
    else if (tk.t === 'lp') st.push(tk);
    else { while (st.length && st[st.length - 1].t !== 'lp') out.push(st.pop()!); if (!st.length) throw new Error('DSL: parenthèses déséquilibrées'); st.pop(); }
  }
  while (st.length) { const top = st.pop()!; if (top.t === 'lp') throw new Error('DSL: parenthèses déséquilibrées'); out.push(top); }
  return out;
}
interface Vars { SCORE: number; COEF: number; SAL_MENS: bigint; SAL_ANN: bigint }
function bind(name: string, v: Vars): Rational {
  if (name === 'SCORE') return numToRat(v.SCORE);
  if (name === 'COEF') return numToRat(v.COEF);
  if (name === 'SAL_MENS') return rat(v.SAL_MENS);
  if (name === 'SAL_ANN') return rat(v.SAL_ANN);
  throw new Error(`DSL: variable inconnue ${name}`);
}
/** Évalue le DSL → francs entiers (bigint). */
function evalFormule(dsl: string, v: Vars): bigint {
  const rpn = toRpn(tokenize(dsl)); const st: Rational[] = [];
  for (const tk of rpn) {
    if (tk.t === 'num') st.push(tk.v);
    else if (tk.t === 'var') st.push(bind(tk.v, v));
    else if (tk.t === 'op') { const b = st.pop(); const a = st.pop(); if (!a || !b) throw new Error('DSL: expression invalide'); st.push(tk.v === '+' ? rAdd(a, b) : tk.v === '-' ? rSub(a, b) : tk.v === '*' ? rMul(a, b) : rDiv(a, b)); }
  }
  if (st.length !== 1) throw new Error('DSL: expression invalide');
  return roundRat(st[0]);
}

/* ── Entrées / sortie ─────────────────────────────────────────────────────── */
type Mode = 'A_prorata' | 'B_plafonnee' | 'C_libre';
function normMode(m: string): Mode {
  if (m === 'A' || m === 'A_prorata') return 'A_prorata';
  if (m === 'B' || m === 'B_plafonnee') return 'B_plafonnee';
  if (m === 'C' || m === 'C_libre') return 'C_libre';
  throw new Error(`mode_bonus inconnu: ${m}`);
}
interface InputRow {
  employeId: string; salaireMensuel: number; coef: number;
  base?: 'SAL_MENS' | 'SAL_ANN'; formuleDsl?: string; scorePct: number;
  plafond?: number; plancher?: number; plafondBps?: number; plancherBps?: number;
}
const scoreFraction = (pct: number) => Math.max(0, pct) / 100;
function brut(r: InputRow): bigint {
  const salM = BigInt(Math.trunc(r.salaireMensuel));
  const salA = salM * 12n;
  if (r.formuleDsl) return evalFormule(r.formuleDsl, { SCORE: scoreFraction(r.scorePct), COEF: r.coef, SAL_MENS: salM, SAL_ANN: salA });
  const base = r.base === 'SAL_ANN' ? salA : salM;
  const bps = BigInt(Math.round(scoreFraction(r.scorePct) * r.coef * 10_000));
  // arrondi half-up de base*bps/10000
  const num = base * bps; return (num * 2n + 10_000n) / (2n * 10_000n);
}
function capPlafond(r: InputRow): bigint | undefined { if (r.plafond != null) return BigInt(Math.trunc(r.plafond)); if (r.plafondBps != null) { const a = BigInt(Math.trunc(r.salaireMensuel)) * 12n; const num = a * BigInt(r.plafondBps); return (num * 2n + 10_000n) / 20_000n; } return undefined; }
function capPlancher(r: InputRow): bigint | undefined { if (r.plancher != null) return BigInt(Math.trunc(r.plancher)); if (r.plancherBps != null) { const a = BigInt(Math.trunc(r.salaireMensuel)) * 12n; const num = a * BigInt(r.plancherBps); return (num * 2n + 10_000n) / 20_000n; } return undefined; }

interface Ligne { employeId: string; brut: bigint; final: bigint; borne?: 'plafond' | 'plancher' }

/** Mode A — prorata + réconciliation itérative des caps (§6.3). */
function repartA(env: bigint, items: { id: string; part: bigint; plafond?: bigint; plancher?: bigint }[]): { lignes: { id: string; montant: bigint; borne?: 'plafond' | 'plancher' }[]; reliquat: bigint } {
  const fixed = new Map<string, { val: bigint; borne: 'plafond' | 'plancher' }>();
  let remaining = [...items];
  for (let guard = 0; guard <= items.length; guard++) {
    const pool = remaining.reduce((s, it) => s + it.part, 0n);
    const budget = env - [...fixed.values()].reduce((s, f) => s + f.val, 0n);
    if (!remaining.length || pool <= 0n) break;
    const nf: { id: string; val: bigint; borne: 'plafond' | 'plancher' }[] = [];
    for (const it of remaining) {
      const raw = (budget * it.part) / pool;
      if (it.plafond != null && raw > it.plafond) nf.push({ id: it.id, val: it.plafond, borne: 'plafond' });
      else if (it.plancher != null && raw < it.plancher) nf.push({ id: it.id, val: it.plancher, borne: 'plancher' });
    }
    if (!nf.length) break;
    for (const f of nf) fixed.set(f.id, { val: f.val, borne: f.borne });
    remaining = remaining.filter((it) => !fixed.has(it.id));
  }
  const dist = new Map<string, bigint>();
  const pool = remaining.reduce((s, it) => s + it.part, 0n);
  const budget = env - [...fixed.values()].reduce((s, f) => s + f.val, 0n);
  if (remaining.length && pool > 0n) {
    const calc = remaining.map((it) => { const num = budget * it.part; const fl = num / pool; return { id: it.id, fl, reste: num - fl * pool, part: it.part, plafond: it.plafond }; });
    for (const c of calc) dist.set(c.id, c.fl);
    let leftover = budget - calc.reduce((s, c) => s + c.fl, 0n);
    const ord = [...calc].sort((a, b) => (b.reste !== a.reste ? (b.reste > a.reste ? 1 : -1) : b.part > a.part ? 1 : b.part < a.part ? -1 : 0));
    let idx = 0;
    while (leftover > 0n && ord.length) { const c = ord[idx % ord.length]; const cur = dist.get(c.id) ?? 0n; if (c.plafond == null || cur + 1n <= c.plafond) { dist.set(c.id, cur + 1n); leftover -= 1n; } idx++; if (idx > ord.length * 4 && leftover > 0n) break; }
  }
  const lignes = items.map((it) => { const f = fixed.get(it.id); return f ? { id: it.id, montant: f.val, borne: f.borne } : { id: it.id, montant: dist.get(it.id) ?? 0n }; });
  const total = lignes.reduce((s, l) => s + l.montant, 0n);
  return { lignes, reliquat: env - total };
}
function bornes(montant: bigint, r: InputRow): { value: bigint; borne?: 'plafond' | 'plancher' } {
  let value = montant; let borne: 'plafond' | 'plancher' | undefined;
  const cap = capPlafond(r); const fl = capPlancher(r);
  if (cap != null && value > cap) { value = cap; borne = 'plafond'; }
  if (fl != null && fl > value) { value = fl; borne = 'plancher'; }
  return { value, borne };
}

interface Repartition { mode: Mode; lignes: Ligne[]; total: bigint; enveloppe: bigint; depassement: boolean; reliquat: bigint }
function repartition(inputs: InputRow[], envMontant: bigint, mode: Mode): Repartition {
  const bruts = inputs.map((r) => ({ id: r.employeId, brut: brut(r), row: r }));
  if (mode === 'A_prorata') {
    const { lignes, reliquat } = repartA(envMontant, bruts.map((b) => ({ id: b.id, part: b.brut, plafond: capPlafond(b.row), plancher: capPlancher(b.row) })));
    const by = new Map(lignes.map((l) => [l.id, l]));
    const out: Ligne[] = bruts.map((b) => { const l = by.get(b.id); return { employeId: b.id, brut: b.brut, final: l?.montant ?? 0n, borne: l?.borne }; });
    return { mode, lignes: out, total: out.reduce((s, l) => s + l.final, 0n), enveloppe: envMontant, depassement: false, reliquat };
  }
  const out: Ligne[] = bruts.map((b) => { const { value, borne } = bornes(b.brut, b.row); return { employeId: b.id, brut: b.brut, final: value, borne }; });
  const total = out.reduce((s, l) => s + l.final, 0n);
  return { mode, lignes: out, total, enveloppe: envMontant, depassement: mode === 'B_plafonnee' && total > envMontant, reliquat: mode === 'B_plafonnee' ? 0n : envMontant - total };
}

/* ── Handler ──────────────────────────────────────────────────────────────── */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const caller = await resolveCaller(req);
    if (!caller) return json({ status: 'error', message: 'Non authentifié' }, 401);
    if (!isHrOrAdmin(caller)) return json({ status: 'error', message: 'Réservé RH/admin' }, 403);

    const body = await req.json();
    const action = body.action === 'calcul' ? 'calcul' : 'simulate';
    const currency = (body.currency ?? 'XOF') as Currency;
    const mode = normMode(body.enveloppe?.mode ?? 'A_prorata');
    const envMontant = BigInt(body.enveloppe?.montant ?? 0);
    const inputs = (body.inputs ?? []) as InputRow[];
    if (!Array.isArray(inputs) || inputs.length === 0) return json({ status: 'error', message: 'inputs requis' }, 400);

    const rep = repartition(inputs, envMontant, mode);
    const lignes = rep.lignes.map((l) => ({
      employeId: l.employeId,
      brut: Money.of(l.brut, currency).toJSON(),
      final: Money.of(l.final, currency).toJSON(),
      borne: l.borne ?? null,
    }));
    const payload = {
      mode: rep.mode,
      total: Money.of(rep.total, currency).toJSON(),
      enveloppe: Money.of(rep.enveloppe, currency).toJSON(),
      reliquat: Money.of(rep.reliquat, currency).toJSON(),
      depassement: rep.depassement,
      lignes,
    };

    if (action === 'simulate') return json({ status: 'ok', simulation: true, ...payload });

    // action === 'calcul' : persiste les calculs (statut 'calcule', gating R6).
    const enveloppeId = body.enveloppe?.id as string | undefined;
    if (!enveloppeId) return json({ status: 'error', message: 'enveloppe.id requis pour calcul' }, 400);
    const svc = serviceClient();
    const rows = rep.lignes.map((l, i) => ({
      tenant_id: caller.tenantId,
      enveloppe_id: enveloppeId,
      employe_id: l.employeId,
      campagne_id: body.campagneId ?? null,
      score_source: inputs[i]?.scorePct ?? null,
      part: l.brut.toString(),
      brut: l.brut.toString(),
      final: l.final.toString(),
      borne: l.borne ?? null,
      formule_appliquee: inputs[i]?.formuleDsl ?? null,
      devise: currency,
      statut: 'calcule',
      visible_employe: false,
    }));
    const { error } = await svc.schema('atlas_people').from('bonus_calculs')
      .upsert(rows, { onConflict: 'enveloppe_id,employe_id' });
    if (error) return json({ status: 'error', message: error.message }, 500);

    return json({ status: 'ok', persisted: rows.length, ...payload });
  } catch (e) {
    return json({ status: 'error', message: String((e as Error).message ?? e) }, 400);
  }
});
