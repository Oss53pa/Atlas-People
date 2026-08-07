import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Audit accessibilité automatisé (axe-core, WCAG 2.1 A + AA) sur les écrans clés.
//
// Gating CI : aucune violation d'impact « critical » NI « serious ». Le contraste
// couleur (serious) est désormais tenu AA sur toute la palette — cf. passe
// contraste (tokens sémantiques + amber-deep assombris, texte foncé sur amber).
//
// Les animations d'entrée (`animate-fade-up`, opacité 0→1) sont neutralisées avant
// l'analyse : axe mesure alors l'état RENDU STABLE (ce que voit l'utilisateur), et
// non une frame transitoire de fondu — qui produisait des faux positifs contraste.
const PAGES: { path: string; name: string }[] = [
  { path: '/', name: 'Cockpit DRH' },
  { path: '/performance', name: 'Performance' },
  { path: '/bonus', name: 'Bonus' },
  { path: '/competences/readiness', name: 'Readiness' },
  { path: '/collaborateurs', name: 'Collaborateurs (M1)' },
  { path: '/paie', name: 'Paie (M3)' },
];

// Fige animations/transitions et force l'opacité finale (état stable perçu).
const SETTLE = '*,*::before,*::after{animation:none!important;transition:none!important}';

const fmt = (vs: { impact?: string | null; id: string; nodes: unknown[]; help: string }[]) =>
  vs.map((v) => `${v.impact} · ${v.id} (${v.nodes.length}) — ${v.help}`).join('\n');

for (const p of PAGES) {
  test(`a11y — ${p.name} (${p.path})`, async ({ page }, testInfo) => {
    await page.goto(p.path);
    await page.locator('h1').first().waitFor({ state: 'visible' });
    await page.addStyleTag({ content: SETTLE });
    await page.waitForTimeout(250); // laisse le fondu se terminer / le style s'appliquer
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const critical = violations.filter((v) => v.impact === 'critical');
    const serious = violations.filter((v) => v.impact === 'serious');

    await testInfo.attach('a11y-report', {
      body: fmt(violations) || 'aucune violation',
      contentType: 'text/plain',
    });

    // BLOQUANT : zéro violation critique ET sérieuse (contraste inclus).
    expect(critical, `Violations a11y CRITIQUES sur ${p.path} :\n${fmt(critical)}`).toEqual([]);
    expect(serious, `Violations a11y SÉRIEUSES sur ${p.path} :\n${fmt(serious)}`).toEqual([]);
  });
}
