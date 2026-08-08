# Volume 1 : déclinaison `entreprise` (Atlas People Core)
## Espace Tiers et Filiales

**Mandat** `tiers` · **Formule** `entreprise` · **Socle** volume 0, appliqué intégralement

---

## 1. Position du problème

Une entreprise qui gère sa propre paie n'a pas de clients. La question posée est donc la suivante : à quoi sert le portail dans cette déclinaison, et faut il le désactiver ?

**Arbitrage.** Il ne faut pas le désactiver. Une entreprise ouvre en permanence son dossier social à des tiers : commissaire aux comptes, expert comptable externe, avocat en droit social, auditeur d'un donneur d'ordre, direction d'une filiale, acquéreur en phase de diligence. Aujourd'hui cela se fait par clé USB, par courriel, ou par un accès temporaire au logiciel, ce qui est la pire des options. Le socle du portail répond exactement à ce besoin, avec une différence de fond : **l'accès est borné par une mission datée**, pas par un abonnement.

Le portail de la déclinaison `entreprise` s'appelle donc **Espace Tiers**, et non espace client.

---

## 2. Publics et profils de mission

| Profil de mission | Rôle socle | Durée type | Rubriques ouvertes |
|---|---|---|---|
| Commissaire aux comptes | `lecteur` renforcé | Exercice, renouvelable | Registre, Journal de paie, Déclarations, Documents |
| Expert comptable externe | `finance` | Mandat annuel | Journal de paie, Déclarations, Documents |
| Avocat en droit social | `lecteur` | Dossier, 6 mois | Documents du dossier uniquement, adressés nominativement |
| Auditeur social d'un donneur d'ordre | `lecteur` | 30 jours | Attestations de vigilance, effectif déclaré, conformité |
| Direction de filiale | `rh` ou `dirigeant` | Permanent | Registre, Effectifs, Absences, Indicateurs, sur son entité |
| Diligence d'acquisition | `lecteur` | 60 jours, salle fermée à date | Liasse sociale constituée, sans nominatif |

**EX-V1-001** Toute mission porte une date de début et une date de fin obligatoires. À l'échéance, l'accès expire seul, sans intervention. Prolongation possible, jamais tacite.
**EX-V1-002** L'objet de la mission est saisi en clair et affiché au tiers à chaque connexion. Il figure dans le journal et dans le filigrane des pièces.

---

## 3. Rubriques

### 3.1 Registre du personnel (`workforce`)
Le registre est une obligation légale de l'employeur et la première pièce demandée en contrôle.

| Champ exposé | Niveau `agrégé` | Niveau `nominatif` |
|---|---|---|
| Effectif à la date | oui | oui |
| Répartition par contrat, sexe, tranche d'âge, ancienneté | oui | oui |
| Nom, prénom, matricule | non | oui |
| Emploi occupé, qualification | agrégé par emploi | oui |
| Dates d'entrée et de sortie | non | oui |
| Nature du contrat, date de fin de CDD | agrégé | oui |
| Nationalité et titre de séjour | non | oui, uniquement profil contrôle et commissaire |
| Adresse personnelle, situation familiale, coordonnées | **jamais** | **jamais** |

**EX-V1-003** Export du registre au format légal du pays du client (PDF paginé et signé électroniquement par l'entreprise), et au format tableur pour les profils `finance`.

### 3.2 Journal de paie (`payroll`)
Jamais de bulletin individuel dans cette rubrique, sauf profil commissaire aux comptes avec octroi `nominatif` et échantillon nommé.

- Journal de paie par période, par rubrique, avec les cumuls.
- Écritures de paie prêtes à intégrer (schéma SYSCOHADA, comptes 66, 42, 43, 44), export au format d'import de la comptabilité.
- État récapitulatif des charges par organisme, avec base, taux, montant.
- Rapprochement entre le journal, la déclaration déposée et le paiement effectué, sur trois colonnes. C'est le contrôle que fait tout auditeur, il doit être servi directement.
- Échantillonnage : le commissaire sélectionne n bulletins, la demande est tracée, le cabinet ou la DRH publie les pièces, l'accès est limité à l'échantillon.

### 3.3 Déclarations et attestations (`compliance`)
- Échéancier de l'exercice, par organisme et par pays, avec l'état de chaque échéance : à préparer, préparée, déposée, payée, quittancée.
- Pièces jointes : accusé de dépôt, quittance, attestation de régularité.
- Attestation de vigilance et attestation de non redevance, avec date de validité et alerte d'expiration.
- Historique des redressements et des régularisations, avec leur suite.

### 3.4 Documents (`documents`)
Salle des pièces, organisée par dossier de mission, avec liste des pièces demandées et pièces fournies. C'est la mécanique de la diligence : le tiers voit ce qui manque.

**EX-V1-004** Chaque dossier de mission dispose d'une liste de demandes (`portal_requests` de type `document_request`) alimentée par le tiers, traitée par l'entreprise, avec statut et échéance. Un indicateur d'avancement en pourcentage figure en tête de dossier.

### 3.5 Ma mission (`contract`)
Objet, périmètre autorisé, entités couvertes, dates, nom du référent interne, engagement de confidentialité accepté à la première connexion et horodaté.

---

## 4. Ce qui n'est jamais exposé dans ce volume

1. Toute pièce médicale ou motif d'arrêt.
2. Le dossier disciplinaire, les procédures en cours, les échanges avec les représentants du personnel.
3. Les rémunérations individuelles des mandataires sociaux hors mandat exprès du dirigeant.
4. Les projets non arrêtés : budget de masse salariale prévisionnel, plan de réorganisation, listes de départs envisagés.
5. Les coordonnées personnelles des salariés, sans exception.

**EX-V1-005** Une liste noire technique bloque ces objets au niveau de la vue `portal_v_documents`, indépendamment des droits accordés. Une pièce classée sensible ne peut pas être publiée dans le portail, même par erreur d'un administrateur.

---

## 5. Spécificités de sécurité

**EX-V1-006** Second facteur **obligatoire** pour tous les profils de ce volume, sans exception, y compris `lecteur`.
**EX-V1-007** Filigrane renforcé : nom du tiers, cabinet d'appartenance, référence de mission, date et heure, sur toutes les pages de toutes les pièces.
**EX-V1-008** Journal de mission exportable en fin de mission : liste horodatée de tout ce qui a été consulté et téléchargé, remise au référent interne. C'est la contrepartie de l'ouverture.
**EX-V1-009** Interdiction du copier coller de masse et blocage de l'impression pour les profils `diligence`, par affichage des pièces sensibles dans une visionneuse sans téléchargement (`view_only`).

---

## 6. Recette

| Réf | Scénario | Attendu |
|---|---|---|
| T-01-01 | Mission arrivée à échéance | Accès refusé, message d'expiration, aucune donnée servie |
| T-01-02 | Tiers demandant une pièce hors périmètre d'entité | Objet invisible, demande impossible |
| T-01-03 | Publication d'une pièce classée sensible | Refus au niveau de la vue, alerte à l'administrateur |
| T-01-04 | Agrégat sur une filiale de 4 salariés | Masqué, mention d'effectif insuffisant |
| T-01-05 | Profil diligence tentant un téléchargement | Visionneuse seule, aucun fichier récupérable |
| T-01-06 | Clôture de mission | Journal de mission généré et remis, accès purgé |
