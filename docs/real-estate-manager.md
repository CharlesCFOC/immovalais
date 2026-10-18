# Gestion des biens immobiliers

## Utilisation

1. Ouvrir **Immobilier → Nos biens immobiliers → Gérer les biens**.
2. Saisir le code défini par `ADMIN_ACCESS_CODE`. La session est vérifiée côté serveur et dure 24 heures.
3. Choisir **Ajouter un bien** ou **Modifier la fiche** sur un bien existant.
4. Compléter les cinq rubriques de l’éditeur : **Informations**, **Images**, **Documents**, **Publication**, **Historique**.
5. **Enregistrer** conserve le brouillon sans changer le site public. **Prévisualiser** affiche la fiche et permet de retourner aux champs depuis les boutons de modification. **Publier** rend les changements visibles immédiatement.

Avant une première publication, ajouter une localisation, une description et au moins une photo. Le titre et les caractéristiques sont également modifiables. Les surfaces habitable, extérieure et de parcelle disposent de champs séparés (m²), affichés dans le résumé et les caractéristiques de la fiche. Le prix peut être numérique en CHF, EUR ou USD, ou « Prix sur demande ». Le statut affiché est libre : à vendre, réservé, vendu, etc.

Les photos peuvent être ajoutées, remplacées, retirées, réordonnées et choisies comme couverture. Leur légende et leur description accessible sont modifiables. Elles sont automatiquement orientées, limitées à 2 400 pixels et converties en WebP. Les documents PDF peuvent être ajoutés, remplacés, retirés, renommés et réordonnés. Taille maximale : 25 Mo par fichier.

La rubrique Publication permet de définir l’ordre d’affichage, la mise en avant et les sections visibles, et de masquer la fiche. Supprimer déplace le bien dans une corbeille récupérable ; la vue **Corbeille** permet de le restaurer. Les anciennes photos et les documents sont conservés pour la restauration des versions. L’éditeur affiche les 50 dernières versions et les restaure en brouillon, sans modifier la version publiée.

Le renommage conserve l’adresse initiale. Deux fenêtres ne peuvent pas écraser silencieusement leurs modifications : un conflit demande de recharger la fiche.

## Configuration et déploiement

Variables serveur : `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_ACCESS_CODE` et `ADMIN_SESSION_SECRET`. Les deux valeurs administrateur doivent être configurées avant d’ouvrir le gestionnaire. La clé de service reste exclusivement côté serveur.

Migration : `supabase/migrations/20261009002819_real_estate_cms.sql`. Elle crée les tables de biens, fichiers et versions, la fonction atomique de gestion et le bucket privé `real-estate-media`. Les accès directs aux tables sont refusés aux clients anonymes et authentifiés ; les routes serveur appliquent la session administrateur et la vérification d’origine aux mutations. Les médias publics doivent être référencés par une fiche publiée. Les médias de brouillon nécessitent la session administrateur.

Import initial (idempotent sur les fiches déjà publiées) :

```sh
node scripts/migrate-real-estate.mjs
```

Les 14 biens initiaux et leurs photos ne sont pas encore dans une nouvelle base. Après application des migrations et configuration de `.env.local`, `node scripts/migrate-real-estate.mjs` importe les données de départ. Le JSON sert uniquement à l’import ; les pages lisent ensuite Supabase. La liste et les fiches suivent les publications sans nouveau déploiement. Un premier déploiement est nécessaire pour rendre le gestionnaire accessible sur le site publié.

## Vérification

Démarrer le site, puis exécuter :

```sh
node scripts/test-real-estate-cms.mjs
```

Le script crée ses propres fiches temporaires et les nettoie ensuite. Il vérifie la session et l’origine, la confidentialité des brouillons, la conversion WebP réelle, les PDF, la validation des fichiers, la publication, les conflits de versions, l’historique, le masquage et la corbeille/restauration.
