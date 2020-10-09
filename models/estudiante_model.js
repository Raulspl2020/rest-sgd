const cnx = require('../config/database');

let getProgramaAcademico = (id) => {
    return cnx
        .raw("SELECT\n" +
            "     `col_colegio`.`siglas_colegio`\n" +
            "    , `col_nivel_educacion`.`codigo_snies`\n" +
            "    , `col_nivel_educacion`.`abrev_programa`\n" +
            "    , `col_nivel_educacion`.`nom_nivel_educativo`\n" +
            "   , tec_programa_persona.`id_programa_persona`\n" +
            "    ,`tec_programa_persona`.`fecha_inicio` \n" +
            "   , `tec_programa_persona`.`fecha_grado`" +
            "FROM\n" +
            "    `tec_institucion_programa`\n" +
            "    INNER JOIN `col_colegio` \n" +
            "        ON (`tec_institucion_programa`.`cod_colegio` = `col_colegio`.`cod_colegio`)\n" +
            "    INNER JOIN `col_nivel_educacion` \n" +
            "        ON (`tec_institucion_programa`.`cod_nivel_educativo` = `col_nivel_educacion`.`cod_nivel_educativo`)\n" +
            "    INNER JOIN `tec_programa_persona` \n" +
            "        ON (`tec_programa_persona`.`cod_colegio_programa` = `tec_institucion_programa`.`cod_colegio_programa`)\n" +
            "    INNER JOIN `col_matricula` \n" +
            "        ON (`col_matricula`.`id_programa_persona` = `tec_programa_persona`.`id_programa_persona`)\n" +
            "        WHERE `col_matricula`.ide_estudiante=? GROUP BY tec_programa_persona.`id_programa_persona`", [id]);
}


let getSemeste = (id, id_programa) => {
    return cnx.raw("SELECT\n" +
        "    `col_matricula`.`cod_matricula`\n" +
        "    , `col_matricula`.`ide_estudiante`\n" +
        ", `col_periodo`.`cod_periodo` \n" +
        "    , `col_periodo`.`nom_periodo`\n" +
        "    , `col_curso`.`nom_curso`\n" +
        "    , `col_nivel_educacion`.`nom_nivel_educativo`\n" +
        "    , `col_matricula`.`cod_colegio`\n" +
        "    , `col_matricula`.`cod_grupo`\n" +
        "    , `col_matricula`.`cod_curso`    \n" +
        "    , `col_matricula`.`fecha_matricula`, `col_nivel_educacion`.`cod_nivel_educativo`\n" +
        "FROM\n" +
        "    `col_matricula`\n" +
        "    INNER JOIN `col_colegio_periodo` \n" +
        "        ON (`col_matricula`.`cod_colegio_periodo` = `col_colegio_periodo`.`cod_colegio_periodo`)\n" +
        "    INNER JOIN `col_curso` \n" +
        "        ON (`col_matricula`.`cod_curso` = `col_curso`.`cod_curso`)\n" +
        "    INNER JOIN `col_periodo` \n" +
        "        ON (`col_colegio_periodo`.`cod_periodo` = `col_periodo`.`cod_periodo`)\n" +
        "        \n" +
        "    INNER JOIN `tec_programa_persona` \n" +
        "        ON (`col_matricula`.`id_programa_persona` = `tec_programa_persona`.`id_programa_persona`)\n" +
        "\t\t\n" +
        "    INNER JOIN `tec_institucion_programa`\n" +
        "\tON (`tec_programa_persona`.`cod_colegio_programa` = `tec_institucion_programa`.`cod_colegio_programa`)\n" +
        "   \n" +
        "    INNER JOIN `col_nivel_educacion` \n" +
        "        ON (`tec_institucion_programa`.`cod_nivel_educativo` = `col_nivel_educacion`.`cod_nivel_educativo`) \n" +
        "           WHERE `col_matricula`.ide_estudiante=? AND `col_matricula`.`id_programa_persona`=?\n" +
        "        GROUP BY `col_curso`.`cod_curso`", [id, id_programa]);

};


let getBoletin = (id, cod_matricula) => {

    return cnx.raw("SELECT\n" +
        "    `col_asignatura`.`cod_asignatura`\n" +
        "    , `col_asignatura`.`nom_asignatura`\n" +
        "    , `col_boletin`.`subperiodo1`\n" +
        "    , `col_boletin`.`subperiodo2`\n" +
        "    , `col_boletin`.`subperiodo3`\n" +
        "        , `col_colegio_asignatura_matricula`.`nota_final`\n" +
        "    , `col_colegio_asignatura_matricula`.`habilitacion`\n" +
        "\n" +
        "    , `col_colegio_asignatura_matricula`.`nota_definitiva`,\n" +
        "    col_matricula.`cod_matricula`\n" +
        "FROM\n" +
        "    `col_colegio_asignatura_matricula`\n" +
        "    INNER JOIN `col_matricula` \n" +
        "        ON (`col_colegio_asignatura_matricula`.`cod_matricula` = `col_matricula`.`cod_matricula`)\n" +
        "    INNER JOIN `col_colegio_asignatura` \n" +
        "        ON (`col_colegio_asignatura_matricula`.`cod_colegio_asignatura` = `col_colegio_asignatura`.`cod_colegio_asignatura`)\n" +
        "    INNER JOIN `col_asignatura` \n" +
        "        ON (`col_colegio_asignatura`.`cod_asignatura` = `col_asignatura`.`cod_asignatura`)\n" +
        "    INNER JOIN `col_boletin` \n" +
        "        ON (`col_boletin`.`cod_colegio_asignatura_matricula` = `col_colegio_asignatura_matricula`.`cod_colegio_asignatura_matricula`)\n" +
        "        WHERE `col_matricula`.ide_estudiante=? AND `col_matricula`.`cod_matricula`=? ", [id, cod_matricula]);

};

let getHorarioGeneral = (params) => {
    return cnx.raw("SELECT\n" +
        "    `hor_horario`.`cod_horario_curso_grupo`\n" +
        "    , `hor_dias`.`desc_dia`\n" +
        "    , `hor_horas`.`desc_hora`\n" +
        "    , `hor_horas`.`hora_inicial`\n" +
        "    , `hor_horas`.`hora_final`\n" +
        "    , `col_salon`.`nom_salon`\n" +
        "        , `col_asignatura`.`nom_asignatura`\n" +
        "    , `col_persona`.`nom1_persona`\n" +
        "    , `col_persona`.`nom2_persona`\n" +
        "    , `col_persona`.`ape1_persona`\n" +
        "    , `col_persona`.`ape2_persona`\n" +
        "    , `col_asignatura`.`cod_intern_asig`\n" +
        "\n" +
        "    , `col_colegio_periodo`.`cod_periodo`\n" +
        "FROM\n" +
        "    `hor_horario`\n" +
        "    INNER JOIN `hor_dias` \n" +
        "        ON (`hor_horario`.`cod_dia` = `hor_dias`.`cod_dia`)\n" +
        "    INNER JOIN `hor_horas` \n" +
        "        ON (`hor_horario`.`cod_hora` = `hor_horas`.`cod_hora`)\n" +
        "    INNER JOIN `hor_parametricas_horario` \n" +
        "        ON (`hor_horario`.`cod_parametricas_horarios` = `hor_parametricas_horario`.`cod_parametricas_horarios`)\n" +
        "    INNER JOIN `col_colegio_asignatura_docente` \n" +
        "        ON (`hor_horario`.`cod_colegio_asignatura_docente` = `col_colegio_asignatura_docente`.`cod_colegio_asignatura_docente`)\n" +
        "    INNER JOIN `col_curso_grupo` \n" +
        "        ON (`col_colegio_asignatura_docente`.`ide_curso_grupo` = `col_curso_grupo`.`ide_curso_grupo`)\n" +
        "    INNER JOIN `col_persona` \n" +
        "        ON (`col_colegio_asignatura_docente`.`ide_persona` = `col_persona`.`ide_persona`)\n" +
        "    INNER JOIN `col_colegio_asignatura` \n" +
        "        ON (`col_colegio_asignatura_docente`.`cod_colegio_asignatura` = `col_colegio_asignatura`.`cod_colegio_asignatura`)\n" +
        "    INNER JOIN `col_colegio_periodo` \n" +
        "        ON (`col_curso_grupo`.`cod_colegio_periodo` = `col_colegio_periodo`.`cod_colegio_periodo`)\n" +
        "    INNER JOIN `col_asignatura` \n" +
        "        ON (`col_colegio_asignatura`.`cod_asignatura` = `col_asignatura`.`cod_asignatura`)\n" +
        "            LEFT JOIN `col_salon` \n" +
        "        ON (`hor_horario`.`cod_salon` = `col_salon`.`cod_salon`)\n" +
        "        WHERE col_curso_grupo.`cod_programaacademico`=? \n" +
        "        AND col_curso_grupo.`cod_curso`=? \n" +
        "         AND col_curso_grupo.`cod_grupo`=? \n" +
        "         AND `col_colegio_periodo`.`cod_periodo`=? \n" +
        "         AND `col_colegio_asignatura`.`cod_colegio`=? \n" +
        "        ORDER BY `hor_dias`.`cod_dia`,`hor_horas`.`cod_hora` ASC ", [params.cod_nivel_educativo, params.cod_curso, params.cod_grupo, params.cod_periodo, params.cod_colegio]);

};



let getMiHorario = (id, params) => {
    return cnx.raw("SELECT\n" +
        "    `hor_horario`.`cod_horario_curso_grupo`\n" +
        "    , `hor_dias`.`desc_dia`\n" +
        "    , `hor_horas`.`desc_hora`\n" +
        "    , `hor_horas`.`hora_inicial`\n" +
        "    , `hor_horas`.`hora_final`\n" +
        "    , `col_salon`.`nom_salon`\n" +
        "        , `col_asignatura`.`nom_asignatura`\n" +
        "       , CONCAT_WS(' '\n" +
        "    , `col_persona`.`nom1_persona`\n" +
        "    , `col_persona`.`nom2_persona`\n" +
        "    , `col_persona`.`ape1_persona`\n" +
        "    , `col_persona`.`ape2_persona`) AS nom_largo_docente\n" +
        "           , CONCAT_WS(' '\n" +
        "    , `col_persona`.`nom1_persona`\n" +
        "    , `col_persona`.`ape1_persona`) AS nom_corto_docente\n" +
        "    \n" +
        "\n" +
        "FROM\n" +
        "    `hor_horario`\n" +
        "    INNER JOIN `hor_dias` \n" +
        "        ON (`hor_horario`.`cod_dia` = `hor_dias`.`cod_dia`)\n" +
        "    INNER JOIN `hor_horas` \n" +
        "        ON (`hor_horario`.`cod_hora` = `hor_horas`.`cod_hora`)\n" +
        "    INNER JOIN `hor_parametricas_horario` \n" +
        "        ON (`hor_horario`.`cod_parametricas_horarios` = `hor_parametricas_horario`.`cod_parametricas_horarios`)\n" +
        "    INNER JOIN `col_colegio_asignatura_docente` \n" +
        "        ON (`hor_horario`.`cod_colegio_asignatura_docente` = `col_colegio_asignatura_docente`.`cod_colegio_asignatura_docente`)\n" +
        "    INNER JOIN `col_curso_grupo` \n" +
        "        ON (`col_colegio_asignatura_docente`.`ide_curso_grupo` = `col_curso_grupo`.`ide_curso_grupo`)\n" +
        "    INNER JOIN `col_persona` \n" +
        "        ON (`col_colegio_asignatura_docente`.`ide_persona` = `col_persona`.`ide_persona`)\n" +
        "    INNER JOIN `col_colegio_asignatura` \n" +
        "        ON (`col_colegio_asignatura_docente`.`cod_colegio_asignatura` = `col_colegio_asignatura`.`cod_colegio_asignatura`)\n" +
        "    INNER JOIN `col_colegio_periodo` \n" +
        "        ON (`col_curso_grupo`.`cod_colegio_periodo` = `col_colegio_periodo`.`cod_colegio_periodo`)\n" +
        "    INNER JOIN `col_asignatura` \n" +
        "        ON (`col_colegio_asignatura`.`cod_asignatura` = `col_asignatura`.`cod_asignatura`)\n" +
        "        \n" +
        "\tINNER JOIN (SELECT\n" +
        "    `col_asignatura`.`cod_asignatura`\n" +
        "    , `col_asignatura`.`nom_asignatura`,\n" +
        "    col_matricula.`cod_matricula`\n" +
        "FROM\n" +
        "    `col_colegio_asignatura_matricula`\n" +
        "    INNER JOIN `col_matricula` \n" +
        "        ON (`col_colegio_asignatura_matricula`.`cod_matricula` = `col_matricula`.`cod_matricula`)\n" +
        "    INNER JOIN `col_colegio_asignatura` \n" +
        "        ON (`col_colegio_asignatura_matricula`.`cod_colegio_asignatura` = `col_colegio_asignatura`.`cod_colegio_asignatura`)\n" +
        "    INNER JOIN `col_asignatura` \n" +
        "        ON (`col_colegio_asignatura`.`cod_asignatura` = `col_asignatura`.`cod_asignatura`)\n" +
        "        WHERE `col_matricula`.ide_estudiante=? AND `col_matricula`.`cod_matricula`=?) AS aux\n" +
        "        \n" +
        "        ON (aux.cod_asignatura= col_asignatura.`cod_asignatura`)\n" +
        "\t\t\n" +
        "        \n" +
        "     LEFT JOIN `col_salon` \n" +
        "        ON (`hor_horario`.`cod_salon` = `col_salon`.`cod_salon`)\n" +
        "       WHERE col_curso_grupo.`cod_programaacademico`=? \n" +
        "      #  AND col_curso_grupo.`cod_curso`='4'\n" +
        "         AND col_curso_grupo.`cod_grupo`=? \n" +
        "         AND `col_colegio_periodo`.`cod_periodo`=? \n" +
        "         AND `col_colegio_asignatura`.`cod_colegio`=?\n" +
        "        ORDER BY `hor_dias`.`cod_dia`,`hor_horas`.`cod_hora` ASC ", [id, params.cod_matricula, params.cod_nivel_educativo, params.cod_grupo, params.cod_periodo, params.cod_colegio]);
};

module.exports = {
    getProgramaAcademico,
    getSemeste,
    getBoletin,
    getHorarioGeneral,
    getMiHorario
};