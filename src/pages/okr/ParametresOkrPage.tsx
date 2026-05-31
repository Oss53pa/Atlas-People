import { Settings, CalendarRange, Target, MessageSquare, Library } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { OkrSubNav } from '../../components/okr/OkrSubNav';
import { CYCLES, CHECKIN_CADENCES, OBJECTIVE_TEMPLATES, KR_TYPE_META, BEST_PRACTICES, SCORING_GRID } from '../../lib/m7/referentiels';

export function ParametresOkrPage() {
  const { toast } = useToast();

  const sections = [
    { title: 'Cycles configurés', count: CYCLES.length, hint: 'Q1-Q4 2026 + Q4 2025', icon: CalendarRange },
    { title: 'Cadences check-in', count: CHECKIN_CADENCES.length, hint: 'Hebdo · bi-hebdo', icon: MessageSquare },
    { title: 'Templates d\'objectif', count: OBJECTIVE_TEMPLATES.length, hint: 'Par fonction (sales, tech, RH...)', icon: Library },
    { title: 'Types de KR', count: Object.keys(KR_TYPE_META).length, hint: 'Numeric, percent, binary, milestone, currency', icon: Target },
    { title: 'Échelle scoring', count: SCORING_GRID.length, hint: '0.0 → 1.0 (Doerr)', icon: Target },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <OkrSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Paramètres OKR</h1>
        <p className="text-sm font-medium text-ink-500">Cycles · cadences · templates · scoring · bonnes pratiques</p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/12 text-amber-deep"><Icon size={18} /></span>
                  <div>
                    <p className="text-[13px] font-bold text-ink">{s.title}</p>
                    <p className="text-[11px] font-medium text-ink-500">{s.hint}</p>
                  </div>
                </div>
                <span className="mono rounded-md bg-amber/12 px-2 py-1 text-[11px] font-bold text-amber-deep">{s.count}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Templates d'objectif par fonction" />
        <div className="space-y-2">
          {OBJECTIVE_TEMPLATES.map((t) => (
            <div key={t.code} className="rounded-xl border border-line bg-surface2/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-ink">{t.title}</p>
                <span className="mono rounded-md bg-info/10 px-2 py-0.5 text-[10px] font-bold uppercase text-info">{t.level}</span>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-ink-500">{t.appliesTo}</p>
              <ul className="mt-2 space-y-0.5">
                {t.krs.map((k) => <li key={k} className="text-[12px] font-medium text-ink-700">• {k}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Bonnes pratiques OKR (Doerr)" />
        <ul className="space-y-1 text-[12px] font-medium text-ink-700">
          {BEST_PRACTICES.map((p) => <li key={p} className="rounded-lg bg-surface2/40 px-3 py-1.5">• {p}</li>)}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Intégrations" />
        <ul className="space-y-2">
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">M8 Évaluations</p><p className="text-[11px] font-medium text-ink-500">Scores OKR alimentent l'évaluation annuelle (impact / performance)</p></div>
            <StatusPill tone="ok" dot>À venir</StatusPill>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-surface2/40 px-3 py-2.5">
            <div><p className="text-[13px] font-bold text-ink">M9 Compétences</p><p className="text-[11px] font-medium text-ink-500">Gaps de compétences identifiés via OKRs non atteints → formations M11</p></div>
            <StatusPill tone="ok" dot>À venir</StatusPill>
          </li>
        </ul>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Réinitialiser', description: 'Templates rechargés' })}>Recharger défauts</Button>
        <Button size="sm" onClick={() => toast({ variant: 'success', title: 'Sauvegardé', description: 'Paramètres OKR enregistrés' })}><Settings size={14} /> Enregistrer</Button>
      </div>
    </div>
  );
}
