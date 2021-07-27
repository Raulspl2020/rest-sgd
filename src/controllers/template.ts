import { response } from 'express';
import { createQR, generarHTMLPDF, generarHTMLPDFNew } from '../helpers/global';
import stream from 'stream';
import path from 'path';
import { getDescuentoFactura, getFactura, getPagoFactura } from '../provider/pago_provider';
import * as moneda from 'currency-formatter';

import { format } from 'date-format-parse';

import QRCode from 'qrcode';



const fs = require('fs');
const { DOMImplementation, XMLSerializer } = require('xmldom');


//====================
//   /page/inicio 
//=====================
export const vistaHolaMundo = async (req: any, res = response) => {
    var sql = require("mssql");


    // config for your database
    var config = {
        user: 'sys_software',
        password: 'sysLtda900',
        server: '10.10.13.6',
        database: 'sys_apolo'
    };

    const sqlConfig = {
        user: 'sys_software',
        password: 'sysLtda900',
        server: '10.10.13.6\\sqlexpress',
        database: 'sys_apolo',
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        },
        options: {
          encrypt: false, // for azure
          trustServerCertificate: false // change to true for local dev / self-signed certs
        }
      }
      

       try {
        // make sure that any items are correctly URL encoded in the connection string
        await sql.connect(sqlConfig)
        const result = await sql.query`select * from centro_costo;`
        console.dir(result)
       } catch (err) {
        console.log(err);
       }





    res.render("hola_mundo");

};


//====================
//   /page/PagoPersonalizado 
//=====================
export const pagoPersonalizado = async (req: any, res = response) => {
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    res.render("pago_general", data);

};
//====================
//   /page/pagoMatricula 
//=====================
export const pagoMatricula = async (req: any, res = response) => {
    let id_matricula = req.params.id_matricula;
    console.log(id_matricula);
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    data.ID_MATRICULA = id_matricula;
    res.render("pago_matricula", data);

};

//====================
//   /page/pagoinscripcion 
//=====================
export const pagoInscripcion = async (req: any, res = response) => {
    let id_matricula = req.params.id_matricula;
    console.log(id_matricula);
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    data.ID_MATRICULA = id_matricula;
    res.render("pago_inscripcion", data);

};



//====================
//   /page/GenerarPagoCodigoBarras 
//=====================
export const viewPDFPago = async (req: any, res = response) => {
    let codigo = req.params.codigo;
    res.render("pdf_pago_inscripcion");
}


//====================
//   /page/ConsultaEstadoPago 
//=====================
export const consultaEstadoPagoView = async (req: any, res = response) => {
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    res.render("consulta_pago", data);
}


//====================
//   /page/DetalleFactura/:ref/:tipo 
//=====================
export const pdfFacturaView = async (req: any, res = response) => {
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();

    res.render("pdf_factura", data, async (err: any, html: any) => {
        let pdf = await generarHTMLPDFNew(html);
        res.contentType("application/pdf");
        res.send(pdf);
    });

}

//====================
//   /page/DetalleFactura/:ref
//=====================
export const htmlFacturaView = async (req: any, res = response) => {
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    res.render("pdf_factura", data);
}


//====================
//   /page/admindescuento
//=====================
export const htmlAdminDescuentoView = async (req: any, res = response) => {
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    res.render("admin_descuentos", data);
}
//====================
//   /page/descargarplantilladesceunto
//=====================
export const descargarPlantillaDesceunto = async (req: any, res = response) => {
    const uploadPath = path.join(__dirname, '../../public/format/plantilla-descuentos.xlsx');
    return res.download(uploadPath);

}



//====================
//   /page/recibopago/:ref
//=====================
export const pdfReciboPago = async (req: any, res = response) => {
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    let body = req.body;
    let idFactura = req.params.ref;
    let factura: any = {};
    let det_factura: any = [];
    let total_a_pagar = 0;
    let cliente: any = {};

    try {

        let dataConceptos = await getFactura(idFactura);


        //si encuentra conceptos en la factura
        if (dataConceptos.length > 0) {

            for (const pago of dataConceptos) {
                pago.fecha = format(pago.fecha, 'DD-MM-YYYY hh:mm:ss A')

                factura = {
                    "id": pago._id,
                    "codigo": pago.codigo,
                    "descripcion": pago.desc_factura,
                    "categoria": pago.categoria,
                    "fecha": pago.fecha
                };
                let json_response = JSON.parse(pago.json_response);
                cliente = json_response.info_cliente;

                delete pago.json_response;


                let subtotal = (pago.valor_unidad - (pago.valor_unidad * pago.descuento) + (pago.valor_unidad * pago.aumento));
                total_a_pagar = total_a_pagar + subtotal;
                det_factura.push({

                    'concepto': (pago.cod_paquete == 0) ? pago.descripcion : pago.concepto,
                    'descuento': (pago.descuento * 100),
                    'aumento': pago.aumento,
                    'valor_unidad': moneda.format(pago.valor_unidad, { locale: 'es-CO' }).replace('$', '').trim(),
                    'cantidad': pago.cantidad,
                    'subtotal': moneda.format(subtotal, { locale: 'es-CO' }).replace('$', '').trim()
                });

            }

        }

        const nDate = new Date().toLocaleString('es-CO', {
            timeZone: 'America/Bogota'
          });
          
         // console.log(nDate);

        let dataPagos = await getPagoFactura(idFactura);
        for (const pago of dataPagos) {
            pago.fecha = format(pago.fecha, 'DD-MM-YYYY hh:mm:ss A');
            pago.nombre_banco = (pago.nombre_banco == null) ? "NO APLICA" : pago.nombre_banco;
            pago.codigo_transaccion = (pago.codigo_transaccion == null) ? "NO APLICA" : pago.codigo_transaccion;
            pago.ticketID = (pago.ticketID == null) ? "NO APLICA" : pago.ticketID;
            pago.numero_tarjeta = (pago.numero_tarjeta == null) ? "NO APLICA" : pago.numero_tarjeta;
            pago.franquicia = (pago.franquicia == null) ? "NO APLICA" : pago.franquicia;
            pago.cod_aprobacion = (pago.cod_aprobacion == null) ? "NO APLICA" : pago.cod_aprobacion;
            pago.num_recibido = (pago.num_recibido == null) ? "NO APLICA" : pago.num_recibido;
        }

        let dataDescuentos = await getDescuentoFactura(idFactura);
        for (const dsto of dataDescuentos) {
            dsto.fecha = format(dsto.fecha, 'DD-MM-YYYY');
            dsto.porcentaje = dsto.porcentaje * 100;
        }

        factura.det_factura = det_factura;
        factura.pagos = dataPagos;
        factura.descuentos = dataDescuentos;
        factura.cliente = cliente;
        factura.total_a_pagar_s = moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim();
        data.factura = factura;
        data.fecha_actual = format(new Date(), 'DD-MM-YYYY hh:mm:ss A');
        //data.fecha_actual = nDate;
        data.urlService = `${process.env.BASE_URL.toString()}/page/DescargarReciboPago/${factura.id}`;

        QRCode.toDataURL(data.urlService, { errorCorrectionLevel: "L" }, (err: any, src: any) => {
            if (err) res.send("Error occured");

            data.scrQR = src;

            res.render("pdf_recibo_pago", data, async (err: any, html: any) => {
                let pdf = await generarHTMLPDFNew(html);
                res.contentType("application/pdf");
                res.send(pdf);
            });

        });

    } catch (error) {
        res.send(error.message);
    }






}







//====================
//   /page/pagoinscripcion 
//=====================
export const viewConsultaPago = async (req: any, res = response) => {


    // const buffer = canvas.toBuffer('application/pdf')
    // fs.writeFileSync('./image.pdf', buffer)

    // //convert your PDF to a Blob and save to file
    // canvas.stream.on('finish', function () {
    //     var blob = canvas.stream.toBlob('application/pdf');
    //    // saveAs(blob, 'example.pdf', true);
    //     fs.writeFileSync('./image.pdf', blob)
    // });
    // canvas.end();




    let codigo = req.params.codigo;
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    data.CODIGO_PAGO = codigo;
    res.render("estado_pago", data);

};