import { describe, it, expect } from 'vitest';
import { validateSubscription, subscriptionMailto } from '../subscriptions';
import type { SubscriptionInput } from '../subscriptions';

const valide: SubscriptionInput = {
  produit: 'payroll',
  nom: 'Aïcha Diop',
  email: 'aicha@entreprise.ci',
  entreprise: 'Atlas Démo SARL',
  effectif: '50 à 200',
  pays: 'Côte d\'Ivoire',
  message: 'Trois clients à reprendre en janvier.',
};

describe('validateSubscription', () => {
  it('accepte une demande complète', () => {
    expect(validateSubscription(valide)).toBeNull();
  });

  it('accepte une demande minimale (effectif, pays et message facultatifs)', () => {
    const { produit, nom, email, entreprise } = valide;
    expect(validateSubscription({ produit, nom, email, entreprise })).toBeNull();
  });

  it('refuse un produit manquant', () => {
    expect(validateSubscription({ ...valide, produit: '  ' })).toMatch(/produit/i);
  });

  it('refuse un nom trop court', () => {
    expect(validateSubscription({ ...valide, nom: 'A' })).toMatch(/nom/i);
  });

  it.each([
    'pas-un-email',
    'aicha@',
    '@entreprise.ci',
    'aicha@entreprise',
    'aicha diop@entreprise.ci',
  ])('refuse l\'email invalide « %s »', (email) => {
    expect(validateSubscription({ ...valide, email })).toMatch(/email/i);
  });

  it('refuse une entreprise manquante', () => {
    expect(validateSubscription({ ...valide, entreprise: '' })).toMatch(/entreprise/i);
  });

  it('refuse un message au-delà de 4 000 caractères', () => {
    expect(validateSubscription({ ...valide, message: 'x'.repeat(4001) })).toMatch(/trop long/i);
  });

  it('tolère les espaces autour des champs', () => {
    expect(validateSubscription({
      ...valide, nom: '  Aïcha Diop  ', email: '  aicha@entreprise.ci  ', entreprise: '  Atlas  ',
    })).toBeNull();
  });
});

describe('subscriptionMailto', () => {
  it('pré-remplit le produit, l\'objet et les champs saisis', () => {
    const url = subscriptionMailto(valide, 'Atlas Payroll', 'hello@atlas-studio.org');
    expect(url.startsWith('mailto:hello@atlas-studio.org?')).toBe(true);
    expect(decodeURIComponent(url)).toContain('subject=Souscription Atlas Payroll');
    expect(decodeURIComponent(url)).toContain('Aïcha Diop');
    expect(decodeURIComponent(url)).toContain('Atlas Démo SARL');
  });

  it('remplace les champs vides par un tiret plutôt que de les omettre', () => {
    const url = decodeURIComponent(
      subscriptionMailto({ produit: 'core', nom: '', email: '', entreprise: '' }, 'Atlas People Core', 'hello@atlas-studio.org'),
    );
    expect(url).toContain('Effectif        : —');
    expect(url).toContain('Pays OHADA      : —');
  });
});
