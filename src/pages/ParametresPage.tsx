import { useState } from 'react';
import { Building2, MapPin, Landmark, Briefcase, Layers, Scale, CalendarDays, Users, ShieldCheck, Lock } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { Tabs } from '../components/ui/Tabs';
import { Money } from '../lib/money';
import { countryByCode } from '../data/countries';

const SITES = [
  { name: 'Siège Plateau', type: 'Siège', city: 'Abidjan', country: 'CI', staff: 84 },
  { name: 'Cosmos Yopougon', type: 'Magasin', city: 'Abidjan', country: 'CI', staff: 32 },
  { name: 'Cosmos Angré', type: 'Magasin', city: 'Abidjan', country: 'CI', staff: 18 },
  { name: 'Agence Dakar', type: 'Agence', city: 'Dakar', country: 'SN', staff: 26 },
];
const ENTITIES = [
  { name: 'Atlas Studio CI SARL', form: 'SARL', country: 'CI', rccm: 'CI-ABJ-2021-B-12345' },
  { name: 'Atlas Studio Sénégal SUARL', form: 'SUARL', country: 'SN', rccm: 'SN-DKR-2023-B-04567' },
];
const DEPT_TREE = [
  { name: 'Direction Générale', level: 0, staff: 160 },
  { name: 'Direction Commerciale', level: 1, staff: 76 },
  { name: 'Service Ventes', level: 2, staff: 58 },
  { name: 'Service Marketing', level: 2, staff: 18 },
  { name: 'Direction Administrative & Financière', level: 1, staff: 28 },
  { name: 'Comptabilité', level: 2, staff: 12 },
  { name: 'Ressources Humaines', level: 2, staff: 9 },
  { name: 'Direction des Opérations', level: 1, staff: 44 },
];
const JOB_FAMILIES = ['Commerce', 'Finance', 'Technologie', 'Ressources Humaines', 'Opérations'];
const CLASSIFICATIONS = [
  { label: 'Employé · E1', category: 'Employé', level: 'Employé', min: 75_000, country: 'CI' },
  { label: 'Agent de maîtrise · M2', category: 'Maîtrise', level: 'Agent de maîtrise', min: 180_000, country: 'CI' },
  { label: 'Cadre · C3', category: 'Cadre', level: 'Cadre', min: 450_000, country: 'CI' },
  { label: 'Cadre supérieur · CS1', category: 'Cadre supérieur', level: 'Cadre supérieur', min: 900_000, country: 'CI' },
];
const CONVENTIONS = [
  { name: 'Convention nationale interprofessionnelle', country: 'CI', sector: 'Commerce & services', essai: '3 mois (cadres) · 1 mois (employés)', preavis: '1 à 3 mois selon ancienneté', cdd: '24 mois · 2 renouvellements' },
  { name: 'Convention collective du commerce', country: 'SN', sector: 'Commerce', essai: '3 mois (cadres)', preavis: '1 à 3 mois', cdd: '24 mois · 2 renouvellements' },
];
const HOLIDAYS = [
  { label: 'Nouvel An', date: '2026-01-01', type: 'Civil', fixed: true },
  { label: 'Lundi de Pâques', date: '2026-04-06', type: 'Chrétien', fixed: false },
  { label: 'Fête du Travail', date: '2026-05-01', type: 'Civil', fixed: true },
  { label: 'Aïd el-Kébir (Tabaski)', date: '2026-05-27', type: 'Musulman', fixed: false },
  { label: "Fête de l'Indépendance", date: '2026-08-07', type: 'National', fixed: true },
  { label: 'Assomption', date: '2026-08-15', type: 'Chrétien', fixed: true },
  { label: 'Noël', date: '2026-12-25', type: 'Chrétien', fixed: true },
];
const ROLES = [
  { role: 'Employé', type: 'Prédéfini', users: 320, desc: 'Accès self-service à son propre dossier' },
  { role: 'Manager', type: 'Prédéfini', users: 45, desc: 'Accès à son équipe (sans rémunération)' },
  { role: 'RH', type: 'Prédéfini', users: 8, desc: 'Gestion des dossiers du tenant' },
  { role: 'DRH', type: 'Prédéfini', users: 2, desc: 'Gestion complète + validations' },
  { role: 'Paie', type: 'Prédéfini', users: 3, desc: 'Accès rémunération et paie' },
  { role: 'Médecin du travail', type: 'Prédéfini', users: 1, desc: 'Données médicales exclusives' },
  { role: 'Responsable site Cosmos Angré', type: 'Personnalisé', users: 1, desc: 'RH limité à un site' },
];
// Matrice : ✓ autorisé · — non concerné · ❌ règle dure (interdiction non contournable)
const PERM_COLS = ['Employé', 'Manager', 'RH', 'DRH', 'Paie', 'Médecin'];
const PERM_ROWS: { perm: string; vals: string[] }[] = [
  { perm: 'Lire identité (autres)', vals: ['—', 'N-1', '✓', '✓', '✓', '✓'] },
  { perm: 'Lire famille (autres)', vals: ['—', '❌', '✓', '✓', '—', '—'] },
  { perm: 'Lire rémunération (autres)', vals: ['—', '❌', '✓', '✓', '✓', '—'] },
  { perm: 'Lire versement (autres)', vals: ['—', '❌', '✓', '✓', '✓', '—'] },
  { perm: 'Lire médical détaillé', vals: ['soi', '❌', '❌', '❌', '—', '✓'] },
  { perm: 'Lire disciplinaire', vals: ['soi', '❌', 'mention', '✓', '—', '—'] },
  { perm: 'Valider avenant', vals: ['—', '—', 'instruire', '✓', '—', '—'] },
  { perm: 'Bypass ComplianceGuard', vals: ['—', '—', 'demander', 'accorder', '—', '—'] },
  { perm: "Voir journal d'audit", vals: ['—', '—', 'partiel', '✓', '—', '—'] },
];

const TABS = [
  { key: 'org', label: 'Départements & sites' },
  { key: 'jobs', label: 'Postes & classifications' },
  { key: 'legal', label: 'Conventions & fériés' },
  { key: 'roles', label: 'Rôles & permissions' },
];

export function ParametresPage() {
  const [tab, setTab] = useState('org');
  return (
    <div className="animate-fade-up space-y-5">
      <SectionHeader eyebrow="Bloc A · M1 · P1.15–18" title="Paramètres & référentiels" description="Socle de configuration du tenant : structure organisationnelle, postes & classifications, cadre légal, rôles & permissions." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {/* P1.15 — Départements & sites */}
      {tab === 'org' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Départements" subtitle="Structure hiérarchique" action={<Building2 size={16} className="text-ink-400" />} />
            <div className="space-y-1">
              {DEPT_TREE.map((d) => (
                <div key={d.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-ink/[0.03]" style={{ paddingLeft: 8 + d.level * 20 }}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {d.level > 0 && <span className="text-ink-300">└</span>}{d.name}
                  </span>
                  <span className="text-[11px] font-medium text-ink-400">{d.staff} pers.</span>
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-5">
            <Card>
              <CardHeader title="Sites" subtitle="Structure géographique" action={<MapPin size={16} className="text-ink-400" />} />
              <div className="space-y-1.5">
                {SITES.map((s) => (
                  <div key={s.name} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2">
                    <span className="text-base">{countryByCode(s.country).flag}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{s.name}</p><p className="text-[11px] font-medium text-ink-400">{s.type} · {s.city}</p></div>
                    <span className="text-[11px] font-semibold text-ink-500">{s.staff} pers.</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Entités juridiques" subtitle="Employeurs au sens du droit du travail" action={<Landmark size={16} className="text-ink-400" />} />
              <div className="space-y-1.5">
                {ENTITIES.map((e) => (
                  <div key={e.name} className="rounded-xl bg-surface2 px-3 py-2">
                    <div className="flex items-center justify-between"><p className="text-sm font-semibold text-ink">{e.name}</p><StatusPill tone="neutral" dot={false}>{e.form}</StatusPill></div>
                    <p className="mono text-[11px] font-medium text-ink-400">{countryByCode(e.country).flag} RCCM {e.rccm}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* P1.16 — Postes & classifications */}
      {tab === 'jobs' && (
        <div className="space-y-5">
          <Card>
            <CardHeader title="Familles de postes" action={<Briefcase size={16} className="text-ink-400" />} />
            <div className="flex flex-wrap gap-2">
              {JOB_FAMILIES.map((f) => <span key={f} className="rounded-full border border-line bg-surface2 px-3 py-1 text-xs font-semibold text-ink">{f}</span>)}
            </div>
          </Card>
          <Card>
            <CardHeader title="Classifications & minima conventionnels" subtitle="Alimente le ComplianceGuard rémunération (SMIG / minimum conventionnel)" action={<Layers size={16} className="text-ink-400" />} />
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr] gap-3 border-b border-line bg-surface2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <span>Classification</span><span>Niveau</span><span>Pays</span><span className="text-right">Min. conventionnel</span>
              </div>
              <div className="divide-y divide-line">
                {CLASSIFICATIONS.map((c) => (
                  <div key={c.label} className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr] items-center gap-3 px-4 py-2.5">
                    <span className="text-sm font-semibold text-ink">{c.label}</span>
                    <span className="text-[12px] font-medium text-ink-500">{c.level}</span>
                    <span className="text-[12px] font-medium text-ink-500">{countryByCode(c.country).flag} {c.country}</span>
                    <span className="mono text-right text-sm font-semibold text-ink">{Money.of(c.min, countryByCode(c.country).currency).format()}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* P1.18 — Conventions & fériés */}
      {tab === 'legal' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Conventions collectives" subtitle="Versionnées par date d'effet" action={<Scale size={16} className="text-ink-400" />} />
            <div className="space-y-3">
              {CONVENTIONS.map((c) => (
                <div key={c.name} className="rounded-2xl border border-line bg-surface2 p-3.5">
                  <div className="flex items-center justify-between"><p className="text-sm font-bold text-ink">{c.name}</p><span>{countryByCode(c.country).flag}</span></div>
                  <p className="text-[11px] font-medium text-ink-400">{c.sector}</p>
                  <div className="mt-2 grid grid-cols-1 gap-1 text-[12px]">
                    <Line label="Période d'essai" value={c.essai} />
                    <Line label="Préavis" value={c.preavis} />
                    <Line label="CDD" value={c.cdd} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Jours fériés · CI 2026" subtitle="Chômés & payés — alimentent paie (M3) et planning (M2)" action={<CalendarDays size={16} className="text-ink-400" />} />
            <div className="space-y-1">
              {HOLIDAYS.map((h) => (
                <div key={h.label} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-ink/[0.03]">
                  <div><p className="text-sm font-semibold text-ink">{h.label}</p><p className="text-[11px] font-medium text-ink-400">{new Date(`${h.date}T00:00:00`).toLocaleDateString('fr-FR')}</p></div>
                  <div className="flex items-center gap-1.5">
                    {!h.fixed && <StatusPill tone="amber" dot={false}>date variable</StatusPill>}
                    <StatusPill tone="neutral" dot={false}>{h.type}</StatusPill>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* P1.17 — Rôles & permissions */}
      {tab === 'roles' && (
        <div className="space-y-5">
          <Card>
            <CardHeader title="Rôles" subtitle="Prédéfinis & personnalisés" action={<Users size={16} className="text-ink-400" />} />
            <div className="space-y-1.5">
              {ROLES.map((r) => (
                <div key={r.role} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/12 text-amber-deep"><ShieldCheck size={15} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{r.role}</p><p className="truncate text-[11px] font-medium text-ink-400">{r.desc}</p></div>
                  <StatusPill tone={r.type === 'Prédéfini' ? 'neutral' : 'amber'} dot={false}>{r.type}</StatusPill>
                  <span className="w-12 text-right text-[11px] font-semibold text-ink-500">{r.users} util.</span>
                </div>
              ))}
            </div>
          </Card>
          <Card inset={false}>
            <div className="p-5 pb-3">
              <CardHeader title="Matrice des permissions" subtitle="✓ autorisé · — non concerné · ❌ règle dure non contournable" className="mb-0" action={<Lock size={16} className="text-ink-400" />} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    <th className="px-4 py-2.5 text-left">Permission</th>
                    {PERM_COLS.map((c) => <th key={c} className="px-2 py-2.5 text-center">{c}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {PERM_ROWS.map((row) => (
                    <tr key={row.perm}>
                      <td className="px-4 py-2.5 text-left text-[13px] font-semibold text-ink-700">{row.perm}</td>
                      {row.vals.map((v, i) => (
                        <td key={i} className="px-2 py-2.5 text-center">
                          <PermCell v={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[11px] font-medium text-ink-400">Les ❌ sont codés en dur : le manager ne voit jamais la famille, la rémunération, le versement, le médical détaillé ni le disciplinaire de ses N-1. Toute tentative de créer un rôle violant ces règles est bloquée.</p>
          </Card>
        </div>
      )}
    </div>
  );
}

function PermCell({ v }: { v: string }) {
  if (v === '✓') return <span className="font-bold text-ok">✓</span>;
  if (v === '❌') return <span className="font-bold text-danger">❌</span>;
  if (v === '—') return <span className="text-ink-300">—</span>;
  return <span className="text-[11px] font-semibold text-ink-500">{v}</span>;
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium text-ink-400">{label}</span>
      <span className="text-right font-semibold text-ink-700">{value}</span>
    </div>
  );
}
