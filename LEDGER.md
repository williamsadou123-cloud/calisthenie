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
