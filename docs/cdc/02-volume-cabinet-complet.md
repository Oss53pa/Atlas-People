# Volume 2 : déclinaison `cabinet_complet` (Atlas People Conseil)
## Portail du client dont le cabinet gère la RH et la paie de bout en bout

**Mandat** `conseil` · **Socle** volume 0, appliqué intégralement
**Qualification** le client **est l'employeur juridique**. Le cabinet agit en son nom et pour son compte. Le client porte la responsabilité finale, il doit donc pouvoir tout vérifier.

---

## 1. Doctrine propre au volume

Puisque le client est l'employeur, la question n'est pas « a t il le droit de voir », mais « qui, chez lui, a le droit de voir ». Le filtre décisif est le **rôle du contact**, pas le niveau d'octroi.

| Rôle | Effectifs | Temps | Paie agrégée | Paie nominative | Conformité | Factures | Indicateurs |
|---|---|---|---|---|---|---|---|
| `dirigeant` | complet | complet | oui | oui | oui | oui | oui |
| `rh` | complet | complet | oui | sur octroi | oui | non | oui |
| `finance` | agrégé | agrégé | oui | non | oui | oui | oui |
| `site` | son site, sans salaire | son site | non | non | non | non | son site |
| `lecteur` | non | non | non | non | non | non | non |

**EX-V2-001** Le niveau `nominatif` sur `payroll` est un octroi séparé, avec motif, révision annuelle obligatoire et rappel au cabinet à l'échéance.

---

## 2. Écran d'accueil

Trois blocs, dans cet ordre, jamais d'autre ordre.

1. **Ce qui attend votre décision.** Bon à payer de la paie en attente, facture contestable dans les délais, variables du mois à confirmer, pièce à signer. Chaque ligne porte son échéance et le conséquence du silence.
2. **Cycle du mois.** Une frise en cinq jalons : collecte des variables, préparation, contrôle, bon à payer, clôture et mise à disposition. Chaque jalon porte sa date prévue et sa date réelle. C'est l'écran qui supprime le plus d'appels au cabinet.
3. **Dernières publications.** Cinq dernières pièces publiées, avec accusé de prise de connaissance en un geste.

**EX-V2-002** Le cycle du mois est alimenté par le calendrier de production du cabinet, pas saisi à la main. Un jalon en retard est marqué, avec le motif si le cabinet en a publié un.

---

## 3. Rubrique Effectifs (`workforce`)

### 3.1 Liste
Colonnes : matricule, nom, poste, service, site, nature du contrat, date d'entrée, date de fin prévue, statut (actif, en préavis, suspendu, sorti).
Filtres : site, service, nature de contrat, statut, période. Recherche plein texte sur nom et matricule.
Export tableur pour `dirigeant`, `rh` et `finance`.

### 3.2 Fiche salarié
| Bloc | Contenu | Rôles |
|---|---|---|
| Identité de service | Nom, matricule, photo si fournie, poste, service, site, responsable | tous sauf `lecteur` |
| Contrat | Nature, date de début, date de fin, période d'essai, temps de travail, classification, avenants publiés | `dirigeant`, `rh`, `finance` (agrégé) |
| Rémunération | Salaire de base, primes contractuelles, avantages en nature, coût employeur mensuel | `dirigeant`, `rh` avec octroi nominatif |
| Absences | Solde de congés, absences de l'année par type, sans motif médical | `dirigeant`, `rh`, `site` (son site) |
| Documents | Contrat, avenants, attestations, certificats publiés | `dirigeant`, `rh` |
| Historique | Mouvements de carrière publiés (mutation, promotion, changement de site) | `dirigeant`, `rh` |

Jamais exposé, quel que soit le rôle : adresse personnelle, téléphone personnel, situation familiale détaillée, pièce médicale, procédure disciplinaire non close, éléments de dossier de contentieux.

### 3.3 Mouvements de la période
Entrées, sorties (avec motif de sortie normalisé), changements de poste, changements de site. Cette vue est ce que le client compare à sa facture, elle doit être exactement alignée sur la base de facturation retenue.

### 3.4 Alertes de gestion
Fin de période d'essai à 15 jours, fin de CDD à 30 jours, visite médicale échue, titre de séjour expirant, ancienneté ouvrant un droit (prime, congé supplémentaire).
**EX-V2-003** Chaque alerte porte une action possible : demander au cabinet de préparer l'acte correspondant. La demande bascule dans `portal_requests` avec le contexte pré rempli.

---

## 4. Rubrique Temps et absences (`time`)

### 4.1 Consultation
Calendrier mensuel par service ou par site, absences par type (congés payés, maladie, maternité, accident du travail, absence non justifiée, congé sans solde, récupération), compteurs de congés par salarié, heures supplémentaires par salarié et par tranche.

### 4.2 Dépôt des variables du mois
C'est la seule saisie autorisée en dehors des trois actes engageants, et elle est bornée.

**EX-V2-004** Fenêtre de collecte ouverte du jour J1 au jour J2 du mois, paramétrée par mandat. En dehors, la saisie est fermée, avec la date de réouverture affichée.
**EX-V2-005** Modes de dépôt : saisie en ligne dans une grille (salarié en ligne, rubrique variable en colonne), ou dépôt d'un fichier au modèle du cabinet, avec contrôle de format et rapport d'erreurs ligne à ligne avant acceptation.
**EX-V2-006** Un dépôt accepté est figé et versionné. Une correction produit une version n+1, le cabinet est notifié, l'écart entre versions est affiché.
**EX-V2-007** Contrôles bloquants au dépôt : salarié sorti, valeur hors bornes paramétrées, doublon de ligne, période close. Contrôles alertants : variation supérieure à 30 pour cent par rapport au mois précédent, heures supplémentaires au delà du plafond légal du pays.

---

## 5. Rubrique Paie (`payroll`)

### 5.1 Synthèse de la période
Masse salariale brute, charges patronales, coût total employeur, net à payer, effectif payé. Comparaison au mois précédent et au même mois de l'année précédente, en valeur et en pourcentage. Ventilation par site, par service, par nature de contrat.

### 5.2 Détail par rubrique
Tableau des rubriques de paie avec base, taux et montant, cumulés sur la période. C'est ce qui permet au client de comprendre une variation sans appeler.

### 5.3 Bulletins (niveau `nominatif` uniquement)
Liste des bulletins de la période, consultation et téléchargement unitaire, téléchargement groupé en archive. Historique 24 mois glissants, au delà consultation sur demande.

### 5.4 Journal et écritures
Journal de paie, livre de paie, écritures comptables SYSCOHADA prêtes à intégrer, avec export au format d'import d'Atlas FNA et au format tableur.

### 5.5 Bon à payer (acte A2)
Écran dédié : effectif payé, montant net total, montant des charges, écarts par rapport au mois précédent supérieurs à un seuil, liste des salariés entrés et sortis. Deux boutons, valider ou contester avec motif. La reconfirmation du mot de passe est exigée.
**EX-V2-008** Le bon à payer est horodaté, chaîné, et il fige la version de paie sur laquelle il porte. Une modification postérieure du cabinet invalide le bon à payer et en exige un nouveau.

### 5.6 Ordre de virement
Récapitulatif des virements par banque, montant total, date d'exécution demandée, fichier de virement au format bancaire du pays, téléchargeable par `dirigeant` et `finance` seulement.

### 5.7 Jamais exposé
Les paramétrages internes du cabinet, les calculs intermédiaires non publiés, les paies en cours de préparation, les dossiers des autres clients, les remarques internes de l'équipe de production.

---

## 6. Rubrique Conformité (`compliance`)

Écran unique, en trois strates.

1. **Échéancier.** Toutes les obligations de la période et du trimestre, par organisme, avec date limite, montant estimé puis montant déposé, et l'état : à préparer, préparée, déposée, payée, quittancée.
2. **Pièces.** Accusés de dépôt, quittances, bordereaux, attestations de régularité, attestation de vigilance en cours de validité avec alerte 30 jours avant expiration.
3. **Risques.** Points d'attention relevés par le cabinet sur le dossier du client (contrat non signé, salarié sans déclaration d'embauche, seuil d'effectif franchi ouvrant une obligation nouvelle, convention collective à appliquer), avec la recommandation du cabinet et l'état de traitement.

**EX-V2-009** La strate Risques est ce qui matérialise la valeur du conseil. Elle est obligatoire dans ce mandat, elle ne peut pas être désactivée par le cabinet.
**EX-V2-010** Veille réglementaire filtrée sur le pays et le secteur du client, chaque note portant sa date d'effet et son impact estimé sur le dossier. Cohérente avec l'exigence ComplianceGuard multi pays OHADA.

---

## 7. Rubrique Santé et sécurité (`safety`)

Accidents du travail déclarés, arrêts consécutifs en nombre de jours sans motif médical, taux de fréquence et de gravité, visites médicales à jour ou échues, formations obligatoires suivies et échues, équipements remis. Périmètre par site pour le rôle `site`.

---

## 8. Rubrique Mes factures (`invoices`)

Reprise de l'existant, complétée.

- Liste par période, avec état : émise, échue, réglée partiellement, réglée, contestée. Les brouillons restent invisibles.
- Détail ligne à ligne : base retenue, prix unitaire du mandat, quantité, montant, taxes, total. Le total vient de la base, jamais de l'affichage.
- Rapprochement automatique entre la base facturée et la donnée de gestion correspondante, par exemple 87 collaborateurs facturés et 87 collaborateurs présents au registre à la date de référence. Tout écart est affiché avec son explication.
- Relevé de compte : factures, règlements, solde, ancienneté du solde.
- Contestation (acte A3) : ligne par ligne, motif obligatoire, suspension de la relance sur la ligne contestée, réponse du cabinet publiée dans le fil.
- Téléchargement au format PDF et export du relevé au format tableur.

**EX-V2-011** L'écart entre base facturée et base de gestion est calculé par la base et affiché systématiquement, y compris quand il est nul. C'est ce qui rend la facture incontestable.

---

## 9. Rubrique Mon mandat (`contract`)

Objet du mandat, prestations couvertes et prestations exclues (listées explicitement, c'est là que naissent les litiges), grille tarifaire en vigueur, calendrier de production convenu, engagements de délai, référent du cabinet avec sa suppléance, date de reconduction, préavis de résiliation, procédure de réversibilité.

---

## 10. Rubrique Mes demandes (`requests`)

| Type | Champs | Délai cible par défaut |
|---|---|---|
| Attestation de travail ou de salaire | salarié, objet, destinataire | 2 jours ouvrés |
| Préparation d'embauche | poste, date, type de contrat, rémunération, site | 3 jours ouvrés |
| Préparation de sortie | salarié, motif, date, préavis | 3 jours ouvrés |
| Avenant | salarié, nature de la modification, date d'effet | 5 jours ouvrés |
| Question sociale | objet libre, pièce jointe | 5 jours ouvrés |
| Réclamation | objet, référence, pièce | 2 jours ouvrés |

**EX-V2-012** Chaque demande porte un délai cible issu du mandat, un compte à rebours visible, un responsable côté cabinet, et se solde par une publication (la pièce produite) ou une réponse écrite. Le taux de respect des délais alimente la rubrique Indicateurs.

---

## 11. Rubrique Indicateurs (`insights`)

Douze mois glissants : effectif moyen, entrées, sorties, taux de rotation, taux d'absentéisme par motif, part des heures supplémentaires, masse salariale par tête, coût moyen chargé, pyramide des âges et des anciennetés, respect des délais du cabinet.

**EX-V2-013** Aucun indicateur ne descend en dessous du seuil de 5 personnes par croisement (règle EX-P-031).
**EX-V2-014** Chaque indicateur porte sa définition en clair et sa période de calcul. Aucun indicateur sans formule affichable.

---

## 12. Recette

| Réf | Scénario | Attendu |
|---|---|---|
| T-02-01 | Contact `site` ouvre la fiche d'un salarié de son site | Identité de service et absences visibles, aucun élément de rémunération |
| T-02-02 | Contact `rh` sans octroi nominatif ouvre la paie | Agrégats et journal visibles, aucun bulletin, aucune ligne nominative |
| T-02-03 | Dépôt de variables hors fenêtre | Saisie fermée, date de réouverture affichée |
| T-02-04 | Dépôt d'un fichier avec 3 lignes en erreur | Rejet des 3 lignes, rapport détaillé, dépôt partiel refusé |
| T-02-05 | Bon à payer validé, puis paie modifiée par le cabinet | Bon à payer invalidé, nouvelle demande émise, notification |
| T-02-06 | Facture dont la base diverge du registre | Écart affiché avec son explication avant tout envoi |
| T-02-07 | Contestation d'une ligne de facture | Relance suspendue sur cette ligne seulement, fil ouvert |
| T-02-08 | Salarié sorti le mois précédent | Absent de la liste active, présent dans les mouvements, exclu de la base facturée du mois suivant |
| T-02-09 | Alerte de fin de CDD à 30 jours | Alerte affichée, demande de préparation d'acte en un geste |
| T-02-10 | Croisement d'indicateur portant sur 4 personnes | Masqué |
