/**
 * TenantBootstrapPage — écran d'amorçage d'appartenance.
 *
 * Affiché quand un utilisateur est authentifié mais rattaché à AUCUN
 * workspace (tenant_memberships vide pour lui). Sans cet écran, l'application
 * se chargeait avec tenantId = null : toute écriture levait
 * IdentityUnresolvedError et les lectures retombaient silencieusement sur le
 * tenant de démonstration via le repli de current_tenant_ids(). État cassé,
 * mais muet.
 *
 * Deux voies, dans cet ordre de préférence :
 *   1. Invitation — la voie normale. Jeton nominatif et expirable.
 *   2. Amorçage — réservé au tout premier administrateur d'un workspace
 *      vierge. La base refuse tout autre cas (cf. migration 0057), donc cet
 *      écran ne peut pas servir à s'emparer d'un workspace déjà administré.
 */
import { useState } from 'react';
import { KeyRound, ShieldCheck, LogOut, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { useAuth, fetchTenantBootstrapState, type TenantBootstrapState } from '../lib/auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function TenantBootstrapPage() {
  const { user, signOut, acceptInvitation, bootstrapTenant } = useAuth();

  const [token, setToken] = useState('');
  const [tokenBusy, setTokenBusy] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState('');
  const [probe, setProbe] = useState<TenantBootstrapState | null>(null);
  const [probeBusy, setProbeBusy] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const uuidValid = UUID_RE.test(tenantId.trim());

  const submitToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    setTokenBusy(true); setTokenError(null);
    const res = await acceptInvitation(t);
    setTokenBusy(false);
    if (!res.ok) setTokenError(res.error ?? "Invitation invalide ou expirée.");
    // Succès : le store porte désormais tenantId → ProtectedRoute rend l'app.
  };

  const runProbe = async () => {
    const id = tenantId.trim();
    if (!uuidValid) return;
    setProbeBusy(true); setClaimError(null); setProbe(null);
    const res = await fetchTenantBootstrapState(id);
    setProbeBusy(false);
    if ('error' in res) { setClaimError(res.error); return; }
    setProbe(res);
  };

  const claim = async () => {
    const id = tenantId.trim();
    if (!uuidValid) return;
    setClaimBusy(true); setClaimError(null);
    const res = await bootstrapTenant(id);
    setClaimBusy(false);
    if (!res.ok) setClaimError(res.error ?? "Amorçage refusé.");
  };

  const canClaim = probe?.existsTenant && (probe.claimable || probe.isOwner);

  return (
    <div className="min-h-screen bg-canvas px-5 py-12">
      <div className="mx-auto max-w-2xl">

        <header className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-deep">Atlas People</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink">
            Votre compte n&apos;est rattaché à aucun workspace
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-ink-500">
            Vous êtes bien authentifié{user?.email ? <> en tant que <strong className="text-ink">{user.email}</strong></> : null},
            mais aucune appartenance n&apos;est enregistrée pour vous. Tant que ce rattachement n&apos;existe pas,
            aucune donnée ne peut être écrite en votre nom.
          </p>
        </header>

        {/* ── Voie 1 : invitation ─────────────────────────────────── */}
        <section className="mb-5 rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/10 text-amber-deep ring-1 ring-amber/25">
              <KeyRound size={18} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-ink">J&apos;ai reçu une invitation</h2>
              <p className="text-[12px] font-medium text-ink-500">
                La voie normale. Collez le jeton reçu par email, ou le lien complet.
              </p>
            </div>
          </div>

          <form onSubmit={submitToken} className="space-y-3">
            <input
              value={token}
              onChange={(e) => {
                // Tolère le collage du lien entier : on extrait le jeton.
                const v = e.target.value;
                const m = v.match(/token=([^&\s]+)/);
                setToken(m ? m[1] : v);
              }}
              placeholder="Jeton d&apos;invitation"
              className="mono w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-amber/30"
            />
            {tokenError && (
              <p className="flex items-start gap-2 rounded-xl bg-danger/8 px-3 py-2 text-[12px] font-semibold text-danger">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> {tokenError}
              </p>
            )}
            <button
              type="submit"
              disabled={!token.trim() || tokenBusy}
              className="w-full rounded-2xl bg-amber-deep py-2.5 text-[13px] font-bold text-white transition-shadow hover:shadow-lg disabled:opacity-60"
            >
              {tokenBusy ? 'Vérification…' : "Rejoindre le workspace"}
            </button>
          </form>
        </section>

        {/* ── Voie 2 : amorçage premier admin ─────────────────────── */}
        <section className="mb-5 rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink-700 ring-1 ring-line">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-ink">Je crée le premier accès administrateur</h2>
              <p className="text-[12px] font-medium text-ink-500">
                Réservé à un workspace encore vierge, ou dont vous êtes déjà le propriétaire désigné.
                Tout autre cas est refusé par la base.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={tenantId}
                onChange={(e) => { setTenantId(e.target.value); setProbe(null); setClaimError(null); }}
                placeholder="Identifiant du workspace (UUID)"
                className="mono min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-amber/30"
              />
              <button
                type="button"
                onClick={runProbe}
                disabled={!uuidValid || probeBusy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-[12px] font-bold text-ink-700 transition-colors hover:bg-ink/[0.04] disabled:opacity-50"
              >
                <Search size={13} /> {probeBusy ? '…' : 'Vérifier'}
              </button>
            </div>

            {tenantId.trim() && !uuidValid && (
              <p className="text-[11.5px] font-medium text-ink-400">
                Format attendu : un UUID, par exemple 11111111-1111-1111-1111-111111111111.
              </p>
            )}

            {probe && !probe.existsTenant && (
              <p className="flex items-start gap-2 rounded-xl bg-danger/8 px-3 py-2 text-[12px] font-semibold text-danger">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> Aucun workspace ne correspond à cet identifiant.
              </p>
            )}

            {probe?.existsTenant && (
              <div className={`rounded-xl px-3 py-2.5 text-[12px] font-medium ${canClaim ? 'bg-ok/8 text-ok' : 'bg-amber/10 text-amber-deep'}`}>
                <p className="flex items-start gap-2 font-semibold">
                  {canClaim ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
                  <span>
                    {probe.tenantName ?? 'Workspace'}
                    {probe.isOwner
                      ? " — vous en êtes le propriétaire désigné."
                      : probe.claimable
                        ? " — vierge, vous pouvez en devenir le premier administrateur."
                        : " — déjà administré. Demandez une invitation à son propriétaire."}
                  </span>
                </p>
              </div>
            )}

            {claimError && (
              <p className="flex items-start gap-2 rounded-xl bg-danger/8 px-3 py-2 text-[12px] font-semibold text-danger">
                <AlertCircle size={14} className="mt-0.5 shrink-0" /> {claimError}
              </p>
            )}

            <button
              type="button"
              onClick={claim}
              disabled={!canClaim || claimBusy}
              className="w-full rounded-2xl border border-line bg-surface2 py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-ink/[0.04] disabled:opacity-50"
            >
              {claimBusy ? 'Amorçage…' : "Devenir administrateur de ce workspace"}
            </button>

            {canClaim && probe?.claimable && (
              <p className="text-[11.5px] font-medium leading-relaxed text-ink-400">
                Vous deviendrez propriétaire fondateur de ce workspace. Cette qualité n&apos;est pas révocable,
                y compris par un autre administrateur que vous nommeriez ensuite.
              </p>
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={() => { void signOut(); }}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-500 transition-colors hover:text-ink"
        >
          <LogOut size={13} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default TenantBootstrapPage;
