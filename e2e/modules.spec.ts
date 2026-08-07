import { test, expect } from '@playwright/test';

// Smoke de couverture : chaque module majeur rend son écran d'atterrissage
// (au moins un titre) SANS erreur runtime, en mode démo.
const MODULES: { path: string; label: string }[] = [
  { path: '/', label: 'Cockpit DRH' },
  { path: '/cockpit-360', label: 'Vue 360' },
  { path: '/collaborateurs', label: 'Collaborateurs (M1)' },
  { path: '/temps', label: 'Temps & absences (M2)' },
  { path: '/paie', label: 'Paie (M3)' },
  { path: '/hr/actes', label: 'Actes & conformité (ADM)' },
  { path: '/frais', label: 'Notes de frais (M4)' },
  { path: '/recrutement', label: 'Recrutement (M5)' },
  { path: '/onboarding', label: 'Onboarding (M6)' },
  { path: '/objectifs', label: 'Objectifs OKR (M7)' },
  { path: '/evaluations', label: 'Évaluations (M8)' },
  { path: '/competences', label: 'Compétences (M9)' },
  { path: '/carrieres', label: 'Carrières (M10)' },
  { path: '/formation', label: 'Formation (M11)' },
  { path: '/conformite', label: 'Conformité & SST (M12)' },
  { path: '/moi', label: 'Espace employé (ESS)' },
  { path: '/team', label: 'Espace manager (MSS)' },
];

for (const m of MODULES) {
  test(`${m.label} — ${m.path} rend sans erreur runtime`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(m.path);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(errors, `Erreurs runtime sur ${m.path}: ${errors.join(' | ')}`).toHaveLength(0);
  });
}
