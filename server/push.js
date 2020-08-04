const fs = require('fs');

const urlsafeBase64 = require('urlsafe-base64');
const vapid = require('./vapid.json');
const webpush = require('web-push');

// Configuración del web-push
webpush.setVapidDetails(
    'mailto:frivilla@bsn.cat',
    vapid.publicKey,
    vapid.privateKey
);

// Hay que asegurarse que el archivo "subs-db.json" contenga valores o un array vacío []
let subscripciones = require('./subs-db.json');

module.exports.getKey = () => {
    return urlsafeBase64.decode(vapid.publicKey);
};

module.exports.addSubscription = (subscripcion) => {
    subscripciones.push(subscripcion);
    console.log("addSubscription - subscripciones");
    console.log(subscripciones);
    // Guardar las subscripciones en un archivo JSON
    fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(subscripciones));
};

// El parámetro "post" es la información que queremos enviar a la notificación a través del "push"
module.exports.sendPush = (post) => {
    console.log('push.js - sendPush');
    let notificacionesEnviadas = [];
    // console.log("Post:");
    // console.log(JSON.stringify(post));
    subscripciones.forEach((subscripcion, i) => {
        // console.log(`Subscripción ${ i }`);
        // console.log(subscripcion);
        const prushPromesas = webpush.sendNotification(subscripcion, JSON.stringify(post))
            .then(console.log('notificación enviada'))
            .catch(err => {
                console.log('notificación falló');
                if (err.statusCode === 410) { // GONE: ya no existe
                    subscripciones[i].borrar = true; // Añadimos a la subscripción que ya no existe la propiedad "borrar" a true, para, al acabar de procesar el array, volver a procesarlo y eliminar las marcadas
                }
            });
        notificacionesEnviadas.push(prushPromesas);
    });

    Promise.all(notificacionesEnviadas).then(() => {
        console.log("Borramos las subscripciones");
        // Eliminamos las subscripciones con la propiedad borrar, filtrando las que no tienen esa propiedad
        subscripciones = subscripciones.filter(subs => !subs.borrar);
        // Guardar las subscripciones en un archivo JSON
        fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(subscripciones));

    });
};

module.exports.sendPushNew = (post) => {
    console.log('sendPush New');
    console.log("Post:");
    console.log(JSON.stringify(post));
    let promiseChain = Promise.resolve();
    subscripciones.forEach((subscripcion, i) => {
        promiseChain = promiseChain.then(() => {
            return triggerPushMsg(subscripcion, JSON.stringify(post));
        });
    });
    return promiseChain;
}

const triggerPushMsg = function(subscription, dataToSend) {
    return webpush.sendNotification(subscription, dataToSend)
        .catch((err) => {
            console.log(err);
            // if (err.statusCode === 404 || err.statusCode === 410) {
            //     console.log('Subscription has expired or is no longer valid: ', err);
            //     //return deleteSubscriptionFromDatabase(subscription._id);
            //     throw err;
            // } else {
            //     throw err;
            // }
        });
};