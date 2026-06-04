/**
 * ErrorBoundary — capture les erreurs React non gérées.
 * Affiche un écran de récupération premium au lieu du crash blanc.
 * Intégré dans main.tsx autour de <App />.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '../lib/sentry';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null; eventId: string | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const id = reportError(error, { componentStack: info.componentStack ?? '' });
    this.setState({ eventId: id ?? null });
    console.error('[Atlas ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const { error, eventId } = this.state;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-4 text-center">
        <div className="pointer-events-none absolute inset-0 bg-canvas-glow" />
        <div className="relative z-10 max-w-md space-y-4">
          <span className="font-display text-5xl text-ink">Atlas</span>
          <span className="font-display text-5xl text-amber-deep"> People</span>

          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/[0.05] p-6">
            <p className="text-base font-bold text-rose-700">Une erreur inattendue est survenue</p>
            <p className="mt-2 font-mono text-[11px] text-rose-600 break-all">
              {error?.message ?? 'Erreur inconnue'}
            </p>
            {eventId && (
              <p className="mt-2 text-[10px] text-ink-500">
                Référence incident : <span className="mono">{eventId}</span>
              </p>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/accueil'; }}
              className="rounded-xl bg-amber-deep px-5 py-2.5 text-[13px] font-bold text-white shadow-premium hover:opacity-90 transition-opacity"
            >
              Retour à l'accueil
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border border-line bg-surface px-5 py-2.5 text-[13px] font-bold text-ink hover:bg-amber/[0.04] transition-colors"
            >
              Recharger
            </button>
          </div>
        </div>
      </div>
    );
  }
}
