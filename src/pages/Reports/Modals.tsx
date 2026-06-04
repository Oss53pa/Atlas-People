/**
 * Modals — toutes les boîtes de dialogue du module Reporting.
 *
 *   - SaveModal       : sauvegarder un rapport dans Supabase
 *   - LoadModal       : recharger un rapport sauvegardé
 *   - SendModal       : déclarer les destinataires (mock email)
 *   - CatalogModal    : ajouter un bloc individuel (titre, paragraphe, KPI, table, dashboard, image, saut)
 *   - JournalModal    : journal local des générations (50 dernières)
 *   - LogoUpload      : import logo / cover background image (data URL)
 */
import { useEffect, useState } from 'react';
import {
  X, Save, FolderOpen, Send, Plus, History, ImagePlus, FileText,
  Trash2, Download, RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../lib/cn';
import type { ReportConfig, ReportDoc, Block, BlockType } from '../../engine/reportBlocks';
import { dataProvider } from '../../db/demoProvider';
import { safeLocalStorage } from '../../lib/safeStorage';
import { TABLE_CATALOG, DASHBOARD_CATALOG, uid } from './reportData';

/* ═══════════════════════════════════════════════════════════════
 * ModalShell — wrapper commun
 * ═══════════════════════════════════════════════════════════════ */
function ModalShell({ open, onClose, title, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
      <div className={cn('max-h-[90vh] w-full overflow-hidden rounded-2xl bg-surface shadow-2xl flex flex-col', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-[14px] font-bold text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-ink-400 hover:bg-ink/5 hover:text-ink">
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-line bg-surface2/40 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * SaveModal
 * ═══════════════════════════════════════════════════════════════ */
interface SaveModalProps {
  open: boolean; onClose: () => void;
  config: ReportConfig; tenantId: string; author: string;
  existingDocId?: number;
  onSaved: (id: number) => void;
}
export function SaveModal({ open, onClose, config, tenantId, author, existingDocId, onSaved }: SaveModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<ReportDoc['status']>('draft');

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = Date.now();
      const doc: Omit<ReportDoc, 'id'> & { id?: number } = {
        ...(existingDocId ? { id: existingDocId } : {}),
        tenantId, title: config.identity.title, type: 'report', author, status,
        content: JSON.stringify(config),
        createdAt: now, updatedAt: now,
      };
      const id = await dataProvider.upsertReport(doc);
      toast({ variant: 'success', title: 'Rapport sauvegardé', description: `ID ${id} · ${config.identity.title}` });
      onSaved(id);
      onClose();
    } catch (e) {
      toast({ variant: 'error', title: 'Erreur sauvegarde', description: String(e) });
    } finally { setSaving(false); }
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Sauvegarder ce rapport"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" disabled={saving} onClick={handleSave}><Save size={13} /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>
        </div>
      }>
      <div className="space-y-3 text-[13px]">
        <div className="rounded-lg bg-surface2 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Titre</p>
          <p className="font-bold text-ink">{config.identity.title}</p>
          <p className="mt-1 text-[11px] font-medium text-ink-500">{config.identity.period} · {config.blocks.length} blocs · {config.recipients.length} destinataire(s)</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-500">Statut</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as ReportDoc['status'])}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none">
            <option value="draft">Brouillon</option>
            <option value="review">En revue</option>
            <option value="approved">Approuvé</option>
            <option value="diffused">Diffusé</option>
          </select>
        </label>
        <p className="text-[11px] font-medium text-ink-500">
          Tenant : <span className="mono text-ink">{tenantId.slice(0, 8)}…</span> · Auteur : <strong>{author}</strong>
        </p>
      </div>
    </ModalShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * LoadModal
 * ═══════════════════════════════════════════════════════════════ */
interface LoadModalProps {
  open: boolean; onClose: () => void; tenantId: string;
  onLoad: (doc: ReportDoc, config: ReportConfig) => void;
}
export function LoadModal({ open, onClose, tenantId, onLoad }: LoadModalProps) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<ReportDoc[] | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const list = await dataProvider.getReports(tenantId);
      setDocs(list);
    } finally { setLoading(false); }
  };
  useEffect(() => { if (open) reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);

  const handleLoad = (d: ReportDoc) => {
    if (!d.content) { toast({ variant: 'error', title: 'Document vide', description: 'Aucun contenu à charger.' }); return; }
    try {
      const config = JSON.parse(d.content) as ReportConfig;
      onLoad(d, config);
      toast({ variant: 'success', title: 'Rapport chargé', description: d.title });
      onClose();
    } catch {
      toast({ variant: 'error', title: 'Format invalide', description: 'Le rapport ne peut pas être désérialisé.' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer définitivement ce rapport ?')) return;
    await dataProvider.deleteReport(id);
    reload();
  };

  const fr = (ts: number) => new Date(ts).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  const statusTone: Record<ReportDoc['status'], 'neutral' | 'warn' | 'success' | 'info'> = {
    draft: 'neutral', review: 'warn', approved: 'success', diffused: 'info',
  };
  const statusLabel: Record<ReportDoc['status'], string> = {
    draft: 'Brouillon', review: 'En revue', approved: 'Approuvé', diffused: 'Diffusé',
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Charger un rapport" wide>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] font-medium text-ink-500">{docs ? `${docs.length} rapports` : 'Chargement…'}</p>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}><RefreshCw size={12} /> {loading ? '…' : 'Recharger'}</Button>
      </div>
      {!docs ? (
        <p className="py-8 text-center text-[12px] font-medium text-ink-500">Chargement…</p>
      ) : docs.length === 0 ? (
        <div className="py-12 text-center">
          <FileText size={32} className="mx-auto text-ink-300" />
          <p className="mt-2 text-sm font-semibold text-ink">Aucun rapport sauvegardé</p>
          <p className="text-[11px] font-medium text-ink-500">Créez un rapport puis sauvegardez-le.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-3 hover:bg-amber/[0.03]">
              <FileText size={15} className="shrink-0 text-amber-deep" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{d.title}</p>
                <p className="truncate text-[10px] font-medium text-ink-500">{d.author} · maj {fr(d.updatedAt)}</p>
              </div>
              <StatusPill tone={statusTone[d.status]} dot={false}>{statusLabel[d.status]}</StatusPill>
              <Button size="sm" variant="outline" onClick={() => handleLoad(d)}><FolderOpen size={12} /> Ouvrir</Button>
              <button onClick={() => d.id && handleDelete(d.id)} className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-500/[0.1] hover:text-rose-600" title="Supprimer">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * SendModal
 * ═══════════════════════════════════════════════════════════════ */
interface SendModalProps {
  open: boolean; onClose: () => void;
  config: ReportConfig; onChange: (recipients: string[]) => void;
}
export function SendModal({ open, onClose, config, onChange }: SendModalProps) {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [list, setList] = useState<string[]>(config.recipients);

  const add = () => {
    const v = input.trim();
    if (!v || list.includes(v)) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      toast({ variant: 'error', title: 'Email invalide', description: v });
      return;
    }
    setList([...list, v]);
    setInput('');
  };
  const remove = (email: string) => setList(list.filter((e) => e !== email));

  const send = () => {
    onChange(list);
    toast({ variant: 'success', title: 'Destinataires enregistrés', description: `${list.length} email(s) prêts pour envoi.` });
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Diffuser le rapport"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={send}><Send size={13} /> Enregistrer ({list.length})</Button>
        </div>
      }>
      <div className="space-y-3 text-[13px]">
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="email@entreprise.ci"
            className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none" />
          <Button size="sm" onClick={add}><Plus size={13} /> Ajouter</Button>
        </div>
        {list.length > 0 ? (
          <ul className="space-y-1">
            {list.map((email) => (
              <li key={email} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-1.5">
                <span className="mono text-[12px] font-medium text-ink">{email}</span>
                <button onClick={() => remove(email)} className="text-ink-400 hover:text-rose-600"><X size={13} /></button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] font-medium italic text-ink-500">Aucun destinataire. Ajoutez des emails pour activer la diffusion automatique.</p>
        )}
      </div>
    </ModalShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * CatalogModal — ajout d'un bloc individuel
 * ═══════════════════════════════════════════════════════════════ */
interface CatalogModalProps {
  open: boolean; onClose: () => void;
  onInsert: (block: Block) => void;
}
export function CatalogModal({ open, onClose, onInsert }: CatalogModalProps) {
  const blockTypes: Array<{ type: BlockType; label: string; desc: string }> = [
    { type: 'h1', label: 'Titre H1',     desc: 'Titre de section principale' },
    { type: 'h2', label: 'Titre H2',     desc: 'Sous-titre de section' },
    { type: 'h3', label: 'Titre H3',     desc: 'Sous-sous-titre' },
    { type: 'paragraph', label: 'Paragraphe', desc: 'Texte libre, commentaire' },
    { type: 'kpi', label: 'KPIs (4 mesures)', desc: 'Carte de 4 indicateurs' },
    { type: 'pageBreak', label: 'Saut de page', desc: 'Force une nouvelle page' },
    { type: 'spacer', label: 'Espace',   desc: 'Espace vertical de 6mm' },
    { type: 'image', label: 'Image',     desc: 'Image / illustration' },
  ];

  const add = (type: BlockType) => {
    const id = uid();
    let block: Block;
    switch (type) {
      case 'h1': block = { id, type, text: 'Nouveau titre', inToc: true }; break;
      case 'h2': block = { id, type, text: 'Nouveau sous-titre', inToc: true }; break;
      case 'h3': block = { id, type, text: 'Nouvelle sous-section', inToc: true }; break;
      case 'paragraph': block = { id, type, text: 'Saisissez votre texte ici.' }; break;
      case 'kpi': block = { id, type, items: [
        { label: 'KPI 1', value: '—' }, { label: 'KPI 2', value: '—' },
        { label: 'KPI 3', value: '—' }, { label: 'KPI 4', value: '—' },
      ]}; break;
      case 'pageBreak': block = { id, type }; break;
      case 'spacer': block = { id, type, height: 6 }; break;
      case 'image': block = { id, type, dataUrl: '' }; break;
      default: return;
    }
    onInsert(block);
    onClose();
  };

  const addTable = (source: string) => {
    onInsert({ id: uid(), type: 'table', source });
    onClose();
  };
  const addDashboard = (id: string) => {
    onInsert({ id: uid(), type: 'dashboard', dashboardId: id });
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Ajouter un bloc" wide>
      <div className="space-y-4">
        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Blocs de texte &amp; structure</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {blockTypes.map((b) => (
              <button key={b.type} onClick={() => add(b.type)}
                className="group flex flex-col items-start gap-1 rounded-lg border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-amber-deep/30 hover:bg-amber/[0.04]">
                <p className="text-[12px] font-bold text-ink group-hover:text-amber-deep">{b.label}</p>
                <p className="text-[10px] font-medium text-ink-500">{b.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Tableaux ({TABLE_CATALOG.length} sources)</p>
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            {TABLE_CATALOG.map((s) => (
              <button key={s.v} onClick={() => addTable(s.v)}
                className="group flex items-start gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-left transition-colors hover:border-amber-deep/30">
                <span className="mono mt-0.5 rounded bg-ink/[0.06] px-1 py-px text-[9px] font-bold text-ink-700">{s.cat}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-ink group-hover:text-amber-deep">{s.label}</p>
                  <p className="truncate text-[10px] font-medium text-ink-500">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Dashboards ({DASHBOARD_CATALOG.length})</p>
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            {DASHBOARD_CATALOG.map((d) => (
              <button key={d.id} onClick={() => addDashboard(d.id)}
                className="group flex items-start gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-left transition-colors hover:border-amber-deep/30">
                <span className="mono mt-0.5 rounded bg-violet-500/[0.10] px-1 py-px text-[9px] font-bold text-violet-700">{d.cat}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-ink group-hover:text-amber-deep">{d.name}</p>
                  <p className="truncate text-[10px] font-medium text-ink-500">{d.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </ModalShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * JournalModal — journal local des générations
 * ═══════════════════════════════════════════════════════════════ */
export interface JournalEntry { id: string; title: string; format: string; ts: number }
const JOURNAL_KEY = 'report-journal';

export function appendJournal(entry: Omit<JournalEntry, 'id' | 'ts'>) {
  const list = safeLocalStorage.getJSON<JournalEntry[]>(JOURNAL_KEY, []);
  const next: JournalEntry[] = [{ id: uid(), ts: Date.now(), ...entry }, ...list].slice(0, 50);
  safeLocalStorage.setJSON(JOURNAL_KEY, next);
}

interface JournalModalProps { open: boolean; onClose: () => void }
export function JournalModal({ open, onClose }: JournalModalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  useEffect(() => {
    if (!open) return;
    setEntries(safeLocalStorage.getJSON<JournalEntry[]>(JOURNAL_KEY, []));
  }, [open]);

  const clear = () => {
    safeLocalStorage.remove(JOURNAL_KEY);
    setEntries([]);
  };

  const fr = (ts: number) => new Date(ts).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <ModalShell open={open} onClose={onClose} title="Journal des générations"
      footer={
        <div className="flex justify-between">
          <Button variant="outline" size="sm" onClick={clear} disabled={entries.length === 0}>
            <Trash2 size={12} /> Vider
          </Button>
          <Button size="sm" onClick={onClose}>Fermer</Button>
        </div>
      }>
      {entries.length === 0 ? (
        <div className="py-12 text-center">
          <History size={28} className="mx-auto text-ink-300" />
          <p className="mt-2 text-sm font-semibold text-ink">Aucune génération enregistrée</p>
          <p className="text-[11px] font-medium text-ink-500">Le journal trace les 50 dernières générations PDF/PPTX.</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-1.5 text-[12px]">
              <Download size={11} className="shrink-0 text-amber-deep" />
              <p className="flex-1 truncate font-semibold text-ink">{e.title}</p>
              <span className="mono rounded bg-ink/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-ink-700">{e.format}</span>
              <span className="mono text-[10px] font-medium text-ink-500">{fr(e.ts)}</span>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * LogoUpload — import logo / cover background image
 * ═══════════════════════════════════════════════════════════════ */
interface LogoUploadProps { label: string; value?: string; onChange: (dataUrl: string | undefined) => void }
export function LogoUpload({ label, value, onChange }: LogoUploadProps) {
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</label>
      <div className="flex items-center gap-2">
        {value
          ? <img src={value} alt="" className="h-12 w-12 rounded-md border object-cover" style={{ borderColor: '#e5e7eb' }} />
          : <div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-dashed border-line bg-surface2"><ImagePlus size={16} className="text-ink-400" /></div>
        }
        <div className="flex-1 space-y-1">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-bold text-ink-700 hover:border-amber-deep/40">
              <ImagePlus size={11} /> {value ? 'Remplacer' : 'Choisir une image'}
            </span>
          </label>
          {value && (
            <button onClick={() => onChange(undefined)}
              className="ml-1 inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50">
              <Trash2 size={11} /> Retirer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
