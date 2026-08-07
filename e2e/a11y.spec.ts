import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Audit accessibilité automatisé (axe-core, WCAG 2.1 A + AA) sur les écrans clés.
//
// Gating CI : aucune violation d'impact « critical » (bloqueurs clavier /
// lecteur d'écran). Les violations « serious » (essentiellement le contraste
// couleur — dette de design system) sont rapportées en backlog NON bloquant
// via annotations + pièce jointe, à traiter dans une passe design dédiée.
const PAGES: { path: string; name: string }[] = [
  { path: '/', name: 'Cockpit DRH' },
  { path: '/performance', name: 'Performance' },
  { path: '/bonus', name: 'Bonus' },
  { path: '/competences/readiness', name: 'Readiness' },
  { path: '/collaborateurs', name: 'Collaborateurs (M1)' },
  { path: '/paie', name: 'Paie (M3)' },
];

const fmt = (vs: { impact?: string | null; id: string; nodes: unknown[]; help: string }[]) =>
  vs.map((v) => `${v.impact} · ${v.id} (${v.nodes.length}) — ${v.help}`).join('\n');

for (const p of PAGES) {
  test(`a11y — ${p.name} (${p.path})`, async ({ page }, testInfo) => {
    await page.goto(p.path);
    await page.locator('h1').first().waitFor({ state: 'visible' });
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const critical = violations.filter((v) => v.impact === 'critical');
    const serious = violations.filter((v) => v.impact === 'serious');

    await testInfo.attach('a11y-report', {
      body: fmt(violations) || 'aucune violation',
      contentType: 'text/plain',
    });
    if (serious.length) {
      testInfo.annotations.push({
        type: 'a11y-serious (backlog)',
        description: `${p.path} — ${serious.length} violation(s) serious : ${[...new Set(serious.map((v) => v.id))].join(', ')}`,
      });
    }

    // BLOQUANT : zéro violation critique.
    expect(critical, `Violations a11y CRITIQUES sur ${p.path} :\n${fmt(critical)}`).toEqual([]);
  });
}
