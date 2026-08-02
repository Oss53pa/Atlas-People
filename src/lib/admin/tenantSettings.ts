/**
 * Réglages du workspace — pays, zone monétaire, devise.
 *
 * Le provisionnement (migration 0065/0066) déduit ces trois valeurs du pays
 * connu à la création du compte, qui n'est pas toujours renseigné par le
 * portail. C'est donc ici que l'administrateur les corrige.
 *
 * Les règles ne sont PAS appliquées côté client : la RPC
 * `set_tenant_countries` refuse elle-même un mélange UEMOA/CEMAC et tout
 * changement de devise sur un workspace qui a déjà des bulletins. L'écran
 * ne fait que rendre ces refus lisibles.
 */
import { getSupabaseOrThrow, resolveSessionContext, mapSupabaseError } from '../session';
import { appendAuditEntry } from '../auditLog';
import { supabase } from '../supabase';

export interface CountryZone {
  code: string;
  name: string;
  zone: 'UEMOA' | 'CEMAC';
  currency: 'XOF' | 'XAF';
  socialFund: string;
}

export interface TenantGeography {
  countries: string[];
  zone: string;
  currency: string;
}

/** Les 14 régimes supportés, lus en base (référentiel `country_monetary_zones`). */
export async function fetchCountryZones(): Promise<CountryZone[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .schema('atlas_people')
    .from('country_monetary_zones')
    .select('code, name, zone, currency, social_fund')
    .order('zone')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    code: r.code as string,
    name: r.name as string,
    zone: r.zone as 'UEMOA' | 'CEMAC',
    currency: r.currency as 'XOF' | 'XAF',
    socialFund: r.social_fund as string,
  }));
}

/** Pays, zone et devise actuellement enregistrés pour un workspace. */
export async function fetchTenantGeography(tenantId: string): Promise<TenantGeography | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .schema('atlas_people')
    .from('tenants')
    .select('countries, zone, currency')
    .eq('id', tenantId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    countries: (data.countries as string[]) ?? [],
    zone: data.zone as string,
    currency: data.currency as string,
  };
}

/**
 * Enregistre les pays du workspace. Zone et devise en sont déduites par la
 * base, qui reste seule juge de la cohérence monétaire.
 */
export async function setTenantCountries(countries: string[]): Promise<TenantGeography> {
  const sb = getSupabaseOrThrow();
  const ctx = await resolveSessionContext();
  const { data, error } = await sb
    .schema('atlas_people')
    .rpc('set_tenant_countries', { p_tenant_id: ctx.tenantId, p_countries: countries });
  if (error) throw mapSupabaseError(error);

  const row = (Array.isArray(data) ? data[0] : data) as
    | { zone: string; currency: string; countries: string[] }
    | undefined;
  const result: TenantGeography = {
    countries: row?.countries ?? countries,
    zone: row?.zone ?? '',
    currency: row?.currency ?? '',
  };

  await appendAuditEntry({
    tenantId: ctx.tenantId,
    actorId: ctx.userId,
    action: 'tenant.countries.update',
    entity: 'tenants',
    entityId: ctx.tenantId,
    payload: result,
    surface: 'backoffice',
  });

  return result;
}

/** Traduit les refus de la RPC en messages lisibles à l'écran. */
export function humanizeCountriesError(message: string): string {
  if (message.includes('ZONE_MISMATCH')) {
    return "Un workspace ne peut pas mélanger UEMOA (XOF) et CEMAC (XAF) : les deux devises ne se combinent jamais dans un calcul de paie. Créez un workspace distinct pour l'autre zone.";
  }
  if (message.includes('CURRENCY_LOCKED')) {
    return "Des bulletins ont déjà été calculés dans la devise actuelle. Changer de zone monétaire rendrait ces montants faux — cette bascule n'est possible que sur un workspace sans paie.";
  }
  if (message.includes('COUNTRY_UNKNOWN')) {
    return "Code pays hors des 14 régimes supportés.";
  }
  if (message.includes('COUNTRIES_EMPTY')) {
    return "Sélectionnez au moins un pays.";
  }
  if (message.includes('FORBIDDEN')) {
    return "Réservé aux administrateurs du workspace.";
  }
  return message;
}
