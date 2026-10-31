# Calisthénie — appli d'entraînement hors-ligne

Appli web (PWA) en français pour s'entraîner à la maison et au street workout, et progresser vers les figures
(équilibre sur les mains, drapeau humain, front lever, muscle-up, planche). Elle marche sans connexion après la première ouverture.
Tes données restent sur ton téléphone (aucun compte, aucun serveur).

## Lancer sur l'ordinateur

Un petit serveur local est nécessaire (le hors-ligne ne marche pas en ouvrant le fichier directement).

```bash
cd /Users/test/Downloads/calisthenie-app && python3 -m http.server 8123
```

Puis ouvre `http://localhost:8123`. Tests automatiques de la logique : `npm test`.

## Installer sur le téléphone

1. Publie l'appli (voir plus bas) et ouvre le lien **une première fois avec du réseau** : tout est alors mis en cache.
2. iPhone : ouvre le lien dans **Safari** → Partager → « Sur l'écran d'accueil ». Android : Chrome → menu → « Installer l'application ».
3. Ensuite elle se lance comme une vraie appli, même en avion.

## Sauvegarde (important)

Vider le navigateur efface les données, et Safari peut purger le stockage d'une appli inutilisée longtemps.
Dans l'onglet **Progrès** : « Exporter ma sauvegarde » (fichier JSON à garder) et « Importer une sauvegarde ».
Un import remplace les données actuelles après confirmation ; un fichier invalide est refusé sans rien effacer.

## Modifier le contenu

Tout le contenu est dans `data/` et se modifie à la main :
- `exercices.json` : les exercices (étapes, conseils, plage de répétitions, variante plus facile/dure, substitut maison/street).
- `programme.json` : la semaine type, l'échauffement, les étirements, la semaine de décharge.
- `figures.json` : les parcours de figures et les tests de chaque palier.

`npm test` vérifie que les références entre ces fichiers restent valides.

## Mises à jour

L'appli utilise le cache d'abord, puis se met à jour en arrière-plan. Après avoir modifié des fichiers :
change `CACHE_NAME` dans `sw.js` (`calisthenie-v1` → `calisthenie-v2`) pour forcer le téléchargement de tout. Un bandeau « Recharger » peut apparaître.
Ajoute aussi tout nouveau fichier à la liste `ASSETS` de `sw.js` (le test `npm test` le vérifie pour ceux qui y figurent).

## À vérifier par toi (fiches d'exercices)

Les textes sont rédigés avec mes mots, à partir de pratiques classiques de calisthénie. Relis en priorité :
- les progressions de **figures** (drapeau, front lever, planche, muscle-up) : paliers, durées de test, conseils de sécurité ;
- les exercices à risque : **rowing sous une table**, **pompes explosives**, **pistol squat**, **kick-up** ;
- les fourchettes de répétitions et temps de repos de chaque exercice.

Ce n'est pas un suivi de coach : en cas de douleur, adapte ou consulte.

## Publier sur GitHub Pages (à faire quand tu es prêt)

Rien n'est publié automatiquement. Étapes :

1. Crée un dépôt vide sur GitHub (par exemple `calisthenie`).
2. Dans ce dossier : `git remote add origin <URL du dépôt>` puis `git push -u origin main` (renomme la branche en `main` si besoin : `git branch -M main`).
3. Sur GitHub : Settings → Pages → « Deploy from a branch » → branche `main`, dossier `/ (root)`.
4. Ouvre le lien `https://<ton-compte>.github.io/calisthenie/` sur le téléphone, puis installe l'appli.

## Ce qui n'a pas pu être testé ici

Le comportement sur un vrai téléphone : installation sur l'écran d'accueil, écran maintenu allumé (Wake Lock), vibration,
purge du stockage par iOS. L'appli fonctionne sans ces fonctions si elles manquent.
