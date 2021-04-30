import { response } from 'express';

var JsBarcode = require('jsbarcode');

var { createCanvas } = require("canvas");


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
//   /page/pagoinscripcion 
//=====================
export const viewConsultaPago = async (req: any, res = response) => {
    // Canvas v1
    var canvas = createCanvas();

    JsBarcode(canvas, "41500000000258548020000018131047390000000470009620191231");

    // const buffer = canvas.toBuffer('application/pdf')
    // fs.writeFileSync('./image.pdf', buffer)

// //convert your PDF to a Blob and save to file
// canvas.stream.on('finish', function () {
//     var blob = canvas.stream.toBlob('application/pdf');
//    // saveAs(blob, 'example.pdf', true);
//     fs.writeFileSync('./image.pdf', blob)
// });
// canvas.end();



const xmlSerializer = new XMLSerializer();
const document = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null);
const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    JsBarcode(svgNode, '415;0000000025854;8020;000018131047;3900;0000047000;96;20191231', {
        xmlDocument: document,
    });

const svgText = xmlSerializer.serializeToString(svgNode);




    fs.writeFile(__dirname + '/example.svg', svgText, function () {
        console.log('wrote it');
    });

    let codigo = req.params.codigo;
    let data: any = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    data.CODIGO_PAGO = codigo;
    res.render("estado_pago", data);

};