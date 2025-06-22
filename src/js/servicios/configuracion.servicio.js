
export default class ConfiguracionServicio {

    /**@type {ConfiguracionServicio | null} */
    static _instancia = null;

    /**@type {Number} */
    _volumen = 1;

    constructor() {
        const volumen = localStorage.getItem("volumen");
        if (volumen !== null) {
            this._volumen = Number(volumen);
        }
    }

    static obtenerInstancia() {
        if (ConfiguracionServicio._instancia === null) {
            ConfiguracionServicio._instancia = new ConfiguracionServicio();
        }
        return ConfiguracionServicio._instancia;
    }

    /**
     * @param {Number} cantidad
     */
    set volumen(cantidad) {
        this._volumen = cantidad;
        localStorage.setItem("volumen", String(this._volumen));
    }

    /**@returns {Number} */
    get volumen() {
        return this._volumen;
    }



}