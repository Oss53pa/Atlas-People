-- ============================================================================
-- Atlas People — M3 Bonus → Paie (mise à jour M3 §12).
-- Transfère le bonus figé et AFFICHÉ (statut 'affiche', donc validé direction —
-- gating R6) vers la saisie de paie comme rubrique de rémunération variable.
-- Le calcul des cotisations/impôts reste au cœur paie (hors périmètre).
--
-- Additif & idempotent. Dépend de 0016 (payroll_inputs_bonuses), 0038/0042 (bonus).
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- Code rubrique conventionnel pour le bonus variable injecté en paie.
-- rpc_bonus_to_payroll(enveloppe, cycle) : idempotent (remplace les lignes
-- BONUS_VAR existantes du cycle/employé). Réservé RH/admin du tenant.
create or replace function rpc_bonus_to_payroll(p_enveloppe_id uuid, p_cycle_id uuid)
returns int
language plpgsql security definer set search_path = atlas_people, public as $$
declare v_tenant uuid; n int := 0; c record;
begin
  select tenant_id into v_tenant from bonus_enveloppes where id = p_enveloppe_id;
  if v_tenant is null then raise exception 'Enveloppe % introuvable.', p_enveloppe_id; end if;
  if not is_hr_or_admin(v_tenant) then
    raise exception 'Réservé RH/admin du tenant.';
  end if;

  for c in
    select bc.tenant_id, bc.employe_id, bc.final
      from bonus_calculs bc
     where bc.enveloppe_id = p_enveloppe_id and bc.statut = 'affiche' and bc.final is not null
  loop
    -- idempotence : on retire l'éventuelle ligne bonus précédente du cycle
    delete from payroll_inputs_bonuses
     where cycle_id = p_cycle_id and employee_id = c.employe_id and rubrique_code = 'BONUS_VAR';

    insert into payroll_inputs_bonuses(tenant_id, cycle_id, employee_id, rubrique_code, label, amount, source)
    values (c.tenant_id, p_cycle_id, c.employe_id, 'BONUS_VAR',
            'Bonus variable (campagne performance)', c.final, 'm3_bonus');
    n := n + 1;
  end loop;
  return n;
end $$;

comment on function rpc_bonus_to_payroll(uuid,uuid) is
  'Injecte les bonus affichés (validés direction, R6) d''une enveloppe dans la saisie de paie (payroll_inputs_bonuses, rubrique BONUS_VAR) — rémunération variable, §12. Idempotent, réservé RH/admin.';
