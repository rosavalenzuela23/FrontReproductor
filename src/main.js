import Enrutador from "./utilidades/Enrutador";


export default class Main {
    static main() {

        const app = document.querySelector("#aplicacion");

        if (app === null) {
            throw new Error("No se encontro el contenedor de la aplicacion");
        }

        const enrutador = Enrutador.obtenerInstancia();
        const webComponent = enrutador.obtenerWebComponentActual();

        const actualizarVista = (rutaNueva) => {
            app.innerHTML = enrutador.obtenerWebComponentActual();
        }

        enrutador.agregarSubscriptor(actualizarVista);
        app.innerHTML = webComponent;

    }

}

Main.main();