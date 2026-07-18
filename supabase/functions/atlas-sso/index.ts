/**
 * atlas-sso — Réception d'un token SSO émis par Atlas Studio Portal.
 *
 * Flow :
 *   1. Atlas Studio → edge function `app-token` → JWT signé HS256 (JWT_SECRET partagé)
 *   2. Redirection vers https://atlas-people.atlas-studio.org/auth?token=JWT
 *   3. Frontend appelle cette edge function avec le token
 *   4. On vérifie la signature, on crée/retrouve l'utilisateur, on génère un
 *      magic-link Supabase et on le retourne au frontend.
 *   5. Frontend redirige sur ce magic-link → Supabase pose la session → /accueil
 *
 * Secret requis : JWT_SECRET (secret natif du projet Supabase — partagé avec app-token)
 *
 * Sécurité :
 *   - verify_jwt: false (appel non authentifié depuis le navigateur).
 *   - CORS restreint aux origines connues (corsHeaders dynamique).
 *   - Signature HMAC-SHA256 vérifiée côté serveur.
 *   - exp obligatoire dans le payload JWT.
 *   - appId doit être 'atlas-people'.
 *   - Aucune donnée sensible journalisée.
 */
import { corsHeaders, jsonWithCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Helpers JWT ──────────────────────────────────────────────────────────────

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (padded.length % 4)) % 4;
  return Uint8Array.from(atob(padded + '='.repeat(pad)), (c) => c.charCodeAt(0));
}

async function verifyHS256(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const signingInput = `${parts[0]}.${parts[1]}`;
  const signature = b64urlDecode(parts[2]);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    new TextEncoder().encode(signingInput),
  );
  if (!valid) return null;

  try {
    return JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])));
  } catch {
    return null;
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

const APP_URL = 'https://atlas-people.atlas-studio.org';

Deno.serve(async (req) => {
  const respond = (body: unknown, status = 200) => jsonWithCors(req, body, status);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return respond({ error: 'Méthode non supportée' }, 405);

  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string') {
      return respond({ error: 'token requis' }, 400);
    }

    const secret = Deno.env.get('JWT_SECRET');
    if (!secret) {
      console.error('atlas-sso: JWT_SECRET non configuré');
      return respond({ error: 'Configuration SSO manquante' }, 500);
    }

    // 1. Vérifier la signature et extraire le payload
    const payload = await verifyHS256(token, secret);
    if (!payload) {
      return respond({ error: 'Token SSO invalide ou signature incorrecte' }, 401);
    }

    // 2. Valider le contenu — exp est obligatoire
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < now) {
      return respond({ error: 'Token SSO absent ou expiré' }, 401);
    }
    if (payload.appId !== 'atlas-people') {
      return respond({ error: "Token non destiné à Atlas People" }, 401);
    }

    const email = payload.email as string | undefined;
    const fullName = (payload.fullName as string | undefined) ?? '';
    if (!email || !email.includes('@')) {
      return respond({ error: 'Email manquant dans le token SSO' }, 400);
    }

    // 3. Créer l'utilisateur s'il n'existe pas encore
    const svc = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const { error: createErr } = await svc.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName, sso_source: 'atlas-studio' },
    });
    if (createErr && !createErr.message?.toLowerCase().includes('already')) {
      console.warn('atlas-sso createUser warn:', createErr.message);
    }

    // 4. Générer un magic-link Supabase one-time (valable ~10 min)
    const { data: linkData, error: linkErr } = await svc.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${APP_URL}/accueil` },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error('atlas-sso generateLink error:', linkErr?.message);
      return respond({ error: 'Impossible de générer le lien de connexion' }, 500);
    }

    return respond({ actionLink: linkData.properties.action_link });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne';
    console.error('atlas-sso unexpected:', msg);
    return respond({ error: msg }, 500);
  }
});
