import cryptoRandomString from "crypto-random-string";
import Validator from "validatorjs";
import {
  dataConfigPago,
  dividirCodigoBarrasText,
  ejecutarZonaPagos,
  generarCodigoBarras,
  generarCodigoBarrasText,
  limpiarCampos,
} from "../helpers/pago";
import { Pago } from "../models/Pago";
import {
  consultarpagoMatricula,
  resolverCodigoPaqueteInscripcion,
} from "./matricula";
import fetch from "node-fetch";
import {
  actualizarEstadoPago,
  actualizarPagoyDetalle,
  actualizarPagoyDetalleNew,
  detIdPagoByCodigo,
  detIdPagoByID,
  existeFactura,
  existePago,
  getConfigPeriodo,
  getDescuento,
  getPagoByID,
  getPaquete,
  guardarPagoyDetalle,
  updateDataPago,
} from "../provider/pago_provider";
import * as moneda from "currency-formatter";
import { generarHTMLPDF } from "../helpers/global";
import {
  getFechasPeriodo,
  getInfoMatricula,
  getProgramaByIdProPersona,
} from "../provider/matricula_provider";
import { v4 as uuidv4 } from "uuid";
import { parse, format } from "date-format-parse";
import { getInfoUsuario } from "../provider/usuario_provider";
import { calcularTotales } from "../helpers/factura.util";
import { IParamsOnline } from "../interfaces/zonapagos.interface";
import { decodePagoToList } from "../helpers/decodePagoToList";

type ProfileLogger = <T>(label: string, task: () => Promise<T>) => Promise<T>;

const createProfileLogger = (enabled: boolean, scope: string): ProfileLogger => {
  return async <T>(label: string, task: () => Promise<T>): Promise<T> => {
    if (!enabled) {
      return task();
    }

    const start = Date.now();
    try {
      return await task();
    } finally {
      console.log(`[profile:${scope}] ${label}: ${Date.now() - start}ms`);
    }
  };
};

const isProfileEnabled = (req: any): boolean => {
  const nodeEnv = String(process.env.NODE_ENV || "").toLowerCase();
  return req.query?.profile === "1" && nodeEnv !== "pro" && nodeEnv !== "production";
};

const getZonaPagosTimeoutMs = (): number => {
  const timeout = Number(process.env.ZONAPAGOS_TIMEOUT_MS || 15000);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : 15000;
};

const getZonaPagosUserMessage = (error: any): string => {
  const code = String(error?.code || "");
  if (["ENOTFOUND", "EAI_AGAIN"].includes(code)) {
    return "No fue posible resolver o conectar con la pasarela de pagos. Intente nuevamente en unos minutos.";
  }

  if (["ECONNREFUSED", "ETIMEDOUT", "ECONNRESET"].includes(code) || error?.type === "request-timeout") {
    return "La pasarela de pagos no respondió a tiempo. Intente nuevamente en unos minutos.";
  }

  return "La pasarela de pagos no está disponible temporalmente. Intente nuevamente en unos minutos.";
};

const logZonaPagosError = (error: any, context: { endpoint: string; pagoId?: any; elapsedMs?: number }) => {
  console.log("[ZONAPAGOS_ERROR]", {
    endpoint: context.endpoint,
    pagoId: context.pagoId,
    elapsedMs: context.elapsedMs,
    code: error?.code,
    type: error?.type,
    status: error?.status,
    message: error?.message,
  });
};

//=================================
//   /transaccion/InicioPagoMatricula
//=================================
export const inicioPagoMatricula = async (req: any, res: any) => {
  let body = req.body;
  let fechaActualString = format(new Date(), "DD-MM-YYYY hh:mm:ss A");
  let fecha_limite_pago = new Date();
  fecha_limite_pago.setMonth(fecha_limite_pago.getMonth() + 12);

  try {
    let dataBody: any = req.body;
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
      is_online: isPagoOnline,
      fecha_update: format(new Date(), "YYYY-MM-DD HH:mm:ss"),
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

    //INICAMOS EL PAGO CON ZONAPAGOS
    if (isPagoOnline) {
      //preparamos los datos para enviar a zonapagos
      let infoPago = new Pago({
        flt_total_con_iva: result.total_a_pagar_int,
        flt_valor_iva: 0,
        str_id_pago: id_pago,
        str_descripcion_pago: detalle_factura[0].paquete,
        str_email: matricula.email_persona,
        str_id_cliente: matricula.ide_persona,
        str_tipo_id: matricula.cod_doc,
        str_nombre_cliente:
          matricula.nom1_persona + " " + matricula.nom2_persona,
        str_apellido_cliente:
          matricula.ape1_persona + " " + matricula.ape2_persona,
        str_telefono_cliente: matricula.cel_persona,
        str_opcional1: detalle_factura[0].codigo, //codigo paquete
        str_opcional2: "", //valor en letras
        str_opcional3: matricula.cod_matricula, //matricula
        str_opcional4: matricula.cod_periodo, //periodo
        str_opcional5: "",
      });

      //recortamos el tamaño de la descripcion
      let finpago2: Pago = structuredClone(infoPago);
      finpago2.str_descripcion_pago = finpago2.str_descripcion_pago.slice(
        0, 70
      );

      let bodyZonapagos = dataConfigPago(finpago2);

      responseDataZonaPagos = await inicarPagoZonaPagos(bodyZonapagos);
    } else {
      // let infoEstudiante = await getInfoEstudiante(matricula.cod_matricula);

      str_url =
        process.env.BASE_URL +
        "/transaccion/GenerarPagoCodigoBarras/" +
        codigo1;
      responseDataZonaPagos = {
        int_codigo: 1,
        str_cod_error: "",
        str_descripcion_error: "",
        str_url: str_url,
      };
    }

    //si todo esta bien, procedemos a guardar
    return res.status(200).json({
      statusCode: 200,
      message: "Ejecucion correcta",
      error: false,
      pago_id: id_pago,
      data: responseDataZonaPagos,
      new_detalle,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

//====================
//   /transaccion/GenerarPagoCodigoBarras
//=====================
export const generarPagoCodigoBarras = async (req: any, res: any) => {
  let codigo_barras = req.params.codigo;

  //TODO:

  let dt = new Date();
  let fechaNueva = new Date();

  let month = dt.getMonth() + 1;
  let year = dt.getFullYear();
  let day = dt.getDay();
  let daysInMonth = new Date(year, month, 0).getDate();
  fechaNueva.setDate(daysInMonth);

  let [convenio415, referencia8020] = await dividirCodigoBarrasText(
    codigo_barras
  );
  let id_pago = parseInt(referencia8020.substr(3));
  console.log(id_pago);
  let data: any = await getPagoByID(id_pago);

  console.log(data);

  try {
    if (data == false) {
      throw new Error("No se encontró la matricula");
    }

    let jsonDB = JSON.parse(data.json_response);
    let general = jsonDB.general;

    const { det_factura: detFactura = [] } = JSON.parse(data?.json_response);

    let resultConfig = await getConfigPeriodo();

    let porcentaje_ex = resultConfig.porcentaje_ext;

    const { totalExtraordinario, totalOrdinario } = calcularTotales(detFactura);

    let nueva_F = format(fechaNueva, "DD-MM-YYYY");

    let [codigo1, svgText1] = await generarCodigoBarras(
      data._id,
      `${Math.round(totalOrdinario)}`,
      general.fecha_fin_ordinaria
    );
    let [codigo2, svgText2] = await generarCodigoBarras(
      data._id,
      `${Math.round(totalExtraordinario)}`,
      general.fecha_fin_extraordinaria
    );
    let [codigo3, svgText3] = await generarCodigoBarras(
      data._id,
      jsonDB.total_a_pagar_i.toString(),
      general.fecha_fin_ins_nuevos || nueva_F
    );
    let [codigo4, svgText4] = await generarCodigoBarras(
      data._id,
      jsonDB.total_a_pagar_i.toString(),
      general.fecha_limite_pago
    );

    general.codigo1 = svgText1;
    general.codigo2 = svgText2;
    general.codigo3 = svgText3;
    general.codigo4 = svgText4;
    general.matricula = jsonDB.info_cliente;
    general.det_factura = await quitarAumentoDetalle(jsonDB.det_factura, 0);
    general.referencia = data._id;
    general.total_ordi_formateado = moneda
      .format(totalOrdinario, { locale: "es-CO" })
      .replace("$", "")
      .trim();
    general.total_extra_formateado = moneda
      .format(totalExtraordinario, { locale: "es-CO" })
      .replace("$", "")
      .trim();
    general.total_formateado = jsonDB.total_a_pagar_s;
    general.descuentos = jsonDB.descuentos;
    general.BASE_URL = process.env.BASE_URL.toString();

    let vista_pago = "pdf_pago_general";

    switch (jsonDB.det_factura[0].categoria_id) {
      case 5:
        //paquete de inscripcion
        vista_pago = "pdf_pago_inscripcion";

        break;
      case 1:
        vista_pago = "pdf_pago_matricula";
        break;
      case 0:
        vista_pago = "pdf_pago_general";
        break;
      default:
        vista_pago = "pdf_pago_general";
        break;
    }

    res.render(vista_pago, general, async (err: any, html: any) => {
      let pdf = await generarHTMLPDF(html);
      res.contentType("application/pdf");
      res.send(pdf);
    });
  } catch (error) {
    console.log("Error algo paso");
    res.status(500).json({
      error: true,
      message: "El servicio no esta disponible " + error.message,
    });
  }
};

//====================
//   /page/GenerarPagoCodigoBarrasGeneral
//=====================
export const generarPagoCodigoBarrasGeneral = async (req: any, res: any) => {
  let codigo_barras = req.params.codigo;

  let [convenio415, referencia8020] = await dividirCodigoBarrasText(
    codigo_barras
  );
  let id_pago = parseInt(referencia8020.substr(3));
  let data: any = await getPagoByID(id_pago);
  console.log("aqui va el id_pago");

  try {
    if (data == false) {
      throw new Error("No se encontró la matricula");
    }

    let jsonDB = JSON.parse(data.json_response);
    let general = jsonDB.general;

    // es un pago en efectivo
    let [codigo, svgText] = await generarCodigoBarras(
      data._id,
      jsonDB.total_a_pagar.toString(),
      jsonDB.fecha_limite_pago
    );

    general.codigo = svgText;
    general.referencia = data._id;
    general.fecha_actual = jsonDB.fecha_actual;
    general.det_factura = jsonDB.det_factura;
    general.des_pago = data.descripcion;
    general.total_a_pagar = moneda
      .format(jsonDB.total_a_pagar, { locale: "es-CO" })
      .replace("$", "")
      .trim();
    general.BASE_URL = process.env.BASE_URL.toString();

    console.log(general);

    res.render("pdf_pago_general", general, async (err: any, html: any) => {
      let pdf = await generarHTMLPDF(html);
      res.contentType("application/pdf");
      res.send(pdf);
    });
  } catch (error) {
    console.log("Error algo paso");
    res.status(500).json({
      error: true,
      message: "El servicio no esta disponible " + error.message,
    });
  }
};

const calculaTotalaPagar = async (precios: any) => {
  let total_a_pagar = 0;
  precios.forEach((element: any, index: number) => {
    total_a_pagar = element.subtotal + total_a_pagar;
  });

  return Math.round(total_a_pagar);
};

//esto solo puede funcionar si el aumento solo corresponde a la matricula extraordinaria
const quitarAumentoDetalle = async (detalle: any, newAumento: number) => {
  let auxDetalle: any = [];
  detalle.forEach((row: any) => {
    let registro = row;
    registro.aumento = newAumento;

    let subtotal = registro.valor_unidad * registro.cantidad;
    registro.subtotal =
      subtotal + subtotal * registro.aumento - subtotal * registro.descuento;
    registro.descuento2 = registro.descuento * 100;
    auxDetalle.push(registro);
  });

  return auxDetalle;
};

const inicarPagoZonaPagos = async (body: any, context: { pagoId?: any } = {}) => {
  //INICAMOS EL PAGO CON ZONAPAGOS
  const startedAt = Date.now();
  const endpoint = `${process.env.ZONAPAGOS_URL}/InicioPago`;
  try {
    let responseZona = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      timeout: getZonaPagosTimeoutMs(),
    });

    if (!responseZona.ok) {
      const error: any = new Error(`ZonaPagos respondió HTTP ${responseZona.status}`);
      error.status = responseZona.status;
      throw error;
    }

    let responseData = await responseZona.json();
    //si el int_codigo es igual a 1 todo salio bien
    if (responseData.int_codigo != 1) {
      const error: any = new Error("ZonaPagos rechazó los parámetros enviados");
      error.status = responseZona.status;
      throw error;
    } else {
      return responseData;
    }
  } catch (error) {
    logZonaPagosError(error, {
      endpoint,
      pagoId: context.pagoId,
      elapsedMs: Date.now() - startedAt,
    });
    const controlledError: any = new Error(getZonaPagosUserMessage(error));
    controlledError.originalCode = error?.code;
    throw controlledError;
  }
};

export const generarCodigoFactura = async (cadena: string) => {
  let codigoFactura = "";
  cadena = limpiarCampos(cadena.replace(/\s+/g, ""));
  let validation;
  let contador = 0;
  let pagoMat: any = null;
  //si el codigo no es afanumerico se genera otro
  do {
    let codigo = await cryptoRandomString({
      length: 10,
      characters: cadena,
    });

    let regla = {
      cadena: "present|alpha_num",
    };

    let campos = {
      cadena: codigo,
    };
    validation = new Validator(campos, regla);
    codigoFactura = codigo;
    contador++;

    if (contador > 1000) {
      throw new Error("No se ha podido generar el codigo");
    }
  } while (validation.fails());

  return codigoFactura;
};

//====================
//   /transaccion/InicioPagoInscripcion
//=====================
export const inicioPagoInscripcion = async (req: any, res: any) => {
  let body = req.body;
  let id_matricula = body.cod_matricula;
  let fechaActualString = format(new Date(), "DD-MM-YYYY hh:mm:ss A");
  let descuentos: any = [];
  let tDetallePago: any = [];
  let resultSavePago: any = {};
  let isPagoOnline: boolean = body.isPagoOnline != true ? false : true;
  let responseDataZonaPagos: any = {};
  let str_url = "";

  let id_pago = req.body.id_pago;

  let fecha_limite_pago = new Date();
  fecha_limite_pago.setMonth(fecha_limite_pago.getMonth() + 12);

  try {
    let resultMatricula = await consultarDatosInscripcion(
      id_matricula,
      body.codPaquete
    );
    console.log("El resultado de la matricula es:");
    console.log(resultMatricula);
    if (!resultMatricula) {
      throw new Error("no se ha podido consultar la informacion solicitada");
    }

    let conceptos = resultMatricula.det_factura;
    let matricula = resultMatricula.info_cliente;

    let cadenaCodigo =
      matricula.ide_persona +
      matricula.ape1_persona +
      matricula.ape2_persona +
      matricula.nom1_persona +
      matricula.nom2_persona;
    let codigoFactura = await generarCodigoFactura(cadenaCodigo.trim());

    //verificar si existe pago
    let resultExistePago = await existePago(
      conceptos[0].codigo,
      matricula.cod_matricula
    );

    if (resultExistePago != false) {
      id_pago = resultExistePago._id;
    }

    conceptos.forEach((concepto: any) => {
      tDetallePago.push({
        pago_id: id_pago ? id_pago : null, // si se envia el id se lo asigna
        concepto_id: concepto.concepto_id,
        descuento: concepto.descuento,
        aumento: concepto.aumento,
        valor_unidad: concepto.valor_unidad,
        cantidad: concepto.cantidad,
      });
    });

    //preparamos la data para guardar
    let tPago: any = {
      codigo: codigoFactura,
      descripcion: conceptos[0].paquete,
      json_response: JSON.stringify(resultMatricula),
      estado_id: 200,
      is_online: isPagoOnline,
      fecha_update: format(new Date(), "YYYY-MM-DD HH:mm:ss"),
      estudiante_id: matricula.ide_persona,
      matricula_id: matricula.cod_matricula,
      valor: resultMatricula.total_a_pagar_i,
      periodo_id: matricula.cod_periodo,
      cod_paquete: conceptos[0].codigo,
      categoria_pago_id: conceptos[0].categoria_id,
    };

    //validar si se envia el codigo de pago, se debe actualiar
    if (id_pago) {
      resultSavePago = await actualizarPagoyDetalleNew(
        tPago,
        tDetallePago,
        id_pago
      );
    } else {
      //guardar el detalle de la factura
      resultSavePago = await guardarPagoyDetalle(tPago, tDetallePago);
    }
    //actualizamos el los datos en la DB
    let [codigo1] = await generarCodigoBarrasText(
      resultSavePago[0],
      resultMatricula.total_a_pagar_i,
      resultMatricula.general.fecha_fin_ordinaria
    );
    //acualizar codigo de barras en la base de datos y el json con la referencia
    let dataPagoUpdate = {
      codigo_barras: codigo1,
      json_response: JSON.stringify(resultMatricula),
    };
    let respDB = await updateDataPago(dataPagoUpdate, resultSavePago[0]);

    if (isPagoOnline) {
      id_pago = resultSavePago[0];
      //preparamos los datos para enviar a zonapagos
      let infoPago = new Pago({
        flt_total_con_iva: resultMatricula.total_a_pagar_i,
        flt_valor_iva: 0,
        str_id_pago: id_pago,
        str_descripcion_pago: conceptos[0].paquete,
        str_email: matricula.email_persona,
        str_id_cliente: matricula.ide_persona,
        str_tipo_id: matricula.cod_doc,
        str_nombre_cliente:
          matricula.nom1_persona + " " + matricula.nom2_persona,
        str_apellido_cliente:
          matricula.ape1_persona + " " + matricula.ape2_persona,
        str_telefono_cliente: matricula.cel_persona,
        str_opcional1: conceptos[0].codigo, //codigo paquete
        str_opcional2: "", //valor en letras
        str_opcional3: matricula.cod_matricula, //matricula
        str_opcional4: matricula.cod_periodo, //periodo
        str_opcional5: "",
      });

      //recortamos el tamaño de la descripcion
      let finpago2: Pago = structuredClone(infoPago);
      finpago2.str_descripcion_pago = finpago2.str_descripcion_pago.slice(
        0, 70
      );

      let bodyZonapagos = dataConfigPago(finpago2);

      responseDataZonaPagos = await inicarPagoZonaPagos(bodyZonapagos);
    } else {
      str_url =
        process.env.BASE_URL +
        "/transaccion/GenerarPagoCodigoBarras/" +
        codigo1;
      responseDataZonaPagos = {
        int_codigo: 1,
        str_cod_error: "",
        str_descripcion_error: "",
        str_url: str_url,
      };
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Ejecucion correcta",
      error: false,
      pago_id: id_pago,
      data: responseDataZonaPagos,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

//===================================
//   /transaccion/InicioPagosVarios
//====================================
export const inicioPagosVarios = async (req: any, res: any) => {
  const profile = createProfileLogger(isProfileEnabled(req), "InicioPagosVarios");
  let fechaActual = new Date();
  //fechaActual.setMonth(fechaActual.getMonth() + 12);

  let dt = new Date();

  let month = dt.getMonth() + 1;
  let year = dt.getFullYear();
  let day = dt.getDay();
  let daysInMonth = new Date(year, month, 0).getDate();
  fechaActual.setDate(daysInMonth);
  let fechaLimitepago = format(fechaActual, "YYYY-MM-DD");
  let fechaLimitepago2 = format(fechaActual, "DD-MM-YYYY");

  let body = req.body;
  let responseDataZonaPagos: any = {};
  let isPagoOnline: boolean = body.isPagoOnline != true ? false : true;
  let resultSavePago: any = {};
  let tDetallePago: any = [];
  let id_pago: string | null = null;
  let str_url = "";
  let info_cliente: any = {};
  const totalRequest: number = body.total;
  let cantidad = parseInt(body.cantidad);

  try {
    let cadenaCodigo =
      body.nombre1 +
      body.nombre2 +
      body.apellido1 +
      body.apellido2 +
      body.id_cliente;
    const [codigoFactura, resultPaquete, programa, estudianteDb] = await Promise.all([
      profile("generarCodigoFactura", () => generarCodigoFactura(cadenaCodigo.toUpperCase().trim())),
      profile("getPaquete", () => getPaquete(body.id_paquete)),
      profile("getProgramaByIdProPersona", () => getProgramaByIdProPersona(String(body.id_programa_persona).trim())),
      profile("getInfoUsuario", () => getInfoUsuario(body.id_persona)),
    ]);

    if (resultPaquete == false || resultPaquete.length === 0) {
      throw new Error("No se encontraron conceptos configurados para el pago seleccionado");
    }

    if (Number(body.id_paquete) !== 0 && !resultPaquete.some((concepto: any) => Number(concepto.concepto_id) === 0)) {
      const expectedTotal = resultPaquete.reduce((sum: number, concepto: any) => {
        return sum + (Number(concepto.valor_unidad) * cantidad);
      }, 0);
      if (Math.round(expectedTotal) !== Math.round(totalRequest)) {
        throw new Error("El total enviado no coincide con el concepto seleccionado");
      }
    }

    info_cliente = {
      cod_matricula: null,
      cod_doc: body.tipo_id,
      tipo_doc: body.tipo_id_text == "" ? "CC" : body.tipo_id_text,
      nom_estadomatricula: null,
      ide_persona: body.id_persona,
      ape1_persona: body.apellido1,
      ape2_persona: body.apellido2,
      nom1_persona: body.nombre1,
      nom2_persona: body.nombre2,
      email_persona: body.email_persona,
      cel_persona: body.cel_persona,
      siglas_colegio: null,
      cod_colegio: null,
      nom_periodo: null,
      cod_periodo: null,
      nom_nivel_educativo: null,
      cod_nivel_edu: null,
      cod_nivel_educativo: null,
      id_programa_persona: Number(String(body.id_programa_persona).trim()) ?? null,
      nro_creditos: null,
    };

    if (programa.length > 0) {
      info_cliente.siglas_colegio = programa[0].siglas_colegio;
      info_cliente.cod_colegio = programa[0].cod_colegio;
      info_cliente.nom_periodo = programa[0].nom_periodo;
      info_cliente.cod_periodo = programa[0].cod_periodo;
      info_cliente.nom_nivel_educativo = programa[0].nom_nivel_educativo;
      info_cliente.cod_nivel_edu = programa[0].cod_nivel_edu;
      info_cliente.cod_nivel_educativo = programa[0].cod_nivel_educativo;
    } else {
      throw new Error(
        "No se ha podido consultar el programa academico, intente nuevamente"
      );
    }

    if (estudianteDb.length > 0) {
      info_cliente.ide_genero = estudianteDb[0].ide_genero;
      info_cliente.cod_municipio = estudianteDb[0].cod_municipio;
      info_cliente.dir_persona = estudianteDb[0].dir_persona;
    }

    if (
      resultPaquete[0].categoria_id == null ||
      resultPaquete[0].categoria_id == undefined
    ) {
      resultPaquete[0].categoria_id = 0;
    }

    // verificar si ya existe una factura sin pagar
    const resultExistePago = await profile("existeFactura", () => existeFactura(
      body.id_persona,
      resultPaquete[0].categoria_id
    ));

    //GUARDAR EL PAGO EN LA DB
    const tPago: any = {
      codigo: codigoFactura,
      descripcion: body.des_concepto,
      json_response: null,
      estado_id: 200,
      estudiante_id: body.id_persona,
      is_online: isPagoOnline,
      fecha_update: format(new Date(), "YYYY-MM-DD HH:mm:ss"),
      // matricula_id: matricula.cod_matricula,
      valor: body.total,
      // periodo_id: matricula.cod_periodo,
      cod_paquete: resultPaquete[0].codigo,
      categoria_pago_id: resultPaquete[0].categoria_id,
    };

    //crear un nuevo pago
    resultPaquete.forEach((concepto: any) => {
      concepto.cantidad = cantidad;
      tDetallePago.push({
        pago_id: !resultExistePago?._id ? null : resultExistePago._id, // si se envia el id se lo asigna
        concepto_id: concepto.concepto_id,
        descuento: concepto.descuento,
        aumento: concepto.aumento,
        valor_unidad:
          concepto.concepto_id == 0
            ? parseInt(Math.round(body.total).toString())
            : concepto.valor_unidad,
        //cantidad: concepto.cantidad,
        cantidad: cantidad,
      });
      if (concepto.concepto_id == 0) {
        concepto.valor_unidad = parseInt(Math.round(body.total).toString());
      }
    });

    if (!resultExistePago) {
      //preparamos la data para guardar
      resultSavePago = await profile("guardarPagoyDetalle", () => guardarPagoyDetalle(tPago, tDetallePago));
      //   no se guardó exitosamente
      if (resultSavePago == false) {
        throw new Error("No se ha podido guardar el pago");
      }
      id_pago = resultSavePago[0];
    } else {
      id_pago = resultExistePago._id;
      resultSavePago = await profile("actualizarPagoyDetalleNew", () => actualizarPagoyDetalleNew(
        tPago,
        tDetallePago,
        id_pago
      ));

      if (resultSavePago != false) {
        id_pago = resultSavePago[0];
      } else {
        throw new Error("No se ha podido guardar el pago");
      }
    }

    //actualizamos los datos en la DB
    let json_detalle: any = {
      general: {
        fecha_limite_pago: fechaLimitepago2,
        fecha_actual: format(new Date(), "DD-MM-YYYY hh:mm:ss A"),
        fecha_fin_ordinaria: fechaLimitepago2,
        fecha_fin_extraordinaria: fechaLimitepago2,
        des_pago: body.des_concepto,
      },
      info_cliente: info_cliente,
      det_factura: resultPaquete,
      descuentos: [],
      cod_pago: codigoFactura,
      total_a_pagar_s: moneda
        .format(body.total, { locale: "es-CO" })
        .replace("$", "")
        .trim(),
      total_a_pagar_i: parseInt(Math.round(body.total).toString()),
    };

    let [codigo1] = await profile("generarCodigoBarrasText", () => generarCodigoBarrasText(
      resultSavePago[0],
      body.total,
      fechaLimitepago2
    ));
    //acualizar codigo de barras en la base de datos y el json con la referencia
    let dataPagoUpdate = {
      codigo_barras: codigo1,
      json_response: JSON.stringify(json_detalle),
    };
    let respDB = await profile("updateDataPago", () => updateDataPago(dataPagoUpdate, resultSavePago[0]));

    //INICAMOS EL PAGO CON ZONAPAGOS
    if (isPagoOnline) {
      //preparamos los datos para enviar a zonapagos
      const infoPago: IParamsOnline = {
        flt_total_con_iva: parseInt(body.total),
        flt_valor_iva: 0,
        str_id_pago: id_pago,
        str_descripcion_pago: body.des_concepto,
        str_email: body.email_persona,
        str_id_cliente: body.id_persona,
        str_tipo_id: body.tipo_id,
        str_nombre_cliente: body.nombre1 + " " + body.nombre2,
        str_apellido_cliente: body.apellido1 + " " + body.apellido2,
        str_telefono_cliente: body.cel_persona,
        str_opcional1: "0", //codigo paquete
        str_opcional2: "", //valor en letras
        str_opcional3: "", //matricula
        str_opcional4: "", //periodo
        str_opcional5: "",
      };

      //recortamos el tamaño de la descripcion
      const finpago2: IParamsOnline = structuredClone(infoPago);

      finpago2.str_descripcion_pago = finpago2.str_descripcion_pago.slice(
        0, 70
      );

      let bodyZonapagos = dataConfigPago(finpago2);
      responseDataZonaPagos = await profile("ZonaPagos InicioPago", () => inicarPagoZonaPagos(bodyZonapagos, { pagoId: id_pago }));
    } else {
      //llenamos el idpago al detalle
      resultPaquete.forEach(
        (det: any) => (det.valor_unidad = parseInt(body.total))
      );

      str_url =
        process.env.BASE_URL +
        "/transaccion/GenerarPagoCodigoBarras/" +
        codigo1;
      responseDataZonaPagos = {
        int_codigo: 1,
        str_cod_error: "",
        str_descripcion_error: "",
        str_url: str_url,
      };
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Ejecucion correcta",
      error: false,
      pago_id: id_pago,
      data: responseDataZonaPagos,
    });
  } catch (error) {
    console.log("[INICIO_PAGOS_VARIOS_ERROR]", {
      code: error?.originalCode || error?.code,
      message: error?.message,
    });
    res.status(500).json({
      error: true,
      message: error.message || "El servicio no está disponible temporalmente.",
    });
  }
};

//===================================
//   /transaccion/InicioPagoGeneral
//====================================
export const inicioPagoGeneral = async (req: any, res: any) => {
  let fechaActual = new Date();
  fechaActual.setMonth(fechaActual.getMonth() + 12);
  let fechaLimitepago = format(fechaActual, "YYYY-MM-DD");

  let body = req.body;
  let responseDataZonaPagos: any = {};
  let isPagoOnline: boolean = body.isPagoOnline != true ? false : true;
  let resultSavePago: any = {};
  let tDetallePago: any = [];
  let id_pago: number = null;
  let str_url = "";
  let info_cliente: any = {};

  try {
    let cadenaCodigo =
      body.nombre1 +
      body.nombre2 +
      body.apellido1 +
      body.apellido2 +
      body.id_cliente;
    let codigoFactura = await generarCodigoFactura(
      cadenaCodigo.toUpperCase().trim()
    );

    let resultPaquete = await getPaquete(0);

    if (resultPaquete == false) {
      throw new Error("No se encontraron paquetes configurados");
    }

    info_cliente = {
      cod_matricula: null,
      cod_doc: body.tipo_id,
      tipo_doc: body.tipo_id_text == "" ? "CC" : body.tipo_id_text,
      nom_estadomatricula: null,
      ide_persona: body.id_persona,
      ape1_persona: body.apellido1,
      ape2_persona: body.apellido2,
      nom1_persona: body.nombre1,
      nom2_persona: body.nombre2,
      email_persona: body.email_persona,
      cel_persona: body.cel_persona,
      siglas_colegio: null,
      cod_colegio: null,
      nom_periodo: null,
      cod_periodo: null,
      nom_nivel_educativo: null,
      cod_nivel_edu: null,
      nro_creditos: null,
    };

    //GUARDAR EL PAGO EN LA DB
    let tPago: any = {
      codigo: codigoFactura,
      descripcion: body.des_concepto,
      json_response: null,
      estado_id: 200,
      estudiante_id: body.id_persona,
      // matricula_id: matricula.cod_matricula,
      valor: body.total,
      // periodo_id: matricula.cod_periodo,
      cod_paquete: resultPaquete[0].codigo,
      categoria_pago_id: resultPaquete[0].categoria_id,
    };

    //crear un nuevo pago
    resultPaquete.forEach((concepto: any) => {
      tDetallePago.push({
        pago_id: null, // si se envia el id se lo asigna
        concepto_id: concepto.concepto_id,
        descuento: concepto.descuento,
        aumento: concepto.aumento,
        valor_unidad: concepto.valor_unidad + body.total,
        cantidad: concepto.cantidad,
      });
    });

    //preparamos la data para guardar
    resultSavePago = await guardarPagoyDetalle(tPago, tDetallePago);
    console.log(resultSavePago);
    //   no se guardó exitosamente
    if (resultSavePago == false) {
      throw new Error("No se ha podido guardar el pago");
    }
    id_pago = resultSavePago[0];

    //actualizamos los datos en la DB
    let json_detalle: any = {
      general: {
        fecha_limite_pago: fechaLimitepago,
        fecha_actual: format(new Date(), "DD-MM-YYYY hh:mm:ss A"),
        fecha_fin_ordinaria: fechaLimitepago,
        fecha_fin_extraordinaria: fechaLimitepago,
        des_pago: body.des_concepto,
      },
      info_cliente: info_cliente,
      det_factura: resultPaquete,
      descuentos: [],
      cod_pago: codigoFactura,
      total_a_pagar_s: moneda
        .format(body.total, { locale: "es-CO" })
        .replace("$", "")
        .trim(),
      total_a_pagar_i: parseInt(Math.round(body.total).toString()),
    };

    let [codigo1] = await generarCodigoBarrasText(
      resultSavePago[0],
      body.total,
      fechaLimitepago
    );
    //acualizar codigo de barras en la base de datos y el json con la referencia
    let dataPagoUpdate = {
      codigo_barras: codigo1,
      json_response: JSON.stringify(json_detalle),
    };
    let respDB = await updateDataPago(dataPagoUpdate, resultSavePago[0]);

    //INICAMOS EL PAGO CON ZONAPAGOS
    if (isPagoOnline) {
      //preparamos los datos para enviar a zonapagos
      let infoPago = new Pago({
        flt_total_con_iva: parseInt(body.total),
        flt_valor_iva: 0,
        str_id_pago: id_pago,
        str_descripcion_pago: body.des_concepto,
        str_email: body.email_persona,
        str_id_cliente: body.id_persona,
        str_tipo_id: body.tipo_id,
        str_nombre_cliente: body.nombre1 + " " + body.nombre2,
        str_apellido_cliente: body.apellido1 + " " + body.apellido2,
        str_telefono_cliente: body.cel_persona,
        str_opcional1: "0", //codigo paquete
        str_opcional2: "", //valor en letras
        str_opcional3: "", //matricula
        str_opcional4: "", //periodo
        str_opcional5: "",
      });

      //recortamos el tamaño de la descripcion
      let finpago2: Pago = structuredClone(infoPago);
      finpago2.str_descripcion_pago = finpago2.str_descripcion_pago.slice(
        0, 70
      );

      let bodyZonapagos = dataConfigPago(finpago2);
      responseDataZonaPagos = await inicarPagoZonaPagos(bodyZonapagos);
    } else {
      //llenamos el idpago al detalle
      resultPaquete.forEach(
        (det: any) => (det.valor_unidad = parseInt(body.total))
      );

      str_url =
        process.env.BASE_URL +
        "/transaccion/GenerarPagoCodigoBarras/" +
        codigo1;
      responseDataZonaPagos = {
        int_codigo: 1,
        str_cod_error: "",
        str_descripcion_error: "",
        str_url: str_url,
      };
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Ejecucion correcta",
      error: false,
      pago_id: id_pago,
      data: responseDataZonaPagos,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: true,
      message: "El servicio no esta disponible: " + error.message,
    });
  }
};

//consulta datos para pago inscripcion
export const consultarDatosInscripcion = async (
  id_matricula: any,
  packageParam?: any
) => {
  let resultDB: any;
  let resultPaquete: any;
  let total = 0;
  let total_a_pagar = 0;
  let total_sin_descuento = 0;
  let porcentaje_descuento = 0;
  let porcentaje_aumento = 0;
  let auxDescripcion = "";
  let fechaActualString = format(new Date(), "DD-MM-YYYY hh:mm:ss A");
  let descuentos: any = [];

  let fecha_limite_pago = new Date();
  fecha_limite_pago.setMonth(fecha_limite_pago.getMonth() + 12);

  try {
    let result = await getInfoMatricula(id_matricula);
    resultDB = result[0][0];

    if (result[0].length > 0) {
      const packageCode = resolverCodigoPaqueteInscripcion(
        resultDB,
        packageParam
      );
      resultPaquete = await getPaquete(packageCode);
      if (!resultPaquete || resultPaquete.length < 1) {
        throw new Error("No se encontraron precios configurados");
      }
      //consular los descuentos y multas que un estudiante tiene asignados
      let resultDto = await getDescuento(
        resultPaquete[0].categoria_id,
        resultDB.cod_periodo,
        resultDB.ide_persona
      );
      console.log(resultDto);

      resultDto.forEach((row: any) => {
        //si aplica descuento sino aplica aumento, si es 1 añade un descuento

        //si se puede aplicar a todos los tipos de concepto. Trae los descuentos segun el tipo
        if (row.tipo == "1") {
          descuentos.push(row);
          if (row.accion == 1) {
            porcentaje_descuento = porcentaje_descuento + row.porcentaje;
            auxDescripcion =
              auxDescripcion +
              " + DESCUENTO " +
              row.porcentaje * 100 +
              "% " +
              row.observacion;
          } else {
            porcentaje_aumento = porcentaje_aumento + row.porcentaje;
            auxDescripcion =
              auxDescripcion +
              " + AUMENTO " +
              row.porcentaje * 100 +
              "% " +
              row.observacion;
          }
        }
      });

      //agregar descuentos y aumentos encontrados
      resultPaquete.forEach((element: any, index: number) => {
        if (element.descuento_ext == "1") {
          console.log(porcentaje_descuento);
          element.descuento = porcentaje_descuento;
          element.aumento = porcentaje_aumento;

          let subTotal =
            element.valor_unidad * element.cantidad +
            element.valor_unidad * element.cantidad * element.aumento -
            element.valor_unidad * element.cantidad * element.descuento;
          element.subtotal = subTotal;
          total_a_pagar = total_a_pagar + subTotal;
        }
      });
    } else {
      throw new Error("No se encontró la inscripción");
    }

    const packageCode = resolverCodigoPaqueteInscripcion(resultDB, packageParam);
    let estadoPago = await existePago(packageCode.toString(), id_matricula);

    let periodoInfo = await getFechasPeriodo(
      resultDB.cod_colegio,
      resultDB.cod_periodo
    );
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

    let arrayDB: any = {};

    arrayDB.general = {
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
    arrayDB.info_cliente = resultDB;
    let estudianteDb: any = await getInfoUsuario(resultDB.ide_persona);
    if (estudianteDb.length > 0) {
      arrayDB.info_cliente.ide_genero = estudianteDb[0].ide_genero || null;
      arrayDB.info_cliente.cod_municipio =
        estudianteDb[0].cod_municipio || null;
      arrayDB.info_cliente.dir_persona = estudianteDb[0].dir_persona || null;
    }
    arrayDB.det_factura = resultPaquete;
    arrayDB.descuentos = descuentos;
    arrayDB.cod_pago = "";

      arrayDB.total_a_pagar_s = moneda
        .format(total_a_pagar, { locale: "es-CO" })
        .replace("$", "")
        .trim();
    arrayDB.total_a_pagar_i = Math.round(total_a_pagar);

    return arrayDB;
  } catch (error) {
    throw new Error(error.message);
  }
};

//verifica los pagos en zonapagos y actualiza el estado en la db
export const Verificadorpago = async (pago_id: any) => {
  let fechaUpdate = new Date();
  const data = {
    int_id_comercio: process.env.ZONAPAGOS_ID,
    str_usr_comercio: process.env.ZONAPAGOS_USER,
    str_pwd_comercio: process.env.ZONAPAGOS_PASS,
    int_no_pago: -1,
    str_id_pago: pago_id, //cambiar por id
  };

  let id_pago = await detIdPagoByID(pago_id);

  try {
    let responseData = await ejecutarZonaPagos(data, "VerificacionPago");

    if (responseData.int_error == 0) {
      let pagoDecoded = decodePagoToList(responseData.str_res_pago);
      let dataBody: any = pagoDecoded[0];

      let data: any = {
        json_detalle: responseData.str_res_pago,
        estado_id: pagoDecoded[0].int_pago_terminado,
        is_online: "1",
        fecha_update: format(fechaUpdate, "YYYY-MM-DD HH:mm:ss"),
      };

      let detPago: any = [];
      pagoDecoded.forEach((det: any) => {
        console.log("recorriendo el pago");

        let fechaInsert: any = fechaUpdate;

        if (det.dat_fecha == "") {
          fechaInsert = format(fechaUpdate, "YYYY-MM-DD HH:mm:ss");
        } else {
          fechaInsert = format(
            parse(det.dat_fecha, "DD/MM/YYYY h:mm:ss A"),
            "YYYY-MM-DD HH:mm:ss"
          );
        }

        detPago.push({
          _id: uuidv4(),
          pago_id: id_pago,
          int_n_pago: det.int_n_pago == "" ? null : det.int_n_pago,
          valor_pago: det.dbl_valor_pagado == "" ? 0 : det.dbl_valor_pagado,
          total_pago: det.dbl_total_pago == "" ? 0 : det.dbl_total_pago,
          valor_iva_pago:
            det.dbl_valor_iva_pagado == "" ? 0 : det.dbl_valor_iva_pagado,
          estado_pago_id:
            det.int_estado_pago == "" ? null : det.int_estado_pago,
          forma_pago_id:
            det.int_id_forma_pago == "" ? null : det.int_id_forma_pago,
          nombre_banco:
            det.str_nombre_banco == "" ? null : det.str_nombre_banco,
          codigo_transaccion:
            det.str_codigo_transacción == ""
              ? null
              : det.str_codigo_transacción,
          fecha: fechaInsert,
          ticketID: det.str_ticketID == "" ? null : det.str_ticketID,
          numero_tarjeta:
            det.int_numero_tarjeta == "" ? null : det.int_numero_tarjeta,
          franquicia: det.str_franquicia == "" ? null : det.str_franquicia,
          cod_aprobacion:
            det.int_cod_aprobacion == "" ? null : det.int_cod_aprobacion,
          num_recibido:
            det.int_num_recibido == "" ? null : det.int_num_recibido,
        });
      });

      //actualiza la fecha y el estado de un pago en la DB
      let resDB = await actualizarEstadoPago(data, pago_id);

      //borra y crea los detalles pago: true-false
      let resDb2 = await actualizarPagoyDetalle(id_pago, detPago);
      return true;
    } else {
      throw new Error(
        "Error de comunicacion con zonapagos o código no encontrado"
      );
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};
