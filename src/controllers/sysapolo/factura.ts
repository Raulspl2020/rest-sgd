import { parse, format } from 'date-format-parse';
import { consultarFacturaByID, consultarPuntoPago, createReciboPago, eliminarReciboPago, getCodFactura, sysGetFacturaPagadaByID, syslistarFacturasPagadas, sysregistrarFacturasPagadas } from "../../provider/sys_apolo/factura_provider";
import * as moneda from 'currency-formatter';
import { verificaPagosNpago } from "../../helpers/cron_job";
import { consultarTerceroByID, createTercero, updateTerceroByID } from "../../provider/sys_apolo/tercero_provider";
import { ClienteSigedin, ClienteSysApolo } from "../../interfaces/clientes.interface";
import { getTipoDoc } from "../../provider/usuario_provider";
import { FacturaDetalleSysApolo, FacturaSysApolo } from '../../interfaces/facturas.interface';
import { f_strDigitoVerificacionNIT } from "../../helpers/sysApolo";
import { guardarLogFacturaSys } from '../../provider/log_provider';

//====================
//   /factura/listar
//=====================

export const getFacturasPagadas = async (req: any, res: any) => {
  let det_factua = [];
  let facturas: any = [];


  try {
    let resultDB = await syslistarFacturasPagadas();
    let jsonData: any = {};
    if (resultDB.length > 0) {
      jsonData = JSON.parse(resultDB[0].json_response);
    }
    let cliente: any = jsonData.info_cliente;


    //llenamos un arreglo con los encabezados de cada factura
    for (const row of resultDB) {
      let existe = false;

      for (const fac of facturas) {
        if (fac.id == row.id) {
          existe = true;
        }
      }

      let json_response = JSON.parse(row.json_response);
      cliente = json_response?.info_cliente;
      let det_factua: any = json_response?.det_factura || [];


      if (!existe) {
        facturas.push({
          "id": row.id,
          "codigo": row.codigo,
          "desc_factura": row.desc_factura,
          'sysapolo_verify': row.sysapolo_verify,
          "fecha": format(row.fecha, 'DD-MM-YYYY hh:mm:ss A'),
          "items": det_factua.length,
          "cliente": cliente
        });
      }
    }




    //recorrer las facturas para llenar el detalle
    for (const factura of facturas) {
      //verifica el pago en zona pagos y actualiza en la db

      let total_a_pagar = 0;


      let det_factua = [];
      let contador: number = 0;
      for (const row of resultDB) {
        if (factura.id == row.id) {
          contador = contador + 1;
          let subtotal = (row.valor_unidad - (row.valor_unidad * row.descuento) + (row.valor_unidad * row.aumento));
          det_factua.push({
            'concepto': row.concepto,
            'cod_concepto': row.cod_concepto_sys,
            'descuento': row.descuento,
            'aumento': row.aumento,
            'valor_unidad': row.valor_unidad,
            'cantidad': row.cantidad,
            'subtotal': subtotal
          });
          total_a_pagar = total_a_pagar + subtotal;
        }
      }

      factura.det_factura = det_factua;
      factura.total_a_pagar_s = moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim();
      factura.total_a_pagar_i = total_a_pagar;
      factura.borrar = false;

      if (contador != parseInt(factura.items)) {
        factura.borrar = true;
      }


    }

    if (facturas[facturas.length - 1].borrar) {
      facturas.splice(facturas.length - 1, 1);
    }


    res.json({
      error: false,
      message: "Ejecucion correcta",
      data: facturas
    });
  } catch (error) {
    console.log(error);
    res.json({
      error: true,
      message: error.message,
    });
  }

};



//====================
//   /factura/registrar
//=====================

export const registrarFacturasPagadaSys = async (req: any, res: any) => {

  interface Response {
    facturas: number[];
  }
  console.log(req.body);
  let body = req.body;
  let responseData: Response = body || [];

  try {
    let resultDb = await sysregistrarFacturasPagadas(responseData.facturas);

    if (resultDb) {
      res.json({
        error: false,
        message: "Ejecucion correcta",
      });
    } else {
      throw new Error("No se han podido actualizar las facturas");
    }



  } catch (error) {
    console.log(error);
    res.json({
      error: true,
      message: error.message,
    });
  }

}


export const inicarPorceso = async (req: any, res: any) => {


  let body = req.body;
  let referencia = req.params.referencia;


  try {

    let result = await registroFacturaSysApolo(parseInt(referencia))

    res.json({
      error: false,
      referencia,
      result
    });

  } catch (error) {
    console.log(error);
    res.json({
      error: true,
      message: error.message,
    });
  }

}




export const inicarPorcesoDel = async (req: any, res: any) => {


  let body = req.body;
  let referencia = req.params.referencia;


  try {

    let result = await eliminarFacturaSysApolo(parseInt(referencia))

    res.json({
      error: false,
      referencia,
      result
    });

  } catch (error) {
    console.log(error);
    res.json({
      error: true,
      message: error.message,
    });
  }

}






//PROCESO QUE SE EJECUTA EN SEGUNDO PLANO PARA PERMITIR A SIGEDIN REGISTRAR UNA FACTURA EN SYS-APOLO

export const registroFacturaSysApolo = async (ref: number) => {
  let ID_CLIENTE: string;
  let DATA: any;

  try {

    let jsonData: any = {};
    let terceroSys: ClienteSysApolo = null;

    //inicialmente obtenemos todos los datos de la factura
    let resultDB = await sysGetFacturaPagadaByID(ref);
    // console.log(resultDB);

    //si encuentra la factura en sigedin
    if (resultDB.length > 0) {
      jsonData = JSON.parse(resultDB[0].json_response);

      let cliente: ClienteSigedin = jsonData.info_cliente;
      ID_CLIENTE = cliente.ide_persona;

      let sysDBresult1 = await consultarTerceroByID(cliente.ide_persona);

      let clientSysDBArray: ClienteSysApolo[] = sysDBresult1.recordset;


      //traemos el codigo de sysapolo para el tipo de indentificacion
      let tipoDoc = await getTipoDoc(cliente.cod_doc);
      let cod_doc = 1;

      if (tipoDoc != undefined) {
        cod_doc = tipoDoc.cod_sysapolo;
      }

      if (clientSysDBArray.length > 0) {
        terceroSys = clientSysDBArray[0];
        //si se encuentra el cliente actualizamos la informacion basica

        let tercero: ClienteSysApolo = {
          ide_tipo_identificacion: cod_doc,
          nom_ter: `${cliente.ape1_persona} ${cliente.ape2_persona} ${cliente.nom1_persona} ${cliente.nom2_persona}`,
          pri_apellido: cliente.ape1_persona,
          seg_apellido: cliente.ape2_persona,
          pri_nombre: cliente.nom1_persona,
          otr_nombre: cliente.nom2_persona,
          dir_ter: cliente.dir_persona || '',
          tel_ter: cliente.cel_persona || '',
          email: cliente.email_persona || '',
          ide_mun: cliente.cod_municipio || '86001',
          sex_tercero: cliente.ide_genero || ''
        }

        let execute = await updateTerceroByID(cliente.ide_persona, tercero);
      } else {
        //si no se encontro el cliente se debe crearlo
        console.log("se creará un nuevo tercero");

        // esta funcion global genera un digito de verificacion segun DIAN para cada tercero
        const digitoVer = f_strDigitoVerificacionNIT(cliente.ide_persona);

        let terCrear: ClienteSysApolo = {
          ide_tipo_identificacion: cod_doc,
          nit_ter: cliente.ide_persona + "-" + digitoVer,
          num_identificacion: cliente.ide_persona,
          dig_verificacion: digitoVer,
          nom_ter: `${cliente.ape1_persona} ${cliente.ape2_persona} ${cliente.nom1_persona} ${cliente.ape2_persona}`.trim(),
          rep_legal: '',
          pri_apellido: cliente.ape1_persona,
          seg_apellido: cliente.ape2_persona,
          pri_nombre: cliente.nom1_persona,
          otr_nombre: cliente.nom2_persona,
          cla_ter: "S",
          dir_ter: cliente.dir_persona || '',
          tel_ter: cliente.cel_persona || '',
          email: cliente.email_persona,
          ide_mun: cliente.cod_municipio || '86001',
          tip_tercero: '4',
          sex_tercero: cliente.ide_genero || '',
          est_tercero: '1',
          fec_ingreso: format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
          salario_mensual: 0,
        };


        let [isCreateTercero, resultTercero]: boolean | any = await createTercero(terCrear);
        if (isCreateTercero) {
          //si el tercero se creo correctamente
          terceroSys = terCrear;
          terceroSys.cod_ter = resultTercero;
        } else {
          //no se pudo crear el tercero en sysApolo
          throw new Error(resultTercero);
        }

      }

      //cuanto ya tenemos listo el tercero inicamos con la verificacion y creacion de la factura en sysApolo 
      let facturaSys = await consultarFacturaByID(ref);
      console.log("vericar la fatuea si existe");
      console.log(facturaSys);


      if (facturaSys.length > 0) {
        //ACTUALIZAR ESTADO FACTURA EN SIGEDIN
        sysregistrarFacturasPagadas([ref]);
        //se debe actualziar las factutas, cambiar el estado en sigedin para que no se registre 2 veces
        throw new Error(`La factura ${ref} ya se encuentra registrada en sysapolo`);

      } else {
        //registramos la factura con el detalle directamente

        //obtenemos un consecutivo desde la db SQLServer
        let { cod_factura } = await getCodFactura();
        //se consulta el punto de pago usando como parametro el año de pago y el nro de cuenta bancaria
        let resultPuntoPago = await consultarPuntoPago(parseInt(format(resultDB[0].fecha_pago, 'YYYY')), resultDB[0].cuenta_banco);
        console.log("el punto de pago es");
        console.log(resultPuntoPago);

        if (resultPuntoPago.length == 0) {
          throw new Error(`No se encontraron puntos de pago para el año ${parseInt(format(resultDB[0].fecha_pago, 'YYYY'))} y la cuenta ${resultDB[0].cuenta_banco}`);
        }

        const cod_punto_pago = resultPuntoPago[0].cod_punto_pago;

        //recorremos los conceptos de la factura obtenida para crear el detalle del recibo a registrar en sysapolo
        let DetFactSys: FacturaDetalleSysApolo[] = [];

        for (const con of resultDB) {
          let subtotal: number = (con.valor_unidad * con.cantidad) - ((con.valor_unidad * con.cantidad) * con.descuento) + ((con.valor_unidad * con.cantidad) * con.aumento);
          let detalle: FacturaDetalleSysApolo = {
            ide_fact_concepto_enc: cod_factura,
            ide_concepto: con.cod_concepto_sys,
            cantidad: 1,
            valor_concepto: subtotal,
            sub_total: subtotal
          };
          //los conceptos con subtotal sobre cero no se registran sysApolo
          if (subtotal > 0) {
            DetFactSys.push(detalle);
          }
        }

        let facturaSys: FacturaSysApolo = {
          ide_fact_concepto_enc: parseInt(cod_factura),
          num_recibo: ref,
          fec_recibo: format(resultDB[0].fecha_pago, 'YYYY-MM-DD HH:mm:ss'),
          cod_ter: terceroSys.cod_ter,
          ide_usuario: 41,
          det_recibo: `${resultDB[0].categoria} - ${cliente.nom_nivel_educativo} - ${resultDB[0].forma_pago} - ${resultDB[0].codigo_transaccion} - ${format(resultDB[0].fecha_pago, 'YYYY-MM-DD HH:mm:ss')}`,
          valor_concepto: resultDB[0].valor_pago,
          valor_recaudo: resultDB[0].valor_pago,
          pagado: 'N',
          ide_banco: 1, // refiere al codigo de convenio, por ahora es estatico, hasta que se adquiera un nuevo codigo de recaudo
          cod_colegio: parseInt(cliente.cod_colegio),
          cod_forma_pago: resultDB[0].forma_pago_id,
          cod_nivel_educativo: cliente.cod_nivel_edu,
          cod_punto_pago: cod_punto_pago,
          crea_registro: 2 // 1: sigedin, 1: sysapolo //siempre va 1
        }

        DATA = facturaSys;
        DATA.detalle = DetFactSys;

        //ejecutamos la instruccion en sobre la base de datos SQLServer
        let [resp, error, sql]: boolean | any | string = await createReciboPago(facturaSys, DetFactSys);

        if (resp) {
          //actualizar estado en base de datos
          sysregistrarFacturasPagadas([ref]);

          guardarLogFacturaSys({
            factura_id: ref,
            cliente_id: ID_CLIENTE,
            estado: 1,
            mensaje: "OK",
            fecha: format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
            data: JSON.stringify(DATA)
          });
        } else {
          //guardar log error
          throw new Error(error + " " + sql);
        }
        return resp;

      }

    } else {
      //no se encuentra la factura en sigedin
      console.log(`La factura ${ref} no existe`);
      throw new Error(`La factura ${ref} no existe, o ya se encuentra registrada`);
    }


  } catch (error) {

    console.log(error);
    guardarLogFacturaSys({
      factura_id: ref,
      estado: 0,
      cliente_id: ID_CLIENTE,
      mensaje: error.message,
      fecha: format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
      data: JSON.stringify(DATA)
    });
    return false;
  }


}




//PROCESO QUE SE EJECUTA EN SEGUNDO PLANO PARA PERMITIR A SIGEDIN ELIMINAR UNA FACTURA EN SYSAPOLO

export const eliminarFacturaSysApolo = async (ref: number) => {

  //buscamos la factura en sysapolo, para obtener los ids a eliminar en detalle
  let facturaSys: FacturaSysApolo[] = await consultarFacturaByID(ref);


  if (facturaSys.length > 0) {
    const ide_fact_concepto_enc: number = facturaSys[0].ide_fact_concepto_enc;

    //primero debemos eliminar los detalles de la factura y posteriormente la factura

    //ejecutamos la transaccion en sobre la base de datos SQLServer
    let [resp, error, sql]: boolean | any | string = await eliminarReciboPago(facturaSys[0]);

    if (resp) {
      guardarLogFacturaSys({
        factura_id: ref,
        estado: 1,
        mensaje: `Factura ${facturaSys[0].ide_fact_concepto_enc} anulada exitosamente`,
        fecha: format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
        data: JSON.stringify(facturaSys)
      });
      return resp;

    } else {
      //guardar log error
      guardarLogFacturaSys({
        factura_id: ref,
        estado: 0,
        mensaje: `Factura ${facturaSys[0].ide_fact_concepto_enc} no se pudo anular`,
        fecha: format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
        data: JSON.stringify(facturaSys)
      });
      throw new Error(error + " " + sql);

    }


  } else {
    throw new Error(`La factura ${ref} no se encontró en sysapolo`);
  }


}
