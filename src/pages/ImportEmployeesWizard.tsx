import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ArrowLeftCircle, Upload, FileSpreadsheet, Sparkles,
  CheckCircle2, AlertTriangle, ShieldAlert, Download, ListChecks, Settings2, Rocket,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { FormField, Select } from '../components/ui/FormField';
import { Switch } from '../components/ui/controls';
import { useToast } from '../components/ui/Toast';
import { ComplianceGuard } from '../lib/compliance/ComplianceGuard';
import { COUNTRIES, TENANT_CURRENCY } from '../data/countries';
import { DEPARTMENTS, type EmployeeRecord } from '../data/mock';
import { useDirectory } from '../store/useDirectory';
import { bulkImportEmployees, isBackendConfigured, type BulkImportRow } from '../lib/m1/supabaseLive';
import { Money } from '../lib/money';
import { cn } from '../lib/cn';

const FIELDS = [
  { key: 'lastName', label: 'Nom', required: true, aliases: ['nom'] },
  { key: 'firstName', label: 'Prénoms', required: true, aliases: ['prenom', 'prenoms', 'prénoms'] },
  { key: 'role', label: 'Poste', required: true, aliases: ['poste', 'fonction', 'intitule'] },
  { key: 'department', label: 'Département', required: true, aliases: ['departement', 'département', 'service'] },
  { key: 'countryCode', label: 'Pays', required: true, aliases: ['pays', 'country'] },
  { key: 'email', label: 'Email', required: false, aliases: ['email', 'mail', 'courriel'] },
  { key: 'contractType', label: 'Contrat', required: true, aliases: ['contrat', 'contract'] },
  { key: 'hireDate', label: "Date d'embauche", required: true, aliases: ['embauche', 'hire', 'date'] },
  { key: 'baseSalary', label: 'Salaire de base', required: true, aliases: ['salaire', 'salary', 'remuneration'] },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];
type Row = Record<FieldKey, string>;
type RowDiag = { errors: string[]; warnings: string[] };

const TEMPLATE_HEADER = 'nom,prenoms,poste,departement,pays,email,contrat,embauche,salaire';
const SAMPLE = `${TEMPLATE_HEADER}
Koné,Awa,Chargée de clientèle,Ventes,CI,awa.kone@exemple.ci,CDI,2024-03-01,520000
Diallo,Mamadou,Comptable,Finance,SN,m.diallo@exemple.sn,CDD,2025-06-15,640000
Bamba,Ines,Développeuse,Technologie,CI,,CDI,2025-09-01,950000
Touré,Salif,Magasinier,Opérations,CI,s.toure@exemple.ci,CDI,2023-01-10,55000`;

const STEPS = [
  { n: 1, label: 'Fichier source', icon: Upload },
  { n: 2, label: 'Mapping', icon: Sparkles },
  { n: 3, label: 'Validation', icon: ListChecks },
  { n: 4, label: 'Résolution', icon: AlertTriangle },
  { n: 5, label: 'Configuration', icon: Settings2 },
  { n: 6, label: 'Exécution', icon: Rocket },
];

function normalize(s: string) { return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

export function ImportEmployeesWizard() {
  const { toast } = useToast();
  const addEmployee = useDirectory((s) => s.addEmployee);

  const [step, setStep] = useState(1);
  const [raw, setRaw] = useState('');
  const [initialStatus, setInitialStatus] = useState<'active' | 'onboarding'>('active');
  const [autoMatricule, setAutoMatricule] = useState(true);
  const [sendInvites, setSendInvites] = useState(false);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [done, setDone] = useState<{ created: number; failed: number } | null>(null);

  // --- Parsing ---
  const parsed = useMemo(() => {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return { headers: [] as string[], mapping: {} as Record<FieldKey, number>, rows: [] as Row[] };
    const headers = lines[0].split(',').map((h) => h.trim());
    const mapping = {} as Record<FieldKey, number>;
    FIELDS.forEach((f) => {
      const idx = headers.findIndex((h) => { const n = normalize(h); return f.aliases.some((a) => n.includes(a)); });
      mapping[f.key] = idx;
    });
    const rows: Row[] = lines.slice(1).map((line) => {
      const cells = line.split(',');
      const r = {} as Row;
      FIELDS.forEach((f) => { r[f.key] = mapping[f.key] >= 0 ? (cells[mapping[f.key]] ?? '').trim() : ''; });
      return r;
    });
    return { headers, mapping, rows };
  }, [raw]);

  // --- Validation déterministe (mêmes règles que P1.2) ---
  const diags = useMemo<RowDiag[]>(() => parsed.rows.map((r) => {
    const errors: string[] = []; const warnings: string[] = [];
    FIELDS.filter((f) => f.required).forEach((f) => { if (!r[f.key]) errors.push(`${f.label} manquant`); });
    if (r.countryCode && !COUNTRIES.some((c) => c.code === r.countryCode.toUpperCase())) errors.push(`Pays inconnu : ${r.countryCode}`);
    if (r.contractType && !['CDI', 'CDD', 'Stage'].includes(r.contractType)) errors.push(`Contrat invalide : ${r.contractType}`);
    if (r.hireDate && !/^\d{4}-\d{2}-\d{2}$/.test(r.hireDate)) errors.push(`Date d'embauche invalide : ${r.hireDate}`);
    const salary = Number(r.baseSalary);
    if (r.baseSalary && Number.isNaN(salary)) errors.push('Salaire non numérique');
    else if (r.countryCode && !Number.isNaN(salary)) {
      const c = ComplianceGuard.checkSalaryFloor({ countryCode: r.countryCode.toUpperCase(), monthlySalary: salary });
      if (c.verdict === 'block') errors.push(c.message);
    }
    if (!r.email) warnings.push('Email absent (pas de compte self-service)');
    if (r.department && !DEPARTMENTS.includes(r.department)) warnings.push(`Département à créer : ${r.department}`);
    return { errors, warnings };
  }), [parsed.rows]);

  const stats = useMemo(() => {
    let valid = 0, warn = 0, err = 0;
    diags.forEach((d) => { if (d.errors.length) err++; else if (d.warnings.length) warn++; else valid++; });
    return { valid, warn, err, total: diags.length };
  }, [diags]);

  const importableIdx = parsed.rows.map((_, i) => i).filter((i) => diags[i].errors.length === 0 && !excluded.has(i));
  const newDepts = useMemo(() => [...new Set(parsed.rows.map((r) => r.department).filter((d) => d && !DEPARTMENTS.includes(d)))], [parsed.rows]);

  const loadSample = () => setRaw(SAMPLE);
  const downloadTemplate = () => {
    const blob = new Blob([`${TEMPLATE_HEADER}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'modele-import-collaborateurs.csv'; a.click();
    URL.revokeObjectURL(url);
  };
  const toggleExclude = (i: number) => setExcluded((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const execute = async () => {
    if (isBackendConfigured) {
      // Live : import privilégié délégué à l'Edge Function (service_role + idempotence).
      const rows: BulkImportRow[] = importableIdx.map((i) => {
        const r = parsed.rows[i];
        return {
          first_name: r.firstName, last_name: r.lastName,
          role_title: r.role, department: r.department,
          country_code: r.countryCode.toUpperCase(),
          email: r.email || `${normalize(r.firstName)}.${normalize(r.lastName)}@import.local`,
          contract: r.contractType,
          status: initialStatus,
          hire_date: r.hireDate || undefined,
          base_salary: Number(r.baseSalary),
          taxable_allowances: 0, non_taxable_allowances: 0, fiscal_parts: 1,
        };
      });
      try {
        const res = await bulkImportEmployees(rows);
        setDone({ created: res.created.length, failed: res.errors.length + stats.err });
        setStep(6);
        toast({
          variant: res.errors.length ? 'warning' : 'success',
          title: 'Import terminé',
          description: `${res.created.length} créé(s)${res.errors.length ? ` · ${res.errors.length} en erreur` : ''}.`,
        });
      } catch (e) {
        toast({ variant: 'error', title: "Échec de l'import", description: e instanceof Error ? e.message : 'Erreur inconnue.' });
      }
      return;
    }
    // Démo local : store Zustand.
    let created = 0;
    importableIdx.forEach((i) => {
      const r = parsed.rows[i];
      const emp: EmployeeRecord = {
        id: `imp_${Date.now()}_${i}`,
        firstName: r.firstName, lastName: r.lastName,
        role: r.role, department: r.department,
        countryCode: r.countryCode.toUpperCase(),
        email: r.email || `${normalize(r.firstName)}.${normalize(r.lastName)}@import.local`,
        contractType: r.contractType as EmployeeRecord['contractType'],
        hireDate: r.hireDate,
        status: initialStatus,
        baseSalary: Number(r.baseSalary), taxableAllowances: 0, nonTaxableAllowances: 0,
        fiscalParts: 1, retentionAttention: 30,
      };
      addEmployee(emp); created++;
    });
    setDone({ created, failed: stats.err });
    setStep(6);
    toast({ variant: 'success', title: 'Import terminé', description: `${created} collaborateur(s) créé(s).` });
  };

  const canNext = (step === 1 && parsed.rows.length > 0) || (step >= 2 && step <= 4) || step === 5;

  return (
    <div className="animate-fade-up space-y-5">
      <Breadcrumb items={[{ label: 'People', to: '/' }, { label: 'Collaborateurs', to: '/collaborateurs' }, { label: 'Import en masse' }]} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-deep">P1.12 · Migration</p>
          <h1 className="text-2xl font-semibold text-ink">Import en masse de collaborateurs</h1>
        </div>
        <Link to="/collaborateurs"><Button variant="ghost" size="sm"><ArrowLeft size={14} /> Retour</Button></Link>
      </div>

      {/* Stepper */}
      <Card inset={false}>
        <div className="flex flex-wrap gap-1 p-2">
          {STEPS.map((s) => {
            const Icon = s.icon; const active = step === s.n; const passed = step > s.n;
            return (
              <div key={s.n} className={cn('flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold', active ? 'bg-amber/12 text-amber-deep ring-1 ring-amber/30' : passed ? 'text-ok' : 'text-ink-400')}>
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold', active ? 'bg-amber/20' : passed ? 'bg-ok/15' : 'bg-ink/[0.05]')}>
                  {passed ? <CheckCircle2 size={14} /> : s.n}
                </span>
                <Icon size={15} className="hidden sm:block" /> <span className="hidden md:block">{s.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Étape 1 — Fichier source */}
      {step === 1 && (
        <Card>
          <CardHeader title="Fichier source" subtitle="Modèle Excel/CSV · max 5000 lignes" />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}><Download size={14} /> Télécharger le modèle CSV</Button>
            <Button variant="outline" size="sm" onClick={loadSample}><FileSpreadsheet size={14} /> Charger un exemple</Button>
          </div>
          <p className="mt-3 mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Coller le contenu CSV</p>
          <textarea
            value={raw} onChange={(e) => setRaw(e.target.value)} rows={8}
            placeholder={TEMPLATE_HEADER}
            className="mono w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-medium text-ink focus:border-amber/40 focus:outline-none focus:ring-2 focus:ring-amber/15"
          />
          {parsed.rows.length > 0 && <p className="mt-2 text-[12px] font-semibold text-ink-500">{parsed.rows.length} ligne(s) détectée(s) · {parsed.headers.length} colonne(s)</p>}
        </Card>
      )}

      {/* Étape 2 — Mapping */}
      {step === 2 && (
        <Card>
          <CardHeader title="Mapping des colonnes" subtitle="Correspondance automatique (Proph3t)" action={<StatusPill tone="amber" dot={false}><Sparkles size={11} /> Auto-mappé</StatusPill>} />
          <div className="overflow-hidden rounded-xl border border-line">
            <div className="grid grid-cols-[1.4fr_1fr_44px] gap-3 border-b border-line bg-surface2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <span>Champ Atlas People</span><span>Colonne source</span><span className="text-center">État</span>
            </div>
            <div className="divide-y divide-line">
              {FIELDS.map((f) => {
                const idx = parsed.mapping[f.key];
                const mapped = idx >= 0;
                return (
                  <div key={f.key} className="grid grid-cols-[1.4fr_1fr_44px] items-center gap-3 px-4 py-2.5">
                    <span className="text-sm font-semibold text-ink">{f.label}{f.required && <span className="text-amber-deep"> *</span>}</span>
                    <span className="mono text-[12px] font-medium text-ink-500">{mapped ? parsed.headers[idx] : '—'}</span>
                    <span className="flex justify-center">{mapped ? <CheckCircle2 size={16} className="text-ok" /> : f.required ? <ShieldAlert size={16} className="text-danger" /> : <span className="text-[10px] text-ink-400">opt.</span>}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Étape 3 — Validation */}
      {step === 3 && (
        <Card>
          <CardHeader title="Validation" subtitle="Mêmes règles que la création manuelle (P1.2)" />
          <div className="grid grid-cols-3 gap-3">
            <Stat tone="ok" value={stats.valid} label="lignes valides" />
            <Stat tone="warn" value={stats.warn} label="avertissements" />
            <Stat tone="danger" value={stats.err} label="erreurs bloquantes" />
          </div>
        </Card>
      )}

      {/* Étape 4 — Résolution */}
      {step === 4 && (
        <Card>
          <CardHeader title="Résolution des erreurs" subtitle="Excluez les lignes bloquantes pour poursuivre" action={<StatusPill tone={importableIdx.length > 0 ? 'ok' : 'danger'}>{importableIdx.length} importable(s)</StatusPill>} />
          {stats.err === 0 ? (
            <p className="flex items-center gap-2 rounded-xl border border-ok/25 bg-ok/[0.05] p-3 text-sm font-semibold text-ok"><CheckCircle2 size={16} /> Aucune erreur bloquante. Vous pouvez poursuivre.</p>
          ) : (
            <div className="space-y-1.5">
              {parsed.rows.map((r, i) => diags[i].errors.length > 0 && (
                <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-danger/25 bg-danger/[0.05] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">Ligne {i + 2} · {r.firstName} {r.lastName}</p>
                    <p className="text-[12px] font-medium text-danger">{diags[i].errors.join(' · ')}</p>
                  </div>
                  <button onClick={() => toggleExclude(i)} className={cn('shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold', excluded.has(i) ? 'border-ink/15 bg-ink/[0.05] text-ink-400' : 'border-danger/30 text-danger hover:bg-danger/10')}>
                    {excluded.has(i) ? 'Exclue' : 'Exclure'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Étape 5 — Configuration */}
      {step === 5 && (
        <Card>
          <CardHeader title="Configuration de l'import" subtitle={`${importableIdx.length} collaborateur(s) prêt(s)`} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Statut initial des employés">
              <Select value={initialStatus} onChange={(e) => setInitialStatus(e.target.value as 'active' | 'onboarding')}>
                <option value="active">Actif</option>
                <option value="onboarding">En attente de signature</option>
              </Select>
            </FormField>
            <div className="space-y-3 pt-5">
              <Switch checked={autoMatricule} onChange={setAutoMatricule} label="Générer les matricules automatiquement" />
              <Switch checked={sendInvites} onChange={setSendInvites} label="Envoyer les emails d'invitation self-service" hint="Liens à usage unique — mot de passe défini par l'employé." />
            </div>
          </div>
          {newDepts.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber/25 bg-amber/[0.06] p-3">
              <p className="text-[12px] font-bold text-amber-deep">Référentiels à créer</p>
              <p className="text-[12px] font-medium text-ink-700">Départements : {newDepts.join(', ')}</p>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat tone="ok" value={importableIdx.length} label="à importer" />
            <Stat tone="neutral" value={Money.of(importableIdx.reduce((s, i) => s + Number(parsed.rows[i].baseSalary || 0), 0), TENANT_CURRENCY).toInt()} label={`masse salariale (${TENANT_CURRENCY}/mois)`} mono />
          </div>
        </Card>
      )}

      {/* Étape 6 — Exécution & rapport */}
      {step === 6 && (
        <Card>
          {done ? (
            <>
              <div className="flex flex-col items-center py-4 text-center">
                <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ok/15 text-ok"><CheckCircle2 size={28} /></span>
                <h2 className="text-xl font-semibold text-ink">Import terminé</h2>
                <p className="mt-1 text-sm font-medium text-ink-500">{done.created} collaborateur(s) créé(s){done.failed > 0 ? ` · ${done.failed} ligne(s) en échec exclue(s)` : ''}.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat tone="ok" value={done.created} label="créés" />
                <Stat tone="neutral" value={newDepts.length} label="départements créés" />
                <Stat tone="neutral" value={sendInvites ? done.created : 0} label="invitations envoyées" />
                <Stat tone="danger" value={done.failed} label="en échec" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/collaborateurs"><Button size="sm"><ArrowRight size={14} /> Voir les collaborateurs</Button></Link>
                <Button variant="outline" size="sm" onClick={() => toast({ variant: 'info', title: 'Annulation', description: "Rollback disponible 24h — supprime les employés créés non modifiés." })}>Annuler cet import</Button>
              </div>
              <p className="mt-3 text-[11px] font-medium text-ink-400">L'import est tracé en audit (acteur, horodatage, hash du fichier source). Rollback possible pendant 24h.</p>
            </>
          ) : (
            <>
              <CardHeader title="Prêt à exécuter" subtitle={`${importableIdx.length} collaborateur(s) seront créés par lots transactionnels`} />
              <Button onClick={execute} disabled={importableIdx.length === 0}><Rocket size={14} /> Lancer l'import de {importableIdx.length} collaborateur(s)</Button>
            </>
          )}
        </Card>
      )}

      {/* Navigation */}
      {step < 6 && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" disabled={step === 1} onClick={() => setStep((s) => s - 1)}><ArrowLeftCircle size={14} /> Précédent</Button>
          {step === 5 ? (
            <Button size="sm" onClick={execute} disabled={importableIdx.length === 0}><Rocket size={14} /> Exécuter l'import</Button>
          ) : (
            <Button size="sm" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Suivant <ArrowRight size={14} /></Button>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, tone, mono }: { value: number; label: string; tone: 'ok' | 'warn' | 'danger' | 'neutral'; mono?: boolean }) {
  const c = tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <div className="rounded-2xl border border-line bg-surface2 px-4 py-3 text-center">
      <p className={cn(mono ? 'mono' : '', 'text-2xl font-semibold', c)}>{mono ? value.toLocaleString('fr-FR') : value}</p>
      <p className="text-[11px] font-medium text-ink-400">{label}</p>
    </div>
  );
}
