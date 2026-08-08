# Atlas People, Portail Client
## Volume 0 : socle commun, doctrine d'exposition et architecture

**Version** 1.0 · 8 août 2026
**Statut** cahier des charges d'implémentation (mode god, arbitrages tranchés)
**Périmètre** l'espace accessible aux tiers d'un tenant Atlas People, toutes déclinaisons confondues
**Destinataire** implémentation Claude Code, un fichier par volume

---

## 1. Ce qui est jugé insuffisant dans le build du 8 août 2026

Le portail livré fonctionne, mais il repose sur trois hypothèses qui ne tiennent pas à l'usage réel. Le présent cahier des charges les remplace.

| # | Constat sur le build actuel | Conséquence | Décision |
|---|---|---|---|
| C1 | Le filtre d'affichage est **la formule du cabinet** | Un cabinet qui exerce plusieurs métiers (le cas de la déclinaison 360) ne peut pas servir un client paie et un client mise à disposition avec la bonne nomenclature | Le filtre devient **le mandat du client**, borné par la formule du cabinet (§4) |
| C2 | **Un seul contact** par client, sans rôle | Le DAF, le responsable RH et le chef de site voient la même chose, donc soit trop, soit rien | Contacts multiples, cinq rôles, périmètres par entité et par site (§5) |
| C3 | Rubriques **ouvertes mais vides** | Le portail annonce ce qu'il ne sert pas, ce qui décrédibilise le cabinet dès la première connexion | Doctrine d'exposition arbitrée donnée par donnée (§3), et interdiction d'afficher une rubrique sans contenu publiable (EX-P-014) |
| C4 | Espace **strictement en lecture** | Le client continue de valider ses heures et ses variables par WhatsApp, le portail ne remplace donc rien et n'est pas visité | Trois actes engageants seulement, listés en §7 |
| C5 | **Aucune notification** sortante | Un portail sans alerte n'est ouvert que par le cabinet lui même, pour le montrer | Moteur d'événements et de notifications (§8) |
| C6 | **Aucune preuve** de mise à disposition | Le cabinet ne peut pas prouver qu'il a livré le bulletin dans les délais, le client ne peut pas prouver qu'il l'a réclamé | Publication versionnée, accusé de prise de connaissance, journal chaîné (§6) |
| C7 | Pas de **multi entité** côté client | Un groupe de trois sociétés reçoit trois invitations et trois mots de passe | Périmètre multi entités et sélecteur (§5.4) |
| C8 | Pas de **réversibilité** | En fin de mandat le client repart sans ses pièces, le cabinet reste dépositaire d'archives qu'il n'a plus le droit de garder | Export de sortie et purge programmée (§10) |

---

## 2. Principe directeur

> Le portail client n'est pas une vitrine du logiciel du cabinet. C'est **la preuve permanente que la prestation vendue est exécutée**, et le seul endroit où le client peut la vérifier sans appeler.

Trois conséquences opératoires :

1. Toute rubrique doit répondre à une question que le client se pose vraiment (est ce que mes déclarations sont déposées, combien va me coûter ce mois, qui travaille chez moi aujourd'hui, pourquoi cette facture).
2. Toute donnée exposée doit être **opposable** : datée, versionnée, attribuée à un auteur, non modifiable après publication.
3. Ce qui n'est pas exposé doit être **invisible**, jamais grisé ni verrouillé. Le moindre privilège s'applique à l'écran comme à la base.

---

## 3. Doctrine d'exposition (le cœur de l'arbitrage demandé)

Huit règles. Elles s'appliquent dans l'ordre, la première qui interdit l'emporte.

### R1. Qualité d'employeur
Une donnée nominative de rémunération n'est exposée qu'au client qui est **l'employeur juridique** du salarié concerné. En mise à disposition, l'employeur est l'agence : le client utilisateur ne voit jamais un bulletin, un net, un brut, une retenue ou un solde de congés.

### R2. Finalité
Une donnée n'est exposée que si elle sert à l'un de ces trois usages, et à aucun autre :
- vérifier ou contester une facture,
- exécuter une obligation légale qui pèse sur le client lui même,
- piloter la prestation qu'il a commandée.

### R3. Minimisation graduée
Trois niveaux d'ouverture par rubrique, jamais un booléen :
`aucun` → `agrégé` → `nominatif`. L'agrégé est le défaut. Le nominatif est un octroi explicite, tracé, révocable, avec motif saisi par le cabinet.

### R4. Non répudiation
Tout objet publié porte : date et heure de publication, auteur côté cabinet, version, empreinte SHA 256. Toute consultation est journalisée. Le journal est en ajout seul et chaîné, conformément à l'invariant plateforme.

### R5. Rien d'inachevé
Un brouillon n'est jamais visible. Un objet devient visible par un **acte explicite de publication**, jamais par un changement de statut technique. La bascule est réversible pendant 15 minutes (dépublication d'urgence), au delà elle exige une version corrective.

### R6. Correction par version, jamais par suppression
Une pièce erronée n'est pas retirée : une version n+1 est publiée avec motif obligatoire, l'ancienne reste consultable, marquée « remplacée le … ». Le client est notifié du remplacement.

### R7. Données sensibles
- Aucune pièce médicale, aucun motif d'arrêt, aucun diagnostic n'entre dans le portail. Une absence pour raison de santé s'affiche « arrêt de travail », rien de plus.
- Aucune donnée de santé, d'appartenance syndicale, de situation familiale détaillée, de coordonnées personnelles (adresse, téléphone personnel) hors nécessité prouvée.
- Le dossier disciplinaire n'est jamais exposé, y compris à l'employeur client, tant qu'il n'est pas clos et notifié.

### R8. Protection du modèle économique du cabinet
Le client voit **ce qu'il paie**, pas **ce que le cabinet paie**. En mise à disposition, le taux facturé est visible, le salaire versé ne l'est pas. Aucun écran ne doit permettre de reconstituer la marge du cabinet par soustraction : les agrégats de coût sont bornés en conséquence (contrôle EX-P-031).

---

## 4. Résolution du profil de portail

**Arbitrage majeur.** Le profil affiché ne découle plus de la formule du cabinet mais du mandat souscrit par le client, la formule ne servant que de borne.

```
profil_portail(client) =
      mandat_client                      -- conseil | paie | mad | mixte
  ∩   formule_cabinet                    -- ce que le cabinet a le droit de vendre
  ∩   grants(client, rubrique, niveau)   -- ce que le cabinet a ouvert pour ce client
  ∩   role(contact) ∩ scope(contact)     -- ce que ce contact a le droit de voir
```

| Formule du cabinet | Mandats client autorisés |
|---|---|
| `entreprise` (Atlas People Core) | `tiers` uniquement (volume 1) |
| `cabinet_complet` (Atlas People Conseil) | `conseil`, `paie` |
| `cabinet_paie` (Atlas Payroll) | `paie` |
| `cabinet_mixte` (Atlas People 360) | `conseil`, `paie`, `mad`, `mixte` |
| `cabinet_agence` (Atlas People Placement) | `mad` |

**EX-P-001** Le champ `clients.mandate_type` est obligatoire, contrôlé par la formule du tenant à l'écriture (trigger), et pilote seul le vocabulaire et le jeu de rubriques.
**EX-P-002** Un client en mandat `mixte` porte plusieurs mandats simultanés (table `client_mandates`), chacun avec sa date d'effet et sa date de fin.

---

## 5. Identité, contacts, rôles et périmètres

### 5.1 Nature du compte
**EX-P-003** Le contact client est un utilisateur externe : il ne consomme **aucun siège** de la licence du cabinet, il n'apparaît pas dans l'annuaire interne, il n'a aucune session sur l'application du cabinet.
**EX-P-004** Le JWT porte `portal: true`, `cabinet_tenant_id`, `client_ids[]`, `portal_role`, `scope_ids[]`. Aucune politique RLS applicative ne doit accepter un JWT `portal: true` en dehors des vues et tables préfixées `portal_`.

### 5.2 Invitation et activation
| Étape | Règle |
|---|---|
| Invitation | Émise par le cabinet, sur email nominatif (jamais une adresse générique de type contact@) |
| Lien | Valide 72 heures, à usage unique, révocable |
| Activation | Mot de passe, acceptation des conditions du portail (version horodatée et stockée), acceptation de la politique de confidentialité |
| Second facteur | Optionnel par défaut, **obligatoire** dès qu'un octroi `nominatif` existe sur la rubrique paie ou effectifs |
| Rattachement | Sur email vérifié, l'accès passe en actif, le cabinet est notifié |
| Inactivité | Accès suspendu après 180 jours sans connexion, réactivable sans nouvelle invitation |
| Départ | Le cabinet révoque, la session est tuée dans la minute, l'historique de journal est conservé |

### 5.3 Rôles de contact
| Rôle | Vocation | Voit | Ne voit jamais |
|---|---|---|---|
| `dirigeant` | Chef d'entreprise, DG | Tout ce qui est ouvert, y compris masse salariale et nominatif si octroyé | Rien de plus que les octrois |
| `rh` | Responsable RH ou administratif | Effectifs, contrats, absences, conformité, demandes | Factures d'honoraires, sauf octroi |
| `finance` | DAF, comptable, cabinet comptable | Factures, journal de paie comptable, écritures, échéanciers, agrégats | Nominatif salarial, dossiers individuels |
| `site` | Chef de site, chef de chantier, superviseur | Présences, pointages, planning, sécurité, **sur son ou ses sites seulement** | Tout élément financier, tout élément salarial |
| `lecteur` | Auditeur, tiers ponctuel | Documents publiés qui lui sont adressés | Le reste |

**EX-P-005** Un contact porte un rôle et un seul par client. Un même individu peut être contact de plusieurs clients, avec des rôles différents.
**EX-P-006** Le rôle `site` implique obligatoirement au moins un périmètre de site, sans quoi le contact ne voit rien (échec fermé, jamais ouvert).

### 5.4 Périmètres
**EX-P-007** Périmètres cumulables : entité légale, site ou établissement, service. Le périmètre vide signifie « tout le client », il n'est ouvrable que pour `dirigeant`, `rh` et `finance`.
**EX-P-008** Un contact rattaché à plusieurs clients (groupe, ou plusieurs cabinets prestataires) dispose d'un sélecteur de périmètre en tête d'écran. Le changement de périmètre est journalisé.

---

## 6. Modèle de données

Tables nouvelles, toutes préfixées `portal_`, hébergées dans le schéma du tenant cabinet.

| Table | Colonnes structurantes | Rôle |
|---|---|---|
| `portal_contacts` | id, tenant_id, client_id, user_id (nullable), email, full_name, role, status, invited_at, activated_at, last_seen_at, revoked_at | Le contact et son cycle de vie |
| `portal_contact_scopes` | contact_id, scope_type (legal_entity, site, department), scope_id | Périmètre |
| `portal_access_grants` | id, tenant_id, client_id, section_code, level (none, aggregate, nominative), motive, granted_by, granted_at, revoked_at | Ce que le cabinet ouvre, par client et par rubrique |
| `portal_sections_registry` | section_code, sort_order, icon, is_action_capable | Catalogue technique des rubriques |
| `portal_section_labels` | section_code, mandate_type, label, subtitle, empty_state | Le vocabulaire par mandat (§9) |
| `portal_publications` | id, client_id, section_code, object_type, object_id, period, version, title, file_path, sha256, published_at, published_by, replaces_id, replaced_by_id, motive, unpublished_at | L'acte de mise à disposition |
| `portal_acknowledgements` | publication_id, contact_id, acknowledged_at, ip, signature_hash | La preuve de prise de connaissance |
| `portal_actions` | id, client_id, contact_id, action_type, target_id, decision, comment, decided_at, sha256_prev, sha256 | Les trois actes engageants (§7) |
| `portal_requests` | id, client_id, contact_id, request_type, payload jsonb, status, sla_due_at, assigned_to, closed_at, outcome_publication_id | Les demandes |
| `portal_access_log` | id, contact_id, client_id, object_type, object_id, action, at, ip, user_agent, sha256_prev, sha256 | Journal en ajout seul, chaîné |
| `portal_notifications` | id, contact_id, event_code, channel, payload, sent_at, read_at | Notifications |
| `client_mandates` | client_id, mandate_type, starts_on, ends_on, contract_ref | Mandats du client (§4) |

**EX-P-009** Le portail ne lit **jamais** directement les tables métier `payroll_*`, `hr_*` ou `billing_*`. Il lit exclusivement :
- les tables `portal_*`,
- des vues sécurisées `portal_v_*` en lecture seule, définies avec `security_invoker = off` et filtrées par `auth.portal_client_ids()`.
Cet invariant reprend le principe de console agrégatrice déjà retenu pour le module Paramètres : le portail n'est pas propriétaire de la donnée métier.

**EX-P-010** Fonctions d'appui : `auth.is_portal()`, `auth.portal_client_ids()`, `auth.portal_role()`, `auth.portal_scopes()`. Toute politique RLS des vues `portal_v_*` les combine, sans exception.

**EX-P-011** Le journal `portal_access_log` est chaîné en SHA 256 (chaque ligne intègre l'empreinte de la précédente), sans UPDATE ni DELETE possibles (révocation des droits au niveau du rôle Postgres), rétention 10 ans.

---

## 7. Les trois seuls actes engageants

Le portail reste en lecture pour tout le reste. Ces trois actes existent parce qu'ils protègent le cabinet autant que le client.

| Acte | Volume concerné | Effet | Preuve |
|---|---|---|---|
| **A1. Validation du relevé d'heures** | mise à disposition, mixte | Fige la base de facturation de la période | Signature légère (mot de passe reconfirmé), empreinte, horodatage |
| **A2. Bon à payer de la paie** | conseil, paie, mixte | Autorise la clôture et l'émission de l'ordre de virement | Idem, plus le montant total et l'effectif au moment de la décision |
| **A3. Contestation de facture ou de ligne** | tous | Ouvre un litige tracé, suspend la relance sur la ligne contestée | Motif obligatoire, statut, réponse du cabinet publiée |

**EX-P-012** Chaque acte exige la reconfirmation du mot de passe (`RequirePasswordConfirm` du SDK partagé) et produit une ligne dans `portal_actions` avec chaînage d'empreinte.
**EX-P-013** Règle de silence, paramétrable par mandat : à défaut de décision sous N jours ouvrés (défaut 3 pour A1, 2 pour A2), l'acte est réputé accepté, avec notification préalable à J-1 et mention explicite dans les conditions du portail. Le défaut est journalisé comme tel, jamais présenté comme une validation active.

---

## 8. Rubriques, états et notifications

### 8.1 États d'une rubrique
| État | Affichage | Règle |
|---|---|---|
| `absente` | Rien | Rubrique non autorisée par le mandat ou non octroyée |
| `active` | Contenu | Au moins un objet publié |
| `en_attente` | Bandeau court daté | Rubrique octroyée, période en cours, publication attendue avant telle date |
| `sans_objet` | Ligne discrète | Rubrique octroyée mais rien à publier ce mois (exemple, aucune déclaration exigible) |

**EX-P-014** L'état vide muet est interdit. Une rubrique octroyée sans contenu affiche soit `en_attente` avec une échéance annoncée, soit `sans_objet` avec sa raison. Faute de quoi elle bascule `absente`.

### 8.2 Événements notifiables
`publication.created`, `publication.replaced`, `action.pending`, `action.deadline_h24`, `action.defaulted`, `invoice.issued`, `invoice.due_soon`, `invoice.overdue`, `request.answered`, `compliance.deadline`, `compliance.filed`, `access.granted`, `access.revoked`.

**EX-P-015** Canaux : courriel (obligatoire), notification dans le portail (obligatoire), WhatsApp Business et SMS (optionnels, activés par le cabinet, contenu sans donnée nominative ni montant).
**EX-P-016** Regroupement quotidien par défaut, immédiat pour les événements de la famille `action.*` et `invoice.overdue`.
**EX-P-017** Aucune notification ne contient de donnée exposable : elle annonce et renvoie vers le portail.

---

## 9. Vocabulaire par mandat

Le libellé n'est pas cosmétique, il porte la qualification juridique de la relation. Table `portal_section_labels`, jamais de libellé en dur dans le code.

| `section_code` | mandat `tiers` | mandat `conseil` | mandat `paie` | mandat `mad` |
|---|---|---|---|---|
| `workforce` | Registre du personnel | Effectifs | Salariés payés (sous rubrique de `payroll`) | Travailleurs placés |
| `time` | absent | Temps et absences | Éléments variables | Pointages et heures |
| `payroll` | Journal de paie | Paie | Bulletins et déclarations | absent |
| `compliance` | Déclarations et attestations | Conformité | Déclarations sociales | Conformité de l'agence |
| `safety` | absent | Santé et sécurité | absent | Sécurité sur mes sites |
| `contract` | Ma mission | Mon mandat | Mon mandat de paie | Mon contrat de mise à disposition |
| `invoices` | absent | Mes factures | Mes factures | Mes factures et relevés |
| `documents` | Documents | Documents | Documents | Documents |
| `requests` | absent | Mes demandes | Mes demandes | Mes demandes de personnel |
| `insights` | absent | Indicateurs | absent | Indicateurs de mission |

---

## 10. Exigences transverses

### 10.1 Interface
**EX-P-018** Conception mobile d'abord : la moitié des consultations se font sur téléphone, en 3G. Poids de la première page utile inférieur à 400 Ko, temps d'affichage inférieur à 2,5 secondes sur réseau lent simulé.
**EX-P-019** Page d'accueil du portail : une seule colonne, dans l'ordre, ce qui attend une décision du client, ce qui vient d'être publié, l'état de la période en cours, puis les rubriques.
**EX-P-020** Marque blanche légère : logo et couleur d'accent du cabinet, aucune mention Atlas Studio dans l'espace client, mention légale de l'éditeur en pied de page uniquement.
**EX-P-021** Accessibilité, contraste AA minimum, navigation clavier complète, libellés de lien explicites.
**EX-P-022** Langues français et anglais, format de date et de montant selon le pays du client, séparateur de milliers par espace insécable, devise en suffixe.

### 10.2 Montants
**EX-P-023** Tout montant affiché provient d'un calcul en base (bigint, Money.ts). Aucun total n'est recalculé côté client, aucun arrondi n'est appliqué à l'affichage au delà du formatage.

### 10.3 Documents
**EX-P-024** Toute pièce téléchargeable porte un filigrane discret : nom du contact, date et heure de téléchargement, référence du portail. Le filigrane est appliqué à la volée, le fichier source reste intact.
**EX-P-025** URL de téléchargement signée, valable 5 minutes, à usage unique, non devinable, journalisée.

### 10.4 Réversibilité et rétention
**EX-P-026** Export de sortie : à la fin d'un mandat, le cabinet déclenche une archive complète (pièces publiées, journal des publications, historique des actes) remise au client sous 30 jours.
**EX-P-027** Purge programmée : au terme de la durée légale de conservation applicable au pays, les pièces sont purgées, le journal des publications est conservé sous forme de métadonnées sans fichier.
**EX-P-028** Aucune donnée de portail ne quitte l'infrastructure. PROPH3T ne rédige, ne calcule et ne publie rien dans le portail, il reste strictement consultatif côté cabinet.

### 10.5 Sécurité
**EX-P-029** Limitation de débit par contact et par IP, verrouillage progressif, alerte au cabinet à partir de 5 échecs.
**EX-P-030** Détection d'aspiration : au delà de 50 téléchargements en 10 minutes, l'accès est suspendu et le cabinet alerté.
**EX-P-031** Contrôle anti reconstitution : aucun jeu d'agrégats exposés ne doit permettre de déduire une rémunération individuelle. Concrètement, tout agrégat portant sur moins de 5 personnes est masqué et remplacé par la mention « effectif insuffisant pour l'affichage ».

---

## 11. Recette du socle

| Réf | Scénario | Attendu |
|---|---|---|
| T-00-01 | Contact `site` sans périmètre | Aucune donnée, message d'accès incomplet, alerte au cabinet |
| T-00-02 | Contact d'un client A tentant l'identifiant d'un objet du client B | 404, pas 403, ligne de journal en anomalie |
| T-00-03 | Révocation en cours de session | Session invalidée en moins de 60 secondes |
| T-00-04 | Publication puis remplacement | Deux versions visibles, la première marquée remplacée, notification émise |
| T-00-05 | Brouillon de facture ou de paie | Invisible dans toutes les vues du portail |
| T-00-06 | Agrégat sur 3 personnes | Masqué, mention d'effectif insuffisant |
| T-00-07 | Défaut de décision sur A1 | Bascule en accepté par défaut, journalisée comme défaut, alerte préalable envoyée |
| T-00-08 | Cabinet de formule `cabinet_paie` créant un client en mandat `mad` | Refus au niveau du trigger |
| T-00-09 | Contact rattaché à deux cabinets | Sélecteur, cloisonnement strict, aucun mélange de périmètre |
| T-00-10 | Téléchargement d'une pièce | Filigrane nominatif présent, URL expirée après 5 minutes |

---

## 12. Séquence de mise en œuvre

| Lot | Contenu | Dépendance |
|---|---|---|
| L1 | Tables `portal_*`, fonctions RLS, registre et libellés, résolution du profil | aucune |
| L2 | Contacts, rôles, périmètres, invitations, révocation, journal chaîné | L1 |
| L3 | Publication versionnée, accusés, documents filigranés, notifications | L2 |
| L4 | Volumes 2 et 3 (conseil et paie), acte A2 | L3 |
| L5 | Volume 5 (mise à disposition), acte A1 | L3 |
| L6 | Volume 4 (mixte), cumul de mandats, contrôle anti double affectation | L4, L5 |
| L7 | Volume 1 (tiers), accès à durée de mission | L3 |
| L8 | Demandes, indicateurs, export de sortie, purge | L4 à L7 |
