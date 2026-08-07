/**
 * subscribe — Enregistre une demande de souscription émise depuis la landing.
 *
 * Appelée par les sous-landings produit (/produits/<slug>#souscrire), donc
 * AVANT toute session : verify_jwt = false. Sa sécurité ne repose pas sur un
 * JWT mais sur :
 *   - un CORS restreint aux origines Atlas People connues ;
 *   - une validation stricte du contenu (types, longueurs, slug au catalogue) ;
 *   - un champ piège (honeypot) que seuls les robots remplissent ;
 *   - une limitation de débit par condensat d'IP salé (jamais l'IP en clair).
 *
 * L'insertion se fait en service role : la table subscription_requests est en
 * RLS sans policy, personne d'autre ne peut y écrire ni y lire.
 *
 * Secret optionnel : SUBSCRIBE_IP_SALT (sel du condensat d'IP). Sans lui, la
 * limitation de débit est désactivée plutôt que d'utiliser un sel deviné.
 */
import { corsHeaders, jsonWithCors } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';

// Catalogue produit — doit rester aligné sur src/app/products.ts.
const PRODUCTS: Record<string, string> = {
  core: 'entreprise',
  conseil: 'cabinet_complet',
  payroll: 'cabinet_paie',
  '360': 'cabinet_mixte',
  placement: 'cabinet_agence',
};

const MAX_PER_IP_PER_HOUR = 5;

interface Payload {
  produit?: unknown;
  nom?: unknown;
  email?: unknown;
  entreprise?: unknown;
  effectif?: unknown;
  pays?: unknown;
  message?: unknown;
  /** Champ piège : invisible pour un humain, rempli par les robots. */
  site?: unknown;
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Valide et normalise la demande. Renvoie l'erreur utilisateur, ou la ligne. */
function parse(payload: Payload): { error: string } | { row: Record<string, string | null> } {
  const produit = str(payload.produit).toLowerCase();
  const tenantType = PRODUCTS[produit];
  if (!tenantType) return { error: 'Produit inconnu.' };

  const nom = str(payload.nom);
  if (nom.length < 2 || nom.length > 120) return { error: 'Nom complet requis.' };

  const email = str(payload.email).toLowerCase();
  // Volontairement permissif : on écarte l'absurde, on ne prétend pas
  // valider l'existence d'une adresse — seul un envoi le prouverait.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 190) {
    return { error: 'Email professionnel invalide.' };
  }

  const entreprise = str(payload.entreprise);
  if (entreprise.length < 2 || entreprise.length > 160) return { error: 'Entreprise requise.' };

  const effectif = str(payload.effectif).slice(0, 40);
  const pays = str(payload.pays).slice(0, 80);
  const message = str(payload.message).slice(0, 4000);

  return {
    row: {
      product_slug: produit,
      tenant_type: tenantType,
      full_name: nom,
      email,
      company: entreprise,
      headcount: effectif || null,
      country: pays || null,
      message: message || null,
    },
  };
}

/** Condensat salé de l'IP appelante — null si aucun sel n'est configuré. */
async function hashIp(req: Request): Promise<string | null> {
  const salt = Deno.env.get('SUBSCRIBE_IP_SALT');
  if (!salt) return null;
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  if (!ip) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const respond = (body: unknown, status = 200) => jsonWithCors(req, body, status);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return respond({ error: 'Méthode non supportée' }, 405);

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return respond({ error: 'Requête illisible.' }, 400);
  }

  // Champ piège : on répond comme si tout allait bien, sans rien écrire —
  // un robot informé de son échec réessaie autrement.
  if (str(payload.site)) return respond({ ok: true });

  const parsed = parse(payload);
  if ('error' in parsed) return respond({ error: parsed.error }, 400);

  try {
    const supa = serviceClient();
    const ipHash = await hashIp(req);

    if (ipHash) {
      const since = new Date(Date.now() - 3600_000).toISOString();
      const { count } = await supa
        .from('subscription_requests')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', since);
      if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) {
        return respond({ error: 'Trop de demandes envoyées. Réessayez dans une heure.' }, 429);
      }
    }

    const { data, error } = await supa
      .from('subscription_requests')
      .insert({ ...parsed.row, ip_hash: ipHash })
      .select('id')
      .single();

    if (error) throw error;
    // La référence permet au demandeur de citer sa demande ; elle ne donne
    // accès à rien (la table n'est lisible par aucun rôle client).
    return respond({ ok: true, reference: String(data.id).slice(0, 8).toUpperCase() });
  } catch (err) {
    console.error('subscribe: échec enregistrement', err instanceof Error ? err.message : err);
    return respond({ error: 'Enregistrement impossible pour le moment.' }, 500);
  }
});
