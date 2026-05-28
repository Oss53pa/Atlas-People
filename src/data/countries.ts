import type { Currency } from '../lib/money';

export interface CountryMeta {
  code: string;
  name: string;
  flag: string;
  zone: 'UEMOA' | 'CEMAC';
  currency: Currency;
  socialFund: string;
  /** Un régime de paie est-il configuré pour ce pays ? */
  configured: boolean;
}

// Les 14 régimes (cahier §3). `configured` = module de paie versionné présent.
export const COUNTRIES: CountryMeta[] = [
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', zone: 'UEMOA', currency: 'XOF', socialFund: 'CNPS', configured: true },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', zone: 'UEMOA', currency: 'XOF', socialFund: 'IPRES + CSS', configured: true },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', zone: 'UEMOA', currency: 'XOF', socialFund: 'INPS', configured: false },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', zone: 'UEMOA', currency: 'XOF', socialFund: 'CNSS', configured: false },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', zone: 'UEMOA', currency: 'XOF', socialFund: 'CNSS', configured: false },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', zone: 'UEMOA', currency: 'XOF', socialFund: 'CNSS', configured: false },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', zone: 'UEMOA', currency: 'XOF', socialFund: 'CNSS', configured: false },
  { code: 'GW', name: 'Guinée-Bissau', flag: '🇬🇼', zone: 'UEMOA', currency: 'XOF', socialFund: 'INPS', configured: false },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', zone: 'CEMAC', currency: 'XAF', socialFund: 'CNPS', configured: false },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', zone: 'CEMAC', currency: 'XAF', socialFund: 'CNSS + CNAMGS', configured: false },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', zone: 'CEMAC', currency: 'XAF', socialFund: 'CNSS', configured: false },
  { code: 'TD', name: 'Tchad', flag: '🇹🇩', zone: 'CEMAC', currency: 'XAF', socialFund: 'CNPS', configured: false },
  { code: 'CF', name: 'RCA', flag: '🇨🇫', zone: 'CEMAC', currency: 'XAF', socialFund: 'CNSS', configured: false },
  { code: 'GQ', name: 'Guinée Équatoriale', flag: '🇬🇶', zone: 'CEMAC', currency: 'XAF', socialFund: 'INSESO', configured: false },
];

export function countryByCode(code: string): CountryMeta {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/** Devise du pays (UEMOA → XOF, CEMAC → XAF). Source unique pour tout l'affichage. */
export function currencyOf(code: string): Currency {
  return countryByCode(code).currency;
}

/**
 * Devise du tenant (siège). Atlas Studio est immatriculé en Côte d'Ivoire (UEMOA),
 * donc les agrégats inter-pays s'affichent par défaut dans cette devise. Une vraie
 * consolidation multi-zone (XOF + XAF) regrouperait par devise — hors périmètre démo.
 */
export const TENANT_CURRENCY: Currency = currencyOf('CI');
