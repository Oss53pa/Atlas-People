export interface ClientRow {
  id: string;
  name: string;
  pays: string;
  effectif: number;
  status: 'actif' | 'en_attente' | 'suspendu';
  modules: string[];
  lastSync: string;
  contact: string;
  email: string;
  secteur: string;
  ville: string;
  depuis: string;
  conformite: number;
}

export const MOCK_CLIENTS: ClientRow[] = [
  { id: 'c1', name: 'TechCorp Abidjan',       pays: 'CI', effectif: 87,  status: 'actif',      modules: ['RH', 'Paie', 'Formation', 'OKR', 'Recrutement'], lastSync: 'il y a 2 h', contact: 'Kofi Mensah',      email: 'drh@techcorp.ci',             secteur: 'Technologie', ville: 'Abidjan', depuis: 'Janvier 2025',   conformite: 94 },
  { id: 'c2', name: 'OHADA Manufacturing',    pays: 'CI', effectif: 245, status: 'actif',      modules: ['Paie', 'Temps', 'Conformité'],                    lastSync: 'il y a 4 h', contact: 'Fatou Diallo',      email: 'rh@ohada-mfg.ci',             secteur: 'Industrie',   ville: 'Abidjan', depuis: 'Mars 2025',      conformite: 88 },
  { id: 'c3', name: 'PanAfrica Holding SN',   pays: 'SN', effectif: 134, status: 'actif',      modules: ['RH', 'Paie', 'OKR', 'Évaluations'],              lastSync: 'il y a 1 j', contact: 'Ibrahima Diop',     email: 'ibrahima@panafrica.sn',       secteur: 'Finance',     ville: 'Dakar',   depuis: 'Juin 2024',      conformite: 97 },
  { id: 'c4', name: 'Groupe Soleil CM',       pays: 'CM', effectif: 62,  status: 'en_attente', modules: ['Paie'],                                           lastSync: 'en attente', contact: 'Jean-Paul Nkolo',  email: 'jp.nkolo@groupesoleil.cm',    secteur: 'Distribution',ville: 'Douala',  depuis: 'Février 2026',   conformite: 72 },
  { id: 'c5', name: 'Dakar Distribution',     pays: 'SN', effectif: 31,  status: 'actif',      modules: ['RH', 'Paie'],                                     lastSync: 'il y a 6 h', contact: 'Aminata Traoré',    email: 'aminata@dakardist.sn',        secteur: 'Logistique',  ville: 'Dakar',   depuis: 'Septembre 2024', conformite: 91 },
  { id: 'c6', name: 'BTP Lomé Constructions', pays: 'TG', effectif: 110, status: 'suspendu',   modules: ['Paie'],                                           lastSync: 'il y a 5 j', contact: 'Sékou Agbéko',      email: 'rh@btplome.tg',               secteur: 'BTP',         ville: 'Lomé',    depuis: 'Novembre 2024',  conformite: 61 },
];

export const FLAG: Record<string, string> = { CI: '🇨🇮', SN: '🇸🇳', CM: '🇨🇲', TG: '🇹🇬', BJ: '🇧🇯', BF: '🇧🇫' };
