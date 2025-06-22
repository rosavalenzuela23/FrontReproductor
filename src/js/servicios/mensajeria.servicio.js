export default class MensajeriaServicio {

    /**@private @type {MensajeriaServicio | undefined} */
    static _instancia = undefined;

    /**
     * 
     * @returns {MensajeriaServicio}
     */
    static obtenerInstancia() {
        if (!MensajeriaServicio._instancia) {
            MensajeriaServicio._instancia = new MensajeriaServicio();
        }

        return MensajeriaServicio._instancia;
    }

    /**
     * @argument {String} mensaje
     *  */
    mostrarMensajeDeError(mensaje) {
        alert(mensaje);
    }

    /**
     * @argument {String} mensaje
     *  */
    mostrarMensajeDeExito(mensaje) {
        alert(mensaje);
    }

}