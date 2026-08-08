# Volume 5 : déclinaison `cabinet_agence` (Atlas People Placement)
## Portail du client utilisateur de travailleurs mis à disposition

**Mandat** `mad` · **Socle** volume 0, appliqué intégralement

---

## 1. Qualification juridique, elle commande tout le volume

**Qualification** l'agence est **l'employeur juridique**. Le client est l'**entreprise utilisatrice** : il accueille, il dirige le travail sur son site, il ne paie pas de salaire et n'a aucun droit d'accès au dossier salarial. C'est la déclinaison où la doctrine d'exposition est la plus restrictive, et où elle protège trois intérêts à la fois : le travailleur, l'agence, et le client lui même.

---

## 2. La ligne rouge, tenue par la base et pas seulement par l'écran

Le client ne voit **jamais** :

1. Un bulletin de paie, un net, un brut, une prime, une retenue, un acompte.
2. Le solde de congés, l'ancienneté dans l'agence, l'historique des missions chez d'autres clients.
3. Les coordonnées personnelles du travailleur, sa situation familiale, ses charges de famille.
4. La moindre pièce médicale. L'aptitude est exposée en trois états seulement : apte, apte avec réserves (réserves libellées en termes de poste, jamais de santé), inapte.
5. Le dossier disciplinaire tenu par l'agence.
6. Le coût réel du travailleur pour l'agence.

**EX-V5-001** L'interdiction est portée par les vues `portal_v_*` du mandat `mad`, qui ne comportent aucune colonne de rémunération. Aucun octroi, aucun rôle, aucune configuration cabinet ne peut lever cette restriction. Le contrôle est structurel, pas paramétrable.

**EX-V5-002** Protection de la marge de l'agence (règle R8 du socle) : le taux horaire facturé est visible, le salaire versé ne l'est pas, et aucun agrégat exposé ne doit permettre de le déduire. En particulier, aucun affichage de coût employeur, de charge sociale ou de coefficient de facturation décomposé.

---

## 3. Rubriques

Huit rubriques, dans cet ordre d'affichage : Travailleurs placés, Pointages et heures, Sécurité sur mes sites, Conformité de l'agence, Mon contrat de mise à disposition, Mes factures et relevés, Documents, Mes demandes de personnel. La rubrique Indicateurs de mission (§11) est optionnelle et fermée par défaut.

---

## 4. Travailleurs placés (`workforce`)

### 4.1 Ce qui est exposé
| Champ | Justification |
|---|---|
| Nom, prénom | Le client dirige le travail, il doit identifier la personne |
| Photo et numéro de badge | Contrôle d'accès sur site |
| Fonction occupée et qualification | Objet même de la commande |
| Site et service d'affectation, horaire de référence | Organisation du travail |
| Période de mise à disposition, date de début, date de fin prévue | Suivi de la commande |
| Motif de recours | Le client est co responsable de la licéité du recours |
| Statut du jour : présent, absent, remplacé, mission terminée | Pilotage quotidien |
| Aptitude au poste : apte, apte avec réserves, inapte | Obligation de sécurité du client |
| Formations et habilitations liées au poste, avec date d'expiration | Obligation de sécurité du client |
| Équipements de protection remis, par qui | Répartition des obligations |

### 4.2 Ce que le client peut faire
Rien qui touche au contrat de travail. Il peut : demander un remplacement, signaler une fin de mission anticipée, signaler un incident, demander une prolongation. Toutes ces actions passent par la rubrique Demandes et sont adressées à l'agence, jamais au travailleur.

**EX-V5-003** Aucune messagerie directe entre le contact client et le travailleur placé n'existe dans le portail. Toute instruction écrite passant par l'outil serait une pièce de requalification. La règle est explicitée dans les conditions du portail.

---

## 5. Pointages et heures (`time`)

C'est l'écran central de ce volume : il porte la base de facturation et l'acte engageant A1.

### 5.1 Relevé
Vue par semaine et par travailleur : heures normales, heures supplémentaires par tranche, heures de nuit, dimanche, jour férié, absences, retards, panier et transport si prévus au contrat. Totaux par jour, par travailleur, par site, par période de facturation.

Origine des pointages : badge, application mobile du superviseur, saisie de l'agence, ou déclaration du client. L'origine est affichée ligne par ligne, car elle détermine qui répond d'un écart.

### 5.2 Validation du relevé (acte A1)
**EX-V5-004** À la clôture de la période, le relevé est publié pour validation. Le contact `site` valide son périmètre, le contact `dirigeant` ou `finance` valide l'ensemble. Une validation partielle est possible et suivie.
**EX-V5-005** Contestation ligne à ligne, avec motif et valeur proposée. La ligne contestée est exclue de la facturation jusqu'à résolution, le reste part normalement.
**EX-V5-006** Règle de silence paramétrable, défaut 3 jours ouvrés, avec alerte à J-1. Le défaut est journalisé comme défaut et jamais présenté comme une validation.
**EX-V5-007** Le relevé validé est figé, empreint et chaîné. Il devient la seule pièce opposable en cas de litige de facturation. Toute modification ultérieure exige une nouvelle validation portant sur le différentiel seul.

### 5.3 Planning
Prévisionnel de présence par site et par poste, sur quatre semaines glissantes, alimenté par la commande. Écarts entre prévu et réalisé, avec taux de couverture des postes commandés. C'est l'indicateur de qualité de service de l'agence, il doit être visible même quand il est mauvais.

---

## 6. Sécurité sur mes sites (`safety`)

Le client porte l'obligation de sécurité sur son site pour les personnes qu'il accueille. Il doit donc disposer, sans négociation, de :

- La liste des accidents et incidents survenus sur son site, avec date, poste, nature, suite donnée, et les jours d'arrêt en nombre, sans aucun élément médical.
- Les taux de fréquence et de gravité de la mission.
- Les habilitations et formations obligatoires liées aux postes qu'il a commandés, avec les échéances.
- Les aptitudes au poste, dans les trois états admis.
- Les équipements de protection dus par l'agence et ceux dus par le client, avec l'état de remise.
- L'accueil sécurité réalisé à l'arrivée, avec sa date.

**EX-V5-008** Une habilitation expirée sur un poste commandé déclenche une alerte simultanée au client et à l'agence, et marque le travailleur comme non affectable au poste jusqu'à régularisation.

---

## 7. Conformité de l'agence (`compliance`)

Le client utilisateur est exposé à une responsabilité solidaire en cas de défaillance déclarative de l'agence. Lui donner les pièces n'est pas une faveur, c'est ce qui le protège et ce qui distingue une agence sérieuse.

- Autorisation d'exercer l'activité de mise à disposition, avec validité.
- Attestation de régularité sociale, attestation de vigilance, avec date d'expiration et alerte 30 jours avant.
- Attestation d'assurance responsabilité civile, avec plafonds.
- Attestation de dépôt des déclarations sociales de la période, pour l'effectif placé chez ce client.
- Déclaration préalable à l'embauche pour chaque travailleur placé, sous forme d'accusé, sans donnée salariale.
- Liste des travailleurs étrangers avec validité de titre, le cas échéant.

**EX-V5-009** Chaque pièce porte une date de validité et un état visuel à trois niveaux : valide, expire sous 30 jours, expirée. Une pièce expirée est visible du client, elle n'est jamais masquée.

---

## 8. Mon contrat de mise à disposition (`contract`)

Par commande, et non globalement : postes commandés, qualification requise, motif de recours, durée, lieu d'exécution, horaires, taux horaire facturé par poste et par tranche horaire, majorations convenues, conditions de facturation des heures supplémentaires, délai de remplacement garanti, pénalités éventuelles, conditions de fin anticipée, période d'essai de la mission.

**EX-V5-010** Le taux facturé affiché ici et le taux appliqué sur la facture proviennent de la même source. Un écart est impossible par construction, et non par contrôle a posteriori.

---

## 9. Mes factures et relevés (`invoices`)

- Facture rattachée au relevé d'heures validé qui la fonde, accessible en un clic depuis la facture. C'est la spécificité de ce volume : la facture n'est jamais lue seule.
- Détail : poste, travailleur, heures par tranche, taux, montant, majorations, refacturations diverses.
- Écart entre heures validées et heures facturées, affiché systématiquement, y compris nul.
- Relevé de compte, échéancier, contestation (acte A3).

**EX-V5-011** Une facture ne peut pas être émise sur une période dont le relevé n'est ni validé ni réputé accepté par défaut. La règle est portée par la base.

---

## 10. Mes demandes de personnel (`requests`)

| Type | Champs | Délai cible |
|---|---|---|
| Demande de personnel | poste, qualification, nombre, date de début, durée, site, horaires, motif de recours | selon contrat |
| Remplacement | travailleur, motif, date souhaitée | selon contrat, souvent 24 heures |
| Prolongation de mission | travailleur, nouvelle date de fin | 48 heures |
| Fin de mission anticipée | travailleur, date, motif | immédiat, accusé de réception |
| Signalement d'incident | travailleur, date, nature, suite immédiate | immédiat |
| Réclamation qualité | objet, période, pièce | 48 heures |

**EX-V5-012** Le motif de recours est un champ contraint par une liste par pays, jamais un texte libre. Le portail affiche la durée maximale admissible associée et alerte quand la commande la dépasse. Le risque de requalification est partagé, l'outil doit le signaler aux deux parties.
**EX-V5-013** Contrôle anti double affectation : un individu déjà présent dans l'effectif propre du client, ou déjà placé chez lui par un autre mandat, déclenche un blocage et une alerte. Le prêt de main d'œuvre requalifiable commence souvent là.

---

## 11. Indicateurs de mission (`insights`)

Taux de couverture des postes commandés, délai moyen de remplacement, taux d'absentéisme des travailleurs placés, rotation sur les postes, heures facturées par poste et par mois, indicateurs de sécurité. Aucun indicateur financier autre que le facturé.

---

## 12. Recette

| Réf | Scénario | Attendu |
|---|---|---|
| T-05-01 | Requête forgée demandant une colonne de rémunération | Colonne inexistante dans la vue, échec structurel, anomalie journalisée |
| T-05-02 | Contact `site` sur un site A | Aucun travailleur, aucun pointage, aucune facture du site B |
| T-05-03 | Contestation de 2 lignes d'un relevé de 400 | 2 lignes exclues, 398 facturables, litige ouvert |
| T-05-04 | Aucune décision sur le relevé | Réputé accepté à J+3, alerte à J-1, journalisation en défaut |
| T-05-05 | Émission de facture sur période non validée | Refusée par la base |
| T-05-06 | Attestation de vigilance expirée | Affichée en rouge côté client, alerte simultanée à l'agence |
| T-05-07 | Habilitation expirée sur poste commandé | Travailleur marqué non affectable, double alerte |
| T-05-08 | Commande dépassant la durée maximale du motif de recours | Alerte affichée aux deux parties, commande possible mais tracée |
| T-05-09 | Travailleur déjà salarié du client | Blocage à l'affectation, alerte |
| T-05-10 | Recherche d'une messagerie vers le travailleur | Fonction inexistante dans l'interface et dans l'API |
