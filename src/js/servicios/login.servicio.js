import Ambiente from "../../utilidades/Ambiente";
import { $ } from "../../utilidades/objetos";
import Login from "../entidades/Login";
import Usuario from "../entidades/Usuario";
import UsuarioServicio from "./usuario.servicio";

export default class LoginServicio {

    /**@private @type {LoginServicio | undefined} */
    static _instancia;

    /**@private @type {String} */
    apiUrl;

    /** @type {UsuarioServicio?} */
    servicioUsuario = null;

    constructor() {
        this.servicioUsuario = UsuarioServicio.obtenerInstancia();
        this.apiUrl = Ambiente.obtenerInstancia().variables.url;
    }

    /**@returns {LoginServicio} */
    static obtenerInstancia() {
        if (!LoginServicio._instancia) {
            LoginServicio._instancia = new LoginServicio();
        }
        return LoginServicio._instancia;
    }

    /**
     * @param {String} usuario 
     * @param {String} contrasenia 
     */
    async iniciarSesion(usuario, contrasenia) {
        if (!usuario || !contrasenia) { throw new Error("El usuario y la contrasenia son obligatorios"); }

        const xhr = new XMLHttpRequest();
        xhr.open("POST", this.apiUrl + "usuario/login", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.withCredentials = true;

        const request = new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status === 201) {
                    resolve(xhr.response);
                } else {
                    reject(new Error(xhr.statusText));
                }
            };

            xhr.addEventListener("error", () => {
                reject(new Error("No se pudo iniciar la sesion"));
            });

            xhr.send(JSON.stringify({ usuario: usuario, contrasenia: contrasenia }));
        });

        const response = await request;

        const datosUsuario = /**@type {Login} */ JSON.parse(response);
        const usuarioObjeto = new Usuario();

        const username = datosUsuario.usuario?.username;
        const token = datosUsuario.auth_token;
        if (!token || token == null) { throw new Error("No se pudo obtener el token del usuario"); }
        if (!username || username == null) { throw new Error("No se pudo obtener el username del usuario"); }

        Object.assign(usuarioObjeto, datosUsuario.usuario);
        this.servicioUsuario?.guardarUsuario(usuarioObjeto);

        localStorage.setItem("auth_token", token);
        localStorage.setItem("username", username);
        localStorage.setItem("id", String(usuarioObjeto.id));

        return datosUsuario;
    }

    async cerrarSesion() {

        const xhr = new XMLHttpRequest();
        xhr.open("GET", this.apiUrl + "usuario/logout", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.withCredentials = true;

        const promise = new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(new Error(xhr.statusText));
                }
            };

            xhr.send();
        });

        await promise;
    }

}