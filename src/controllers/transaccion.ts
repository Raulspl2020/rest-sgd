import { response } from "express";
import cryptoRandomString from "crypto-random-string";
import { v4 as uuidv4 } from "uuid";

import { Pago } from "../models/Pago";
import fetch from "node-fetch";
import { dataConfigPago, limpiarCampos } from "../helpers/pago";
import { parse, format } from "date-format-parse";
import { consultarpagoMatricula } from "../controllers/matricula";
import { subirArchivo } from "../helpers/subir-archivo";
import { guardarLog } from "../provider/log_provider";
import {
  guardarPagoyDetalle,
  getConceptosPaquete,
  actualizarEstadoPago,
  actualizarPagoyDetalle,
  getConfigPeriodo,
  getCategoriaPorcentaje,
  guardarProcentajeSoporte,
  detIdPagoByID,
  getDescuento,
  updateEstadoDescuentoFac,
} from "../provider/pago_provider";
import { consultaFacturaBanco } from "../provider/factura_provider";
import { getInfoMatricula } from "../provider/matricula_provider";
import { complileTemplateReciboPago } from "./template";
import { registroFacturaSysApolo } from "./sysapolo/factura";
import { EDataInsertPago } from "../interfaces/facturas.interface";
import { decodePagoToList } from "../helpers/decodePagoToList";
let Validator = require("validatorjs");

const syncSysApoloInBackground = (invoiceId: number, source: string) => {
  console.log(
    `[SYSAPOLO_SYNC_TRIGGER] source=${source} factura=${invoiceId} dispatch`,
  );
  void registroFacturaSysApolo(invoiceId)
    .then(([ok, message]) => {
      console.log(
        `[SYSAPOLO_SYNC_TRIGGER] source=${source} factura=${invoiceId} ok=${ok} message=${message}`,
      );
    })
    .catch((error) => {
      console.error(
        `[SYSAPOLO_SYNC_TRIGGER] source=${source} factura=${invoiceId} error=${error?.message || error}`,
      );
    });
};

//====================
//   /transaccion/soporteDescuento
//=====================
export const soporteDescuento = async (req: any, res = response) => {
  let metadatos: any = null;
  let id_config: any = null;
  try {
    let body = req.body || {};

    const estudianteId = String(body.estudiante_id || "").trim();
    const matriculaId = String(body.matricula_id || "").trim();
    const porcentajeCategoriaId = String(body.porcentaje_categoria_id || "").trim();
    const periodoId = String(body.periodo_id || "").trim();
    const observacion = String(body.observacion || "").trim();

    if (!estudianteId || !matriculaId || !porcentajeCategoriaId || !periodoId || !observacion) {
      return res.status(400).json({
        error: true,
        message: "Faltan datos requeridos para registrar el soporte de descuento.",
      });
    }

    if (!body.porcentaje_categoria_id) {
      return res.status(400).json({
        message: "Debe seleccionar un tipo de descuento válido",
        error: true,
      });
    }

    if (!observacion) {
      return res.status(400).json({
        message: "La observación es obligatoria",
        error: true,
      });
    }

    if (!req.files || !req.files.archivo) {
      return res.status(400).json({
        message: "Debe adjuntar un archivo PDF como soporte",
        error: true,
      });
    }

    const archivo: any = req.files.archivo;

    const MAX_FILE_SIZE = 1024 * 1024;
    if (Number(archivo?.size || 0) > MAX_FILE_SIZE) {
      return res.status(413).json({
        message:
          "El archivo supera el tamaño máximo permitido. Por favor cargue un PDF de máximo 1 MB.",
        error: true,
      });
    }

    const fileName = String(archivo.name || "").toLowerCase();
    const mimeType = String(archivo.mimetype || "").toLowerCase();
    if (!fileName.endsWith(".pdf") || (mimeType && mimeType !== "application/pdf")) {
      return res.status(400).json({
        message: "El archivo adjunto debe ser un PDF válido",
        error: true,
      });
    }

    let resultCategoria = await getCategoriaPorcentaje(
      porcentajeCategoriaId
    );
    if (!resultCategoria) {
      return res.status(400).json({
        message: "La categoría de descuento no existe",
        error: true,
      });
    }

    const descripcionCategoria = String(resultCategoria.descripcion || "")
      .trim()
      .toUpperCase();
    if (descripcionCategoria === "NO APLICA") {
      return res.status(400).json({
        message: "La categoría NO APLICA no permite registrar solicitudes",
        error: true,
      });
    }

    //subir el archivo si existe
    if (req.files && req.files.archivo) {
      const carpeta = `soportedescuento/${estudianteId}-${matriculaId}/`;
      const dataFile: any = await subirArchivo(req.files, ["pdf"], carpeta);

      metadatos = {
        url: "",
        extencion: dataFile[1],
        nombre: dataFile[0],
        size: dataFile[2],
        basepath: dataFile[3],
      };
    }

    let resultConfig = await getConfigPeriodo();
    if (resultConfig) {
      id_config = resultConfig._id;
    } else {
      throw new Error("No se encontró configuracion activa");
    }

    const dataPorcentaje: any = {
      estudiante_id: estudianteId,
      porcentaje: resultCategoria.valor ? resultCategoria.valor : 0,
      config_id: id_config,
      porcentaje_categoria_id: porcentajeCategoriaId,
      matricula_id: matriculaId,
      nom_periodo: body.nom_periodo,
      periodo_id: periodoId,
      observacion,
      accion: body.accion ? body.accion : 1,
      tipo: body.accion ? body.tipo : 0,
      json_file: JSON.stringify(metadatos),
      porcentaje_estado_id: body.porcentaje_estado_id
        ? body.porcentaje_estado_id
        : 1,
    };

    let resultInsert = await guardarProcentajeSoporte(dataPorcentaje);

    return res.status(200).json({
      message: "Enviado exitosamente",
      error: false,
      dataPorcentaje,
    });
  } catch (error) {
    console.log("error soporteDescuento", error);
    return res.status(500).json({
      message: "Servicio no disponible temporalmente",
      error: true,
      det_error: error.message,
    });
  }
};

//====================
//   /transaccion/estado
//=====================
//este servicio es consumido con ZONA pagos para la notificacion de un pago
export const actualizarTransaccion = async (req: any, res = response) => {
  let codigo_pago = req.query.id_pago;

  const data = {
    int_id_comercio: process.env.ZONAPAGOS_ID,
    str_usr_comercio: process.env.ZONAPAGOS_USER,
    str_pwd_comercio: process.env.ZONAPAGOS_PASS,
    int_no_pago: -1,
    str_id_pago: codigo_pago,
  };

  let estado_pago = 0;

  let fechaUpdate = new Date();

  try {
    let response = await fetch(
      process.env.ZONAPAGOS_URL + "/VerificacionPago",
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }
    );
    let responseData = await response.json();

    //no se encontraron pago online
    if (responseData.int_estado == 1 && responseData.int_cantidad_pagos == 0) {
      console.log("No se encontro el pago online");

      let resultDB = await actualizarEstadoPago(
        {
          is_online: "0",
        },
        codigo_pago
      );
      console.log(resultDB);
    }

    if (responseData.int_error == 0) {
      let id_pago = await detIdPagoByID(codigo_pago);

      const pagoDecoded = decodePagoToList(responseData.str_res_pago);
      let dataBody: any = pagoDecoded.length > 0 ? pagoDecoded[0] : {};
      if (id_pago == false) {
        //insertar el pago en la DB

        let infoPago = new Pago({
          flt_total_con_iva: dataBody.dbl_total_pago,
          flt_valor_iva: dataBody.dbl_valor_iva_pagado,
          str_id_pago: limpiarCampos(codigo_pago),
          str_descripcion_pago: limpiarCampos(dataBody.str_descripcion),
          str_email: dataBody.str_email,
          str_id_cliente: limpiarCampos(dataBody.str_id_cliente),
          str_tipo_id: limpiarCampos(dataBody.str_tipo_id),
          str_nombre_cliente: limpiarCampos(dataBody.str_nombre_cliente),
          str_apellido_cliente: limpiarCampos(dataBody.str_apellido_cliente),
          str_telefono_cliente: limpiarCampos(dataBody.str_telefono_cliente),
          str_opcional1: limpiarCampos(dataBody.str_campo1), //codigo paquet)e
          str_opcional2: limpiarCampos(dataBody.str_campo2), //valor en letra)s
          str_opcional3: limpiarCampos(dataBody.str_campo3), //matricul)a
          str_opcional4: limpiarCampos(dataBody.str_campo4), //periodo
          str_opcional5: limpiarCampos(dataBody.str_campo5),
        });

        let resSavePago = await savePago(infoPago, null, null);

        id_pago = resSavePago.pago_id;
      }

      let data: any = {
        json_detalle: responseData.str_res_pago,
        estado_id: pagoDecoded[0].int_pago_terminado,
        is_online: "1",
        fecha_update: format(fechaUpdate, "YYYY-MM-DD HH:mm:ss"),
      };

      const detPago: EDataInsertPago[] = [];
      //console.log(JSON.stringify(pagoDecoded));
      pagoDecoded.forEach((det: any) => {
        let fechaInsert: any = fechaUpdate;

        if (det.dat_fecha == "" || det.dat_fecha == undefined) {
          fechaInsert = format(fechaUpdate, "YYYY-MM-DD HH:mm:ss");
        } else {
          fechaInsert = format(
            parse(det.dat_fecha, "DD/MM/YYYY h:mm:ss A"),
            "YYYY-MM-DD HH:mm:ss"
          );
        }

        estado_pago = det.int_estado_pago == 1 ? det.int_estado_pago : 0;

        detPago.push({
          _id: uuidv4(),
          pago_id: id_pago,
          int_n_pago: det.int_n_pago == "" ? null : det.int_n_pago || null,
          valor_pago:
            det.dbl_valor_pagado == "" ? 0 : det.dbl_valor_pagado || 0,
          total_pago: det.dbl_total_pago == "" ? 0 : det.dbl_total_pago || 0,
          valor_iva_pago:
            det.dbl_valor_iva_pagado == "" ? 0 : det.dbl_valor_iva_pagado || 0,
          estado_pago_id:
            det.int_estado_pago == "" ? null : det.int_estado_pago || null,
          forma_pago_id:
            det.int_id_forma_pago == "" ? null : det.int_id_forma_pago || null,
          nombre_banco:
            det.str_nombre_banco == "" ? null : det.str_nombre_banco || null,
          codigo_transaccion:
            det.str_codigo_transacción == ""
              ? null
              : det.str_codigo_transacción || null,
          fecha: fechaInsert || null,
          ticketID: det.str_ticketID == "" ? null : det.str_ticketID || null,
          numero_tarjeta:
            det.int_numero_tarjeta == ""
              ? null
              : det.int_numero_tarjeta || null,
          franquicia:
            det.str_franquicia == "" ? null : det.str_franquicia || null,
          cod_aprobacion:
            det.int_cod_aprobacion == ""
              ? null
              : det.int_cod_aprobacion || null,
          num_recibido:
            det.int_num_recibido == "" ? null : det.int_num_recibid0 || null,
        });
      });

      //ACTUALIZAMOS EL ESTADO DE CADA DESCUENTO
      if (estado_pago == 1) {
        let resultObjectDB: any = await consultaFacturaBanco(id_pago);
        let categoria_id = resultObjectDB.data[0].categoria_pago_id;
        if (resultObjectDB != false) {
          if (categoria_id == 1) {
            let matricula_id = resultObjectDB.data[0].matricula_id?.toString();

            let resultMatricula = await getInfoMatricula(matricula_id);
            let resultDB = resultMatricula[0][0];
            //consular los descuentos y multas que un estudiante tiene asignados
            let resultDto = await getDescuento(
              categoria_id,
              resultDB.cod_periodo,
              resultDB.ide_persona
            );

            if (resultDto.length > 0) {
              let idsDescuento: any = [];
              resultDto.forEach((e: any) => {
                idsDescuento.push(e._id);
              });

              console.log("Se encontraron descuentos");
              let resultUpdateDB = await updateEstadoDescuentoFac(
                idsDescuento,
                id_pago
              );
              console.log(resultUpdateDB);
            } else {
              console.log("NO Se encontraron descuentos");
            }
          }
        }
      }

      //actualiza la fecha y el estado de un pago en la DB
      let resDB = await actualizarEstadoPago(data, codigo_pago);

      //borra y crea los detalles pago: true-false
      let resDb2 = await actualizarPagoyDetalle(Number(id_pago), detPago);

      if (resDb2) {
        let response = {
          message: "Pago actualizado exitosamente",
          error: false,
          data: pagoDecoded,
          data_server: responseData.str_res_pago,
        };

        if (estado_pago == 1) {
          //enviar recibo de pago al correo electronico
          const ip =
            req.headers["x-forwarded-for"] || req.connection.remoteAddress;
          console.log(ip);
          if (`${ip}` == "200.41.6.47") complileTemplateReciboPago(codigo_pago);
          syncSysApoloInBackground(Number(codigo_pago), "transaccion.estado");
        }

        guardarLog({
          url_service: req.protocol + "://" + req.get("host") + req.originalUrl,
          body_request: JSON.stringify(req.query),
          // body_response: JSON.stringify(response),
          header_request: JSON.stringify(req.headers),
          status_code: 200,
          message: "OK",
          client_ip:
            req.headers["x-forwarded-for"] || req.connection.remoteAddress,
          invoice_id: codigo_pago,
          created_at: format(fechaUpdate, "YYYY-MM-DD HH:mm:ss"),
        });

        res.status(200).json(response);
      } else {
        throw new Error("No se ha podido insertar los detalle de pago");
      }
    } else {
      throw new Error(
        "Error de comunicacion con zonapagos o código no encontrado"
      );
    }
  } catch (error) {
    console.log(error);

    let response = {
      message: "Servicio no disponible temporalmente",
      error: true,
      det_error: error.message,
    };

    guardarLog({
      url_service: req.protocol + "://" + req.get("host") + req.originalUrl,
      body_request: JSON.stringify(req.query),
      body_response: JSON.stringify(response),
      header_request: JSON.stringify(req.headers),
      status_code: 500,
      message: error.message,
      client_ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      invoice_id: codigo_pago,
      created_at: format(fechaUpdate, "YYYY-MM-DD HH:mm:ss"),
    });

    res.status(500).json(response);
  }
};

//====================
//   /transaccion/VerificacionPago
//=====================
export const verificaPago = async (req: any, res = response) => {
  let body = req.body;
  const data = {
    int_id_comercio: process.env.ZONAPAGOS_ID,
    str_usr_comercio: process.env.ZONAPAGOS_USER,
    str_pwd_comercio: process.env.ZONAPAGOS_PASS,
    int_no_pago: -1,
    str_id_pago: body.str_id_pago,
  };

  fetch(process.env.ZONAPAGOS_URL + "/VerificacionPago", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.int_error == 0) {
        let pagoDecoded = decodePagoToList(response.str_res_pago);
        res.status(200).json({
          message: response.str_detalle,
          error: false,
          data: pagoDecoded,
          data_server: response.str_res_pago,
        });
      } else {
        res.status(200).json({
          message: response.str_detalle,
          error: true,
          data: response,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Algo salio mal",
        error: true,
        det_error: error,
      });
    });
};

//====================
//   /transaccion/InicioPago
//=====================
export const inicioPago = async (req: any, res = response) => {
  let dataBody: any = req.body;

  try {
    let infoPago = new Pago({
      flt_total_con_iva: dataBody.flt_total_con_iva,
      flt_valor_iva: dataBody.flt_valor_iva,
      str_id_pago: limpiarCampos(dataBody.str_id_pago),
      str_descripcion_pago: limpiarCampos(dataBody.str_descripcion_pago),
      str_email: dataBody.str_email,
      str_id_cliente: limpiarCampos(dataBody.str_id_cliente),
      str_tipo_id: limpiarCampos(dataBody.str_tipo_id),
      str_nombre_cliente: limpiarCampos(dataBody.str_nombre_cliente),
      str_apellido_cliente: limpiarCampos(dataBody.str_apellido_cliente),
      str_telefono_cliente: limpiarCampos(dataBody.str_telefono_cliente),
      str_opcional1: limpiarCampos(dataBody.str_opcional1), //codigo paquete
      str_opcional2: limpiarCampos(dataBody.str_opcional2), //valor en letras
      str_opcional3: limpiarCampos(dataBody.str_opcional3), //matricula
      str_opcional4: limpiarCampos(dataBody.str_opcional4), //periodo
      str_opcional5: limpiarCampos(dataBody.str_opcional5),
    });

    //si no se envia el codigo se crea un nuevo pago
    if (dataBody.str_id_pago == "") {
      //generamos el codigo
      let cadena =
        dataBody.str_nombre_cliente +
        dataBody.str_apellido_cliente +
        dataBody.str_id_cliente.trim();

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
        infoPago.str_id_pago = codigo;
        contador++;

        if (contador > 1000) {
          throw new Error("No se ha podido generar el codigo");
        }
      } while (validation.fails());

      //verificar si es un pago de matricula, si lo es consultar el valor a pagar
      let conceptos = await getConceptosPaquete(infoPago.str_opcional1);

      if (
        conceptos.length > 0 &&
        conceptos[0].categoria_id == 1 &&
        infoPago.str_opcional3 != ""
      ) {
        pagoMat = await consultarpagoMatricula(infoPago.str_opcional3);
        infoPago.flt_total_con_iva = pagoMat.total_a_pagar_int;
        infoPago.str_opcional3 = pagoMat.matricula.cod_matricula;
        infoPago.str_opcional4 = pagoMat.matricula.cod_periodo;
      }

      //recortamos el tamaño de la descripcion
      let finpago2: Pago = new Pago(infoPago);
      finpago2.str_descripcion_pago = finpago2.str_descripcion_pago.slice(
        0,
        -(finpago2.str_descripcion_pago.length - 70)
      );

      let responseZona = await fetch(
        process.env.ZONAPAGOS_URL + "/InicioPago",
        {
          method: "POST",
          body: JSON.stringify(dataConfigPago(finpago2)),
          headers: { "Content-Type": "application/json" },
        }
      );

      let responseData = await responseZona.json();

      if (responseData.int_codigo == 1) {
        let response = await savePago(
          infoPago,
          JSON.stringify(responseData),
          pagoMat
        );
        res.status(response.statusCode).json(response);
      } else {
        throw new Error("Parámetros enviados de forma incorrecta");
      }
    } else {
      let response = await updatePago(infoPago);
      res.status(response.statusCode).json(response);
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
      error: true,
      det_error: error.message,
    });
  }
};

//====================
//   guardarEL pago generado
//=====================
const savePago = async (
  infoPago: any,
  responseData: any,
  dataMatricula: any
) => {
  console.log("ejecutamos la fucnion de save");

  //pendiente validar precios: si son diferentes mostrar alerta

  let ret: any = {};

  const paquete_id = infoPago.str_opcional1;
  const id_pago = infoPago.str_id_pago;
  const tDetallePago: any = [];

  try {
    //buscamos un paquete por codigo
    let conceptos = await getConceptosPaquete(paquete_id);

    if (conceptos.length > 0) {
      //si es un pago de matricula
      if (dataMatricula !== null) {
        dataMatricula.detalle_factura.forEach((concepto: any) => {
          tDetallePago.push({
            pago_id: null,
            concepto_id: concepto.concepto_id,
            descuento: concepto.descuento,
            aumento: concepto.aumento,
            valor_unidad: concepto.valor_unidad,
            cantidad: concepto.cantidad,
          });
        });
      } else {
        conceptos.forEach((concepto: any) => {
          tDetallePago.push({
            pago_id: null,
            concepto_id: concepto.concepto_id,
            descuento: concepto.descuento,
            aumento: concepto.aumento,
            valor_unidad:
              concepto.categoria_id == 0
                ? infoPago.flt_total_con_iva
                : concepto.valor_unidad,
            cantidad: concepto.cantidad,
          });
        });
      }
    } else {
      throw new Error("No se encontro el paquete...");
    }

    let tPago: any = {
      _id: id_pago,
      codigo: infoPago.str_id_pago,
      descripcion: infoPago.str_descripcion_pago,
      // json_response: responseData,
      estado_id: 200,
      estudiante_id: infoPago.str_id_cliente,
      matricula_id:
        infoPago.str_opcional3 == "" ? null : infoPago.str_opcional3,
      valor: infoPago.flt_total_con_iva,
      valor_letras: infoPago.str_opcional2,
      periodo_id: infoPago.str_opcional4 == "" ? null : infoPago.str_opcional4,
      //  archivo_id: null,
      cod_paquete: conceptos[0].codigo,
      categoria_pago_id: conceptos[0].categoria_id,
    };

    //guardar el detalle de la factura
    let resultSavePago = await guardarPagoyDetalle(tPago, tDetallePago);

    if (resultSavePago != false) {
      ret = {
        statusCode: 200,
        message: "Ejecucion correcta",
        error: false,
        pago_id: resultSavePago,
        data: JSON.parse(responseData),
      };

      return ret;
    } else {
      throw new Error("No se ha podido guardar el pago");
    }
  } catch (error) {
    ret = {
      statusCode: 500,
      message: error.message,
      error: true,
      det_error: error,
    };
    return ret;
  }
};

const updatePago = async (infoPago: any) => {
  console.log("ejecutamos la fucnion de update");
  let ret: any = {
    message: "Listo para actualizar",
    error: false,
    statusCode: 200,
  };
  return ret;
};
