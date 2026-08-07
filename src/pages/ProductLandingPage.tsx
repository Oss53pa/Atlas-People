/**
 * ProductLandingPage — sous-landing publique d'une formule (`/produits/:slug`).
 *
 * Une seule page paramétrée par le catalogue `PRODUCTS` : chaque formule y
 * dispose de sa fiche, et des deux issues attendues depuis la landing —
 *   • se connecter, si l'on a déjà un compte actif sur ce produit ;
 *   • souscrire, sinon (formulaire pré-renseigné avec le produit visé).
 *
 * Slug inconnu → retour à la section Formules de la landing principale.
 */
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, LogIn, Check, Mail, Zap, Sparkles, ShieldCheck, Clock,
} from 'lucide-react';
import { PRODUCTS, productFromSlug, productPath, loginPathForProduct } from '../app/products';
import type { Product } from '../app/products';
import { getNav } from '../app/nav';
import { cn } from '../lib/cn';

const CONTACT_EMAIL = 'hello@atlas-studio.org';

const EFFECTIFS = ['Moins de 50', '50 à 200', '200 à 500', '500 et plus'];
const PAYS = [
  { group: 'UEMOA / XOF', items: ['Côte d\'Ivoire', 'Sénégal', 'Mali', 'Burkina Faso', 'Bénin', 'Togo', 'Niger', 'Guinée-Bissau'] },
  { group: 'CEMAC / XAF', items: ['Cameroun', 'Gabon', 'Congo', 'Tchad', 'Centrafrique', 'Guinée Équatoriale'] },
];

export function ProductLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = productFromSlug(slug);

  if (!product) return <Navigate to="/landing#formules" replace />;

  const Icon = product.icon;
  const others = PRODUCTS.filter((p) => p.slug !== product.slug);
  const navGroups = getNav(product.tenantType);

  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* ─────────────────────── Header ─────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link to="/landing" className="flex items-baseline gap-2">
            <span className="font-display text-[26px] leading-none text-amber-deep">Atlas Studio</span>
            <span className="text-ink-400">/</span>
            <span className="font-display text-[22px] leading-none text-ink">Atlas People</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/landing#formules"
              className="hidden items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-amber-deep sm:inline-flex">
              <ArrowLeft size={14} /> Toutes les formules
            </Link>
            <Link to={loginPathForProduct(product.tenantType)}
              className={cn('inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold transition-opacity', product.accentBtn)}>
              <LogIn size={14} /> Se connecter
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────── Hero produit ─────────────────────── */}
      <section className={cn('border-b border-line', product.accentBg)}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className={cn('inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface shadow-sm ring-1 ring-line', product.accentText)}>
                  <Icon size={22} />
                </span>
                <div>
                  <p className={cn('text-[11px] font-bold uppercase tracking-[0.18em]', product.accentText)}>{product.mode}</p>
                  <p className="text-[12px] font-semibold text-ink-500">{product.label} · {product.sub}</p>
                </div>
              </div>

              <h1 className="mt-6 font-display text-[44px] leading-[1.05] tracking-tight text-ink sm:text-[54px]">
                {product.productName}
              </h1>
              <p className="mt-5 max-w-xl text-[15px] font-medium leading-relaxed text-ink-700">
                {product.pitch}
              </p>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {product.tags.map((t) => (
                  <span key={t} className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink-500 ring-1 ring-line">{t}</span>
                ))}
              </div>

              {/* Les deux issues : compte actif → connexion, sinon souscription */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to={loginPathForProduct(product.tenantType)}
                  className={cn('inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-bold shadow-sm transition-shadow hover:shadow-lg', product.accentBtn)}>
                  <LogIn size={16} /> J'ai déjà un compte — me connecter
                </Link>
                <a href="#souscrire"
                  className="inline-flex items-center gap-2 rounded-2xl border border-ink/15 bg-surface px-5 py-3 text-[14px] font-bold text-ink transition-colors hover:border-ink/40">
                  <Zap size={15} className={product.accentText} /> Souscrire à cette formule
                </a>
              </div>
              <p className="mt-3 text-[12px] font-medium text-ink-500">
                Compte actif ? La connexion vous ouvre directement {product.productName}.
                Sinon, votre espace est provisionné sous 24 h après souscription.
              </p>
            </div>

            {/* Encart repères */}
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">Pour qui ?</p>
              <ul className="mt-4 space-y-3">
                {product.forWho.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-[13px] font-medium leading-relaxed text-ink-700">
                    <Check size={14} className={cn('mt-0.5 shrink-0', product.accentText)} />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-3 border-t border-line pt-5">
                <Repere icon={Sparkles} label="Tarif" value={product.pricing} />
                <Repere icon={Clock} label="Mise en service" value="Espace admin prêt sous 24 h ouvrées" />
                <Repere icon={ShieldCheck} label="Conformité" value="14 régimes OHADA · audit chaîné SHA-256" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────── Ce que la formule apporte ─────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.22em]', product.accentText)}>Ce que vous obtenez</p>
          <h2 className="mt-2 font-display text-[34px] leading-tight text-ink sm:text-[42px]">
            {product.productName}, concrètement
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {product.highlights.map((h) => (
              <div key={h} className="flex items-start gap-3 rounded-2xl border border-line bg-surface2/30 p-5">
                <span className={cn('mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface ring-1 ring-line', product.accentText)}>
                  <Check size={14} />
                </span>
                <p className="text-[13px] font-medium leading-relaxed text-ink-700">{h}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── Modules ouverts ─────────────────────── */}
      <section className="border-y border-line bg-surface2/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.22em]', product.accentText)}>Périmètre fonctionnel</p>
          <h2 className="mt-2 font-display text-[34px] leading-tight text-ink sm:text-[42px]">
            Les écrans ouverts par cette formule
          </h2>
          <p className="mt-3 max-w-2xl text-[13px] font-medium leading-relaxed text-ink-500">
            La navigation ci-dessous est exactement celle que vous retrouvez après connexion.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {navGroups.map((group) => (
              <div key={group.bloc} className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{group.label}</p>
                <ul className="mt-3 space-y-2">
                  {group.modules.map((m) => {
                    const ModuleIcon = m.icon;
                    return (
                      <li key={m.code} className="flex items-center gap-2 text-[13px] font-medium text-ink-700">
                        <ModuleIcon size={14} className={product.accentText} />
                        {m.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── Connexion ou souscription ─────────────────────── */}
      <section id="souscrire" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <p className={cn('text-[11px] font-bold uppercase tracking-[0.22em]', product.accentText)}>Deux façons d'entrer</p>
              <h2 className="mt-2 font-display text-[34px] leading-tight text-ink sm:text-[42px]">
                Vous connecter ou souscrire
              </h2>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-line bg-surface2/30 p-5">
                  <p className="text-[13px] font-bold text-ink">Vous avez déjà un compte actif</p>
                  <p className="mt-1 text-[13px] font-medium leading-relaxed text-ink-500">
                    Connectez-vous : vous arrivez directement dans {product.productName}, avec le périmètre
                    de votre workspace.
                  </p>
                  <Link to={loginPathForProduct(product.tenantType)}
                    className={cn('mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-opacity', product.accentBtn)}>
                    <LogIn size={14} /> Me connecter
                  </Link>
                </div>

                <div className="rounded-2xl border border-line bg-surface2/30 p-5">
                  <p className="text-[13px] font-bold text-ink">Vous n'êtes pas encore abonné</p>
                  <p className="mt-1 text-[13px] font-medium leading-relaxed text-ink-500">
                    Remplissez la demande de souscription : l'équipe Atlas Studio répond sous 24 h ouvrées
                    et provisionne votre accès administrateur.
                  </p>
                  <p className="mt-3 text-[12px] font-medium text-ink-500">
                    Ou écrivez directement à{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-amber-deep hover:underline">{CONTACT_EMAIL}</a>.
                  </p>
                </div>
              </div>
            </div>

            <SubscriptionForm product={product} />
          </div>
        </div>
      </section>

      {/* ─────────────────────── Autres formules ─────────────────────── */}
      <section className="border-t border-line bg-surface2/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-[30px] leading-tight text-ink sm:text-[36px]">Une autre structure ?</h2>
          <p className="mt-2 text-[13px] font-medium text-ink-500">
            Les 4 autres formules Atlas People, taillées pour d'autres modèles d'organisation.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((p) => {
              const OtherIcon = p.icon;
              return (
                <Link key={p.slug} to={productPath(p)}
                  className={cn('rounded-2xl border-2 p-4 transition-shadow hover:shadow-md', p.accentBorder, p.accentBg)}>
                  <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface shadow-sm ring-1 ring-line', p.accentText)}>
                    <OtherIcon size={17} />
                  </span>
                  <p className={cn('mt-3 text-[10px] font-bold uppercase tracking-[0.15em]', p.accentText)}>{p.mode}</p>
                  <p className="text-[14px] font-bold leading-tight text-ink">{p.productName}</p>
                  <p className="mt-1 text-[11px] font-medium text-ink-500">{p.sub}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-ink-700">
                    Découvrir <ArrowRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────── Footer ─────────────────────── */}
      <footer className="border-t border-line bg-ink text-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="text-[12px] font-medium text-surface/60">
            © {new Date().getFullYear()} Atlas Studio — Atlas People · SIRH OHADA
          </p>
          <div className="flex flex-wrap items-center gap-5 text-[12px] font-semibold">
            <Link to="/landing" className="text-white/70 hover:text-amber">Landing</Link>
            <Link to="/landing#formules" className="text-white/70 hover:text-amber">Formules</Link>
            <Link to="/landing#contact" className="text-white/70 hover:text-amber">Contact</Link>
            <Link to={loginPathForProduct(product.tenantType)} className="text-amber hover:underline">Se connecter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────

function Repere({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber/12 text-amber-deep ring-1 ring-amber-deep/20">
        <Icon size={14} />
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
        <p className="text-[12px] font-medium leading-relaxed text-ink-700">{value}</p>
      </div>
    </div>
  );
}

/**
 * Demande de souscription. Aucun backend public n'est exposé pour la
 * souscription : la demande part par email, pré-remplie avec le produit et les
 * informations saisies — l'utilisateur voit et envoie lui-même son message.
 */
function SubscriptionForm({ product }: { product: Product }) {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? '').trim() || '—';
    const body = [
      `Produit souhaité : ${product.productName} (${product.mode})`,
      '',
      `Nom complet     : ${get('nom')}`,
      `Email pro       : ${get('email')}`,
      `Entreprise      : ${get('entreprise')}`,
      `Effectif        : ${get('effectif')}`,
      `Pays OHADA      : ${get('pays')}`,
      '',
      'Message :',
      get('message'),
    ].join('\n');

    window.location.href =
      `mailto:${CONTACT_EMAIL}`
      + `?subject=${encodeURIComponent(`Souscription ${product.productName}`)}`
      + `&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-line bg-surface p-7 shadow-sm">
      <p className={cn('text-[10px] font-bold uppercase tracking-[0.18em]', product.accentText)}>Demande de souscription</p>
      <p className="mt-1 text-[14px] font-bold text-ink">{product.productName}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="nom" label="Nom complet" placeholder="Aïcha Diop" required />
        <Field name="email" label="Email professionnel" placeholder="aicha@entreprise.ci" type="email" required />
        <Field name="entreprise" label="Entreprise" placeholder="Atlas Démo SARL" required />
        <Field name="effectif" label="Effectif">
          <select name="effectif" defaultValue=""
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none">
            <option value="">— Sélectionner —</option>
            {EFFECTIFS.map((e) => <option key={e}>{e}</option>)}
          </select>
        </Field>
      </div>

      <Field name="pays" label="Pays OHADA" className="mt-4">
        <select name="pays" defaultValue=""
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink focus:border-amber-deep focus:outline-none">
          <option value="">— Sélectionner —</option>
          {PAYS.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.items.map((c) => <option key={c}>{c}</option>)}
            </optgroup>
          ))}
        </select>
      </Field>

      <Field name="message" label="Votre besoin" className="mt-4">
        <textarea
          name="message" rows={4}
          placeholder="Nombre de collaborateurs ou de clients à gérer, calendrier souhaité, contraintes spécifiques…"
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none"
        />
      </Field>

      <button type="submit"
        className={cn('mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-bold shadow-sm transition-shadow hover:shadow-lg', product.accentBtn)}>
        <Mail size={16} /> Envoyer ma demande de souscription
      </button>

      {sent && (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] font-medium text-emerald-700">
          Votre messagerie s'ouvre avec la demande pré-remplie — il ne reste qu'à l'envoyer.
          Si rien ne s'ouvre, écrivez à <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline">{CONTACT_EMAIL}</a>.
        </p>
      )}

      <p className="mt-3 text-[10px] font-medium leading-relaxed text-ink-500">
        Réponse sous 24 h ouvrées. Vos données restent en Afrique (Côte d'Ivoire / Sénégal).
      </p>
    </form>
  );
}

interface FieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  className?: string;
  required?: boolean;
  children?: React.ReactNode;
}

function Field({ name, label, placeholder, type = 'text', className, required, children }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
      {children ?? (
        <input
          name={name} type={type} placeholder={placeholder} required={required}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink placeholder:text-ink-400 focus:border-amber-deep focus:outline-none"
        />
      )}
    </label>
  );
}
