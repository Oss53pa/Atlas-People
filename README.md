# Atlas People

SIRH — React 18 + TypeScript + Vite, backend Supabase (RLS · Edge Functions ·
RPC SECURITY DEFINER), `Money.ts` bigint pour tout FCFA, audit chaîné SHA-256,
PROPH3T en conseil uniquement.

## Démarrage

```bash
npm install          # (voir note lockfile ci-dessous)
npm run dev          # http://localhost:5173  (mode démo si backend non configuré)
```

Sans `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, l'app tourne en **mode démo**
(données mockées, authentification simulée) — aucun appel réseau.

> **Note lockfile** : le `package-lock.json` est généré sous Windows et n'embarque
> pas les binaires optionnels Linux (esbuild). Utiliser `npm install` (pas `npm ci`).

## Qualité — garde-fous

| Gate | Commande | Doit être |
|------|----------|-----------|
| Typage | `npm run typecheck` | 0 erreur |
| Lint | `npm run lint` | 0 erreur (warnings tolérés) |
| Tests unitaires | `npm run test` | vert (moteurs déterministes) |
| Build | `npm run build` | OK |
| E2E | `npm run test:e2e` | vert (parcours critiques) |

- **Tests unitaires** (`vitest`) : moteurs `src/engine/*` (performance, compétences,
  bonus), `Money.ts`, paie. Déterministes, zéro flottant monétaire.
- **E2E** (`playwright`, `e2e/`) : parcours critiques en mode démo (cockpits
  Performance / Bonus / Readiness), sans erreur runtime.

## CI bloquante

`.github/workflows/ci.yml` exécute, sur **chaque PR vers `main`** et **push `main`** :

1. `quality` — typecheck → lint → tests → build
2. `e2e` — Playwright (parcours critiques)

Toute erreur fait échouer le job.

### ⚠️ Activer le blocage réel (une fois, côté GitHub)

La CI s'affiche mais **n'empêche pas** un merge tant que la protection de branche
n'est pas activée :

**Settings → Branches → Add branch ruleset (ou rule) sur `main` →
Require status checks to pass before merging**, puis cocher :
- `Types · Lint · Tests · Build`
- `E2E (Playwright · parcours critiques)`

Cocher aussi **« Require branches to be up to date before merging »**. Une fois
fait, aucune régression types / lint / tests / build / e2e ne peut atterrir sur `main`.

## Accessibilité (a11y)

Audit automatisé **axe-core** (WCAG 2.1 A + AA) intégré aux e2e (`e2e/a11y.spec.ts`)
sur 6 écrans clés (Cockpit, Performance, Bonus, Readiness, Collaborateurs, Paie).

- **Gate CI bloquant** : **0 violation `critical` NI `serious`** (contraste inclus).
  L'audit fige les animations d'entrée (`animate-fade-up`) avant analyse → axe
  mesure l'**état rendu stable** (ce que voit l'utilisateur), pas une frame de fondu.

### Passe contraste — terminée ✅

Toute la palette de texte est AA (≥ 4.5:1 petit texte). Corrections, mesurées
composant par composant :

1. **Texte d'encre** (`ink-400 #6E6A5F`, `ink-500`, `ink-700`) : déjà AA en
   *solide*. Les « ~140 » violations grises initialement rapportées étaient un
   **artefact de mesure** — axe capturait les éléments *en cours* de `fade-up`
   (opacité 0→1). En figeant l'animation avant l'analyse, elles disparaissent
   (couleurs réelles inchangées, toutes ≥ 5.4:1).
2. **Tokens sémantiques** assombris pour AA en petit texte sur tuile teintée :
   `ok #1B9E6B→#0F7048` · `warn #D9921A→#8A5A0F` · `danger #D6483B→#B0362A` ·
   `info #3B82C4→#2266A0` · `purple→#7B46A0`. Remplissages `bg-*/10` inchangés à l'œil.
3. **`amber-deep`** = amber d'**encre**, assombri `#C97E12→#8F5810` (5.02:1 canvas,
   5.88:1 blanc). Corrige le petit texte `text-amber-deep` **et** les boutons
   `bg-amber-deep text-white` (blanc → 5.9:1). L'amber large/accent reste `amber`/`amber-soft`.
4. **Texte sur remplissage amber** (`bg-amber text-white`, 2.17:1) → `text-night`
   (sélecteurs audience/manager/mode des cockpits Perf / Readiness / Bonus).
5. **`nested-interactive`** (table Collaborateurs) : la ligne n'est plus un
   `role="button"` englobant le bouton Actions. Le **nom est un lien « étiré »**
   (`before:inset-0` → ligne entière cliquable) ; le bouton Actions passe en
   `z-10`, sibling du lien. Clavier : Tab nom → Tab Actions.

Palettes choisies via calcul WCAG (blanc / canvas / surface2 + tuiles `/10-15`),
puis vérifiées par un scan axe dédié (0 violation stable) — pas « à l'œil ».

## Structure (extrait)

```
src/engine/{performance,competences,bonus}/  moteurs déterministes + tests
src/lib/{perf,comp,bonus}/                    couche live Supabase + mocks
src/pages/                                    UI par module (M1…M13)
supabase/migrations/                          schéma versionné (RLS, RPC, triggers)
supabase/functions/                           Edge Functions (Deno)
e2e/                                          tests Playwright
```
