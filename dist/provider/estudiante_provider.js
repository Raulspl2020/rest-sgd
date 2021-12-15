"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgramasEstudiante = exports.getInfoEstudianteProv = exports.getMateriasEstudiante = exports.getEstMatriculados = exports.getCorreoEstudiante = exports.getMatricula = exports.getPrograma = void 0;
const database_1 = require("../config/database");
exports.getPrograma = (ide) => __awaiter(void 0, void 0, void 0, function* () {
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
    return yield database_1.conDB.raw(sql, [ide]);
});
exports.getMatricula = (idEstudiante, idPrograma) => __awaiter(void 0, void 0, void 0, function* () {
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
    return yield database_1.conDB.raw(sql, [idEstudiante, idPrograma]);
});
exports.getCorreoEstudiante = (idEstudiate) => __awaiter(void 0, void 0, void 0, function* () {
    return yield database_1.conDB
        .where({ 'ide_persona': idEstudiate })
        .select('ide_persona', 'email_institucion', 'email_persona')
        .from("col_persona").first();
});
//consultas para reporte
exports.getEstMatriculados = () => __awaiter(void 0, void 0, void 0, function* () {
    let sql = `SELECT col_periodo.nom_periodo AS PERIODO
    , col_periodo.cod_periodo
    , col_colegio.siglas_colegio AS NOM_SEDE
    , col_persona.ide_persona AS NUM_DOCUMENTO
    , CONCAT_WS(' ',col_persona.ape1_persona, col_persona.ape2_persona, col_persona.nom1_persona, col_persona.nom2_persona) AS NOM_ESTUDIANTE
    , col_nivel_educacion.nom_nivel_educativo AS PROGRAMA
    , col_curso.nom_curso AS SEMESTRE
	, col_grupo.nom_grupo
    , col_matricula.cod_matricula AS COD_MATRICULA 
    , tec_institucion_programa.cod_snies AS COD_SNIES
	, col_municipios.nom_municipio AS MPIO_EXP
	, tec_programa_persona.nro_acta_indiv AS ACTA_INDIV
	, CONCAT_WS(' / ',col_persona.tel_persona,col_persona.cel_persona) AS TELEFONO
	, col_persona.email_persona AS EMAIL
	, col_persona.ide_genero AS SEXO
	, col_matricula.id_programa_persona
	, col_matricula.programa_gobierno  
FROM
    tec_programa_persona
    INNER JOIN col_persona 
        ON (tec_programa_persona.ide_persona = col_persona.ide_persona) 
    LEFT OUTER JOIN col_municipios 
	    ON (col_municipios.cod_municipio = col_persona.cod_mun_exp) 
    INNER JOIN col_matricula 
        ON (tec_programa_persona.id_programa_persona= col_matricula.id_programa_persona)
    INNER JOIN col_curso
        ON (col_curso.cod_curso = col_matricula.cod_curso) 
	INNER JOIN col_grupo 
	    ON (col_grupo.cod_grupo = col_matricula.cod_grupo) 
    INNER JOIN tec_estadomatricula
       ON (col_matricula.cod_estadomatricula = tec_estadomatricula.cod_estadomatricula)
    INNER JOIN col_colegio_periodo
       ON (col_matricula.cod_colegio_periodo = col_colegio_periodo.cod_colegio_periodo)
    INNER JOIN col_periodo
       ON (col_periodo.cod_periodo = col_colegio_periodo.cod_periodo)
    INNER JOIN tec_estadoinscripcion 
        ON (tec_programa_persona.cod_estadoinscripcion = tec_estadoinscripcion.cod_estadoinscripcion)
    INNER JOIN tec_institucion_programa 
        ON (tec_programa_persona.cod_colegio_programa = tec_institucion_programa.cod_colegio_programa)
    INNER JOIN col_nivel_educacion 
        ON (tec_institucion_programa.cod_nivel_educativo = col_nivel_educacion.cod_nivel_educativo)
    INNER JOIN col_colegio 
        ON (tec_institucion_programa.cod_colegio = col_colegio.cod_colegio) 
WHERE (col_colegio_periodo.cod_periodo IN (36,37,38)  AND tec_programa_persona.cod_estadoinscripcion NOT IN (3) AND col_matricula.cod_estadomatricula = '3' ) 
ORDER BY col_nivel_educacion.cod_nivel_edu ASC, col_nivel_educacion.cod_nivel_educativo, col_curso.cod_curso ASC`;
    let result = yield database_1.conDB.raw(sql);
    if (result[0].length > 0) {
        return result[0];
    }
    else {
        return false;
    }
});
exports.getMateriasEstudiante = (periodo, programa_per, ide_per) => __awaiter(void 0, void 0, void 0, function* () {
    let sql = `SELECT materias.*, COUNT(materias.nom_asignatura) AS perdidas FROM (SELECT
        col_matricula.cod_matricula
        , col_matricula.ide_estudiante
        , col_matricula.fecha_matricula
        , col_asignatura.nom_asignatura
        , col_colegio_asignatura.nro_creditos
        , col_boletin.subperiodo1
        , col_boletin.subperiodo2
        , col_boletin.subperiodo3
        , col_colegio_asignatura_matricula.nota_definitiva
        , col_colegio_asignatura_matricula.habilitacion
        , col_colegio_asignatura_matricula.nota_final
        , col_nivel_educacion.nom_nivel_educativo
        , col_curso.nom_curso
            , col_periodo.cod_periodo
        , col_periodo.nom_periodo
        , col_estadomateria.nom_estadomateria
       , col_estadomateria.cod_estadomateria
      
     ,col_colegio_asignatura_matricula.cod_formaacademica
    FROM
        col_colegio_asignatura_matricula
        INNER JOIN col_matricula 
            ON (col_colegio_asignatura_matricula.cod_matricula = col_matricula.cod_matricula)
        INNER JOIN tec_programa_persona 
            ON (col_matricula.id_programa_persona = tec_programa_persona.id_programa_persona)
        INNER JOIN col_curso 
            ON (col_matricula.cod_curso = col_curso.cod_curso)
        INNER JOIN col_colegio_periodo 
            ON (col_matricula.cod_colegio_periodo = col_colegio_periodo.cod_colegio_periodo)
        LEFT JOIN col_boletin 
            ON (col_boletin.cod_colegio_asignatura_matricula = col_colegio_asignatura_matricula.cod_colegio_asignatura_matricula)
        INNER JOIN col_colegio_asignatura 
            ON (col_colegio_asignatura_matricula.cod_colegio_asignatura = col_colegio_asignatura.cod_colegio_asignatura)
        INNER JOIN col_estadomateria 
            ON (col_colegio_asignatura_matricula.cod_estadomateria = col_estadomateria.cod_estadomateria)
        INNER JOIN col_asignatura 
            ON (col_colegio_asignatura.cod_asignatura = col_asignatura.cod_asignatura)
        INNER JOIN tec_institucion_programa 
            ON (tec_programa_persona.cod_colegio_programa = tec_institucion_programa.cod_colegio_programa)
        INNER JOIN col_nivel_educacion 
            ON (tec_institucion_programa.cod_nivel_educativo = col_nivel_educacion.cod_nivel_educativo)
        INNER JOIN col_periodo 
            ON (col_colegio_periodo.cod_periodo = col_periodo.cod_periodo)
            
    
             WHERE col_matricula.ide_estudiante =?
             AND col_estadomateria.cod_estadomateria NOT IN (5,6,7) 
             AND  col_matricula.id_programa_persona = ?
             AND col_periodo.cod_periodo BETWEEN 0 AND ?
             AND col_estadomateria.cod_estadomateria =1
             GROUP BY col_colegio_asignatura_matricula.cod_colegio_asignatura_matricula
            ORDER BY col_periodo.cod_periodo ASC) AS materias
            GROUP BY materias.nom_asignatura
            ORDER BY COUNT(materias.nom_asignatura) DESC
            LIMIT 1`;
    let result = yield database_1.conDB.raw(sql, [ide_per, programa_per, periodo]);
    if (result[0].length > 0) {
        return result[0];
    }
    else {
        return false;
    }
});
exports.getInfoEstudianteProv = (ide_per) => __awaiter(void 0, void 0, void 0, function* () {
    let sql = `SELECT
col_persona.ide_persona
, col_tipodoc.siglas AS tipo_documento
, col_persona.fec_expedicion_doc
, col_persona.ape1_persona
, col_persona.ape2_persona
, col_persona.nom1_persona
, col_persona.nom2_persona
, col_persona.fech_nac_persona
, col_municipios.nom_municipio munucipio_expedicion
, col_periodo.nom_periodo AS periodo
, col_colegio.siglas_colegio AS sede
,col_genero.nom_genero
, col_persona.dir_persona
, col_persona.tel_persona
, col_persona.cel_persona
, col_persona.email_persona
, col_persona.email_institucion
, col_nivel_educacion.nom_nivel_educativo AS programa
, tec_institucion_programa.cod_snies
, col_curso.nom_curso AS semestre
, tec_estadomatricula.nom_estadomatricula
, tec_estadoinscripcion.nom_estadoinscripcion
, col_matricula.cod_matricula
, col_matricula.fecha_matricula
FROM
col_matricula
INNER JOIN col_persona
ON (col_matricula.ide_estudiante = col_persona.ide_persona)
LEFT JOIN col_tipodoc 
   ON (col_persona.tipo_doc = col_tipodoc.tipo_doc)
LEFT JOIN col_municipios 
   ON (col_persona.cod_mun_exp = col_municipios.cod_municipio)
INNER JOIN col_genero 
   ON (col_persona.ide_genero = col_genero.ide_genero)
INNER JOIN col_curso 
   ON (col_matricula.cod_curso = col_curso.cod_curso)
INNER JOIN tec_programa_persona 
   ON (col_matricula.id_programa_persona = tec_programa_persona.id_programa_persona)
INNER JOIN tec_estadomatricula 
   ON (col_matricula.cod_estadomatricula = tec_estadomatricula.cod_estadomatricula)
INNER JOIN col_colegio_periodo 
   ON (col_matricula.cod_colegio_periodo = col_colegio_periodo.cod_colegio_periodo)
INNER JOIN tec_institucion_programa 
   ON (tec_programa_persona.cod_colegio_programa = tec_institucion_programa.cod_colegio_programa)
INNER JOIN tec_estadoinscripcion 
   ON (tec_programa_persona.cod_estadoinscripcion = tec_estadoinscripcion.cod_estadoinscripcion)
INNER JOIN col_nivel_educacion 
   ON (tec_institucion_programa.cod_nivel_educativo = col_nivel_educacion.cod_nivel_educativo)
INNER JOIN col_periodo 
   ON (col_colegio_periodo.cod_periodo = col_periodo.cod_periodo)
INNER JOIN col_colegio 
   ON (col_colegio_periodo.cod_colegio = col_colegio.cod_colegio)
     WHERE col_matricula.ide_estudiante=?
     GROUP BY col_matricula.cod_matricula`;
    let result = yield database_1.conDB.raw(sql, [ide_per]);
    if (result[0].length > 0) {
        return result[0];
    }
    else {
        return false;
    }
});
exports.getProgramasEstudiante = (estudiante_id) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conDB
        .select('tec_programa_persona.id_programa_persona', 'tec_programa_persona.ide_persona', 'col_colegio.cod_colegio', 'col_colegio.siglas_colegio', 'col_nivel_educacion.cod_nivel_educativo', 'col_nivel_educacion.nom_nivel_educativo', 'tec_estadoinscripcion.nom_estadoinscripcion AS estado')
        .from("tec_programa_persona")
        .join("tec_institucion_programa", "tec_programa_persona.cod_colegio_programa ", "=", "tec_institucion_programa.cod_colegio_programa")
        .join("col_nivel_educacion", "tec_institucion_programa.cod_nivel_educativo", "=", "col_nivel_educacion.cod_nivel_educativo")
        .join("col_colegio", "tec_institucion_programa.cod_colegio", "=", "col_colegio.cod_colegio")
        .join("tec_estadoinscripcion", "tec_programa_persona.cod_estadoinscripcion", "=", "tec_estadoinscripcion.cod_estadoinscripcion")
        .where({ 'tec_programa_persona.ide_persona': estudiante_id })
        .groupBy('tec_institucion_programa.cod_colegio_programa');
    return result;
});
//# sourceMappingURL=estudiante_provider.js.map