var url = window.location.href;
var swLocation = '/twittor/sw.js';
// Registro del ServiceWorker
var swReg;

if (navigator.serviceWorker) {


    if (url.includes('localhost')) {
        swLocation = '/sw.js';
    }

    // Registramos el serviceworker cuando el servidor ha cargado la página web ya está cargada
    window.addEventListener('load', function() {
        navigator.serviceWorker.register(swLocation).then(function(reg) {
            // Guardamos el registro del ServiceWorker, para cuando tengamos que trabajar con él, que trabajemos con el mismo registro que hemos registrado.
            swReg = reg;
            swReg.pushManager.getSubscription().then(verificaSubscripcion);
        });
    })

}


// Referencias de jQuery
var googleMapKey = 'AIzaSyA5mjCwx1TRLuBAjwQw84WE6h5ErSe7Uj8';

// Google Maps llaves alternativas - desarrollo
// AIzaSyDyJPPlnIMOLp20Ef1LlTong8rYdTnaTXM
// AIzaSyDzbQ_553v-n8QNs2aafN9QaZbByTyM7gQ
// AIzaSyA5mjCwx1TRLuBAjwQw84WE6h5ErSe7Uj8
// AIzaSyCroCERuudf2z02rCrVa6DTkeeneQuq8TA
// AIzaSyBkDYSVRVtQ6P2mf2Xrq0VBjps8GEcWsLU
// AIzaSyAu2rb0mobiznVJnJd6bVb5Bn2WsuXP2QI
// AIzaSyAZ7zantyAHnuNFtheMlJY1VvkRBEjvw9Y
// AIzaSyDSPDpkFznGgzzBSsYvTq_sj0T0QCHRgwM
// AIzaSyD4YFaT5DvwhhhqMpDP2pBInoG8BTzA9JY
// AIzaSyAbPC1F9pWeD70Ny8PHcjguPffSLhT-YF8

var titulo = $('#titulo');
var nuevoBtn = $('#nuevo-btn');
var salirBtn = $('#salir-btn');
var cancelarBtn = $('#cancel-btn');
var postBtn = $('#post-btn');
var avatarSel = $('#seleccion');
var timeline = $('#timeline');

var modal = $('#modal');
var modalAvatar = $('#modal-avatar');
var avatarBtns = $('.seleccion-avatar');
var txtMensaje = $('#txtMensaje');

var btnActivadas = $('.btn-noti-activadas');
var btnDesactivadas = $('.btn-noti-desactivadas');

var btnLocation = $('#location-btn');

var modalMapa = $('.modal-mapa');

var btnTomarFoto = $('#tomar-foto-btn');
var btnPhoto = $('#photo-btn');
var contenedorCamara = $('.camara-contenedor');

var lat = null;
var lng = null;
var foto = null;

// El usuario, contiene el ID del hÃ©roe seleccionado
var usuario;

// Init de la camara class
// document.getElementById('player');
const camara = new Camara($('#player')[0]);



// ===== Codigo de la aplicación

function crearMensajeHTML(mensaje, personaje, lat, lng, foto) {

    var content = `
    <li class="animated fadeIn fast"
        data-tipo="mensaje"
        data-mensaje="${ mensaje }"
        data-user="${ personaje }">

        <div class="avatar">
            <img src="img/avatars/${ personaje }.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${ personaje }</h3>
                <br/>
                ${ mensaje }
      `;

    if (foto) {
        content += `
                <br>
                <img class="foto-mensaje" src="${ foto }">
        `;
    }

    content += `</div>        
                <div class="arrow"></div>
            </div>
        </li>
    `;


    // si existe la latitud y longitud, 
    // llamamos la funcion para crear el mapa
    if (lat) {
        crearMensajeMapa(lat, lng, personaje);
    }

    // Borramos la latitud y longitud por si las usó
    lat = null;
    lng = null;
    foto = null;
    console.log("lat lng borrados");

    $('.modal-mapa').remove();

    timeline.prepend(content);
    cancelarBtn.click();

}


function crearMensajeMapa(lat, lng, personaje) {


    let content = `
    <li class="animated fadeIn fast"
        data-tipo="mapa"
        data-user="${ personaje }"
        data-lat="${ lat }"
        data-lng="${ lng }">
                <div class="avatar">
                    <img src="img/avatars/${ personaje }.jpg">
                </div>
                <div class="bubble-container">
                    <div class="bubble">
                        <iframe
                            width="100%"
                            height="250"
                            frameborder="0" style="border:0"
                            src="https://www.google.com/maps/embed/v1/view?key=${ googleMapKey }&center=${ lat },${ lng }&zoom=17" allowfullscreen>
                            </iframe>
                    </div>
                    
                    <div class="arrow"></div>
                </div>
            </li> 
    `;

    timeline.prepend(content);
}



// Globals
function logIn(ingreso) {

    if (ingreso) {
        nuevoBtn.removeClass('oculto');
        salirBtn.removeClass('oculto');
        timeline.removeClass('oculto');
        avatarSel.addClass('oculto');
        modalAvatar.attr('src', 'img/avatars/' + usuario + '.jpg');
    } else {
        nuevoBtn.addClass('oculto');
        salirBtn.addClass('oculto');
        timeline.addClass('oculto');
        avatarSel.removeClass('oculto');

        titulo.text('Seleccione Personaje');

    }

}


// Seleccion de personaje
avatarBtns.on('click', function() {

    usuario = $(this).data('user');

    titulo.text('@' + usuario);

    logIn(true);

});

// Boton de salir
salirBtn.on('click', function() {

    logIn(false);

});

// Boton de nuevo mensaje
nuevoBtn.on('click', function() {

    modal.removeClass('oculto');
    modal.animate({
        marginTop: '-=1000px',
        opacity: 1
    }, 200);

});

// Boton de cancelar mensaje
cancelarBtn.on('click', function() {
    if (!modal.hasClass('oculto')) {
        modal.animate({
            marginTop: '+=1000px',
            opacity: 0
        }, 200, function() {
            modal.addClass('oculto');
            txtMensaje.val('');
        });
    }
});

// Boton de enviar mensaje
postBtn.on('click', function() {

    var mensaje = txtMensaje.val();
    if (mensaje.length === 0) {
        cancelarBtn.click();
        return;
    }
    // console.log('lat', lat);
    // console.log('lng', lng);
    var data = {
        mensaje: mensaje,
        user: usuario,
        lat: lat,
        lng: lng,
        foto: foto
    };
    console.log(data);
    fetch('api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(res => console.log('app.js', res))
        .catch(err => console.log('app.js - error', err));

    crearMensajeHTML(mensaje, usuario, lat, lng, foto);
    lat = null;
    lng = null;
    foto = null;

});

// Obtener mensajes del servicor (consumir mi servicio REST)
function getMensajes() {
    fetch('api')
        .then(res => res.json())
        .then(posts => {
            console.log(posts);
            posts.forEach(post => {
                crearMensajeHTML(post.mensaje, post.user, post.lat, post.lng);
            });
        });
}

getMensajes();


// Detectar cambios de conexión desde el FrontEnd
function isOnline() {
    if (navigator.onLine) {
        // Hay conexión
        mdtoast('Online', {
            interaction: true,
            interactionTimeout: 1000,
            actionText: 'OK!'
        });
    } else {
        // Sin conexión
        mdtoast('Offline', {
            interaction: true,
            actionText: 'OK!',
            type: 'warning'
        });
    }
}

// Añadir listeners para escuchar los cambios de conexión
window.addEventListener('online', isOnline);
window.addEventListener('offline', isOnline);
isOnline(); // Para que la app la "ejecute" al entrar


// Notificaciones:
// Mostrar / ocultar los botones de "Notificaciones activadas/desactivadas"
function verificaSubscripcion(activadas) {
    if (activadas) {
        btnActivadas.removeClass('oculto');
        btnDesactivadas.addClass('oculto');
    } else {
        btnDesactivadas.removeClass('oculto');
        btnActivadas.addClass('oculto');
    }
}
// verificaSubscripcion(); --> Ahora se hace arriba, en el registro del "eventListener" para el "load" de la página

// Prueba
function enviarNotification(texto) {
    const notificationOpts = {
        body: 'Este es el cuerpo de la notificación',
        icon: 'img/icons/icon-72x72.png'
    };
    const notif = new Notification(texto, notificationOpts);

    notif.onclick = function() {
        console.log('Notificación on click');
    };
}

// Petición de permiso de notificaciones
function solicitarPermisoNotificacion() {
    // profesor: function notificarme()
    // Verificar si el browser soporta notificaciones
    if (!window.Notification) {
        console.log('Este navegador no soporta notificaciones');
        return;
    }

    if (Notification.permission === 'granted') {
        // Ya tenemos permiso para notificaciones
        //new Notification('Hola Mundo! - granted');
        enviarNotification('Hola Mundo! - granted');
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function(permission) {
            console.log(permission);
            if (permission === 'granted') {
                // El usuario aceptó las notificaciones
                //new Notification('Hola Mundo! - pregunta');
                enviarNotification('Hola Mundo! - pregunta')
            }
        });
    }
}
//solicitarPermisoNotificacion();

// Get Key
function getPublicKey() {
    // fetch('api/key')
    //     .then(res => res.text())
    //     .then(console.log);

    return fetch('api/key')
        .then(res => res.arrayBuffer())
        // retornar arreglo, pero como un Uint8array
        .then(key => new Uint8Array(key))
};

// getPublicKey().then(console.log);


function cancelarSubscripcion() {
    if (!swReg) {
        return console.log('No hay registro de SW');
    } else {
        // 1.- Obtener la subscripción actual...
        swReg.pushManager.getSubscription().then(subs => {
            // 2.- De-subscribir esa subscripción y "actualizar" la pagina con el "verificaSubscripcion"
            subs.unsubscribe().then(() => verificaSubscripcion(false));
        });
    }
};

btnDesactivadas.on('click', function() {
    // Verificamos que se exista el registro del SW
    if (!swReg) {
        return console.log('No hay registro de SW');
    } else {
        getPublicKey().then(function(key) {
            // creamos el registro en el SW
            swReg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: key
                }).then(res => res.toJSON())
                .then(subscripcion => {
                    console.log("Hacer subscripción");
                    console.log(JSON.stringify(subscripcion));
                    console.log(subscripcion);
                    // Hacer el posteo de la subscripción
                    fetch('/api/subscribe', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(subscripcion)
                        }).then(verificaSubscripcion)
                        .catch(cancelarSubscripcion)
                });
        });
    }
});


btnActivadas.on('click', function() {
    cancelarSubscripcion();
});



// Crear mapa en el modal
function mostrarMapaModal(lat, lng) {

    $('.modal-mapa').remove();

    var content = `
            <div class="modal-mapa">
                <iframe
                    width="100%"
                    height="250"
                    frameborder="0"
                    src="https://www.google.com/maps/embed/v1/view?key=${ googleMapKey }&center=${ lat },${ lng }&zoom=17" allowfullscreen>
                    </iframe>
            </div>
    `;

    modal.append(content);
}


// Sección 11 - Recursos Nativos


// Obtener la geolocalización
btnLocation.on('click', () => {

    // console.log('Botón geolocalización');
    if (!navigator.geolocation) {
        return false;
    }
    mdtoast('Cargando mapa... ', {
        interaction: true,
        interactionTimeout: 2000,
        actionText: 'Ok'
    })
    navigator.geolocation.getCurrentPosition(pos => {
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        mostrarMapaModal(lat, lng);
    });
});



// Boton de la camara
// usamos la funcion de fleca para prevenir
// que jQuery me cambie el valor del this
btnPhoto.on('click', () => {

    // console.log('Inicializar camara');
    contenedorCamara.removeClass('oculto');
    console.log('pre camara.encender');
    camara.encender();
    console.log('post camara.encender');

});


// Boton para tomar la foto
btnTomarFoto.on('click', () => {

    // console.log('Botón tomar foto');
    foto = camara.tomarFoto();
    camara.apagar();
    // console.log(foto);


});


// Share API
if (!navigator.share) {
    console.log('El navegador no soporta Share API');
}

timeline.on('click', 'li', function() {
    console.log('Click en LI');
    let tipo = $(this).data('tipo');
    let lat = $(this).data('lat');
    let lng = $(this).data('lng');
    let mensaje = $(this).data('mensaje');
    let user = $(this).data('user');

    console.log({ tipo, lat, lng, mensaje, user });

    // navigator.share({
    //         title: 'web.dev',
    //         text: 'Check out web.dev.',
    //         url: 'https://web.dev/',
    //     })
    //     .then(() => console.log('Successful share'))
    //     .catch((error) => console.log('Error sharing', error));

    const shareOpts = {
        title: user,
        text: mensaje
    };

    if (tipo === 'mapa') {
        shareOpts.text = 'mapa';
        shareOpts.url = `https://www.google.com/maps/@${lat},${lng},15z`;
    }

    navigator.share(shareOpts)
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
})