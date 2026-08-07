import { test, expect, type Page } from '@playwright/test';

// Capture les exceptions JS non rattrapées : un parcours qui « fonctionne »
// ne doit lever aucune erreur runtime.
function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test.describe('Parcours critiques (mode démo)', () => {
  test('l\'application charge le cockpit sans erreur', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');
    // La navigation latérale (Performance & Talents) doit être rendue.
    await expect(page.getByRole('link', { name: /Performance/i }).first()).toBeVisible();
    expect(errors, `Erreurs runtime: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('cockpit Performance — 4 audiences + accroche bonus', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/performance');
    await expect(page.getByRole('heading', { name: /Performance — Cockpit/i })).toBeVisible();
    // Le sélecteur d'audience Direction expose l'accroche bonus.
    await expect(page.getByText(/Accroche bonus/i)).toBeVisible();
    // Bascule vers l'audience Employé.
    await page.getByRole('button', { name: /Employé/i }).first().click();
    await expect(page.getByText(/Score S1/i).first()).toBeVisible();
    expect(errors, `Erreurs runtime: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('cockpit Bonus — simulation what-if déterministe', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/bonus');
    await expect(page.getByRole('heading', { name: /Bonus — Simulation/i })).toBeVisible();
    // Changer de mode d'articulation recalcule sans erreur.
    await page.getByRole('button', { name: /B — Plafonnée/i }).click();
    await expect(page.getByText(/Total réparti/i)).toBeVisible();
    expect(errors, `Erreurs runtime: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('readiness Compétences — verdict d\'accès au poste', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/competences/readiness');
    await expect(page.getByRole('heading', { name: /Readiness — accès au poste suivant/i })).toBeVisible();
    await expect(page.getByText(/Verdict d'accès/i)).toBeVisible();
    expect(errors, `Erreurs runtime: ${errors.join(' | ')}`).toHaveLength(0);
  });
});
