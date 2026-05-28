import { create } from 'zustand';

/** S9 — Mon courrier (correspondance officielle). Persistant, traçable, jamais
 *  supprimable (conservation légale). Preuve de lecture & signature. */
export type CorrespondenceStatus = 'unread' | 'read' | 'action_required' | 'signed' | 'acknowledged' | 'archived';

export interface Correspondence {
  id: string;
  reference: string;
  employeeId: string;
  type: string;
  typeLabel: string;
  subject: string;
  body: string;
  senderType: 'hr' | 'drh' | 'manager' | 'direction' | 'occupational_doctor' | 'payroll' | 'system';
  senderName: string;
  status: CorrespondenceStatus;
  deliveredAt: string;
  firstReadAt?: string;
  requiresSignature?: boolean;
  requiresAcknowledgment?: boolean;
  requiresAttendance?: boolean;
  signedAt?: string;
  acknowledgedAt?: string;
  attendanceConfirmedAt?: string;
}

const SEED: Correspondence[] = [
  { id: 'cur1', reference: 'CUR-2026-0210', employeeId: 'e2', type: 'CUR-AVENANT', typeLabel: 'Avenant à signer', subject: 'Avenant — augmentation salariale', body: 'Votre avenant au contrat de travail (révision de la rémunération de base) est à signer électroniquement. Effet au 1er juillet 2026.', senderType: 'drh', senderName: 'Direction RH', status: 'action_required', deliveredAt: '2026-05-25', requiresSignature: true },
  { id: 'cur2', reference: 'CUR-2026-0205', employeeId: 'e2', type: 'CUR-CONVOC-MED', typeLabel: 'Convocation visite médicale', subject: 'Visite médicale périodique', body: 'Vous êtes convoqué(e) à une visite médicale périodique le 12 juin 2026 à 10h00 auprès du Dr Aya Coulibaly.', senderType: 'occupational_doctor', senderName: 'Médecine du travail', status: 'unread', deliveredAt: '2026-05-22', requiresAttendance: true },
  { id: 'cur3', reference: 'CUR-2026-0198', employeeId: 'e2', type: 'CUR-BULLETIN', typeLabel: 'Bulletin de paie', subject: 'Bulletin de paie — Mai 2026', body: 'Votre bulletin de paie de mai 2026 est disponible. Consultez-le dans « Ma paie ».', senderType: 'payroll', senderName: 'Service Paie', status: 'read', deliveredAt: '2026-05-25', firstReadAt: '2026-05-25T18:30:00' },
  { id: 'cur4', reference: 'CUR-2026-0181', employeeId: 'e2', type: 'CUR-COMM-DIR', typeLabel: 'Communication Direction', subject: 'Note de service — congés d\'été', body: 'La période de prise des congés d\'été s\'étend du 1er juillet au 30 septembre. Merci de poser vos demandes avant le 15 juin.', senderType: 'direction', senderName: 'Direction Générale', status: 'read', deliveredAt: '2026-05-12', firstReadAt: '2026-05-13T08:10:00' },
];

interface State {
  items: Correspondence[];
  markRead: (id: string) => void;
  sign: (id: string) => void;
  acknowledge: (id: string) => void;
  confirmAttendance: (id: string) => void;
  archive: (id: string) => void;
  byEmployee: (employeeId: string) => Correspondence[];
}

const now = () => new Date().toISOString();

export const useCorrespondence = create<State>((set, get) => ({
  items: SEED,
  markRead: (id) => set((s) => ({ items: s.items.map((c) => (c.id === id && c.status === 'unread' ? { ...c, status: c.requiresSignature || c.requiresAcknowledgment || c.requiresAttendance ? 'action_required' : 'read', firstReadAt: c.firstReadAt ?? now() } : c)) })),
  sign: (id) => set((s) => ({ items: s.items.map((c) => (c.id === id ? { ...c, status: 'signed', signedAt: now() } : c)) })),
  acknowledge: (id) => set((s) => ({ items: s.items.map((c) => (c.id === id ? { ...c, status: 'acknowledged', acknowledgedAt: now() } : c)) })),
  confirmAttendance: (id) => set((s) => ({ items: s.items.map((c) => (c.id === id ? { ...c, status: 'acknowledged', attendanceConfirmedAt: now() } : c)) })),
  archive: (id) => set((s) => ({ items: s.items.map((c) => (c.id === id ? { ...c, status: 'archived', archivedAt: now() } as Correspondence : c)) })),
  byEmployee: (employeeId) => get().items.filter((c) => c.employeeId === employeeId),
}));
