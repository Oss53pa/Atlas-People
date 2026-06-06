/**
 * ESS — Service requests (helpdesk interne) live Supabase.
 * Table : atlas_people.service_requests
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
export { isBackendConfigured };

const DEMO = '11111111-1111-1111-1111-111111111111';
const DEMO_EMP_ID = 'e1000001-0000-0000-0000-000000000002';

export interface ServiceRequestRow {
  id: string;
  reference: string;
  request_type_code: string;
  subject: string;
  description: string;
  urgency: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  sla_deadline: string | null;
}

export function useMyServiceRequests(tenantId = DEMO, employeeId = DEMO_EMP_ID) {
  return useQuery({
    queryKey: ['ess-service-requests', tenantId, employeeId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('service_requests')
        .select('id,reference,request_type_code,subject,description,urgency,status,created_at,resolved_at,sla_deadline')
        .eq('tenant_id', tenantId)
        .eq('requester_employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ServiceRequestRow[];
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
  });
}

export function useCreateServiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      tenantId: string; employeeId: string;
      typeCode: string; subject: string; description: string; urgency: string;
    }) => {
      if (!supabase) throw new Error('Backend non configuré');
      const ref = `SR-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await supabase.schema('atlas_people').from('service_requests').insert({
        tenant_id: payload.tenantId,
        requester_employee_id: payload.employeeId,
        reference: ref,
        request_type_code: payload.typeCode,
        subject: payload.subject,
        description: payload.description,
        urgency: payload.urgency,
        status: 'submitted',
        sla_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['ess-service-requests', vars.tenantId, vars.employeeId] });
    },
  });
}
