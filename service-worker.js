// Service Worker: hace que el regalo funcione sin internet después de la
// primera visita (guarda una copia de todo lo que se va viendo).
const CACHE_NAME = 'regalo-zabdi-v1';

const ARCHIVOS_BASE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './contenido.js',
    './manifest.json',
];

// Al instalar: guardamos de una vez los archivos base (HTML/CSS/JS)
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ARCHIVOS_BASE))
            .catch((err) => console.log('Service worker: no se pudo precachear todo', err))
    );
    self.skipWaiting();
});

// Al activar: borramos versiones viejas del caché si las hubiera
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((nombres) =>
            Promise.all(
                nombres
                    .filter((nombre) => nombre !== CACHE_NAME)
                    .map((nombre) => caches.delete(nombre))
            )
        )
    );
    self.clients.claim();
});

// Estrategia: primero red (para tener siempre lo más nuevo si hay internet),
// y si falla (sin internet), usamos lo que ya esté guardado en caché.
// Cada archivo que se ve con éxito (fotos, videos, audios) se va guardando
// automáticamente para la próxima vez que se abra sin señal.
self.addEventListener('fetch', (evento) => {
    if (evento.request.method !== 'GET') return;

    evento.respondWith(
        fetch(evento.request)
            .then((respuestaRed) => {
                const copia = respuestaRed.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(evento.request, copia));
                return respuestaRed;
            })
            .catch(() => caches.match(evento.request))
    );
});
