import { useEffect, useState } from 'react';
import { Bell, Save, Moon } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { useToast } from '../../components/ui/Toast';
import { SettingsSubNav } from '../../components/mss/SettingsSubNav';
import { useSurface } from '../../store/useSurface';
import { CHANNELS, NOTIF_EVENTS, type Channel } from '../../lib/mss/settings';

type Matrix = Record<string, Set<Channel>>;
const seed = (): Matrix => Object.fromEntries(NOTIF_EVENTS.map((e) => [e.key, new Set(e.defaults)]));

const MODES = [
  { key: 'normal', label: 'Normal' },
  { key: 'focus', label: 'Concentré (suspend non-urgents 9h-17h)' },
  { key: 'holiday', label: 'Vacances' },
];

export function SettingsNotificationsPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);
  const { toast } = useToast();

  const [matrix, setMatrix] = useState<Matrix>(seed);
  const [mode, setMode] = useState('normal');
  const [quietHours, setQuietHours] = useState(true);

  const toggle = (ev: string, ch: Channel) => setMatrix((m) => {
    const next = new Set(m[ev]);
    next.has(ch) ? next.delete(ch) : next.add(ch);
    return { ...m, [ev]: next };
  });
  const all = (on: boolean) => setMatrix(() => Object.fromEntries(NOTIF_EVENTS.map((e) => [e.key, on ? new Set<Channel>(CHANNELS.map((c) => c.key)) : new Set<Channel>()])));
  const save = () => toast({ variant: 'success', title: 'Préférences enregistrées', description: 'Vos notifications managériales sont à jour.' });

  return (
    <div className="animate-fade-up space-y-5">
      <SettingsSubNav />
      <h1 className="text-2xl font-semibold text-ink">Notifications managériales</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                <th className="py-2 pr-3 text-left font-semibold">Événement</th>
                {CHANNELS.map((c) => <th key={c.key} className="px-2 py-2 text-center font-semibold">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {NOTIF_EVENTS.map((e) => (
                <tr key={e.key} className="border-b border-line/60">
                  <td className="py-2 pr-3 font-medium text-ink-700">{e.label}</td>
                  {CHANNELS.map((c) => (
                    <td key={c.key} className="px-2 py-2 text-center">
                      <input type="checkbox" checked={matrix[e.key].has(c.key)} onChange={() => toggle(e.key, c.key)} className="accent-info" aria-label={`${e.label} — ${c.label}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => all(true)}>Tout activer</Button>
          <Button variant="ghost" size="sm" onClick={() => all(false)}>Tout désactiver</Button>
          <Button size="sm" onClick={save}><Save size={14} /> Sauvegarder</Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Mode global" action={<Bell size={16} className="text-ink-400" />} />
        <div className="space-y-1.5">
          {MODES.map((m) => (
            <label key={m.key} className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface2 px-3 py-2 text-sm font-medium text-ink-700">
              <input type="radio" name="mode" checked={mode === m.key} onChange={() => setMode(m.key)} className="accent-info" /> {m.label}
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Plage de déconnexion managériale" action={<Moon size={16} className="text-ink-400" />} />
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-700">
          <input type="checkbox" checked={quietHours} onChange={(e) => setQuietHours(e.target.checked)} className="accent-info" /> Activer · Plage : 20:00 – 07:30
        </label>
        <div className="mt-2"><StatusPill tone="neutral" dot={false}>Hérité de mes paramètres employé · personnalisable</StatusPill></div>
      </Card>
    </div>
  );
}
