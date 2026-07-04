/**
 * LoginPage — authentification Atlas People.
 *
 * Modes :
 *   1. Email + mot de passe (standard)
 *   2. Magic link (lien par email, sans mot de passe)
 *   3. Réinitialisation mot de passe (email reset)
 *   4. Accepter une invitation (token dans l'URL ?token=xxx)
 *
 * En mode démo (VITE_SUPABASE_URL absent), affiche un bouton "Accès démo"
 * qui redirige directement sans auth.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth, isBackendConfigured } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';

type View = 'login' | 'magic' | 'reset' | 'reset_sent' | 'magic_sent' | 'invitation';

const DEMO_PASSWORD = 'AtlasDemo2026!';
const DEMO_PERSONAS = [
  { label: 'RH', email: 'rh@atlaspeople.demo' },
  { label: 'Manager', email: 'manager@atlaspeople.demo' },
  { label: 'Employé', email: 'employe@atlaspeople.demo' },
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, sendMagicLink, resetPassword, acceptInvitation, isAuthenticated, loading } = useAuth();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/accueil';

  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationToken, setInvitationToken] = useState('');

  // Token d'invitation dans l'URL ?token=xxx
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) { setInvitationToken(token); setView('invitation'); }
  }, [location.search]);

  // Redirection si déjà authentifié
  useEffect(() => {
    if (isAuthenticated && !loading) navigate(from, { replace: true });
  }, [isAuthenticated, loading, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSubmitting(true);
    const { error: err } = await signIn(email, password);
    setSubmitting(false);
    if (err) setError(err);
    else navigate(from, { replace: true });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSubmitting(true);
    const { error: err } = await sendMagicLink(email);
    setSubmitting(false);
    if (err) setError(err);
    else setView('magic_sent');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSubmitting(true);
    const { error: err } = await resetPassword(email);
    setSubmitting(false);
    if (err) setError(err);
    else setView('reset_sent');
  };

  const handleAcceptInvitation = async () => {
    setError(null); setSubmitting(true);
    const { ok, error: err } = await acceptInvitation(invitationToken);
    setSubmitting(false);
    if (!ok) setError(err ?? 'Invitation invalide');
    else navigate(from, { replace: true });
  };

  // Connexion rapide aux personas de démonstration (vraie session Supabase).
  const handleDemoLogin = async (demoEmail: string) => {
    setError(null); setSubmitting(true);
    const { error: err } = await signIn(demoEmail, DEMO_PASSWORD);
    setSubmitting(false);
    if (err) setError(err);
    else navigate(from, { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas">
      {/* Décor */}
      <div className="pointer-events-none absolute inset-0 bg-canvas-glow" />
      <div className="pointer-events-none absolute -right-48 -top-48 h-96 w-96 rounded-full bg-amber-deep/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-amber-deep/[0.04] blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="font-display text-4xl text-ink">Atlas</span>
          <span className="font-display text-4xl text-amber-deep"> People</span>
          <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.2em] text-ink-500">
            SIRH OHADA · Infrastructure de confiance Atlas
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-8 shadow-premium">

          {/* ── Mode démo ──────────────────────────────────────── */}
          {!isBackendConfigured && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-amber-deep/30 bg-amber/[0.06] px-4 py-3">
                <Sparkles size={18} className="shrink-0 text-amber-deep" />
                <div>
                  <p className="text-[13px] font-bold text-ink">Mode démo activé</p>
                  <p className="mt-0.5 text-[11px] font-medium text-ink-500">
                    Aucune authentification requise — données fictives uniquement.
                  </p>
                </div>
              </div>
              <Button className="w-full" onClick={() => navigate('/accueil')}>
                Accéder au démo <ArrowRight size={15} />
              </Button>
              <p className="text-center text-[11px] text-ink-500">
                Pour activer l'authentification, renseignez{' '}
                <code className="mono text-[10px]">VITE_SUPABASE_URL</code> et{' '}
                <code className="mono text-[10px]">VITE_SUPABASE_ANON_KEY</code>.
              </p>
            </div>
          )}

          {/* ── Invitation ─────────────────────────────────────── */}
          {isBackendConfigured && view === 'invitation' && (
            <div className="space-y-5">
              <h2 className="text-center font-display text-2xl text-ink">Rejoindre le workspace</h2>
              <p className="text-center text-[13px] text-ink-500">
                Vous avez été invité(e) à rejoindre Atlas People.
                Connectez-vous d'abord, puis acceptez l'invitation.
              </p>
              {error && <ErrorBanner msg={error} />}
              <Button className="w-full" onClick={handleAcceptInvitation} disabled={submitting}>
                {submitting ? 'Validation…' : "Accepter l'invitation"} <ArrowRight size={15} />
              </Button>
              <button className="w-full text-center text-[12px] text-amber-deep hover:underline"
                onClick={() => setView('login')}>
                Connexion d'abord
              </button>
            </div>
          )}

          {/* ── Confirmation envois ───────────────────────────── */}
          {isBackendConfigured && (view === 'magic_sent' || view === 'reset_sent') && (
            <div className="space-y-4 text-center">
              <CheckCircle size={40} className="mx-auto text-emerald-500" />
              <h2 className="font-display text-2xl text-ink">Email envoyé</h2>
              <p className="text-[13px] text-ink-500">
                {view === 'magic_sent'
                  ? 'Vérifiez votre boîte mail et cliquez sur le lien de connexion (valable 1h).'
                  : 'Un lien de réinitialisation vous a été envoyé. Vérifiez vos spams si besoin.'}
              </p>
              <button className="text-[12px] text-amber-deep hover:underline"
                onClick={() => setView('login')}>
                Retour à la connexion
              </button>
            </div>
          )}

          {/* ── Formulaire principal ──────────────────────────── */}
          {isBackendConfigured && (view === 'login' || view === 'magic' || view === 'reset') && (
            <div className="space-y-5">
              <h2 className="text-center font-display text-2xl text-ink">
                {view === 'login' ? 'Connexion' : view === 'magic' ? 'Lien magique' : 'Réinitialiser'}
              </h2>

              {error && <ErrorBanner msg={error} />}

              <form onSubmit={view === 'login' ? handleLogin : view === 'magic' ? handleMagicLink : handleReset}
                className="space-y-4">
                {/* Email */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      type="email" required autoComplete="email"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="prenom.nom@entreprise.com"
                      className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-[13px] font-medium text-ink placeholder-ink-400 focus:border-amber-deep focus:outline-none" />
                  </div>
                </div>

                {/* Mot de passe (uniquement login) */}
                {view === 'login' && (
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-500">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                      <input
                        type={showPwd ? 'text' : 'password'} required autoComplete="current-password"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-10 text-[13px] font-medium text-ink placeholder-ink-400 focus:border-amber-deep focus:outline-none" />
                      <button type="button" onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink">
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting
                    ? 'Chargement…'
                    : view === 'login' ? 'Se connecter'
                    : view === 'magic' ? 'Envoyer le lien'
                    : 'Réinitialiser'}
                  <ArrowRight size={15} />
                </Button>
              </form>

              {/* Liens alternatifs */}
              <div className="flex flex-col items-center gap-1 border-t border-line pt-4 text-[12px]">
                {view === 'login' && (
                  <>
                    <button className="text-amber-deep hover:underline"
                      onClick={() => setView('magic')}>
                      Connexion sans mot de passe (lien magique)
                    </button>
                    <button className="text-ink-500 hover:underline"
                      onClick={() => setView('reset')}>
                      Mot de passe oublié ?
                    </button>
                  </>
                )}
                {(view === 'magic' || view === 'reset') && (
                  <button className="text-amber-deep hover:underline"
                    onClick={() => setView('login')}>
                    Retour à la connexion
                  </button>
                )}
              </div>

              {/* ── Accès démo rapide (vraie session) ─────────────── */}
              {view === 'login' && (
                <div className="space-y-2 border-t border-line pt-4">
                  <p className="text-center text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Comptes de démonstration
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {DEMO_PERSONAS.map((p) => (
                      <button key={p.email} type="button" disabled={submitting}
                        onClick={() => handleDemoLogin(p.email)}
                        className="rounded-xl border border-line bg-surface px-2 py-2 text-[11px] font-semibold text-ink transition hover:border-amber-deep hover:bg-amber/[0.05] disabled:opacity-50">
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-ink-500">
          Votre espace est géré depuis{' '}
          <a href="https://atlas.studio" className="text-amber-deep hover:underline">Atlas Studio</a>.
          {' '}Contactez votre administrateur pour un accès.
        </p>
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className={cn(
      'flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-3 py-2.5',
    )}>
      <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-600" />
      <p className="text-[12px] font-medium text-rose-700">{msg}</p>
    </div>
  );
}
