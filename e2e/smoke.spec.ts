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

test.describe('Formules — landing, sous-landing et accès produit', () => {
  test('chaque carte de la landing mène à sa formule, sa connexion et sa souscription', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/landing');

    for (const slug of ['core', 'conseil', 'payroll', '360', 'placement']) {
      await expect(page.locator(`#formules a[href="/produits/${slug}"]`)).toHaveCount(1);
      await expect(page.locator(`#formules a[href="/login?produit=${slug}"]`)).toHaveCount(1);
      await expect(page.locator(`#formules a[href="/produits/${slug}#souscrire"]`)).toHaveCount(1);
    }
    expect(errors, `Erreurs runtime: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('la sous-landing d\'une formule offre connexion et souscription', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/produits/payroll');

    await expect(page.getByRole('heading', { name: 'Atlas Payroll', exact: true })).toBeVisible();
    // Périmètre fonctionnel : les écrans propres au bureau de paie.
    await expect(page.getByRole('listitem').filter({ hasText: 'DSN consolidée' })).toBeVisible();
    // Souscription accessible sans compte.
    await expect(page.locator('#souscrire')).toBeVisible();
    await expect(page.getByRole('button', { name: /demande de souscription/i })).toBeVisible();
    expect(errors, `Erreurs runtime: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('« me connecter » depuis une formule ouvre le logiciel correspondant', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/produits/placement');
    await page.getByRole('link', { name: /me connecter/i }).first().click();
    // Mode démo : la connexion applique le produit visé, dont l'accueil est
    // la liste des travailleurs placés (agence de mise à disposition).
    await expect(page).toHaveURL(/\/travailleurs-places$/);
    expect(errors, `Erreurs runtime: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('une formule inconnue retombe sur la liste des formules', async ({ page }) => {
    await page.goto('/produits/inconnu');
    await expect(page).toHaveURL(/\/landing#formules$/);
    await expect(page.locator('#formules').getByRole('heading', { name: /Choisissez votre formule/i })).toBeVisible();
  });
});
