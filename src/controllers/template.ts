import { response } from 'express';
import { generarHTMLPDF, generarHTMLPDFNew } from '../helpers/global';
import stream from 'stream';
import path from 'path';



const fs = require('fs');
const { DOMImplementation, XMLSerializer } = require('xmldom');


//====================
//   /page/inicio 
//=====================
export const vistaHolaMundo = async (req: any, res = response) => {


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