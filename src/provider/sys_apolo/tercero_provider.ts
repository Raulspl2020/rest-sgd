import { ClienteSysApolo } from "../../interfaces/clientes.interface";
import { conSysApolo } from "../../config/database";
const sql = require("mssql");
import { parse, format } from 'date-format-parse';


export const consultarTercero = async () => {
        const cnn = await conSysApolo();
        const result = await cnn.query`select * from TERCERO where num_identificacion`
        return result.recordset;
}


//verifica si existe el cliente en sysApolo
export const consultarTerceroByID = async (nro_identificacion: string) => {
        const cnn = await conSysApolo();
        let pool = await cnn;
        let result1 = await pool.request()
                .input('id', sql.VarChar(50), nro_identificacion)
                .query('select * from TERCERO where num_identificacion = @id')
        return result1;
}


//verifica si existe el cliente en sysApolo
export const updateTerceroByID = async (nro_identificacion: string, tercero: ClienteSysApolo) => {
        const cnn = await conSysApolo();
        let pool = await cnn;
        let result1 = await pool.request()
                .input('id', sql.VarChar(50), nro_identificacion)
                .query(`UPDATE TERCERO 
                SET 
                ide_tipo_identificacion=${tercero.ide_tipo_identificacion},
                nom_ter ='${tercero.nom_ter}',
                pri_apellido='${tercero.pri_apellido}', 
                seg_apellido='${tercero.seg_apellido}', 
                pri_nombre='${tercero.pri_nombre}', 
                otr_nombre='${tercero.otr_nombre}', 
                dir_ter='${tercero.dir_ter}', 
                tel_ter='${tercero.tel_ter}', 
                email='${tercero.email}', 
                ide_mun='${tercero.ide_mun}' 
                where num_identificacion = @id`);
        return result1;
}


//permite consultal el consecutivo del tercero para crear
export const getCodTercero = async () => {
        const cnn = await conSysApolo();
        let pool = await cnn;
        let result = await pool.request().query(`SELECT cod_ter = MAX(REPLACE(STR(cod_ter+1, 5), SPACE(1), '0')) FROM TERCERO`);
        return result;
}





//permite crear un tercero en sysapolo
export const createTercero = async (tercero: ClienteSysApolo) => {
        const cnn = await conSysApolo();
        
        const CodTerQuery = await getCodTercero();
        console.log(CodTerQuery);
        console.log(tercero);




        const transaction = new sql.Transaction(cnn);


        const query: string = `INSERT INTO TERCERO (
                cod_ter,
                ide_tipo_identificacion,
                nit_ter,
                num_identificacion,
                dig_verificacion,
                nom_ter,
                pri_apellido,
                seg_apellido,
                pri_nombre,
                otr_nombre,
                cla_ter,
                dir_ter,
                tel_ter,
                email,
                ide_mun,
                sex_tercero,
                est_tercero,
                salario_mensual,
                fec_ingreso
                ) VALUES (
                        '${CodTerQuery.recordset[0].cod_ter}',
                        '${tercero.ide_tipo_identificacion}',
                        ' ${tercero.nit_ter}',
                        '${tercero.num_identificacion}',
                        '${tercero.dig_verificacion}',
                        '${tercero.nom_ter}',
                        '${tercero.pri_apellido}',
                        '${tercero.seg_apellido}',
                        '${tercero.pri_nombre}',
                        '${tercero.otr_nombre}',
                        'S',
                        '${tercero.dir_ter}',
                        '${tercero.tel_ter}',
                        '${tercero.email}',
                        '${tercero.ide_mun}',
                        '${tercero.sex_tercero}',
                        '',
                        '0',
                        '${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}'

                )`;

                console.log(query);

        transaction.begin((err: any) => {
                let rolledBack = false
                transaction.on('rollback', (aborted: any) => {
                        rolledBack = true
                });

                let result = new sql.Request(transaction)
                        .query(query, (err: any, result: any) => {
                                if (err) {
                                        if (!rolledBack) {
                                                transaction.rollback((err: any) => {
                                                        // ... error checks
                                                        console.log("ejecutando rollback");
                                                        console.log(err);
                                                })
                                        }
                                } else {
                                        transaction.commit((err: any) => {
                                                // ... error checks
                                                console.log("ejecutando commit");

                                        })
                                }
                        });

                return result;
        });






}