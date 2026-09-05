# Couloirs

Historique des commits GitHub avec les branches en traits parallèles verticaux, comme dans eGit ou
TortoiseGit, mais lisible sur un écran de téléphone. Page statique, sans serveur : le navigateur parle
directement à `api.github.com`.

## Déployer

```bash
git init && git add . && git commit -m "Couloirs, premier jet"
git remote add origin git@github.com:VOTRE-COMPTE/couloirs.git
git push -u origin main
```

Puis, dans le dépôt : **Settings → Pages → Source: Deploy from a branch → main / (root)**.
L'application vit ensuite sur `https://VOTRE-COMPTE.github.io/couloirs/`.

Sur Android : ouvrez cette adresse dans Chrome, menu **⋮ → Ajouter à l'écran d'accueil**. Elle
s'installe en plein écran et la coquille reste disponible hors connexion (les commits, eux,
demandent le réseau).

## Jeton d'accès

Sans jeton, l'application lit les dépôts publics dans la limite de 60 requêtes par heure.
Pour vos dépôts privés — et pour passer à 5 000 requêtes par heure :

1. <https://github.com/settings/personal-access-tokens/new>
2. **Repository access** → *Only select repositories* → `patrius-game`, `Patrius-MCP`, `feedback-widget-js`
3. **Permissions → Repository permissions → Contents : Read-only** (c'est la seule nécessaire ;
   *Metadata: Read* s'ajoute tout seul)
4. Collez le jeton derrière l'icône de clé dans l'application.

Le jeton reste dans le `localStorage` de ce navigateur. Il n'y a pas de serveur intermédiaire, aucun
script tiers n'est chargé, et rien n'est envoyé ailleurs que vers `api.github.com`. Un jeton
*fine-grained* limité à la lecture du contenu ne peut rien casser s'il fuite : révoquez-le et
c'est fini. Évitez malgré tout un jeton classique à portée `repo`, qui donne l'écriture.

## Reprendre un dépôt sans le saisir

Tout dépôt qui s'ouvre sans erreur entre dans une liste de reprise, du plus récent au plus ancien
(douze au maximum, réglable par `MAX_RECENTS`). Le chevron du champ de saisie ouvre cette liste :
un clic sur une ligne recharge le dépôt, la croix l'en retire. Taper dans le champ restreint la
liste à ce qui correspond.

Elle vit dans le stockage local et ne coûte aucune requête. C'est aussi le seul moyen simple de
mélanger des dépôts de **comptes GitHub différents** : un jeton *fine-grained* est rattaché à un
seul propriétaire, donc aucun appel d'API ne saurait lister d'un coup les dépôts de plusieurs
comptes. La liste, elle, retient des noms complets `proprietaire/depot` et s'en moque.

Raccourci pratique : `https://…/couloirs/?repo=proprietaire/depot` ouvre directement un dépôt,
ce qui fait un bon marque-page par projet. L'application inscrit d'elle-même le dépôt affiché dans
l'URL de l'onglet : chaque onglet garde donc son propre dépôt, et un rafraîchissement rejoue bien
celui-là. Le jeton, lui, est partagé par tous les onglets du navigateur.

## Refermer la feuille de détail

Un commit touché ouvre une feuille par le bas. Elle se referme de quatre façons : le bouton
**Retour** d'Android, un **glissement vers le bas** depuis la poignée (au-delà de `SHEET_CLOSE_PX`),
un clic sur le fond assombri, ou la touche **Échap**.

Pas de croix en haut à droite : Material réserve la croix aux boîtes de dialogue et recommande la
poignée pour les feuilles du bas. Encore faut-il que la poignée tienne sa promesse — sinon le doigt
glisse jusqu'au bord haut de l'écran et déclenche le « tirer pour rafraîchir ». Celui-ci est coupé
par `overscroll-behavior-y` posé sur `html` : sur le seul `body`, la valeur n'est pas propagée au
viewport et ne sert à rien.

## Comment le graphe est construit

Trois étapes, toutes côté navigateur.

**1. Récupération.** `GET /repos/{o}/{r}/branches`, puis `GET /commits?sha={branche}` pour chaque
branche cochée, en cinq requêtes parallèles. Chaque commit renvoyé porte déjà la liste de ses
parents : c'est tout le graphe orienté acyclique, il n'y a rien à reconstituer. Les doublons entre
branches sont fusionnés par empreinte.

**2. Mise en ordre.** Tri topologique par l'algorithme de Kahn, où le prochain commit sortant est
toujours le plus récent parmi ceux devenus disponibles. Cela garantit qu'un parent apparaît toujours
sous ses enfants — l'équivalent de `git log --topo-order --date-order`. Un tri par date seule suffirait
presque, mais casse dès qu'une horloge de machine est décalée.

**3. Affectation des couloirs.** Un tableau `lanes[]` où chaque case retient l'empreinte attendue
dans cette colonne. Pour chaque commit, du plus récent au plus ancien :

- on cherche le couloir qui l'attendait ; sinon on en ouvre un ;
- ce couloir se libère, le commit y est posé ;
- son premier parent reprend le même couloir, sauf s'il est déjà attendu ailleurs — auquel cas
  le couloir se referme et un trait part en biais ;
- les parents suivants (fusions) rejoignent leur couloir existant, ou en ouvrent un nouveau.

La réservation par empreinte donne l'invariant qui rend le dessin lisible : **un trait ne traverse
jamais la pastille d'un commit étranger**. C'est ce qui permet de coucher la courbe juste sous le
commit source plutôt que juste avant sa cible, et donc de garder les colonnes droites.

Vérifié sur 200 dépôts synthétiques et sur des dépôts réels : ordre respecté, aucune collision de
case, aucune arête traversante.

## Réglages

En tête de `index.html` :

```js
const ROW = 54;        // hauteur d'une ligne, en pixels
const PAD = 13;        // marge à gauche du premier couloir
const DOT = 4.6;       // rayon des pastilles
const MAX_GUTTER = 132;// largeur maximale réservée au graphe
const COLORS = [...];  // palette cyclique des couloirs
```

Les traits se resserrent quand les branches se multiplient, puis la colonne de texte cède du terrain.
Au-delà d'une dizaine de branches simultanées, mieux vaut en décocher dans le sélecteur de branches.

## Limites connues

- Un commit sans aucun parent chargé porte un pointillé : son histoire continue au-delà de la
  profondeur demandée. « Charger 100 commits de plus » descend d'un cran.
- Les étiquettes ne sont lues que sur les 100 dernières.
- Les branches sont limitées aux 300 premières renvoyées par l'API.
- Aucune écriture : c'est un lecteur, pas un client Git.
