import { conDB } from "../config/database";
//obtiene la carga academica de un docente
export const getCargaAcademica = async (ide_docente: string, periodo: string) => {
    let result = await conDB
        .select(
            'col_colegio_asignatura_docente.cod_colegio_asignatura_docente',
            'col_colegio_asignatura_docente.cod_colegio_asignatura',
            'col_colegio_asignatura_docente.ide_persona',
            'tec_formaacademica.nom_formaacademica AS forma_academica',
            'col_nivel_educacion.nom_nivel_educativo AS programa',
            'col_curso.nom_curso AS semestre',
            'col_grupo.nom_grupo AS grupo',
            'col_colegio.siglas_colegio AS sede',
            'col_periodo.nom_periodo AS periodo',
            'col_asignatura.cod_intern_asig',
            'col_asignatura.nom_asignatura',
            'col_asignatura.abrev_asignatura'
        )
        .from("col_colegio_asignatura_docente")
        .join("tec_formaacademica", "col_colegio_asignatura_docente.cod_formaacademica", "=", "tec_formaacademica.cod_formaacademica")
        .join("col_curso_grupo", "col_colegio_asignatura_docente.ide_curso_grupo", "=", "col_curso_grupo.ide_curso_grupo")
        .join("col_colegio_asignatura", "col_colegio_asignatura_docente.cod_colegio_asignatura", "=", "col_colegio_asignatura.cod_colegio_asignatura")
        .join("col_colegio_periodo", "col_curso_grupo.cod_colegio_periodo", "=", "col_colegio_periodo.cod_colegio_periodo")
        .join("col_nivel_educacion", "col_curso_grupo.cod_programaacademico", "=", " col_nivel_educacion.cod_nivel_educativo")
        .join("col_curso", "col_curso_grupo.cod_curso", "=", "col_curso.cod_curso")
        .join("col_grupo", "col_curso_grupo.cod_grupo", "=", "col_grupo.cod_grupo")
        .join("col_jornada", "col_curso_grupo.cod_jornada", "=", " col_jornada.cod_jornada")
        .join("col_colegio", "col_colegio_periodo.cod_colegio", "=", "col_colegio.cod_colegio")
        .join("col_periodo", "col_colegio_periodo.cod_periodo", "=", "col_periodo.cod_periodo")
        .join("col_asignatura", "col_colegio_asignatura.cod_asignatura", "=", "col_asignatura.cod_asignatura")
        .where({ 'col_colegio_asignatura_docente.ide_persona': ide_docente, 'col_periodo.nom_periodo': periodo })
    return result;
};


//obtiene el horario de una asignatura orientada por un docente
export const getHorarioAsigantura = async (cod_colegio_asignatura_docente: number) => {
    let result = await conDB
        .select(
            'col_colegio_asignatura_docente.cod_colegio_asignatura_docente',
            'col_colegio_asignatura_docente.ide_persona',
            'col_salon.nom_salon',
            'hor_dias.desc_dia',
            'hor_dias.abreviatura',
            'hor_horas.desc_hora',
            'hor_horas.hora_inicial',
            'hor_horas.hora_final',
            'hor_horas.abreviatura',
            'hor_horas.orden',
        )
        .from("hor_horario")
        .join("col_colegio_asignatura_docente", "hor_horario.cod_colegio_asignatura_docente", "=", "col_colegio_asignatura_docente.cod_colegio_asignatura_docente")
        .join("hor_horas", "hor_horario.cod_hora", "=", "hor_horas.cod_hora")
        .join("col_salon", "hor_horario.cod_salon", "=", " col_salon.cod_salon")
        .join("hor_dias", "hor_horario.cod_dia", "=", "hor_dias.cod_dia")

        .where({ 'col_colegio_asignatura_docente.cod_colegio_asignatura_docente': cod_colegio_asignatura_docente })
        .orderBy([{ column: 'hor_dias.cod_dia' }, { column: 'hor_horas.orden' }]);

    return result;
};



//obtiene el horario de todas las asignaturas que un docente tiene
export const getHorarioSemana = async (ide_docente: string, nom_periodo: string) => {
    let result = await conDB
        .select(
            'col_colegio_asignatura_docente.cod_colegio_asignatura_docente',
            'col_colegio_asignatura_docente.ide_persona',
            'col_asignatura.nom_asignatura',
            'col_asignatura.abrev_asignatura',
            'tec_plandeestudios.des_planestudios',
            'col_nivel_educacion.nom_nivel_educativo as programa',
            'col_nivel_educacion.abrev_programa',
            'col_periodo.nom_periodo AS periodo',
            'col_grupo.nom_grupo as grupo',
            'col_salon.nom_salon as salon',
            'hor_dias.cod_dia',
            'hor_dias.desc_dia as dia',
            'hor_dias.abreviatura as abre_dia',
            'hor_horas.desc_hora',
            'hor_horas.hora_inicial',
            'hor_horas.hora_final',
            'hor_horas.abreviatura as abrev_hora',
            'hor_horas.orden'
        )
        .from("col_colegio_asignatura_docente")
        .leftJoin("hor_horario", "hor_horario.cod_colegio_asignatura_docente", "=", "col_colegio_asignatura_docente.cod_colegio_asignatura_docente")
        .join("col_curso_grupo", "col_colegio_asignatura_docente.ide_curso_grupo", "=", "col_curso_grupo.ide_curso_grupo")
        .join("col_colegio_asignatura", "col_colegio_asignatura_docente.cod_colegio_asignatura", "=", "col_colegio_asignatura.cod_colegio_asignatura")
        .join("col_colegio_periodo", "col_curso_grupo.cod_colegio_periodo", "=", "col_colegio_periodo.cod_colegio_periodo")
        .join("col_nivel_educacion", "col_curso_grupo.cod_programaacademico", "=", "col_nivel_educacion.cod_nivel_educativo")
        .join("col_periodo", "col_colegio_periodo.cod_periodo", "=", "col_periodo.cod_periodo")
        .join("col_grupo", "col_curso_grupo.cod_grupo", "=", "col_grupo.cod_grupo")
        .join("col_asignatura", "col_colegio_asignatura.cod_asignatura", "=", "col_asignatura.cod_asignatura")
        .join("col_pensul", "col_colegio_asignatura.cod_pensum", "=", "col_pensul.cod_pensul")
        .join("tec_plandeestudios", "col_pensul.cod_planestudios", "=", "tec_plandeestudios.cod_planestudios")
        .join("hor_horas", "hor_horario.cod_hora", "=", "hor_horas.cod_hora")
        .join("col_salon", "hor_horario.cod_salon", "=", " col_salon.cod_salon")
        .join("hor_dias", "hor_horario.cod_dia", "=", "hor_dias.cod_dia")

        .where({ 'col_colegio_asignatura_docente.ide_persona': ide_docente, 'col_periodo.nom_periodo': nom_periodo })
        .orderBy([{ column: 'hor_dias.cod_dia' }, { column: 'hor_horas.orden' }]);

    return result;
};



//obtiene los estudiantes registrados en una asignatura
export const obtenerEstudaintesCarga = async (cod_colegio_asignatura_docente: number) => {
    let result = await conDB
        .select(
            'col_boletin.cod_boletin',
            'col_boletin.cod_colegio_asignatura_docente',
            'col_boletin.cod_colegio_asignatura_matricula',
            'col_boletin.subperiodo1',
            'col_boletin.subperiodo2',
            'col_boletin.subperiodo3',
            'col_matricula.cod_matricula',
            'col_colegio_asignatura_matricula.fecha_registro',
            'tec_plandeestudios.des_planestudios',
            'tec_estadomatricula.nom_estadomatricula',
            'tec_estadomatricula.cod_estadomatricula',
            'col_persona.ide_persona',
            'col_persona.ape1_persona',
            'col_persona.ape2_persona',
            'col_persona.nom1_persona',
            'col_persona.nom2_persona',
            'col_persona.cel_persona',
            'col_persona.tel_persona',
            'col_persona.email_persona',
            'col_persona.email_institucion',
        )
        .from("col_boletin")
        .join("col_colegio_asignatura_matricula", "col_boletin.cod_colegio_asignatura_matricula", "=", "col_colegio_asignatura_matricula.cod_colegio_asignatura_matricula")
        .join("col_matricula", "col_colegio_asignatura_matricula.cod_matricula ", "=", "col_matricula.cod_matricula")
        .join("col_persona", "col_matricula.ide_estudiante", "=", "col_persona.ide_persona")
        .join("tec_programa_persona", "col_matricula.id_programa_persona", "=", "tec_programa_persona.id_programa_persona")
        .join("tec_plandeestudios", "tec_programa_persona.cod_planestudios", "=", "tec_plandeestudios.cod_planestudios")
        .join("tec_estadomatricula", "col_matricula.cod_estadomatricula", "=", "tec_estadomatricula.cod_estadomatricula")
        .where({ 'col_boletin.cod_colegio_asignatura_docente': cod_colegio_asignatura_docente })
        .orderBy([{ column: 'col_persona.ape1_persona' }, { column: 'col_persona.ape2_persona' }, { column: 'col_persona.nom1_persona' }, { column: 'col_persona.nom2_persona' }]);

    return result;
};


//obtiene los 5 ultimos periodos donde el docente tiene carga academica
export const obtenerPeriodosDocente = async (ide_docente: string) => {
    let result = await conDB
        .select(
            'col_colegio_periodo.cod_colegio_periodo',
            'col_colegio.cod_colegio',
            'col_colegio.siglas_colegio',
            'col_periodo.cod_periodo',
            'col_periodo.nom_periodo'
        )
        .from("col_colegio_asignatura_docente")
        .join("col_curso_grupo", "col_colegio_asignatura_docente.ide_curso_grupo", "=", "col_curso_grupo.ide_curso_grupo")
        .join("col_colegio_periodo", "col_curso_grupo.cod_colegio_periodo", "=", "col_colegio_periodo.cod_colegio_periodo")
        .join("col_colegio", "col_colegio_periodo.cod_colegio", "=", "col_colegio.cod_colegio")
        .join("col_periodo", "col_colegio_periodo.cod_periodo", "=", "col_periodo.cod_periodo")

        .where({ 'col_colegio_asignatura_docente.ide_persona': ide_docente })
        .groupBy('col_colegio_periodo.cod_colegio_periodo')
        .orderBy('col_periodo.cod_periodo', 'DESC');
    return result;
};



//crea una nueva sesion de asistencia
export const crearSesionAsistencia = async (dataInsert: any) => {
    let result = conDB("tec_syllabussesion").insert(dataInsert);
    return result;
};

//elimina la sesion creada por el docente
export const delSesionAsistencia = async (dataInsert: any) => {

    return await conDB("tec_syllabussesion")
        .where({
            'id_syllabussesion': dataInsert.id_syllabussesion,
            'persona_id': dataInsert.persona_id,
        })
        .del();

};