# Volume 4 : déclinaison `cabinet_mixte` (Atlas People 360)
## Portail d'un cabinet qui exerce plusieurs métiers, pour des clients aux mandats différents

**Mandats autorisés** `conseil`, `paie`, `mad`, et leur cumul · **Socle** volume 0, appliqué intégralement

---

## 1. Ce que ce volume résout

C'est ici que le build du 8 août 2026 casse. Le portail actuel décide de la nomenclature à partir de **la formule du cabinet**. Un cabinet 360 a une seule formule et trois métiers : ses clients verraient donc tous le même vocabulaire, ce qui est faux pour deux d'entre eux et juridiquement dangereux pour le troisième. Un client utilisateur de travailleurs mis à disposition qui lit « Effectifs » au lieu de « Travailleurs placés » se croit employeur, et le portail devient une pièce contre l'agence.

**Arbitrage rappelé (EX-P-001).** Le profil de portail est résolu par le **mandat du client**. La formule du cabinet ne fait que borner les mandats qu'il a le droit d'ouvrir. Ce volume ne définit donc pas un nouveau portail : il définit **la coexistence et le cumul**.

---

## 2. Deux cas à distinguer

| Cas | Description | Traitement |
|---|---|---|
| **Cas A, mandats séparés** | Le cabinet sert des clients différents avec des mandats différents | Chaque client voit exactement le volume 2, 3 ou 5, sans mélange. Aucune spécificité au delà de la résolution du profil |
| **Cas B, cumul sur un même client** | Un même client achète deux ou trois mandats, par exemple la paie de ses salariés **et** la mise à disposition de travailleurs sur son chantier | Objet du présent volume |

Le cas B est fréquent et c'est le plus risqué : deux populations juridiquement distinctes cohabitent chez le même client, avec deux régimes d'exposition opposés.

---

## 3. Règle d'or du cumul

> Les populations ne se mélangent jamais. Ni dans un écran, ni dans un total, ni dans un export, ni dans un indicateur.

**EX-V4-001** Le portail d'un client à mandats multiples présente un **sélecteur de mandat** en tête d'écran, persistant, visible en permanence, avec un code couleur distinct par mandat. Aucun écran ne présente les deux populations simultanément, sauf l'accueil et la rubrique Factures (§6).
**EX-V4-002** Toute vue `portal_v_*` porte une clause de mandat. Une jointure entre une population `paie` et une population `mad` est impossible au niveau de la base, pas seulement au niveau de l'affichage.
**EX-V4-003** Les exports portent le mandat dans leur nom de fichier et dans leur en tête. Un export combiné n'existe pas.

---

## 4. Écran d'accueil unifié

Seul écran qui traverse les mandats. Il agrège les décisions attendues et les publications récentes, chaque ligne étant étiquetée par son mandat.

Ordre imposé :
1. Décisions attendues, tous mandats confondus, par échéance croissante : validation de relevé d'heures (mandat `mad`), bon à payer (mandat `paie` ou `conseil`), contestation ouverte, variables à déposer.
2. État des cycles en cours, un bloc par mandat.
3. Publications récentes, étiquetées.
4. Alertes de conformité, étiquetées.

**EX-V4-004** Aucun chiffre agrégé tous mandats confondus n'apparaît sur l'accueil. Pas de « coût total du mois », pas d'« effectif total ». Ce sont précisément les totaux qui créent la confusion d'employeur.

---

## 5. Contrôles propres au cumul

**EX-V4-005 (double affectation).** Un individu ne peut pas figurer simultanément dans la population `paie` ou `conseil` d'un client et dans sa population `mad`. Contrôle à l'affectation et contrôle périodique de rapprochement (nom, date de naissance, numéro national ou d'immatriculation sociale, en interne au cabinet uniquement, jamais exposé au client). Détection en anomalie, blocage, alerte au cabinet, jamais au contact client.

**EX-V4-006 (bascule de statut).** Le passage d'un travailleur placé au statut de salarié du client (embauche directe) est un événement tracé : fin de mission publiée côté mandat `mad`, entrée publiée côté mandat `paie`, aucune reprise automatique d'historique de l'un vers l'autre. Le portail n'expose au client, au titre du mandat `paie`, aucune donnée antérieure produite au titre du mandat `mad`.

**EX-V4-007 (indemnité de fin de mission et frais d'embauche).** Si le contrat de mise à disposition prévoit une indemnité en cas d'embauche directe, elle est calculée et affichée dans la rubrique Factures du mandat `mad`, avec la référence du travailleur et la date de bascule.

**EX-V4-008 (prêt de main d'œuvre).** Le portail affiche, dans la rubrique Contrat du mandat `mad`, un indicateur de durée cumulée de mise à disposition par travailleur chez ce client, avec le seuil applicable du pays et une alerte de franchissement. La responsabilité est partagée, l'information doit l'être aussi.

---

## 6. Facturation en cumul

**EX-V4-009** Une facture ne porte **jamais** deux mandats. Les honoraires de paie et la facturation d'heures de mise à disposition sont des prestations de nature différente, avec des bases, des régimes et parfois des taxes différentes.
**EX-V4-010** La rubrique Mes factures est la seule à présenter une liste traversant les mandats, chaque ligne étant étiquetée. Le relevé de compte peut être consolidé, le détail ne l'est jamais.
**EX-V4-011** Chaque facture reste rattachée à sa pièce fondatrice : relevé d'heures validé pour le mandat `mad`, effectif payé pour le mandat `paie`, base de gestion pour le mandat `conseil`.

---

## 7. Contacts et rôles en cumul

**EX-V4-012** Un contact porte un rôle **par mandat**. Le DAF peut être `finance` sur les deux mandats, le chef de chantier `site` sur le seul mandat `mad`, la responsable RH `rh` sur le seul mandat `paie`. Table `portal_contacts` étendue d'une clé `mandate_id`.
**EX-V4-013** Un contact sans rôle sur un mandat ne voit pas ce mandat, y compris dans le sélecteur : le mandat lui est invisible, pas verrouillé.
**EX-V4-014** Le journal d'accès enregistre le mandat actif au moment de chaque consultation.

---

## 8. Paramétrage côté cabinet

L'interface interne du cabinet 360 doit permettre, par client :
- d'ouvrir et de fermer chaque mandat, avec dates d'effet,
- de définir les octrois par rubrique et par niveau, indépendamment sur chaque mandat,
- de définir les fenêtres de collecte et les règles de silence, indépendamment sur chaque mandat,
- de visualiser d'un écran ce que voit un contact donné, par simulation, avant de lui ouvrir l'accès.

**EX-V4-015** La simulation de vue (« voir le portail comme ce contact ») est obligatoire dans cette déclinaison, et souhaitable dans les autres. Elle est en lecture seule, journalisée, et n'ouvre aucune session au nom du contact.

---

## 9. Recette

| Réf | Scénario | Attendu |
|---|---|---|
| T-04-01 | Client à deux mandats, contact `rh` du seul mandat `paie` | Le mandat `mad` n'apparaît pas dans le sélecteur |
| T-04-02 | Tentative d'export combiné | Fonction inexistante, un export par mandat |
| T-04-03 | Individu présent dans les deux populations | Blocage, alerte au cabinet, aucune alerte au contact client |
| T-04-04 | Embauche directe d'un travailleur placé | Fin de mission publiée, entrée publiée, aucun historique repris, indemnité facturée si prévue |
| T-04-05 | Accueil du portail | Aucun total tous mandats, chaque ligne étiquetée |
| T-04-06 | Facture mixant honoraires et heures | Refusée par la base |
| T-04-07 | Durée cumulée de mise à disposition franchissant le seuil | Alerte visible des deux côtés |
| T-04-08 | Simulation de vue par le cabinet | Rendu exact, lecture seule, ligne de journal, aucune session ouverte |
| T-04-09 | Cabinet de formule `cabinet_mixte` ouvrant un quatrième mandat non prévu | Refus, liste des mandats bornée par la formule |
