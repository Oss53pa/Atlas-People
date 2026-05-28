import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../lib/cn';

type Variant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  variant: Variant;
  title: string;
  description?: string;
}

interface ToastCtx {
  toast: (t: Omit<ToastItem, 'id'>) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast doit être utilisé dans <ToastProvider>');
  return c;
}

const CONFIG: Record<Variant, { icon: typeof Info; bar: string; tint: string; text: string }> = {
  success: { icon: CheckCircle2, bar: 'bg-ok', tint: 'text-ok', text: 'text-ok' },
  error: { icon: XCircle, bar: 'bg-danger', tint: 'text-danger', text: 'text-danger' },
  warning: { icon: AlertTriangle, bar: 'bg-warn', tint: 'text-warn', text: 'text-warn' },
  info: { icon: Info, bar: 'bg-info', tint: 'text-info', text: 'text-info' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const remove = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((p) => [...p, { ...t, id }]);
      if (t.variant !== 'error') setTimeout(() => remove(id), t.variant === 'info' ? 8000 : 5000);
    },
    [remove],
  );

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const c = CONFIG[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === 'error' || t.variant === 'warning' ? 'alert' : 'status'}
              className={cn('pointer-events-auto flex animate-fade-up items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-float')}
            >
              <span className={cn('absolute left-0 top-3 bottom-3 w-[3px] rounded-full', c.bar)} />
              <c.icon size={18} className={cn('mt-0.5 shrink-0', c.tint)} />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-semibold', 'text-ink')}>{t.title}</p>
                {t.description && <p className="mt-0.5 text-[12px] font-medium text-ink-500">{t.description}</p>}
              </div>
              <button onClick={() => remove(t.id)} aria-label="Fermer" className="rounded-lg p-1 text-ink-400 hover:bg-ink/5">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
