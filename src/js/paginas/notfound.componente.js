import ComponentePorDefecto from "../../../src/utilidades/componente.js";
import Enrutador from "../../../src/utilidades/Enrutador.js";

const nombreComponente = "not-found";
export default class NotFoundComponente extends ComponentePorDefecto {

    constructor() {
        super();
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
        this.router = Enrutador.obtenerInstancia();
        this.shadowRoot.innerHTML = "";
        this.shadowRoot.innerHTML = this._html;
        const boton = this.shadowRoot.querySelector("#botonCasa");

        boton.addEventListener('click', () => {
            this.router.push("/");
        });

    }

    /**@private */
    _html = /*html*/`
    <div>
        La pagina que intenta buscar no existe!! jeje
        <button id="botonCasa">Regresar a la casa</button>
    </div>
    `

}

customElements.define(nombreComponente, NotFoundComponente);