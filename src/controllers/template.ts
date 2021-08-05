import { response } from 'express';
import { createQR, generarHTMLPDF, generarHTMLPDFNew } from '../helpers/global';
import stream from 'stream';
import path from 'path';
import { getDescuentoFactura, getFactura, getPagoFactura } from '../provider/pago_provider';
import * as moneda from 'currency-formatter';

import { format } from 'date-format-parse';
const exphbs = require('express-hbs');


import QRCode from 'qrcode';
import { consultarTercero } from '../provider/sys_apolo/tercero_provider';
import { getDataDetalleFacturaById } from './factura';
import { sendReciboPagoByID } from './mail';



const fs = require('fs');
const { DOMImplementation, XMLSerializer } = require('xmldom');


//====================
//   /page/inicio 
//=====================
export const vistaHolaMundo = async (req: any, res: any) => {

    // try {
    //     let result = await consultarTercero();
    //     res.json(result);

    // } catch (error) {
    //     res.render("hola_mundo");
    // }

    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    let body = req.body;
    let idFactura = req.params.ref;

    try {

        let exphbs = require('express-hbs');

        const hbs = fs.readFileSync('./views/pdf_recibo_pago.hbs', 'utf8');
        console.log(hbs);


        let template = exphbs.handlebars.compile(hbs);


        let factura = await getDataDetalleFacturaById(707);

        data.factura = factura;
        data.fecha_actual = format(new Date(), 'DD-MM-YYYY hh:mm:ss A');
        //data.fecha_actual = nDate;
        data.urlService = `${process.env.BASE_URL.toString()}/page/DescargarReciboPago/${factura.id}`;

        let resultHTML = template(data);





        console.log(resultHTML);

        let pdf = await generarHTMLPDFNew(resultHTML);
        let resMail = sendReciboPagoByID(factura.cliente, pdf, factura.categoria, factura.id);

        console.log(resMail);

        // res.send(pdf);

        let fileName: string = `${factura.cliente.ide_persona}_${factura.id}.pdf`;

        var readStream = new stream.PassThrough();
        readStream.end(pdf);

        res.set('Content-disposition', 'attachment; filename=' + fileName.toString());
        res.contentType("application/pdf");
        //   res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        console.log("Iniciando descarga");

        readStream.pipe(res);


    } catch (error) {
        console.log(error);
    }








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
//   /page/DescargarReciboPago/:ref
//=====================
export const pdfReciboPago = async (req: any, res = response) => {
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    let body = req.body;
    let idFactura = req.params.ref;

    try {
        //enviar recibo de pago al correo electronico
        complileTemplateReciboPago(idFactura);

        let factura = await getDataDetalleFacturaById(idFactura);

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



//crea un recibo de pago en pdf y lo envia al correo
export const complileTemplateReciboPago = async (id_factura: any) => {
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();

    try {
        //leer el contenido del archivo para despues ser compilado
        const hbs = fs.readFileSync('./views/pdf_recibo_pago.hbs', 'utf8');
        let template = exphbs.handlebars.compile(hbs);






        let factura = await getDataDetalleFacturaById(id_factura);
        //creamos la data que lleva la plantilla, o contendio dinamico
        data.factura = factura;
        data.fecha_actual = format(new Date(), 'DD-MM-YYYY hh:mm:ss A');
        data.urlService = `${process.env.BASE_URL.toString()}/page/DescargarReciboPago/${factura.id}`;


        await new Promise((resolve, reject) => {
            QRCode.toDataURL(data.urlService, { errorCorrectionLevel: "L" }, (err: any, src: any) => {
                if (err) {
                    data.scrQR = '';
                } else {
                    data.scrQR = src;
                }
                resolve(true);
            });
        });
        //pasamos la data
        let resultHTML = template(data);
        //comvertimos la plantilla html a pdf
        let pdf = await generarHTMLPDFNew(resultHTML);
        //enviamos el PDF al correo del cliente
        let resMail = sendReciboPagoByID(factura.cliente, pdf, factura.categoria, factura.id);


    } catch (error) {
        console.log(error);
    }

}
