export interface ClienteSysApolo {

    cod_ter?: string,
    ide_tipo_identificacion: number,
    nit_ter?: string,
    num_identificacion?: string,
    dig_verificacion?: string,
    nom_ter: string,
    rep_legal?: string,
    pri_apellido: string,
    seg_apellido: string,
    pri_nombre: string,
    otr_nombre: string,
    cla_ter?: string,
    dir_ter?: string,
    tel_ter?: string,
    email: string,
    ide_mun?: string,
    cod_cargo?: string,
    tip_tercero?: string,
    sex_tercero?: string,
    fec_nacimiento?: Date,
    est_tercero?: string,
    cod_centro_costo?: string,
    fec_ingreso?: string,
    salario_mensual?: number,
    cod_entidad_reciproca?: string
}

export interface ClienteSigedin {
    cod_matricula?: number,
    cod_doc: number,
    tipo_doc: string,
    nom_estadomatricula?: string,
    ide_persona: string,
    ape1_persona: string,
    ape2_persona?: string,
    nom1_persona: string,
    nom2_persona?: string,
    email_persona: string,
    cel_persona: string,
    siglas_colegio?: string,
    cod_colegio: string,
    nom_periodo?: string,
    cod_periodo?: number,
    cod_nivel_edu?: number, // nivel de educacion
    cod_nivel_educativo?: number, //programa academico
    nom_nivel_educativo?: string,
    nro_creditos?: any,
    ide_genero?: string,
    cod_municipio?: string,
    dir_persona?: string



}