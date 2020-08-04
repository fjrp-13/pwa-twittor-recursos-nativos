// Libreria con la lógica necesaria para almacenar en IndexedDB
// Utilidades para grabar PouchDB o IndexedDB
const db = new PouchDB('mensajes');

function guardarMensaje(mensaje) {
    mensaje._id = new Date().toISOString();
    return db.put(mensaje).then(() => {
        console.log('Mensaje guardado para su posterior Posteo');
        // Registramos la tarea de posteo asíncrono
        self.registration.sync.register('nuevo-post'); // Le asignamos el "tag" 'nuevo-post'
        // Generamos una nueva respuesta para que la procese nuestra aplicación
        const newResp = {
            success: true,
            offline: true
        };

        return new Response(JSON.stringify(newResp));
    });
}


// Postear Mensajes a la API
// Sin parámetros pq todos los datos los tenemos almacenados en el PouchDB o en el IndexedDB
function postearMensajes() {

    // Array para guardar cada uno de los posteos en formato de promesa
    const arrPosteos = [];

    // Barrer todos los docs que tenemos en la BD local
    db.allDocs({ include_docs: true }).then(docs => {
        docs.rows.forEach(row => {
            const doc = row.doc;
            // Guardar el resultado del posteo como Promesa
            const promesaFetch = fetch('api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(doc)
            }).then(res => {
                // Realizó el posteo...
                // ... borrar el doc de la BD para que no lo vuelva a procesar en otro "sync"
                return db.remove(doc);
            });
            // Añadir la promesa del posteo al array de promesas
            arrPosteos.push(promesaFetch);
        });

        // Devolver todas las promesas
        return Promise.all(arrPosteos);
    });
}