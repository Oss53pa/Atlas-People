import { useState } from 'react';
import {
  ExternalLink, Plus, MoreVertical, CheckCircle2, Clock, AlertCircle,
  Mail, ShieldOff, Eye,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';

type PortalStatut = 'actif' | 'invité' | 'non_activé' | 'révoqué';

interface PortalRow {
  id: string;
  client: string;
  pays: string;
  contact: string;
  email: string;
  statut: PortalStatut;
  dernierAcces?: string;
  inviteEnvoyé?: string;
}

const MOCK: PortalRow[] = [
  { id: 'p1', client: 'TechCorp Abidjan',       pays: 'CI', contact: 'Kofi Mensah',     email: 'drh@techcorp.ci',         statut: 'actif',       dernierAcces: 'il y a 2 h' },
  { id: 'p2', client: 'OHADA Manufacturing',    pays: 'CI', contact: 'Fatou Diallo',    email: 'rh@ohada-mfg.ci',         statut: 'actif',       dernierAcces: 'il y a 1 j' },
  { id: 'p3', client: 'PanAfrica Holding SN',   pays: 'SN', contact: 'Ibrahima Diop',   email: 'ibrahima@panafrica.sn',   statut: 'invité',      inviteEnvoyé: '21/07/2026' },
  { id: 'p4', client: 'Dakar Distribution',     pays: 'SN', contact: 'Aminata Traoré',  email: 'aminata@dakardist.sn',    statut: 'invité',      inviteEnvoyé: '20/07/2026' },
  { id: 'p5', client: 'Groupe Soleil CM',       pays: 'CM', contact: 'Jean-Paul Nkolo', email: 'jp.nkolo@groupesoleil.cm',statut: 'non_activé' },
  { id: 'p6', client: 'BTP Lomé Constructions', pays: 'TG', contact: 'Sékou Agbéko',    email: 'rh@btplome.tg',           statut: 'révoqué' },
];

const STATUT_META: Record<PortalStatut, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  actif:       { label: 'Portail actif',   icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  invité:      { label: 'Invitation envoyée', icon: Clock,     cls: 'bg-amber-100 text-amber-700' },
  non_activé:  { label: 'Non activé',      icon: AlertCircle,  cls: 'bg-slate-100 text-slate-500' },
  révoqué:     { label: 'Révoqué',         icon: ShieldOff,    cls: 'bg-rose-100 text-rose-700' },
};

const FLAG: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬' };

export function InterfaceClientPage() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { tenantType } = useAuth();
  const product = PRODUCT_META[tenantType];

  const actifs  = MOCK.filter((r) => r.statut === 'actif').length;
  const invités = MOCK.filter((r) => r.statut === 'invité').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', product.accentClass)}>
            {product.name}
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
            Interface client
          </h1>
          <p className="mt-1 text-[14px] font-medium text-ink-500">
            Portail lecture pour vos clients · {actifs} actifs · {invités} en attente
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-[13px] font-bold text-surface shadow-sm hover:shadow-lg"
        >
          <Plus size={15} /> Inviter un client
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Portails actifs',      value: actifs },
          { label: 'Invitations en cours', value: invités },
          { label: 'Non activés',          value: MOCK.filter((r) => r.statut === 'non_activé').length },
          { label: 'Révoqués',             value: MOCK.filter((r) => r.statut === 'révoqué').length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
            <p className="mono mt-1 text-[28px] font-bold leading-none text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-4 py-3">
          <p className="flex items-center gap-2 text-[12px] font-bold text-ink">
            <ExternalLink size={14} className="text-ink-400" />
            Accès portail par client
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-line bg-surface2/40 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-center">Pays</th>
                <th className="px-4 py-3 text-left">Contact RH</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-center">Statut portail</th>
                <th className="px-4 py-3 text-left">Dernier accès</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MOCK.map((r) => {
                const s = STATUT_META[r.statut];
                const StatusIcon = s.icon;
                return (
                  <tr key={r.id} className="group hover:bg-surface2/40">
                    <td className="px-4 py-3 text-[13px] font-semibold text-ink">{r.client}</td>
                    <td className="px-4 py-3 text-center text-[13px]">{FLAG[r.pays] ?? r.pays}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-ink-500">{r.contact}</td>
                    <td className="px-4 py-3 text-[12px] font-medium text-ink-400">{r.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', s.cls)}>
                        <StatusIcon size={10} /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-medium text-ink-400">
                      {r.dernierAcces ?? (r.inviteEnvoyé ? `Invité le ${r.inviteEnvoyé}` : '—')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)}
                          className="rounded-lg p-1 text-ink-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface2 hover:text-ink-500"
                        >
                          <MoreVertical size={15} />
                        </button>
                        {openMenu === r.id && (
                          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
                            {r.statut === 'actif' && (
                              <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-[12px] font-semibold text-ink-500 hover:bg-surface2">
                                <Eye size={13} /> Voir le portail
                              </button>
                            )}
                            {(r.statut === 'non_activé' || r.statut === 'révoqué') && (
                              <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-[12px] font-semibold text-ink-500 hover:bg-surface2">
                                <Mail size={13} /> Envoyer invitation
                              </button>
                            )}
                            {r.statut === 'actif' && (
                              <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-[12px] font-semibold text-rose-600 hover:bg-rose-50">
                                <ShieldOff size={13} /> Révoquer accès
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-line px-4 py-3">
          <p className="text-[11px] font-medium text-ink-400">
            Données démo · Accès réels depuis <span className="mono">atlas_people.client_portals</span>
          </p>
        </div>
      </div>
    </div>
  );
}
