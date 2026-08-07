-- =====================================================================
-- V12 · CADMIN — bootstrap automatique du propriétaire fondateur
--
-- 0052 backfille owner_user_id pour les tenants EXISTANTS mais ne couvre
-- pas les nouveaux tenants : join_tenant_as_admin (RPC bootstrap créer/
-- rejoindre comme admin) ne fixait jamais owner_user_id. Sans ça, la
-- protection CADMIN reste dormante pour tout tenant créé après 0050.
--
-- Règle : le premier utilisateur qui rejoint un tenant comme admin via
-- cette RPC en devient le propriétaire fondateur (si aucun n'est déjà
-- défini). Les admins suivants restent des délégués révocables.
-- =====================================================================

create or replace function atlas_people.join_tenant_as_admin(p_tenant_id uuid)
returns void language plpgsql security definer set search_path = atlas_people, public as $$
begin
  if not exists (select 1 from atlas_people.tenants where id = p_tenant_id) then
    raise exception 'Tenant introuvable : %', p_tenant_id;
  end if;

  insert into atlas_people.tenant_memberships(user_id, tenant_id, role)
  values (auth.uid(), p_tenant_id, 'admin')
  on conflict (user_id, tenant_id) do update set role = 'admin';

  -- Le premier admin d'un tenant sans propriétaire en devient le CADMIN.
  update atlas_people.tenants
  set owner_user_id = auth.uid()
  where id = p_tenant_id
    and owner_user_id is null;
end;
$$;
