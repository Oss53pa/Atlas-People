import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Users, MapPin, CreditCard, ShieldPlus, Landmark, Wallet, Award, GraduationCap,
  Plane, History, FileStack, Lock, Mail, Phone, Globe, Languages, HeartHandshake, Building2, Pencil, Wifi, Plus, Trash2,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { Timeline } from '../../components/ui/Timeline';
import { Drawer } from '../../components/ui/overlays';
import { FormField, TextInput, Select } from '../../components/ui/FormField';
import { useToast } from '../../components/ui/Toast';
import { useSurface } from '../../store/useSurface';
import { getRegime } from '../../lib/payroll';
import { COUNTRIES, countryByCode } from '../../data/countries';
import {
  employeeById, employeeName, matricule, mobileMoney,
  employeeFamily, employeeBeneficiaries, employeeNationalities, employeeLanguages,
  employeeMemberships, employeeMandates, employeeAuthorizations, employeeCertifications,
  employeeDiplomas, employeeEducationLevel, employeeCareer, employeeDocuments,
} from '../../data/mock';
import { cn } from '../../lib/cn';
import {
  useMyProfile, isBackendConfigured,
  useUpsertAddress, useDeleteAddress, useUpsertPhone, useDeletePhone,
} from '../../lib/portal/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const MEMBER_TYPE_LABEL: Record<string, string> = { spouse: 'Conjoint(e)', child: 'Enfant', ascendant: 'Ascendant', other_dependent: 'Autre ayant droit' };
const ADDRESS_TYPE_LABEL: Record<string, string> = { residence_primary: 'Résidence principale', residence_secondary: 'Résidence secondaire', family_home: 'Domicile familial', fiscal: 'Fiscale', billing: 'Facturation', temporary: 'Temporaire' };
const PHONE_TYPE_LABEL: Record<string, string> = { primary: 'Principal', secondary: 'Secondaire', professional: 'Professionnel', landline: 'Fixe', family: 'Famille', emergency: 'Urgence' };
type AddressForm = { id?: string; address_type: string; line_1: string; neighborhood: string; city: string; country_code: string; local_references: string; is_primary: boolean };
type PhoneForm = { id?: string; number: string; phone_type: string; operator: string; has_whatsapp: boolean; is_primary: boolean };
const EMPTY_ADDRESS: AddressForm = { address_type: 'residence_primary', line_1: '', neighborhood: '', city: '', country_code: 'CI', local_references: '', is_primary: false };
const EMPTY_PHONE: PhoneForm = { number: '', phone_type: 'primary', operator: '', has_whatsapp: false, is_primary: false };
const liveIndicator = (
  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500"><Wifi size={13} className="text-emerald-500" /> Live DB</span>
);
const frDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');

const TABS = [
  { key: 'identite', label: 'Identité civile' },
  { key: 'famille', label: 'Famille' },
  { key: 'coordonnees', label: 'Coordonnées' },
  { key: 'pieces', label: 'Pièces d’identité' },
  { key: 'couverture', label: 'Couverture sociale' },
  { key: 'fiscal', label: 'Fiscal' },
  { key: 'versement', label: 'Versement' },
  { key: 'affiliations', label: 'Affiliations & mandats' },
  { key: 'habilitations', label: 'Habilitations' },
  { key: 'diplomes', label: 'Diplômes' },
  { key: 'mobilite', label: 'Mobilité internationale' },
  { key: 'parcours', label: 'Parcours' },
  { key: 'documents', label: 'Mes documents' },
];

export function MonProfilPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const [tab, setTab] = useState('identite');
  const { toast } = useToast();
  const { data: ctx } = useSessionContext();
  const SELF_ID = ctx?.employeeId ?? 'e2';
  const { data: liveProfile } = useMyProfile(ctx?.tenantId, ctx?.employeeId);
  const hasLive = isBackendConfigured && !!liveProfile;

  // Édition directe des coordonnées (Supabase).
  const upsertAddress = useUpsertAddress();
  const deleteAddress = useDeleteAddress();
  const upsertPhone = useUpsertPhone();
  const deletePhone = useDeletePhone();
  const [addressForm, setAddressForm] = useState<AddressForm | null>(null);
  const [phoneForm, setPhoneForm] = useState<PhoneForm | null>(null);

  const submitAddress = async () => {
    if (!addressForm) return;
    try {
      await upsertAddress.mutateAsync({
        id: addressForm.id,
        address_type: addressForm.address_type,
        line_1: addressForm.line_1,
        city: addressForm.city,
        country_code: addressForm.country_code,
        neighborhood: addressForm.neighborhood || null,
        local_references: addressForm.local_references || null,
        is_primary: addressForm.is_primary,
      });
      toast({ variant: 'success', title: addressForm.id ? 'Adresse mise à jour' : 'Adresse ajoutée', description: addressForm.city });
      setAddressForm(null);
    } catch (e) {
      toast({ variant: 'error', title: "Échec de l'enregistrement", description: e instanceof Error ? e.message : 'Erreur inconnue.' });
    }
  };
  const removeAddress = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      toast({ variant: 'success', title: 'Adresse supprimée' });
    } catch (e) {
      toast({ variant: 'error', title: 'Échec de la suppression', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
    }
  };
  const submitPhone = async () => {
    if (!phoneForm) return;
    try {
      await upsertPhone.mutateAsync({
        id: phoneForm.id,
        phone_type: phoneForm.phone_type,
        number: phoneForm.number,
        operator: phoneForm.operator || null,
        has_whatsapp: phoneForm.has_whatsapp,
        is_primary: phoneForm.is_primary,
      });
      toast({ variant: 'success', title: phoneForm.id ? 'Téléphone mis à jour' : 'Téléphone ajouté', description: phoneForm.number });
      setPhoneForm(null);
    } catch (e) {
      toast({ variant: 'error', title: "Échec de l'enregistrement", description: e instanceof Error ? e.message : 'Erreur inconnue.' });
    }
  };
  const removePhone = async (id: string) => {
    try {
      await deletePhone.mutateAsync(id);
      toast({ variant: 'success', title: 'Téléphone supprimé' });
    } catch (e) {
      toast({ variant: 'error', title: 'Échec de la suppression', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
    }
  };
  const employee = employeeById(SELF_ID)!;
  const country = countryByCode(employee.countryCode);
  const regime = getRegime(employee.countryCode);
  const family = employeeFamily(employee);
  const nationalities = employeeNationalities(employee);
  const languages = employeeLanguages(employee);
  const beneficiaries = employeeBeneficiaries(employee);
  const memberships = employeeMemberships(employee);
  const mandates = employeeMandates(employee);
  const authorizations = employeeAuthorizations(employee);
  const certifications = employeeCertifications(employee);
  const diplomas = employeeDiplomas(employee);
  const career = employeeCareer(employee);
  const docs = employeeDocuments(employee);
  const seniority = Math.floor((Date.parse('2026-05-28') - Date.parse(`${employee.hireDate}T00:00:00`)) / (365.25 * 86_400_000));

  const askModif = (
    <Link to="/espace/demandes"><Button variant="ghost" size="sm"><Pencil size={13} /> Demander une modification</Button></Link>
  );

  return (
    <div className="animate-fade-up space-y-5">
      {/* En-tête persistant */}
      <Card className="surface-night border-0" inset={false}>
        <div className="flex items-center gap-4 p-5">
          <Avatar name={employeeName(employee)} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-ink">{employeeName(employee)}</h1>
            <p className="text-sm font-medium text-ink-500">{employee.role} · {employee.department} · {country.flag} {country.name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="mono rounded-full bg-amber/15 px-2.5 py-1 text-[11px] font-bold text-amber-deep">{matricule(employee)}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11px] font-semibold text-ink-700"><History size={11} /> {seniority} an{seniority > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {/* IDENTITÉ */}
      {tab === 'identite' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="État civil" subtitle="Identité administrative" action={<User size={16} className="text-ink-400" />} />
            <div className="space-y-2"><Row label="Nom & prénoms" value={employeeName(employee)} /><Row label="Poste" value={employee.role} /><Row label="Département" value={employee.department} /></div>
            <div className="mt-2">{askModif}</div>
          </Card>
          <div className="space-y-5">
            <Card>
              <CardHeader title="Nationalités" action={<Globe size={16} className="text-ink-400" />} />
              <div className="flex flex-wrap gap-2">{nationalities.map((n) => <span key={n.code} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface2 px-2.5 py-1 text-xs font-semibold text-ink">{countryByCode(n.code).flag} {countryByCode(n.code).name}{n.primary && <span className="rounded-full bg-amber/15 px-1.5 text-[9px] font-bold text-amber-deep">principale</span>}</span>)}</div>
            </Card>
            <Card>
              <CardHeader title="Langues" action={<Languages size={16} className="text-ink-400" />} />
              <div className="space-y-1.5">{languages.map((l) => <div key={l.label} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-1.5"><span className="text-sm font-semibold text-ink">{l.label}</span><span className="text-[11px] font-semibold text-ink-400">{l.level}</span></div>)}</div>
            </Card>
          </div>
        </div>
      )}

      {/* FAMILLE */}
      {tab === 'famille' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Composition familiale" subtitle={hasLive ? `${liveProfile!.family.length} ayant(s) droit` : `${family.length} ayant(s) droit`} action={hasLive ? liveIndicator : <Users size={16} className="text-ink-400" />} />
            {hasLive ? (
              liveProfile!.family.length > 0 ? (
                <div className="space-y-1.5">{liveProfile!.family.map((m) => { const name = `${m.first_names} ${m.last_name}`.trim(); return <div key={m.id} className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2"><Avatar name={name} size="xs" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{name}</p><p className="truncate text-[11px] font-medium text-ink-400">{MEMBER_TYPE_LABEL[m.member_type] ?? m.member_type}{m.health_insurance_beneficiary ? ' · assuré' : ''}</p></div>{m.fiscal_dependent && <StatusPill tone="amber" dot={false}>À charge</StatusPill>}</div>; })}</div>
              ) : <p className="text-sm font-medium text-ink-400">Aucun ayant droit déclaré.</p>
            ) : (
              <div className="space-y-1.5">{family.map((m) => <div key={m.id} className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2"><Avatar name={m.name} size="xs" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{m.name}</p><p className="truncate text-[11px] font-medium text-ink-400">{m.relation}</p></div>{m.fiscalDependent && <StatusPill tone="amber" dot={false}>À charge</StatusPill>}</div>)}</div>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <Link to="/espace/demandes"><Button variant="outline" size="sm">+ Déclarer une naissance</Button></Link>
              <Link to="/espace/demandes"><Button variant="outline" size="sm">+ Déclarer un mariage</Button></Link>
            </div>
          </Card>
          <Card>
            <CardHeader title="Bénéficiaires (capital décès)" action={<HeartHandshake size={16} className="text-ink-400" />} />
            {beneficiaries.length > 0 ? <div className="space-y-1.5">{beneficiaries.map((b) => <div key={b.id} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-2"><span className="text-sm font-semibold text-ink">{b.name}</span><span className="mono text-sm font-bold text-amber-deep">{b.share}%</span></div>)}</div> : <p className="text-sm font-medium text-ink-400">Aucun bénéficiaire désigné.</p>}
          </Card>
        </div>
      )}

      {/* COORDONNÉES */}
      {tab === 'coordonnees' && (
        hasLive ? (
          <div className="space-y-5">
            <Card>
              <CardHeader title="Adresses" subtitle="Coordonnées postales" action={<div className="flex items-center gap-2">{liveIndicator}<Button variant="outline" size="sm" onClick={() => setAddressForm({ ...EMPTY_ADDRESS })}><Plus size={13} /> Ajouter</Button></div>} />
              {liveProfile!.addresses.length > 0 ? (
                <div className="space-y-1.5">{liveProfile!.addresses.map((a) => <div key={a.id} className="flex items-start gap-3 rounded-xl bg-surface2 px-3 py-2.5"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.05] text-ink-500"><MapPin size={15} /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{a.line_1}</p><p className="text-[11px] font-medium text-ink-400">{[a.neighborhood, a.city, countryByCode(a.country_code)?.name].filter(Boolean).join(' · ')}{a.local_references ? ` — ${a.local_references}` : ''}</p></div><span className="flex items-center gap-1.5">{a.is_primary && <StatusPill tone="amber" dot={false}>Principale</StatusPill>}<span className="text-[10px] font-semibold text-ink-400">{ADDRESS_TYPE_LABEL[a.address_type] ?? a.address_type}</span><button type="button" title="Modifier" className="text-ink-400 hover:text-ink" onClick={() => setAddressForm({ id: a.id, address_type: a.address_type, line_1: a.line_1, neighborhood: a.neighborhood ?? '', city: a.city, country_code: a.country_code, local_references: a.local_references ?? '', is_primary: a.is_primary })}><Pencil size={14} /></button><button type="button" title="Supprimer" disabled={deleteAddress.isPending} className="text-ink-400 hover:text-danger disabled:opacity-50" onClick={() => removeAddress(a.id)}><Trash2 size={14} /></button></span></div>)}</div>
              ) : <p className="text-sm font-medium text-ink-400">Aucune adresse enregistrée.</p>}
            </Card>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader title="Téléphones" action={<Button variant="outline" size="sm" onClick={() => setPhoneForm({ ...EMPTY_PHONE })}><Plus size={13} /> Ajouter</Button>} />
                {liveProfile!.phones.length > 0 ? (
                  <div className="space-y-1.5">{liveProfile!.phones.map((p) => <div key={p.id} className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.05] text-ink-500"><Phone size={15} /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{p.number}</p><p className="text-[11px] font-medium text-ink-400">{[p.operator, p.has_whatsapp ? 'WhatsApp' : null].filter(Boolean).join(' · ') || (PHONE_TYPE_LABEL[p.phone_type] ?? p.phone_type)}</p></div><span className="flex items-center gap-1.5">{p.is_primary && <StatusPill tone="amber" dot={false}>Principal</StatusPill>}<button type="button" title="Modifier" className="text-ink-400 hover:text-ink" onClick={() => setPhoneForm({ id: p.id, number: p.number, phone_type: p.phone_type, operator: p.operator ?? '', has_whatsapp: !!p.has_whatsapp, is_primary: p.is_primary })}><Pencil size={14} /></button><button type="button" title="Supprimer" disabled={deletePhone.isPending} className="text-ink-400 hover:text-danger disabled:opacity-50" onClick={() => removePhone(p.id)}><Trash2 size={14} /></button></span></div>)}</div>
                ) : <p className="text-sm font-medium text-ink-400">Aucun téléphone enregistré.</p>}
              </Card>
              <Card>
                <CardHeader title="Emails" action={<Mail size={16} className="text-ink-400" />} />
                {liveProfile!.emails.length > 0 ? (
                  <div className="space-y-1.5">{liveProfile!.emails.map((e) => <div key={e.id} className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.05] text-ink-500"><Mail size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{e.address}</p><p className="text-[11px] font-medium text-ink-400">{e.email_type}</p></div>{e.is_primary && <StatusPill tone="amber" dot={false}>Principal</StatusPill>}</div>)}</div>
                ) : <p className="text-sm font-medium text-ink-400">Aucun email enregistré.</p>}
              </Card>
            </div>

            {/* Drawer adresse */}
            <Drawer open={!!addressForm} onClose={() => setAddressForm(null)} title={addressForm?.id ? 'Modifier une adresse' : 'Ajouter une adresse'}>
              {addressForm && (
                <div className="space-y-3">
                  <FormField label="Type" required>
                    <Select value={addressForm.address_type} onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value })}>
                      {Object.entries(ADDRESS_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Adresse (ligne 1)" required><TextInput value={addressForm.line_1} onChange={(e) => setAddressForm({ ...addressForm, line_1: e.target.value })} placeholder="Rue, immeuble, lot…" /></FormField>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Quartier"><TextInput value={addressForm.neighborhood} onChange={(e) => setAddressForm({ ...addressForm, neighborhood: e.target.value })} /></FormField>
                    <FormField label="Ville" required><TextInput value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} /></FormField>
                  </div>
                  <FormField label="Pays" required>
                    <Select value={addressForm.country_code} onChange={(e) => setAddressForm({ ...addressForm, country_code: e.target.value })}>
                      {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Références locales"><TextInput value={addressForm.local_references} onChange={(e) => setAddressForm({ ...addressForm, local_references: e.target.value })} placeholder="Point de repère…" /></FormField>
                  <label className="flex items-center gap-2 text-sm font-medium text-ink-700"><input type="checkbox" className="h-4 w-4 rounded border-line accent-amber" checked={addressForm.is_primary} onChange={(e) => setAddressForm({ ...addressForm, is_primary: e.target.checked })} /> Adresse principale</label>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => setAddressForm(null)}>Annuler</Button>
                    <Button size="sm" disabled={upsertAddress.isPending} onClick={submitAddress}>{addressForm.id ? 'Enregistrer' : 'Ajouter'}</Button>
                  </div>
                </div>
              )}
            </Drawer>

            {/* Drawer téléphone */}
            <Drawer open={!!phoneForm} onClose={() => setPhoneForm(null)} title={phoneForm?.id ? 'Modifier un téléphone' : 'Ajouter un téléphone'}>
              {phoneForm && (
                <div className="space-y-3">
                  <FormField label="Numéro" required><TextInput value={phoneForm.number} onChange={(e) => setPhoneForm({ ...phoneForm, number: e.target.value })} placeholder="+225 07 00 00 00 00" /></FormField>
                  <FormField label="Type" required>
                    <Select value={phoneForm.phone_type} onChange={(e) => setPhoneForm({ ...phoneForm, phone_type: e.target.value })}>
                      {Object.entries(PHONE_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Opérateur"><TextInput value={phoneForm.operator} onChange={(e) => setPhoneForm({ ...phoneForm, operator: e.target.value })} placeholder="Orange, MTN, Moov…" /></FormField>
                  <label className="flex items-center gap-2 text-sm font-medium text-ink-700"><input type="checkbox" className="h-4 w-4 rounded border-line accent-amber" checked={phoneForm.has_whatsapp} onChange={(e) => setPhoneForm({ ...phoneForm, has_whatsapp: e.target.checked })} /> WhatsApp actif</label>
                  <label className="flex items-center gap-2 text-sm font-medium text-ink-700"><input type="checkbox" className="h-4 w-4 rounded border-line accent-amber" checked={phoneForm.is_primary} onChange={(e) => setPhoneForm({ ...phoneForm, is_primary: e.target.checked })} /> Téléphone principal</label>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => setPhoneForm(null)}>Annuler</Button>
                    <Button size="sm" disabled={upsertPhone.isPending} onClick={submitPhone}>{phoneForm.id ? 'Enregistrer' : 'Ajouter'}</Button>
                  </div>
                </div>
              )}
            </Drawer>
          </div>
        ) : (
        <Card>
          <CardHeader title="Mes coordonnées" subtitle="Modifiables directement (OTP pour les sensibles)" action={<Button variant="ghost" size="sm"><Pencil size={13} /> Modifier</Button>} />
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <Info icon={Mail} label="Email" value={employee.email} />
            <Info icon={Phone} label="Téléphone" value={employee.phone ?? '—'} />
            <Info icon={MapPin} label="Adresse principale" value={employee.address ?? '—'} />
            <Info icon={Wallet} label="Mobile Money" value={employee.mobileMoneyNumber ?? mobileMoney(employee)} />
          </div>
        </Card>
        )
      )}

      {/* PIÈCES */}
      {tab === 'pieces' && (
        <Card>
          <CardHeader title="Pièces d'identité & documents légaux" action={<CreditCard size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            <DocRow icon={CreditCard} title="Carte nationale d'identité" sub={`Expire le ${employee.idExpiry ? frDate(employee.idExpiry) : '—'}`} expiring={!!employee.idExpiry} />
            <DocRow icon={CreditCard} title="Passeport" sub="Expire le 28/11/2026" expiring />
          </div>
          <div className="mt-2"><Button variant="outline" size="sm"><Pencil size={13} /> Soumettre un document mis à jour</Button></div>
        </Card>
      )}

      {/* COUVERTURE */}
      {tab === 'couverture' && (
        <Card>
          <CardHeader title="Couverture sociale & assurances" subtitle={`Régime ${regime.socialFund}`} action={<ShieldPlus size={16} className="text-ink-400" />} />
          <div className="space-y-2">
            <Row label="Caisse sociale" value={`${regime.socialFund} · v${regime.version}`} />
            <Row label="N° d'affiliation" value={`${employee.countryCode}-${matricule(employee)}`} />
            <Row label="Assurance santé groupe" value={`Actif · ${family.length} ayant(s) droit couvert(s)`} />
          </div>
        </Card>
      )}

      {/* FISCAL */}
      {tab === 'fiscal' && (
        <Card>
          <CardHeader title="Mon identité fiscale" action={<Landmark size={16} className="text-ink-400" />} />
          <div className="space-y-2"><Row label="Pays" value={`${country.flag} ${country.name}`} /><Row label="NIF" value={`${employee.countryCode}-${matricule(employee)}-FISC`} /><Row label="Parts fiscales" value={String(employee.fiscalParts)} /><Row label="Résidence fiscale" value="Résident" /></div>
          <div className="mt-2">{askModif}</div>
        </Card>
      )}

      {/* VERSEMENT */}
      {tab === 'versement' && (
        <Card className="border-amber/25">
          <CardHeader title="Mes comptes de versement" subtitle="Donnée sensible — ré-authentification requise" action={hasLive ? liveIndicator : <StatusPill tone="amber" dot={false}><Lock size={11} /> Sensible</StatusPill>} />
          {hasLive ? (
            <div className="space-y-3">
              <Row label="Mode" value={liveProfile!.paymentMethod ? (liveProfile!.paymentMethod.primary_mode + (liveProfile!.paymentMethod.has_split ? ' · versement fractionné' : '')) : '—'} />
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-400">Comptes bancaires</p>
                {liveProfile!.bankAccounts.length > 0 ? (
                  <div className="space-y-1.5">{liveProfile!.bankAccounts.map((b) => <div key={b.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Landmark size={15} /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{b.bank_name}</p><p className="mono truncate text-[11px] font-medium text-ink-400">{b.iban} · {b.account_holder_name} · {b.currency}</p></div><span className="flex items-center gap-1.5">{b.is_primary && <StatusPill tone="amber" dot={false}>Principal</StatusPill>}<span className="text-[10px] font-semibold text-ink-400">{b.status}</span></span></div>)}</div>
                ) : <p className="text-sm font-medium text-ink-400">Aucun compte bancaire.</p>}
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-400">Mobile Money</p>
                {liveProfile!.mobileMoney.length > 0 ? (
                  <div className="space-y-1.5">{liveProfile!.mobileMoney.map((m) => <div key={m.id} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Wallet size={15} /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{m.operator} · {m.phone_number}</p><p className="text-[11px] font-medium text-ink-400">{m.account_holder_name}</p></div><span className="flex items-center gap-1.5">{m.is_primary && <StatusPill tone="amber" dot={false}>Principal</StatusPill>}<span className="text-[10px] font-semibold text-ink-400">{m.status}</span></span></div>)}</div>
                ) : <p className="text-sm font-medium text-ink-400">Aucun compte Mobile Money.</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-2"><Row label="Mode" value="Versement unique" /><Row label="Mobile Money" value={mobileMoney(employee)} /></div>
          )}
          <p className="mt-2 text-[11px] font-medium text-ink-400">Toute modification nécessite une ré-authentification + OTP, est notifiée à vous et à la DRH, et s'applique à la paie suivante (jamais rétroactif).</p>
          <Button variant="outline" size="sm" className="mt-2"><Lock size={13} /> Modifier (ré-auth)</Button>
        </Card>
      )}

      {/* AFFILIATIONS */}
      {tab === 'affiliations' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Affiliations professionnelles" action={<Building2 size={16} className="text-ink-400" />} />
            {memberships.length > 0 ? <div className="space-y-1.5">{memberships.map((m) => <div key={m.organization} className="rounded-xl bg-surface2 px-3 py-2"><p className="text-sm font-semibold text-ink">{m.organization}</p><p className="text-[11px] font-medium text-ink-400">{m.type}</p></div>)}</div> : <p className="text-sm font-medium text-ink-400">Aucune affiliation déclarée.</p>}
          </Card>
          <Card>
            <CardHeader title="Mandats" subtitle="Internes (lecture seule) & externes" action={<Award size={16} className="text-ink-400" />} />
            {mandates.length > 0 ? <div className="space-y-1.5">{mandates.map((m) => <div key={m.type} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2"><span className="text-sm font-semibold text-ink">{m.type}</span><StatusPill tone={m.category === 'staff_representation' ? 'warn' : 'neutral'} dot={false}>{m.category === 'staff_representation' ? 'Interne' : 'Externe'}</StatusPill></div>)}</div> : <p className="text-sm font-medium text-ink-400">Aucun mandat.</p>}
          </Card>
        </div>
      )}

      {/* HABILITATIONS */}
      {tab === 'habilitations' && (
        <Card>
          <CardHeader title="Habilitations & certifications" action={<Award size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            {authorizations.map((a) => <div key={a.code} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2"><span className="mono rounded bg-ink/[0.05] px-1.5 py-0.5 text-[10px] font-bold text-ink-500">{a.code}</span><span className="flex-1 truncate text-sm font-semibold text-ink">{a.label}</span><StatusPill tone={a.status === 'expired' ? 'danger' : 'ok'} dot={false}>{a.status === 'expired' ? 'Expirée' : 'Valide'} · {frDate(a.expiry)}</StatusPill></div>)}
            {certifications.map((c) => <div key={c.label} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Award size={13} /></span><span className="flex-1 truncate text-sm font-semibold text-ink">{c.label}</span><StatusPill tone="ok" dot={false}>{c.certifier}</StatusPill></div>)}
          </div>
        </Card>
      )}

      {/* DIPLÔMES */}
      {tab === 'diplomes' && (
        <Card>
          <CardHeader title="Diplômes & formations externes" subtitle={employeeEducationLevel(employee)} action={<GraduationCap size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">{diplomas.map((d) => <div key={d.title} className="flex items-start gap-3 rounded-xl bg-surface2 px-3 py-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><GraduationCap size={15} /></span><div><p className="text-sm font-semibold text-ink">{d.title}</p><p className="text-[11px] font-medium text-ink-400">{d.institution} · {d.year}</p></div></div>)}</div>
        </Card>
      )}

      {/* MOBILITÉ */}
      {tab === 'mobilite' && (
        <Card>
          <CardHeader title="Ma mobilité internationale" action={<Plane size={16} className="text-ink-400" />} />
          <div className="space-y-2"><Row label="Statut géographique" value="Local" /><Row label="Pays d'affectation" value={`${country.flag} ${country.name}`} /></div>
          <p className="mt-2 text-[11px] font-medium text-ink-400">Aucun package d'expatriation actif. En cas de mobilité internationale, votre package détaillé apparaîtra ici.</p>
        </Card>
      )}

      {/* PARCOURS */}
      {tab === 'parcours' && (
        <Card>
          <CardHeader title="Mon parcours dans l'entreprise" subtitle={`Ancienneté ${seniority} an(s)`} action={<History size={16} className="text-ink-400" />} />
          <Timeline items={career.map((s) => ({ date: s.date, title: s.title, tone: s.type === 'initial_hiring' ? 'ok' : s.type === 'promotion' ? 'amber' : 'neutral' }))} />
        </Card>
      )}

      {/* DOCUMENTS */}
      {tab === 'documents' && (
        <Card>
          <CardHeader title="Mes documents" subtitle="Coffre personnel" action={<FileStack size={16} className="text-ink-400" />} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{docs.map((d) => <div key={d.name} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><FileStack size={14} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{d.name}</p><p className="text-[11px] font-medium text-ink-400">{d.kind} · {frDate(d.date)}</p></div></div>)}</div>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="font-medium text-ink-500">{label}</span><span className="font-semibold text-ink">{value}</span></div>;
}
function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return <div className="flex items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.05] text-ink-500"><Icon size={15} /></span><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p><p className="text-sm font-semibold text-ink">{value}</p></div></div>;
}
function DocRow({ icon: Icon, title, sub, expiring }: { icon: typeof CreditCard; title: string; sub: string; expiring?: boolean }) {
  return <div className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5', expiring ? 'bg-warn/[0.06]' : 'bg-surface2')}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><Icon size={15} /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{title}</p><p className="text-[11px] font-medium text-ink-400">{sub}</p></div><Button variant="ghost" size="sm">Voir</Button></div>;
}
