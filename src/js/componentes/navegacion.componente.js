import ComponentePorDefecto from "../../../src/utilidades/componente.js";
import Enrutador from "../../../src/utilidades/Enrutador.js";
import LoginServicio from "../servicios/login.servicio.js";
import MensajeriaServicio from "../servicios/mensajeria.servicio.js";
import UsuarioServicio from "../servicios/usuario.servicio.js";

const nombreComponente = "nav-bar";
export default class NavBarComponente extends ComponentePorDefecto {

    constructor() {
        super();
        this.servicioLogin = LoginServicio.obtenerInstancia();
        this.servicioMensajeria = MensajeriaServicio.obtenerInstancia();
        this.servicioUsuario = UsuarioServicio.obtenerInstancia();
        this.attachShadow({ mode: 'open' });
    }

    obtenerNombreComponente() {
        return `<${nombreComponente}></${nombreComponente}>`;
    }

    connectedCallback() {
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
        const router = Enrutador.obtenerInstancia();
        this.shadowRoot.innerHTML = "";
        this.shadowRoot.innerHTML = this._html;
        const globalStyle = document.createElement("link");
        globalStyle.setAttribute("href", this._cssResourceUrl);
        globalStyle.setAttribute("rel", "stylesheet");
        const style = document.createElement("style");
        style.textContent = this._style;
        this.shadowRoot.appendChild(globalStyle);
        this.shadowRoot.appendChild(style);
        //De aki pa bajo

        const form = this.shadowRoot.querySelector("#searchForm");
        if (form === null) { throw new Error("Se borro el form") };
        const botonLogin = this.shadowRoot.querySelector("#botonIrLogin");

        form.addEventListener("submit", this._onFormularioSubmit.bind(this));

        const itemIniciarSesion = /**@type {HTMLLIElement} */ (this.shadowRoot.querySelector("#itemIniciarSesion"));

        if (this.servicioUsuario?.estaAutenticado()) {
            itemIniciarSesion.innerHTML = /*html*/`
            <button id="botonCerrarSesion" class="contrast outline">
                Cerrar sesión
            </button>

            <button id="botonIrPerfil">
                <span>🧏</span>
                Mi Perfil
            </button>

            `;

            this.shadowRoot.querySelector("#botonCerrarSesion")
                ?.addEventListener("click", this._onButtonCerrarSesionPressed.bind(this));

            this.shadowRoot.querySelector("#botonIrPerfil")
                ?.addEventListener("click", this._onButtonIrPerfilPressed.bind(this));
        }

        const botonLogo = this.shadowRoot.querySelector("#logo");
        botonLogo?.addEventListener('click', () => {
            router.push("/");
        });

        botonLogin?.addEventListener('click', () => {
            router.push("/login");
        });

        form.addEventListener("submit", (e) => this
            ._onBotonBuscarPressed(/**@type {SubmitEvent}*/(e)));
    }

    /**
     * 
     * @param {SubmitEvent} evento 
     */
    _onBotonBuscarPressed(evento) {
        evento.preventDefault();
    }

    async _onButtonCerrarSesionPressed() {
        await this.servicioUsuario?.cerrarSesion();
        window.location.reload();
    }

    _onButtonIrPerfilPressed() {
        Enrutador.obtenerInstancia().push("/me");
    }

    _onFormularioSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);

        const nombre = /**@type {String} */ (formData.get("nombreCancion"));
        const descripcion = /**@type {String} */ (formData.get("descripcionCancion"));

        if (!nombre && !descripcion) {
            this.servicioMensajeria?.mostrarMensajeDeError("Necesita llenar almenos un campo");
            return;
        }

        const eventoBusqueda = new CustomEvent("busqueda-evento", {
            bubbles: true,
            composed: true, //para que se pueda propagar fuera del shadow-dom
            detail: { nombre, descripcion }
        });

        this.dispatchEvent(eventoBusqueda);
    }

    /**@type {ShadowRoot | undefined} */
    shadowRootObj = undefined;

    /**@private */
    _html = /*html*/`
    <article>
        <nav>
            <ul id="logo">
                <li style="cursor: pointer">
                Admin borregod
                </li>
            </ul>
            <ul>
                <li>
                    <form role="search" id="searchForm">
                        <fieldset role="group">
                            <input type="search" name="nombreCancion" placeholder="Nombre">
                            <input type="search" name="descripcionCancion" placeholder="Descripción">
                            <input type="submit" value="Buscar">
                        </fieldset>
                    </form>
                </li>
            </ul>
            <ul>
                <li id="itemIniciarSesion">
                    <button id="botonIrLogin">
                        Iniciar sesión
                    </button>
                </li>
            </ul>
        </nav>
    </article>

    `
    /**@private */
    _cssResourceUrl = "/css/pico.min.css";

    _style = /*css*/`
    nav { 
        padding-right: 2rem;
        padding-left: 2rem;
        position: sticky;
        display: flex;
        align-items: center;
    }

    li {
        display: flex;
        align-items: center;
    }

    #logo {
        cursour: pointer;
    }

    `

    /**@private @type {UsuarioServicio | undefined} */
    servicioUsuario = undefined;

}

customElements.define(nombreComponente, NavBarComponente);