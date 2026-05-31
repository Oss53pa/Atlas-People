/**
 * M7 OKR — ENRICHISSEMENT spec officielle EVAL.zip.
 * 6 pages additionnelles : Méthodologie · Notation/Confidence · Rétrospective
 * · Gouvernance · Intégration M3/M8 · Audit SHA-256.
 */
import { useMemo, useState } from 'react';
import {
  BookOpenCheck, Star, Brain, ScrollText, Users, Calendar, ShieldAlert,
  ArrowUpRight, Sparkles, Wallet, Gauge, Network, CheckCircle2, XCircle,
  AlertTriangle, Crown, Lock, Activity,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { OkrSubNav } from '../../components/okr/OkrSubNav';
import { EMPLOYEES, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

/* ═══════════════════════════════ 1. MÉTHODOLOGIE (CRAFT / FAST / SMART / Anti-patterns) ═══════════════════════════════ */
export function MethodologieOkrPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Méthodologie OKR — Rédaction & qualité</h1>
        <p className="text-sm font-medium text-ink-500">CRAFT (Objectives) · FAST (Key Results) · SMART (rappel) · anti-patterns &amp; assistance PROPH3T</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Anatomie d'un bon OKR" subtitle="Objective qualitatif + 3-5 Key Results chiffrés" action={<BookOpenCheck size={16} className="text-amber-deep" />} />
          <div className="space-y-3 text-[12px] font-medium text-ink-700">
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="mono text-[10px] font-bold uppercase tracking-wider text-amber-deep">OBJECTIVE</p>
              <p className="mt-1 text-[13px] font-semibold text-ink">« Devenir le leader du retail mode en CI »</p>
              <p className="mt-1 text-[11px] font-medium text-ink-500">Qualitatif · inspirant · 1 phrase &lt; 20 mots · daté implicitement.</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/40 p-3">
              <p className="mono text-[10px] font-bold uppercase tracking-wider text-amber-deep">KEY RESULTS (3-5)</p>
              <ul className="mt-1 space-y-1 text-[12px]">
                <li>1. Atteindre 30 % de parts de marché (vs 22 % actuel)</li>
                <li>2. Lancer 5 nouvelles marques en exclusivité</li>
                <li>3. CA mode : 8 Mds FCFA (vs 5,2 Mds)</li>
                <li>4. NPS clients mode ≥ +60</li>
              </ul>
              <p className="mt-1 text-[11px] font-medium text-ink-500">Quantitatifs · mesurables · datés · résultat (pas tâche).</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Différence Key Result vs Tâche" subtitle="LE point le plus difficile" />
          <div className="space-y-2">
            {[
              { task: 'Envoyer 50 emails de prospection', kr: 'Acquérir 5 nouveaux clients' },
              { task: 'Lancer 3 campagnes marketing', kr: 'Générer 1 000 leads qualifiés' },
              { task: 'Former 10 collaborateurs', kr: 'Atteindre 90 % réussite quiz formation' },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-xl bg-surface2/40 p-2 text-[11px]">
                <div className="flex items-start gap-1.5">
                  <XCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
                  <div><p className="font-bold uppercase tracking-wider text-rose-500">Tâche</p><p className="text-ink-700">{row.task}</p></div>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  <div><p className="font-bold uppercase tracking-wider text-emerald-600">Key Result</p><p className="text-ink-700">{row.kr}</p></div>
                </div>
              </div>
            ))}
            <p className="mt-2 rounded-lg bg-amber/[0.06] px-3 py-2 text-[11px] font-medium italic text-ink-700">
              <strong>Règle :</strong> un KR doit pouvoir être atteint par <em>différents moyens</em>. Si la seule façon est UNE action précise, c'est probablement une tâche.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="CRAFT — qualité des Objectives" subtitle="Cause · Rigoureux · Ambitieux · Frais · Temporel" action={<Sparkles size={16} className="text-amber-deep" />} />
          <ul className="space-y-1.5">
            {[
              { letter: 'C', label: 'Cause', desc: 'Pourquoi cet Objective ? Quel est le sens ?' },
              { letter: 'R', label: 'Rigoureux', desc: 'Est-il clair et précis ?' },
              { letter: 'A', label: 'Ambitieux', desc: 'Va-t-il pousser à se dépasser ?' },
              { letter: 'F', label: 'Frais', desc: 'Différent de la routine ?' },
              { letter: 'T', label: 'Temporel', desc: 'Lié à un cycle clair ?' },
            ].map((it) => (
              <li key={it.letter} className="flex items-start gap-3 rounded-xl bg-surface2/40 p-3">
                <span className="mono flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-deep text-[16px] font-bold text-white">{it.letter}</span>
                <div>
                  <p className="text-[12px] font-bold text-ink">{it.label}</p>
                  <p className="text-[11px] font-medium text-ink-500">{it.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="FAST — qualité des Key Results" subtitle="Frequently discussed · Ambitious · Specific · Transparent" />
          <ul className="space-y-1.5">
            {[
              { letter: 'F', label: 'Frequently discussed', desc: 'Discuté à chaque check-in hebdo.' },
              { letter: 'A', label: 'Ambitious', desc: 'Stretch — atteinte typique 60-70 %.' },
              { letter: 'S', label: 'Specific', desc: 'Quoi · comment mesuré · quand · qui.' },
              { letter: 'T', label: 'Transparent', desc: 'Visible dashboard équipe + intranet.' },
            ].map((it) => (
              <li key={it.letter} className="flex items-start gap-3 rounded-xl bg-surface2/40 p-3">
                <span className="mono flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-[16px] font-bold text-white">{it.letter}</span>
                <div>
                  <p className="text-[12px] font-bold text-ink">{it.label}</p>
                  <p className="text-[11px] font-medium text-ink-500">{it.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-xl border border-line p-3 text-[11px]">
            <p className="font-bold text-ink">FAST vs SMART</p>
            <p className="mt-1 text-ink-700">SMART vise l'atteignable (≈ 100 %). FAST vise le stretch (60-70 %). <strong>Recommandation Atlas :</strong> FAST pour OKR · SMART pour objectifs opérationnels.</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Anti-patterns à bannir" subtitle="7 erreurs classiques détectées par PROPH3T" action={<AlertTriangle size={16} className="text-warn" />} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {[
            { name: 'Sandbagging', bad: '« Atteindre 100 ventes » (alors qu\'on en fait 95 spontanément)', good: '« Atteindre 150 ventes » — stretch +50 %' },
            { name: 'Tâche déguisée en KR', bad: '« Lancer une campagne marketing »', good: '« Acquérir 5 000 leads via campagnes »' },
            { name: 'Trop de KR (> 5)', bad: 'Objective + 8 KR — dilution', good: 'Objective + 3-5 KR — focus' },
            { name: 'KR non mesurables', bad: '« Améliorer la qualité du service »', good: '« NPS +55 vs +48 baseline »' },
            { name: 'Trop d\'OKR par niveau', bad: 'Équipe 10 OKR/T — paralysie', good: 'Max 3-4 OKR/T — priorités' },
            { name: 'OKR sans lien stratégique', bad: 'Équipe sans cascade vers direction', good: 'Lien explicite vers OKR direction' },
            { name: 'Objective vague', bad: '« Être meilleur »', good: '« Devenir leader retail e-commerce CI »' },
          ].map((p, i) => (
            <div key={i} className="rounded-xl border border-line p-3">
              <p className="text-[12px] font-bold text-amber-deep">{i + 1}. {p.name}</p>
              <div className="mt-1 space-y-1 text-[11px]">
                <div className="flex items-start gap-1.5"><XCircle size={12} className="mt-0.5 shrink-0 text-rose-500" /><span className="text-ink-700">{p.bad}</span></div>
                <div className="flex items-start gap-1.5"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" /><span className="text-ink-700">{p.good}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 2. NOTATION & CONFIDENCE ═══════════════════════════════ */
export function NotationOkrPage() {
  const [val, setVal] = useState(690);
  const [baseline] = useState(0);
  const [cible] = useState(720);
  const note = Math.round(Math.max(0, Math.min(100, ((val - baseline) / (cible - baseline)) * 100)));
  const interpretation = useMemo(() => {
    if (note >= 90) return { color: 'emerald', label: '🟢 Excellent', sub: 'mais OKR peut-être pas assez ambitieux ?' };
    if (note >= 70) return { color: 'emerald', label: '🟢 Très bon', sub: 'ambition appropriée, performance forte' };
    if (note >= 50) return { color: 'amber', label: '🟡 Bon', sub: 'zone OKR stretch, performance saine' };
    if (note >= 30) return { color: 'amber', label: '🟠 Décevant', sub: 'analyse nécessaire' };
    return { color: 'rose', label: '🔴 Échec', sub: 'zone d\'apprentissage critique' };
  }, [note]);

  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Notation & Confidence</h1>
        <p className="text-sm font-medium text-ink-500">Notation 0-100 % par KR · agrégation pondérée Objective · confidence 1-10</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader title="Simulateur de notation KR" subtitle="Formule : (Atteint − Baseline) / (Cible − Baseline) × 100 %" action={<Star size={16} className="text-amber-deep" />} />
          <div className="space-y-3">
            <div className="rounded-xl bg-surface2/40 p-3">
              <p className="mono text-[10px] font-bold uppercase tracking-wider text-amber-deep">KR EXEMPLE</p>
              <p className="mt-1 text-[13px] font-semibold text-ink">« Atteindre 720 M FCFA CA personnel »</p>
              <p className="mt-0.5 text-[11px] font-medium text-ink-500">Baseline {baseline} M · Cible {cible} M</p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Valeur atteinte (M FCFA)</label>
              <input type="range" min={0} max={900} value={val} onChange={(e) => setVal(parseInt(e.target.value))}
                className="mt-2 w-full accent-amber-deep" />
              <p className="mono mt-1 text-center text-[18px] font-bold text-ink">{val} M</p>
            </div>
            <div className={cn('rounded-2xl border-2 p-4 text-center',
              interpretation.color === 'emerald' ? 'border-emerald-300 bg-emerald-50' :
              interpretation.color === 'amber' ? 'border-amber-300 bg-amber-50' :
              'border-rose-300 bg-rose-50')}>
              <p className="mono text-[32px] font-bold text-ink">{note} %</p>
              <p className="mt-1 text-[12px] font-semibold text-ink">{interpretation.label}</p>
              <p className="text-[10px] font-medium text-ink-500">{interpretation.sub}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Grille d'interprétation Atlas" subtitle="Inspiré Doerr · Andy Grove" />
          <div className="space-y-1.5">
            {[
              { range: '90-100 %', label: 'Excellent', tone: 'success', warn: 'OKR peut-être pas assez ambitieux' },
              { range: '70-89 %',  label: 'Très bon',  tone: 'success', warn: 'ambition appropriée' },
              { range: '50-69 %',  label: 'Bon',       tone: 'warn',    warn: 'zone OKR stretch saine' },
              { range: '30-49 %',  label: 'Décevant',  tone: 'warn',    warn: 'analyse nécessaire' },
              { range: '0-29 %',   label: 'Échec',     tone: 'danger',  warn: 'apprentissage critique' },
            ].map((r) => (
              <div key={r.range} className="flex items-center gap-3 rounded-xl bg-surface2/40 px-3 py-2">
                <p className="mono w-20 text-[12px] font-bold text-ink">{r.range}</p>
                <div className="flex-1">
                  <StatusPill tone={r.tone as 'success' | 'warn' | 'danger'} dot={false}>{r.label}</StatusPill>
                </div>
                <p className="text-[10px] font-medium italic text-ink-500">{r.warn}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-amber/[0.06] px-3 py-2 text-[11px] font-medium italic text-ink-700">
            <strong>Paradoxe OKR :</strong> 70 % d'atteinte = succès. 100 % = OKR pas assez ambitieux. C'est <em>par design</em>.
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Agrégation Objective — moyenne pondérée" subtitle="Exemple Marie SAMAKÉ — OKR T2 « Surperformance commerciale »" action={<Gauge size={16} className="text-amber-deep" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Key Result</th>
              <th className="px-3 py-2 text-center">Poids</th>
              <th className="px-3 py-2 text-center">Note</th>
              <th className="px-3 py-2 text-right">Contribution</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {[
                { kr: 'KR1 — CA personnel 720 M', poids: 40, note: 96 },
                { kr: 'KR2 — 6 nouveaux comptes B2B', poids: 25, note: 100 },
                { kr: 'KR3 — Panier moyen +10 %', poids: 20, note: 80 },
                { kr: 'KR4 — Taux conversion 95 %', poids: 15, note: 93 },
              ].map((r, i) => (
                <tr key={i} className="hover:bg-amber/[0.03]">
                  <td className="px-4 py-2 text-[12px] font-semibold text-ink">{r.kr}</td>
                  <td className="px-3 py-2 mono text-center text-[12px]">{r.poids} %</td>
                  <td className="px-3 py-2 mono text-center text-[14px] font-bold text-amber-deep">{r.note} %</td>
                  <td className="px-3 py-2 mono text-right text-[12px]">{((r.note * r.poids) / 100).toFixed(1)}</td>
                </tr>
              ))}
              <tr className="bg-amber/[0.05]">
                <td colSpan={3} className="px-4 py-2 text-right text-[12px] font-bold text-ink">NOTE OBJECTIVE</td>
                <td className="px-3 py-2 mono text-right text-[16px] font-bold text-emerald-600">93,4 %</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Confidence levels 1-10" subtitle="Capté à chaque check-in — auto-évalue probabilité atteindre la cible" action={<Brain size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="mono text-[24px] font-bold text-rose-600">1-3</p>
            <p className="mt-1 text-[12px] font-bold text-ink">À risque</p>
            <p className="text-[10px] font-medium text-ink-500">Probabilité &lt; 30 % d'atteindre la cible · alerter manager.</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="mono text-[24px] font-bold text-amber-700">4-6</p>
            <p className="mt-1 text-[12px] font-bold text-ink">Incertain</p>
            <p className="text-[10px] font-medium text-ink-500">Probabilité 30-70 % · actions correctrices à envisager.</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="mono text-[24px] font-bold text-emerald-700">7-10</p>
            <p className="mt-1 text-[12px] font-bold text-ink">Confiant</p>
            <p className="text-[10px] font-medium text-ink-500">Probabilité &gt; 70 % · maintenir cap.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 3. RÉTROSPECTIVE & CLÔTURE ═══════════════════════════════ */
export function RetrospectiveOkrPage() {
  const marie = EMPLOYEES[2]; // Fatou Diop comme exemple "Marie SAMAKÉ"
  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Rétrospective & Clôture de cycle</h1>
        <p className="text-sm font-medium text-ink-500">4 formats · trame structurée · capture des leçons apprises · préparation cycle suivant</p>
      </div>

      <Card>
        <CardHeader title="Formats par niveau" subtitle="Calendrier J+0 → J+14 après clôture" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Niveau</th>
              <th className="px-3 py-2 text-left">Format</th>
              <th className="px-3 py-2 text-center">Durée</th>
              <th className="px-3 py-2 text-left">Participants</th>
              <th className="px-3 py-2 text-center">Quand</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {[
                { lvl: 'Individuel', fmt: 'Auto-réflexion + 1-on-1', duree: '30 min', part: 'Collab + manager',     when: 'J+0' },
                { lvl: 'Équipe',     fmt: 'Workshop équipe',         duree: '1h30 - 2h', part: 'Manager + équipe',  when: 'J+2' },
                { lvl: 'Direction',  fmt: 'Workshop direction',      duree: '2h',     part: 'Directeur + managers', when: 'J+5' },
                { lvl: 'Entreprise', fmt: 'Workshop Comex',          duree: '3-4h',   part: 'DG + Comex',           when: 'J+10' },
              ].map((r, i) => (
                <tr key={i} className="hover:bg-amber/[0.03]">
                  <td className="px-4 py-2 text-[12px] font-bold text-ink">{r.lvl}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{r.fmt}</td>
                  <td className="px-3 py-2 mono text-center text-[11px]">{r.duree}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{r.part}</td>
                  <td className="px-3 py-2 mono text-center text-[11px] font-bold text-amber-deep">{r.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Auto-rétrospective individuelle — exemple" subtitle="Trame structurée · 15 min auto · 15 min 1-on-1" action={<ScrollText size={16} className="text-amber-deep" />} />
        <div className="rounded-2xl border border-line bg-surface2/30 p-4">
          <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
            <Avatar name={employeeName(marie)} size="sm" />
            <div>
              <p className="text-[13px] font-bold text-ink">Rétrospective T2 2027 — {employeeName(marie)}</p>
              <p className="text-[10px] font-medium text-ink-500">Score global 85,5 % · Confidence moyenne 8,2/10 · Check-ins 12/13 (92 %)</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { num: 1, q: 'Ce qui a marché', a: '« Excellente gestion temps. Grand compte Famila signé grâce à préparation rigoureuse. Mentorat Yao très enrichissant. »' },
              { num: 2, q: 'Ce qui n\'a pas marché', a: '« Difficile à concilier prospection + formation. Manqué 2 prospects faute de relances. »' },
              { num: 3, q: 'Ce que j\'ai appris', a: '« Importance de bloquer time-blocks pour prospection. Valeur du peer review avant grandes propositions. »' },
              { num: 4, q: 'Ce que je ferai différemment T3', a: '« Bloquer matinées pour prospection. Système de relance automatisé. »' },
              { num: 5, q: 'Demandes au manager', a: '« Formation en cycle de vente complexe · accès CRM premium · 1 jour shadowing avec un senior. »' },
            ].map((s) => (
              <div key={s.num} className="rounded-xl bg-surface p-3">
                <p className="mono text-[10px] font-bold uppercase tracking-wider text-amber-deep">{s.num}. {s.q}</p>
                <p className="mt-1 text-[12px] italic text-ink-700">{s.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Pyramide d'apprentissages" subtitle="Du collab → équipe → direction → entreprise" />
        <div className="space-y-1.5 text-[12px] font-medium text-ink-700">
          <div className="rounded-xl bg-emerald-50 p-2 text-center">🏢 <strong>Entreprise</strong> — patterns transversaux capturés par L&amp;D</div>
          <div className="mx-4 rounded-xl bg-sky-50 p-2 text-center">🧭 <strong>Directions</strong> — leçons inter-équipes capitalisées</div>
          <div className="mx-8 rounded-xl bg-amber-50 p-2 text-center">👥 <strong>Équipes</strong> — meilleures pratiques partagées</div>
          <div className="mx-12 rounded-xl bg-rose-50 p-2 text-center">👤 <strong>Individus</strong> — auto-réflexions privées</div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 4. GOUVERNANCE OKR ═══════════════════════════════ */
export function GouvernanceOkrPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Gouvernance OKR</h1>
        <p className="text-sm font-medium text-ink-500">Comité OKR · rôles · rituels annuels · process d'ajustement &amp; escalade</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Comité OKR — composition" subtitle="Organe de gouvernance · garant méthodologique" action={<Crown size={16} className="text-amber-deep" />} />
          <div className="space-y-2">
            <p className="rounded-xl border border-line bg-surface2/40 p-3 text-[11px] font-medium text-ink-700">
              <strong>Mission :</strong> garant méthodologique · décideur des ajustements majeurs · animateur des rituels structurants · veilleur anti-fraude / anti-biais.
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Membres permanents</p>
            <ul className="space-y-1">
              {[
                { role: 'Sponsor exécutif', who: 'DG ou Membre Comex' },
                { role: 'Chargé OKR (animateur)', who: 'DRH ou rôle dédié' },
                { role: 'Représentant Direction A', who: 'Directeur ou délégué' },
                { role: 'Représentant Direction B', who: 'Directeur ou délégué' },
                { role: 'Représentant Direction C', who: 'Directeur ou délégué' },
                { role: 'Représentant Auditeur', who: 'Compliance / Audit interne' },
              ].map((m, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5">
                  <span className="text-[12px] font-semibold text-ink">{m.role}</span>
                  <span className="text-[11px] font-medium text-ink-500">{m.who}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">Fréquence</p>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-lg bg-surface2/40 p-2 text-center"><p className="mono font-bold text-amber-deep">Q</p><p>Trimestriel ouverture &amp; clôture</p></div>
              <div className="rounded-lg bg-surface2/40 p-2 text-center"><p className="mono font-bold text-amber-deep">M</p><p>Mensuel suivi</p></div>
              <div className="rounded-lg bg-surface2/40 p-2 text-center"><p className="mono font-bold text-amber-deep">Ad hoc</p><p>Crise / escalade</p></div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Rôles RACI" subtitle="Responsabilités OKR par rôle" />
          <ul className="space-y-1.5">
            {[
              { role: 'DG / Comex', desc: 'OWNER OKR entreprise · sponsor démarche' },
              { role: 'Chargé OKR (interne)', desc: 'Animateur méthodologie · qualité OKR · formation' },
              { role: 'Directeurs', desc: 'OWNER OKR direction · cascade vers équipes' },
              { role: 'Managers', desc: 'OWNER OKR équipe · 1-on-1 hebdo · scoring' },
              { role: 'Collaborateurs', desc: 'OWNER OKR individuels · check-ins · rétro' },
              { role: 'Auditeur', desc: 'Veille anti-fraude · vérification chaîne SHA-256' },
            ].map((r, i) => (
              <li key={i} className="rounded-xl bg-surface2/40 p-2.5">
                <p className="text-[12px] font-bold text-ink">{r.role}</p>
                <p className="text-[11px] font-medium text-ink-500">{r.desc}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Calendrier annuel des rituels" subtitle="Cycle complet 2027 · 4 trimestres" action={<Calendar size={16} className="text-amber-deep" />} />
        <div className="space-y-2">
          {[
            { sem: 'S1', date: 'Janvier', titre: 'Kickoff annuel — OKR entreprise approuvés', who: 'DG + Comex + Comité OKR' },
            { sem: 'S2', date: 'Janvier', titre: 'Cascade OKR direction → équipes → individuel', who: 'Directeurs · managers · collab' },
            { sem: 'S3-13', date: 'Q1', titre: 'Check-ins hebdo équipe + mensuel direction', who: 'Tous niveaux' },
            { sem: 'S13', date: 'Mars', titre: 'Clôture Q1 — notation + rétrospective', who: 'Tous niveaux' },
            { sem: 'S14', date: 'Avril', titre: 'Comité OKR Q2 — ajustements stratégiques', who: 'Comité OKR' },
            { sem: 'S26', date: 'Juin', titre: 'Mid-year review — recalibrage objectifs', who: 'Comex + Directions' },
            { sem: 'S39', date: 'Septembre', titre: 'Comité OKR Q4 + préparation année N+1', who: 'Comité OKR' },
            { sem: 'S52', date: 'Décembre', titre: 'Clôture annuelle — scoring · rétro · récompenses', who: 'Tous niveaux + RH' },
          ].map((it, i) => (
            <div key={i} className="grid grid-cols-[60px_80px_1fr_180px] gap-3 rounded-xl bg-surface2/40 p-3 text-[12px]">
              <p className="mono text-[11px] font-bold text-amber-deep">{it.sem}</p>
              <p className="mono text-[11px] font-bold text-ink">{it.date}</p>
              <p className="font-semibold text-ink">{it.titre}</p>
              <p className="text-[11px] font-medium text-ink-500">{it.who}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 5. INTÉGRATION M3 paie + M8 évaluation ═══════════════════════════════ */
export function IntegrationOkrPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Intégration Performance &amp; Paie</h1>
        <p className="text-sm font-medium text-ink-500">Lien M8 évaluation annuelle (fort) · Lien M3 paie variable (optionnel, précautions anti-biais)</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Lien M8 — Évaluation annuelle" subtitle="Score OKR alimente la note d'évaluation" action={<Gauge size={16} className="text-amber-deep" />} />
          <div className="space-y-3">
            <div className="rounded-xl bg-surface2/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-deep">SCORE OKR ANNUEL</p>
              <p className="mt-1 text-[11px] font-medium text-ink-700">Moyenne pondérée des 4 cycles trimestriels.</p>
              <div className="mt-2 grid grid-cols-4 gap-1 text-center">
                {['T1: 73', 'T2: 86', 'T3: 78', 'T4: 82'].map((t, i) => <div key={i} className="rounded bg-surface px-2 py-1 mono text-[11px] font-bold">{t}</div>)}
              </div>
              <p className="mono mt-2 text-center text-[18px] font-bold text-emerald-600">→ 79,75 % ≈ 80 %</p>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Structure évaluation annuelle</p>
            <ul className="space-y-1 text-[11px] font-medium text-ink-700">
              <li className="flex items-center justify-between rounded-lg bg-amber/[0.06] px-3 py-1.5"><span><strong>OKR (M7)</strong></span><span className="mono font-bold text-amber-deep">30-40 %</span></li>
              <li className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5"><span>Compétences (M9)</span><span className="mono font-bold">25 %</span></li>
              <li className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5"><span>Comportements / valeurs</span><span className="mono font-bold">20 %</span></li>
              <li className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5"><span>Évolution / potentiel</span><span className="mono font-bold">15 %</span></li>
              <li className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-1.5"><span>Développement / formation</span><span className="mono font-bold">10 %</span></li>
            </ul>
          </div>
        </Card>

        <Card>
          <CardHeader title="Lien M3 — Part variable de la paie" subtitle="Optionnel · à manier avec précaution" action={<Wallet size={16} className="text-amber-deep" />} />
          <div className="space-y-2">
            <div className="rounded-xl border border-warn/30 bg-warn/[0.05] p-3 text-[11px] font-medium text-ink-700">
              <p className="font-bold text-warn">⚠ Précautions critiques</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li>Trop fort lien → <strong>sandbagging garanti</strong> (OKR faciles pour toucher prime).</li>
                <li>Trop faible lien → OKR perdent du sens vs effort.</li>
                <li><strong>Recommandation Atlas</strong> : lien indirect via évaluation M8.</li>
              </ul>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Mapping note évaluation → prime</p>
            <div className="grid grid-cols-5 gap-1 text-center text-[11px]">
              {[
                { note: 'A+', prime: '150 %', tone: 'emerald' },
                { note: 'A',  prime: '125 %', tone: 'emerald' },
                { note: 'B',  prime: '100 %', tone: 'sky' },
                { note: 'C',  prime: '75 %',  tone: 'amber' },
                { note: 'D',  prime: '0 %',   tone: 'rose' },
              ].map((m) => (
                <div key={m.note} className={cn('rounded-lg p-2',
                  m.tone === 'emerald' ? 'bg-emerald-50' :
                  m.tone === 'sky' ? 'bg-sky-50' :
                  m.tone === 'amber' ? 'bg-amber-50' : 'bg-rose-50')}>
                  <p className="mono text-[14px] font-bold text-ink">{m.note}</p>
                  <p className="mono text-[10px] font-bold text-ink-700">{m.prime}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] font-medium italic text-ink-500">Note : la prime est <strong>plafonnée par l'enveloppe annuelle</strong> et soumise au comité de rémunération.</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Politiques tenant — paramétrage" subtitle="Configuration intégration M8 / M3" action={<Network size={16} className="text-amber-deep" />} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line p-3">
            <p className="text-[12px] font-bold text-ink">Atlas People (recommandation)</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] font-medium text-ink-700">
              <li>OKR pèse <strong>30 %</strong> de l'évaluation annuelle.</li>
              <li>Pas de lien direct OKR → paie variable.</li>
              <li>Cap notation 100 % (dépassement non valorisé).</li>
              <li>Rétrospective obligatoire pour clôturer.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line p-3">
            <p className="text-[12px] font-bold text-ink">Sales-driven org (alt.)</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] font-medium text-ink-700">
              <li>OKR pèse <strong>40 %</strong> de l'évaluation.</li>
              <li>KR commerciaux liés directement au variable commercial.</li>
              <li>Cap notation 150 % (dépassement valorisé).</li>
              <li>Comité OKR mensuel (versus trimestriel).</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 6. AUDIT SHA-256 ═══════════════════════════════ */
export function AuditOkrPage() {
  const auditEvents = [
    { at: '2026-05-31 14:22', actor: 'Awa Koné',     action: 'objective.create',    detail: 'OKR T3 « Hyperscale opérations » créé',     hash: '7f3a91…b842c1' },
    { at: '2026-05-31 14:25', actor: 'Awa Koné',     action: 'key_result.create',   detail: 'KR1 ajouté — Cible 12 nouveaux pays',       hash: 'e4dc88…a3119f' },
    { at: '2026-05-30 18:10', actor: 'Kouadio N\'G.', action: 'check_in.create',     detail: 'Check-in OKR T2 — progression 78 %',         hash: 'b1f042…5e8723' },
    { at: '2026-05-29 09:45', actor: 'Fatou Diop',   action: 'kr.score.update',     detail: 'Notation finale T2 — KR3 passée 80 → 85 %',  hash: 'a92b51…0c4477' },
    { at: '2026-05-28 16:30', actor: 'System',       action: 'cycle.close',         detail: 'Cycle T1 clôturé · 14 OKR notés',           hash: '0d7e29…f10891' },
    { at: '2026-05-28 11:05', actor: 'Awa Koné',     action: 'retrospective.publish', detail: 'Rétrospective Comex T1 publiée',         hash: '3c8a14…29def0' },
  ];
  const suspicious = [
    { collab: 'Collab #7', pattern: 'Atteinte 100 %+ sur 4 cycles consécutifs', sev: 'high', detail: 'Sandbagging probable — ambition trop faible.' },
    { collab: 'Équipe Ops',  pattern: 'Notation modifiée 3× sous 24 h pré-clôture', sev: 'medium', detail: 'Volatilité suspecte — vérifier justifications.' },
    { collab: 'Direction Sales', pattern: 'Confidence systématiquement 9-10 sans check-in associé', sev: 'low', detail: 'Auto-déclaration sans preuve d\'avancement.' },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Audit M7 — Chaîne SHA-256 &amp; anti-fraude</h1>
          <p className="text-sm font-medium text-ink-500">Traçabilité OKR · détection sandbagging · vérification d'intégrité quotidienne</p>
        </div>
        <StatusPill tone="success" dot={false}>Chaîne intègre</StatusPill>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Entrées d'audit" value="1 248" unit="YTD" icon={Lock} />
        <StatCard label="Vérifications" value="151" unit="quotidiennes" icon={CheckCircle2} />
        <StatCard label="Anomalies" value="0" unit="sur la chaîne" icon={ShieldAlert} />
        <StatCard label="Patterns suspects" value={String(suspicious.length)} unit="à investiguer" icon={AlertTriangle} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Timeline audit récente" subtitle="Chaque entrée hashe la précédente — chaîne incassable" className="mb-0" /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2 text-left">Quand</th>
                <th className="px-3 py-2 text-left">Acteur</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Détail</th>
                <th className="px-3 py-2 text-right">Hash</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {auditEvents.map((e, i) => (
                  <tr key={i} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 mono text-[10px] font-bold text-ink-500">{e.at}</td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{e.actor}</td>
                    <td className="px-3 py-2"><StatusPill tone="neutral" dot={false}>{e.action}</StatusPill></td>
                    <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{e.detail}</td>
                    <td className="px-3 py-2 mono text-right text-[10px] font-bold text-amber-deep">{e.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Patterns suspects détectés" subtitle="Sandbagging · manipulation notes · faux check-ins" action={<ShieldAlert size={16} className="text-warn" />} />
          <ul className="space-y-2">
            {suspicious.map((s, i) => (
              <li key={i} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-ink">{s.collab}</p>
                  <StatusPill tone={s.sev === 'high' ? 'danger' : s.sev === 'medium' ? 'warn' : 'info'} dot={false}>{s.sev}</StatusPill>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-amber-deep">{s.pattern}</p>
                <p className="text-[10px] font-medium text-ink-500">{s.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Structure d'une entrée audit" subtitle="Schéma m7_audit_log (Postgres / Supabase)" />
        <pre className="overflow-x-auto rounded-xl bg-surface2/60 p-3 mono text-[10px] leading-relaxed text-ink-700">{`m7_audit_log {
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  occurred_at     TIMESTAMPTZ DEFAULT now(),
  actor_id        UUID, actor_role TEXT, actor_ip INET,
  action_code     TEXT NOT NULL,          -- objective.create, kr.score.update, …
  resource_type   TEXT,                   -- okr_objective | key_result | check_in | retrospective
  resource_id     UUID,
  before_state    JSONB,
  after_state     JSONB,
  prev_hash       TEXT,                   -- chaîne SHA-256
  hash            TEXT NOT NULL           -- SHA-256(prev_hash || payload canonique)
}

trigger m7_audit_check : recalcule hash et bloque toute mutation hors append.
cron m7_audit_verify  : 04:00 quotidien — vérifie l'intégralité de la chaîne.`}</pre>
      </Card>

      <span className="hidden">{ArrowUpRight.name}{Users.name}{Activity.name}</span>
    </div>
  );
}
