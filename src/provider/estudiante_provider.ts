import { conDB } from "../config/database";


export const getPrograma = async (ide: number) => {
  let sql = `SELECT
    col_persona.ide_persona
    , col_persona.ape1_persona
    , col_persona.ape2_persona
    , col_persona.nom1_persona
    , col_persona.nom2_persona
    , tec_programa_persona.id_programa_persona
    , tec_estadoinscripcion.nom_estadoinscripcion
    , col_colegio.siglas_colegio
    , tec_programa_persona.id_programa_persona
    , col_nivel_educacion.nom_nivel_educativo
    , tec_institucion_programa.cod_snies
    , tec_programa_persona.fecha_inicio
FROM
    tec_programa_persona
    INNER JOIN col_persona 
        ON (tec_programa_persona.ide_persona = col_persona.ide_persona)
    INNER JOIN tec_estadoinscripcion 
        ON (tec_programa_persona.cod_estadoinscripcion = tec_estadoinscripcion.cod_estadoinscripcion)
    INNER JOIN tec_institucion_programa 
        ON (tec_programa_persona.cod_colegio_programa = tec_institucion_programa.cod_colegio_programa)
    INNER JOIN col_colegio 
        ON (tec_institucion_programa.cod_colegio = col_colegio.cod_colegio)
    INNER JOIN col_nivel_educacion 
        ON (tec_institucion_programa.cod_nivel_educativo = col_nivel_educacion.cod_nivel_educativo)
        WHERE col_persona.ide_persona=?`;

  return await conDB.raw(sql, [ide]);
};

export const getMatricula = async (idEstudiante: number, idPrograma: number) => {
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
};

export const getCorreoEstudiante = async (idEstudiate: number) => {
  return await conDB
  .where({ 'ide_persona': idEstudiate })
  .select('ide_persona', 'email_institucion', 'email_persona')
  .from("col_persona").first();

};

export {

};
