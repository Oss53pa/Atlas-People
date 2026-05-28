-- ============================================================================
-- Atlas People — Architecture des espaces (surfaces).
-- L'audit trace désormais l'espace d'origine de chaque action : permet de
-- distinguer un congé posé par l'employé (ESS), saisi par le manager (MSS) ou
-- régularisé par la RH (back-office). Cf. doc « Architecture des espaces » §7.3.
-- ============================================================================

alter table audit_log
  add column if not exists source_surface text
    check (source_surface in ('ess', 'mss', 'backoffice', 'system'));
