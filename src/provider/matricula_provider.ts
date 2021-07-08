import { conDB } from '../config/database';
export const getInfoMatricula = async (cod_matricula: any) => {
    // cod_nivel_edu: 6= tecnologico 7= profesional
    let sql = `SELECT
    col_matricula.cod_matricula
    , col_tipodoc.cod_aux AS cod_doc
    , col_tipodoc.siglas AS tipo_doc
    , tec_estadomatricula.nom_estadomatricula
    , col_persona.ide_persona
    , col_persona.ape1_persona
    , col_persona.ape2_persona
    , col_persona.nom1_persona
    , col_persona.nom2_persona
    ,col_persona.email_persona
    ,col_persona.cel_persona
    , col_colegio.siglas_colegio
    , col_colegio.cod_colegio
    , col_periodo.nom_periodo
    , col_periodo.cod_periodo
    , col_nivel_educacion.nom_nivel_educativo
    , col_nivel_educacion.cod_nivel_edu 
    ,SUM(IF(
        col_colegio_asignatura_matricula.cod_estadomateria IN (1, 2, 3, 5)
        AND col_colegio_asignatura_matricula.cod_formaacademica = 1,
        col_colegio_asignatura.nro_creditos,
        0
      )) AS nro_creditos  
      FROM
      col_matricula
      LEFT JOIN col_colegio_asignatura_matricula  
          ON (col_colegio_asignatura_matricula.cod_matricula = col_matricula.cod_matricula)
      INNER JOIN tec_estadomatricula 
          ON (col_matricula.cod_estadomatricula = tec_estadomatricula.cod_estadomatricula)
      INNER JOIN col_persona 
          ON (col_matricula.ide_estudiante = col_persona.ide_persona)
      INNER JOIN tec_programa_persona 
          ON (tec_programa_persona.id_programa_persona = col_matricula.id_programa_persona)
      INNER JOIN col_colegio_periodo 
          ON (col_matricula.cod_colegio_periodo = col_colegio_periodo.cod_colegio_periodo)
      LEFT JOIN col_colegio_asignatura 
          ON (col_colegio_asignatura_matricula.cod_colegio_asignatura = col_colegio_asignatura.cod_colegio_asignatura)
      INNER JOIN col_tipodoc 
          ON (col_persona.tipo_doc = col_tipodoc.tipo_doc)
      INNER JOIN tec_institucion_programa 
          ON (tec_programa_persona.cod_colegio_programa = tec_institucion_programa.cod_colegio_programa)
      INNER JOIN col_nivel_educacion 
          ON (tec_institucion_programa.cod_nivel_educativo = col_nivel_educacion.cod_nivel_educativo)
      INNER JOIN col_colegio 
          ON (col_colegio_periodo.cod_colegio = col_colegio.cod_colegio)
      INNER JOIN col_periodo 
          ON (col_colegio_periodo.cod_periodo = col_periodo.cod_periodo)
                WHERE col_matricula.cod_matricula =? 
        GROUP BY col_matricula.cod_matricula`;
    return await conDB.raw(sql, [cod_matricula]);
};


export const getDetPeriodo = async (cod_colegio: any, cod_periodo: any, fechaActual: string) => {
    // let fechaActual='2021-03-29';
    let result = await conDB
        .select("cod_colegio_periodo", "fec_inicio", "fec_fin", "cod_estado", "fec_ini_matordinaria", "fec_fin_matordinaria", "fec_ini_matextraord", "fec_fin_matextraord")
        .from("col_colegio_periodo")
        .whereRaw('? BETWEEN fec_ini_matordinaria AND fec_fin_matordinaria', [fechaActual])
        .where({
            'cod_colegio': cod_colegio,
            'cod_periodo': cod_periodo
        });
    if (result.length > 0) {
        return result[0];
    } else {
        return false;
    }
};


//obtiene las fechas configuradas en cada sede: col_colegio_periodo
export const getFechasPeriodo = async (cod_colegio: any, cod_periodo: any) => {
    // let fechaActual='2021-03-29';
    let result = await conDB
        .select()
        .from("col_colegio_periodo")
        .where({
            'cod_colegio': cod_colegio,
            'cod_periodo': cod_periodo
        });
    if (result.length > 0) {
        return result[0];
    } else {
        return false;
    }
};



//consultas las fechas de un periodo
export const getDatePeriodo = async (cod_colegio: any, cod_periodo: any) => {
    // let fechaActual='2021-03-29';
    let result = await conDB
        .select("cod_colegio_periodo", "fec_inicio", "fec_fin", "cod_estado", "fec_ini_matordinaria", "fec_fin_matordinaria", "fec_ini_matextraord", "fec_fin_matextraord", "fec_ini_ins_nuevos", "fec_fin_ins_nuevos")
        .from("col_colegio_periodo")
        .where({
            'cod_colegio': cod_colegio,
            'cod_periodo': cod_periodo
        });
    if (result.length > 0) {
        return result[0];
    } else {
        return false;
    }
};


//carga estudiantes con descuento a la tabla fin_porcentaje_soporte
export const insertArrayDescuento = async (dataInsert: any) => {
    const trx = await conDB.transaction();
    return await trx("fin_porcentaje_soporte")
        .insert(dataInsert)
        .then((result: any) => {

            return trx.raw('SELECT ROW_COUNT() as numero').then((afeccted: any) => {
                trx.commit();
                console.log(result);
                return [true, afeccted[0][0].numero];
            });

        })
        .catch((result: any) => {
            console.log(result);
            trx.rollback();
            return [false, result];
        });

}



//lista los cargues realizados exitosamente
export const getCargaDescuentos = async () => {
    let sql = "SELECT codigo_cargue, fecha, COUNT(*) AS numero FROM fin_porcentaje_soporte WHERE codigo_cargue <> '0' GROUP BY codigo_cargue ORDER BY _id DESC";
    let result = await conDB.raw(sql);
    if (result[0].length > 0) {
        return result[0];
    } else {
        return [];
    }
}

//permite veificar si algun descuento cargado con el codigo x se uso en una factura o esta en estado 4
export const verificaCargueFacturado = async (codigo: any) => {
    let sql = "SELECT * FROM fin_porcentaje_soporte WHERE codigo_cargue=? AND porcentaje_estado_id=4";
    let result = await conDB.raw(sql, [codigo]);
    if (result[0].length > 0) {
        return result[0];
    } else {
        return [];
    }
}
//permite veificar si algun descuento cargado con el codigo x se uso en una factura o esta en estado 4
export const eliminaDescuentosCargue = async (codigo: any) => {
    const trx = await conDB.transaction();
    return await trx("fin_porcentaje_soporte")
        .where("codigo_cargue", codigo)
        .del()
        .then((result: any) => {
            trx.commit();
            return true;

        })
        .catch((result: any) => {
            console.log(result);
            trx.rollback();
            return false;
        });

}

//lista los desceuntos cargados por codigo de cargue
export const getDataDescuentosByCodigo = async (codigo: any) => {
    let sql = `SELECT
    fin_porcentaje_soporte.codigo_cargue AS 'CODIGO CARGUE'
    , fin_porcentaje_soporte.config_id AS 'CONFIGURACION'
    , fin_porcentaje_soporte.porcentaje_estado_id AS 'ESTADO PORCENTAJE'
    , fin_porcentaje_estado.descripcion AS descripcion_estado
    , col_persona.ide_persona AS 'NRO IDENTIFICACION'
    , CONCAT_WS( " "   , col_persona.ape1_persona
    , col_persona.ape2_persona
    , col_persona.nom1_persona
    , col_persona.nom2_persona) AS estudiante
    , fin_porcentaje_soporte.matricula_id AS 'COD MATRICULA'
    , fin_porcentaje_soporte.porcentaje_categoria_id AS 'CATEGORIA PORCENTAJE'
    , fin_porcetaje_categoria.descripcion AS descripcion_categoria
    , fin_porcentaje_soporte.porcentaje AS 'VALOR PORCENTAJE'
    , col_periodo.cod_periodo AS 'ID PERIODO'
    , col_periodo.nom_periodo 
    , fin_porcentaje_soporte.observacion AS 'OBSERVACION'
    , fin_porcentaje_soporte.accion AS 'ACCION'
    , fin_porcentaje_soporte.tipo AS 'TIPO'
FROM
    fin_porcentaje_soporte
    INNER JOIN col_persona 
        ON (fin_porcentaje_soporte.estudiante_id = col_persona.ide_persona)
    INNER JOIN fin_porcetaje_categoria 
        ON (fin_porcentaje_soporte.porcentaje_categoria_id = fin_porcetaje_categoria._id)
    INNER JOIN col_periodo 
        ON (fin_porcentaje_soporte.periodo_id = col_periodo.cod_periodo)
    INNER JOIN fin_porcentaje_estado 
        ON (fin_porcentaje_soporte.porcentaje_estado_id = fin_porcentaje_estado._id) WHERE fin_porcentaje_soporte.codigo_cargue = ? ;`;
    let result = await conDB.raw(sql, [codigo]);
    if (result[0].length > 0) {
        return result[0];
    } else {
        return [];
    }
}




