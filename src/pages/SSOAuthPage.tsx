/**
 * SSOAuthPage — Réception du token SSO émis par Atlas Studio Portal.
 *
 * URL d'entrée : /auth?token=<JWT_Atlas_Studio>
 *
 * Flow :
 *   1. Extrait le token depuis ?token=
 *   2. Appelle l'edge function atlas-sso (vérification signature serveur)
 *   3. Reçoit un actionLink Supabase (magic-link one-time)
 *   4. Redirige sur ce lien → Supabase pose la session → /accueil
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase, isBackendConfigured } from '../lib/supabase';
import { Brand } from '../components/ui/Brand';

type State = 'loading' | 'error' | 'redirecting';

export function SSOAuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = params.get('token');

    if (!token) {
      setState('error');
      setErrorMsg('Paramètre token manquant dans l\'URL.');
      return;
    }

    // Validation basique du format JWT avant envoi
    if (token.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      setState('error');
      setErrorMsg('Token de connexion invalide.');
      return;
    }

    // Mode démo (pas de backend configuré) : skip SSO, aller directement
    if (!isBackendConfigured || !supabase) {
      navigate('/accueil', { replace: true });
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      setState('error');
      setErrorMsg('Configuration serveur manquante.');
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    (async () => {
      try {
        // 1. Appeler l'edge function atlas-sso
        const res = await fetch(`${supabaseUrl}/functions/v1/atlas-sso`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
          },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        if (cancelled) return;

        const data = await res.json();

        if (!res.ok || !data.actionLink) {
          throw new Error(data.error ?? 'Réponse invalide du serveur SSO');
        }

        // 2. Rediriger sur le magic-link Supabase (pose la session, puis renvoie vers /accueil)
        setState('redirecting');
        window.location.replace(data.actionLink);
      } catch (err) {
        clearTimeout(timeout);
        if (cancelled) return;
        const msg = err instanceof Error
          ? (err.name === 'AbortError' ? 'Délai dépassé — veuillez réessayer.' : err.message)
          : 'Erreur de connexion SSO';
        setState('error');
        setErrorMsg(msg);
      }
    })();

    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-5 py-12">
      <div className="max-w-sm w-full text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15">
              <svg viewBox="0 0 64 64" className="h-6 w-6">
                <path d="M32 14 L50 50 H41 L32 31 L23 50 H14 Z" fill="#C97E12" />
              </svg>
            </div>
            <Brand name="Atlas People" className="text-[22px] text-ink" />
          </div>
        </div>

        {state === 'loading' && (
          <>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber/10 border border-amber/20 mb-5">
              <Loader2 size={22} className="text-amber-deep animate-spin" strokeWidth={1.5} />
            </div>
            <h1 className="text-[18px] font-semibold text-ink mb-2">Connexion via Atlas Studio…</h1>
            <p className="text-[13px] text-ink-500">Vérification de votre accès en cours.</p>
          </>
        )}

        {state === 'redirecting' && (
          <>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-ok/10 border border-ok/20 mb-5">
              <Loader2 size={22} className="text-ok animate-spin" strokeWidth={1.5} />
            </div>
            <h1 className="text-[18px] font-semibold text-ink mb-2">Connexion établie</h1>
            <p className="text-[13px] text-ink-500">Redirection vers Atlas People…</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-error/10 border border-error/20 mb-5">
              <AlertTriangle size={22} className="text-error" strokeWidth={1.5} />
            </div>
            <h1 className="text-[18px] font-semibold text-ink mb-2">Accès refusé</h1>
            <p className="text-[13px] text-ink-500 mb-6 leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line text-[13px] font-semibold text-ink-500 hover:border-amber-deep/30 hover:text-ink transition-colors"
            >
              <ArrowLeft size={14} />
              Retour au portail Atlas Studio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
