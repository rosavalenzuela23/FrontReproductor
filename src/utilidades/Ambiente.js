const variables = {
    isDev: true,
    development: {
        "url": "http://localhost:3000/api/"
    },
    production: {
        "url": "/api/"
    }
}

export default class Ambiente {

    /**
     * @type {Ambiente}
     */
    static _instancia;

    variables;

    constructor() {
        if (variables.isDev) {
            this.variables = variables.development;
            return;
        }
        this.variables = variables.production;
    }

    static obtenerInstancia() {
        if (!Ambiente._instancia) {
            Ambiente._instancia = new Ambiente();
        }
        return Ambiente._instancia;
    }



}