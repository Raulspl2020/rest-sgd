import { parse, format } from 'date-format-parse';
import { consultarFacturaByID, getCodFactura, sysGetFacturaPagadaByID, syslistarFacturasPagadas, sysregistrarFacturasPagadas } from "../../provider/sys_apolo/factura_provider";
import * as moneda from 'currency-formatter';
import { verificaPagosNpago } from "../../helpers/cron_job";
import { consultarTerceroByID, createTercero, updateTerceroByID } from "../../provider/sys_apolo/tercero_provider";
import { ClienteSigedin, ClienteSysApolo } from "../../interfaces/clientes.interface";
import { getTipoDoc } from "../../provider/usuario_provider";
import { FacturaSysApolo } from '../../interfaces/facturas.interface';


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





//PROCESO QUE SE EJECUTA EN SEGUNDO PLANO PARA PERMITIR A SIGEDIN REGISTRAR UNA FACTURA EN SYS-APOLO

export const registroFacturaSysApolo = async (ref: number) => {


  try {

    let jsonData: any = {};
    let terceroSys: ClienteSysApolo = null;

    //inicialmente obtenemos todos los datos de la factura
    let resultDB = await sysGetFacturaPagadaByID(ref);
    console.log(resultDB);

    //si encuentra la factura en sigedin
    if (resultDB.length > 0) {
      jsonData = JSON.parse(resultDB[0].json_response);

      let cliente: ClienteSigedin = jsonData.info_cliente;


      let sysDBresult1 = await consultarTerceroByID(cliente.ide_persona);

      let clientSysDBArray: ClienteSysApolo[] = sysDBresult1.recordset;


      //traemos el codigo de sysapolo para el tipo de indentificacion
      let tipoDoc = await getTipoDoc(cliente.cod_doc);
      let cod_doc = 1;

      if (tipoDoc != undefined) {
        cod_doc = tipoDoc.cod_sysapolo;
      }

      if (clientSysDBArray.length > 10) {
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
          ide_mun: cliente.cod_municipio || '',
          sex_tercero: cliente.ide_genero || ''
        }

        let execute = await updateTerceroByID(cliente.ide_persona, tercero);
      } else {
        //si no se encontro el cliente se debe crearlo
        console.log("se creará un nuevo tercero");

        let terCrear: ClienteSysApolo = {
          ide_tipo_identificacion: cod_doc,
          nit_ter: cliente.ide_persona,
          num_identificacion: cliente.ide_persona,
          dig_verificacion: '1', //corregir esto
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


      if (facturaSys.length > 10) {
        //se debe actualziar las factutas, cambiar el estado en sigedin para que no se registre 2 veces
        throw new Error(`La factura ${ref} ya se encuentra registrada en sysapolo`);

      } else {
        //registramos la factura con el detalle directamente

        //obtenemos un consecutivo desde la db
        let { cod_factura } = await getCodFactura();

        let facturaSys: FacturaSysApolo = {
          ide_fact_concepto_enc: parseInt(cod_factura),
          num_recibo: ref,
          fec_recibo: format(resultDB[0].fecha_pago, 'YYYY-MM-DD HH:mm:ss'),
          cod_ter: terceroSys.cod_ter,
          ide_usuario: 41,
          det_recibo: resultDB[0].desc_factura,
          valor_concepto: resultDB[0].valor_pago,
          valor_recaudo: resultDB[0].valor_pago,
          pagado: 'S',
          ide_banco: 1, // refiere al codigo de convenio
          cod_colegio: parseInt(cliente.cod_colegio),
          cod_forma_pago: resultDB[0].forma_pago_id,
          cod_nivel_educativo: cliente.cod_nivel_edu,

          cod_punto_pago: 1 //vup_punto_pago
        }

        console.log(facturaSys);

        return facturaSys;




      }






      return facturaSys;

    } else {
      //no se encuentra la factura en sigedin
      console.log(`La factura ${ref} no existe`);
      throw new Error(`La factura ${ref} no existe`);
    }






  } catch (error) {
    console.log(error);
  }


}
