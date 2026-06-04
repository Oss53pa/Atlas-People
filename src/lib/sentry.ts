/**
 * Sentry — monitoring erreurs conditionnel.
 *
 * Si VITE_SENTRY_DSN est renseigné → init Sentry (production).
 * Sinon → noop (dev / démo).
 *
 * Note : on n'installe pas @sentry/react comme dépendance obligatoire
 * pour ne pas alourdir le bundle de base. Le DSN est fourni par l'équipe
 * ops Atlas Studio ; les projets clients n'en ont pas besoin.
 *
 * Pour activer : npm install @sentry/react + renseigner VITE_SENTRY_DSN dans .env.prod
 */

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const ENV = import.meta.env.MODE;
const RELEASE = import.meta.env.VITE_APP_VERSION as string | undefined ?? 'dev';

let _sentry: {
  captureException: (e: unknown, ctx?: Record<string, unknown>) => string | undefined;
  setUser: (u: { id: string; email?: string } | null) => void;
} | null = null;

/** Init Sentry (appelé depuis main.tsx une seule fois). */
export async function initSentry(): Promise<void> {
  if (!DSN) return; // mode démo ou dev sans DSN
  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn: DSN,
      environment: ENV,
      release: RELEASE,
      tracesSampleRate: ENV === 'production' ? 0.1 : 0,
      // Données personnelles : on ne capture pas les corps de requête
      beforeSend(event) {
        if (event.request?.data) delete event.request.data;
        return event;
      },
    });
    _sentry = {
      captureException: (e, ctx) => {
        if (ctx) return Sentry.captureException(e, { extra: ctx });
        return Sentry.captureException(e);
      },
      setUser: (u) => Sentry.setUser(u),
    };
    console.info('[Atlas] Monitoring activé (env=%s, release=%s)', ENV, RELEASE);
  } catch {
    // @sentry/react non installé → silencieux
  }
}

/** Rapporte une erreur. Retourne l'eventId Sentry ou undefined. */
export function reportError(error: unknown, ctx?: Record<string, unknown>): string | undefined {
  if (_sentry) return _sentry.captureException(error, ctx);
  // Fallback : log console en dev
  console.error('[Atlas Error]', error, ctx);
  return undefined;
}

/** Met à jour le user Sentry (appeler après signIn). */
export function setSentryUser(user: { id: string; email?: string } | null) {
  _sentry?.setUser(user);
}
