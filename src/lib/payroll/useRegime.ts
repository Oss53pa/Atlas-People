/**
 * useRegime — hook React qui résout le régime de paie d'un pays.
 *
 * Priorité :
 *   1. Config personnalisée dans Supabase (table payroll_regime_configs du tenant)
 *   2. Fallback sur le régime statique compilé (CI, SN uniquement pour l'instant)
 *
 * En mode démo (pas de Supabase) → régimes statiques directement.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAuth } from '../auth';
import { getRegime, REGIME_CI } from './regimes';
import type { Regime, Contribution, TaxBracket, EmployerTax } from './types';

// ── Types DB ──────────────────────────────────────────────────────────

interface DbRegimeConfig {
  id: string;
  tenant_id: string;
  country_code: string;
  country_name: string;
  zone: 'UEMOA' | 'CEMAC';
  currency: 'XOF' | 'XAF';
  social_fund: string;
  version: string;
  effective_from: string;
  income_tax_code: string;
  income_tax_label: string;
  abatement_bps: number;
}

interface DbContribution {
  sort_order: number;
  code: string;
  label: string;
  base_type: 'gross' | 'capped';
  ceiling: number | null;
  employee_bps: number;
  employer_bps: number;
  account_employee: string | null;
  account_employer: string | null;
}

interface DbBracket {
  sort_order: number;
  up_to: number | null;
  rate_bps: number;
}

interface DbEmployerTax {
  sort_order: number;
  code: string;
  label: string;
  rate_bps: number;
  account: string | null;
}

// ── Mapping DB → Regime ───────────────────────────────────────────────

function mapToRegime(
  cfg: DbRegimeConfig,
  contribs: DbContribution[],
  brackets: DbBracket[],
  employerTaxes: DbEmployerTax[],
): Regime {
  const contributions: Contribution[] = contribs
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      code: c.code,
      label: c.label,
      base: c.base_type,
      ceiling: c.ceiling ? Math.round(c.ceiling / 100) : undefined,
      employeeBps: c.employee_bps,
      employerBps: c.employer_bps,
      accounts: {
        employee: c.account_employee ?? undefined,
        employer: c.account_employer ?? undefined,
      },
    }));

  const taxBrackets: TaxBracket[] = brackets
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((b) => ({
      upTo: b.up_to ? Math.round(b.up_to / 100) : null,
      bps: b.rate_bps,
    }));

  const empTaxes: EmployerTax[] = employerTaxes
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((t) => ({
      code: t.code,
      label: t.label,
      bps: t.rate_bps,
      account: t.account ?? '637000',
    }));

  return {
    countryCode: cfg.country_code,
    countryName: cfg.country_name,
    zone: cfg.zone,
    currency: cfg.currency,
    socialFund: cfg.social_fund,
    version: cfg.version,
    effectiveFrom: cfg.effective_from,
    contributions,
    incomeTax: {
      code: cfg.income_tax_code,
      label: cfg.income_tax_label,
      abatementBps: cfg.abatement_bps,
      brackets: taxBrackets,
    },
    employerTaxes: empTaxes,
  };
}

// ── Fetch depuis Supabase ─────────────────────────────────────────────

async function fetchRegimeFromDB(tenantId: string, countryCode: string): Promise<Regime | null> {
  if (!supabase) return null;

  const { data: cfg, error } = await supabase
    .schema('atlas_people')
    .from('payroll_regime_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .single();

  if (error || !cfg) return null;

  const regimeId = (cfg as DbRegimeConfig).id;

  const [{ data: contribs }, { data: brackets }, { data: empTaxes }] = await Promise.all([
    supabase.schema('atlas_people').from('payroll_contributions')
      .select('*').eq('regime_id', regimeId).eq('is_active', true).order('sort_order'),
    supabase.schema('atlas_people').from('payroll_tax_brackets')
      .select('*').eq('regime_id', regimeId).order('sort_order'),
    supabase.schema('atlas_people').from('payroll_employer_taxes')
      .select('*').eq('regime_id', regimeId).eq('is_active', true).order('sort_order'),
  ]);

  return mapToRegime(
    cfg as DbRegimeConfig,
    (contribs ?? []) as DbContribution[],
    (brackets ?? []) as DbBracket[],
    (empTaxes ?? []) as DbEmployerTax[],
  );
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useRegime(countryCode: string): { regime: Regime; loading: boolean } {
  const { tenantId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-regime', tenantId, countryCode],
    queryFn: () => fetchRegimeFromDB(tenantId!, countryCode),
    enabled: Boolean(tenantId && supabase),
    staleTime: 5 * 60_000, // 5 min — les taux ne changent pas souvent
  });

  // Fallback : régimes statiques compilés (CI / SN)
  let staticFallback: Regime;
  try {
    staticFallback = getRegime(countryCode);
  } catch {
    staticFallback = REGIME_CI; // dernier recours
  }

  return {
    regime: data ?? staticFallback,
    loading: isLoading,
  };
}

// ── Fonction impérative (hors hook, pour les exports PDF etc.) ────────

export async function resolveRegime(tenantId: string, countryCode: string): Promise<Regime> {
  const fromDB = await fetchRegimeFromDB(tenantId, countryCode);
  if (fromDB) return fromDB;
  try { return getRegime(countryCode); } catch { return REGIME_CI; }
}
