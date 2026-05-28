import { create } from 'zustand';

export interface ModifRequest {
  id: string;
  employeeId: string;
  fieldLabel: string;
  currentValue: string;
  proposedValue: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
}

interface RequestsState {
  requests: ModifRequest[];
  propose: (r: Omit<ModifRequest, 'id' | 'status' | 'createdAt'>) => void;
  decide: (id: string, status: 'approved' | 'rejected', reason?: string) => void;
}

// Demandes de modification (P1.7 → P1.8), en mémoire pour la démo.
export const useRequests = create<RequestsState>((set) => ({
  requests: [
    { id: 'r1', employeeId: 'e10', fieldLabel: 'Téléphone principal', currentValue: '+225 07 ••• •• 12', proposedValue: '+225 07 88 45 30 11', status: 'pending', createdAt: '2026-05-24' },
    { id: 'r2', employeeId: 'e5', fieldLabel: 'Adresse', currentValue: 'Dakar, Plateau', proposedValue: 'Dakar, Almadies — Rue 12', status: 'pending', createdAt: '2026-05-25' },
  ],
  propose: (r) =>
    set((s) => ({
      requests: [
        { ...r, id: `r-${Date.now()}`, status: 'pending', createdAt: new Date().toISOString().slice(0, 10) },
        ...s.requests,
      ],
    })),
  decide: (id, status, reason) =>
    set((s) => ({ requests: s.requests.map((x) => (x.id === id ? { ...x, status, reason } : x)) })),
}));
