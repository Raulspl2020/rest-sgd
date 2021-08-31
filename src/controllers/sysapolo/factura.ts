import { format } from "date-format-parse";
import { sysGetFacturaPagadaByID, syslistarFacturasPagadas, sysregistrarFacturasPagadas } from "../../provider/sys_apolo/factura_provider";
import * as moneda from 'currency-formatter';
import { verificaPagosNpago } from "../../helpers/cron_job";
import { consultarTerceroByID, createTercero, updateTerceroByID } from "../../provider/sys_apolo/tercero_provider";
import { ClienteSigedin, ClienteSysApolo } from "../../interfaces/clientes.interface";
import { getTipoDoc } from "../../provider/usuario_provider";


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
    let terceroSys: any = {};

    //inicialmente obtenemos todos los datos de la factura
    let resultDB = await sysGetFacturaPagadaByID(ref);

    //si encuentra la factura en sigedin
    if (resultDB.length > 0) {
      jsonData = JSON.parse(resultDB[0].json_response);

      let cliente: ClienteSigedin = jsonData.info_cliente;

      let sysDBresult1 = await consultarTerceroByID(cliente.ide_persona);
      let clientSysDB: ClienteSysApolo[] = sysDBresult1.recordset;
      let terceroSys: ClienteSysApolo = clientSysDB[0];

      //traemos el codigo de sysapolo para el tipo de indentificacion

      let tipoDoc = await getTipoDoc(cliente.cod_doc);
      let cod_doc = 1;

      if (tipoDoc != undefined) {
        cod_doc = tipoDoc.cod_sysapolo;
      }

      if (clientSysDB.length > 10) {
        //si se encuentra el cliente actualizamos la informacion basica

        let tercero: ClienteSysApolo = {
          ide_tipo_identificacion: cod_doc,
          nom_ter: `${cliente.ape1_persona} ${cliente.ape2_persona} ${cliente.nom1_persona} ${cliente.nom2_persona}`,
          pri_apellido: cliente.ape1_persona,
          seg_apellido: cliente.ape2_persona,
          pri_nombre: cliente.nom1_persona,
          otr_nombre: cliente.nom2_persona,
          dir_ter: cliente.dir_persona,
          tel_ter: cliente.cel_persona,
          email: cliente.email_persona,
          ide_mun: cliente.cod_municipio,
          sex_tercero: cliente.ide_genero
        }

        let execute = await updateTerceroByID(cliente.ide_persona, tercero);
      } else {
        //si no se encontro el cliente se debe crearlo
        console.log("se creará un nuevo tercero");
        


        let resultCreateTer = await createTercero(terceroSys);
        console.log(resultCreateTer);

        return resultCreateTer;





      }


      //cuanto ya tenemos listo el tercero inicamos con la verificacion y creacion de la factura en sysApolo 




      return cliente;

    } else {
      //no se encuentra la factura en sigedin
      console.log(`La factura ${ref} no existe`);
    }






  } catch (error) {
    console.log(error);
  }


}
