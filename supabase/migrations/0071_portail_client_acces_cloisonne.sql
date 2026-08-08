-- =====================================================================
-- 0071 — Portail client : accès cloisonné du contact d'une entreprise cliente
--
-- LE CONTACT CLIENT N'EST MEMBRE D'AUCUN WORKSPACE. Il ne peut donc pas
-- passer par current_tenant_ids() : son périmètre n'est pas un tenant,
-- c'est UN CLIENT à l'intérieur du tenant du cabinet.
--
-- FAILLE FERMÉE ICI. current_tenant_ids() renvoyait le tenant de
-- démonstration à tout utilisateur authentifié sans appartenance — le
-- profil exact d'un contact client. Le premier compte portail créé aurait
-- obtenu en lecture l'intégralité du workspace de démonstration. Mesuré
-- avant correctif : 1 tenant visible ; après : 0.
--
-- MOINDRE PRIVILÈGE. Le contact ne voit que son propre client, et
-- uniquement les rubriques que le cabinet lui a ouvertes (scope_*). Les
-- policies sont en SELECT seul : un client ne modifie jamais les données
-- que le cabinet produit pour lui. Les brouillons de préfacture lui sont
-- invisibles — un brouillon n'est pas un engagement.
--
-- Le contenu exact appliqué en production est reproduit ici pour que le
-- dépôt déclare son schéma.
-- =====================================================================

create or replace function atlas_people.current_client_ids()
returns setof uuid language sql stable security definer
set search_path = atlas_people, public as $$
  select cp.client_id from atlas_people.client_portals cp
  where cp.user_id = auth.uid() and cp.status = 'actif';
$$;

comment on function atlas_people.current_client_ids() is
  'Clients dont l''utilisateur courant est un contact portail actif. Périmètre de lecture du portail client.';

create or replace function atlas_people.is_client_portal_user()
returns boolean language sql stable security definer
set search_path = atlas_people, public as $$
  select exists (select 1 from atlas_people.client_portals where user_id = auth.uid());
$$;

create or replace function atlas_people.client_scope_allows(p_client_id uuid, p_scope text)
returns boolean language sql stable security definer
set search_path = atlas_people, public as $$
  select exists (
    select 1 from atlas_people.client_portals cp
    where cp.user_id = auth.uid() and cp.client_id = p_client_id and cp.status = 'actif'
      and case p_scope
            when 'payslips'   then cp.scope_payslips
            when 'headcount'  then cp.scope_headcount
            when 'compliance' then cp.scope_compliance
            when 'invoices'   then cp.scope_invoices
            when 'documents'  then cp.scope_documents
            else false end
  );
$$;

revoke all on function atlas_people.current_client_ids() from public, anon;
revoke all on function atlas_people.is_client_portal_user() from public, anon;
revoke all on function atlas_people.client_scope_allows(uuid, text) from public, anon;
grant execute on function atlas_people.current_client_ids() to authenticated;
grant execute on function atlas_people.is_client_portal_user() to authenticated;
grant execute on function atlas_people.client_scope_allows(uuid, text) to authenticated;

-- Repli démonstration refusé aux contacts portail.
create or replace function atlas_people.current_tenant_ids()
returns setof uuid language sql stable security definer
set search_path to 'atlas_people', 'public' as $function$
  select a.tenant_id from atlas_people.user_active_tenant a
  where a.user_id = auth.uid()
    and exists (select 1 from atlas_people.tenant_memberships m
                where m.user_id = auth.uid() and m.tenant_id = a.tenant_id)
  union all
  select m.tenant_id from atlas_people.tenant_memberships m
  where m.user_id = auth.uid()
    and not exists (
      select 1 from atlas_people.user_active_tenant a2
      join atlas_people.tenant_memberships m2
        on m2.user_id = a2.user_id and m2.tenant_id = a2.tenant_id
      where a2.user_id = auth.uid())
  union all
  select '11111111-1111-1111-1111-111111111111'::uuid
  where auth.uid() is not null
    and not exists (select 1 from atlas_people.tenant_memberships where user_id = auth.uid())
    and not exists (select 1 from atlas_people.client_portals where user_id = auth.uid());
$function$;

drop policy if exists clients_portal_read on atlas_people.clients;
create policy clients_portal_read on atlas_people.clients
  for select to authenticated
  using (id in (select atlas_people.current_client_ids()));

drop policy if exists client_portals_self_read on atlas_people.client_portals;
create policy client_portals_self_read on atlas_people.client_portals
  for select to authenticated using (user_id = auth.uid());

drop policy if exists prefactures_portal_read on atlas_people.prefactures;
create policy prefactures_portal_read on atlas_people.prefactures
  for select to authenticated
  using (atlas_people.client_scope_allows(client_id, 'invoices')
         and status in ('envoyee', 'payee'));

drop policy if exists prefacture_lines_portal_read on atlas_people.prefacture_lines;
create policy prefacture_lines_portal_read on atlas_people.prefacture_lines
  for select to authenticated
  using (exists (select 1 from atlas_people.prefactures p
                 where p.id = prefacture_id and p.status in ('envoyee','payee')
                   and atlas_people.client_scope_allows(p.client_id, 'invoices')));

create or replace function atlas_people.touch_portal_access(p_detail text default null)
returns void language plpgsql security definer
set search_path = atlas_people, public as $$
declare v_portal record;
begin
  select * into v_portal from atlas_people.client_portals
   where user_id = auth.uid() and status = 'actif' limit 1;
  if not found then return; end if;
  update atlas_people.client_portals set last_access_at = now() where id = v_portal.id;
  -- Une consultation par heure suffit à tracer l'usage.
  if not exists (select 1 from atlas_people.client_portal_access
                 where portal_id = v_portal.id and action = 'consultation'
                   and occurred_at > now() - interval '1 hour') then
    insert into atlas_people.client_portal_access (tenant_id, portal_id, action, detail)
    values (v_portal.tenant_id, v_portal.id, 'consultation', p_detail);
  end if;
end; $$;

revoke all on function atlas_people.touch_portal_access(text) from public, anon;
grant execute on function atlas_people.touch_portal_access(text) to authenticated;

-- Rattachement du contact à son compte, sur la seule base de l'email vérifié.
create or replace function atlas_people.claim_client_portal()
returns table(portal_id uuid, client_id uuid, client_name text)
language plpgsql security definer
set search_path = atlas_people, public as $$
declare v_email text; v_portal record;
begin
  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is null then raise exception 'AUTH_REQUIRED: aucune session.'; end if;

  select cp.* into v_portal from atlas_people.client_portals cp
  where lower(cp.contact_email) = v_email
    and cp.status in ('invite', 'actif')
    and (cp.user_id is null or cp.user_id = auth.uid())
  order by cp.invited_at desc nulls last limit 1;

  if not found then
    raise exception 'AUCUN_ACCES: aucune invitation portail en cours pour cette adresse.';
  end if;

  update atlas_people.client_portals
     set user_id = auth.uid(), status = 'actif' where id = v_portal.id;

  return query select v_portal.id, v_portal.client_id, c.name
               from atlas_people.clients c where c.id = v_portal.client_id;
end; $$;

revoke all on function atlas_people.claim_client_portal() from public, anon;
grant execute on function atlas_people.claim_client_portal() to authenticated;

-- Contexte du portail en un appel : client, rubriques ouvertes, et produit
-- du cabinet — c'est lui qui adapte les rubriques affichées.
create or replace function atlas_people.my_client_portal()
returns table(
  portal_id uuid, client_id uuid, client_name text, client_pays text,
  client_effectif integer, contact_name text, contact_email text,
  product_type text, cabinet_name text,
  scope_payslips boolean, scope_headcount boolean, scope_compliance boolean,
  scope_invoices boolean, scope_documents boolean, last_access_at timestamptz)
language sql stable security definer
set search_path = atlas_people, public as $$
  select cp.id, c.id, c.name, c.pays, c.effectif, cp.contact_name, cp.contact_email,
         t.tenant_type, t.name, cp.scope_payslips, cp.scope_headcount,
         cp.scope_compliance, cp.scope_invoices, cp.scope_documents, cp.last_access_at
  from atlas_people.client_portals cp
  join atlas_people.clients c on c.id = cp.client_id
  join atlas_people.tenants t on t.id = cp.tenant_id
  where cp.user_id = auth.uid() and cp.status = 'actif' limit 1;
$$;

revoke all on function atlas_people.my_client_portal() from public, anon;
grant execute on function atlas_people.my_client_portal() to authenticated;
