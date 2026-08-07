-- ============================================================================
-- Atlas People — Seed de démo COMPÉTENCES (readiness) sur le tenant démo.
-- Réutilise le référentiel m9_* existant (skills/jobs/exigences). Peuple
-- comp_evaluations (triangulé) + preuves, puis calcule comp_readiness via la
-- RPC déployée rpc_calcul_readiness. Idempotent (purge la démo précédente).
--
-- Cas démontrés (verdicts) :
--   • Serge   → Lead Developer      : PRÊT (React/TS 4, Infra cloud 4).
--   • Modeste → DevOps Engineer     : PAS PRÊT (Infra cloud 3 < 4, critique).
--   • Yao     → Directrice Financière : PAS PRÊT (Conformité OHADA PÉRIMÉE §5.5).
--
-- Application : via Supabase MCP execute_sql, ou psql sur le projet.
-- ============================================================================
set search_path = atlas_people, public, extensions;
do $$
declare
  T uuid := '11111111-1111-1111-1111-111111111111';
  e6 uuid := 'e1000001-0000-0000-0000-000000000006';   -- Yao (Finance)
  e8 uuid := 'e1000001-0000-0000-0000-000000000008';   -- Serge (Tech)
  e10 uuid := 'e1000001-0000-0000-0000-000000000010';  -- Modeste (Data)
  sk_react uuid := '33333333-0000-0009-0001-000000000001';
  sk_cloud uuid := '33333333-0000-0009-0001-000000000002';
  sk_paie  uuid := '33333333-0000-0009-0001-000000000003';
  sk_ohada uuid := '33333333-0000-0009-0001-000000000005';
  j_lead   uuid := '44444444-0000-0009-0002-000000000001';
  j_devops uuid := '44444444-0000-0009-0002-000000000002';
  j_dir    uuid := '44444444-0000-0009-0002-000000000003';
  pv6 uuid; pv8 uuid; pv10 uuid;
begin
  delete from comp_readiness   where tenant_id=T and employe_id in (e6,e8,e10);
  delete from comp_evaluations where tenant_id=T and employe_id in (e6,e8,e10);
  delete from preuves          where tenant_id=T and employe_id in (e6,e8,e10) and titre like 'DEMO %';

  insert into preuves(tenant_id, employe_id, type, titre, date) values
    (T,e6,'projet','DEMO preuve compétence Finance', current_date) returning id into pv6;
  insert into preuves(tenant_id, employe_id, type, titre, date) values
    (T,e8,'projet','DEMO preuve compétence Tech', current_date) returning id into pv8;
  insert into preuves(tenant_id, employe_id, type, titre, date) values
    (T,e10,'projet','DEMO preuve compétence Data', current_date) returning id into pv10;

  insert into comp_evaluations(tenant_id,employe_id,skill_id,niveau_self,niveau_manager,preuve_id) values
    (T,e8,sk_react,4,4,pv8),
    (T,e8,sk_cloud,4,4,pv8);
  insert into comp_evaluations(tenant_id,employe_id,skill_id,niveau_self,niveau_manager,preuve_id) values
    (T,e10,sk_cloud,3,3,pv10);
  insert into comp_evaluations(tenant_id,employe_id,skill_id,niveau_self,niveau_manager,preuve_id) values
    (T,e6,sk_paie,4,4,pv6);
  insert into comp_evaluations(tenant_id,employe_id,skill_id,niveau_self,niveau_manager,preuve_id,date_validite) values
    (T,e6,sk_ohada,3,3,pv6,'2026-01-31');

  perform rpc_calcul_readiness(e8, j_lead);
  perform rpc_calcul_readiness(e10, j_devops);
  perform rpc_calcul_readiness(e6, j_dir);
end $$;
