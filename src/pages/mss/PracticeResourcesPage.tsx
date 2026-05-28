import { useEffect } from 'react';
import { BookOpen, FileText, Video, FileType, Star } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { PracticeSubNav } from '../../components/mss/PracticeSubNav';
import { useSurface } from '../../store/useSurface';
import { RESOURCE_CATEGORIES, TOP_RESOURCES } from '../../lib/mss/practice';

const KIND_ICON: Record<string, typeof FileText> = { PDF: FileText, Vidéo: Video, Modèle: FileType };

export function PracticeResourcesPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  return (
    <div className="animate-fade-up space-y-5">
      <PracticeSubNav />
      <h1 className="text-2xl font-semibold text-ink">Ressources manager</h1>

      <Card>
        <CardHeader title="Catégories" action={<BookOpen size={16} className="text-ink-400" />} />
        <div className="flex flex-wrap gap-2">
          {RESOURCE_CATEGORIES.map((c) => <StatusPill key={c} tone="neutral" dot={false}>{c}</StatusPill>)}
        </div>
      </Card>

      <Card>
        <CardHeader title="Top consultés" action={<Star size={16} className="text-ink-400" />} />
        <div className="space-y-2">
          {TOP_RESOURCES.map((r) => {
            const Icon = KIND_ICON[r.kind] ?? FileText;
            return (
              <div key={r.label} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2.5 text-sm font-medium text-ink-700">
                <span className="flex items-center gap-2"><Icon size={15} className="text-ink-400" /> {r.label}</span>
                <StatusPill tone="info" dot={false}>{r.kind}</StatusPill>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
