import Ambiente from "./Ambiente";

class SubirArchivoWorker {

    /**@type {string} */
    apiUrl;

    constructor() {
        self.onmessage = e => {
            this.mensajeRecibido(e);
        };

        this.apiUrl = Ambiente.obtenerInstancia().variables.url;
    }

    /**
     * 
     * @param { { data: { file: File, titulo: string, descripcion: string, duracion: string }} } e 
     */
    mensajeRecibido(e) {
        const formData = new FormData();

        formData.set("file", e.data.file);
        formData.set("titulo", e.data.titulo);
        formData.set("descripcion", e.data.descripcion);
        formData.set("duracion", e.data.duracion);

        if (!this.esFormDataValido(formData)) {
            throw new Error("El formData no es valido");
        }

        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open("POST", `${this.apiUrl}archivo/subir`, true);
        xhr.upload.onprogress = e => { this.enviarMensaje(e); }
        xhr.send(formData);
    }

    /**
     * 
     * @param {FormData} formData 
     */
    esFormDataValido(formData) {

        if (formData.get("file") === null) {
            console.log("file es null")
            return false
        }

        if (formData.get("titulo") === null) {
            console.log("titulo es null")
            return false;
        }

        if (formData.get("descripcion") === null) {
            console.log("descripcion es null")
            return false;
        }

        if (formData.get("duracion") === null) {
            console.log("duracion es null")
            return false;
        }

        return true;
    }

    /**@param {ProgressEvent} e */
    enviarMensaje(e) {
        console.log(e);
        postMessage({
            actual: e.loaded,
            total: e.total,
            envioCompleto: e.loaded === e.total
        });
    }

}

const worker = new SubirArchivoWorker();