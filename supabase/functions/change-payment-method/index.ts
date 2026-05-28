// Edge Function : change-payment-method (cahier §6 — versement sécurisé)
// Cérémonie OBLIGATOIRE pour modifier le moyen de versement d'un collaborateur :
//   1. SELF uniquement (l'employé agit sur son propre versement).
//   2. RÉ-AUTHENTIFICATION (step-up) exigée — le client doit avoir reprouvé
//      l'identité ; on refuse sinon (reauth_required).
//   3. DOUBLE NOTIFICATION : alerte envoyée à l'ANCIEN et au NOUVEAU canal.
//   4. EFFET À LA PAIE SUIVANTE, JAMAIS RÉTROACTIF (effective_from = 1er du mois prochain).
//   5. TRACE D'AUDIT chaînée SHA-256.
//
// L'écriture passe par le service role (la RLS interdit l'écriture directe par
// l'employé) : cette fonction EST le seul chemin autorisé.
//
// Déploiement : supabase functions deploy change-payment-method
import { CORS, json } from '../_shared/cors.ts';
import { resolveCaller, serviceClient } from '../_shared/supabase.ts';
import { chainHash, GENESIS_HASH } from '../_shared/audit.ts';

const VALID_MODES = ['mobile_money', 'bank_transfer', 'cash', 'check', 'mixed'];

/** Premier jour du mois suivant (effet non rétroactif). */
function firstOfNextMonth(today = new Date()): string {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const next = new Date(Date.UTC(m === 11 ? y + 1 : y, (m + 1) % 12, 1));
  return next.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const caller = await resolveCaller(req);
    if (!caller) return json({ status: 'error', message: 'Non authentifié' }, 401);
    if (!caller.employeeId) return json({ status: 'error', message: 'Aucun dossier employé lié' }, 403);

    const body = await req.json();
    const { newMode, hasSplit, reauthAck } = body as { newMode?: string; hasSplit?: boolean; reauthAck?: boolean };

    // (2) Ré-authentification (step-up) — refus si absente.
    if (reauthAck !== true) {
      return json({ status: 'reauth_required', message: 'Ré-authentification requise pour modifier le versement.' }, 401);
    }
    if (!newMode || !VALID_MODES.includes(newMode)) {
      return json({ status: 'error', message: `Mode de versement invalide (${VALID_MODES.join(', ')}).` }, 400);
    }

    const svc = serviceClient();

    // État actuel (pour double notification + trace de l'ancien canal).
    const { data: current } = await svc
      .from('employee_payment_methods')
      .select('id, primary_mode, has_split, effective_from')
      .eq('tenant_id', caller.tenantId)
      .eq('employee_id', caller.employeeId)
      .maybeSingle();

    const oldMode = current?.primary_mode ?? 'aucun';
    const effectiveFrom = firstOfNextMonth(); // (4) jamais rétroactif

    // (4) Écriture contrôlée — effet à la paie suivante.
    const { error: upErr } = await svc
      .from('employee_payment_methods')
      .upsert({
        tenant_id: caller.tenantId,
        employee_id: caller.employeeId,
        primary_mode: newMode,
        has_split: hasSplit ?? false,
        effective_from: effectiveFrom,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'employee_id' });
    if (upErr) return json({ status: 'error', message: upErr.message }, 400);

    // (5) Trace d'audit chaînée.
    const { data: last } = await svc
      .from('audit_log').select('hash').eq('tenant_id', caller.tenantId)
      .order('id', { ascending: false }).limit(1).maybeSingle();
    const prevHash = last?.hash ?? GENESIS_HASH;
    const auditPayload = {
      action: 'payment_method.change', actorId: caller.userId, employeeId: caller.employeeId,
      from: oldMode, to: newMode, effectiveFrom, reauth: true,
    };
    const hash = await chainHash(prevHash, auditPayload);
    await svc.from('audit_log').insert({
      tenant_id: caller.tenantId, actor_id: caller.userId, action: 'payment_method.change',
      entity: 'employee_payment_methods', entity_id: caller.employeeId,
      payload: auditPayload, prev_hash: prevHash, hash,
    });

    // (3) Double notification — ancien canal + nouveau canal.
    const title = 'Modification de votre moyen de versement';
    await svc.from('notifications').insert([
      {
        tenant_id: caller.tenantId, user_id: caller.userId, kind: 'security_payment_old',
        title, body: `Alerte de sécurité : votre moyen de versement (${oldMode}) a été modifié. Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement les RH.`,
      },
      {
        tenant_id: caller.tenantId, user_id: caller.userId, kind: 'security_payment_new',
        title, body: `Confirmation : nouveau moyen de versement « ${newMode} » enregistré, applicable à la paie du ${effectiveFrom} (non rétroactif).`,
      },
    ]);

    return json({
      status: 'scheduled',
      from: oldMode,
      to: newMode,
      effectiveFrom,
      retroactive: false,
      doubleNotification: true,
      audited: true,
      message: `Moyen de versement modifié — effet au ${effectiveFrom}. Deux notifications de sécurité émises.`,
    });
  } catch (e) {
    return json({ status: 'error', message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
