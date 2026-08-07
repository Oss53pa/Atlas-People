/**
 * WorkspaceSwitcher — bascule entre les workspaces du compte.
 *
 * Un compte peut posséder un workspace par formule (Core, Conseil, Payroll,
 * 360, Placement). Le workspace ACTIF n'est pas un confort d'affichage : il
 * borne `current_tenant_ids()` côté base, donc tout ce que la RLS laisse
 * lire. Changer de workspace change réellement de périmètre de données.
 *
 * Ne s'affiche pas quand le compte n'en possède qu'un — il n'y aurait rien
 * à choisir.
 */
import { useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Building2 } from 'lucide-react';
import { useAuth, useAuthStore } from '../../lib/auth';
import { PRODUCT_META } from '../../app/nav';
import { cn } from '../../lib/cn';

export function WorkspaceSwitcher() {
  const { workspaces, tenantId, tenantType } = useAuth();
  const switchWorkspace = useAuthStore((s) => s.switchWorkspace);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  if (workspaces.length < 2) return null;

  const current = workspaces.find((w) => w.tenantId === tenantId);
  const currentMeta = PRODUCT_META[current?.tenantType ?? tenantType];

  const handleSelect = async (id: string) => {
    if (id === tenantId || busy) { setOpen(false); return; }
    setBusy(id); setError(null);
    const { error: err } = await switchWorkspace(id);
    // Succès : switchWorkspace recharge la page, ce composant disparaît.
    if (err) { setBusy(null); setError(err); }
  };

  return (
    <div className="relative" ref={ref} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Changer de workspace"
        className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-2.5 py-2 transition-colors hover:border-amber/40 sm:inline-flex"
      >
        <span className={cn('flex h-6 w-6 items-center justify-center rounded-lg', currentMeta.iconBg, currentMeta.accentClass)}>
          <Building2 size={13} />
        </span>
        <span className="hidden text-left leading-tight lg:block">
          <span className="block max-w-[13rem] truncate text-[12px] font-bold text-ink">
            {current?.name ?? 'Workspace'}
          </span>
          <span className={cn('block text-[10px] font-semibold', currentMeta.accentClass)}>{currentMeta.name}</span>
        </span>
        <ChevronDown size={12} className="text-ink-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl ring-1 ring-ink/5"
          onMouseLeave={() => setOpen(false)}
        >
          <p className="border-b border-line px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            Mes workspaces · {workspaces.length}
          </p>
          <ul className="max-h-80 overflow-y-auto py-1">
            {workspaces.map((w) => {
              const meta = PRODUCT_META[w.tenantType];
              const active = w.tenantId === tenantId;
              return (
                <li key={w.tenantId}>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => handleSelect(w.tenantId)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors disabled:opacity-60',
                      active ? 'bg-amber/[0.06]' : 'hover:bg-ink/[0.03]',
                    )}
                  >
                    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.iconBg, meta.accentClass)}>
                      <Building2 size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-ink">{w.name}</span>
                      <span className={cn('block text-[11px] font-semibold', meta.accentClass)}>{meta.name}</span>
                    </span>
                    {busy === w.tenantId
                      ? <Loader2 size={14} className="shrink-0 animate-spin text-ink-400" />
                      : active && <Check size={14} className="shrink-0 text-emerald-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {error && (
            <p className="border-t border-line bg-rose-50 px-4 py-2.5 text-[11px] font-medium text-rose-700">{error}</p>
          )}
          <p className="border-t border-line px-4 py-2.5 text-[10px] font-medium leading-relaxed text-ink-500">
            Changer de workspace recharge l'application : les données affichées
            appartiennent au seul workspace ouvert.
          </p>
        </div>
      )}
    </div>
  );
}
