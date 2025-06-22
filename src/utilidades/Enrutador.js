import CasaComponente from "../js/paginas/casa.componente.js";
import LoginComponente from "../js/paginas/login.componente.js";
import NotFoundComponente from "../js/paginas/notfound.componente.js";
import ReproductorComponente from "../js/paginas/reproductor.vista.js";
import UsuarioComponente from "../js/paginas/usuario.vista.js";
import ComponentePorDefecto from "./componente.js";
import { $ } from "./objetos.js";

export class Ruta {
    /**@type {string} */
    nombre;
    /**@type {string} */
    path;

    /**@type {typeof ComponentePorDefecto} */
    claseComponente;
    /**@private @type {ComponentePorDefecto | undefined} */
    _instancia = undefined;

    generarInstancia() {
        this._instancia = new this.claseComponente();
    }

    /**@returns {String} */
    obtenerNombreComponente() {
        return this._instancia?.obtenerNombreComponente() || "NOT FOUND";
    }

    obtenerInstancia() {
        if (!this._instancia || this._instancia === null) throw new Error("La ruta no se inicializo");
        return this._instancia;
    }

}

export class RutaSegregada {
    /**@type {string} */
    nombre;
    /**@type {string} */
    path;
    /**@type {typeof ComponentePorDefecto} */
    claseComponente;
}

export default class Enrutador {

    /**
     * @private
     * @type {RutaSegregada[]}
     *  */
    static rutas = [
        { nombre: "inicio", path: "/", claseComponente: CasaComponente },
        { nombre: "perfil", path: "/me", claseComponente: UsuarioComponente },
        { nombre: "login", path: "/login", claseComponente: LoginComponente },
        { nombre: "reproductor", path: "/reproductor", claseComponente: ReproductorComponente },
        { nombre: "404", path: "**", claseComponente: NotFoundComponente },
    ];

    /**@private @type {Ruta[]} */
    rutasInstancias = []

    /**@private @type {Enrutador | undefined} */
    static instancia = undefined;

    //http://localhost:3000/?pagina=1&cantidad=10 etc
    /**@private @type {String[]} */
    historial = []

    /**@private */
    rutaActual = this.historial.length;

    /**@private */
    subscriptores = [];

    obtenerWebComponentActual() {
        const url = new URL(window.location.href);
        const rutaActual = url.pathname;

        console.log(rutaActual)

        if (!rutaActual) {
            return this.obtenerWebComponentPorRuta("/");
        }

        const componenteActual = this.obtenerWebComponentPorRuta(rutaActual);
        return componenteActual
    }

    /**@returns {String} */
    obtenerWebComponentPorRuta(nombreRuta) {
        const ruta = this.rutasInstancias.find(r => r.path === nombreRuta);
        if (ruta) return ruta.obtenerInstancia().obtenerNombreComponente();

        const notFound = this.rutasInstancias.find(r => r.path === "**");
        if (!notFound) { throw new Error("La ruta 404 no fue creada") }

        //404
        return notFound.obtenerNombreComponente();
    }

    /**@returns {Enrutador} */
    static obtenerInstancia() {
        if (!Enrutador.instancia) {
            Enrutador.instancia = new Enrutador();
        }

        return Enrutador.instancia;
    }

    beforeEach(rutaNueva, params) {

    }

    afterEach(rutaNueva, params, opt) {

    }

    /**
     * Cambia de ruta y la agrega al historial
     * @param {String} rutaNueva
     * @param {Object?} params
     */
    push(rutaNueva, params = undefined) {
        this.beforeEach(rutaNueva, params);
        const ruta = this.rutasInstancias.find(ruta => ruta.path === rutaNueva);

        //Si la ruta no existe, se va a la 404
        if (!ruta) {
            this.push("**", params);
            return;
        };

        let finalUrl = ruta.path;
        if (params) {
            //TODO: refactorizar para entenderlo mejor
            finalUrl += `?${Object.keys(params).map(k => `${k}=${params[k]}`).join("&")}`
        }

        //ya que todo salio bien
        this.rutaActual += 1;

        window.history.pushState(params, "", finalUrl);
        this._showActualView(rutaNueva);

        this.afterEach(rutaNueva, params, finalUrl);
    }

    agregarSubscriptor(func) {
        this.subscriptores.push(func);
    }

    notificarSubscriptores(mensaje) {
        this.subscriptores.forEach(s => s(mensaje));
    }

    _showActualView(ruta) {
        const url = new URL(window.location.href);

        if (!url.pathname) {
            url.pathname = "/";
        }

        this.notificarSubscriptores(url.pathname);
    }

    /**
     * Este metodo permite que el bóton de regresar del navegador
     * o el bóton de regresar del mouse
     * funcionen y te carge el componente anterior
     * @param {PageSwapEvent} evento 
     * */
    _onPageTraverse(evento) {
        this.beforeEach();
        this._showActualView();
        this.afterEach();
    }

    _inicializarRutas() {
        Enrutador.rutas.forEach(ruta => {
            const instanciaRuta = new Ruta();
            instanciaRuta.nombre = ruta.nombre;
            instanciaRuta.path = ruta.path;
            instanciaRuta.claseComponente = ruta.claseComponente;

            instanciaRuta.generarInstancia();

            this.rutasInstancias.push(instanciaRuta);
        })
    }

    _onLoad() {
        //cargar la ruta anterior
        const url = new URL(window.location.href);
        const params = [...url.searchParams];
        const objParams = {}
        params.forEach(p => {
            //llave       //valor
            objParams[p[0]] = p[1];
        });

        this.push(url.pathname, objParams);
    }

    /**@private */
    constructor() {
        this._inicializarRutas();

        window.addEventListener("popstate", (evento) => {
            this._onPageTraverse(new PageSwapEvent("traverse"));
        });

        //obtenemos el historial
        //construir el historial
        //desde la url de accesso
        if (window.location.pathname !== "/") {
            this._onLoad();
        } else {
            this.push("/"); // cargar la ruta inicial
        }
    }

}