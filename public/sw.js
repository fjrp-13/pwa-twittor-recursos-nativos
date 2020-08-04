// imports
importScripts('https://cdn.jsdelivr.net/npm/pouchdb@7.1.1/dist/pouchdb.min.js'); // Lo importamos/referenciamos aquí, pq la utilizaremos en el SW, y el SW corre en su instancia totalmente separada e independiente de la aplicación
importScripts('js/sw-db.js');
importScripts('js/sw-utils.js');


const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v1';
const INMUTABLE_CACHE = 'inmutable-v1';


const APP_SHELL = [
    '/',
    'index.html',
    'css/style.css',
    'img/favicon.ico',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/spiderman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg',
    'js/app.js',
    'js/sw-utils.js',
    'js/libs/plugins/mdtoast.min.css',
    'js/libs/plugins/mdtoast.min.js'
];

const APP_SHELL_INMUTABLE = [
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    'https://use.fontawesome.com/releases/v5.3.1/css/all.css',
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
    'https://cdn.jsdelivr.net/npm/pouchdb@7.1.1/dist/pouchdb.min.js'
];



self.addEventListener('install', e => {


    const cacheStatic = caches.open(STATIC_CACHE).then(cache =>
        cache.addAll(APP_SHELL));

    const cacheInmutable = caches.open(INMUTABLE_CACHE).then(cache =>
        cache.addAll(APP_SHELL_INMUTABLE));



    e.waitUntil(Promise.all([cacheStatic, cacheInmutable]));

});


self.addEventListener('activate', e => {

    const respuesta = caches.keys().then(keys => {

        keys.forEach(key => {

            if (key !== STATIC_CACHE && key.includes('static')) {
                return caches.delete(key);
            }

            if (key !== DYNAMIC_CACHE && key.includes('dynamic')) {
                return caches.delete(key);
            }

        });

    });

    e.waitUntil(respuesta);

});


self.addEventListener('fetch', e => {
    let respuesta;
    if (e.request.url.includes('/api')) {
        // Para la llamada a la api usaremos la estrategia: Network with cache fallback/updata
        respuesta = manejoApiMensajes(DYNAMIC_CACHE, e.request);
    } else {
        respuesta = caches.match(e.request).then(res => {

            if (res) {
                // Cache with Network update
                actualizaCacheStatico(STATIC_CACHE, e.request, APP_SHELL_INMUTABLE);
                return res;
            } else {

                return fetch(e.request).then(newRes => {

                    return actualizaCache(DYNAMIC_CACHE, e.request, newRes);

                });

            }
        });
    }

    e.respondWith(respuesta);

});


// Tareas asíncronas
self.addEventListener('sync', e => {
    // console.log('SW: Sync');
    if (e.tag === 'nuevo-post') {
        // Postear a BD cuando hay conexión
        const promesasPosteos = postearMensajes();

        // Esperar a que se resuelvan todas las promesas
        e.waitUntil(promesasPosteos);

    }
});

// Escuchar PUSH
self.addEventListener('push', e => {
    // console.log('SW: Push');
    // console.log(e.data.text());
    const data = JSON.parse(e.data.text());
    // console.log('>>>>>>>>>>>>>>>>>>>>');
    // console.log(data);
    // console.log("<<<<<<<<<<<<<<<<<<<< 222");
    const title = data.titulo;
    const options = {
        body: data.cuerpo,
        //icon: 'img/icons/icon-72x72.png',
        icon: `img/avatars/${data.usuario}.jpg`,
        badge: 'img/favicon.ico',
        image: 'https://datainfox.com/wp-content/uploads/2017/10/avengers-tower.jpg',
        vibrate: [125, 75, 125, 275, 200, 275, 125, 75, 125, 275, 200, 600, 200, 600],
        openUrl: '/',
        data: {
            //url: 'https://google.com',
            url: '/',
            id: data.usuario
        },
        actions: [{
            action: 'thor-action',
            title: 'Thor',
            icon: 'img/avatar/thor.jpg'
        }, {
            action: 'spiderman-action',
            title: 'Spiderman',
            icon: 'img/avatar/spiderman.jpg'
        }]
    };

    // Como toda acción en el service worker, necesitamos esperar a que termine de realizar todo el envío de la notificación push (pq puede demorar un tiempo)
    e.waitUntil(self.registration.showNotification(title, options));
})


// Eventos de notificaciones: 
// ... notificación cerrada
self.addEventListener('notificationclose', function(e) {
    console.log('notificationclose');
});
// ... notificación clickada
self.addEventListener('notificationclick', function(e) {
    console.log("notificationclick");
    // // obtenemos la notificación
    const notificacion = e.notification;
    // obtenemos la acción/botón que el usuario pulsó
    const accion = e.action;
    console.log({ notificacion, accion });

    // "clients" es un objeto que hace referencia a todos los TABS (p.e.) que están abiertos
    const resp = clients.matchAll() // Todos los tabs abiertos de mi aplicación
        .then(clientes => {
            // clientes es un array con todos los tabs abiertos de la aplicación
            // Buscamos el cliente que está visible
            let cliente = clientes.find(clte => {
                return clte.visibilityState === 'visible'
            });

            // Mirar si nos ha devuelto algún cliente "visible"...
            if (cliente !== undefined) {
                // Abrimos la URL de nuestra aplicación  en el cliente "visible" y le damos el foco
                cliente.navigate(notificacion.data.url);
                cliente.focus();
            } else {
                // No se ha encontrado ningún cliente "visible", abrimos un nuevo tab con la URL de nuestra aplicación
                clients.openWindow(notificacion.data.url);
            }
            // Cerrar la notificación
            return notificacion.close();
        });

    // Como el "matchAll de clientes" devuelve una promesa (then), lo asignamos a una variable/constante (resp) y 
    // hacemos que el evento (notificationclick) no termine hasta que haya resuelto todas las acciones
    e.waitUntil(resp);
});

// self.onnotificationclick = function(event) {
//     console.log('On notification click: ', event.notification.tag);
// }