export default class ComponentePorDefecto extends HTMLElement {

    /**@abstract @returns {String} */
    obtenerNombreComponente() { throw new Error("El método no ha sido implementado") }

}