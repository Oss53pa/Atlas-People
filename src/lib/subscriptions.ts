/**
 * Souscription — envoi d'une demande depuis la landing publique.
 *
 * La demande est enregistrée par l'edge function `subscribe` (table
 * atlas_people.subscription_requests, écriture en service role). Le client
 * valide d'abord localement pour rendre l'erreur immédiate ; la validation
 * de référence reste celle du serveur, qui ne fait confiance à rien.
 *
 * Sans backend configuré (mode démo), aucune demande ne peut être enregistrée :
 * l'appelant est prévenu par `backendUnavailable` et retombe sur l'email.
 */
import { isBackendConfigured } from './supabase';

export interface SubscriptionInput {
  produit: string;
  nom: string;
  email: string;
  entreprise: string;
  effectif?: string;
  pays?: string;
  message?: string;
}

export type SubscriptionResult =
  | { ok: true; reference: string | null }
  | { ok: false; error: string; backendUnavailable?: true };

/**
 * Validation locale — mêmes règles que l'edge function, en plus court.
 * Renvoie le premier message d'erreur, ou null si la demande est envoyable.
 */
export function validateSubscription(input: SubscriptionInput): string | null {
  if (!input.produit.trim()) return 'Produit manquant.';
  if (input.nom.trim().length < 2) return 'Indiquez votre nom complet.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email.trim())) return 'Email professionnel invalide.';
  if (input.entreprise.trim().length < 2) return 'Indiquez le nom de votre entreprise.';
  if ((input.message ?? '').length > 4000) return 'Message trop long (4 000 caractères maximum).';
  return null;
}

export async function submitSubscription(input: SubscriptionInput): Promise<SubscriptionResult> {
  const invalid = validateSubscription(input);
  if (invalid) return { ok: false, error: invalid };

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!isBackendConfigured || !url || !anonKey) {
    return { ok: false, error: 'Enregistrement indisponible.', backendUnavailable: true };
  }

  try {
    const res = await fetch(`${url}/functions/v1/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey },
      body: JSON.stringify({
        produit: input.produit,
        nom: input.nom.trim(),
        email: input.email.trim(),
        entreprise: input.entreprise.trim(),
        effectif: input.effectif ?? '',
        pays: input.pays ?? '',
        message: input.message ?? '',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: typeof data.error === 'string' ? data.error : 'Enregistrement impossible pour le moment.' };
    }
    return { ok: true, reference: typeof data.reference === 'string' ? data.reference : null };
  } catch {
    // Réseau coupé, CORS, fonction indisponible : on ne perd pas la demande,
    // l'appelant propose l'email en repli.
    return { ok: false, error: 'Service injoignable.', backendUnavailable: true };
  }
}

/** Lien mailto de repli, pré-rempli — utilisé quand l'enregistrement échoue. */
export function subscriptionMailto(input: SubscriptionInput, productName: string, contactEmail: string): string {
  const body = [
    `Produit souhaité : ${productName}`,
    '',
    `Nom complet     : ${input.nom || '—'}`,
    `Email pro       : ${input.email || '—'}`,
    `Entreprise      : ${input.entreprise || '—'}`,
    `Effectif        : ${input.effectif || '—'}`,
    `Pays OHADA      : ${input.pays || '—'}`,
    '',
    'Message :',
    input.message || '—',
  ].join('\n');

  return `mailto:${contactEmail}`
    + `?subject=${encodeURIComponent(`Souscription ${productName}`)}`
    + `&body=${encodeURIComponent(body)}`;
}
