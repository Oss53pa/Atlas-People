/**
 * Alertes d'expiration (M1.7) : pièce d'identité, titre de séjour, visite
 * médicale, fin de période d'essai, fin de CDD. Seuils J-60 / J-30 / J-7.
 */
export type AlertUrgency = 'critical' | 'soon' | 'upcoming';

export interface ExpiryAlert {
  label: string;
  date: string;
  daysLeft: number;
  urgency: AlertUrgency;
}

function urgencyFor(daysLeft: number): AlertUrgency | null {
  if (daysLeft <= 7) return 'critical'; // inclut déjà expiré (négatif)
  if (daysLeft <= 30) return 'soon';
  if (daysLeft <= 60) return 'upcoming';
  return null; // hors fenêtre d'alerte
}

export function buildExpiryAlert(label: string, dateISO: string | undefined, asOf = new Date()): ExpiryAlert | null {
  if (!dateISO) return null;
  const daysLeft = Math.round((new Date(`${dateISO}T00:00:00`).getTime() - asOf.getTime()) / 86_400_000);
  const urgency = urgencyFor(daysLeft);
  if (!urgency) return null;
  return { label, date: dateISO, daysLeft, urgency };
}

export const URGENCY_TONE: Record<AlertUrgency, 'danger' | 'warn' | 'info'> = {
  critical: 'danger',
  soon: 'warn',
  upcoming: 'info',
};
