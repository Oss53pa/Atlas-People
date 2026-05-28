/** M10 — Paramètres manager. Données de démo + règles dures délégations.
 *  Règles dures (11 §2.6) : max 90 j ; délégué = manager de niveau ≥ ; actions
 *  non déléguables par défaut (évaluations, fin d'essai, recrutements) ;
 *  audit fort (decided_by + delegated_by + audit_hash) ; N-1 notifiés. */

export const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
export function daysBetween(a: string, b: string) { return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000); }
export const MAX_DELEGATION_DAYS = 90;

// ---------------- PAR.1 — Notifications ----------------
export type Channel = 'push' | 'email' | 'sms' | 'whatsapp' | 'inapp';
export const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'push', label: 'Push' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'inapp', label: 'In-app' },
];
export interface NotifEvent { key: string; label: string; defaults: Channel[] }
export const NOTIF_EVENTS: NotifEvent[] = [
  { key: 'leave_new', label: 'Nouvelle demande de congé', defaults: ['push', 'inapp'] },
  { key: 'leave_urgent', label: 'Demande de congé urgente (J-1)', defaults: ['push', 'email', 'whatsapp', 'inapp'] },
  { key: 'ot_new', label: 'Nouvelle déclaration HS', defaults: ['email', 'inapp'] },
  { key: 'expense_new', label: 'Nouvelle note de frais', defaults: ['email', 'inapp'] },
  { key: 'training_req', label: 'Demande de formation', defaults: ['email', 'inapp'] },
  { key: 'clock_anomaly', label: 'Anomalie pointage détectée', defaults: ['push', 'inapp'] },
  { key: 'ot_over', label: 'Dépassement HS', defaults: ['push', 'email', 'inapp'] },
  { key: 'turnover_risk', label: 'Risque turn-over Proph3t', defaults: ['email', 'inapp'] },
  { key: 'probation_soon', label: 'Fin période d’essai approche (J-7)', defaults: ['push', 'email', 'inapp'] },
  { key: 'selfeval', label: 'Auto-évaluation reçue', defaults: ['email', 'inapp'] },
  { key: 'eval_due', label: 'Évaluation à rédiger (échéance)', defaults: ['push', 'email', 'inapp'] },
  { key: 'oneonone_late', label: '1:1 en retard (>10j)', defaults: ['email', 'inapp'] },
  { key: 'ritual_over', label: 'Rituel managérial dépassé', defaults: ['inapp'] },
  { key: 'climate_alert', label: 'Alerte climat (engagement chute)', defaults: ['email', 'inapp'] },
  { key: 'signal_new', label: 'Signalement reçu', defaults: ['push', 'email', 'inapp'] },
  { key: 'conflict_new', label: 'Conflit planning détecté', defaults: ['push', 'inapp'] },
  { key: 'delegation', label: 'Délégation à accepter / révoquée', defaults: ['push', 'email', 'inapp'] },
  { key: 'mail_new', label: 'Nouveau courrier managérial', defaults: ['email', 'inapp'] },
  { key: 'committee', label: 'Convocation comité direction', defaults: ['push', 'email', 'inapp'] },
];

// ---------------- PAR.2 — Délégations ----------------
export type DelegationStatus = 'pending' | 'accepted' | 'active' | 'expired' | 'revoked' | 'declined';
export interface DelegationScopeItem { key: string; label: string; recommendedOff?: boolean }
export const DELEGATION_SCOPE: DelegationScopeItem[] = [
  { key: 'leave', label: 'Congés équipe' },
  { key: 'ot', label: 'Heures supplémentaires' },
  { key: 'expense', label: 'Notes de frais' },
  { key: 'training', label: 'Demandes de formation' },
  { key: 'requests', label: 'Demandes équipe (RDV, signalements)' },
  { key: 'eval', label: 'Évaluations annuelles', recommendedOff: true },
  { key: 'recruit', label: 'Recrutements', recommendedOff: true },
  { key: 'probation', label: 'Décisions fin de période d’essai', recommendedOff: true },
];
export const DELEGATION_REASONS = ['Vacances', 'Mission', 'Formation', 'Maladie', 'Autre'];
export interface Delegate { id: string; name: string; relation: string }
export const DELEGATE_SUGGESTIONS: Delegate[] = [
  { id: 'p1', name: 'Marie SAMAKÉ', relation: 'Pair manager, même périmètre' },
  { id: 'p2', name: 'Cheick DIALLO', relation: 'Mon N+1' },
];
export interface Delegation {
  id: string; from: string; to: string; toRelation: string; reason: string;
  scope: string[]; status: DelegationStatus; message?: string;
}
export const SEED_DELEGATIONS: Delegation[] = [
  { id: 'dg1', from: '2026-07-15', to: '2026-07-31', toRelation: 'Pair manager', reason: 'Vacances', scope: ['leave', 'ot', 'expense'], status: 'accepted', message: 'Marie a accepté le 28/05.' },
];
export const DELEGATION_HISTORY = [
  { period: '15/04 – 22/04/2026', who: 'Marie SAMAKÉ', reason: 'Vacances' },
  { period: '03/02 – 07/02/2026', who: 'Cheick DIALLO', reason: 'Mission' },
];
export const DELEGATION_STATUS_META: Record<DelegationStatus, { label: string; tone: 'ok' | 'warn' | 'info' | 'neutral' | 'danger' }> = {
  pending: { label: 'En attente d’acceptation', tone: 'warn' },
  accepted: { label: 'Acceptée — programmée', tone: 'info' },
  active: { label: 'Active', tone: 'ok' },
  expired: { label: 'Terminée', tone: 'neutral' },
  revoked: { label: 'Révoquée', tone: 'danger' },
  declined: { label: 'Refusée', tone: 'danger' },
};

// ---------------- PAR.3 — Vue équipe ----------------
export const TEAM_VIEW_COLUMNS = [
  { key: 'photo', label: 'Photo', on: true },
  { key: 'name', label: 'Nom complet', on: true },
  { key: 'role', label: 'Poste', on: true },
  { key: 'site', label: 'Site', on: true },
  { key: 'status', label: 'Statut', on: true },
  { key: 'seniority', label: 'Ancienneté', on: false },
  { key: 'manager', label: 'Manager direct', on: false },
  { key: 'leave', label: 'Solde congés', on: false },
  { key: 'okr', label: 'Avancement OKR', on: false },
  { key: 'lastoneonone', label: 'Date dernier 1:1', on: false },
];

// ---------------- PAR.5 — Modèles ----------------
export interface TemplateGroup { title: string; items: { label: string; mine: boolean }[] }
export const TEMPLATE_GROUPS: TemplateGroup[] = [
  { title: 'Modèles 1:1', items: [{ label: 'Trame 1:1 standard (par défaut)', mine: false }, { label: 'Trame 1:1 mensuel', mine: true }] },
  { title: 'Modèles feedback', items: [{ label: 'Trame feedback constructif', mine: true }] },
  { title: 'Modèles entretien', items: [{ label: 'Trame entretien embauche (équipe)', mine: false }, { label: 'Trame entretien mi-période d’essai', mine: true }] },
  { title: 'Modèles communication équipe', items: [{ label: 'Message d’annonce changement', mine: true }, { label: 'Compte-rendu réunion équipe', mine: false }] },
];
