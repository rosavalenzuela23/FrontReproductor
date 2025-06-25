import ComponentePorDefecto from "../../../src/utilidades/componente.js";
import Enrutador from "../../../src/utilidades/Enrutador.js";
import LoginServicio from "../servicios/login.servicio.js";
import MensajeriaServicio from "../servicios/mensajeria.servicio.js";
import UsuarioServicio from "../servicios/usuario.servicio.js";

const nombreComponente = "log-in";
export default class LoginComponente extends ComponentePorDefecto {

    constructor() {
        super();
        this.servicioLogin = LoginServicio.obtenerInstancia();
        this.servicioMensajeria = MensajeriaServicio.obtenerInstancia();
        this.attachShadow({ mode: 'open' });
    }

    obtenerNombreComponente() {
        return `<${nombreComponente}></${nombreComponente}>`;
    }

    connectedCallback() {

        const servicioUsuario = UsuarioServicio.obtenerInstancia();

        if (servicioUsuario.estaAutenticado()) {
            Enrutador.obtenerInstancia().push("/");
            return;
        }

        this.render();
    }

    disconnectedCallback() {

    }

    adoptedCallback() {

    }

    attributeChangedCallback() {

    }

    render() {
        if (this.shadowRoot === null) { throw new Error("No se creo el shadowRoot del componente"); }

        if (this.servicioUsuario?.estaAutenticado()) {
            Enrutador.obtenerInstancia().push("/");
            return;
        }

        this.shadowRoot.innerHTML = "";
        this.shadowRoot.innerHTML = this._html;
        const globalStyle = document.createElement("link");
        globalStyle.setAttribute("href", this._cssResourceUrl);
        globalStyle.setAttribute("rel", "stylesheet");

        const style = document.createElement("style");
        style.textContent = this._style;

        this.shadowRoot.appendChild(globalStyle);
        this.shadowRoot.appendChild(style);

        const formLogin = this.shadowRoot.querySelector("#formLogin");

        formLogin?.addEventListener("submit", e => this
            ._onBotonInciarSesionPrecionado(/**@type {SubmitEvent} */(e))
        );

    }

    /**@param {SubmitEvent} evento*/
    async _onBotonInciarSesionPrecionado(evento) {
        evento.preventDefault();
        const form = evento.target;
        const formData = new FormData(/**@type {HTMLFormElement} */(form));
        const usuario = /**@type {String} */ (formData.get("usuario"));
        const contrasenia = /**@type {String} */ (formData.get("contrasenia"));

        if (usuario === null || contrasenia === null) { throw new Error("") }

        try {
            this.cambiarEstadoBotonLogin();
            await this.servicioLogin?.iniciarSesion(usuario, contrasenia);
            Enrutador.obtenerInstancia().push("/");
        } catch (e) {
            this.servicioMensajeria?.mostrarMensajeDeError(e.message || "Hubo un error al iniciar sesion");
        } finally {
            this.cambiarEstadoBotonLogin();
        }
    }

    cambiarEstadoBotonLogin() {
        const botonLogin = this.shadowRoot.querySelector("#botonLogin");
        botonLogin.disabled = !botonLogin.disabled;
    }


    /**@type {ShadowRoot | undefined} */
    shadowRootObj = undefined;

    /**@private */
    _html = /*html*/`
    <section>
        <article>
            <form id="formLogin" class="container-fluid caja-login">
                <p>Inicio de sesión</p>
                <input type="text" placeholder="Usuario" id="usuario" name="usuario" required>
                <input type="password" placeholder="Contraseña" id="contrasenia" name="contrasenia" required>
                <button id="botonLogin" type="submit">Iniciar sesión</button>
                <!-- Luego agrego el boton de registrarse -->
            </form>
        </article>
    </section>
    `
    /**@private */
    _cssResourceUrl = "/css/pico.min.css";

    _style = /*css*/`
        .caja-login {
            max-width: 20rem;
            display: flex;
            flex-direction: column;
        }

        section {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
            margin: 0px;
        }
        
        article {
            padding-top: 2rem;
        }

        div {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 1rem;
        }
    `

    /**@private @type {UsuarioServicio | undefined} */
    servicioUsuario = undefined;

}

customElements.define(nombreComponente, LoginComponente);