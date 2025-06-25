
import ComponentePorDefecto from "../../utilidades/componente.js";
import Enrutador from "../../utilidades/Enrutador.js";

import NavBarComponente from "../componentes/navegacion.componente.js";
import ContenidoComponente from "../componentes/archivo.componente.js";
import UsuarioServicio from "../servicios/usuario.servicio.js";
import ArchivoServicio from "../servicios/archivo.servicio.js";

const nombreComponente = "usuario-vista";
export default class UsuarioComponente extends ComponentePorDefecto {

    /**
     * @type {Enrutador}
     * @private
     *  */
    router;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadow = /**@type {ShadowRoot} */(this.shadowRoot);
        this.servicioArchivo = ArchivoServicio.obtenerInstancia();
        this.servicioUsuario = UsuarioServicio.obtenerInstancia();
    }

    obtenerNombreComponente() {
        return `<${nombreComponente}></${nombreComponente}>`;
    }

    connectedCallback() {

        if (!this.servicioUsuario.estaAutenticado()) {
            Enrutador.obtenerInstancia().push("/");
            return;
        }

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
                    this._cargarContenido()
                }
            })

        }, intersectionOptions);


        this.intersectionObserver.observe(elementoCarga);

        this.addEventListener("busqueda-evento", this.onBuscarPorQuery.bind(this));
    }

    disconnectedCallback() {
        this.intersectionObserver?.disconnect();
    }

    adoptedCallback() {

    }

    attributeChangedCallback() {

    }

    esPerfilUsuarioLogueado() {
        const url = window.location.href;
        return url.includes("me");
    }

    render() {
        if (this.shadowRoot === null) { throw new Error("No se creo el shadowRoot del componente"); }
        const { shadow } = this

        shadow.innerHTML = "";
        shadow.innerHTML = this._html;

        const globalStyle = document.createElement("link");
        globalStyle.setAttribute("href", this._cssResourceUrl);
        globalStyle.setAttribute("rel", "stylesheet");
        shadow.appendChild(globalStyle);

        const boton = shadow.querySelector("#botonCambiarPagina");
        const style = document.createElement("style");
        style.textContent = this._style;
        shadow.appendChild(style);

        if (this.esPerfilUsuarioLogueado()) {
            const botonAgregarVideo = document.createElement("button");
            botonAgregarVideo.addEventListener("click", () => this._onBotonAgregarVideoPressed());
            botonAgregarVideo.id = "botonAgregarVideo";
            botonAgregarVideo.textContent = "➕ Agregar Video";
            shadow.querySelector("#divBotonAgregarVideo")?.appendChild(botonAgregarVideo);
            this.configurarFormularioUsuario();
        }

        shadow.querySelector("#dropzone")?.addEventListener("dragover", (e) => this._onDragOver(e));
        shadow.querySelector("#dropzone")?.addEventListener("dragstart", (e) => this._onDragStart(e));
        shadow.querySelector("#dropzone")?.addEventListener("dragenter", (e) => this._onDragStart(e));
        shadow.querySelector("#dropzone")?.addEventListener("dragleave", (e) => this._onDragLeave(e));
        shadow.querySelector("#dropzone")?.addEventListener("dragend", (e) => this._onDragLeave(e));
        shadow.querySelector("#dropzone")?.addEventListener("drop", (e) => {
            e.preventDefault();
            this._onDrop(e);
        });

        boton?.addEventListener('click', () => {
            this.router.push("**");
        });
    }

    async _onDrop(event) {
        this._onDragLeave(event);
        const files = event.dataTransfer.files;
        const arrayArchivos = Array.from(files);

        if (arrayArchivos.length > 1) {
            //mostrar mensaje de error;
            return;
        }

        const file = arrayArchivos[0];
        const mimes = this.servicioArchivo?.obtenerMIMEsPermitidos();

        //Verificar que el archivo sea audio o video
        //Esto es propenso a fallos debido a que solo checa la extensión
        //mas no el mime verdadero del archivo
        if (!mimes?.includes(file.type)) {
            alert("El archivo que intenta subir no es permitido\nPorfavor suba un archivo de audio o video");
            return;
        }

        //guardarmos el archivo en una variable
        this.archivoSeleccionado = file;
        //ocultamos el input de archivos del formulario
        const inputArchivo = /**@type {HTMLInputElement} */(this.shadow.querySelector("#archivo"));
        inputArchivo.style.display = "none";
        inputArchivo.required = false;
        // y ponemos el nombre del archivo en la dropzone
        const dropzone = /**@type {HTMLDivElement} */(this.shadow.querySelector("#dropzone"));
        dropzone.textContent = file.name;

        const segundos = await this.obtenerDuracionEnSegundosDelArchivo(file);

        if (segundos < 60) {
            this.shadowRoot.querySelector("#mockDuracion").value = `${Math.trunc(segundos)}s`;
        } else {
            const numeroRedondeado = parseFloat((segundos / 60).toFixed(1))
            this.shadowRoot.querySelector("#mockDuracion").value = `${numeroRedondeado}m`;
        }

        this.shadow.querySelector("#duracion").value = segundos;

    }

    _onDragOver(e) {
        e.preventDefault();
    }

    _onDragStart(e) {
        const dropzone = /**@type {HTMLDivElement} */(this.shadow.querySelector("#dropzone"));
        if (dropzone.classList.contains("dragover")) {
            console.log("a")
            return;
        }
        dropzone.classList.add("dragover");
    }

    _onDragLeave(e) {
        const dropzone = /**@type {HTMLDivElement} */(this.shadow.querySelector("#dropzone"));
        dropzone.classList.remove("dragover");
    }

    _onBotonAgregarVideoPressed() {
        const dialogElement = /**@type {HTMLDialogElement} */ (this.shadow.querySelector("#dialogoAgregarVideo"));
        dialogElement.show();
    }

    _reiniciarFormulario() {
        const formElement = /**@type {HTMLFormElement} */ (this.shadow.querySelector("#formAgregarVideo"));
        formElement.reset();
        formElement.querySelector("#archivo").style.display = "block";
        formElement.querySelector("#archivo").required = true;

        const dropzone = /**@type {HTMLDivElement} */(this.shadow.querySelector("#dropzone"));
        this.shadow.querySelector("#dropzone").style.display = "flex";

        const svg = this.shadow.querySelector("#porcentajeSubida");
        svg?.setAttribute("width", "0%");

        dropzone.innerHTML = /*html*/`
        <p>
            Arrastre y suelte el archivo aqui
            <img src="/drag.svg" height="25rem" width="25rem">
        </p>`

        this.archivoSeleccionado = null;
    }

    async _onFileInput(evt) {
        const file = evt.target.files[0];
        if (!file) { throw new Error("No se que paso al intentar subir el archivo!!!"); }

        this.archivoSeleccionado = file;
        const duracion = await this.obtenerDuracionEnSegundosDelArchivo(file);
        const inputDuracion = this.shadow.querySelector("#duracion")
        inputDuracion.value = parseInt(duracion);

        const inputMockDuracion = this.shadow.querySelector("#mockDuracion");

        this.shadow.querySelector("#dropzone").style.display = "none";

        if (duracion < 60) {
            inputMockDuracion.value = parseInt(duracion) + "s";
            return;
        }

        inputMockDuracion.value = (duracion / 60).toFixed(1) + "m"
    }

    _onFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const titulo = formData.get("titulo");
        const descripcion = formData.get("descripcion");
        const duracion = formData.get("duracion");

        //Por si a mi se me paso algo
        if (!titulo || !descripcion || !duracion) {
            alert("Todos los campos son obligatorios");
            return;
        }

        const obj = {
            titulo: titulo,
            descripcion: descripcion,
            duracion: parseInt(duracion), //para enviar ejemp 125 y no 125.2
            file: formData.get("file")
        }

        if (this.archivoSeleccionado !== null) {
            obj.file = this.archivoSeleccionado;
        }

        this.servicioArchivo?.subirArchivo(obj, (e) => { this.mostrarPorcentaje(e) });
    }

    mostrarSVGDeExito() {
        const formulario = this.shadow.querySelector("#formAgregarVideo");
        formulario.innerHTML = this.svgCheck;
        formulario.style.display = "flex";
        formulario.style.justifyContent = "center";
        formulario.style.alignItems = "center";
    }

    mostrarSVGDeError() {
        const formulario = this.shadow.querySelector("#formAgregarVideo");
        formulario.innerHTML = this.svgCross;
        formulario.style.display = "flex";
        formulario.style.justifyContent = "center";
        formulario.style.alignItems = "center";
    }

    configurarFormularioUsuario() {
        const shadow = this.shadowRoot;
        const formulario = shadow.querySelector("#formAgregarVideo");

        formulario.innerHTML = /*html*/`
            <input required type="text" placeholder="Titulo" name="titulo">
            <textarea required id="descripcionVideo" placeholder="Descripción del video" name="descripcion"></textarea>
            <input type="string" id="mockDuracion" placeholder="Duración del archivo" disabled name="duracionMinutos">
            <input type="hidden" name="duracion" id="duracion">
            <input required type="file" name="file" id="archivo" accept="audio/*,video/*" name="file">
            <div id="dropzone">
                <p>
                    Arrastre y suelte el archivo aqui
                    <img src="/drag.svg" height="25rem" width="25rem">
                </p>
            </div>
        `

        formulario.style.display = "block";

        formulario?.addEventListener("submit", (e) => {
            e.preventDefault();
            this._onFormSubmit(e);
        });

        const botonCancelar = /**@type {HTMLButtonElement} */(shadow.querySelector("#botonCancelar"));
        botonCancelar.addEventListener("click", () => this.cerrarDialogo());
        const botonCerrar = shadow.querySelector("#botonCerrarDialogo");
        botonCerrar?.addEventListener("click", () => this.cerrarDialogo());

        const barraDePorcentaje = /**@type {SVGRectElement} */ (shadow.querySelector("#barraDePorcentaje"));
        this.barraDePorcentaje = barraDePorcentaje;

        const fileInput = this.shadow.querySelector("#archivo");
        console.log(formulario)
        fileInput?.addEventListener("input", this._onFileInput.bind(this));
    }

    async mostrarPorcentaje(datos) {
        this.barraDePorcentaje.setAttribute("width", `${datos.actual / datos.total * 100}%`);

        if (datos.type) {
            this.mostrarSVGDeError();
            await this.timer(200);
            alert(datos.message || "Hubo un error al subir el video");
            window.location.reload();
            return;
        }

        if (datos.envioCompleto) {
            this.mostrarSVGDeExito();
            await this.timer(200); // para que se pueda mostrar el svg
            alert("El video se subio con exito!");
            this.cerrarDialogo();
            //lo reiniciamos para que se vuelan a buscar los archivos sin tener que reiniciar la pagina
            this.pagina = 1;
            this.cantidad = 10;
            this.shadowRoot.querySelector("#contenido").innerHTML = "";
        }

    }

    async timer(ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    cerrarDialogo() {
        const dialogElement = /**@type {HTMLDialogElement} */ (this.shadow.querySelector("#dialogoAgregarVideo"));
        dialogElement.close();
        this.configurarFormularioUsuario();
        this._reiniciarFormulario();
    }

    async onBuscarPorQuery(e) {
        this.intersectionObserver?.unobserve(this.shadowRoot.querySelector("#cargando"));
        this.shadowRoot.querySelector("#contenido").innerHTML = "";

        this.tituloBuscador = e.detail.nombre;
        this.descripcionBuscador = e.detail.descripcion;
        this.pagina = 1;
        this.cantidad = 10;
        await this.buscarPorQuery();

        this.intersectionObserver?.observe(this.shadowRoot.querySelector("#cargando"));
    }

    async buscarPorQuery() {

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

    async _cargarContenido() {
        if (this.shadowRoot === null) { throw new Error("No se creo el shadowRoot del componente"); }

        if (this.tituloBuscador || this.descripcionBuscador) {
            await this.buscarPorQuery();
            return;
        }

        //Verificar si los videos que nos vamos a traer son el usuario registardo
        //O si son de algun usuario en particular
        //TODO: Refactorizar
        let nombreUsuario = "";
        if (this.esPerfilUsuarioLogueado()) {
            nombreUsuario = this.servicioUsuario?.obtenerUsuario()?.username || "";
        } else {
            const url = new URL(window.location.href);
            nombreUsuario = url.searchParams.get("username") || "";
        }

        if (!nombreUsuario) {
            throw new Error("No se pudo obtener el nombre de usuario");
        }
        //Fin de la verificacion
        const archivos = await this.servicioArchivo?.obtenerLosArchivosDeUsuario(nombreUsuario, this.pagina, this.cantidad);
        const divContenido = /**@type {HTMLDivElement} */ (this.shadowRoot.querySelector("#contenido"));

        archivos?.forEach(archivo => {
            const componente = new ContenidoComponente();
            componente.titulo = archivo.titulo;
            componente.descripcion = archivo.descripcion;
            componente.duracion = archivo.duracion;
            componente.nombreArchivo = archivo.nombreArchivo;
            componente.id = String(archivo.id);
            componente.autorId = archivo.usuarioId;
            divContenido.appendChild(componente);
        });

        this.pagina++;
    }

    async obtenerDuracionEnSegundosDelArchivo(file) {
        if (!file) { throw new Error("Se envio un archivo nulo o vacio") }

        //creamos un elemento de video
        const videoElement = document.createElement("video");
        videoElement.preload = "metadata";

        const promise = new Promise(resolve => {
            videoElement.addEventListener("loadeddata", () => {
                URL.revokeObjectURL(videoElement.src);
                const duration = videoElement.duration;
                resolve(duration)
            })
        });

        videoElement.src = URL.createObjectURL(file);
        return await promise;
    }

    /**@private */
    _html = /*html*/`
    <div id="body">
        <nav-bar></nav-bar>
        <div id="divBotonAgregarVideo"></div>
        <div id="contenido">
        </div>

        <div class="centrado" id="cargando">
            Ya viste todos los videos!
        </div>

        <dialog id="dialogoAgregarVideo">
            <article>
                <header>
                    <button aria-label="Close" rel="prev" id="botonCerrarDialogo"></button>
                    <p>
                      <strong>Subir archivo multimedia</strong>
                    </p>
                </header>
                <p>
                    <svg width="100%" height="20px" id="porcentajeSubida">
                        <rect x="0" y="0" width="0%" height="20px" rx="5px" ry="5px" fill="blue" id="barraDePorcentaje"/>
                    </svg>
                </p>
                <form id="formAgregarVideo">
                    
                </form>
                <footer>
                    <button class="secondary" id="botonCancelar">
                        Cancelar
                    </button>
                    <button id="botonSubir" form="formAgregarVideo">
                        Subir
                    </button>
                </footer>
            </article>
        </dialog>

    </div>`

    _cssResourceUrl = "/css/pico.min.css";

    _style = /*css*/`

    #formAgregarVideo {
        z-index: 9999;
    }

    nav-bar {
        position: sticky;
        top: 0px;
        z-index: 1;
    }

    #divBotonAgregarVideo {
        display: flex;
        justify-content: end;
        padding-right: 2rem;
    }

    #dropzone {
        border-radius: 0.8rem;
        width: 100%;
        height: 4rem; 
        display: flex; 
        align-items: center;
        background-color: rgb(61, 71, 92);
        justify-content: center;
    }

    #dropzone * {
        pointer-events: none;
        user-select: none;
    }


    .dragover {
        animation: glow 1s ease-in-out infinite alternate;
    }

    @keyframes glow {
        from {
            box-shadow: 0px 0px 0.5rem 0.1rem rgb(92, 126, 248, 1);
        }
        to {
            box-shadow: 0px 0px 0.5rem 0.3rem rgb(92, 126, 248, 1);
        }
    }

    .centrado {
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

    /**@private @type {ShadowRoot} */
    shadow;

    /**@private @type {UsuarioServicio | undefined} */
    servicioUsuario = undefined;

    /**@private @type {ArchivoServicio | undefined} */
    servicioArchivo = undefined;

    /**@private @type {HTMLOrSVGElement} */
    barraDePorcentaje;

    /**@private @type {File | null} */
    archivoSeleccionado = null;

    /**@private */
    tituloBuscador = "";
    /**@private */
    descripcionBuscador = "";

    pagina = 1;
    cantidad = 10;

    svgCross = /*html*/`
        <svg width="20rem" height="20rem" viewBox="0 0 25 25" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns">
            <title>cross</title>
            <desc>Created with Sketch Beta.</desc>
            <defs></defs>
            <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage">
            <g id="Icon-Set-Filled" sketch:type="MSLayerGroup" transform="translate(-469.000000, -1041.000000)" fill="#FF0000">
            <path d="M487.148,1053.48 L492.813,1047.82 C494.376,1046.26 494.376,1043.72 492.813,1042.16 C491.248,1040.59 488.712,1040.59 487.148,1042.16 L481.484,1047.82 L475.82,1042.16 C474.257,1040.59 471.721,1040.59 470.156,1042.16 C468.593,1043.72 468.593,1046.26 470.156,1047.82 L475.82,1053.48 L470.156,1059.15 C468.593,1060.71 468.593,1063.25 470.156,1064.81 C471.721,1066.38 474.257,1066.38 475.82,1064.81 L481.484,1059.15 L487.148,1064.81 C488.712,1066.38 491.248,1066.38 492.813,1064.81 C494.376,1063.25 494.376,1060.71 492.813,1059.15 L487.148,1053.48" id="cross" sketch:type="MSShapeGroup"></path>
            </g></g>
        </svg>`

    svgCheck = /*html*/`
    <?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
    <svg fill="#000000" width="20rem" height="20rem" viewBox="0 0 24 24" id="check-mark-circle" data-name="Flat Line" xmlns="http://www.w3.org/2000/svg" class="icon flat-line"><rect id="secondary" x="3" y="3" width="18" height="18" rx="9" style="fill: rgb(44, 169, 188); stroke-width: 2;"></rect><polyline id="primary" points="8 11.5 11 14.5 16 9.5" style="fill: none; stroke: rgb(0, 0, 0); stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></polyline><rect id="primary-2" data-name="primary" x="3" y="3" width="18" height="18" rx="9" style="fill: none; stroke: rgb(0, 0, 0); stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></rect></svg>
    `

}

customElements.define(nombreComponente, UsuarioComponente);