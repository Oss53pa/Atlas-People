-- =====================================================================
-- 0070 — Moteur de préfacturation : calcul, cohérence, cycle de vie
--
-- Trois garanties portées par la BASE, et non par l'interface — une règle
-- vécue seulement côté écran finit par être contournée par un import, un
-- script ou un second écran :
--
--   1. le total d'une préfacture est TOUJOURS la somme de ses lignes ;
--   2. une préfacture ne saute pas d'étape et ne revient pas en arrière ;
--   3. le montant dérive des conditions du mandat, pas d'une saisie libre.
--
-- Le contenu exact appliqué en production est celui des fonctions
-- ci-dessous ; il est reproduit ici pour que le dépôt déclare son schéma.
-- =====================================================================

-- Le total suit les lignes, toujours.
create or replace function atlas_people.recompute_prefacture_totals()
returns trigger language plpgsql security definer
set search_path = atlas_people, public as $$
declare
  v_id uuid := coalesce(new.prefacture_id, old.prefacture_id);
  v_subtotal bigint; v_rate numeric(5,2);
begin
  select coalesce(sum(amount), 0) into v_subtotal
    from atlas_people.prefacture_lines where prefacture_id = v_id;
  select tax_rate into v_rate from atlas_people.prefactures where id = v_id;
  update atlas_people.prefactures
     set subtotal_amount = v_subtotal,
         tax_amount      = round(v_subtotal * coalesce(v_rate, 0) / 100.0),
         total_amount    = v_subtotal + round(v_subtotal * coalesce(v_rate, 0) / 100.0)
   where id = v_id;
  return null;
end; $$;

drop trigger if exists trg_prefacture_lines_totals on atlas_people.prefacture_lines;
create trigger trg_prefacture_lines_totals
  after insert or update or delete on atlas_people.prefacture_lines
  for each row execute function atlas_people.recompute_prefacture_totals();

-- Le montant d'une ligne dérive de quantité × prix unitaire : le laisser
-- saisir librement autoriserait un détail contredisant le total.
create or replace function atlas_people.compute_prefacture_line_amount()
returns trigger language plpgsql as $$
begin new.amount := round(new.quantity * new.unit_amount); return new; end; $$;

drop trigger if exists trg_prefacture_line_amount on atlas_people.prefacture_lines;
create trigger trg_prefacture_line_amount
  before insert or update of quantity, unit_amount on atlas_people.prefacture_lines
  for each row execute function atlas_people.compute_prefacture_line_amount();

-- Cycle de vie : brouillon → validée → envoyée → payée (annulable avant paiement).
create or replace function atlas_people.guard_prefacture_status()
returns trigger language plpgsql as $$
begin
  if new.status = old.status then return new; end if;
  if old.status = 'annulee' then
    raise exception 'PREFACTURE_ANNULEE: une préfacture annulée ne peut plus changer d''état.';
  end if;
  if old.status = 'payee' then
    raise exception 'PREFACTURE_PAYEE: une préfacture encaissée ne peut plus changer d''état.';
  end if;
  if new.status = 'annulee' then return new; end if;
  if not (
    (old.status = 'brouillon' and new.status = 'validee') or
    (old.status = 'validee'   and new.status = 'envoyee') or
    (old.status = 'envoyee'   and new.status = 'payee')
  ) then
    raise exception 'TRANSITION_INVALIDE: % → % n''est pas autorisé.', old.status, new.status;
  end if;
  -- Horodatage automatique : une date saisie à la main finit toujours par
  -- diverger de l'événement réel.
  if new.status = 'validee' then
    new.validated_at := coalesce(new.validated_at, now());
    new.validated_by := coalesce(new.validated_by, auth.uid());
    new.issued_on    := coalesce(new.issued_on, current_date);
  elsif new.status = 'envoyee' then
    new.sent_at := coalesce(new.sent_at, now());
    new.due_on  := coalesce(new.due_on, current_date + 30);
  elsif new.status = 'payee' then
    new.paid_at := coalesce(new.paid_at, now());
  end if;
  return new;
end; $$;

drop trigger if exists trg_prefacture_status on atlas_people.prefactures;
create trigger trg_prefacture_status
  before update of status on atlas_people.prefactures
  for each row execute function atlas_people.guard_prefacture_status();

-- Libellé de période indépendant de la locale du serveur : to_char(TMMonth)
-- renvoyait « August 2026 » sur une base en anglais.
create or replace function atlas_people.mois_fr(p_date date)
returns text language sql immutable as $$
  select (array['Janvier','Février','Mars','Avril','Mai','Juin',
                'Juillet','Août','Septembre','Octobre','Novembre','Décembre'])
         [extract(month from p_date)::int] || ' ' || extract(year from p_date)::text;
$$;

-- Génération depuis les conditions du mandat.
create or replace function atlas_people.generate_prefacture(
  p_client_id uuid,
  p_period_start date default date_trunc('month', current_date)::date
)
returns uuid language plpgsql security definer
set search_path = atlas_people, public as $$
declare
  v_client record; v_contract record;
  v_end date := (date_trunc('month', p_period_start) + interval '1 month - 1 day')::date;
  v_label text; v_ref text; v_id uuid; v_seq integer; v_pos integer := 1; v_sub bigint;
begin
  select * into v_client from atlas_people.clients
   where id = p_client_id and tenant_id in (select atlas_people.current_tenant_ids());
  if not found then
    raise exception 'CLIENT_INTROUVABLE: aucun client accessible sous cet identifiant.';
  end if;

  select * into v_contract from atlas_people.client_contracts
   where client_id = p_client_id and status = 'actif'
   order by effective_from desc limit 1;
  if not found then
    raise exception 'MANDAT_ABSENT: ce client n''a aucun mandat actif — les conditions de facturation sont inconnues.';
  end if;

  if exists (select 1 from atlas_people.prefactures
             where client_id = p_client_id
               and period_start = date_trunc('month', p_period_start)::date
               and status <> 'annulee') then
    raise exception 'PERIODE_DEJA_FACTUREE: une préfacture existe déjà pour ce client sur cette période.';
  end if;

  v_label := atlas_people.mois_fr(p_period_start);
  select count(*) + 1 into v_seq from atlas_people.prefactures
   where tenant_id = v_client.tenant_id
     and date_trunc('month', period_start) = date_trunc('month', p_period_start);
  v_ref := 'PF-' || to_char(p_period_start, 'YYYY-MM') || '-' || lpad(v_seq::text, 3, '0');

  insert into atlas_people.prefactures (
    tenant_id, client_id, contract_id, reference, period_start, period_end, period_label,
    currency, headcount, tax_rate, due_on, created_by
  ) values (
    v_client.tenant_id, p_client_id, v_contract.id, v_ref,
    date_trunc('month', p_period_start)::date, v_end, v_label,
    v_contract.currency, v_client.effectif, v_contract.tax_rate,
    current_date + v_contract.payment_terms_days, auth.uid()
  ) returning id into v_id;

  if v_contract.billing_mode in ('forfait','mixte') and v_contract.forfait_amount > 0 then
    insert into atlas_people.prefacture_lines (tenant_id, prefacture_id, position, label, kind, quantity, unit_amount)
    values (v_client.tenant_id, v_id, v_pos, 'Forfait de gestion — ' || v_label, 'abonnement', 1, v_contract.forfait_amount);
    v_pos := v_pos + 1;
  end if;

  if v_contract.billing_mode in ('par_collaborateur','mixte') and v_contract.unit_amount > 0 then
    insert into atlas_people.prefacture_lines (tenant_id, prefacture_id, position, label, kind, quantity, unit_amount)
    values (v_client.tenant_id, v_id, v_pos,
            'Gestion RH — ' || v_client.effectif || ' collaborateur(s)', 'collaborateur',
            v_client.effectif, v_contract.unit_amount);
    v_pos := v_pos + 1;
  end if;

  if v_contract.billing_mode = 'par_bulletin' and v_contract.unit_amount > 0 then
    insert into atlas_people.prefacture_lines (tenant_id, prefacture_id, position, label, kind, quantity, unit_amount)
    values (v_client.tenant_id, v_id, v_pos, 'Bulletins produits — ' || v_label, 'bulletin',
            v_client.effectif, v_contract.unit_amount);
    v_pos := v_pos + 1;
  end if;

  -- Plancher contractuel : facturer sous le minimum convenu serait une
  -- perte silencieuse pour le cabinet.
  if v_contract.minimum_amount > 0 then
    select coalesce(sum(amount),0) into v_sub from atlas_people.prefacture_lines where prefacture_id = v_id;
    if v_sub < v_contract.minimum_amount then
      insert into atlas_people.prefacture_lines (tenant_id, prefacture_id, position, label, kind, quantity, unit_amount)
      values (v_client.tenant_id, v_id, v_pos, 'Complément minimum contractuel', 'prestation', 1,
              v_contract.minimum_amount - v_sub);
    end if;
  end if;

  return v_id;
end; $$;

revoke all on function atlas_people.generate_prefacture(uuid, date) from public, anon;
grant execute on function atlas_people.generate_prefacture(uuid, date) to authenticated;

-- Portails : chaque transition laisse une trace exploitable après coup.
create or replace function atlas_people.log_portal_transition()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'invite' then new.invited_at := coalesce(new.invited_at, now());
    elsif new.status = 'actif' then new.activated_at := coalesce(new.activated_at, now());
    elsif new.status = 'revoque' then new.revoked_at := coalesce(new.revoked_at, now());
    end if;
    insert into atlas_people.client_portal_access (tenant_id, portal_id, action, detail)
    values (new.tenant_id, new.id,
            case new.status when 'invite' then 'invitation'
                            when 'actif' then 'activation'
                            when 'revoque' then 'revocation'
                            else 'consultation' end,
            'Statut : ' || old.status || ' → ' || new.status);
  end if;
  return new;
end; $$;

drop trigger if exists trg_portal_transition on atlas_people.client_portals;
create trigger trg_portal_transition
  before update of status on atlas_people.client_portals
  for each row execute function atlas_people.log_portal_transition();
