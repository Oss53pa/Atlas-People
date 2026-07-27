-- ════════════════════════════════════════════════════════════════════
-- 0049 — Champs conformité dossier sur atlas_people.workers
--
-- Ajoute 4 colonnes de suivi documentaire (idempotent).
-- Les valeurs possibles : 'ok' | 'expiré' | 'manquant'
-- ════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'atlas_people' and table_name = 'workers' and column_name = 'contrat_statut'
  ) then
    alter table atlas_people.workers
      add column contrat_statut    text not null default 'manquant'
        check (contrat_statut    in ('ok', 'expiré', 'manquant')),
      add column fiches_paie_statut text not null default 'manquant'
        check (fiches_paie_statut in ('ok', 'expiré', 'manquant')),
      add column conges_statut     text not null default 'ok'
        check (conges_statut     in ('ok', 'expiré', 'manquant')),
      add column visite_statut     text not null default 'manquant'
        check (visite_statut     in ('ok', 'expiré', 'manquant'));
  end if;
end $$;
