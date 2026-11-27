/* Service worker de Gestión PrevFront: guarda la app para abrirla rápido y sin conexión.
   Las llamadas al servidor (IA, Excel) nunca se guardan en caché. */
var CACHE = 'iper-rapida-v30';
var ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'marca-inicio.webp'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return; // API y externos: directo a la red
  // Red primero (para recibir actualizaciones); si no hay conexión, usa la copia guardada
  e.respondWith(fetch(req).then(function (res) {
    var copia = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copia); });
    return res;
  }).catch(function () {
    return caches.match(req).then(function (r) { return r || caches.match('index.html'); });
  }));
});

// Al tocar un aviso ("Análisis listo", "Documentos listos"…), abre la app o la trae al frente
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
    for (var i = 0; i < l.length; i++) { if ('focus' in l[i]) return l[i].focus(); }
    return self.clients.openWindow ? self.clients.openWindow('./') : null;
  }));
});
