import { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useSurface } from '../../store/useSurface';

interface Props { title: string; eyebrow: string; description: string; icon?: LucideIcon }

/** Placeholder de section du portail manager — remplacé vague par vague.
 *  Conserve la coquille MSS (aucun renvoi vers le back-office, R1). */
export function MssPlaceholder({ title, eyebrow, description, icon: Icon = Construction }: Props) {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-info">Espace Manager · {eyebrow}</p>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      </div>
      <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-info/10 text-info"><Icon size={26} /></span>
        <p className="max-w-md text-sm font-medium text-ink-500">{description}</p>
        <span className="rounded-full bg-ink/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Bientôt disponible</span>
      </Card>
    </div>
  );
}
