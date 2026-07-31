-- =====================================================================
-- V12 · CADMIN non-révocable
-- Backfill tenants.owner_user_id + triggers de protection
-- + RPC de lecture pour le frontend (auth.users non exposé au client)
-- =====================================================================

-- 1. Backfill : le propriétaire = le plus ancien membre admin/super_admin
--    du tenant (par date d'ajout). Ne touche que les tenants sans owner.
update atlas_people.tenants t
set owner_user_id = sub.user_id
from (
  select distinct on (tenant_id) tenant_id, user_id
  from atlas_people.tenant_memberships
  where role in ('admin', 'super_admin')
  order by tenant_id, added_at asc nulls last
) sub
where t.id = sub.tenant_id
  and t.owner_user_id is null;

-- 2. Trigger : protège tenant_memberships (source de vérité RLS)
--    Bloque le retrait ou la rétrogradation du propriétaire fondateur.
create or replace function atlas_people.protect_tenant_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = atlas_people, public
as $$
declare
  v_owner uuid;
begin
  select owner_user_id into v_owner
  from atlas_people.tenants
  where id = coalesce(new.tenant_id, old.tenant_id);

  if v_owner is null then
    return coalesce(new, old);
  end if;

  if TG_OP = 'DELETE' and old.user_id = v_owner then
    raise exception 'CADMIN_PROTECTED: le propriétaire fondateur du tenant ne peut pas être retiré.';
  end if;

  if TG_OP = 'UPDATE' and old.user_id = v_owner and new.role not in ('admin', 'super_admin') then
    raise exception 'CADMIN_PROTECTED: le rôle du propriétaire fondateur ne peut pas être rétrogradé.';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists tenant_memberships_protect_owner on atlas_people.tenant_memberships;
create trigger tenant_memberships_protect_owner
  before update or delete on atlas_people.tenant_memberships
  for each row execute function atlas_people.protect_tenant_owner_membership();

-- 3. Trigger : protège tenant_members (roster d'affichage, clé email)
--    Bloque la désactivation / rétrogradation / suppression du propriétaire.
create or replace function atlas_people.protect_tenant_owner_member()
returns trigger
language plpgsql
security definer
set search_path = atlas_people, public
as $$
declare
  v_owner_email text;
begin
  select u.email into v_owner_email
  from atlas_people.tenants t
  join auth.users u on u.id = t.owner_user_id
  where t.id = coalesce(new.tenant_id, old.tenant_id);

  if v_owner_email is null then
    return coalesce(new, old);
  end if;

  if TG_OP = 'DELETE' and lower(old.email) = lower(v_owner_email) then
    raise exception 'CADMIN_PROTECTED: le propriétaire fondateur ne peut pas être retiré du roster.';
  end if;

  if TG_OP = 'UPDATE' and lower(old.email) = lower(v_owner_email) then
    if new.active = false then
      raise exception 'CADMIN_PROTECTED: le propriétaire fondateur ne peut pas être désactivé.';
    end if;
    if new.role not in ('admin', 'super_admin') then
      raise exception 'CADMIN_PROTECTED: le rôle du propriétaire fondateur ne peut pas être rétrogradé.';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists tenant_members_protect_owner on atlas_people.tenant_members;
create trigger tenant_members_protect_owner
  before update or delete on atlas_people.tenant_members
  for each row execute function atlas_people.protect_tenant_owner_member();

-- 4. RPC : expose le propriétaire (user_id + email) au frontend.
--    auth.users n'est pas accessible directement par le client.
--    SECURITY DEFINER + filtre current_tenant_ids() : un membre ne peut
--    lire que le propriétaire de SES propres tenants.
create or replace function atlas_people.get_tenant_owner(p_tenant_id uuid)
returns table(user_id uuid, email text)
language sql
stable
security definer
set search_path = atlas_people, public
as $$
  select t.owner_user_id, u.email
  from atlas_people.tenants t
  left join auth.users u on u.id = t.owner_user_id
  where t.id = p_tenant_id
    and t.id in (select atlas_people.current_tenant_ids());
$$;

grant execute on function atlas_people.get_tenant_owner(uuid) to authenticated;
