import { useEffect, useState } from 'react';
import { Download, FileText, FileSpreadsheet, ShieldCheck, Clock } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { ReportingSubNav } from '../../components/mss/ReportingSubNav';
import { useSurface } from '../../store/useSurface';
import { QUICK_EXPORTS, RECENT_EXPORTS, type RecentExport } from '../../lib/mss/reporting';

export function ReportingExportsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);
  const { toast } = useToast();

  const [history, setHistory] = useState<RecentExport[]>(RECENT_EXPORTS);

  const generate = (label: string, format: string) => {
    const name = `${label} — Mai 2026.${format === 'Excel' ? 'xlsx' : 'pdf'}`;
    setHistory((h) => [{ name, date: '28/05/2026' }, ...h]);
    toast({ variant: 'success', title: 'Export généré', description: 'Filigrane « Confidentiel · Atlas People » appliqué. Génération tracée (audit).' });
  };

  return (
    <div className="animate-fade-up space-y-5">
      <ReportingSubNav />
      <h1 className="text-2xl font-semibold text-ink">Centre d’exports</h1>

      <Card>
        <CardHeader title="Exports rapides" action={<Download size={16} className="text-ink-400" />} />
        <div className="grid gap-2 sm:grid-cols-2">
          {QUICK_EXPORTS.map((e) => {
            const Icon = e.format === 'Excel' ? FileSpreadsheet : FileText;
            return (
              <div key={e.key} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm font-medium text-ink-700"><Icon size={15} className="text-ink-400" /> {e.label}</span>
                <Button variant="ghost" size="sm" onClick={() => generate(e.label, e.format)}><Download size={13} /> {e.format}</Button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Mes exports récents" action={<Clock size={16} className="text-ink-400" />} />
        <div className="space-y-2">
          {history.map((h, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
              <span className="flex items-center gap-2"><FileText size={14} className="text-ink-400" /> {h.name}</span>
              <span className="text-[12px] text-ink-400">{h.date}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="flex items-start gap-2 text-[12px] font-medium text-ink-700"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-info" /> Les exports respectent les mêmes règles de confidentialité que les vues écran (aucune donnée individuelle). Filigrane « Confidentiel · Atlas People · {`{manager}`} · {`{date}`} » et traçabilité d’audit sur chaque génération.</p>
        <div className="mt-2"><StatusPill tone="info" dot={false}>Audit actif</StatusPill></div>
      </Card>
    </div>
  );
}
