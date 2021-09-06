export const f_strDigitoVerificacionNIT = (Nit: string): string => {

    let Temp: string;
    let Residuo: number;
    let Acumulador: number;
    let Vector: number[] = [
        3,
        7,
        13,
        17,
        19,
        23,
        29,
        37,
        41,
        43,
        47,
        53,
        59,
        67,
        71
    ];

    Acumulador = 0;
    Residuo = 0;

    for (let i = 0; i <= Nit.length - 1; i++) {
        Temp = Nit.charAt((Nit.length - 1) - i);
        Acumulador = Acumulador + (parseInt(Temp) * Vector[i]);
    }

    Residuo = Acumulador % 11;

    if (Residuo > 1) {
        return (11 - Residuo).toString();
    } else {
        return Residuo.toString();
    }

}