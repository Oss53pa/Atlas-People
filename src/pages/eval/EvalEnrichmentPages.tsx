/**
 * M8 ÉVALUATIONS — ENRICHISSEMENT spec officielle COMPETENCES.zip.
 * 6 pages additionnelles : Cycle annuel · Grille 5 dim · Calibration 3 niveaux
 * · Notation finale ABCD · Équité H/F anti-biais · Audit SHA-256.
 */
import { useMemo, useState } from 'react';
import {
  Calendar, Layers, Scale, Award, Shield, ShieldAlert, AlertCircle,
  CheckCircle2, TrendingUp, TrendingDown, Users, Sparkles, Lock,
  ArrowRight, Eye, Heart,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { EvalSubNav } from '../../components/eval/EvalSubNav';
import { EMPLOYEES, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

/* ═══════════════════════════════ 1. CYCLE ANNUEL ═══════════════════════════════ */
export function CycleAnnuelEvalPage() {
  const phases = [
    { num: 1, name: 'Préparation',                weeks: 'S35-36 · 2 sem', period: 'Sept N',     actor: 'Chargé Performance', desc: 'Configurer cycle · compiler données · communiquer · former managers.', tone: 'neutral' as const },
    { num: 2, name: 'Auto-évaluation',            weeks: 'S40-42 · 3 sem', period: 'Oct N',      actor: 'Collaborateur',      desc: 'Auto-réflexion structurée · forces · axes développement · livrables.', tone: 'info' as const },
    { num: 3, name: 'Évaluation manager + 360°',  weeks: 'S43-45 · 3 sem', period: 'Nov N',      actor: 'Manager + Pairs',    desc: 'Factualisation · preuves · feedback peers/transverse/N-1.', tone: 'info' as const },
    { num: 4, name: 'Calibration',                weeks: 'S46-47 · 2 sem', period: 'Nov N',      actor: 'Directeurs + DRH',   desc: '3 niveaux : équipe → direction → entreprise · anti-biais.', tone: 'warn' as const },
    { num: 5, name: 'Entretiens annuels',         weeks: 'S48-51 · 4 sem', period: 'Déc N',      actor: 'Manager',            desc: 'Trame structurée · restitution · plan dev · signature.', tone: 'success' as const },
    { num: 6, name: 'Finalisation',               weeks: 'S52 · 1 sem',    period: 'Déc N',      actor: 'DRH + DAF',          desc: 'Notation finale · archivage · alimentation paie variable Janv N+1.', tone: 'success' as const },
  ];
  const sync = [
    { cycle: 'M8 Évaluations', period: 'Sept → Déc N',  alimente: '— (cycle parent)' },
    { cycle: 'M7 OKR annuel',  period: 'Janv → Déc N',  alimente: 'Dimension 1 atteinte OKR (35 %)' },
    { cycle: 'M3 Paie',        period: 'Janv → Déc N',  alimente: 'Augmentations + variable Janv N+1' },
    { cycle: 'Budget',         period: 'Sept → Nov N',  alimente: 'Enveloppe augmentations / promotions' },
    { cycle: 'Stratégie',      period: 'Oct → Déc N',   alimente: 'Définition OKR N+1' },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Cycle annuel d'évaluation</h1>
        <p className="text-sm font-medium text-ink-500">6 phases · Sept N → Déc N · ~15 semaines · synchronisé avec OKR · Paie · Budget</p>
      </div>

      <Card>
        <CardHeader title="Vue d'ensemble du cycle" subtitle="Septembre N → Décembre N · ~3,5 mois" action={<Calendar size={16} className="text-amber-deep" />} />
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {phases.map((p) => (
            <div key={p.num} className="flex shrink-0 items-center gap-1">
              <div className={cn('rounded-xl border-2 p-3 text-center w-44',
                p.tone === 'warn' ? 'border-amber-300 bg-amber-50/40' :
                p.tone === 'success' ? 'border-emerald-300 bg-emerald-50/40' :
                p.tone === 'info' ? 'border-sky-300 bg-sky-50/40' :
                'border-line bg-surface2/40')}>
                <p className="mono text-[10px] font-bold uppercase tracking-wider text-amber-deep">Phase {p.num}</p>
                <p className="mt-1 text-[12px] font-bold text-ink">{p.name}</p>
                <p className="text-[10px] font-medium text-ink-500">{p.weeks}</p>
              </div>
              {p.num < phases.length && <ArrowRight size={16} className="shrink-0 text-amber-deep" />}
            </div>
          ))}
        </div>
      </Card>

      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Détail des phases" subtitle="Acteurs clés + livrables par phase" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Phase</th>
              <th className="px-3 py-2 text-center">Semaines</th>
              <th className="px-3 py-2 text-left">Acteur clé</th>
              <th className="px-3 py-2 text-left">Description</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {phases.map((p) => (
                <tr key={p.num} className="hover:bg-amber/[0.03]">
                  <td className="px-4 py-2"><p className="mono text-[10px] font-bold text-amber-deep">{p.num}</p><p className="text-[12px] font-semibold text-ink">{p.name}</p></td>
                  <td className="px-3 py-2 mono text-center text-[11px]">{p.weeks}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{p.actor}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-500">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Synchronisation cross-cycles" subtitle="M8 alimente paie + déclenche OKR N+1" action={<TrendingUp size={16} className="text-amber-deep" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Cycle</th>
              <th className="px-3 py-2 text-left">Période</th>
              <th className="px-3 py-2 text-left">Alimente</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {sync.map((s) => (
                <tr key={s.cycle} className="hover:bg-amber/[0.03]">
                  <td className="px-3 py-2 text-[12px] font-bold text-ink">{s.cycle}</td>
                  <td className="px-3 py-2 mono text-[11px] text-ink-700">{s.period}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-500">{s.alimente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 2. GRILLE 5 DIMENSIONS ═══════════════════════════════ */
export function GrilleEvaluationPage() {
  const dimensions = [
    { num: 1, name: 'Atteinte OKR',              weight: 35, color: 'amber-deep',  source: 'M7 OKR · moyenne 4 cycles',
      criteria: [
        { name: 'Score OKR annuel',     w: 60, src: 'M7 · ≥85% → 5/5 · 70-84 → 4 · 55-69 → 3 · 40-54 → 2 · <40 → 1' },
        { name: 'Qualité du suivi',     w: 15, src: 'Manager · check-ins hebdo · confidence sincère' },
        { name: 'Ambition des OKR',     w: 15, src: 'Manager + Chargé OKR · pas de sandbagging détecté' },
        { name: 'Impact équipe',        w: 10, src: 'Manager + peers · collaboration cross' },
      ] },
    { num: 2, name: 'Compétences',               weight: 25, color: 'sky-600',     source: 'M9 cartographie · 6-10 sous-critères',
      criteria: [
        { name: 'Compétences techniques', w: 50, src: 'M9 · maîtrise + progression' },
        { name: 'Compétences métier',     w: 30, src: 'Manager · domain expertise' },
        { name: 'Acquisition nouvelles',  w: 20, src: 'M11 · formations + certifications' },
      ] },
    { num: 3, name: 'Comportements / Valeurs',    weight: 20, color: 'emerald-600', source: '5 valeurs entreprise Atlas',
      criteria: [
        { name: 'Intégrité',              w: 25, src: 'Auto + manager + 360°' },
        { name: 'Collaboration',          w: 25, src: '360° peers' },
        { name: 'Excellence',             w: 20, src: 'Manager · livrables' },
        { name: 'Bienveillance',          w: 15, src: '360° N-1 si applicable' },
        { name: 'Innovation',             w: 15, src: 'Manager · initiatives' },
      ] },
    { num: 4, name: 'Évolution / Potentiel',      weight: 12, color: 'fuchsia-600', source: 'Manager + DRH',
      criteria: [
        { name: 'Progression vs N-1',     w: 35, src: 'Manager · trajectoire' },
        { name: 'Potentiel de prise de poste', w: 30, src: 'DRH + Manager' },
        { name: 'Agilité d\'apprentissage', w: 20, src: 'Manager + 360°' },
        { name: 'Aspirations explicitées', w: 15, src: 'Entretien annuel' },
      ] },
    { num: 5, name: 'Développement personnel',    weight: 8, color: 'rose-600',    source: 'M11 Formation + auto',
      criteria: [
        { name: 'Plan dev N réalisé',     w: 40, src: 'M11 · taux complétion' },
        { name: 'Initiatives apprentissage', w: 30, src: 'Auto-déclaratif' },
        { name: 'Partage de savoir',      w: 20, src: 'Manager · mentorat · KB' },
        { name: 'Engagement RH',          w: 10, src: 'Manager · participation rituels' },
      ] },
  ];
  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);

  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Grille d'évaluation — 5 dimensions</h1>
        <p className="text-sm font-medium text-ink-500">Cadre méthodologique pondéré · standardisé · ancrages comportementaux · adaptable par profil</p>
      </div>

      <Card>
        <CardHeader title="Pondération des 5 dimensions" subtitle={`Total : ${totalWeight} %`} action={<Layers size={16} className="text-amber-deep" />} />
        <div className="space-y-2">
          {dimensions.map((d) => (
            <div key={d.num}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ink">{d.num}. {d.name}</span>
                <span className="mono text-[14px] font-bold text-amber-deep">{d.weight} %</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-amber-deep" style={{ width: `${d.weight * 2}%` }} />
              </div>
              <p className="mt-1 text-[10px] font-medium italic text-ink-500">{d.source}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {dimensions.map((d) => (
          <Card key={d.num}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="mono text-[10px] font-bold uppercase tracking-wider text-amber-deep">Dimension {d.num}</p>
                <h3 className="text-[14px] font-semibold text-ink">{d.name}</h3>
              </div>
              <span className="mono rounded-full bg-amber/12 px-3 py-1 text-[14px] font-bold text-amber-deep">{d.weight} %</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {d.criteria.map((c, i) => (
                <div key={i} className="rounded-lg bg-surface2/40 p-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-ink">{c.name}</p>
                    <span className="mono text-[11px] font-bold text-amber-deep">{c.w} %</span>
                  </div>
                  <p className="text-[10px] font-medium italic text-ink-500">{c.src}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Échelle d'évaluation 1-5 (ancrages)" subtitle="Standardisée pour tous évaluateurs" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
          {[
            { score: 5, label: 'Exceptionnel',        tone: 'success', desc: 'Dépasse largement les attentes · niveau référence' },
            { score: 4, label: 'Au-dessus attentes',  tone: 'success', desc: 'Solide performance · constance' },
            { score: 3, label: 'Conforme attentes',   tone: 'info',    desc: 'Atteint le niveau attendu du poste' },
            { score: 2, label: 'Partiellement',       tone: 'warn',    desc: 'Quelques gaps · plan dev requis' },
            { score: 1, label: 'Insuffisant',         tone: 'danger',  desc: 'Écart critique · plan accompagnement' },
          ].map((s) => (
            <div key={s.score} className={cn('rounded-xl border-2 p-3 text-center',
              s.tone === 'success' ? 'border-emerald-300 bg-emerald-50/40' :
              s.tone === 'info'    ? 'border-sky-300 bg-sky-50/40' :
              s.tone === 'warn'    ? 'border-amber-300 bg-amber-50/40' :
                                     'border-rose-300 bg-rose-50/40')}>
              <p className="mono text-[28px] font-bold text-ink">{s.score}</p>
              <p className="text-[12px] font-bold text-ink">{s.label}</p>
              <p className="mt-1 text-[10px] font-medium text-ink-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 3. CALIBRATION ═══════════════════════════════ */
export function CalibrationEvalPage() {
  const levels = [
    { lvl: 1, name: 'Calibration équipe',     who: 'Manager seul (+ RRH si besoin)',         when: 'S46 · mi-nov.', duration: '30-60 min', enjeu: 'Cohérence entre membres équipe' },
    { lvl: 2, name: 'Calibration direction',  who: 'Directeur + tous managers + RRH',        when: 'S47 · fin nov.', duration: '3-4 h workshop', enjeu: 'Cohérence inter-équipes' },
    { lvl: 3, name: 'Calibration entreprise', who: 'DG + Comex + DRH + Chargé Performance',  when: 'S48 · début déc.', duration: '4-6 h workshop', enjeu: 'Cohérence globale + équité' },
  ];
  const distribution = [
    { class: 'A — Exceptionnel',          target: 10, color: 'emerald-500' },
    { class: 'B — Au-dessus attentes',    target: 25, color: 'emerald-400' },
    { class: 'C — Conforme attentes',     target: 45, color: 'sky-500' },
    { class: 'D — Plan dev requis',       target: 15, color: 'amber-500' },
    { class: 'E — Accompagnement critique', target: 5, color: 'rose-500' },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Calibration — 3 niveaux</h1>
        <p className="text-sm font-medium text-ink-500">Étape la plus critique du cycle · cohérence transverse · anti-biais · distribution équitable</p>
      </div>

      <Card>
        <CardHeader title="Pourquoi la calibration est cruciale" subtitle="Sans elle : managers stricts désavantagent · indulgents avantagent · biais non détectés" action={<Scale size={16} className="text-amber-deep" />} />
        <ul className="grid grid-cols-1 gap-1.5 text-[11px] font-medium text-ink-700 md:grid-cols-2">
          <li className="flex items-start gap-1.5"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" /> <span><strong>Cohérence transverse</strong> — mêmes critères appliqués partout</span></li>
          <li className="flex items-start gap-1.5"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" /> <span><strong>Anti-biais</strong> — détection patterns discriminants</span></li>
          <li className="flex items-start gap-1.5"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" /> <span><strong>Distribution équilibrée</strong> — pas tous A ou tous C</span></li>
          <li className="flex items-start gap-1.5"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" /> <span><strong>Justice</strong> — performances équivalentes = notes équivalentes</span></li>
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {levels.map((l) => (
          <Card key={l.lvl}>
            <div className="flex items-center gap-3">
              <span className="mono flex h-9 w-9 items-center justify-center rounded-xl bg-amber-deep text-[16px] font-bold text-white">{l.lvl}</span>
              <div>
                <p className="text-[13px] font-bold text-ink">{l.name}</p>
                <p className="text-[10px] font-medium text-ink-500">{l.when} · {l.duration}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-[11px]">
              <li className="rounded-lg bg-surface2/40 p-2"><strong className="text-[10px] uppercase tracking-wider text-ink-500">QUI</strong><br />{l.who}</li>
              <li className="rounded-lg bg-amber-50/40 p-2"><strong className="text-[10px] uppercase tracking-wider text-amber-deep">ENJEU</strong><br />{l.enjeu}</li>
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Distribution cible — courbe normale Atlas" subtitle="Recommandation forte (pas mandate hard)" action={<Sparkles size={16} className="text-amber-deep" />} />
        <div className="space-y-2">
          {distribution.map((d) => (
            <div key={d.class}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ink">{d.class}</span>
                <span className="mono text-[14px] font-bold text-amber-deep">{d.target} %</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-line">
                <div className={cn('h-full rounded-full',
                  d.color === 'emerald-500' ? 'bg-emerald-500' :
                  d.color === 'emerald-400' ? 'bg-emerald-400' :
                  d.color === 'sky-500' ? 'bg-sky-500' :
                  d.color === 'amber-500' ? 'bg-amber-500' :
                                            'bg-rose-500')}
                  style={{ width: `${d.target * 2}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-xl bg-amber/[0.06] px-3 py-2 text-[11px] font-medium italic text-ink-700">
          <strong>Garde-fou :</strong> si une équipe a &gt; 40 % de A → calibration équipe à refaire. Si une équipe a &gt; 25 % de E → manager en accompagnement RH.
        </p>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 4. NOTATION FINALE ABCD ═══════════════════════════════ */
export function NotationFinalePage() {
  const [score1, setScore1] = useState(4.25);
  const [score2, setScore2] = useState(3.7);
  const [score3, setScore3] = useState(4.5);
  const [score4, setScore4] = useState(4.0);
  const [score5, setScore5] = useState(3.5);
  const noteFinale = useMemo(() => {
    const s = (score1 * 0.35 + score2 * 0.25 + score3 * 0.20 + score4 * 0.12 + score5 * 0.08) * 20;
    return Math.round(s * 10) / 10;
  }, [score1, score2, score3, score4, score5]);

  const classe = useMemo(() => {
    if (noteFinale >= 85) return { code: 'A', name: 'Exceptionnel',      tone: 'success', color: 'emerald-500' };
    if (noteFinale >= 70) return { code: 'B', name: 'Au-dessus attentes', tone: 'success', color: 'emerald-400' };
    if (noteFinale >= 55) return { code: 'C', name: 'Conforme attentes', tone: 'info',    color: 'sky-500' };
    if (noteFinale >= 40) return { code: 'D', name: 'Plan dev requis',   tone: 'warn',    color: 'amber-500' };
    return { code: 'E', name: 'Accompagnement critique', tone: 'danger', color: 'rose-500' };
  }, [noteFinale]);

  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Notation finale — classes ABCDE</h1>
        <p className="text-sm font-medium text-ink-500">Note 0-100 · Classe ABCDE · validation Manager + Directeur + DRH si écart · trace officielle RH</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Simulateur Marie SAMAKÉ" subtitle="Ajuste chaque score dimension pour voir la note finale" action={<Award size={16} className="text-amber-deep" />} />
          <div className="space-y-3">
            {[
              { num: 1, name: 'Atteinte OKR',          w: 35, val: score1, set: setScore1 },
              { num: 2, name: 'Compétences',           w: 25, val: score2, set: setScore2 },
              { num: 3, name: 'Comportements/Valeurs', w: 20, val: score3, set: setScore3 },
              { num: 4, name: 'Évolution/Potentiel',   w: 12, val: score4, set: setScore4 },
              { num: 5, name: 'Développement personnel', w: 8, val: score5, set: setScore5 },
            ].map((d) => (
              <div key={d.num}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink">{d.num}. {d.name} <span className="text-ink-500">({d.w} %)</span></span>
                  <span className="mono text-[14px] font-bold text-amber-deep">{d.val.toFixed(1)}/5</span>
                </div>
                <input type="range" min={1} max={5} step={0.1} value={d.val} onChange={(e) => d.set(parseFloat(e.target.value))} className="w-full accent-amber-deep" />
              </div>
            ))}
          </div>
        </Card>

        <Card className={cn('border-2',
          classe.tone === 'success' ? 'border-emerald-300 bg-emerald-50/40' :
          classe.tone === 'info'    ? 'border-sky-300 bg-sky-50/40' :
          classe.tone === 'warn'    ? 'border-amber-300 bg-amber-50/40' :
                                      'border-rose-300 bg-rose-50/40')}>
          <CardHeader title="Note finale Marie SAMAKÉ" subtitle="Calcul automatique pondéré" />
          <div className="text-center">
            <p className="mono text-[64px] font-bold leading-none text-ink">{noteFinale}<span className="text-[24px] text-ink-500"> /100</span></p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className={cn('mono flex h-16 w-16 items-center justify-center rounded-2xl text-[36px] font-bold text-white',
                classe.color === 'emerald-500' ? 'bg-emerald-500' :
                classe.color === 'emerald-400' ? 'bg-emerald-400' :
                classe.color === 'sky-500'     ? 'bg-sky-500' :
                classe.color === 'amber-500'   ? 'bg-amber-500' :
                                                 'bg-rose-500')}>{classe.code}</span>
              <div className="text-left">
                <p className="text-[13px] font-bold text-ink">{classe.name}</p>
                <p className="text-[10px] font-medium text-ink-500">Classe finale</p>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-surface2/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Workflow validation</p>
            <ol className="mt-1 space-y-1 text-[11px] font-medium text-ink-700">
              <li>1. Validation Manager (proposition)</li>
              <li>2. Calibration équipe (S46)</li>
              <li>3. Calibration direction (S47)</li>
              <li>4. Validation Directeur final</li>
              <li>5. Si écart ≥ 1 niveau : DRH arbitre</li>
              <li>6. Restitution entretien (S48-51)</li>
              <li>7. Signature ADVIST définitive</li>
            </ol>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Mapping note → classe → conséquences" subtitle="Effets RH typiques (configurables par tenant)" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-center">Score</th>
              <th className="px-3 py-2 text-center">Classe</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-left">Augmentation typique</th>
              <th className="px-3 py-2 text-left">Prime variable</th>
              <th className="px-3 py-2 text-left">Plan dev</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {[
                { s: '85-100', c: 'A', name: 'Exceptionnel', tone: 'success', aug: '+8 à +12 %', prime: '150 %', plan: 'Programme Hauts Potentiels' },
                { s: '70-84',  c: 'B', name: 'Au-dessus',    tone: 'success', aug: '+5 à +8 %',  prime: '125 %', plan: 'Plan dev classique' },
                { s: '55-69',  c: 'C', name: 'Conforme',     tone: 'info',    aug: '+2 à +5 %',  prime: '100 %', plan: 'Plan dev classique' },
                { s: '40-54',  c: 'D', name: 'Plan dev requis', tone: 'warn', aug: '0 à +2 %',   prime: '75 %',  plan: 'Plan dev renforcé · revue 6 mois' },
                { s: '<40',    c: 'E', name: 'Accompagnement', tone: 'danger', aug: '0 %',       prime: '0 %',   plan: 'Plan accompagnement + revue 3 mois' },
              ].map((r) => (
                <tr key={r.c} className="hover:bg-amber/[0.03]">
                  <td className="px-3 py-2 mono text-center text-[11px] font-bold">{r.s}</td>
                  <td className="px-3 py-2 text-center"><StatusPill tone={r.tone as 'success'|'info'|'warn'|'danger'} dot={false}>{r.c}</StatusPill></td>
                  <td className="px-3 py-2 text-[12px] font-semibold text-ink">{r.name}</td>
                  <td className="px-3 py-2 mono text-[11px]">{r.aug}</td>
                  <td className="px-3 py-2 mono text-[11px]">{r.prime}</td>
                  <td className="px-3 py-2 text-[11px] font-medium text-ink-700">{r.plan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 5. ÉQUITÉ H/F & ANTI-BIAIS ═══════════════════════════════ */
export function EquiteEvalPage() {
  const distribByGender = [
    { gender: 'Femmes', count: 6, A: 1, B: 2, C: 2, D: 1, E: 0 },
    { gender: 'Hommes', count: 8, A: 2, B: 3, C: 2, D: 1, E: 0 },
  ];
  const biasFlags = [
    { code: 'BIAIS-HALO',       severity: 'medium' as const, desc: 'Manager X attribue systématiquement A à 80 % de son équipe — effet de halo probable.', action: 'Re-calibration équipe avec RRH' },
    { code: 'BIAIS-GENRE',      severity: 'low' as const,    desc: 'Direction Sales : note moyenne H = 3,8 · F = 3,4 — écart 0,4 pt à surveiller.', action: 'Analyse contextuelle DRH · pas de signal fort' },
    { code: 'BIAIS-ANCIENNETE', severity: 'medium' as const, desc: '3 collab < 1 an d\'ancienneté tous notés C — possible biais "pas le temps de prouver".', action: 'Vérifier critères évolution/potentiel' },
    { code: 'CLUSTERING',       severity: 'high' as const,   desc: 'Équipe Tech : 9/10 collab notés en B — distribution anormale, suggère uniformisation paresseuse.', action: 'Atelier calibration obligatoire' },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Équité &amp; Anti-biais</h1>
        <p className="text-sm font-medium text-ink-500">Détection automatique de patterns discriminants · monitoring distribution par cohorte</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Score équité global" value="87/100" unit="↑ +3 vs N-1" icon={Heart} />
        <StatCard label="Écart H/F note moy." value="0,2" unit="pt · acceptable < 0,3" icon={Users} />
        <StatCard label="Biais détectés" value={String(biasFlags.length)} unit="à investiguer" icon={ShieldAlert} tone={biasFlags.length > 2 ? 'amber' : 'default'} />
        <StatCard label="Équipes à recalibrer" value="2" unit="distribution anormale" icon={AlertCircle} tone="amber" />
      </div>

      <Card>
        <CardHeader title="Distribution par genre" subtitle="Cycle N · 14 collaborateurs" action={<Users size={16} className="text-amber-deep" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2 text-left">Cohorte</th>
              <th className="px-3 py-2 text-center">Effectif</th>
              <th className="px-3 py-2 text-center">A</th>
              <th className="px-3 py-2 text-center">B</th>
              <th className="px-3 py-2 text-center">C</th>
              <th className="px-3 py-2 text-center">D</th>
              <th className="px-3 py-2 text-center">E</th>
              <th className="px-3 py-2 text-center">% A+B</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {distribByGender.map((g) => {
                const ab = Math.round(((g.A + g.B) / g.count) * 100);
                return (
                  <tr key={g.gender} className="hover:bg-amber/[0.03]">
                    <td className="px-3 py-2 text-[12px] font-bold text-ink">{g.gender}</td>
                    <td className="px-3 py-2 mono text-center text-[12px] font-bold">{g.count}</td>
                    <td className="px-3 py-2 mono text-center text-[11px] text-emerald-600">{g.A}</td>
                    <td className="px-3 py-2 mono text-center text-[11px] text-emerald-500">{g.B}</td>
                    <td className="px-3 py-2 mono text-center text-[11px] text-sky-600">{g.C}</td>
                    <td className="px-3 py-2 mono text-center text-[11px] text-amber-700">{g.D}</td>
                    <td className="px-3 py-2 mono text-center text-[11px] text-rose-600">{g.E}</td>
                    <td className="px-3 py-2 mono text-center text-[12px] font-bold text-amber-deep">{ab} %</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Patterns biais détectés" subtitle={`${biasFlags.length} signaux automatiques · revue DRH requise`} action={<ShieldAlert size={16} className="text-warn" />} />
        <ul className="space-y-2">
          {biasFlags.map((b) => (
            <li key={b.code} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between">
                <span className="mono text-[10px] font-bold text-amber-deep">{b.code}</span>
                <StatusPill tone={b.severity === 'high' ? 'danger' : b.severity === 'medium' ? 'warn' : 'info'} dot={false}>{b.severity}</StatusPill>
              </div>
              <p className="mt-1 text-[12px] font-semibold text-ink">{b.desc}</p>
              <p className="mt-1 text-[11px] font-medium italic text-ink-500">→ Action : {b.action}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════ 6. AUDIT M8 SHA-256 ═══════════════════════════════ */
export function AuditEvalPage() {
  const auditEvents = [
    { at: '2026-11-28 14:22', actor: 'Awa Koné',     action: 'eval.score.update',  detail: 'Note finale Marie SAMAKÉ : 76,5 → 78,2 (post-calibration)', hash: '7f3a91…b842c1' },
    { at: '2026-11-28 09:10', actor: 'Comité Calib.', action: 'calibration.close', detail: 'Workshop Direction Sales clôturé · 12 évaluations validées', hash: 'e4dc88…a3119f' },
    { at: '2026-11-26 16:05', actor: 'Fatou Diop',   action: 'eval.submit',        detail: 'Auto-évaluation soumise · entrée en phase évaluation manager', hash: 'b1f042…5e8723' },
    { at: '2026-11-25 11:30', actor: 'System',       action: 'bias.detection',     detail: 'Pattern CLUSTERING détecté · équipe Tech 9/10 en B', hash: 'a92b51…0c4477' },
    { at: '2026-11-20 18:00', actor: 'System',       action: 'cycle.phase.transition', detail: 'Phase 3 → Phase 4 (calibration)', hash: '0d7e29…f10891' },
  ];
  const patterns = [
    { code: 'SCORE_INFLATION',      desc: 'Notes finales toutes ≥ 4/5 sur une équipe', sev: 'medium' as const },
    { code: 'BIAIS_GENRE_SYSTEMIQUE', desc: 'Écart H/F note moyenne > 0,5 sur 3 cycles consécutifs', sev: 'high' as const },
    { code: 'CLUSTERING',           desc: '> 70 % d\'une équipe sur une seule classe', sev: 'medium' as const },
    { code: 'NOTE_MODIFIEE_POST_SIGNATURE', desc: 'Tentative modification note après signature ADVIST', sev: 'high' as const },
    { code: 'AUTO_EVAL_OUBLIEE',    desc: 'Évaluation soumise sans auto-évaluation préalable', sev: 'low' as const },
    { code: 'CALIBRATION_BYPASS',   desc: 'Note finale validée sans passer par calibration', sev: 'high' as const },
    { code: 'DIRECTOR_OVERRIDE_PATTERN', desc: 'Directeur modifie > 50 % des notes proposées par manager', sev: 'medium' as const },
    { code: 'JUNIOR_SYSTEMATIC_C',  desc: 'Tous collab < 1 an d\'ancienneté notés C', sev: 'medium' as const },
    { code: 'DRH_ARBITRAGE_FREQUENT', desc: 'DRH arbitre > 20 % des cas — calibration insuffisante', sev: 'medium' as const },
    { code: 'EVAL_TIMING_SUSPECT',  desc: 'Évaluation soumise hors fenêtre temporelle prévue', sev: 'low' as const },
    { code: 'PLAN_DEV_MANQUANT',    desc: 'Classe D/E sans plan dev associé sous 30 j', sev: 'high' as const },
    { code: 'NOTE_INCOHERENTE_OKR', desc: 'Note finale A avec score OKR annuel < 50 %', sev: 'high' as const },
  ];
  return (
    <div className="animate-fade-up space-y-5">
      <EvalSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Audit M8 — chaîne SHA-256 &amp; anti-fraude</h1>
          <p className="text-sm font-medium text-ink-500">Traçabilité totale · 12 patterns automatiques · anti-discrimination · conformité RGPD</p>
        </div>
        <StatusPill tone="success" dot={false}>Chaîne intègre</StatusPill>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Entrées audit" value="2 487" unit="cycle N YTD" icon={Lock} />
        <StatCard label="Vérifications" value="183" unit="quotidiennes" icon={CheckCircle2} />
        <StatCard label="Patterns surveillés" value={String(patterns.length)} unit="anti-fraude" icon={Eye} />
        <StatCard label="Alertes actives" value="2" unit="à investiguer" icon={ShieldAlert} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card inset={false}>
          <div className="p-5 pb-2"><CardHeader title="Timeline audit récente" subtitle="Chaîne SHA-256 incassable · chaque entrée hashe la précédente" className="mb-0" /></div>
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
          <CardHeader title="12 patterns anti-fraude" subtitle="Détection automatique cron quotidien" action={<Shield size={16} className="text-amber-deep" />} />
          <ul className="space-y-1.5">
            {patterns.map((p) => (
              <li key={p.code} className="rounded-lg bg-surface2/40 px-3 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] font-bold text-amber-deep">{p.code}</span>
                  <StatusPill tone={p.sev === 'high' ? 'danger' : p.sev === 'medium' ? 'warn' : 'info'} dot={false}>{p.sev}</StatusPill>
                </div>
                <p className="text-[10px] font-medium text-ink-500">{p.desc}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Schéma m8_audit_log (Postgres)" subtitle="Structure auditable" />
        <pre className="overflow-x-auto rounded-xl bg-surface2/60 p-3 mono text-[10px] leading-relaxed text-ink-700">{`m8_audit_log {
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  occurred_at     TIMESTAMPTZ DEFAULT now(),
  actor_id        UUID, actor_role TEXT, actor_ip INET,
  action_code     TEXT NOT NULL,   -- eval.score.update, calibration.close, bias.detection, …
  resource_type   TEXT,            -- evaluation | calibration | dev_plan | 360_feedback
  resource_id     UUID,
  before_state    JSONB,
  after_state     JSONB,
  prev_hash       TEXT,
  hash            TEXT NOT NULL    -- SHA-256(prev_hash || payload canonique)
}

trigger m8_audit_immutable : empêche modification ou suppression d'entrées existantes
cron m8_audit_verify       : 04:30 quotidien — vérifie l'intégralité de la chaîne
cron m8_bias_detection     : 03:00 quotidien — exécute les 12 patterns`}</pre>
      </Card>

      <span className="hidden">{EMPLOYEES.length}{employeeName.name}{Avatar.name}</span>
    </div>
  );
}
