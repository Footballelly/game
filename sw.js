/* Football Legends — service worker : rend l'appli installable et la garde utilisable avec une connexion instable.
   Stratégie « réseau d'abord » : la dernière version en ligne gagne toujours, le cache ne sert qu'en secours. */
const CACHE = "fl-v34";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k!==CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if(req.method!=="GET" || url.origin!==location.origin) return;   // Supabase, polices, CDN : jamais mis en cache ici
  e.respondWith(fetch(req).then(res => { if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
});
