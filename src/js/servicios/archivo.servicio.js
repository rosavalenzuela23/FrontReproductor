import Ambiente from "../../utilidades/Ambiente";
import Archivo from "../entidades/Archivo";
import UsuarioServicio from "./usuario.servicio";

export default class ArchivoServicio {

    /**@private @type {ArchivoServicio | null} */
    static _instance = null;

    /** @type {Worker | null} */
    webworker = null;

    /** @type {UsuarioServicio | null} */
    usuarioServicio = null;

    /**@type {String} */
    apiUrl;

    constructor() {
        this.usuarioServicio = UsuarioServicio.obtenerInstancia();
        this.webworker = new Worker(new URL("/src/utilidades/SubirArchivio.worker.js", import.meta.url), {
            type: "module"
        });
        this.webworker.onmessage = e => this._mensajeRecibido(e);
        this.apiUrl = Ambiente.obtenerInstancia().variables.url;
    }

    _mensajeRecibido(e) {
        console.log(e.data);
    }

    /**
     * 
     * @param {*} data 
     * @param {Function} callback 
     */
    subirArchivo(data, callback) {
        if (this.webworker === null) { throw new Error('El webworker no se inicializo o esta cerrado') }
        this.webworker.onmessage = e => callback(e.data);
        debugger;
        this.webworker.postMessage(data);
    }

    /**
     * @returns {ArchivoServicio}
     */
    static obtenerInstancia() {
        if (ArchivoServicio._instance === null) {
            ArchivoServicio._instance = new ArchivoServicio();
        }
        return ArchivoServicio._instance;
    }

    /**
     * 
     * @param {String} id 
     */
    async eliminarArchivo(id) {
        const res = await fetch(`${this.apiUrl}archivo/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        if (!res.ok) {
            throw new Error("No se pudo eliminar el archivo");
        }
    }

    /**
     * 
     * @param {String} nombreArchivo 
     * @param {String} titulo 
     * @param {String} descripcion 
     */
    async actualizarArchivo(nombreArchivo, titulo, descripcion) {

        const res = await fetch(`${this.apiUrl}archivo`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ nombreArchivo, titulo, descripcion })
        });

        if (!res.ok) {
            throw new Error("No se pudo actualizar el archivo");
        }

        return;
    }

    /**
     * 
     * @param {string} id 
     * @returns {Promise<Archivo>}
     */
    async obtenerInformacionDelArchivo(id) {
        const res = await fetch(`${this.apiUrl}archivo/${id}`, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            throw new Error("No se pudo obtener la informacion del archivo");
        }

        const json = await res.json();
        return json;
    }

    /**
     * @param {string} nombreUsuario
     * @param {number} pagina
     * @param {number} cantidad
     * @returns {Promise<Archivo[]>}
     */
    async obtenerLosArchivosDeUsuario(nombreUsuario, pagina, cantidad) {
        if (!pagina || !cantidad) {
            throw new Error("La pagina y la cantidad son obligatorias");
        }

        const url = `${this.apiUrl}archivo/usuario/${nombreUsuario}?pagina=${pagina}&cantidad=${cantidad}`
        const res = await fetch(url, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            throw new Error(`Error al obtener los archivos del usuario ${nombreUsuario}: ${res.statusText}`);
        }

        const archivos = /**@type {Archivo[]} */ (await res.json());
        return archivos;
    }

    /**
     * @param {number} numeroPagina
     * @param {number} cantidadPagina
     * @returns {Promise<Archivo[]>}
     * @throws {Error}
     */
    async obtenerPaginaDeArchivos(numeroPagina, cantidadPagina) {

        const url = `${this.apiUrl}archivo?pagina=${numeroPagina}&cantidad=${cantidadPagina}`;

        const res = await fetch(url, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            throw new Error("No se pudieron obtener los archivos paginados");
        }

        const archivos = /**@type {Archivo[]} */ (await res.json());
        return archivos;
    }

    async obtenerArchivosPorQuery(nombre, descripcion, pagina, cantidad) {
        if (!pagina || !cantidad) {
            throw new Error("La pagina y la cantidad son obligatorias");
        }

        const url = `${this.apiUrl}archivo/query?titulo=${nombre}&descripcion=${descripcion}`
            + `&pagina=${pagina}&cantidad=${cantidad}`;

        const res = await fetch(url, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            throw new Error("No se pudieron obtener los archivos por query");
        }

        return await res.json();
    }

    obtenerMIMEsPermitidos() {
        return [
            'video/mp4',
            'video/webm',
            'video/ogg',
            'audio/mp3',
            'audio/mp4',
            'audio/ogg',
            'audio/mpeg',
        ];
    }

}