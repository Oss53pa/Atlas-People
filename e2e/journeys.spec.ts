import { test, expect, type Page } from '@playwright/test';

const track = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};

test.describe('Parcours métier — navigation & drill-down', () => {
  test('navigation latérale entre modules', async ({ page }) => {
    const errors = track(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Collaborateurs' }).first().click();
    await expect(page).toHaveURL(/\/collaborateurs$/);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.getByRole('link', { name: /Paie & déclarations/ }).first().click();
    await expect(page).toHaveURL(/\/paie$/);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(errors, errors.join(' | ')).toHaveLength(0);
  });

  test('M1 — ouverture d\'un dossier collaborateur', async ({ page }) => {
    const errors = track(page);
    await page.goto('/collaborateurs');
    await expect(page.locator('h1').first()).toBeVisible();
    await page.getByText(/Koné|N['’]Guessan|Diop|Traoré/).first().click();
    await expect(page).toHaveURL(/\/collaborateurs\/[A-Za-z0-9-]+$/);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(errors, errors.join(' | ')).toHaveLength(0);
  });

  test('M3 — sous-navigation paie (Saisie)', async ({ page }) => {
    const errors = track(page);
    await page.goto('/paie');
    await page.getByRole('link', { name: 'Saisie', exact: true }).first().click();
    await expect(page).toHaveURL(/\/paie\/saisie$/);
    // la sous-nav paie persiste (page rendue) ; certaines vues attendent une sélection.
    await expect(page.getByRole('link', { name: 'Saisie', exact: true })).toBeVisible();
    expect(errors, errors.join(' | ')).toHaveLength(0);
  });

  test('M8 — sous-navigation évaluations', async ({ page }) => {
    const errors = track(page);
    await page.goto('/evaluations');
    await expect(page.locator('h1').first()).toBeVisible();
    // premier onglet de la sous-nav évaluations autre que le cockpit
    const tab = page.getByRole('link', { name: /Campagnes|Cycles|Liste|Calibration/ }).first();
    await tab.click();
    await expect(page).toHaveURL(/\/evaluations\/.+/);
    expect(errors, errors.join(' | ')).toHaveLength(0);
  });
});
