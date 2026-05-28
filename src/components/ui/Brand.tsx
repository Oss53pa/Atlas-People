import { cn } from '../../lib/cn';

/**
 * Noms de marque en Grand Hotel — UNIQUEMENT « Atlas People », « Atlas Studio »,
 * « Proph3t » (doc transverse §1). Jamais pour un titre, un label ou du texte.
 * Proph3t s'écrit toujours P majuscule, le reste en minuscule.
 */
type BrandName = 'Atlas People' | 'Atlas Studio' | 'Proph3t';

export function Brand({ name, className }: { name: BrandName; className?: string }) {
  return <span className={cn('font-logo tracking-wide', className)}>{name}</span>;
}
