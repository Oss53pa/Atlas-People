// ════════════════════════════════════════════════════════════════════
// Edge Function — send-invitation-email
//
// Crée une invitation dans atlas_people.tenant_invitations + envoie
// l'email portant le lien /login?token=... via Supabase Auth admin.
//
// Rôle requis : hr | admin | super_admin
// Méthode     : POST
// Body        : { email: string, role?: string, display_name?: string }
// Réponse     : { ok: true } | { ok: true, invite_url: string } (user existant)
// ════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { json, corsHeaders } from '../_shared/cors.ts';
import { serviceClient, resolveCaller, isHrOrAdmin } from '../_shared/supabase.ts';

const VALID_ROLES = ['super_admin', 'admin', 'hr', 'manager', 'employee'];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }
  if (req.method !== 'POST') return json({ error: 'Méthode non supportée' }, 405);

  try {
    const caller = await resolveCaller(req);
    if (!caller) return json({ error: 'Non authentifié' }, 401);
    if (!isHrOrAdmin(caller)) return json({ error: 'Accès refusé — rôle hr/admin requis' }, 403);

    const body = await req.json();
    const email: string = (body.email ?? '').toLowerCase().trim();
    const role: string  = VALID_ROLES.includes(body.role) ? body.role : 'employee';
    const displayName: string = body.display_name ?? email.split('@')[0];

    if (!email || !email.includes('@')) {
      return json({ error: 'Adresse email invalide' }, 400);
    }

    const svc = serviceClient();

    // 1) Créer l'invitation en DB (nouveau token à chaque appel)
    const { data: inv, error: invErr } = await svc
      .schema('atlas_people')
      .from('tenant_invitations')
      .insert({
        tenant_id:  caller.tenantId,
        email,
        role,
        invited_by: caller.userId,
      })
      .select('token')
      .single();

    if (invErr) throw new Error(`DB invitation: ${invErr.message}`);

    // 2) Construire le lien d'invitation (redirige vers LoginPage avec token)
    const origin = req.headers.get('origin') ?? 'https://atlas-people.atlas-studio.org';
    const inviteUrl = `${origin}/login?token=${inv.token}`;

    // 3) Mettre à jour le roster d'affichage
    await svc
      .schema('atlas_people')
      .from('tenant_members')
      .upsert(
        { tenant_id: caller.tenantId, email, display_name: displayName, role },
        { onConflict: 'tenant_id,email' },
      );

    // 4a) Nouvel utilisateur — inviteUserByEmail gère création + envoi email
    const { error: authErr } = await svc.auth.admin.inviteUserByEmail(email, {
      redirectTo: inviteUrl,
    });

    if (!authErr) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // 4b) Utilisateur déjà enregistré → magic-link one-time
    const alreadyExists =
      authErr.message.includes('already been registered') ||
      authErr.message.includes('already exists') ||
      authErr.message.includes('email address is already registered');

    if (!alreadyExists) throw new Error(`Auth invite: ${authErr.message}`);

    const { data: linkData, error: linkErr } = await svc.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: inviteUrl },
    });

    if (linkErr) {
      // Fallback : retourner le lien brut pour que l'admin le partage manuellement
      return new Response(
        JSON.stringify({ ok: true, invite_url: inviteUrl, note: 'Lien à partager manuellement (utilisateur existant)' }),
        { status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
      );
    }

    // linkData.properties.action_link contient le magic-link Supabase signé
    return new Response(
      JSON.stringify({
        ok: true,
        invite_url: linkData?.properties?.action_link ?? inviteUrl,
        note: "Lien signé à transmettre à l'utilisateur existant",
      }),
      { status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('[send-invitation-email]', err);
    return json({ error: String(err) }, 500);
  }
});
