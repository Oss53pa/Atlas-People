/**
 * ClientPortalPage — l'espace du contact d'une entreprise cliente (`/portail`).
 *
 * Le troisième portail d'Atlas People, après l'espace salarié et l'espace
 * manager — et le seul ouvert à quelqu'un d'extérieur au workspace. Il est
 * donc en LECTURE SEULE et strictement borné : le contact ne voit que son
 * client, et seulement les rubriques que le cabinet lui a ouvertes.
 *
 * Les rubriques s'adaptent au produit du cabinet : un client de bureau de
 * paie voit ses bulletins et déclarations, un client d'agence voit ses
 * travailleurs placés.
 *
 * Accessibilité : navigation au clavier, repères ARIA sur les régions,
 * contrastes conformes AA, tableaux avec en-têtes explicites.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  Building2, ReceiptText, Users, ShieldCheck, FileText, Wallet,
  Loader2, AlertCircle, LogOut, ChevronDown, ChevronRight, Lock, Clock,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';
import {
  resolveClientPortal, touchPortalAccess, fetchPortalInvoices, fetchPortalInvoiceLines,
  portalSections, formatAmount, formatDate,
  type ClientPortalContext, type PortalInvoice, type PortalInvoiceLine,
} from '../../lib/clientPortal';

const SECTION_ICON: Record<string, typeof Users> = {
  effectifs: Users,
  paie: Wallet,
  conformite: ShieldCheck,
  factures: ReceiptText,
  documents: FileText,
};

export function ClientPortalPage() {
  const { signOut, user } = useAuth();
  const [ctx, setCtx] = useState<ClientPortalContext | null | 'loading'>('loading');
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [active, setActive] = useState<string>('factures');
  const [openInvoice, setOpenInvoice] = useState<string | null>(null);
  const [lines, setLines] = useState<PortalInvoiceLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const c = await resolveClientPortal();
      setCtx(c);
      if (!c) return;
      void touchPortalAccess('Ouverture du portail');
      if (c.scopes.invoices) setInvoices(await fetchPortalInvoices());
      const first = portalSections(c)[0];
      if (first) setActive(first.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chargement impossible');
      setCtx(null);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleInvoice = async (id: string) => {
    if (openInvoice === id) { setOpenInvoice(null); return; }
    setOpenInvoice(id);
    setLines(await fetchPortalInvoiceLines(id));
  };

  if (ctx === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 size={24} className="animate-spin text-ink-400" aria-label="Chargement" />
      </div>
    );
  }

  // Compte authentifié mais qui n'est le contact d'aucun client : on le dit
  // franchement plutôt que d'afficher un espace vide sans explication.
  if (!ctx) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-5">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-premium">
          <Lock size={28} className="mx-auto text-ink-400" />
          <h1 className="mt-4 font-display text-[24px] text-ink">Aucun accès portail</h1>
          <p className="mt-3 text-[13px] font-medium leading-relaxed text-ink-500">
            L'adresse {user?.email ?? 'de ce compte'} n'est associée à aucun accès client actif.
            Demandez à votre cabinet de vous ouvrir un accès depuis son interface client.
          </p>
          {error && <p className="mt-3 text-[12px] font-medium text-rose-700">{error}</p>}
          <button
            type="button" onClick={() => signOut()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-[13px] font-bold text-ink-600 transition-colors hover:border-amber-deep/40"
          >
            <LogOut size={14} /> Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  const sections = portalSections(ctx);
  const totalDu = invoices.filter((i) => i.status === 'envoyee').reduce((s, i) => s + i.total_amount, 0);
  const totalRegle = invoices.filter((i) => i.status === 'payee').reduce((s, i) => s + i.total_amount, 0);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* En-tête */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/15 text-amber-deep">
              <Building2 size={17} />
            </span>
            <div>
              <p className="text-[14px] font-bold leading-tight text-ink">{ctx.clientName}</p>
              <p className="text-[11px] font-medium text-ink-500">Espace client · {ctx.cabinetName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[12px] font-bold text-ink">{ctx.contactName}</p>
              <p className="text-[11px] font-medium text-ink-500">{ctx.contactEmail}</p>
            </div>
            <button
              type="button" onClick={() => signOut()}
              className="rounded-xl border border-line p-2 text-ink-500 transition-colors hover:border-amber-deep/40 hover:text-ink"
              aria-label="Se déconnecter"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="font-display text-[30px] leading-tight tracking-tight text-ink">
          Bonjour {ctx.contactName.split(' ')[0] || ''}
        </h1>
        <p className="mt-1 text-[13px] font-medium text-ink-500">
          Voici ce que {ctx.cabinetName} met à votre disposition.
          {ctx.lastAccessAt && ` Dernière visite le ${formatDate(ctx.lastAccessAt)}.`}
        </p>

        {/* Repères */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Effectif géré', value: String(ctx.clientEffectif), icon: Users, show: ctx.scopes.headcount },
            { label: 'Factures reçues', value: String(invoices.length), icon: ReceiptText, show: ctx.scopes.invoices },
            { label: 'Restant dû', value: formatAmount(totalDu), icon: Clock, show: ctx.scopes.invoices, cls: totalDu > 0 ? 'text-amber-700' : undefined },
            { label: 'Réglé', value: formatAmount(totalRegle), icon: Wallet, show: ctx.scopes.invoices, cls: 'text-emerald-700' },
          ].filter((k) => k.show).map((k) => (
            <div key={k.label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <k.icon size={12} className="text-ink-500" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{k.label}</p>
              </div>
              <p className={cn('mono mt-1 text-[17px] font-bold leading-tight', k.cls ?? 'text-ink')}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Navigation par rubrique */}
        <nav aria-label="Rubriques" className="mt-8 flex flex-wrap gap-2 border-b border-line pb-3">
          {sections.map((s) => {
            const Icon = SECTION_ICON[s.key] ?? FileText;
            const on = active === s.key;
            return (
              <button
                key={s.key} type="button" onClick={() => setActive(s.key)}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-bold transition-colors',
                  on ? 'bg-ink text-surface' : 'border border-line bg-surface text-ink-600 hover:border-amber-deep/40',
                )}
              >
                <Icon size={14} aria-hidden /> {s.label}
              </button>
            );
          })}
        </nav>

        {sections.length === 0 && (
          <div className="mt-8 rounded-2xl border border-line bg-surface p-8 text-center">
            <Lock size={24} className="mx-auto text-ink-400" />
            <p className="mt-3 text-[14px] font-bold text-ink">Aucune rubrique ouverte</p>
            <p className="mt-1 text-[12px] font-medium text-ink-500">
              Votre cabinet n'a encore ouvert aucune rubrique de consultation sur cet accès.
            </p>
          </div>
        )}

        {/* Factures */}
        {active === 'factures' && ctx.scopes.invoices && (
          <section aria-label="Mes factures" className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            <div className="border-b border-line px-5 py-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Honoraires · {invoices.length} document(s)
              </p>
            </div>
            <ul className="divide-y divide-line/60">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <button
                    type="button" onClick={() => toggleInvoice(inv.id)}
                    aria-expanded={openInvoice === inv.id}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-ink/[0.02]"
                  >
                    <ReceiptText size={15} className="shrink-0 text-ink-400" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-ink">{inv.period_label}</span>
                      <span className="mono block text-[11px] text-ink-500">{inv.reference}</span>
                    </span>
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                      inv.status === 'payee' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
                    )}>
                      {inv.status === 'payee' ? 'Réglée' : `À régler avant le ${formatDate(inv.due_on)}`}
                    </span>
                    <span className="mono w-36 text-right text-[13px] font-bold text-ink">
                      {formatAmount(inv.total_amount, inv.currency)}
                    </span>
                    {openInvoice === inv.id
                      ? <ChevronDown size={14} className="text-ink-400" aria-hidden />
                      : <ChevronRight size={14} className="text-ink-400" aria-hidden />}
                  </button>

                  {openInvoice === inv.id && (
                    <div className="border-t border-line bg-surface2/40 px-5 py-4">
                      <table className="w-full">
                        <caption className="sr-only">Détail de la facture {inv.reference}</caption>
                        <thead>
                          <tr className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                            <th scope="col" className="py-1.5 text-left">Prestation</th>
                            <th scope="col" className="py-1.5 text-right">Quantité</th>
                            <th scope="col" className="py-1.5 text-right">Prix unitaire</th>
                            <th scope="col" className="py-1.5 text-right">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((l) => (
                            <tr key={l.id} className="border-t border-line/60">
                              <td className="py-2 text-[13px] font-medium text-ink">{l.label}</td>
                              <td className="mono py-2 text-right text-[13px] text-ink-600">{l.quantity}</td>
                              <td className="mono py-2 text-right text-[13px] text-ink-600">{formatAmount(l.unit_amount, inv.currency)}</td>
                              <td className="mono py-2 text-right text-[13px] font-bold text-ink">{formatAmount(l.amount, inv.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-line">
                            <td colSpan={3} className="py-2 text-right text-[12px] font-bold text-ink-600">Total HT</td>
                            <td className="mono py-2 text-right text-[13px] font-bold text-ink">{formatAmount(inv.subtotal_amount, inv.currency)}</td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="py-1 text-right text-[12px] font-bold text-ink-600">TVA {inv.tax_rate}%</td>
                            <td className="mono py-1 text-right text-[13px] font-bold text-ink">{formatAmount(inv.tax_amount, inv.currency)}</td>
                          </tr>
                          <tr className="border-t border-line">
                            <td colSpan={3} className="py-2 text-right text-[13px] font-bold text-ink">Total TTC</td>
                            <td className="mono py-2 text-right text-[15px] font-bold text-ink">{formatAmount(inv.total_amount, inv.currency)}</td>
                          </tr>
                        </tfoot>
                      </table>
                      <p className="mt-3 text-[11px] font-medium text-ink-500">
                        Facture émise le {formatDate(inv.issued_on)} · effectif retenu : {inv.headcount}
                        {inv.paid_at && ` · réglée le ${formatDate(inv.paid_at)}`}
                      </p>
                    </div>
                  )}
                </li>
              ))}
              {invoices.length === 0 && (
                <li className="px-5 py-10 text-center">
                  <ReceiptText size={24} className="mx-auto text-ink-300" aria-hidden />
                  <p className="mt-3 text-[13px] font-bold text-ink">Aucune facture</p>
                  <p className="mt-1 text-[12px] font-medium text-ink-500">
                    Les honoraires apparaîtront ici dès que votre cabinet vous les aura adressés.
                  </p>
                </li>
              )}
            </ul>
          </section>
        )}

        {/* Rubriques en cours d'ouverture — annoncées telles quelles */}
        {active !== 'factures' && (
          <section aria-label={sections.find((s) => s.key === active)?.label} className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
            <AlertCircle size={24} className="mx-auto text-ink-400" aria-hidden />
            <p className="mt-3 text-[14px] font-bold text-ink">
              {sections.find((s) => s.key === active)?.label}
            </p>
            <p className="mx-auto mt-1 max-w-md text-[12px] font-medium leading-relaxed text-ink-500">
              {sections.find((s) => s.key === active)?.description}
              {' '}Cette rubrique vous est ouverte, mais la consultation détaillée n'est pas encore disponible
              dans votre espace — votre cabinet peut vous transmettre ces éléments directement.
            </p>
          </section>
        )}

        <p className="mt-8 text-center text-[11px] font-medium text-ink-500">
          Espace en lecture seule · vos consultations sont journalisées · données hébergées en Afrique
        </p>
      </main>
    </div>
  );
}
