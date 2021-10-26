import { Schema, model } from "mongoose";

interface CargueInterface {
    user_id: string,
    contenido: string,
    pagos: string,
    metadatos: string,
    fecha_cargue: Date,
    estado: number,
    host: string,
}


const CargueSchema = new Schema<CargueInterface>({

    user_id: {
        type: String,
        required: false,
    },
    fecha_cargue: {
        type: Date,
        required: false
    },
    contenido: {
        type: String,
        required: true
    },

    pagos: {
        type: String,
        required: true
    },

    metadatos: {
        type: String,
        required: true
    },

    estado: {
        type: Number,
        required: false,
        default: 0
    },
    host: {
        type: String,
        required: true
    },

});

export default model<CargueInterface>('Cargue', CargueSchema);