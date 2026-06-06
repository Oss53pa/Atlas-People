-- ════════════════════════════════════════════════════════════════════
-- 0035 — RLS sur tables M9/M10/M11 déployées via MCP (audit C-7 / M-2/3/4)
--
-- Les tables m9_*, m10_*, m11_* listées ci-dessous existent dans la DB
-- (déployées via Supabase MCP lors des sprints 134-155) mais n'avaient
-- pas de policies RLS. Ce fichier applique le RLS manquant.
--
-- Tables concernées :
--   M9 : m9_pdc, m9_pdc_actions, m9_certifications_catalog,
--         m9_certifications_employees, m9_suspicious_patterns, m9_anti_discrim_alerts
--   M10 : m10_talent_pools, m10_promotions
--   M11 : m11_parcours, m11_parcours_enrollments, m11_pif, m11_lms_progress,
--          m11_badge_attributions, m11_formateurs, m11_suspicious_patterns
--
-- Note schéma réel : m11_pif utilise "year" (pas "period_year"), d'autres
-- tables ont des colonnes supplémentaires vs les stubs prévus initialement.
-- Les CREATE TABLE IF NOT EXISTS sont donc omis (tables déjà en place).
-- ════════════════════════════════════════════════════════════════════

do $$
declare
  tname text;
  tables text[] := array[
    'm9_pdc','m9_pdc_actions','m9_certifications_catalog','m9_certifications_employees',
    'm9_suspicious_patterns','m9_anti_discrim_alerts',
    'm10_talent_pools','m10_promotions',
    'm11_parcours','m11_parcours_enrollments','m11_pif','m11_lms_progress',
    'm11_badge_attributions','m11_formateurs','m11_suspicious_patterns'
  ];
begin
  foreach tname in array tables loop
    -- Enable RLS (idempotent)
    begin
      execute format('alter table atlas_people.%I enable row level security', tname);
    exception when others then null; end;

    -- Policy lecture : tout membre du tenant
    begin
      execute format(
        'drop policy if exists %I_select on atlas_people.%I; '||
        'create policy %I_select on atlas_people.%I for select '||
        'using (tenant_id in (select t from atlas_people.current_tenant_ids() t))',
        tname, tname, tname, tname
      );
    exception when others then
      raise notice 'policy select skip: % — %', tname, sqlerrm;
    end;

    -- Policy écriture : hr / admin
    begin
      execute format(
        'drop policy if exists %I_write on atlas_people.%I; '||
        'create policy %I_write on atlas_people.%I for all '||
        'using (atlas_people.is_hr_or_admin(tenant_id)) '||
        'with check (atlas_people.is_hr_or_admin(tenant_id))',
        tname, tname, tname, tname
      );
    exception when others then
      raise notice 'policy write skip: % — %', tname, sqlerrm;
    end;
  end loop;
end; $$;
