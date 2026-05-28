import { create } from 'zustand';

/** S8 — Mes demandes (helpdesk RH employé). Tickets + fil de conversation. */
export type RequestCategory = 'document' | 'remuneration' | 'time' | 'career' | 'administrative' | 'rgpd';
export type RequestStatus = 'submitted' | 'in_progress' | 'info_requested' | 'resolved' | 'closed' | 'refused';

export interface RequestMessage {
  id: string;
  author: 'employee' | 'hr_agent' | 'system';
  authorName: string;
  content: string;
  at: string;
}

export interface ServiceRequest {
  id: string;
  reference: string;
  employeeId: string;
  typeCode: string;
  typeLabel: string;
  category: RequestCategory;
  subject: string;
  description: string;
  urgency: 'normal' | 'important' | 'urgent';
  status: RequestStatus;
  referent: string;
  createdAt: string;
  slaHours: number;
  messages: RequestMessage[];
  actionRequired?: string;
  satisfaction?: number;
}

const SEED: ServiceRequest[] = [
  {
    id: 'req1', reference: 'REQ-2026-0142', employeeId: 'e2', typeCode: 'DOC-ATT-SAL', typeLabel: 'Attestation de salaire', category: 'document',
    subject: 'Démarches banque', description: 'J\'ai besoin d\'une attestation de salaire pour un dossier de prêt immobilier.', urgency: 'normal',
    status: 'in_progress', referent: 'Valentina Okou', createdAt: '2026-05-26', slaHours: 48,
    messages: [
      { id: 'm1', author: 'employee', authorName: 'Kouadio', content: 'Bonjour, pourriez-vous m\'établir une attestation de salaire des 3 derniers mois ?', at: '2026-05-26T09:12:00' },
      { id: 'm2', author: 'hr_agent', authorName: 'Valentina Okou', content: 'Bonjour, je prépare cela. Vous l\'aurez sous 48h dans « Mon courrier ».', at: '2026-05-26T10:40:00' },
    ],
  },
  {
    id: 'req2', reference: 'REQ-2026-0138', employeeId: 'e2', typeCode: 'REM-PRET', typeLabel: 'Demande de prêt employeur', category: 'remuneration',
    subject: 'Achat véhicule', description: 'Demande de prêt pour l\'achat d\'un véhicule (2 500 000 FCFA sur 24 mois).', urgency: 'important',
    status: 'info_requested', referent: 'Valentina Okou', createdAt: '2026-05-22', slaHours: 240,
    actionRequired: 'Veuillez joindre une copie du devis du vendeur.',
    messages: [
      { id: 'm3', author: 'employee', authorName: 'Kouadio', content: 'Je souhaite un prêt véhicule.', at: '2026-05-22T14:00:00' },
      { id: 'm4', author: 'hr_agent', authorName: 'Valentina Okou', content: 'Merci. Pour instruire votre dossier, merci de joindre le devis du vendeur.', at: '2026-05-23T08:30:00' },
    ],
  },
  {
    id: 'req3', reference: 'REQ-2026-0125', employeeId: 'e2', typeCode: 'TPS-INFO-SOLDE', typeLabel: 'Question sur mon solde de congés', category: 'time',
    subject: 'Calcul congés', description: 'Pourquoi mon solde affiche 12,5 jours ?', urgency: 'normal',
    status: 'resolved', referent: 'Valentina Okou', createdAt: '2026-05-12', slaHours: 120, satisfaction: 5,
    messages: [
      { id: 'm5', author: 'employee', authorName: 'Kouadio', content: 'Comment est calculé mon solde ?', at: '2026-05-12T11:00:00' },
      { id: 'm6', author: 'hr_agent', authorName: 'Valentina Okou', content: 'Acquisition 2,2 j/mois + majorations − jours pris. Détail dans « Mes congés ».', at: '2026-05-12T15:20:00' },
    ],
  },
];

interface State {
  requests: ServiceRequest[];
  create: (r: ServiceRequest) => void;
  addMessage: (id: string, m: RequestMessage) => void;
  rate: (id: string, score: number) => void;
  byEmployee: (employeeId: string) => ServiceRequest[];
}

export const useServiceRequests = create<State>((set, get) => ({
  requests: SEED,
  create: (r) => set((s) => ({ requests: [r, ...s.requests] })),
  addMessage: (id, m) => set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, messages: [...r.messages, m] } : r)) })),
  rate: (id, score) => set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, satisfaction: score } : r)) })),
  byEmployee: (employeeId) => get().requests.filter((r) => r.employeeId === employeeId),
}));
