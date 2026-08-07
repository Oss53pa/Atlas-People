-- =====================================================================
-- SÉCURITÉ — durcissement de join_tenant_as_admin()
--
-- FAILLE CORRIGÉE (élévation de privilèges).
-- La version issue de 0032, amendée par 0053, n'avait qu'un seul garde-fou :
-- « le tenant existe ». Toute personne authentifiée pouvait donc s'attribuer
-- le rôle 'admin' sur n'importe quel tenant dont elle connaissait l'UUID.
-- Depuis 0053, l'appel positionnait en plus owner_user_id — donc conférait
-- la qualité de propriétaire fondateur, rendue NON RÉVOCABLE par les
-- triggers de 0052. Un appel suffisait à prendre un workspace.
--
-- Le commentaire de 0032 présentait cette RPC comme « le seul vecteur
-- contrôlé » d'écriture dans tenant_memberships, la RLS n'exposant aucune
-- policy INSERT au client. Le vecteur existait bien ; le contrôle, non.
--
-- Aggravant : l'ACL laissait EXECUTE à PUBLIC et à anon.
--
-- RÈGLE RETENUE — deux cas légitimes, et deux seulement :
--   (a) l'appelant EST déjà le propriétaire désigné (owner_user_id) et ne
--       fait que matérialiser son appartenance. C'est la voie propre quand
--       le propriétaire est désigné hors bande, au provisionnement.
--   (b) le tenant est VIERGE — aucune appartenance et aucun propriétaire.
--       C'est l'amorçage du tout premier administrateur, seul cas où
--       personne ne peut encore inviter personne.
-- Tout le reste passe par accept_invitation(token), qui est expirable,
-- nominatif et déjà correctement gardé.
--
-- LIMITE ASSUMÉE : le cas (b) reste une revendication au premier arrivé.
-- Aucune donnée ne permet aujourd'hui de mieux faire — la table tenants
-- n'a ni created_by ni lien vers un abonnement, donc rien n'identifie le
-- propriétaire légitime d'un tenant fraîchement provisionné. La fermeture
-- complète suppose que le moteur de provisionnement (service_role)
-- renseigne owner_user_id à la création ; le cas (a) est déjà prêt à
-- l'accueillir et rendra (b) inutile.
--
-- TRAÇABILITÉ : added_by est renseigné avec auth.uid(). Une ligne dont
-- added_by = user_id est donc, par construction, un auto-amorçage — ce qui
-- rend le cas (b) auditable sans table supplémentaire.
-- =====================================================================

create or replace function atlas_people.join_tenant_as_admin(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = atlas_people, public
as $$
declare
  v_uid    uuid := auth.uid();
  v_owner  uuid;
  v_exists boolean;
  v_members int;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED: appel anonyme interdit.';
  end if;

  select true, owner_user_id into v_exists, v_owner
  from atlas_people.tenants where id = p_tenant_id;

  if not coalesce(v_exists, false) then
    raise exception 'TENANT_NOT_FOUND: %', p_tenant_id;
  end if;

  select count(*) into v_members
  from atlas_people.tenant_memberships where tenant_id = p_tenant_id;

  -- Cas (a) : le propriétaire désigné matérialise son appartenance.
  -- Cas (b) : tenant vierge, amorçage du premier administrateur.
  if not (v_owner = v_uid or (v_owner is null and v_members = 0)) then
    raise exception
      'BOOTSTRAP_FORBIDDEN: ce workspace a déjà un administrateur. '
      'Rejoindre un workspace existant requiert une invitation (accept_invitation).';
  end if;

  insert into atlas_people.tenant_memberships(user_id, tenant_id, role, added_by)
  values (v_uid, p_tenant_id, 'admin', v_uid)
  on conflict (user_id, tenant_id) do update set role = 'admin';

  -- Le premier admin d'un tenant sans propriétaire en devient le CADMIN.
  update atlas_people.tenants
  set owner_user_id = v_uid
  where id = p_tenant_id
    and owner_user_id is null;
end;
$$;

-- ACL : retirer PUBLIC et anon, ne laisser que les sessions authentifiées.
revoke all on function atlas_people.join_tenant_as_admin(uuid) from public;
revoke all on function atlas_people.join_tenant_as_admin(uuid) from anon;
grant execute on function atlas_people.join_tenant_as_admin(uuid) to authenticated;

-- Fonction de diagnostic pour l'écran d'amorçage : dit si un workspace est
-- revendiquable, SANS rien divulguer d'autre que ce booléen et le nom.
-- Volontairement non listante : elle exige l'UUID en entrée, elle ne
-- renvoie jamais l'inventaire des tenants.
create or replace function atlas_people.tenant_bootstrap_state(p_tenant_id uuid)
returns table(exists_tenant boolean, tenant_name text, claimable boolean, is_owner boolean)
language sql
stable
security definer
set search_path = atlas_people, public
as $$
  select
    true,
    t.name,
    (t.owner_user_id is null
      and not exists (select 1 from atlas_people.tenant_memberships m where m.tenant_id = t.id)),
    (t.owner_user_id is not null and t.owner_user_id = auth.uid())
  from atlas_people.tenants t
  where t.id = p_tenant_id and auth.uid() is not null;
$$;

revoke all on function atlas_people.tenant_bootstrap_state(uuid) from public;
revoke all on function atlas_people.tenant_bootstrap_state(uuid) from anon;
grant execute on function atlas_people.tenant_bootstrap_state(uuid) to authenticated;
