import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

export const subirArchivo = (files: any, extensionesValidas = ['png', 'jpg', 'jpeg', 'gif', 'pdf'], carpeta = '') => {

    return new Promise((resolve, reject) => {

        const { archivo } = files;
        const nombreCortado = archivo.name.split('.');
        const extension = nombreCortado[nombreCortado.length - 1];

        // Validar la extension
        if (!extensionesValidas.includes(extension)) {
            return reject({
                message: `La extensión ${extension} no es permitida - ${extensionesValidas}`
            });
        }

        const nombreTemp = uuidv4() + '.' + extension;
        const uploadPath = path.join(__dirname, '../uploads/', carpeta);

        // if (!fs.existsSync(uploadPath)) {
        //     fs.mkdirSync(uploadPath);
        // }
        const uploadpathFull = path.join(uploadPath, nombreTemp);

        archivo.mv(uploadpathFull, (err: any) => {
            if (err) {
                reject(err);
            }

            resolve([nombreTemp,extension,archivo.size,uploadpathFull]);
        });

    });

}
