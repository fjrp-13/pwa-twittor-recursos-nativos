class Camara {
    constructor(videoNode) {
        this.videoNode = videoNode;
        console.log('camara Class inicializada');
    }

    encender() {
        if (!navigator.mediaDevices) {
            console.log('Navegador incompatible con mediaDevices');
            return false;
        }

        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { width: '300px', height: '300px' }
        }).then(stream => {
            this.videoNode.srcObject = stream;
            this.stream = stream;
        });
    }

    apagar() {
        if (!navigator.mediaDevices) {
            console.log('Navegador incompatible con mediaDevices');
            return false;
        }

        // Detiene el "videoNode"
        this.videoNode.pause();
        // Detiene el "stream"
        if (this.stream) {
            // getTracks()[0] hace referencia al Video (no al audio, pero como el audio no está activo, no hace falta detenerlo)
            this.stream.getTracks()[0].stop();
        }

    }

    tomarFoto() {
        // Crear un elemento canvas para renderizar en él la foto
        let canvas = document.createElement('canvas');
        // Definir las dimensiones del canvas
        canvas.setAttribute('width', 300);
        canvas.setAttribute('height', 300);

        // Obtener el contexto del canvas
        let context = canvas.getContext('2d'); // una imagen simple
        // Dibujar/renderizar la imagen dentro del canvas ( de la posición 0,0 a la width, heigth del canvas)
        context.drawImage(this.videoNode, 0, 0, canvas.width, canvas.height);
        // Generará un string en Base64
        this.foto = context.canvas.toDataURL();
        // Limpieza/reseteo
        canvas = null;
        context = null;

        return this.foto;
    }
}