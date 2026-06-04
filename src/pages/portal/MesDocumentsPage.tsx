/**
 * Mes documents — espace collaborateur (/espace/documents).
 *
 * Arborescence en sous-dossiers par module métier (au lieu d'une liste plate) :
 *   📁 Paie & Bulletins      (M3)
 *   📁 Administratif         (M4 contrat, avenants, certificats, sortie)
 *   📁 Évaluations           (M8 entretiens, 360°, plans dev)
 *   📁 Formation             (M11 PIF, attestations, certifs)
 *   📁 Carrières             (M10 parcours, succession, mobilité)
 *   📁 Conformité & SST      (M12 visites médicales, habilitations)
 *   📁 Disciplinaire         (M4 — transparence personnelle, RGPD)
 *   📁 Personnel             (justificatifs, RIB, photo, etc.)
 *
 * RLS : l'employé ne voit QUE ses propres documents (source_surface = ess +
 * employee_id = current_user). Aucune fuite de données managériales.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Folder, FolderOpen, FileText, Download, Eye, Search, Calendar,
  ChevronRight, ArrowLeft, Sparkles, Lock,
  Wallet, FileSignature, Gauge, GraduationCap, Route as RouteIcon,
  ShieldCheck, AlertTriangle, User,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { cn } from '../../lib/cn';

type FolderKey = 'paie' | 'admin' | 'evaluations' | 'formation' | 'carrieres' | 'conformite' | 'disciplinaire' | 'personnel';

interface DocFolder {
  key: FolderKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  module: string;
  tone: string;
  sensitive?: boolean; // affiche un cadenas (disciplinaire)
}

const FOLDERS: DocFolder[] = [
  { key: 'paie',          label: 'Paie & Bulletins',  icon: Wallet,         description: 'Bulletins mensuels · attestations de salaire',           module: 'M3', tone: 'bg-blue-500/[0.10] text-blue-600' },
  { key: 'admin',         label: 'Administratif',     icon: FileSignature,  description: 'Contrat · avenants · certificats · sortie',                module: 'M4', tone: 'bg-amber-500/[0.10] text-amber-deep' },
  { key: 'evaluations',   label: 'Évaluations',       icon: Gauge,          description: 'Entretiens annuels · 360° · plans de développement',     module: 'M8', tone: 'bg-rose-500/[0.10] text-rose-600' },
  { key: 'formation',     label: 'Formation',         icon: GraduationCap,  description: 'PIF · attestations · certifications · badges',          module: 'M11', tone: 'bg-indigo-500/[0.10] text-indigo-600' },
  { key: 'carrieres',     label: 'Carrières',         icon: RouteIcon,      description: 'Parcours individuel · succession · mobilité',           module: 'M10', tone: 'bg-violet-500/[0.10] text-violet-600' },
  { key: 'conformite',    label: 'Conformité & SST',  icon: ShieldCheck,    description: 'Visites médicales · habilitations · attestations HSE',   module: 'M12', tone: 'bg-emerald-500/[0.10] text-emerald-600' },
  { key: 'disciplinaire', label: 'Disciplinaire',     icon: AlertTriangle,  description: 'Vos sanctions et entretiens préalables (RGPD transparent)', module: 'M4', tone: 'bg-rose-700/[0.10] text-rose-700', sensitive: true },
  { key: 'personnel',     label: 'Personnel',         icon: User,           description: 'RIB · photo · pièce d\'identité · justificatifs',          module: '—',  tone: 'bg-slate-500/[0.10] text-slate-600' },
];

interface DocFile {
  id: string;
  folder: FolderKey;
  title: string;
  type: 'pdf' | 'png' | 'xlsx' | 'docx';
  size: string;
  date: string;
  protected?: boolean;
}

const FILES: DocFile[] = [
  // Paie
  { id: 'd-1',  folder: 'paie', title: 'Bulletin paie Mars 2026',     type: 'pdf', size: '124 Ko', date: '2026-03-31' },
  { id: 'd-2',  folder: 'paie', title: 'Bulletin paie Février 2026',  type: 'pdf', size: '121 Ko', date: '2026-02-29' },
  { id: 'd-3',  folder: 'paie', title: 'Bulletin paie Janvier 2026',  type: 'pdf', size: '120 Ko', date: '2026-01-31' },
  { id: 'd-4',  folder: 'paie', title: 'Attestation de salaire 2025', type: 'pdf', size: '88 Ko',  date: '2025-12-31' },

  // Administratif
  { id: 'd-5',  folder: 'admin', title: 'Contrat de travail initial',  type: 'pdf', size: '256 Ko', date: '2022-03-15' },
  { id: 'd-6',  folder: 'admin', title: 'Avenant promotion P5 → P6',   type: 'pdf', size: '142 Ko', date: '2024-09-01' },
  { id: 'd-7',  folder: 'admin', title: 'Attestation de présence',     type: 'pdf', size: '64 Ko',  date: '2026-01-15' },

  // Évaluations
  { id: 'd-8',  folder: 'evaluations', title: 'Entretien annuel 2025 (signé)', type: 'pdf', size: '198 Ko', date: '2026-01-20', protected: true },
  { id: 'd-9',  folder: 'evaluations', title: 'Synthèse 360° T2 2025',         type: 'pdf', size: '156 Ko', date: '2025-07-15', protected: true },

  // Formation
  { id: 'd-10', folder: 'formation', title: 'PIF 2026 signé (ADVIST)',         type: 'pdf', size: '320 Ko', date: '2026-01-25' },
  { id: 'd-11', folder: 'formation', title: 'Attestation parcours Manager 1ère ligne', type: 'pdf', size: '88 Ko', date: '2026-05-28' },
  { id: 'd-12', folder: 'formation', title: 'Certificat SPIN Selling',         type: 'pdf', size: '96 Ko', date: '2026-04-30' },
  { id: 'd-13', folder: 'formation', title: 'Badge Excel Power User (digital)', type: 'png', size: '24 Ko', date: '2026-02-10' },

  // Carrières
  { id: 'd-14', folder: 'carrieres', title: 'Parcours individuel 2024-2026',   type: 'pdf', size: '210 Ko', date: '2024-01-15' },
  { id: 'd-15', folder: 'carrieres', title: 'Plan de succession (information)',type: 'pdf', size: '156 Ko', date: '2025-09-30' },

  // Conformité
  { id: 'd-16', folder: 'conformite', title: 'Visite médicale annuelle 2026',  type: 'pdf', size: '78 Ko',  date: '2026-02-20' },
  { id: 'd-17', folder: 'conformite', title: 'Habilitation HSE site Yopougon', type: 'pdf', size: '102 Ko', date: '2025-11-12' },

  // Disciplinaire (transparent OHADA)
  { id: 'd-18', folder: 'disciplinaire', title: 'Avertissement écrit 12/2025 — Notification', type: 'pdf', size: '88 Ko', date: '2025-12-05', protected: true },

  // Personnel
  { id: 'd-19', folder: 'personnel', title: 'RIB BICICI',                  type: 'pdf', size: '34 Ko',  date: '2024-01-10' },
  { id: 'd-20', folder: 'personnel', title: 'Carte nationale d\'identité', type: 'png', size: '850 Ko', date: '2023-06-15', protected: true },
  { id: 'd-21', folder: 'personnel', title: 'Photo d\'identité',           type: 'png', size: '210 Ko', date: '2022-03-15' },
];

const TYPE_META: Record<DocFile['type'], { label: string; color: string }> = {
  pdf:  { label: 'PDF',  color: 'bg-rose-100 text-rose-700' },
  png:  { label: 'PNG',  color: 'bg-emerald-100 text-emerald-700' },
  xlsx: { label: 'XLSX', color: 'bg-blue-100 text-blue-700' },
  docx: { label: 'DOCX', color: 'bg-indigo-100 text-indigo-700' },
};

const fr = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export function MesDocumentsPage() {
  const [currentFolder, setCurrentFolder] = useState<FolderKey | null>(null);
  const [search, setSearch] = useState('');

  const folderCounts = useMemo(() => {
    const counts: Record<FolderKey, number> = {
      paie: 0, admin: 0, evaluations: 0, formation: 0,
      carrieres: 0, conformite: 0, disciplinaire: 0, personnel: 0,
    };
    FILES.forEach((f) => { counts[f.folder] += 1; });
    return counts;
  }, []);

  const visibleFiles = useMemo(() => {
    let list = currentFolder ? FILES.filter((f) => f.folder === currentFolder) : FILES;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((f) => f.title.toLowerCase().includes(s));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [currentFolder, search]);

  const activeFolder = currentFolder ? FOLDERS.find((f) => f.key === currentFolder) : null;

  return (
    <div className="animate-fade-up space-y-5">
      {/* Breadcrumb + titre */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          {currentFolder && (
            <button
              type="button"
              onClick={() => setCurrentFolder(null)}
              className="mt-1 inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-ink-500 transition-colors hover:text-amber-deep"
            >
              <ArrowLeft size={12} /> Mes documents
            </button>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-deep">Mon espace</p>
            <h1 className="font-display text-2xl text-ink">
              {activeFolder ? activeFolder.label : 'Mes documents'}
            </h1>
            <p className="mt-0.5 text-[12px] font-medium text-ink-500">
              {activeFolder
                ? activeFolder.description
                : `${FILES.length} document${FILES.length > 1 ? 's' : ''} classé${FILES.length > 1 ? 's' : ''} en ${FOLDERS.length} dossiers`}
            </p>
          </div>
        </div>
        <Link to="/espace"><Button variant="outline" size="sm"><ArrowLeft size={13} /> Retour à l'accueil</Button></Link>
      </div>

      {/* Recherche transverse */}
      <Card>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans tous mes documents (titre, type, date)…"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none"
          />
        </div>
        {search && (
          <p className="mt-2 text-[11px] font-medium text-ink-500">
            {visibleFiles.length} résultat{visibleFiles.length > 1 ? 's' : ''} pour <strong className="text-ink">"{search}"</strong>
          </p>
        )}
      </Card>

      {/* Vue racine : grille des dossiers */}
      {!currentFolder && !search && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FOLDERS.map((f) => {
            const Icon = f.icon;
            const count = folderCounts[f.key];
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setCurrentFolder(f.key)}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:border-amber-deep/30 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2 self-stretch">
                  <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-line/60', f.tone)}>
                    <Icon size={20} />
                  </span>
                  <div className="flex items-center gap-1.5">
                    {f.sensitive && <Lock size={11} className="text-rose-500" />}
                    <span className="mono rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-ink-500">{f.module}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-ink transition-colors group-hover:text-amber-deep">{f.label}</p>
                  <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-ink-500">{f.description}</p>
                </div>
                <p className="mono text-[11px] font-bold text-amber-deep">
                  {count} {count > 1 ? 'fichiers' : 'fichier'} <ChevronRight size={11} className="-mb-0.5 inline" />
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Vue dossier ou recherche : liste de fichiers */}
      {(currentFolder || search) && (
        <Card inset={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                  {!currentFolder && <th className="px-4 py-2 text-left">Dossier</th>}
                  <th className="px-3 py-2 text-left">Titre</th>
                  <th className="px-3 py-2 text-center">Type</th>
                  <th className="px-3 py-2 text-right">Taille</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleFiles.map((f) => {
                  const type = TYPE_META[f.type];
                  const folder = FOLDERS.find((fo) => fo.key === f.folder)!;
                  const FolderIcon = folder.icon;
                  return (
                    <tr key={f.id} className="hover:bg-amber/[0.03]">
                      {!currentFolder && (
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => { setCurrentFolder(f.folder); setSearch(''); }}
                            className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold transition-opacity hover:opacity-80', folder.tone)}
                          >
                            <FolderIcon size={11} /> {folder.label}
                          </button>
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <FileText size={15} className="shrink-0 text-ink-400" />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-ink">{f.title}</p>
                            {f.protected && (
                              <p className="text-[10px] font-medium text-rose-600">
                                <Lock size={9} className="-mt-0.5 mr-0.5 inline" /> Document protégé
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn('inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold', type.color)}>{type.label}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right mono text-[11px] font-semibold text-ink-700">{f.size}</td>
                      <td className="px-3 py-2.5 text-[11px] font-medium text-ink-500"><Calendar size={11} className="-mt-0.5 mr-1 inline text-ink-400" />{fr(f.date)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button type="button" aria-label="Visualiser" className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-amber/[0.06] hover:text-amber-deep">
                            <Eye size={14} />
                          </button>
                          <button type="button" aria-label="Télécharger" className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-amber/[0.06] hover:text-amber-deep">
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Folder size={28} className="text-ink-300" />
                <p className="text-sm font-semibold text-ink">Aucun document à cet emplacement</p>
                <p className="text-[11px] font-medium text-ink-500">Essayez un autre dossier ou affinez votre recherche.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Note RGPD */}
      <Card className="border-info/25 bg-info/[0.04]">
        <div className="flex items-start gap-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-info" />
          <div>
            <p className="text-sm font-bold text-ink">Vos documents, votre droit</p>
            <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-ink-500">
              Tous vos documents sont chiffrés (AES-256), stockés en Afrique (Côte d'Ivoire / Sénégal),
              et accessibles uniquement par vous. Les documents marqués <FolderOpen size={11} className="inline" /> <strong>Document protégé</strong>
              nécessitent une re-authentification (MFA) avant téléchargement. Conforme RGPD + CDP CI/SN.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
