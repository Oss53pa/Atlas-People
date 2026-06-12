-- Fix d'intégrité (appliqué en prod le 2026-06-12) — remap des uuids employés ORPHELINS.
--
-- Les seeds historiques (M6..M12) référençaient des employés via deux espaces
-- de noms placeholder absents de la table employees :
--   11111111-0000-0000-0011-1000000000NN  et  11111111-2222-0000-0000-0000000000NN
-- où NN = numéro d'employé (01..14). ~60 lignes orphelines sur 11 tables
-- (m6_arrivants, m7_objectives, m8_evaluations, m9_skill_matrix,
--  m9_certifications_employees, m10_promotions, m11_lms_progress,
--  m11_parcours_enrollments, m11_pif, m11_badge_attributions,
--  m12_authorizations…).
--
-- Remap générique vers les vrais uuids e1000001-0000-0000-0000-0000000000NN,
-- limité aux colonnes de référence employé (par nom), tables de base uniquement,
-- et seulement si la cible existe. Idempotent (ne matche plus rien après coup).

do $$
declare r record; n int; total int := 0;
begin
  for r in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
    where c.table_schema = 'atlas_people' and c.udt_name = 'uuid'
      and c.column_name in ('employee_id','owner_id','manager_id','mentor_id','mentee_id','buddy_id','evaluator_id','reviewer_id','current_holder_id','successor_id','approved_by','validated_by')
  loop
    execute format(
      'update atlas_people.%I set %I = (''e1000001-0000-0000-0000-'' || lpad(right(%I::text, 2), 12, ''0''))::uuid
       where (%I::text like ''11111111-0000-0000-0011-1%%'' or %I::text like ''11111111-2222-%%'')
         and exists (select 1 from atlas_people.employees e where e.id = (''e1000001-0000-0000-0000-'' || lpad(right(%I::text, 2), 12, ''0''))::uuid)',
      r.table_name, r.column_name, r.column_name, r.column_name, r.column_name, r.column_name);
    get diagnostics n = row_count;
    total := total + n;
  end loop;
  raise notice 'remapped % employee refs', total;
end $$;
