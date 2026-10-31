# SDD ledger — plan: docs/superpowers/plans/2026-10-28-calisthenie-pwa.md
Pre-flight: T3 consomme JSON de T2; T5/T6/T8 consomment T3+T4. Interfaces alignées sur le plan.
Task 1: Ruling: "node --test tests/" échoue sous Node 24 (traite le dossier comme module) — script npm = "node --test" (découverte auto) — coût: aucun
Task 1: Ruling: stubs de vues + JSON vides créés pour que ASSETS existe sur disque — remplacés aux tâches 2,5-8
Task 1: complete (npm test → 2/2 pass)
Task 2: Ruling: paliers de tenue testés à 10 s partout (spec: ex. 10 s), reps pour kick-up/tractions/muscle-up — coût: ajuster data/figures.json
Task 2: Ruling: champ "titre" ajouté aux jours du programme et "description" aux figures (affichage) — coût: aucun
Task 2: complete (npm test → 11/11 pass, 74 exercices)
Task 3: complete (npm test → 43/43 pass; CLE_PROFIL limite le calibrage aux exercices de base)
Task 3: Ruling: buildSession dédoublonne par exerciceId (deux exos peuvent avoir le même substitut) et écarte un bloc sans substitut valide — coût: séance un peu plus courte
Task 4: complete (npm test → 52/52 pass; backend IndexedDB vérifié seulement dans le navigateur, tâche 5)
Task 4: Ruling: importAll re-valide avant d écrire et replaceAll remplace tout — coût: un import écrase l historique actuel (confirmation côté UI, tâche 8)
Task 5: complete (vérifié navigateur intégré: test de départ, profil en IndexedDB, changement de lieu; npm test 52/52)
Task 6: complete (vérifié navigateur: séance complète, arrêt partiel enregistré terminee=false, chrono, wakeLock/vibrate supprimés; bug corrigé: startSession réinitialise ctx.run)
Task 6: Ruling: la recommandation "variante plus dure" est affichée seulement, non appliquée automatiquement au programme (spec: "l appli propose") — coût: changer de variante se fait à la main
Task 5: note: le service worker ne s enregistre pas dans le navigateur intégré ("error fetching the script"), à retester en T9
Task 7: complete (npm test 55/55; navigateur: recherche, filtres, fiche, liens plus facile/dur, 26 silhouettes vérifiées en capture)
Task 7: Ruling: filtre "muscle" = famille (groupe) + recherche texte sur les muscles ciblés — coût: pas de liste de muscles fins
Task 7: Ruling: clés d illustration chandelle et wall-walk ajoutées (au lieu de réutiliser mur) — coût: aucun
Final minor candidate: silhouettes SVG très simples (handstand, drapeau, muscle-up approximatifs)
Task 8: complete (navigateur: palier refusé à 9 s / validé à 10 s et suivant débloqué, import corrompu refusé sans effacer, export→import restaure; npm test 55/55)
Task 8: Ruling: service worker passé de cache-seul à cache d abord + revalidation en arrière-plan avec message "Recharger" (spec: mise à jour à la réouverture avec réseau) — coût: une version mixte possible pendant une session si une mise à jour tombe en cours
Task 9: complete (hors-ligne vérifié serveur arrêté: rechargement, exercices, figures, séance; audit 375 px: pas de défilement horizontal; npm test 55/55)
Task 9: Ruling: README ajoute la consigne "changer CACHE_NAME à chaque mise à jour" car la revalidation en arrière-plan ne rafraîchit que les fichiers rouverts — coût: un oubli laisse d anciens fichiers jusqu à la 2e ouverture
Final: bug trouvé en auto-relecture: fin de repos sur un autre onglet écrasait l écran — corrigé (tick sans écran affiché), vérifié navigateur ; ajout bouton Refaire le test de départ
Final review: self-review (aucun sous-agent lancé)

# Plan animations: docs/superpowers/plans/2026-10-31-animations-mannequin-3d.md (dans atelier-graphique)
Pre-flight: T2 consomme Joints (T1); T3 consomme FK (T2); T4 consomme JOINTS/computeFK/ancrer (T2,T3); T6 consomme tout. Interfaces alignees sur le plan.
Ruling: ledger dans LEDGER.md de l appli (le plan est hors depot git, pas de scripts task-start/task-done) - cout: aucun
Task 1: Ruling: le test du plan loopPhase(3,2)=0.5 est faux (3 s = sommet de la 2e boucle) - remplace par loopPhase(2.5,2)=0.5 et loopPhase(3,2)=1 - cout: aucun
Task 1: complete (npm test -> 60/60 pass)
Task 2: Ruling: bassin +90 (et non -90 comme dans le plan) incline le corps vers l avant face au sol; genou fléchi = rx positif, coude/hanche fléchis = rx négatif - cout: les poses de T4 suivent ces signes
Task 2: Ruling: proportions ajustées (abdomen .21, poitrine .26, tete .23) pour une taille exacte de 1,75 m; articulations _d en miroir (ry,rz inversés) pour que mêmes angles = pose symétrique - cout: aucun
Task 2: complete (npm test -> 70/70 pass)
Task 3: complete (npm test -> 75/75 pass)
Task 4: Ruling: main = centre de la paume (0,10 m) et nouveau point doigts (0,19 m) pour poser les mains à plat; ancrage sol accepte appui:"main" (x,z fixes) pour que mains et pieds ne glissent pas entre les poses - cout: tests de planche/équilibre sur les doigts
Task 4: Ruling: tests corpsDroit sur l axe cou-bassin-cheville (épaule gauche décalée de 0,19 m donnait 164°); poitrine < 0,30 m en bas des pompes (la poitrine est l articulation de colonne, pas le devant du torse; poses calculées avec mains et pointes au sol); menton = articulation tete - cout: aucun
Task 4: Ruling: poses réglées par recherche numérique (banc d essai hors dépôt) pour garder mains/pieds plantés: pompes incliné 17,5° en haut, coude 64° en bas; tractions menton à 2,25 m; dips coude 85° - cout: à valider visuellement en T7
Task 4: complete (npm test -> 91/91 pass)
