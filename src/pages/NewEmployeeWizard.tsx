import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Lock, ShieldCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { FormField, TextInput, Select } from '../components/ui/FormField';
import { MoneyInput } from '../components/ui/MoneyDisplay';
import { Switch } from '../components/ui/controls';
import { PropheticHint } from '../components/ui/feedback';
import { Money } from '../lib/money';
import { getRegime, computePayslip } from '../lib/payroll';
import { countryByCode, COUNTRIES } from '../data/countries';
import { timeRulesFor } from '../lib/time/leaveRules';
import { DEFAULT_PAY_COMPONENTS } from '../lib/m1/payComponents';
import { useDirectory } from '../store/useDirectory';
import { useToast } from '../components/ui/Toast';
import { employeeName, type EmployeeRecord } from '../data/mock';
import { useCreateEmployee, isBackendConfigured } from '../lib/m1/supabaseLive';
import { cn } from '../lib/cn';

const STEPS = ['État civil', 'Documents légaux', 'Famille', 'Couverture sociale', 'Identité fiscale', 'Coordonnées', 'Versement', 'Contrat', 'Rémunération', 'Récapitulatif'];

interface Nat { code: string; primary: boolean }
interface Lang { label: string; level: string }
interface Doc { type: string; number: string; expiry: string }
interface Spouse { name: string; birthDate: string; unionType: string; fiscalDependent: boolean }
interface Child { name: string; birthDate: string; filiation: string; fiscalDependent: boolean }
interface Ascendant { link: string; name: string }
interface Benef { name: string; share: number }
interface Affil { code: string; label: string; number: string }
interface Addr { type: string; line1: string; refs: string; neighborhood: string; city: string; poBox: string }
interface Phone { number: string; operator: string; whatsapp: boolean; mm: boolean; primary: boolean }

interface Form {
  civility: string; lastName: string; firstNames: string; usageName: string; birthDate: string; gender: string; maritalStatus: string;
  nationalities: Nat[]; languages: Lang[]; showExtra: boolean; religion: string; bloodGroup: string; clothingSize: string;
  documents: Doc[];
  spouses: Spouse[]; children: Child[]; ascendants: Ascendant[]; beneficiaries: Benef[];
  countryCode: string; affiliations: Affil[]; healthInsurance: boolean; insuranceLevel: string;
  taxIdType: string; taxIdNumber: string; fiscalResidence: string;
  addresses: Addr[]; phones: Phone[]; email: string; emName: string; emPhone: string; emLink: string; prefLang: string; prefChannel: string;
  paymentMethod: string; mmOperator: string; mmNumber: string; bankName: string; rib: string;
  contractType: string; startDate: string; endDate: string; jobTitle: string; department: string; managerId: string; workplace: string; classification: string; weeklyHours: number;
  baseSalary: number; periodicity: string;
}

const initial: Form = {
  civility: 'M', lastName: '', firstNames: '', usageName: '', birthDate: '', gender: 'M', maritalStatus: 'single',
  nationalities: [{ code: 'CI', primary: true }], languages: [{ label: 'Français', level: 'native' }], showExtra: false, religion: '', bloodGroup: 'unknown', clothingSize: '',
  documents: [{ type: 'cni', number: '', expiry: '' }],
  spouses: [], children: [], ascendants: [], beneficiaries: [],
  countryCode: 'CI', affiliations: [], healthInsurance: true, insuranceLevel: 'Standard',
  taxIdType: 'NCC', taxIdNumber: '', fiscalResidence: 'resident_local',
  addresses: [{ type: 'residence_primary', line1: '', refs: '', neighborhood: '', city: '', poBox: '' }],
  phones: [{ number: '', operator: 'orange', whatsapp: true, mm: true, primary: true }], email: '', emName: '', emPhone: '', emLink: 'Conjoint', prefLang: 'fr', prefChannel: 'whatsapp',
  paymentMethod: 'mobile_money', mmOperator: 'orange', mmNumber: '', bankName: '', rib: '',
  contractType: 'cdi', startDate: '2026-06-01', endDate: '', jobTitle: '', department: 'Technologie', managerId: '', workplace: 'Siège', classification: '', weeklyHours: 40,
  baseSalary: 0, periodicity: 'monthly',
};

const FUNDS: Record<string, { code: string; label: string }[]> = {
  CI: [{ code: 'CNPS_CI', label: 'CNPS' }, { code: 'CMU_CI', label: 'CMU' }],
  SN: [{ code: 'IPRES_SN', label: 'IPRES' }, { code: 'CSS_SN', label: 'CSS' }],
};
const TAX_TYPE: Record<string, string> = { CI: 'NCC', SN: 'NINEA' };

export function NewEmployeeWizard() {
  const navigate = useNavigate();
  const { employees, addEmployee } = useDirectory();
  const createEmployee = useCreateEmployee();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(initial);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const country = countryByCode(f.countryCode);
  const regime = country.configured ? getRegime(f.countryCode) : null;
  const fiscalParts = useMemo(
    () => Math.min(5, 1 + f.spouses.length * 0.5 + f.children.filter((c) => c.fiscalDependent).length * 0.5),
    [f.spouses, f.children],
  );
  const affiliations = useMemo(() => (FUNDS[f.countryCode] ?? [{ code: 'CNSS', label: 'CNSS' }]), [f.countryCode]);

  const computation = useMemo(() => {
    if (f.baseSalary <= 0 || !regime) return null;
    return computePayslip({ baseSalary: f.baseSalary, taxableAllowances: 0, nonTaxableAllowances: 0, fiscalParts }, regime, `${f.firstNames} ${f.lastName}`);
  }, [f.baseSalary, fiscalParts, regime, f.firstNames, f.lastName]);

  const canProceed = (s: number): boolean => {
    switch (s) {
      case 0: return f.lastName.length >= 2 && f.firstNames.length >= 2 && !!f.birthDate && f.nationalities.length >= 1;
      case 1: return f.documents.some((d) => d.type && d.number.length >= 3);
      case 5: return f.addresses[0]?.line1.length >= 2 && f.addresses[0]?.city.length >= 2 && f.phones[0]?.number.length >= 6 && f.emName.length >= 2 && f.emPhone.length >= 6;
      case 6: return f.paymentMethod !== 'mobile_money' ? (f.paymentMethod !== 'bank_transfer' || f.rib.length >= 4) : f.mmNumber.length >= 6;
      case 7: return !!f.contractType && !!f.startDate && f.jobTitle.length >= 2 && !!f.department && (!['cdd', 'internship'].includes(f.contractType) || !!f.endDate);
      case 8: return f.baseSalary > 0;
      default: return true;
    }
  };

  const create = async () => {
    const id = `e${Date.now()}`;
    const contractType: EmployeeRecord['contractType'] = f.contractType === 'cdi' ? 'CDI' : f.contractType === 'cdd' ? 'CDD' : 'Stage';
    const manager = employees.find((e) => e.id === f.managerId);
    const record: EmployeeRecord = {
      id, firstName: f.firstNames.split(' ')[0] || f.firstNames, lastName: f.lastName, role: f.jobTitle, department: f.department,
      countryCode: f.countryCode, email: f.email, contractType, hireDate: f.startDate, status: 'onboarding',
      baseSalary: f.baseSalary, taxableAllowances: 0, nonTaxableAllowances: 0, fiscalParts,
      manager: manager ? employeeName(manager) : undefined, retentionAttention: 10,
      phone: f.phones[0]?.number, mobileMoneyNumber: f.paymentMethod === 'mobile_money' ? f.mmNumber : undefined,
    };
    if (isBackendConfigured) {
      // Live : Supabase source de vérité (audit inclus).
      try {
        await createEmployee.mutateAsync(record);
      } catch (e) {
        toast({ variant: 'error', title: 'Échec de la création', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
        return;
      }
      toast({ variant: 'success', title: 'Collaborateur créé', description: `${employeeName(record)} · enregistré. Onboarding (M6) déclenché.` });
      navigate('/collaborateurs');
      return;
    }
    // Démo local : store Zustand.
    addEmployee(record);
    toast({ variant: 'success', title: 'Collaborateur créé', description: `${employeeName(record)} · matricule attribué. Onboarding (M6) déclenché.` });
    navigate(`/collaborateurs/${id}`);
  };

  return (
    <div className="animate-fade-up">
      <Link to="/collaborateurs" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink"><ArrowLeft size={15} /> Collaborateurs</Link>

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {STEPS.map((label, i) => (
          <button key={label} onClick={() => i <= step && setStep(i)} className={cn('flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all', i === step ? 'bg-amber text-night' : i < step ? 'bg-amber/12 text-amber-deep' : 'bg-ink/[0.04] text-ink-400')}>
            <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px]', i <= step ? 'bg-amber text-night' : 'bg-ink/10 text-ink-400')}>{i < step ? <Check size={11} /> : i + 1}</span>
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      <Card className="mx-auto max-w-3xl">
        <h2 className="mb-1 text-xl font-semibold text-ink">{STEPS[step]}</h2>
        <p className="mb-5 text-sm font-medium text-ink-400">Étape {step + 1} / {STEPS.length}</p>

        {/* 0 — État civil étendu */}
        {step === 0 && (
          <div className="space-y-5">
            <Grid>
              <FormField label="Civilité"><Select value={f.civility} onChange={(e) => set('civility', e.target.value)}><option value="M">M</option><option value="Mme">Mme</option></Select></FormField>
              <FormField label="Genre"><Select value={f.gender} onChange={(e) => set('gender', e.target.value)}><option value="M">Masculin</option><option value="F">Féminin</option></Select></FormField>
              <FormField label="Nom" required><TextInput value={f.lastName} onChange={(e) => set('lastName', e.target.value)} /></FormField>
              <FormField label="Prénoms" required><TextInput value={f.firstNames} onChange={(e) => set('firstNames', e.target.value)} /></FormField>
              <FormField label="Nom d'usage" hint="Affiché dans l'app ; le nom légal reste sur les documents."><TextInput value={f.usageName} onChange={(e) => set('usageName', e.target.value)} /></FormField>
              <FormField label="Date de naissance" required><TextInput type="date" value={f.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></FormField>
              <FormField label="Situation familiale"><Select value={f.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}><option value="single">Célibataire</option><option value="married">Marié(e)</option><option value="married_poly">Marié(e) — polygamie</option><option value="divorced">Divorcé(e)</option><option value="widowed">Veuf(ve)</option><option value="cohabiting">Union libre</option></Select></FormField>
            </Grid>

            <ListSection title="Nationalités" onAdd={() => set('nationalities', [...f.nationalities, { code: 'CI', primary: false }])}>
              {f.nationalities.map((n, i) => (
                <Row key={i} onRemove={f.nationalities.length > 1 ? () => set('nationalities', f.nationalities.filter((_, j) => j !== i)) : undefined}>
                  <Select value={n.code} onChange={(e) => set('nationalities', f.nationalities.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </Select>
                  <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-ink-500"><input type="radio" checked={n.primary} onChange={() => set('nationalities', f.nationalities.map((x, j) => ({ ...x, primary: j === i })))} className="accent-amber" /> principale</label>
                </Row>
              ))}
            </ListSection>

            <ListSection title="Langues parlées" onAdd={() => set('languages', [...f.languages, { label: '', level: 'b2' }])}>
              {f.languages.map((l, i) => (
                <Row key={i} onRemove={f.languages.length > 1 ? () => set('languages', f.languages.filter((_, j) => j !== i)) : undefined}>
                  <TextInput placeholder="Langue" value={l.label} onChange={(e) => set('languages', f.languages.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <Select value={l.level} onChange={(e) => set('languages', f.languages.map((x, j) => (j === i ? { ...x, level: e.target.value } : x)))}>
                    {[['a2', 'Élémentaire'], ['b1', 'Intermédiaire'], ['b2', 'Avancé'], ['c1', 'Courant'], ['native', 'Langue maternelle']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                  </Select>
                </Row>
              ))}
            </ListSection>

            <div className="rounded-xl border border-line bg-surface2 p-3.5">
              <Switch checked={f.showExtra} onChange={(v) => set('showExtra', v)} label="Informations complémentaires (facultatives)" hint="Taille, groupe sanguin, confession — pour uniformes, urgences, aménagements." />
              {f.showExtra && (
                <div className="mt-3"><Grid>
                  <FormField label="Confession (optionnel)"><TextInput value={f.religion} onChange={(e) => set('religion', e.target.value)} /></FormField>
                  <FormField label="Groupe sanguin"><Select value={f.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)}>{['unknown', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => <option key={g} value={g}>{g === 'unknown' ? 'Inconnu' : g}</option>)}</Select></FormField>
                  <FormField label="Taille de tenue"><Select value={f.clothingSize} onChange={(e) => set('clothingSize', e.target.value)}><option value="">—</option>{['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => <option key={s}>{s}</option>)}</Select></FormField>
                </Grid></div>
              )}
            </div>
          </div>
        )}

        {/* 1 — Documents légaux */}
        {step === 1 && (
          <ListSection title="Documents légaux" onAdd={() => set('documents', [...f.documents, { type: 'passport', number: '', expiry: '' }])}>
            {f.documents.map((d, i) => (
              <Row key={i} onRemove={f.documents.length > 1 ? () => set('documents', f.documents.filter((_, j) => j !== i)) : undefined}>
                <Select value={d.type} onChange={(e) => set('documents', f.documents.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>
                  {[['cni', 'CNI'], ['passport', 'Passeport'], ['residence_card', 'Carte de séjour'], ['work_permit', 'Permis de travail'], ['driving_license', 'Permis de conduire']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </Select>
                <TextInput placeholder="Numéro" value={d.number} onChange={(e) => set('documents', f.documents.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)))} />
                <TextInput type="date" value={d.expiry} onChange={(e) => set('documents', f.documents.map((x, j) => (j === i ? { ...x, expiry: e.target.value } : x)))} />
              </Row>
            ))}
            <PropheticHint className="mt-2">OCR de la pièce à l'upload (Ollama souverain) ; expirations suivies à J-60/30/7.</PropheticHint>
          </ListSection>
        )}

        {/* 2 — Famille */}
        {step === 2 && (
          <div className="space-y-5">
            <ListSection title="Conjoint(s)" onAdd={() => (f.maritalStatus.startsWith('married') && (f.maritalStatus === 'married_poly' || f.spouses.length === 0)) && set('spouses', [...f.spouses, { name: '', birthDate: '', unionType: 'civil', fiscalDependent: true }])}>
              {f.spouses.length === 0 && <p className="text-sm font-medium text-ink-400">{f.maritalStatus.startsWith('married') ? 'Ajoutez le(s) conjoint(s).' : 'Situation « célibataire » — aucun conjoint.'}</p>}
              {f.spouses.map((s, i) => (
                <Row key={i} onRemove={() => set('spouses', f.spouses.filter((_, j) => j !== i))}>
                  <TextInput placeholder="Nom du conjoint" value={s.name} onChange={(e) => set('spouses', f.spouses.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <Select value={s.unionType} onChange={(e) => set('spouses', f.spouses.map((x, j) => (j === i ? { ...x, unionType: e.target.value } : x)))}>{[['civil', 'Civil'], ['religious', 'Religieux'], ['customary', 'Coutumier']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Select>
                </Row>
              ))}
            </ListSection>
            <ListSection title="Enfants" onAdd={() => set('children', [...f.children, { name: '', birthDate: '', filiation: 'biological', fiscalDependent: true }])}>
              {f.children.map((c, i) => (
                <Row key={i} onRemove={() => set('children', f.children.filter((_, j) => j !== i))}>
                  <TextInput placeholder="Nom de l'enfant" value={c.name} onChange={(e) => set('children', f.children.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <TextInput type="date" value={c.birthDate} onChange={(e) => set('children', f.children.map((x, j) => (j === i ? { ...x, birthDate: e.target.value } : x)))} />
                  <label className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-ink-500"><input type="checkbox" checked={c.fiscalDependent} onChange={(e) => set('children', f.children.map((x, j) => (j === i ? { ...x, fiscalDependent: e.target.checked } : x)))} className="accent-amber" /> à charge</label>
                </Row>
              ))}
            </ListSection>
            <ListSection title="Ascendants à charge" onAdd={() => set('ascendants', [...f.ascendants, { link: 'Mère', name: '' }])}>
              {f.ascendants.map((a, i) => (
                <Row key={i} onRemove={() => set('ascendants', f.ascendants.filter((_, j) => j !== i))}>
                  <Select value={a.link} onChange={(e) => set('ascendants', f.ascendants.map((x, j) => (j === i ? { ...x, link: e.target.value } : x)))}>{['Père', 'Mère', 'Beau-père', 'Belle-mère'].map((l) => <option key={l}>{l}</option>)}</Select>
                  <TextInput placeholder="Nom" value={a.name} onChange={(e) => set('ascendants', f.ascendants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                </Row>
              ))}
            </ListSection>
            <div className="rounded-xl bg-surface2 px-4 py-3 text-sm font-medium text-ink-700">Parts fiscales calculées : <span className="mono font-bold text-amber-deep">{fiscalParts}</span> · {f.children.filter((c) => c.fiscalDependent).length} enfant(s) à charge.</div>
          </div>
        )}

        {/* 3 — Couverture sociale */}
        {step === 3 && (
          <div className="space-y-5">
            <Grid>
              <FormField label="Pays d'affectation" required hint="Détermine régime, devise et caisses."><Select value={f.countryCode} onChange={(e) => set('countryCode', e.target.value)}>{COUNTRIES.map((c) => <option key={c.code} value={c.code} disabled={!c.configured}>{c.flag} {c.name}{c.configured ? '' : ' (à configurer)'}</option>)}</Select></FormField>
              <FormField label="Devise"><TextInput disabled value={`${country.currency} (FCFA)`} /></FormField>
            </Grid>
            <ListSection title={`Affiliations obligatoires · ${country.socialFund}`} onAdd={undefined}>
              {affiliations.map((a) => {
                const cur = f.affiliations.find((x) => x.code === a.code)?.number ?? '';
                return (
                  <Row key={a.code}>
                    <span className="flex w-28 shrink-0 items-center text-sm font-semibold text-ink">{a.label}</span>
                    <TextInput placeholder="N° d'immatriculation" value={cur} onChange={(e) => set('affiliations', [...f.affiliations.filter((x) => x.code !== a.code), { code: a.code, label: a.label, number: e.target.value }])} />
                  </Row>
                );
              })}
            </ListSection>
            <div className="rounded-xl border border-line bg-surface2 p-3.5">
              <Switch checked={f.healthInsurance} onChange={(v) => set('healthInsurance', v)} label="Assurance santé groupe (employeur)" hint="Couvre l'employé et ses ayants droit." />
              {f.healthInsurance && <div className="mt-3"><FormField label="Niveau"><Select value={f.insuranceLevel} onChange={(e) => set('insuranceLevel', e.target.value)}>{['Standard', 'Premium', 'VIP'].map((n) => <option key={n}>{n}</option>)}</Select></FormField></div>}
            </div>
          </div>
        )}

        {/* 4 — Identité fiscale */}
        {step === 4 && (
          <div className="space-y-5">
            <Grid>
              <FormField label="Type d'identifiant"><Select value={f.taxIdType} onChange={(e) => set('taxIdType', e.target.value)}>{['NCC', 'NINEA', 'NIF', 'NIU', 'IFU'].map((t) => <option key={t}>{t}</option>)}</Select></FormField>
              <FormField label={`N° ${TAX_TYPE[f.countryCode] ?? 'fiscal'} (${country.name})`}><TextInput value={f.taxIdNumber} onChange={(e) => set('taxIdNumber', e.target.value)} /></FormField>
              <FormField label="Statut de résidence fiscale"><Select value={f.fiscalResidence} onChange={(e) => set('fiscalResidence', e.target.value)}>{[['resident_local', `Résident fiscal ${country.name}`], ['non_resident', 'Non-résident'], ['resident_other_country', 'Résident d\'un autre pays']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Select></FormField>
            </Grid>
            <div className="rounded-xl bg-surface2 px-4 py-3 text-sm font-medium text-ink-700">Charges fiscales (calculé) : <span className="mono font-bold text-amber-deep">{fiscalParts} part(s)</span> · {f.children.filter((c) => c.fiscalDependent).length} enfant(s) · {f.spouses.length} conjoint(s).</div>
          </div>
        )}

        {/* 5 — Coordonnées étendues */}
        {step === 5 && (
          <div className="space-y-5">
            <ListSection title="Adresses" onAdd={() => set('addresses', [...f.addresses, { type: 'family_home', line1: '', refs: '', neighborhood: '', city: '', poBox: '' }])}>
              {f.addresses.map((a, i) => (
                <div key={i} className="rounded-xl border border-line p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Select className="w-48" value={a.type} onChange={(e) => set('addresses', f.addresses.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>{[['residence_primary', 'Résidence principale'], ['family_home', 'Domicile familial (village)'], ['residence_secondary', 'Résidence secondaire']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Select>
                    {i > 0 && <button onClick={() => set('addresses', f.addresses.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-danger hover:bg-danger/10"><Trash2 size={15} /></button>}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <TextInput placeholder="Adresse / lieu-dit *" value={a.line1} onChange={(e) => set('addresses', f.addresses.map((x, j) => (j === i ? { ...x, line1: e.target.value } : x)))} />
                    <TextInput placeholder="Quartier" value={a.neighborhood} onChange={(e) => set('addresses', f.addresses.map((x, j) => (j === i ? { ...x, neighborhood: e.target.value } : x)))} />
                    <TextInput placeholder="Références (ex : derrière la mosquée)" value={a.refs} onChange={(e) => set('addresses', f.addresses.map((x, j) => (j === i ? { ...x, refs: e.target.value } : x)))} />
                    <TextInput placeholder="Ville *" value={a.city} onChange={(e) => set('addresses', f.addresses.map((x, j) => (j === i ? { ...x, city: e.target.value } : x)))} />
                    <TextInput placeholder="Boîte postale (BP)" value={a.poBox} onChange={(e) => set('addresses', f.addresses.map((x, j) => (j === i ? { ...x, poBox: e.target.value } : x)))} />
                  </div>
                </div>
              ))}
            </ListSection>
            <ListSection title="Téléphones" onAdd={() => set('phones', [...f.phones, { number: '', operator: 'orange', whatsapp: false, mm: false, primary: false }])}>
              {f.phones.map((p, i) => (
                <Row key={i} onRemove={f.phones.length > 1 ? () => set('phones', f.phones.filter((_, j) => j !== i)) : undefined}>
                  <TextInput placeholder="+225…" value={p.number} onChange={(e) => set('phones', f.phones.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)))} />
                  <label className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-ink-500"><input type="checkbox" checked={p.whatsapp} onChange={(e) => set('phones', f.phones.map((x, j) => (j === i ? { ...x, whatsapp: e.target.checked } : x)))} className="accent-amber" /> WhatsApp</label>
                  <label className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-ink-500"><input type="checkbox" checked={p.mm} onChange={(e) => set('phones', f.phones.map((x, j) => (j === i ? { ...x, mm: e.target.checked } : x)))} className="accent-amber" /> Mobile Money</label>
                </Row>
              ))}
            </ListSection>
            <Grid>
              <FormField label="Email personnel"><TextInput type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></FormField>
              <FormField label="Canal préféré"><Select value={f.prefChannel} onChange={(e) => set('prefChannel', e.target.value)}>{[['whatsapp', 'WhatsApp'], ['email', 'Email'], ['sms', 'SMS'], ['phone_call', 'Appel']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Select></FormField>
            </Grid>
            <div className="rounded-xl border border-line p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Contact d'urgence *</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <TextInput placeholder="Nom" value={f.emName} onChange={(e) => set('emName', e.target.value)} />
                <TextInput placeholder="Téléphone" value={f.emPhone} onChange={(e) => set('emPhone', e.target.value)} />
                <Select value={f.emLink} onChange={(e) => set('emLink', e.target.value)}>{['Conjoint', 'Parent', 'Frère/Sœur', 'Ami', 'Autre'].map((l) => <option key={l}>{l}</option>)}</Select>
              </div>
            </div>
          </div>
        )}

        {/* 6 — Versement */}
        {step === 6 && (
          <Grid>
            <FormField label="Mode de versement" required><Select value={f.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}><option value="mobile_money">Mobile Money</option><option value="bank_transfer">Virement bancaire</option><option value="cash">Espèces</option></Select></FormField>
            {f.paymentMethod === 'mobile_money' && (<>
              <FormField label="Opérateur"><Select value={f.mmOperator} onChange={(e) => set('mmOperator', e.target.value)}>{['Orange Money', 'MTN MoMo', 'Moov Money', 'Wave'].map((o) => <option key={o}>{o}</option>)}</Select></FormField>
              <FormField label="Numéro Mobile Money * 🔒"><TextInput value={f.mmNumber} onChange={(e) => set('mmNumber', e.target.value)} /></FormField>
            </>)}
            {f.paymentMethod === 'bank_transfer' && (<>
              <FormField label="Banque"><TextInput value={f.bankName} onChange={(e) => set('bankName', e.target.value)} /></FormField>
              <FormField label="RIB / IBAN * 🔒"><TextInput value={f.rib} onChange={(e) => set('rib', e.target.value)} /></FormField>
            </>)}
          </Grid>
        )}

        {/* 7 — Contrat */}
        {step === 7 && (
          <Grid>
            <FormField label="Type de contrat" required><Select value={f.contractType} onChange={(e) => set('contractType', e.target.value)}>{[['cdi', 'CDI'], ['cdd', 'CDD'], ['internship', 'Stage'], ['apprenticeship', 'Apprentissage']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Select></FormField>
            <FormField label="Date de début" required><TextInput type="date" value={f.startDate} onChange={(e) => set('startDate', e.target.value)} /></FormField>
            {['cdd', 'internship'].includes(f.contractType) && <FormField label="Date de fin" required><TextInput type="date" value={f.endDate} onChange={(e) => set('endDate', e.target.value)} /></FormField>}
            <FormField label="Intitulé du poste" required><TextInput value={f.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} /></FormField>
            <FormField label="Département" required><Select value={f.department} onChange={(e) => set('department', e.target.value)}>{['Technologie', 'Finance', 'Ventes', 'Ressources Humaines', 'Opérations'].map((d) => <option key={d}>{d}</option>)}</Select></FormField>
            <FormField label="Manager (N+1)"><Select value={f.managerId} onChange={(e) => set('managerId', e.target.value)}><option value="">—</option>{employees.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}</Select></FormField>
            <FormField label="Lieu de travail" required><TextInput value={f.workplace} onChange={(e) => set('workplace', e.target.value)} /></FormField>
            <FormField label={`Durée hebdo (légal ${timeRulesFor(f.countryCode).weeklyHours}h)`}><TextInput type="number" value={String(f.weeklyHours)} onChange={(e) => set('weeklyHours', +e.target.value)} /></FormField>
          </Grid>
        )}

        {/* 8 — Rémunération */}
        {step === 8 && (
          <div className="space-y-4">
            <Grid>
              <FormField label="Salaire de base" required><MoneyInput value={f.baseSalary} onChange={(v) => set('baseSalary', v)} /></FormField>
              <FormField label="Périodicité"><Select value={f.periodicity} onChange={(e) => set('periodicity', e.target.value)}><option value="monthly">Mensuel</option><option value="hourly">Horaire</option></Select></FormField>
              <FormField label="Devise"><TextInput disabled value={country.currency} /></FormField>
            </Grid>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Rubriques légales pré-remplies</p>
              <div className="space-y-1.5">
                {DEFAULT_PAY_COMPONENTS.filter((c) => c.isLegal && (!c.countryCode || c.countryCode === f.countryCode)).map((r) => (
                  <div key={r.id} className="flex items-center gap-2.5 rounded-xl bg-surface2 px-3 py-2"><Lock size={13} className="text-ink-400" /><span className="mono rounded bg-ink/[0.05] px-1.5 py-0.5 text-[10px] font-bold text-ink-500">{r.code}</span><span className="flex-1 text-sm font-semibold text-ink">{r.label}</span><StatusPill tone="neutral" dot={false}>Légale</StatusPill></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9 — Récapitulatif */}
        {step === 9 && (
          <div className="space-y-3">
            <Recap label="Identité" value={`${f.civility} ${f.firstNames} ${f.lastName}${f.usageName ? ` (dit ${f.usageName})` : ''}`} />
            <Recap label="Famille" value={`${f.spouses.length} conjoint(s) · ${f.children.length} enfant(s) · ${f.ascendants.length} ascendant(s) · ${fiscalParts} parts`} />
            <Recap label="Pays / régime" value={`${country.flag} ${country.name} · ${country.socialFund} · ${country.currency}`} />
            <Recap label="Contrat" value={`${f.contractType.toUpperCase()} · ${f.jobTitle || '—'} · ${f.department}`} />
            <Recap label="Versement" value={f.paymentMethod === 'mobile_money' ? `Mobile Money (${f.mmOperator})` : f.paymentMethod} />
            {computation && (
              <div className="rounded-2xl border border-amber/25 bg-amber/[0.06] p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-deep">Simulation de la première paie</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Sim label="Brut" units={computation.result.grossTotalUnits} currency={country.currency} />
                  <Sim label="Cotisations" units={computation.result.totalEmployeeContributionUnits} currency={country.currency} />
                  <Sim label="Impôt" units={computation.result.incomeTaxUnits} currency={country.currency} />
                  <Sim label="Net à payer" units={computation.result.netToPayUnits} currency={country.currency} accent />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl bg-ok/[0.07] px-3 py-2.5"><ShieldCheck size={15} className="shrink-0 text-ok" /><p className="text-[11px] font-medium text-ink-700">Création atomique : dossier + contrat v1 + rémunération + rubriques + famille + affiliations + événement « embauche » + audit chaîné. Propage à l'onboarding (M6) et au graphe (M9).</p></div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
          <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ArrowLeft size={14} /> Précédent</Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" disabled={!canProceed(step)} onClick={() => setStep((s) => s + 1)}>Suivant <ArrowRight size={14} /></Button>
          ) : (
            <Button size="sm" onClick={create}><Check size={14} /> Créer le collaborateur</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}
function ListSection({ title, onAdd, children }: { title: string; onAdd?: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{title}</p>
        {onAdd && <button onClick={onAdd} className="inline-flex items-center gap-1 text-xs font-bold text-amber-deep hover:underline"><Plus size={13} /> Ajouter</button>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Row({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {children}
      {onRemove && <button onClick={onRemove} className="shrink-0 rounded-lg p-1.5 text-danger hover:bg-danger/10"><Trash2 size={15} /></button>}
    </div>
  );
}
function Recap({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface2 px-4 py-2.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
function Sim({ label, units, currency, accent }: { label: string; units: string; currency: import('../lib/money').Currency; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className={cn('mono text-sm font-semibold', accent ? 'text-amber-deep' : 'text-ink')}>{Money.fromJSON({ units, currency }).format()}</p>
    </div>
  );
}
