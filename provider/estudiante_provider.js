const { conDB } = require('../config/database');


let getPrograma = async(ide) => {
    let sql = `SELECT
    tec_institucion_programa.cod_colegio_programa
    , col_colegio.siglas_colegio
    , col_colegio.nom_colegio
    , col_colegio.cod_institucion
    , col_nivel_educacion.codigo_snies
    , col_nivel_educacion.abrev_programa
    , col_nivel_educacion.nom_nivel_educativo,
    tec_programa_persona.id_programa_persona
    FROM
    tec_institucion_programa
    INNER JOIN col_colegio 
        ON (tec_institucion_programa.cod_colegio = col_colegio.cod_colegio)
    INNER JOIN col_nivel_educacion 
        ON (tec_institucion_programa.cod_nivel_educativo = col_nivel_educacion.cod_nivel_educativo)
    INNER JOIN tec_programa_persona 
        ON (tec_programa_persona.cod_colegio_programa = tec_institucion_programa.cod_colegio_programa)
    INNER JOIN col_matricula 
        ON (col_matricula.id_programa_persona = tec_programa_persona.id_programa_persona)
        WHERE col_matricula.ide_estudiante=? GROUP BY tec_programa_persona.id_programa_persona`;

    return await conDB.raw(sql, [ide]);

}


let getMatricula = async(idEstudiante, idPrograma) => {
    let sql = `SELECT
    col_matricula.cod_matricula
    ,col_matricula.fecha_matricula
    , col_persona.ide_persona
    , col_persona.ape1_persona
    , col_persona.ape2_persona
    , col_persona.nom1_persona
    , col_persona.nom2_persona
    , col_colegio.siglas_colegio
    , col_periodo.nom_periodo
    , col_curso.nom_curso
    , tec_estadomatricula.nom_estadomatricula
FROM
    col_matricula
    INNER JOIN col_persona 
        ON (col_matricula.ide_estudiante = col_persona.ide_persona)
    INNER JOIN col_colegio_periodo 
        ON (col_matricula.cod_colegio_periodo = col_colegio_periodo.cod_colegio_periodo)
    INNER JOIN col_colegio 
        ON (col_colegio_periodo.cod_colegio = col_colegio.cod_colegio)
    INNER JOIN col_periodo 
        ON (col_colegio_periodo.cod_periodo = col_periodo.cod_periodo)
    INNER JOIN tec_estadomatricula 
        ON (col_matricula.cod_estadomatricula = tec_estadomatricula.cod_estadomatricula)
    INNER JOIN col_curso 
        ON (col_matricula.cod_curso = col_curso.cod_curso)
         WHERE col_matricula.ide_estudiante=? AND col_matricula.id_programa_persona=?
         ORDER BY col_periodo.nom_periodo DESC `;
    return await conDB.raw(sql, [idEstudiante, idPrograma]);
}

module.exports = {
    getPrograma,
    getMatricula
};