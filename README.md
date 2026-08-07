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

## Structure (extrait)

```
src/engine/{performance,competences,bonus}/  moteurs déterministes + tests
src/lib/{perf,comp,bonus}/                    couche live Supabase + mocks
src/pages/                                    UI par module (M1…M13)
supabase/migrations/                          schéma versionné (RLS, RPC, triggers)
supabase/functions/                           Edge Functions (Deno)
e2e/                                          tests Playwright
```
