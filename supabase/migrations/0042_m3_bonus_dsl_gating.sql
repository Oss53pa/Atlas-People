-- ============================================================================
-- Atlas People — M3 Bonus : conformité « mise à jour M3 ».
-- Aligne le schéma bonus (livré en 0038) sur la mise à jour M3 :
--   • remu_fiche : formule en DSL contrôlé + plafond/plancher ABSOLUS (Money).
--   • bonus_calculs : statut 'affiche' (gating §7) + formule_appliquee.
--   • bonus_enveloppes : codes mode 'A'/'B'/'C' acceptés (alias des longs).
--   • rpc_valide_repartition : fige la répartition → 'affiche' (visible employé).
--
-- Le CALCUL reste dans le moteur déterministe Money.ts bigint
-- (src/engine/bonus : DSL contrôlé + réconciliation itérative des caps + 3
-- modes + simulation what-if), conforme R2/R5. Aucun eval libre, aucun PROPH3T.
--
-- Additif & idempotent. Dépend de 0038.
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 1. remu_fiche : DSL + plafond/plancher absolus (§4, §9)
-- ---------------------------------------------------------------------------
alter table remu_fiche add column if not exists bonus_formule text;        -- DSL contrôlé
alter table remu_fiche add column if not exists bonus_plafond bigint;      -- Money FCFA (absolu)
alter table remu_fiche add column if not exists bonus_plancher bigint;     -- Money FCFA (absolu)

comment on column remu_fiche.bonus_formule is
  'Formule de bonus en DSL contrôlé (SCORE/COEF/SAL_MENS/SAL_ANN, + − × ÷, parenthèses). Évaluée par src/engine/bonus (jamais d''eval libre, R2).';

-- ---------------------------------------------------------------------------
-- 2. bonus_calculs : statut 'affiche' (gating §7) + formule tracée (§11)
-- ---------------------------------------------------------------------------
alter table bonus_calculs add column if not exists formule_appliquee text;

alter table bonus_calculs drop constraint if exists bonus_calculs_statut_check;
alter table bonus_calculs add constraint bonus_calculs_statut_check
  check (statut in ('calcule','valide','affiche'));

-- ---------------------------------------------------------------------------
-- 3. bonus_enveloppes : accepter les codes courts A/B/C (mise à jour §5/§9)
-- ---------------------------------------------------------------------------
alter table bonus_enveloppes drop constraint if exists bonus_enveloppes_mode_bonus_check;
alter table bonus_enveloppes add constraint bonus_enveloppes_mode_bonus_check
  check (mode_bonus in ('A_prorata','B_plafonnee','C_libre','A','B','C'));

-- ---------------------------------------------------------------------------
-- 4. rpc_valide_repartition — fige la répartition validée direction (§7/§10)
--    Passe l'enveloppe à 'validee' (le trigger 0038 ouvre le gating) puis les
--    calculs figés à 'affiche'. L'employé ne voit son bonus qu'à ce stade (R6).
-- ---------------------------------------------------------------------------
create or replace function rpc_valide_repartition(p_enveloppe_id uuid, p_validateur_id uuid)
returns int
language plpgsql security definer set search_path = atlas_people, public as $$
declare n int;
begin
  update bonus_enveloppes
     set statut = 'validee', valide_par = p_validateur_id, valide_at = now()
   where id = p_enveloppe_id;

  update bonus_calculs
     set statut = 'affiche', visible_employe = true,
         validateur_id = coalesce(validateur_id, p_validateur_id),
         validated_at = coalesce(validated_at, now())
   where enveloppe_id = p_enveloppe_id and statut in ('calcule','valide');
  get diagnostics n = row_count;
  return n;
end $$;

comment on function rpc_valide_repartition(uuid,uuid) is
  'Fige la répartition validée direction : enveloppe → validee, calculs → affiche + visible_employe (gating R6, §7).';
