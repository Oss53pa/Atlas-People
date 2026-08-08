# Volume 3 : déclinaison `cabinet_paie` (Atlas Payroll)
## Portail du client dont le cabinet ne traite que la paie

**Mandat** `paie` · **Socle** volume 0, appliqué intégralement
**Qualification** le client est l'employeur. Le cabinet est un prestataire de production de paie, il n'est ni conseil RH ni gestionnaire administratif. Le portail doit refléter cette frontière, y compris pour protéger le cabinet de responsabilités qu'il n'a pas vendues.

---

## 1. Correction du build actuel

Le build du 8 août 2026 affiche deux rubriques : bulletins et déclarations, puis mes factures. C'est insuffisant pour un motif simple.

> Un client qui reçoit une facture de paie calculée sur un effectif payé, sans pouvoir consulter la liste de cet effectif, ne peut ni vérifier ni contester. Le portail lui demande de faire confiance, ce qui est exactement ce qu'il cherchait à éviter en s'équipant.

**Arbitrage.** Le mandat `paie` n'ouvre pas de rubrique Effectifs autonome, ce serait laisser croire que le cabinet gère l'administration du personnel. Il ouvre en revanche, **à l'intérieur de la rubrique paie**, une sous vue « Salariés payés sur la période », strictement limitée à ce qui a servi au calcul.

Rubriques du mandat `paie` : Bulletins et déclarations, Éléments variables, Mon mandat de paie, Mes factures, Documents, Mes demandes. Soit six, contre deux aujourd'hui.

---

## 2. Écran d'accueil, le cycle de paie

Le client d'un bureau de paie n'a qu'une question chaque mois : où en est ma paie. L'accueil y répond avant tout.

Frise en six jalons, chacun avec date prévue, date réelle, et responsable (client ou cabinet) :

| Jalon | Responsable | Effet du retard |
|---|---|---|
| Ouverture de la collecte des variables | cabinet | néant |
| Dépôt des variables par le client | client | décalage automatique des jalons suivants, affiché |
| Préparation de la paie | cabinet | signalé, motif publiable |
| Mise à disposition du contrôle | cabinet | signalé |
| Bon à payer du client (acte A2) | client | règle de silence, défaut à J+2 |
| Clôture, bulletins et déclarations | cabinet | signalé |

**EX-V3-001** Le décalage des jalons provoqué par un retard du client est calculé et affiché immédiatement, avec la mention de l'engagement de délai du mandat qui devient inapplicable. C'est la protection contractuelle du cabinet, elle doit être visible et horodatée, pas rappelée par courriel après coup.

---

## 3. Rubrique Éléments variables (`time`)

Reprend les exigences EX-V2-004 à EX-V2-007 du volume 2, avec deux différences.

**EX-V3-002** Le périmètre des variables acceptées est celui du mandat, et lui seul : le client ne dépose que les rubriques que le cabinet a déclarées collectables. Une rubrique non prévue au mandat n'est pas saisissable, elle passe par une demande.
**EX-V3-003** Modèle de collecte téléchargeable, pré rempli avec la liste des salariés actifs de la période précédente et les rubriques du mandat. Import en retour, avec contrôle et rapport d'erreurs. C'est le mode d'usage majoritaire, il doit être aussi soigné que la saisie en ligne.
**EX-V3-004** Mouvements du mois déclarés dans le même dépôt : entrées, sorties, changements de rémunération, changements de temps de travail. Le cabinet ne devine pas ces mouvements, il les reçoit ici, et la trace de leur communication protège les deux parties.

---

## 4. Rubrique Bulletins et déclarations (`payroll`)

### 4.1 Salariés payés sur la période
Colonnes : matricule, nom, statut sur la période (payé, entré, sorti, suspendu), base de rémunération retenue, net à payer, coût employeur. Le nominatif salarial est ici la règle et non l'exception, puisque le client est l'employeur et que ces montants sont les siens. Le rôle `finance` peut être borné à l'agrégé si le client le souhaite.

**EX-V3-005** Cette vue est la **base de facturation opposable** : le nombre de lignes payées y est celui qui figurera sur la facture, et les deux écrans affichent la même valeur avec le même horodatage de référence.

### 4.2 Bulletins
Consultation, téléchargement unitaire, archive groupée, historique 24 mois. Filtre par site, service, salarié. Recherche par matricule.
**EX-V3-006** Chaque bulletin publié porte sa version. Un bulletin rectificatif ne remplace pas le précédent, il est publié en version n+1 avec motif, l'original reste consultable et marqué remplacé.

### 4.3 Journaux et états
Journal de paie, livre de paie, état récapitulatif des charges par organisme, état des congés payés et provisions, écritures comptables SYSCOHADA exportables.

### 4.4 Déclarations sociales et fiscales
Par organisme et par période : état (préparée, déposée, payée, quittancée), montant, date de dépôt, accusé, quittance. Le client voit ce qui a été déposé en son nom, avec la pièce à l'appui. C'est l'essentiel de la valeur perçue du mandat.

**EX-V3-007** Toute déclaration déposée est publiée avec son accusé dans les 48 heures du dépôt. Le manquement est visible dans la frise du cycle.

### 4.5 Paiement
Ordre de virement des salaires, fichier bancaire au format du pays, et distinctement l'échéancier des charges à régler avec les références de paiement.

### 4.6 Bon à payer (acte A2)
Identique au volume 2, section 5.5. Dans ce mandat, il constitue la **seule preuve** que le client a validé les montants, puisque le cabinet n'a aucun mandat de gestion lui permettant de trancher seul. Il est donc obligatoire, non désactivable.

---

## 5. Rubrique Mon mandat de paie (`contract`)

Prestations incluses, et surtout prestations **exclues**, listées nommément : gestion administrative, rédaction de contrats, conseil en droit social, représentation en contrôle, gestion des contentieux, suivi des visites médicales. La formulation retenue est simple et frontale, elle évite le litige le plus fréquent de ce métier.

Grille tarifaire, calendrier de production, engagements de délai et leurs conditions, référent, procédure de réversibilité.

---

## 6. Rubrique Mes factures (`invoices`)

Identique au volume 2, section 8, avec une précision.

**EX-V3-008** Le rapprochement affiché est celui de la section 4.1 : nombre de bulletins produits sur la période, comparé au nombre facturé, écart affiché avec sa cause (entrée en cours de mois, sortie, bulletin rectificatif non refacturé, salarié suspendu). Aucun écart ne reste sans explication publiée.

---

## 7. Rubrique Mes demandes (`requests`)

Types autorisés, bornés au mandat : bulletin de remplacement, attestation de salaire, rectification de paie avec motif, question sur un calcul, demande d'ajout d'une rubrique de paie, demande de prestation hors mandat (devis).

**EX-V3-009** Une demande sortant du périmètre du mandat n'est pas refusée en silence : elle bascule en demande de devis, avec réponse chiffrée publiée. C'est un canal commercial pour le cabinet, pas un rejet.

---

## 8. Ce qui n'est jamais exposé dans ce volume

1. Toute donnée RH non nécessaire au calcul de la paie (évaluations, entretiens, dossier disciplinaire, candidatures).
2. Les paramétrages de paie du cabinet, ses tables de taux, ses règles internes.
3. Les paies en préparation avant mise à disposition du contrôle.
4. Les pièces médicales, y compris les arrêts, dont seule la durée est reprise.

---

## 9. Recette

| Réf | Scénario | Attendu |
|---|---|---|
| T-03-01 | Client sans dépôt de variables à la date limite | Jalons décalés et affichés, engagement de délai marqué inapplicable, notification |
| T-03-02 | Import de fichier de variables avec rubrique hors mandat | Ligne rejetée, orientation vers une demande |
| T-03-03 | Bulletin rectificatif | Version 2 publiée, version 1 consultable et marquée remplacée, notification |
| T-03-04 | Déclaration déposée sans accusé publié sous 48 heures | Alerte interne au cabinet, jalon en anomalie visible du client |
| T-03-05 | Comparaison bulletins produits et lignes facturées | Écart affiché avec sa cause, ou mention d'égalité |
| T-03-06 | Absence de décision sur le bon à payer | Défaut d'acceptation à J+2, alerte à J-1, journalisation en défaut et non en validation |
| T-03-07 | Rôle `finance` borné à l'agrégé | Aucun net individuel visible |
| T-03-08 | Demande hors mandat | Bascule en devis, réponse chiffrée publiée |
