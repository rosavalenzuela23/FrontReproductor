import ComponentePorDefecto from "../../../src/utilidades/componente.js";
import Enrutador from "../../../src/utilidades/Enrutador.js";
import ArchivoServicio from "../servicios/archivo.servicio.js";
import LoginServicio from "../servicios/login.servicio.js";
import MensajeriaServicio from "../servicios/mensajeria.servicio.js";
import UsuarioServicio from "../servicios/usuario.servicio.js";

const nombreComponente = "contenido-componente";
export default class ContenidoComponente extends ComponentePorDefecto {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    obtenerNombreComponente() {
        return `<${nombreComponente}></${nombreComponente}>`;
    }

    connectedCallback() {
        this.servicioUsuario = UsuarioServicio.obtenerInstancia();
        this.servicioArchivo = ArchivoServicio.obtenerInstancia();
        this.servicioLogin = LoginServicio.obtenerInstancia();
        this.servicioMensajeria = MensajeriaServicio.obtenerInstancia();
        this.render();
    }

    disconnectedCallback() {

    }

    adoptedCallback() {

    }

    /**
     * @param {String} name 
     * @param {String} oldValue 
     * @param {String} newValue 
     */
    attributeChangedCallback(name, oldValue, newValue) {
        this[name] = newValue;
    }

    render() {
        if (this.shadowRoot === null) { throw new Error("No se creo el shadowRoot del componente"); }
        const router = Enrutador.obtenerInstancia();
        this.shadowRoot.innerHTML = "";
        this.shadowRoot.innerHTML = this._html;
        const globalStyle = document.createElement("link");
        globalStyle.setAttribute("href", this._cssResourceUrl);
        globalStyle.setAttribute("rel", "stylesheet");

        const gridStyle = document.createElement("link");
        gridStyle.setAttribute("href", this._gridCssResourceUrl);
        gridStyle.setAttribute("rel", "stylesheet");

        const style = document.createElement("style");
        style.textContent = this._style;
        this.shadowRoot.appendChild(globalStyle);
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(gridStyle);
        //De aki pa bajo

        const tituloVideoElement = /**@type {HTMLElement} */ (this.shadowRoot.querySelector("#tituloArchivo"));
        const descripcionElement = /**@type {HTMLElement} */ (this.shadowRoot.querySelector("#descripcion"));
        const duracionElement = /**@type {HTMLElement} */ (this.shadowRoot.querySelector("#duracion"));

        tituloVideoElement.innerHTML = this.titulo;
        descripcionElement.innerHTML = this.descripcion || "---";

        if (!this.duracion) {
            throw new Error("El video no puede existir sin duracion");
        }

        if (this.duracion < 60) {
            duracionElement.innerHTML = this.duracion + "s";

        } else {
            const numeroRedondeado = parseFloat((parseFloat(this.duracion) / 60).toFixed(1));
            duracionElement.innerHTML = numeroRedondeado + "m";
        }


        const article = /**@type {HTMLElement} */ (this.shadowRoot.querySelector("article"));

        const archivoSeleccionable = /**@type {HTMLElement} */ (this.shadowRoot.querySelector("#archivoSeleccionable"));

        archivoSeleccionable?.addEventListener("click", e => this
            ._onSummaryClick(/**@type {String}*/(article?.dataset.link))
        );

        if (this.autorId === this.servicioUsuario.obtenerIdUsuario()) {
            this._agregarOpcionesDeArchivoPropio();
        }

    }

    _agregarOpcionesDeArchivoPropio() {
        const contenido = /**@type {HTMLElement} */ (this.shadowRoot.querySelector("#contenido"));

        const div = document.createElement("div");
        div.classList.add("col-xs-end", "opciones");

        div.innerHTML = /*html*/`
            <details class="dropdown end-xl" style="max-width: 3rem;" rel="prev">
                <summary>📂</summary>
                <ul dir="rtl">
                    <li><a href="#" id="editar">Editar📝</a></li>
                    <li><a href="#" id="eliminar">Eliminar🚮</a></li>
                </ul>
            </details>`;

        const dialogEdit = /*html*/`
            <dialog id="dialogoEditar">
                <article>
                    <header>
                        <button aria-label="Close" rel="prev" id="botonX"></button> 
                        Editar archivo 
                    </header>
                    <form id="formEditar">
                        <label for="">Titulo</label>
                        <input type="text" name="titulo" id="tituloArchivo">
                        <label for="">Descripción</label>
                        <input type="text" name="descripcion" id="descripcionArchivo">
                    </form>
                    <footer>
                        <button id="botonSalir">Salir</button>
                        <button form="formEditar">Guardar</button>
                    </footer>
                </article>
            </dialog>
        `
        div.appendChild(document.createRange().createContextualFragment(dialogEdit));
        const dialogoEditar = /**@type {HTMLDialogElement} */ (div.querySelector("#dialogoEditar"));

        const titulo = /**@type {HTMLInputElement} */ (dialogoEditar.querySelector("#tituloArchivo"));
        const descripcion = /**@type {HTMLInputElement} */ (dialogoEditar.querySelector("#descripcionArchivo"));
        titulo.value = this.titulo;
        descripcion.value = this.descripcion;

        const botonSalir = /**@type {HTMLElement} */ (div.querySelector("#botonSalir"));
        botonSalir.addEventListener("click", e => {
            e.preventDefault();
            this._onBotonCerrarModal(e);
        });

        const botonX = /**@type {HTMLElement} */ (div.querySelector("#botonX"));
        botonX.addEventListener("click", e => {
            e.preventDefault();
            this._onBotonCerrarModal(e);
        });

        const eliminar = /**@type {HTMLElement} */ (div.querySelector("#eliminar"));
        eliminar.addEventListener("click", e => {
            e.preventDefault();
            this._onBotonEliminarPressed(e);
        });

        const editar = /**@type {HTMLElement} */ (div.querySelector("#editar"));
        editar.addEventListener("click", e => {
            this._onBotonEditarPressed(e);
        });

        const formEditar = /**@type {HTMLFormElement} */ (dialogoEditar.querySelector("#formEditar"));
        formEditar.addEventListener("submit", e => {
            e.preventDefault();
            this._onBotonGuardarPressed(e);
        });

        contenido.appendChild(div);
    }

    _onBotonCerrarModal(e) {
        const dialog = /**@type {HTMLDialogElement} */ (this.shadowRoot.querySelector("#dialogoEditar"));
        dialog.close();
    }

    _onBotonEliminarPressed(e) {
        e.preventDefault();
        this.servicioArchivo.eliminarArchivo(this.nombreArchivo);
        window.location.reload();
    }

    _onBotonEditarPressed(e) {
        e.preventDefault();
        //mostrar el modal
        const dialogoEditar = /**@type {HTMLDialogElement} */ (this.shadowRoot.querySelector("#dialogoEditar"));
        dialogoEditar.showModal();
    }

    async _onBotonGuardarPressed(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const titulo = /**@type {String} */ (formData.get("titulo"));
        const descripcion = /**@type {String} */ (formData.get("descripcion"));

        if (!titulo && !descripcion) {
            throw new Error("Todos los campos son obligatorios");
        }

        await this.servicioArchivo
            .actualizarArchivo(this.nombreArchivo, titulo, descripcion);

        window.location.reload();
    }

    /**
     * 
     * @param {String} link 
     */
    _onSummaryClick(link) {
        if (!link) { throw new Error("El link no fue puesto") }
        Enrutador.obtenerInstancia().push(link, { id: this.nombreArchivo });
    }

    /**@type {ShadowRoot | undefined} */
    shadowRootObj = undefined;

    /**@private */
    _html = /*html*/`
    <article data-link="/reproductor" class="archivo">
        <div class="row between-xs" id="contenido">
            <div class="col-xs grid" id="archivoSeleccionable">
                <div>
                    <img src="/musica.png" alt="">
                </div>
                <summary>
                    <h5 id="tituloArchivo"> SIN TITULO </h5>
                    <span id="descripcion"> SIN DESCRIPCION </span>
                </summary>
                <div>
                    <span id="duracion"> SIN DURACION </span>
                </div>
            </div>
        </div>
    </article>
    `
    /**@private */
    _cssResourceUrl = "/css/pico.min.css";
    _gridCssResourceUrl = "/css/flexboxgrid.min.css";

    _style = /*css*/`
    
    #archivoSeleccionable {
        
    }

    #archivoSeleccionable:hover {
        cursor: pointer;
        border-radius: 2rem 2rem 2rem 2rem;
        box-shadow: 0px 0px 1rem 0.5rem rgb(92, 126, 248);
        animation: glow-effect 2s infinite alternate;
    }

    .archivo {
        border-radius: 3rem;
        margin-top: 2rem;
        padding: 1rem;
    }

    @keyframes glow-effect {
        0% {
            box-shadow: 0px 0px 1rem 0.5rem rgb(92, 126, 248, 1);
            background-color: rgb(92, 126, 248, 1);
        }
        100% {
            background-color: rgb(92, 126, 248, 0.5);
            box-shadow: 0px 0px 1rem 0.5rem rgb(92, 126, 248, 0.5);
        }
    }
    
    img {
        aspect-ratio: 3/2;
        width: 250px;
        border-radius: 2rem;
    }

    .opciones {
        margin: 0rem 1rem 0rem 1rem;
    }

    `

    /**@type {String} */
    titulo;
    /**@type {String} */
    descripcion;
    /**@type {String} */
    duracion;
    /**@type {String} */
    videoId;

    /**@type {number} */
    autorId;

    /**@type {String} */
    nombreArchivo;

    /**@type {UsuarioServicio} */
    servicioUsuario;

    /**@type {ArchivoServicio} */
    servicioArchivo;

    static observedAttributes = ["titulo", "descripcion", "duracion", "videoId", "nombreArchivo", "autorId"];
}

customElements.define(nombreComponente, ContenidoComponente);