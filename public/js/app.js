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

// El usuario, contiene el ID del hÃ©roe seleccionado
var usuario;




// ===== Codigo de la aplicaciÃ³n

function crearMensajeHTML(mensaje, personaje) {

    var content = `
    <li class="animated fadeIn fast">
        <div class="avatar">
            <img src="img/avatars/${ personaje }.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${ personaje }</h3>
                <br/>
                ${ mensaje }
            </div>
            
            <div class="arrow"></div>
        </div>
    </li>
    `;

    timeline.prepend(content);
    cancelarBtn.click();

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

    var data = {
        mensaje: mensaje,
        user: usuario
    }

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

    crearMensajeHTML(mensaje, usuario);

});

// Obtener mensajes del servicor (consumir mi servicio REST)
function getMensajes() {
    fetch('api')
        .then(res => res.json())
        .then(posts => {
            console.log(posts);
            posts.forEach(post => {
                crearMensajeHTML(post.mensaje, post.user);
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