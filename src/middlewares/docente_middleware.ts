let Validator = require("validatorjs");
Validator.useLang("es");
export const validaGuardarSesionAsistencia = (req: any, res: any, next: any) => {

    console.log("Disparando middleware");
    console.log(req.body);
    const validationRule = {
        cod_colegio_asignatura_docente : "required|numeric",
        descripcion : "required|string",
        persona_id : "required|string",
        nro_horas : "required|numeric",
        clasificacion : "required|string",
        subperiodo_id : "required|numeric",
        examen_parcial : "required|string"
    };


    let validation = new Validator(req.body, validationRule);

    if (validation.passes()) {
        next();
    } else {
        res.status(412).send({
            error: true,
            message: "Hay campos obligatorios sin completar",
            errors: validation.errors.all(),
        });
    }

};