import { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/cn';

function useEscClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);
}

/** Modale générique (rayon 12px, doc §3). Esc ferme. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEscClose(open, onClose);
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('w-full rounded-t-3xl bg-surface shadow-float animate-fade-up sm:rounded-3xl', sizes[size])}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-ink-400 hover:bg-ink/5">
              <X size={18} />
            </button>
          </header>
        )}
        <div className="p-5">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">{footer}</footer>}
      </div>
    </div>
  );
}

/** Confirmation d'action sensible (doc §6) — tracée côté appelant. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  tone = 'danger',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} size="sm" onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tone === 'danger' ? 'bg-danger/12 text-danger' : 'bg-amber/12 text-amber-deep')}>
          <AlertTriangle size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm font-medium text-ink-500">{message}</p>
        </div>
      </div>
    </Modal>
  );
}

/** Tiroir latéral (filtres mobile, panneaux). */
export function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: 'right' | 'bottom';
  children: React.ReactNode;
}) {
  useEscClose(open, onClose);
  return (
    <>
      <div
        className={cn('fixed inset-0 z-[55] bg-ink/40 backdrop-blur-sm transition-opacity', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed z-[56] bg-surface shadow-float transition-transform',
          side === 'right'
            ? cn('inset-y-0 right-0 w-full max-w-sm', open ? 'translate-x-0' : 'translate-x-full')
            : cn('inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl', open ? 'translate-y-0' : 'translate-y-full'),
        )}
      >
        {title && (
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-ink-400 hover:bg-ink/5">
              <X size={18} />
            </button>
          </header>
        )}
        <div className="overflow-y-auto p-5">{children}</div>
      </aside>
    </>
  );
}
