/**
 * Expenses — couche live Supabase (CDC Lot 1 §5.3).
 * Table : atlas_people.expense_claims
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError, NoRowsAffectedError } from '../session';
import { appendAuditEntry } from '../auditLog';
export { isBackendConfigured };

const DEMO = '11111111-1111-1111-1111-111111111111';

export interface ExpenseClaimRow {
  id: string;
  tenant_id: string;
  employee_id: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  receipt_url: string | null;
  created_at: string;
  employee_first_name?: string;
  employee_last_name?: string;
}

export function useExpenseClaims(tenantId = DEMO) {
  return useQuery({
    queryKey: ['expense-claims', tenantId],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.schema('atlas_people')
        .from('expense_claims')
        .select(`
          id, tenant_id, employee_id, amount, currency, category,
          status, receipt_url, created_at,
          employees!employee_id(first_name, last_name)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const emp = r['employees'] as Record<string, string> | null;
        return {
          ...r,
          employee_first_name: emp?.first_name,
          employee_last_name: emp?.last_name,
        } as ExpenseClaimRow;
      });
    },
    enabled: isBackendConfigured,
    staleTime: 30_000,
  });
}

/** Soumet une nouvelle note de frais pour l'employé courant. */
export function useSubmitExpenseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      category,
      amount,
      hasReceipt,
      currency = 'XOF',
    }: {
      category: string;
      amount: number;
      hasReceipt: boolean;
      currency?: string;
    }): Promise<string> => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const id = crypto.randomUUID();
      const { error } = await sb.schema('atlas_people').from('expense_claims').insert({
        id,
        tenant_id: ctx.tenantId,
        employee_id: ctx.employeeId,
        amount: Math.round(amount),
        currency,
        category,
        status: 'pending',
        receipt_url: hasReceipt ? 'ocr:provided' : null,
      });
      if (error) throw mapSupabaseError(error);
      await appendAuditEntry({
        tenantId: ctx.tenantId, actorId: ctx.userId, action: 'expense.submit',
        entity: 'expense_claims', entityId: id,
        payload: { category, currency },
        surface: 'backoffice',
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense-claims'] }),
  });
}

/** Décision RH/manager sur une note de frais (approved | refused). */
export function useDecideExpenseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      decision,
      tenantId,
    }: {
      claimId: string;
      decision: 'approved' | 'refused';
      tenantId: string;
    }) => {
      const sb = getSupabaseOrThrow();
      const ctx = await resolveSessionContext();
      const { data, error } = await sb.schema('atlas_people').from('expense_claims')
        .update({ status: decision })
        .eq('id', claimId).eq('tenant_id', tenantId)
        .select('id');
      if (error) throw mapSupabaseError(error);
      if (!data || data.length === 0) throw new NoRowsAffectedError('decideExpenseClaim');
      await appendAuditEntry({
        tenantId, actorId: ctx.userId, action: `expense.${decision}`,
        entity: 'expense_claims', entityId: claimId,
        payload: { decision },
        surface: 'backoffice',
      });
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['expense-claims', vars.tenantId] }),
  });
}
