const CACHE = 'couloirs-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg',
               './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

//
// La page : le réseau fait foi, le cache ne sert que de secours hors ligne
//
// La copie de secours est toujours rangée sous './index.html', sans le paramètre ?repo=… : sinon
// chaque dépôt visité créerait sa propre entrée de cache, dont aucune ne servirait aux autres.
//

async function freshPage(request){
  let res;

  try{
    // Le réseau répond : une version fraîchement déployée arrive dès ce chargement

    res = await fetch(request);
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put('./index.html', copy));

  }catch(e){
    // Le réseau est indisponible : on est hors ligne

    // On ressort la dernière page mise en cache
    res = await caches.match('./index.html');
  }

  return res;
}

// Récupère un fichier sur le réseau et n'en garde une copie que s'il est exploitable.
async function fetchAndStore(request){
  const res = await fetch(request);

  if (res.ok){
    // Le réseau a renvoyé un fichier valide

    // On en garde une copie pour les prochaines fois

    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(request, copy));

  } else {
    // Le réseau a répondu une erreur (404, 5xx…)

    // On ne mémorise rien : un échec n'a pas à être resservi
  }

  return res;
}

// Les fichiers statiques (icônes, manifeste) changent rarement : le cache répond en premier.
async function cachedAsset(request){
  const hit = await caches.match(request);
  return hit || fetchAndStore(request);
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const ownAsset = e.request.method === 'GET' && url.origin === location.origin;

  if (e.request.mode === 'navigate'){
    // La requête demande la page elle-même : ouverture, rechargement ou lien

    // Le réseau d'abord, pour qu'une nouvelle version déployée arrive sans attendre
    e.respondWith(freshPage(e.request));

  } else if (ownAsset){
    // La requête vise un fichier de l'app (icône, manifeste…) ET ce n'est pas la page

    // Le cache d'abord : ces fichiers changent rarement
    e.respondWith(cachedAsset(e.request));

  } else {
    // La requête sort de l'app (api.github.com…) OU ce n'est pas un GET

    // On laisse faire le navigateur : les commits doivent rester frais, jamais mis en cache
  }
});
