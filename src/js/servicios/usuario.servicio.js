import Usuario from "../entidades/Usuario";
import LoginServicio from "./login.servicio";

export default class UsuarioServicio {

    /**@private @type {UsuarioServicio | null} */
    static _instance = null;

    /** @type {Usuario | null} */
    usuario = null;

    constructor() {
        const username = localStorage.getItem("username");
        const id = localStorage.getItem("id");

        if (username !== null && id !== null) {
            this.usuario = new Usuario();
            this.usuario.username = username;
            this.usuario.id = Number(id);
        }
    }

    obtenerIdUsuario() {
        if (this.estaAutenticado()) {
            return this.obtenerUsuario().id;
        }

        return -1; //que no esta logueado
    }

    /**
     * @returns {UsuarioServicio}
     */
    static obtenerInstancia() {
        if (UsuarioServicio._instance === null) {
            UsuarioServicio._instance = new UsuarioServicio();
        }
        return UsuarioServicio._instance;
    }

    /**@param {Usuario} usuario */
    guardarUsuario(usuario) {
        if (!(usuario instanceof Usuario)) { throw new Error("El objeto proporcionado no es una instancia de Usuario"); }
        this.usuario = usuario;
    }

    /**
     * @returns {Usuario}
     * @throws {Error}
     */
    obtenerUsuario() {
        if (this.usuario === null) { throw new Error("No hay un usuario activo"); }
        return this.usuario;
    }

    estaAutenticado() {
        return this.usuario !== null;
    }

    async cerrarSesion() {
        if (this.usuario === null) { throw new Error("No hay un usuario activo para cerrar sesión"); }

        const servicio = LoginServicio.obtenerInstancia();

        await servicio.cerrarSesion();

        this.usuario = null;
        localStorage.removeItem("username");
        localStorage.removeItem("auth_token");
    }

}