# Préférences de développement (adapté de patrius-game/CLAUDE.md pour git-graph-web)

## Contexte du projet

`git-graph-web` est une PWA statique mono-fichier (`index.html`, JavaScript vanilla, pas de framework,
pas de build) qui affiche l'historique des commits d'un dépôt GitHub en couloirs de branches parallèles.
Pas de backend : le navigateur parle directement à `api.github.com`. Hébergement prévu sur GitHub Pages.

## Règles générales

- **Avant** de coder, **si besoin** :
  - **pose moi des questions** pour **bien comprendre** le **contexte** et **ce qu'on cherche à faire**.

- **Pendant** le codage :
  - **Evite la duplication** de code **en factorisant** :
    - le code dans des **fonctions** pour améliorer la **maintenabilité** et la **lisibilité** du code.
    - les **constantes** (ex. `ROW`, `PAD`, `COLORS` en tête de `index.html`) pour pouvoir facilement
      modifier d'un coup leurs valeurs.
  - **Evite** lorsque c'est possible, les **variables globales** — l'état de l'app est déjà centralisé
    dans l'objet `S`, ne pas en ajouter d'autres à côté.
  - **Respecte** bien les **règles de codage** indiquées ci-dessous.

## Règles de codage

### Règles de formatage des commentaires

Tous les commentaires commencent par une majuscule.

- **Commentaire d'Instruction** : utilisé pour expliquer **l'instruction** qui suit. 2 lignes + code.
  1. ligne vide
  2. `//` texte expliquant l'instruction
  3. code (une seule ligne)

  Exemple :
  ```js

  // On lit la couleur de fond réellement appliquée
  const bg = getComputedStyle(document.body).backgroundColor;
  ```

- **Commentaire de Groupe** : utilisé quand un bloc contient **plusieurs instructions**. 3 lignes + code.
  S'il n'y a qu'une seule instruction, utiliser un Commentaire d'Instruction.
  1. ligne vide
  2. `//` texte expliquant l'action
  3. ligne vide
  4. code (plusieurs lignes) et/ou commentaire d'instruction

  Exemple :
  ```js

  // Recalculer la gouttière et redessiner le graphe

  const gutter = computeGutter(laneCount);
  draw();
  ```

- **Commentaire de Bloc** : délimite une section de code. 4 lignes + 1 ligne vide après.
  1. ligne vide
  2. `//`
  3. `//` texte du commentaire
  4. `//`
  5. ligne vide

  Exemple complet avec les 3 types de commentaires :
  ```js

  //
  // Chargement du dépôt : branches puis commits
  //

  // On normalise l'URL ou le "proprietaire/depot" saisi

  const raw = normalizeRepoInput($('#repo').value);

  // Lecture des branches et sélection par défaut

  const branches = await ghPages(`/repos/${owner}/${repo}/branches`, 3);
  selectDefaultBranches(branches);

  //
  // Récupération des commits par branche
  //

  ...
  ```

### Règles de formatage des commentaires dans les blocs `if` / `else`

Chaque `if` doit avoir un `else`.
Toujours utiliser un bloc `{}` après le `if` et après le `else`.
En entrée de chaque bloc (juste après le `{` qui termine la ligne du `if` ou du `else`), la structure est
toujours :

1. **Ligne suivante immédiatement après `{`** (**sans** ligne vide) : **Commentaire de Condition**.
   Explique **à quelle condition** correspond ce bloc, **sans dire** ce qui va être fait.
2. **Ligne vide**.
3. **Commentaire de Bloc, de Groupe ou d'Instruction** : explique l'action, suivie du code.

Le choix entre commentaire de Bloc, de Groupe et d'Instruction dépend du nombre d'instructions dans le
bloc :
- **1 instruction** → commentaire d'Instruction
- **Plusieurs instructions** → commentaire de Groupe
- **Plus d'une dizaine** d'instructions → commentaire de Bloc, puis sur les lignes suivantes, des
  commentaires de Groupe et/ou d'Instruction.

Pour le `else`, le commentaire de condition doit indiquer avec "**ET**" ou "**OU**" (en majuscules) les
différentes conditions en appliquant les règles de négation booléenne.

Exemple complet :

```js
if (res.ok) {
    // La requête a réussi

    // Mémoriser la réponse et arrêter de faire tourner le spinner

    lastResponse = res;
    setStatus(null);

} else {
    // La requête a échoué OU le jeton n'a pas les droits

    // Traduire l'erreur pour l'utilisateur et proposer d'ouvrir le panneau du jeton

    setStatus(humanError(res), true);
    openDrawer('token', true);
}
```

### Normes de codage

- **Toujours indenter correctement** le code lors de toute modification.
- Il ne doit y avoir qu'**un seul `return`** dans une fonction.

## Git

## Git branch

- **main** : c'est la branche correspondant au déploiement en production (GitHub Pages).
- **develop** : la branche correspondant à la pré-production. On y merge les features considérées
  comme fonctionnelles (la feature peut ne pas être terminée, mais on considère qu'on est arrivé à
  un jalon qui fonctionne et qui mérite d'être versé sur `develop`).
- **feature/xxx** : une branche de feature. Part de `main` ou `develop` et sera mergée dans `develop`.
- Les sessions Claude Code sur le web travaillent sur des branches dédiées (ex.
  `claude/commit-git-graph-web-index-yza6qu`) : elles suivent les mêmes règles que les branches de
  feature ci-dessous.

## Vocabulaire de propagation

- **"Propager en pré-prod"** : merger une branche de feature dans `develop`, puis pusher `develop`.
- **"Propager en prod"** : merger `develop` dans `main` (`main_jg` ou `master` selon le dépôt), puis
  pusher `main`, puis revenir sur `develop`.

## Corrections du CLAUDE.md

Toute correction du `CLAUDE.md` doit **toujours** être faite dans la branche `feature/claude_md`,
jamais directement dans `develop` ou dans une autre branche de feature. Contrairement aux branches
`feature/xxx` habituelles, `feature/claude_md` est **permanente** : elle n'est jamais supprimée et
sert à chaque future modification du fichier.

Marche à suivre à chaque correction :
1. Se placer sur `feature/claude_md`.
2. Si `develop` a avancé depuis, merger `develop` dans `feature/claude_md` pour repartir d'une base
   à jour.
3. Faire la modification dans `feature/claude_md`, commiter.
4. Propager en pré-prod : merger `feature/claude_md` dans `develop`, puis pusher `develop`.

Le merge de `develop` dans `main` (propager en prod) se fait ultérieurement, séparément, une fois
`develop` complétée et complètement validée — sans rien de spécifique au `CLAUDE.md`.

## Git commands

- **Commits** : messages en français casuel, ligne unique, pas de Conventional Commits, pas de
  Co-Authored-By.
  Quand tu commites, ajoute automatiquement les fichiers au staging (sauf ceux qui ne sont pas gérés
  par Git).
  Ne merge pas automatiquement lors d'un commit.
  *(Sur les sessions Claude Code cloud, une signature d'attribution peut être imposée par l'environnement
  d'exécution — elle prévaut alors sur cette préférence.)*

- **Push** : sur une **branche de feature**, tu peux commiter et pusher automatiquement, sans demander.
  Sur **main**, jamais de push sans demande explicite.

- **Merge** : jamais de Fast-Forward (sauf lors d'un Pull). Jamais de merge sans demande explicite.

## Git Ignore Rules

Ne jamais gérer dans Git :
- Les fichiers binaires générés (ex. sorties de build, si un outil de build est ajouté un jour).
- Les dossiers commençant par un `.` (`.vscode`, `.idea`, etc.), sauf demande explicite de l'utilisateur.

Pour les fichiers commençant par un `.`, me demander avant de les ajouter ou de les ignorer.

## Git Branches

Ne jamais supprimer de branches Git sans demander explicitement.

Les branches de feature doivent toujours être préfixées par `feature/`.
