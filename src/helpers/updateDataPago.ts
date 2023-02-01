import { generarCodigoFactura } from "../controllers/zonapagos";
import { consultarpagoMatricula } from "../controllers/matricula";
import { getInfoUsuario } from "../provider/usuario_provider";
import { generarCodigoBarrasText } from "./pago";
import { existePago, updateDataPago } from "../provider/pago_provider";
import { guardarPagoyDetalle } from "../provider/pago_provider";
import { actualizarPagoyDetalleNew } from "../provider/pago_provider";
import { getInfoMatricula } from "../provider/matricula_provider";
import { getFechasPeriodo } from "../provider/matricula_provider";
import { parse, format } from "date-format-parse";
import * as moneda from "currency-formatter";

export const updateDataPagoWebService = async (body: any) => {
  let fechaActualString = format(new Date(), "DD-MM-YYYY hh:mm:ss A");
  let fecha_limite_pago = new Date();
  fecha_limite_pago.setMonth(fecha_limite_pago.getMonth() + 12);
  let resultSavePago: any = {};

  try {
    let tDetallePago: any = [];
    let new_detalle: any = [];
    let id_pago: number = null;
    let resultSavePago: any = {};
    let isPagoOnline: boolean = body.isPagoOnline != true ? false : true;
    let responseDataZonaPagos: any = {};
    let str_url = "";

    let result: any = await consultarpagoMatricula(body.cod_matricula);

    //console.log(result);

    let matricula = result.matricula;
    let detalle_factura = result.detalle_factura;
    let descuentos = result.descuentos;
    let cadenaCodigo =
      matricula.ide_persona +
      matricula.ape1_persona +
      matricula.ape2_persona +
      matricula.nom1_persona +
      matricula.nom2_persona;
    let codigoFactura = await generarCodigoFactura(cadenaCodigo.trim());

    //verificar si existe pago
    let resultExistePago = await existePago(
      detalle_factura[0].codigo,
      matricula.cod_matricula
    );

    let tPago: any = {
      codigo: codigoFactura,
      descripcion: detalle_factura[0].paquete,
      json_response: null,
      estado_id: 200,
      estudiante_id: matricula.ide_persona,
      matricula_id: matricula.cod_matricula,
      valor: result.total_a_pagar_int,
      periodo_id: matricula.cod_periodo,
      cod_paquete: detalle_factura[0].codigo,
      categoria_pago_id: detalle_factura[0].categoria_id,
    };

    if (resultExistePago == false) {
      //crear un nuevo pago
      detalle_factura.forEach((concepto: any) => {
        tDetallePago.push({
          pago_id: id_pago, // si se envia el id se lo asigna
          concepto_id: concepto.concepto_id,
          descuento: concepto.descuento,
          aumento: concepto.aumento,
          valor_unidad: concepto.valor_unidad,
          cantidad: concepto.cantidad,
        });
      });

      //preparamos la data para guardar
      resultSavePago = await guardarPagoyDetalle(tPago, tDetallePago);
      //si se guardó exitosamente
      if (resultSavePago != false) {
        id_pago = resultSavePago[0];
      } else {
        throw new Error("No se ha podido guardar el pago");
      }
    } else {
      //retomar y actualizar el pago en base de datos
      id_pago = resultExistePago._id;

      detalle_factura.forEach((concepto: any) => {
        tDetallePago.push({
          pago_id: id_pago, // si se envia el id se lo asigna
          concepto_id: concepto.concepto_id,
          descuento: concepto.descuento,
          aumento: concepto.aumento,
          valor_unidad: concepto.valor_unidad,
          cantidad: concepto.cantidad,
        });
      });

      resultSavePago = await actualizarPagoyDetalleNew(
        tPago,
        tDetallePago,
        id_pago
      );
      if (resultSavePago != false) {
        id_pago = resultSavePago[0];
      } else {
        throw new Error("No se ha podido guardar el pago");
      }
    }

    //actualizamos los datos de la factua en la db
    let resultM = await getInfoMatricula(matricula.cod_matricula);
    let resultDB = resultM[0][0];

    let periodoInfo = await getFechasPeriodo(
      resultDB.cod_colegio,
      resultDB.cod_periodo
    );
    console.log(periodoInfo);
    if (periodoInfo == false) {
      throw new Error("No se encontró periodo y sede configurados");
    }

    let dt = new Date();
    let fechaNueva = new Date();

    let month = dt.getMonth() + 1;
    let year = dt.getFullYear();
    let day = dt.getDay();
    let daysInMonth = new Date(year, month, 0).getDate();
    fechaNueva.setDate(daysInMonth);

    let infoPagoDB: any = {};
    infoPagoDB.general = {
      fecha_actual: fechaActualString,
      fecha_fin_ordinaria: format(
        periodoInfo.fec_fin_matordinaria ?? fechaNueva,
        "DD-MM-YYYY"
      ),
      fecha_fin_extraordinaria: format(
        periodoInfo.fec_fin_matextraord ?? fechaNueva,
        "DD-MM-YYYY"
      ),
      fecha_fin_ins_nuevos: format(
        periodoInfo.fec_fin_ins_nuevos ?? fechaNueva,
        "DD-MM-YYYY"
      ),
      fecha_limite_pago: format(fecha_limite_pago ?? fechaNueva, "DD-MM-YYYY"),
    };
    infoPagoDB.info_cliente = resultDB;
    let estudianteDb: any = await getInfoUsuario(matricula.ide_persona);
    if (estudianteDb.length > 0) {
      infoPagoDB.info_cliente.ide_genero = estudianteDb[0].ide_genero || null;
      infoPagoDB.info_cliente.cod_municipio =
        estudianteDb[0].cod_municipio || null;
      infoPagoDB.info_cliente.dir_persona = estudianteDb[0].dir_persona || null;
    }

    infoPagoDB.det_factura = detalle_factura;
    infoPagoDB.cod_pago = codigoFactura;
    infoPagoDB.descuentos = descuentos;
    infoPagoDB.total_a_pagar_s = moneda
      .format(result.total_a_pagar_int, { locale: "es-CO" })
      .replace("$", "")
      .trim();
    infoPagoDB.total_a_pagar_i = moneda.unformat(
      moneda
        .format(result.total_a_pagar_int, { locale: "es-CO" })
        .replace("$", "")
        .trim(),
      { locale: "es-CO" }
    );

    let [codigo1] = await generarCodigoBarrasText(
      resultSavePago[0],
      result.total_a_pagar_int,
      format(periodoInfo.fec_fin_matordinaria, "DD-MM-YYYY")
    );
    //acualizar codigo de barras en la base de datos y el json con la referencia
    let dataPagoUpdate = {
      codigo_barras: codigo1,
      json_response: JSON.stringify(infoPagoDB),
    };

    let respDB = await updateDataPago(dataPagoUpdate, resultSavePago[0]);
  } catch (error) {}
};
