import { Schema, model } from "mongoose";

interface SesionInterface {
    token: string,
    user_id: string,
    fecha_creacion: Date,
    fecha_caducidad: Date,
    sesion_id: string,
    estado: number,
}


const SesionSchema = new Schema<SesionInterface>({
    token: {
        type: String,
        required: [true, "Token requerido"],
        unique: true
    },
    user_id: {
        type: String,
        required: [true, "usuario es requerido"],
    },
    fecha_creacion: {
        type: Date,
        required: false
    },
    fecha_caducidad: {
        type: Date,
        required: false
    },
    sesion_id: {
        type: String,
        required: true
    },
    estado: {
        type: Number,
        required: false,
        default: 0
    },
});

SesionSchema.set("bufferCommands", false);

export default model<SesionInterface>('Sesion', SesionSchema);
