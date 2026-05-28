import { useEffect, useState } from 'react';
import { FileText, Plus, Pencil, Copy } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Modal } from '../../components/ui/overlays';
import { useToast } from '../../components/ui/Toast';
import { SettingsSubNav } from '../../components/mss/SettingsSubNav';
import { useSurface } from '../../store/useSurface';
import { TEMPLATE_GROUPS, type TemplateGroup } from '../../lib/mss/settings';

export function SettingsTemplatesPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);
  const { toast } = useToast();

  const [groups, setGroups] = useState<TemplateGroup[]>(TEMPLATE_GROUPS);
  const [open, setOpen] = useState(false);
  const [groupIdx, setGroupIdx] = useState(0);
  const [name, setName] = useState('');

  const create = () => {
    const label = name.trim();
    if (!label) return;
    setGroups((gs) => gs.map((g, i) => i === groupIdx ? { ...g, items: [...g.items, { label, mine: true }] } : g));
    setOpen(false); setName('');
    toast({ variant: 'success', title: 'Modèle créé', description: `« ${label} » ajouté à ${groups[groupIdx].title}.` });
  };
  const duplicate = (gi: number, label: string) => {
    setGroups((gs) => gs.map((g, i) => i === gi ? { ...g, items: [...g.items, { label: `${label} (copie)`, mine: true }] } : g));
    toast({ variant: 'info', title: 'Modèle dupliqué', description: 'Vous pouvez le personnaliser.' });
  };

  return (
    <div className="animate-fade-up space-y-5">
      <SettingsSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Mes modèles managériaux</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Nouveau modèle</Button>
      </div>

      {groups.map((g, gi) => (
        <Card key={g.title}>
          <CardHeader title={g.title} action={<FileText size={16} className="text-ink-400" />} />
          <div className="space-y-2">
            {g.items.map((it, ii) => (
              <div key={ii} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface2 px-3 py-2">
                <span className="flex items-center gap-2 text-sm font-medium text-ink-700">{it.label}
                  {it.mine ? <StatusPill tone="info" dot={false}>Mon modèle</StatusPill> : <StatusPill tone="neutral" dot={false}>Organisation</StatusPill>}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => duplicate(gi, it.label)}><Copy size={13} /> Dupliquer</Button>
                  {it.mine && <Button variant="ghost" size="sm" onClick={() => toast({ variant: 'info', title: 'Édition', description: `Édition de « ${it.label} ».` })}><Pencil size={13} /> Modifier</Button>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card>
        <p className="text-[12px] font-medium text-ink-500">Les modèles de l’organisation sont fournis par les RH et ne peuvent être que dupliqués. Vos modèles personnels restent privés à votre périmètre managérial.</p>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau modèle" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button><Button size="sm" onClick={create} disabled={!name.trim()}>Créer</Button></>}>
        <div className="space-y-3">
          <label className="block">
            <span className="text-[12px] font-semibold text-ink-500">Catégorie</span>
            <select value={groupIdx} onChange={(e) => setGroupIdx(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30">
              {groups.map((g, i) => <option key={g.title} value={i}>{g.title}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] font-semibold text-ink-500">Nom du modèle</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Trame 1:1 nouveaux arrivants" className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-info/30" />
          </label>
        </div>
      </Modal>
    </div>
  );
}
