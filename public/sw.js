const CACHE = 'rios-baterias-v2';

// So cacheia recursos estaticos que nao precisam de autenticacao
const SHELL = [
  '/offline.html',
  '/consulta-offline.html',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // APIs: network-first, salva cache, fallback cache offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req.clone())
        .then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(req, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then(cached =>
            cached || new Response(JSON.stringify({ erro: 'offline' }), {
              headers: { 'Content-Type': 'application/json' },
            })
          )
        )
    );
    return;
  }

  // Paginas /consulta/*: network-first, salva cache
  // Se offline, serve cache ou redireciona para consulta-offline.html
  if (url.pathname.startsWith('/consulta/')) {
    const lojaId = url.pathname.split('/')[2] || '1';
    event.respondWith(
      fetch(req.clone())
        .then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(req, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then(cached =>
            cached ||
            caches.match('/consulta-offline.html').then(offlinePage => {
              if (offlinePage) {
                // Retorna a pagina offline com URL modificada para passar o lojaId
                return Response.redirect('/consulta-offline.html?loja=' + lojaId, 302);
              }
              return caches.match('/offline.html');
            })
          )
        )
    );
    return;
  }

  // Outros recursos: network-first, salva cache, fallback cache ou offline.html
  event.respondWith(
    fetch(req.clone())
      .then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(req, res.clone()));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => cached || caches.match('/offline.html'))
      )
  );
});
