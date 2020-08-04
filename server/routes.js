// Routes.js - Módulo de rutas
const express = require('express');
const router = express.Router();
const push = require('./push');


const arrMensajes = [{
    _id: 'XXX',
    user: 'Spiderman',
    mensaje: 'Hola Mundo 2'
}];

// Get mensajes
router.get('/', function(req, res) {
    //res.json('Obteniendo mensajes');
    res.json(arrMensajes);
});

// Post mensaje
router.post('/', function(req, res) {
    const mensaje = {
        mensaje: req.body.mensaje,
        user: req.body.user
    };
    arrMensajes.push(mensaje);
    console.log(arrMensajes);

    res.json({
        success: true,
        mensaje
    });
});


// Almacenar la suscripción
router.post('/subscribe', (req, res) => {
    const subscripcion = req.body;
    push.addSubscription(subscripcion);

    res.json('subscribe');
});

// Almacenar la suscripción
router.get('/key', (req, res) => {
    const key = push.getKey();


    res.send(key);

});


// Envar una notificación PUSH a las personas
// que nosotros queramos
// ES ALGO que se controla del lado del server
router.post('/push', (req, res) => {

    // Objeto con la notificación
    const post = {
        titulo: req.body.titulo,
        cuerpo: req.body.cuerpo,
        usuario: req.body.usuario
    };


    push.sendPush(post);

    res.json(post);

});


module.exports = router;