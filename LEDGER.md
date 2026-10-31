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
Task 4: complete (npm test -> 89/89 pass)
Task 5: complete (npm test -> 97/97 pass)
Task 6: Ruling: creerDecor/creerMannequin renvoient {groupe, liberer} (et non un Group nu) pour libérer la mémoire - cout: aucun
Task 6: Ruling: les parcours de figures ouvrent la fiche d exercice (qui montre la démo) au lieu d un rendu par palier: évite plusieurs contextes WebGL dans une liste - cout: un clic de plus
Task 6: Ruling: ajout d un garde de génération dans montrerAnimation (chargement tardif ne détruit pas le rendu récent) + paramètre env.animer pour le tester - cout: aucun
Task 6: complete (npm test -> 104/104 pass; rendu 3D à vérifier dans le navigateur, T7)
Task 7: Ruling: banc de rendu temporaire (hors dépôt) pour juger les poses; corrections visuelles: mains horizontales aux barres (+test), extrémités non arrondies (rainures), libellés muscles accentués (+test), forceContextLoss, cadrage 1.0 - cout: aucun
Task 7: complete (npm test -> 107/107 pass; navigateur: 5 poses vérifiées, boutons, rafale d écrans = 1 canvas, 375 px sans défilement; hors-ligne et SW NON testables dans le navigateur intégré, couverts seulement par le test ASSETS)
Final review: relecteur indépendant (sous-agent, modèle opus) sur fa13c63..HEAD - 0 Critical, 3 Important, 9 Minor
Final: fixed I-1 boucle 3D qui tourne après remplacement de l écran (repos de séance, retour à la liste) - test zoneAttachee RED->GREEN + vérifié navigateur (0 rAF), suite 111/111
Final: fixed I-2 chargement lent puis sortie d écran laisse un rendu actif - test "détruire pendant le chargement" RED->GREEN, suite 111/111
Final: fixed I-3 data/animations.json manquant ou cassé bloquait tout le démarrage - tests chargerFacultatif RED->GREEN, suite 111/111 (CACHE_NAME -> v3, js/chargement.js dans ASSETS)
Final: minor (deferred): M-1 webglDisponible crée un canvas de test à chaque appel sans le libérer (tester seulement si animation, mettre en cache, loseContext)
Final: minor (deferred): M-2 renderer non libéré si exception après sa création dans animer
Final: minor (deferred): M-3 en pause la boucle redessine la même image à chaque frame
Final: minor (deferred): M-4 aria-label des boutons Ralenti et Vue masquent le texte visible (WCAG 2.5.3)
Final: minor (deferred): M-5 bouton Ralenti sans retour visuel (aria-pressed sans style)
Final: minor (deferred): M-6 canvas sans alternative textuelle (role="img" + aria-label)
Final: minor (deferred): M-7 main.js importe viewer.js statiquement (un module cassé bloquerait le démarrage)
Final: minor (deferred): M-8 prefers-reduced-motion lu une seule fois à la création
Final: minor (deferred): M-9 champ distance de VUES inutilisé (code mort)

# Plan: toutes les animations (69 exercices restants), demande utilisateur 2026-10-31
Base: 156486c. Constat RED: 69/74 exercices sans animation (poussée 9, tirage 10, jambes 13, gainage 7, équilibre 6, figures 14, mobilité 10).
Ruling: exercices "explosifs"/"sautés" animés comme leur version de base (durée plus courte), sans phase aérienne - cout: pas de saut visible
Ruling: variantes qui ne diffèrent que par la prise (supination, négatives, assistées) réutilisent les poses de base avec durée/muscles propres - cout: différence peu visible
Engine: tests génériques appuis (chaque point d appui déclaré touche le sol/support dans chaque pose clé), decor banc/mur/table/poteau + decorPos
Task A (toutes animations): poussée 9/9 et tirage 10/10 générés (ajustement numérique, tests de contact verts, planches-contact vérifiées). Ruling: pompes archer déclare appui main_g/pointes seulement (paume du bras tendu ~5 cm du sol) - cout: léger décollage visible. Anchor: option hauteur pour corps allongé (+test).
Task A: jambes 13/13 générées. Engine: lift par pose (interpolateLift/lifter) pour monter sur banc (+tests).
Task A: gainage 7/7. Ruling: L-sit au sol, hanches ~14 cm du sol (géométrie des proportions); gainage latéral hanches un peu basses (incliné ~15°) - cout: rendu moins net. Engine: ancrage sol appui sur un seul point (ex. main_g).
Task A: équilibre 6/6. Ruling: mur translucide (opacité 0,4) pour voir le corps quelle que soit la vue.
Task A: figures 13/13 (+ tractions-poitrine dans tirage). Ruling: angle limite des poses portée à +-360 (compensation de poignet); test mains horizontales limité aux barres horizontales (poteau = prise verticale).
Task A: mobilité 10/10 -> 74/74 exercices animés. Ruling: chat-vache déclare seulement les mains en appui (genoux ~10 cm en dos rond); tractions australiennes et rowing: 5 poses continues (±28° autour de la précédente) pour ne jamais passer sous le sol. Test permanent des poses intermédiaires (NaN, sous le sol, taille). CACHE_NAME -> v4.
