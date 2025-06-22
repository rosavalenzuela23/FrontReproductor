import ComponentePorDefecto from "../../../src/utilidades/componente.js";
import Enrutador from "../../../src/utilidades/Enrutador.js";
import Ambiente from "../../utilidades/Ambiente.js";
import { $ } from "../../utilidades/objetos.js";
import ArchivoServicio from "../servicios/archivo.servicio.js";
import ConfiguracionServicio from "../servicios/configuracion.servicio.js";
import LoginServicio from "../servicios/login.servicio.js";
import MensajeriaServicio from "../servicios/mensajeria.servicio.js";

const nombreComponente = "reproductor-componente";
export default class ReproductorComponente extends ComponentePorDefecto {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    obtenerNombreComponente() {
        return `<${nombreComponente}></${nombreComponente}>`;
    }

    connectedCallback() {
        this.servicioArchivo = ArchivoServicio.obtenerInstancia();
        this.ambiente = Ambiente.obtenerInstancia();
        this.render();
    }

    disconnectedCallback() {

    }

    adoptedCallback() {

    }

    attributeChangedCallback() {

    }

    /**
     * 
     * @returns {String}
     */
    _obtenerNombreArchivo() {
        const url = new URL(window.location.href);
        const id = url.searchParams.get("id");
        if (!id) {
            throw new Error("No se pudo obtener el id del archivo");
        }
        return id;
    }

    render() {

        if (this.shadowRoot === null) { throw new Error("No se creo el shadowRoot del componente"); }
        const configuracion = ConfiguracionServicio.obtenerInstancia();
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

        const videoElement = /**@type {HTMLMediaElement} */(this.shadowRoot.querySelector("#video"));
        const videoSource = /**@type {HTMLSourceElement} */ (this.shadowRoot.querySelector("#videoSource"));
        const inputPorcentaje = /**@type {HTMLInputElement}*/ (this.shadowRoot.querySelector("#porcentajeVideo"));
        const botonPausa = this.shadowRoot.querySelector("#botonPausa");

        const nombreArchivo = this._obtenerNombreArchivo();
        videoSource.src = this.ambiente.variables.url + `streaming/?id=${nombreArchivo}`;

        videoElement.volume = configuracion.volumen;

        videoElement.addEventListener("loadeddata", () => {
            inputPorcentaje.max = String(videoElement.duration);
        });

        videoElement.addEventListener("click", () => {
            this._onBotonPausaPressed(videoElement);
        });

        videoElement.addEventListener("ended", () => {
            const boton = /**@type {HTMLButtonElement} */ (this.shadowRoot?.querySelector("#botonPausa"));
            boton.innerHTML = this._iconoPlay;
        });

        videoElement.addEventListener("dblclick", async () => {
            await videoElement.requestFullscreen();
        })

        const inputVolumen = /**@type {HTMLInputElement} */ (this.shadowRoot.querySelector("#input-volumen"));
        inputVolumen.value = String(configuracion.volumen);
        inputVolumen.addEventListener("input", e => {
            configuracion.volumen = Number(inputVolumen.value);
            videoElement.volume = Number(inputVolumen.value);
        });

        inputPorcentaje.addEventListener("click", async (e) => {
            videoElement.pause();
            videoElement.currentTime = Number(inputPorcentaje.value);
            await videoElement.play();
        })


        videoElement?.addEventListener("timeupdate", () => {
            inputPorcentaje.value = String(videoElement.currentTime);
        })

        botonPausa?.addEventListener("click", e => this
            ._onBotonPausaPressed(videoElement));

        this.obtenerInformacionArchivo(nombreArchivo).then(
            archivo => {
                const tituloElemento = this.shadowRoot.querySelector("#tituloVideo");
                tituloElemento.innerHTML = archivo.titulo;
                tituloElemento.ariaBusy = false;

                const descripcionElement = this.shadowRoot?.querySelector("#descripcion");
                descripcionElement.innerHTML = archivo.descripcion || "Sin descripción";
            }
        )

    }

    /**
     * 
     * @param {HTMLMediaElement} mediaElement 
     */
    async _onBotonPausaPressed(mediaElement) {
        const boton = /**@type {HTMLButtonElement} */ (this.shadowRoot?.querySelector("#botonPausa"));

        if (mediaElement.paused) {
            boton.innerHTML = this._iconoPausa;
            await mediaElement.play();
            return;
        }

        mediaElement.pause()
        boton.innerHTML = this._iconoPlay;
    }

    /**
     * 
     * @param {String} idArchivo 
     */
    async obtenerInformacionArchivo(idArchivo) {
        const archivo = await this.servicioArchivo.obtenerInformacionDelArchivo(idArchivo)
        return archivo;
    }

    /**@type {ShadowRoot | undefined} */
    shadowRootObj = undefined;

    /**@private @type {ArchivoServicio} */
    servicioArchivo;

    /**@private */
    _cssResourceUrl = "/css/pico.min.css";

    _iconoPausa = "⏸️";
    _iconoPlay = "▶️";

    /**@private */
    _html = /*html*/`
        <div class="columna">
            <article aria-busy="true" id="tituloVideo"> CARGANDO </article>
            <section class="container-fluid centrado">
                <video id="video" style="background-color: black" autoplay controlsList="nofullscreen">
                    <source src="http://localhost:3000/api/streaming" id="videoSource" />
                </video>
            </section>
            <section id="controles" class="container">
                <label for="">
                    <input type="range" min="0" step="0.05" value="0" id="porcentajeVideo">
                </label>
                <div class="centrado">
                    <button class="outline contrast" id="botonPausa"> ⏸️ </button>
                    <label for="" style="margin-left: 2rem">
                        Volumen
                        <input id="input-volumen" type="range" step="0.01" min="0" max="1">
                        <!-- ESTE ES PARA EL RANGE VERTICAL, PERO EL CSS NO ME DEJA :'v <input id="input-volumen" type="range" step="0.01" min="0" max="1" style="writing-mode: vertical-lr; direction: rtl"> -->
                    </label>
                </div>
            </section>
            <section>
                <article id="descripcionVideo">
                    <header>Descripción</header>
                    <p id="descripcion"></p>
                </article>
            </section>
        </div>
    `

    _style = /*css*/`
        .columna {
            flex-direction: "column";
        }

        .centrado {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        #video {
            aspect-ratio: 16/9;
            height: 720px;
        }

        #controles {
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }

        #descripcionVideo {
            margin: 0rem 1rem 0rem 1rem;

        }

        ::-moz-range-track {
            background: #ccc;
            border: 0;
        }

        input::-moz-focus-inner { 
          border: 0; 
        }

        ::webkit-media-controls {
            display: none !important;
        }

        video::-webkit-media-controls-enclosure {
          display:none !important;
        }

        video::webkit-media-controls {
            display: none !important;
        }

    `

    /**@type {Ambiente} */
    ambiente;

}

customElements.define(nombreComponente, ReproductorComponente);