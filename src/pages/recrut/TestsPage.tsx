import { useMemo, useState } from 'react';
import {
  FlaskConical, Search, Plus, Clock, ShieldCheck, AlertTriangle, Send, Timer,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import {
  RECRUITMENT_TESTS, TEST_PASSATIONS, TEST_CATEGORY_META, testById, testKpis,
} from '../../lib/m5/assessments';
import { candidateById } from '../../lib/m5/mock';
import type { TestCategory, PassationStatus } from '../../lib/m5/types';
import { cn } from '../../lib/cn';

const PASS_META: Record<PassationStatus, { label: string; tone: 'ok' | 'amber' | 'info' | 'warn' | 'neutral' | 'danger' }> = {
  invited:     { label: 'Invité',     tone: 'info'    },
  in_progress: { label: 'En cours',   tone: 'amber'   },
  submitted:   { label: 'Soumis',     tone: 'warn'    },
  scored:      { label: 'Corrigé',    tone: 'ok'      },
  expired:     { label: 'Expiré',     tone: 'danger'  },
};

export function TestsPage() {
  const { toast } = useToast();
  const k = useMemo(() => testKpis(), []);
  const [q, setQ] = useState('');
  const [catF, setCatF] = useState<'all' | TestCategory>('all');

  const list = useMemo(() => RECRUITMENT_TESTS.filter((t) => {
    if (catF !== 'all' && t.category !== catF) return false;
    if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, catF]);

  const cats = Object.keys(TEST_CATEGORY_META) as TestCategory[];

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Tests & assessments</h1>
          <p className="text-sm font-medium text-ink-500">Évaluation objective · techniques, psychométriques, mises en situation, assessment centers</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Test', description: 'Création d\'un test custom (catalogue)' })}><Plus size={14} /> Nouveau test</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Catalogue" value={String(k.catalogue)} unit="tests" icon={FlaskConical} />
        <StatCard label="Actifs" value={String(k.actifs)} unit="disponibles" icon={ShieldCheck} />
        <StatCard label="Passations" value={String(k.passations)} unit="12 mois" icon={Send} />
        <StatCard label="En cours" value={String(k.enCours)} unit="invités/démarrés" icon={Timer} tone="amber" />
        <StatCard label="Signaux triche" value={String(k.flagged)} unit="à revoir" icon={AlertTriangle} tone={k.flagged ? 'amber' : 'default'} />
      </div>

      {/* Catalogue */}
      <Card inset={false}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un test…" className="h-9 w-56 rounded-lg border border-line bg-surface2 pl-8 pr-2 text-[13px] font-medium text-ink focus:border-amber/40 focus:outline-none" />
            </div>
            <select value={catF} onChange={(e) => setCatF(e.target.value as typeof catF)} className="h-9 rounded-lg border border-line bg-surface2 px-2 text-[12px] font-semibold text-ink-700">
              <option value="all">Toutes catégories</option>
              {cats.map((c) => <option key={c} value={c}>{TEST_CATEGORY_META[c].label}</option>)}
            </select>
          </div>
          <span className="text-[11px] font-semibold text-ink-400">{list.length}/{RECRUITMENT_TESTS.length} tests</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Test</th><th className="px-3 py-2 text-left">Catégorie</th>
              <th className="px-3 py-2 text-center">Durée</th><th className="px-3 py-2 text-center">Seuil</th>
              <th className="px-3 py-2 text-center">Anti-triche</th><th className="px-3 py-2 text-center">Passations</th>
              <th className="px-3 py-2 text-center">Score moy.</th><th className="px-3 py-2 text-right" />
            </tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((t) => {
                const cm = TEST_CATEGORY_META[t.category];
                return (
                  <tr key={t.id} className={cn('hover:bg-amber/[0.03]', !t.active && 'opacity-55')}>
                    <td className="px-4 py-2"><p className="text-[13px] font-semibold text-ink">{t.name}</p><p className="text-[11px] font-medium text-ink-500">{t.description}</p></td>
                    <td className="px-3 py-2"><StatusPill tone={cm.tone} dot={false}>{cm.label}</StatusPill></td>
                    <td className="px-3 py-2 text-center text-[12px] text-ink-700"><Clock size={11} className="mr-0.5 inline text-ink-400" />{t.durationMin} min</td>
                    <td className="px-3 py-2 text-center mono text-[12px] text-ink-700">{t.scoring === 'auto' && t.passingScore === 0 ? '—' : `${t.passingScore} %`}</td>
                    <td className="px-3 py-2 text-center">{t.proctoring || t.tabSwitchDetection ? <ShieldCheck size={14} className="inline text-ok" /> : <span className="text-ink-300 text-[11px]">—</span>}</td>
                    <td className="px-3 py-2 text-center mono text-[12px] text-ink-700">{t.passations}</td>
                    <td className="px-3 py-2 text-center mono text-[12px] font-bold text-ink">{t.avgScore != null ? `${t.avgScore} %` : <span className="text-ink-400 font-medium">profil</span>}</td>
                    <td className="px-3 py-2 text-right"><Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: t.name, description: `Inviter un candidat · seuil ${t.passingScore} % · ${t.scoring}` })}>Inviter</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Passations récentes */}
      <Card inset={false}>
        <div className="p-5 pb-2"><CardHeader title="Passations récentes" subtitle="Suivi des invitations · détection de triche (revue manuelle, jamais d'élimination auto)" className="mb-0" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-2 text-left">Candidat</th><th className="px-3 py-2 text-left">Test</th>
              <th className="px-3 py-2 text-left">Invité le</th><th className="px-3 py-2 text-center">Score</th>
              <th className="px-3 py-2 text-center">Statut</th><th className="px-3 py-2 text-left">Signaux</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {TEST_PASSATIONS.map((p) => {
                const cand = candidateById(p.candidateId);
                const test = testById(p.testId);
                const pm = PASS_META[p.status];
                return (
                  <tr key={p.id} className="hover:bg-amber/[0.03]">
                    <td className="px-4 py-2 text-[13px] font-semibold text-ink">{cand ? `${cand.firstName} ${cand.lastName}` : p.candidateId}</td>
                    <td className="px-3 py-2 text-[12px] font-medium text-ink-700">{test?.name ?? p.testId}</td>
                    <td className="px-3 py-2 mono text-[11px] text-ink-700">{p.invitedAt}</td>
                    <td className="px-3 py-2 text-center">{p.score != null ? <span className={cn('mono text-[12px] font-bold', p.passed ? 'text-ok' : 'text-danger')}>{p.score} %</span> : <span className="text-ink-300 text-[11px]">—</span>}</td>
                    <td className="px-3 py-2 text-center"><StatusPill tone={pm.tone} dot={false}>{pm.label}</StatusPill></td>
                    <td className="px-3 py-2">{p.flags?.length ? <span className="flex items-center gap-1 text-[11px] font-semibold text-warn"><AlertTriangle size={11} /> {p.flags.join(', ')}</span> : <span className="text-ink-300 text-[11px]">RAS</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[11px] font-medium text-ink-400">Règles dures : tests validés juridiquement (anti-discrimination) · consentement candidat à chaque passation · pas d'élimination automatique sur seul signal triche · audit chaîné.</p>
    </div>
  );
}
