import { test, expect, type Page } from '@playwright/test';

const track = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};

test.describe('Parcours métier en profondeur (mutations d\'état)', () => {
  // Flux clé §6/§9 : la direction valide → le gating (R6) se lève → le
  // collaborateur voit son bonus.
  test('Bonus — validation direction lève le gating (R6)', async ({ page }) => {
    const errors = track(page);
    await page.goto('/bonus');
    await expect(page.getByText(/Non figé — masqué aux employés/i)).toBeVisible();
    await expect(page.getByText('Bonus non communiqué')).toBeVisible();

    await page.getByRole('button', { name: /Valider — direction/i }).click();

    await expect(page.getByText(/Enveloppe validée — affichée/i)).toBeVisible();
    await expect(page.getByText('Bonus non communiqué')).toHaveCount(0);
    expect(errors, errors.join(' | ')).toHaveLength(0);
  });

  // Le changement de mode d'articulation recalcule et change les indicateurs.
  test('Bonus — le mode d\'articulation recalcule les indicateurs', async ({ page }) => {
    const errors = track(page);
    await page.goto('/bonus');
    // Mode A par défaut → indicateur « Reliquat ».
    await expect(page.getByText('Reliquat', { exact: false }).first()).toBeVisible();
    // Mode B → indicateur « Dépassement ».
    await page.getByRole('button', { name: /B — Plafonnée/i }).click();
    await expect(page.getByText('Dépassement', { exact: false }).first()).toBeVisible();
    expect(errors, errors.join(' | ')).toHaveLength(0);
  });

  // Cockpit Performance : parcours multi-audiences + sélection d'un collaborateur.
  test('Performance — audiences + sélection employé', async ({ page }) => {
    const errors = track(page);
    await page.goto('/performance');
    await page.getByRole('button', { name: /^Manager$/ }).click();
    await expect(page.getByText(/Vue équipe consolidée/i)).toBeVisible();
    await page.getByRole('button', { name: /^Employé$/ }).click();
    await expect(page.getByText(/Objectifs & atteinte/i)).toBeVisible();
    expect(errors, errors.join(' | ')).toHaveLength(0);
  });

  // Readiness : changer de collaborateur met à jour le poste cible / le verdict.
  test('Readiness — changer de collaborateur met à jour le poste cible', async ({ page }) => {
    const errors = track(page);
    await page.goto('/competences/readiness');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Sélectionne Modeste (bouton du sélecteur, nom exact) → poste cible « Lead Data ».
    await page.getByRole('button', { name: 'Modeste Yapo', exact: true }).click();
    await expect(page.getByText(/Lead Data/).first()).toBeVisible();
    expect(errors, errors.join(' | ')).toHaveLength(0);
  });

  // M1 : dossier collaborateur — la fiche complète (calcul bulletin inclus) se charge.
  test('M1 — dossier collaborateur : fiche complète chargée', async ({ page }) => {
    const errors = track(page);
    await page.goto('/collaborateurs');
    await page.getByText(/Koné|N['’]Guessan|Diop|Traoré/).first().click();
    await expect(page).toHaveURL(/\/collaborateurs\/[A-Za-z0-9-]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // La fiche expose l'action Bulletin (paie calculée à la volée) → dossier riche rendu.
    await expect(page.getByRole('button', { name: /Bulletin/i }).first()).toBeVisible();
    expect(errors, errors.join(' | ')).toHaveLength(0);
  });
});
