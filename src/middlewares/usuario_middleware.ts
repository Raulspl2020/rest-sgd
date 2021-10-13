let Validator = require("validatorjs");
Validator.useLang("es");
export const validaupdateContactUser = (req: any, res: any, next: any) => {

    const validationRule = {
        cel_persona: "required|numeric|digits_between:7,10",
        email_persona: "required|email"
    };

    let validation = new Validator(req.body, validationRule);

    if (validation.passes()) {
        next();
    } else {
        res.status(412).send({
            error: true,
            message: "Campos con información incorrecta o sin completar",
            errors: validation.errors.all(),
        });
    }

};

export const validaChangePassword = (req: any, res: any, next: any) => {

    const validationRule = {
        password_old: "required|string",
        password_new: "required|string|digits_between:7,16"
    };

    let validation = new Validator(req.body, validationRule);

    if (validation.passes()) {
        next();
    } else {
        res.status(412).send({
            error: true,
            message: "Campos con información incorrecta o sin completar",
            errors: validation.errors.all(),
        });
    }

};