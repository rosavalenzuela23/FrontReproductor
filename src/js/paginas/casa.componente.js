import ComponentePorDefecto from "../../utilidades/componente.js";
import Enrutador from "../../utilidades/Enrutador.js";

import NavBarComponente from "../componentes/navegacion.componente.js";
import ContenidoComponente from "../componentes/archivo.componente.js";
import ArchivoServicio from "../servicios/archivo.servicio.js";

const nombreComponente = "casa-componente";
export default class CasaComponente extends ComponentePorDefecto {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    obtenerNombreComponente() {
        return `<${nombreComponente}></${nombreComponente}>`;
    }

    connectedCallback() {
        this.router = Enrutador.obtenerInstancia();
        this.render();

        const elementoCarga = this.shadowRoot.querySelector("#cargando");

        const intersectionOptions = {
            root: null,
            rootMargin: "0px",
            threshold: 0.1
        }

        this.intersectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.obtenerPagina()
                }
            })

        }, intersectionOptions);


        this.intersectionObserver.observe(elementoCarga);

        this.addEventListener("busqueda-evento", this.buscarCancionesQuery.bind(this));
    }

    async buscarCancionesQuery(evento) {
        // reiniciamos los valores para poder buscar desde el principio
        const { nombre, descripcion } = evento.detail;

        //por problemas de concurrencia con los callbacks
        //primero tenemos que desactivar el observer de la paginacion
        //obtenemos los archivos
        //y luego volvemos a activar el observer

        const elementoCarga = this.shadowRoot.querySelector("#cargando");
        this.intersectionObserver.unobserve(elementoCarga);


        this.shadowRoot.querySelector("#contenido").innerHTML = "";
        this.tituloBuscador = nombre;
        this.descripcionBuscador = descripcion;
        this.pagina = 1;
        this.cantidad = 10;
        await this.buscarPaginaPorQuery();

        this.intersectionObserver.observe(elementoCarga);
    }

    async buscarPaginaPorQuery() {

        const { tituloBuscador, descripcionBuscador } = this;

        const result = await this.servicioArchivo
            .obtenerArchivosPorQuery(tituloBuscador, descripcionBuscador, this.pagina, this.cantidad);

        const divContenido = /**@type {HTMLDivElement} */ (this.shadowRoot.querySelector("#contenido"));

        result.forEach(archivo => {
            const componente = new ContenidoComponente();
            componente.titulo = archivo.titulo;
            componente.descripcion = archivo.descripcion;
            componente.duracion = archivo.duracion;
            componente.id = String(archivo.id);
            componente.nombreArchivo = archivo.nombreArchivo;
            componente.autorId = archivo.usuarioId;
            divContenido.appendChild(componente);
        });

        this.pagina++;
    }

    async obtenerPagina() {
        if (this.tituloBuscador || this.descripcionBuscador) {
            await this.buscarPaginaPorQuery();
            return;
        }

        const archivos = await this.servicioArchivo.obtenerPaginaDeArchivos(this.pagina, this.cantidad);

        const divContenido = /**@type {HTMLDivElement} */ (this.shadowRoot.querySelector("#contenido"));
        archivos.forEach(archivo => {
            const componente = new ContenidoComponente();
            componente.titulo = archivo.titulo;
            componente.descripcion = archivo.descripcion;
            componente.duracion = archivo.duracion;
            componente.id = String(archivo.id);
            componente.nombreArchivo = archivo.nombreArchivo;
            componente.autorId = archivo.usuarioId;
            divContenido.appendChild(componente);
        });

        this.pagina++;
    }

    disconnectedCallback() {
        const elementoCarga = this.shadowRoot.querySelector("#carga");
        this.intersectionObserver?.disconnect();
    }

    adoptedCallback() {

    }

    attributeChangedCallback() {

    }

    render() {
        if (this.shadowRoot === null) { throw new Error("No se creo el shadowRoot del componente"); }

        this.shadowRoot.innerHTML = "";
        this.shadowRoot.innerHTML = this._html;
        const boton = this.shadowRoot.querySelector("#botonCambiarPagina");

        const style = document.createElement("style");
        style.textContent = this._style;
        this.shadowRoot.appendChild(style);

        boton?.addEventListener('click', () => {
            this.router.push("**");
        });

    }

    /**@private */
    _html = /*html*/`
    <div>
        <nav-bar></nav-bar>
        <div id="contenido"> 
        </div>
        
        <div id="centrado">
            <article aria-busy="true" id="cargando"> Ya viste todos los videos! </article>
        </div>
        <!-- si se ve, va y busca los archivos -->
    </div>
    `

    _style = /*css*/`
    nav-bar {
        position: sticky;
        top: 0px;
        z-index: 9999;
    }

    #centrado {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 1rem;
        margin-bottom: 1rem;
        size: 2rem;
        text-decoration: underline;
        font-weight: bold;
    }

    `

    /**@private @type {ArchivoServicio} */
    servicioArchivo = ArchivoServicio.obtenerInstancia();

    /**
    * @type {Enrutador}
    * @private
    *  */
    router;

    /**@private @type {IntersectionObserver | undefined} */
    intersectionObserver;

    tituloBuscador = "";
    descripcionBuscador = "";

    pagina = 1;
    cantidad = 10;

}

customElements.define(nombreComponente, CasaComponente);