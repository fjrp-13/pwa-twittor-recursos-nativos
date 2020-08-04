// Guardar  en el cache dinamico
function actualizaCache(cacheName, req, res) {


    if (res.ok) {

        return caches.open(cacheName).then(cache => {

            cache.put(req, res.clone());

            return res.clone();

        });

    } else {
        return res;
    }

}

// Cache with network update
// @Params: nombre_de_la_cache, request_ arr_de_inmutables
function actualizaCacheStatico(cacheName, req, APP_SHELL_INMUTABLE) {

    if (APP_SHELL_INMUTABLE.includes(req.url)) {
        // No hace falta actualizar el inmutable
        // console.log('existe en inmutable', req.url );
    } else {
        // console.log('actualizando', req.url );
        return fetch(req)
            .then(res => {
                return actualizaCache(cacheName, req, res);
            });
    }

}

// Network with cache fallback/updata
function manejoApiMensajes(cacheName, req) {
    // Para evitar problemas, siempre es mejor clonar los request

    // Excepción para la subscripción, que no se debe guardar en caché: ni la Key ni el Subscribe, esas peticiones deberían "pasar directamente" (no se quiere hacer copia local en cache de la Key ni del Subscribe)
    if ((req.url.indexOf('/api/key') >= 0) || (req.url.indexOf('/api/subscribe') >= 0)) {
        return fetch(req);
    } else {
        // Controlar el POST de un nuevo mensaje
        if (req.clone().method === 'POST') {
            // Verificar si el SW dispone de las funciones asíncronas
            if (self.registration.sync) {
                return req.clone().text().then(body => {
                        //console.log(body);
                        const bodyObj = JSON.parse(body);
                        return guardarMensaje(bodyObj);
                    })
                    // Guardar en el indexedDB...
            } else {
                // Si no dispone de funciones asíncronas, dejamos pasar la operación y que sea el browser quién responda
                return fetch(req);
            }
        } else {

            // Trata de traer los msnajes más actualizados
            return fetch(req).then(res => {
                if (res.ok) {
                    actualizaCache(cacheName, req, res.clone());
                    return res.clone();
                } else {
                    // Retornamos lo que hay en la cache
                    return caches.match(req);
                }
            }).catch(err => { // p.e. No hay conexión a internet
                return caches.match(req);
            });
        }
    }
}