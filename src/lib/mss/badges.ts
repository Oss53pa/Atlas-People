import { useMemo } from 'react';
import { useTimeOff } from '../../store/useTimeOff';
import { useExpenses } from '../../store/useExpenses';
import { useServiceRequests } from '../../store/useServiceRequests';
import { useDirectory } from '../../store/useDirectory';
import { useManagerScope } from '../../store/useManagerScope';
import { scopedTeamIds } from './scope';

export interface ManagerBadges {
  timeToValidate: number;     // congés / HS en attente de ma validation
  expensesToValidate: number; // NDF soumises de mon équipe
  teamRequests: number;       // sollicitations de mes N-1 (carrière, développement)
}

/** Compteurs des files de validation du manager, filtrés sur le périmètre actif (R8). */
export function useManagerBadges(): ManagerBadges {
  const depth = useManagerScope((s) => s.depth);
  const employees = useDirectory((s) => s.employees);
  const timeRequests = useTimeOff((s) => s.requests);
  const reports = useExpenses((s) => s.reports);
  const serviceRequests = useServiceRequests((s) => s.requests);

  return useMemo(() => {
    const ids = scopedTeamIds(depth, employees);
    const timeToValidate = timeRequests.filter((r) => ids.has(r.employeeId) && r.status === 'pending').length;
    const expensesToValidate = reports.filter((r) => ids.has(r.employeeId) && r.status === 'submitted').length;
    const teamRequests = serviceRequests.filter(
      (r) => ids.has(r.employeeId) && (r.category === 'career' || r.category === 'time') && (r.status === 'submitted' || r.status === 'in_progress' || r.status === 'info_requested'),
    ).length;
    return { timeToValidate, expensesToValidate, teamRequests };
  }, [depth, employees, timeRequests, reports, serviceRequests]);
}
