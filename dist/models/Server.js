"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("../routes"));
const cron_job_1 = require("../helpers/cron_job");
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const path_1 = __importDefault(require("path"));
const node_cron_1 = __importDefault(require("node-cron"));
class Server {
    constructor() {
        this.app = express_1.default();
        this.port = process.env.PORT;
        this.dbConnection();
        this.middlewares();
        this.routes();
        this.config();
        this.cronJob();
    }
    cronJob() {
        return __awaiter(this, void 0, void 0, function* () {
            node_cron_1.default.schedule('*/15 * * * *', () => {
                cron_job_1.verificaPagosPendientes().then((result) => {
                    // console.log(result);
                });
            });
            node_cron_1.default.schedule('*/60 * * * *', () => {
                cron_job_1.verificaPagosPendientesEfectivo().then((result) => {
                    //console.log(result);
                });
            });
        });
    }
    middlewares() {
        //Cors
        this.app.use(cors_1.default());
        // parse application/x-www-form-urlencoded
        this.app.use(body_parser_1.default.urlencoded({ extended: false }));
        //body-parser-json
        this.app.use(body_parser_1.default.json());
        //File-upploads
        this.app.use(express_fileupload_1.default());
        //carpeta publica
        this.app.use('/api/static', express_1.default.static('public'));
    }
    dbConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            // try {
            //     console.log('Connection has been established successfully.');
            // } catch (error) {
            //     console.error('Unable to connect to the database:', error);
            // }
        });
    }
    listen() {
        this.app.listen(this.port, () => {
            console.log(`Escuchando en el puerto ${this.port}`);
        });
    }
    //RUTAS
    routes() {
        this.app.use('/api', routes_1.default);
    }
    config() {
        //handlebars
        this.app.set('views', path_1.default.join(__dirname, 'views'));
        this.app.set('view engine', 'hbs');
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map