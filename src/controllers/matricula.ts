import { getInfoMatricula, getDetPeriodo, getDataDescuentosByCodigo, getCargaDescuentos, verificaCargueFacturado, eliminaDescuentosCargue, getDiscountImportReferences, getExistingDiscountImportRows, insertDiscountImportRows } from "../provider/matricula_provider";
import { getConfigPeriodo, getPaquete, getPaqueteByProgramName, getDescuento, getCategriaDescuento, getCategoriaPorcentajeByMatricula, existePago, getFactura, getPagoFactura, getFacturaByMatricula, getPagoFacturaByFacturaIds } from "../provider/pago_provider";
import { parse, format } from 'date-format-parse';
import * as moneda from 'currency-formatter';
import xlsx from 'node-xlsx';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import stream from 'stream';
import { IDetalleFactura } from "../interfaces/facturas.interface";
import { calcularSubTotal } from "../helpers/factura.util";
import { IStudentType } from "../interfaces/clientes.interface";
import fetch from "node-fetch";
import moment from 'moment';
import {
    FULL_TUITION_DISCOUNT_CONCEPT_IDS,
    TUITION_DISCOUNT_CONCEPT_IDS,
    clampDiscountRate,
    deduplicateDiscountsByCategory,
    filterDiscountsForEnrollment,
    getDiscountableTuitionConceptIds,
    isGratuityDiscount,
    sumDiscountRateWithCap,
    toNumber,
} from "../helpers/discountEligibility.util";

const getFinancieroApiUrl = (): string => {
    const baseUrl = (process.env.FINANCIERO_API_URL || "").trim();
    if (baseUrl.length > 0) {
        return baseUrl.replace(/\/+$/, "");
    }

    return "";
};

const getStudentTypeUrl = (): string => {
    const financieroApiUrl = getFinancieroApiUrl();
    if (financieroApiUrl.length > 0) {
        return `${financieroApiUrl}/invoice/studenttype`;
    }

    return (process.env.URL_GET_DATE || "").trim();
};

const INSCRIPTION_PACKAGE_TECHNOLOGY = 6;
const INSCRIPTION_PACKAGE_SPECIALIZATION = 34;
// col_nivel_educacion.cod_nivel_edu: 11 = programas de especializacion.
const SPECIALIZATION_LEVEL_CODES = new Set([11]);
// fin_porcetaje_categoria._id: 2 = votacion, 15 = egresado, 16 = COOTEP.
const SPECIALIZATION_ALLOWED_DISCOUNT_CATEGORY_IDS = new Set([2, 15, 16]);
// fin_detalle_paquete.concepto_id: 52 = Talento Humano, 64 = Gestion Ambiental.
const SPECIALIZATION_TUITION_CONCEPT_IDS = new Set([52, 64]);

type ProfileLogger = <T>(label: string, task: () => Promise<T>) => Promise<T>;

const createProfileLogger = (enabled: boolean, scope: string): ProfileLogger => {
    const entries: Array<{ label: string; ms: number }> = [];
    const profile = async <T>(label: string, task: () => Promise<T>): Promise<T> => {
        if (!enabled) {
            return task();
        }

        const start = Date.now();
        try {
            return await task();
        } finally {
            const ms = Date.now() - start;
            entries.push({ label, ms });
            console.log(`[profile:${scope}] ${label}: ${ms}ms`);
            console.log(`[perf] ${label} ${ms}ms`);
        }
    };

    (profile as any).entries = entries;
    return profile;
};

const logProfileSummary = (profile: ProfileLogger, totalMs: number) => {
    const entries = ((profile as any).entries || []) as Array<{ label: string; ms: number }>;
    entries
        .slice()
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 10)
        .forEach((entry, index) => {
            const pct = totalMs > 0 ? ((entry.ms * 100) / totalMs).toFixed(1) : "0.0";
            console.log(`[perf] TOP ${index + 1} ${entry.label} ${entry.ms}ms ${pct}%`);
        });
    console.log(`[perf] TOTAL REQUEST ${totalMs}ms`);
};

class UploadValidationError extends Error { }

class UploadRowsValidationError extends Error {
    statusCode = 422;
    payload: any;

    constructor(message: string, payload: any) {
        super(message);
        this.payload = payload;
    }
}

class PackageConfigurationError extends Error {
    statusCode = 422;
}

export const validateSpecializationPackageResult = (packageResult: any) => {
    if (!packageResult || packageResult.packageCount !== 1) {
        throw new PackageConfigurationError("No existe una configuración financiera única para el programa académico de la matrícula. Verifique la parametrización programa-paquete.");
    }

    if (!Array.isArray(packageResult.details) || packageResult.details.length === 0) {
        throw new PackageConfigurationError("No existe una configuración financiera única para el programa académico de la matrícula. Verifique la parametrización programa-paquete.");
    }

    return packageResult.details;
};

const obtenerBufferArchivoCargado = (archivo: any): Buffer => {
    if (!archivo) {
        throw new UploadValidationError("No se recibió archivo.");
    }

    if (archivo.data && archivo.data.length > 0) {
        console.log("[CargaPlantillaDescuento] lectura desde memoria");
        return Buffer.from(archivo.data);
    }

    if (archivo.tempFilePath && fs.existsSync(archivo.tempFilePath)) {
        console.log("[CargaPlantillaDescuento] lectura desde tempFilePath");
        return fs.readFileSync(archivo.tempFilePath);
    }

    console.error("[CargaPlantillaDescuento] error leyendo archivo", {
        tieneData: Boolean(archivo.data),
        dataLength: archivo.data?.length || 0,
        tieneTempFilePath: Boolean(archivo.tempFilePath),
        tempFilePathExiste: archivo.tempFilePath ? fs.existsSync(archivo.tempFilePath) : false,
    });
    throw new UploadValidationError("El archivo fue recibido, pero no se pudo leer desde memoria ni desde ruta temporal.");
};

const calculateSubtotalWithDiscountCap = (
    unitValue: any,
    quantity: any,
    increaseRate: any,
    discountRate: any,
): number => {
    const subtotal = toNumber(unitValue) * toNumber(quantity);
    const increase = toNumber(increaseRate);
    const discount = clampDiscountRate(discountRate);
    const total = (subtotal + (subtotal * increase)) - (subtotal * discount);

    // Defensive floor: billing totals must never be negative.
    return total < 0 ? 0 : total;
};

const traceDiscounts = (label: string, discounts: any[]) => {
    if (process.env.DISCOUNT_TRACE !== 'true') {
        return;
    }

    console.log(`[DISCOUNT-TRACE] ${label}=${JSON.stringify((discounts || []).map((discount) => ({
        discountId: discount?._id,
        categoryId: discount?.porcentaje_categoria_id,
        description: discount?.descripcion,
        status: discount?.estado || discount?.porcentaje_estado_id,
        rate: discount?.porcentaje,
        isGratuity: isGratuityDiscount(discount),
    })))}`);
};

const traceConceptDiscount = (concept: any) => {
    if (process.env.DISCOUNT_TRACE !== 'true') {
        return;
    }

    const quantity = toNumber(concept?.cantidad);
    const unitValue = toNumber(concept?.valor_unidad);
    const discountRate = clampDiscountRate(concept?.descuento);
    const originalSubtotal = quantity * unitValue;
    const discountAmount = originalSubtotal * discountRate;
    console.log(`[DISCOUNT-TRACE] concept=${JSON.stringify({
        conceptId: concept?.concepto_id,
        quantity,
        unitValue,
        originalSubtotal,
        discountRate,
        discountAmount,
        finalSubtotal: Math.max(originalSubtotal - discountAmount, 0),
        reason: discountRate > 0 ? 'DISCOUNT_APPLIED' : 'CONCEPT_NOT_DISCOUNTABLE_OR_NO_APPROVED_RATE',
    })}`);
};

const DISCOUNT_IMPORT_HEADERS = [
    "CODIGO CARGUE",
    "CONFIGURACION",
    "ESTADO PORCENTAJE",
    "NRO IDENTIFICACION",
    "COD MATRICULA",
    "CATEGORIA PORCENTAJE",
    "VALOR PORCENTAJE",
    "ID PERIODO",
    "OBSERVACION",
    "ACCION",
    "TIPO",
];

const toCellText = (value: any): string => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
};

const toIntegerCell = (value: any): number | null => {
    const text = toCellText(value);
    if (!/^\d+$/.test(text)) {
        return null;
    }

    return Number(text);
};

const toOptionalIntegerCell = (value: any): number | null => {
    const text = toCellText(value);
    if (text.length === 0) {
        return null;
    }

    return toIntegerCell(text);
};

const toDiscountRateCell = (value: any): number | null => {
    const text = toCellText(value).replace(",", ".");
    if (text.length === 0) {
        return null;
    }

    const numberValue = Number(text);
    if (!Number.isFinite(numberValue)) {
        return null;
    }

    return numberValue;
};

const isEmptyExcelRow = (row: any[]): boolean => {
    return !row || row.every((cell: any) => toCellText(cell).length === 0);
};

const buildImportKey = (row: {
    estudiante_id: string;
    matricula_id: number | null;
    porcentaje_categoria_id: number;
    periodo_id: number;
}): string => {
    return [
        row.estudiante_id,
        row.matricula_id === null ? "NULL" : row.matricula_id,
        row.porcentaje_categoria_id,
        row.periodo_id,
    ].join("|");
};

const buildStudentName = (student: any): string => {
    return [student?.ape1_persona, student?.ape2_persona, student?.nom1_persona, student?.nom2_persona]
        .filter((part: any) => toCellText(part).length > 0)
        .join(" ")
        .trim();
};

const DISCOUNT_REJECTION_DIR = path.join(process.cwd(), "storage", "discount-import-rejections");
const DISCOUNT_REJECTION_CODE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ensureDiscountRejectionDir = () => {
    fs.mkdirSync(DISCOUNT_REJECTION_DIR, { recursive: true });
};

const extractImportErrorData = (data: any = {}) => ({
    codigoCarga: toCellText(data.codigo_cargue),
    enrollmentId: data.matricula_id === undefined || data.matricula_id === null ? "" : data.matricula_id,
    categoryId: data.porcentaje_categoria_id === undefined || data.porcentaje_categoria_id === null ? "" : data.porcentaje_categoria_id,
    percentage: data.porcentaje === undefined || data.porcentaje === null ? "" : data.porcentaje,
    periodId: data.periodo_id === undefined || data.periodo_id === null ? "" : data.periodo_id,
    processedAt: toCellText(data.fecha),
});

const createImportError = (row: number, studentId: string, code: string, reason: string, studentName: string = "", data: any = {}) => ({
    row,
    studentId,
    studentName,
    code,
    reason,
    ...extractImportErrorData(data),
});

export const buildRejectionReasonSummary = (errors: any[]) => {
    const summary = new Map<string, { code: string; reason: string; count: number }>();

    errors.forEach((errorItem: any) => {
        const code = toCellText(errorItem.code) || "UNKNOWN_ERROR";
        const reason = toCellText(errorItem.reason) || "Motivo no especificado.";
        const key = `${code}|${reason}`;
        const current = summary.get(key) || { code, reason, count: 0 };
        current.count += 1;
        summary.set(key, current);
    });

    return Array.from(summary.values()).sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
};

export const buildRejectionReportBuffer = (report: {
    codigoCarga: string;
    fechaProcesamiento: string;
    totalRows: number;
    inserted: number;
    skipped: number;
    duplicates: number;
    errors: any[];
}) => {
    const reasonSummary = buildRejectionReasonSummary(report.errors);
    const rejectedRows = [
        [
            "CODIGO CARGA",
            "FILA ORIGINAL",
            "NRO IDENTIFICACION",
            "NOMBRE COMPLETO",
            "COD MATRICULA",
            "CATEGORIA DESCUENTO",
            "PORCENTAJE",
            "PERIODO",
            "CODIGO ERROR",
            "MOTIVO RECHAZO",
            "FECHA PROCESAMIENTO",
        ],
        ...report.errors.map((errorItem: any) => [
            errorItem.codigoCarga || report.codigoCarga,
            errorItem.row,
            errorItem.studentId,
            errorItem.studentName || "",
            errorItem.enrollmentId || "",
            errorItem.categoryId || "",
            errorItem.percentage === undefined ? "" : errorItem.percentage,
            errorItem.periodId || "",
            errorItem.code,
            errorItem.reason,
            errorItem.processedAt || report.fechaProcesamiento,
        ]),
    ];
    const summaryRows = [
        ["Campo", "Valor"],
        ["Código de carga", report.codigoCarga],
        ["Fecha de procesamiento", report.fechaProcesamiento],
        ["Total procesados", report.totalRows],
        ["Total cargados", report.inserted],
        ["Total rechazados", report.skipped],
        ["Total duplicados", report.duplicates],
        [],
        ["Código error", "Motivo de rechazo", "Cantidad"],
        ...reasonSummary.map((item) => [item.code, item.reason, item.count]),
    ];

    return Buffer.from(xlsx.build([
        { name: "Rechazados", data: rejectedRows },
        { name: "Resumen", data: summaryRows },
    ], {
        "!cols": [
            { wch: 38 },
            { wch: 14 },
            { wch: 18 },
            { wch: 40 },
            { wch: 16 },
            { wch: 20 },
            { wch: 12 },
            { wch: 12 },
            { wch: 26 },
            { wch: 70 },
            { wch: 22 },
        ],
    }) as any);
};

const getDiscountRejectionReportPaths = (codigoCarga: string) => {
    if (!DISCOUNT_REJECTION_CODE_PATTERN.test(codigoCarga)) {
        throw new UploadValidationError("Código de carga inválido.");
    }

    return {
        xlsxPath: path.join(DISCOUNT_REJECTION_DIR, `${codigoCarga}.xlsx`),
        metaPath: path.join(DISCOUNT_REJECTION_DIR, `${codigoCarga}.json`),
    };
};

const saveDiscountRejectionReport = (report: {
    codigoCarga: string;
    fechaProcesamiento: string;
    totalRows: number;
    inserted: number;
    skipped: number;
    duplicates: number;
    errors: any[];
}) => {
    if (report.errors.length === 0) {
        return null;
    }

    ensureDiscountRejectionDir();
    const reportPaths = getDiscountRejectionReportPaths(report.codigoCarga);
    const reasonSummary = buildRejectionReasonSummary(report.errors);
    fs.writeFileSync(reportPaths.xlsxPath, buildRejectionReportBuffer(report));
    fs.writeFileSync(reportPaths.metaPath, JSON.stringify({
        codigo_cargue: report.codigoCarga,
        fecha: report.fechaProcesamiento,
        totalRows: report.totalRows,
        inserted: report.inserted,
        skipped: report.skipped,
        duplicates: report.duplicates,
        rejectionReasons: reasonSummary,
        reportFile: path.basename(reportPaths.xlsxPath),
    }, null, 2));

    return {
        hasRejectedReport: true,
        rejectedReportUrl: `/matricula/DescargarRechazadosDescuento/${report.codigoCarga}`,
        rejectionReasons: reasonSummary,
    };
};

const readDiscountRejectionMetadata = (codigoCarga: string) => {
    try {
        const reportPaths = getDiscountRejectionReportPaths(codigoCarga);
        if (!fs.existsSync(reportPaths.metaPath) || !fs.existsSync(reportPaths.xlsxPath)) {
            return null;
        }

        return JSON.parse(fs.readFileSync(reportPaths.metaPath, "utf8"));
    } catch (error) {
        return null;
    }
};

const listDiscountRejectionMetadata = () => {
    if (!fs.existsSync(DISCOUNT_REJECTION_DIR)) {
        return [];
    }

    return fs.readdirSync(DISCOUNT_REJECTION_DIR)
        .filter((fileName) => fileName.endsWith(".json"))
        .map((fileName) => readDiscountRejectionMetadata(path.basename(fileName, ".json")))
        .filter(Boolean);
};

const sanitizeDbErrorMessage = (error: any): string => {
    if (error?.code === "ER_NO_REFERENCED_ROW_2") {
        return "La fila referencia un registro relacionado que no existe.";
    }

    if (error?.code === "ER_DUP_ENTRY") {
        return "La fila genera un registro duplicado.";
    }

    return "No fue posible insertar la fila por un error de base de datos.";
};

const normalizeDiscountImportRows = (worksheetRows: any[][], codigoCargue: string, fechaActual: string) => {
    const headers = (worksheetRows[0] || []).slice(0, DISCOUNT_IMPORT_HEADERS.length).map((header: any) => toCellText(header));
    const headersMatch = DISCOUNT_IMPORT_HEADERS.every((header, index) => headers[index] === header);
    if (!headersMatch) {
        throw new UploadValidationError(`Encabezados inválidos. La plantilla debe contener: ${DISCOUNT_IMPORT_HEADERS.join(", ")}`);
    }

    const validShapeRows: any[] = [];
    const errors: any[] = [];

    worksheetRows.slice(1).forEach((row: any[], index: number) => {
        const excelRow = index + 2;
        if (isEmptyExcelRow(row)) {
            return;
        }

        const configId = toOptionalIntegerCell(row[1]);
        const statusId = toIntegerCell(row[2]);
        const studentId = toCellText(row[3]);
        const enrollmentId = toOptionalIntegerCell(row[4]);
        const categoryId = toIntegerCell(row[5]);
        const discountRate = toDiscountRateCell(row[6]);
        const periodId = toIntegerCell(row[7]);
        const action = toCellText(row[9]);
        const type = toCellText(row[10]);
        const rowErrors: any[] = [];
        const rawData = {
            codigo_cargue: toCellText(row[0]) || codigoCargue,
            config_id: configId,
            porcentaje_estado_id: statusId,
            estudiante_id: studentId,
            matricula_id: enrollmentId,
            porcentaje_categoria_id: categoryId,
            porcentaje: discountRate,
            periodo_id: periodId,
            observacion: toCellText(row[8]) || null,
            accion: action,
            tipo: type,
            fecha: fechaActual,
        };

        if (row[1] !== undefined && row[1] !== null && toCellText(row[1]).length > 0 && configId === null) {
            rowErrors.push(createImportError(excelRow, studentId, "INVALID_CONFIG", "La configuración debe ser numérica.", "", rawData));
        }
        if (statusId === null) {
            rowErrors.push(createImportError(excelRow, studentId, "INVALID_STATUS", "El estado de porcentaje es obligatorio y debe ser numérico.", "", rawData));
        }
        if (!/^\d+$/.test(studentId)) {
            rowErrors.push(createImportError(excelRow, studentId, "INVALID_STUDENT_ID", "La identificación del estudiante es obligatoria y debe contener solo números.", "", rawData));
        }
        if (row[4] !== undefined && row[4] !== null && toCellText(row[4]).length > 0 && enrollmentId === null) {
            rowErrors.push(createImportError(excelRow, studentId, "INVALID_ENROLLMENT", "La matrícula debe ser numérica cuando se diligencia.", "", rawData));
        }
        if (categoryId === null) {
            rowErrors.push(createImportError(excelRow, studentId, "INVALID_CATEGORY", "La categoría de descuento es obligatoria y debe ser numérica.", "", rawData));
        }
        if (discountRate === null || discountRate < 0 || discountRate > 1) {
            rowErrors.push(createImportError(excelRow, studentId, "INVALID_PERCENTAGE", "El porcentaje debe ser numérico y estar entre 0 y 1.", "", rawData));
        }
        if (periodId === null) {
            rowErrors.push(createImportError(excelRow, studentId, "INVALID_PERIOD", "El periodo es obligatorio y debe ser numérico.", "", rawData));
        }
        if (!/^[01]$/.test(action)) {
            rowErrors.push(createImportError(excelRow, studentId, "INVALID_ACTION", "La acción es obligatoria y debe ser 0 o 1.", "", rawData));
        }
        if (!/^[01]$/.test(type)) {
            rowErrors.push(createImportError(excelRow, studentId, "INVALID_TYPE", "El tipo es obligatorio y debe ser 0 o 1.", "", rawData));
        }

        if (rowErrors.length > 0) {
            errors.push(...rowErrors);
            return;
        }

        validShapeRows.push({
            row: excelRow,
            data: {
                ...rawData,
                porcentaje_estado_id: statusId as number,
                porcentaje_categoria_id: categoryId as number,
                porcentaje: discountRate as number,
                periodo_id: periodId as number,
            },
        });
    });

    return { validShapeRows, errors };
};

const normalizeLevelName = (value: any): string => {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
};

const isSpecializationEnrollment = (enrollment: any): boolean => {
    return SPECIALIZATION_LEVEL_CODES.has(Number(enrollment?.cod_nivel_edu));
};

const hasRequiredSameFiniteNumber = (currentValue: any, discountValue: any): boolean => {
    const current = Number(currentValue);
    const discount = Number(discountValue);
    return Number.isFinite(current) && current > 0 && Number.isFinite(discount) && discount > 0 && current === discount;
};

const isApprovedDiscount = (discount: any): boolean => {
    const statusId = Number(discount?.porcentaje_estado_id ?? discount?.porcentajeEstadoId);
    if (Number.isFinite(statusId) && statusId > 0) {
        return statusId === 2;
    }

    const status = String(discount?.estado || discount?.status || '').trim().toUpperCase();
    return status === 'APROBADO';
};

const isSpecializationOrdinaryDiscount = (discount: any): boolean => {
    return Number(discount?.accion) === 1
        && SPECIALIZATION_ALLOWED_DISCOUNT_CATEGORY_IDS.has(Number(discount?.porcentaje_categoria_id ?? discount?.porcentajeCategoriaId))
        && !isGratuityDiscount(discount)
        && isApprovedDiscount(discount);
};

export const isSpecializationDiscountForCurrentEnrollment = (discount: any, enrollment: any): boolean => {
    return isApprovedDiscount(discount)
        && hasRequiredSameFiniteNumber(enrollment?.cod_matricula, discount?.matricula_id ?? discount?.matriculaId)
        && hasRequiredSameFiniteNumber(enrollment?.cod_periodo, discount?.periodo_id ?? discount?.periodoId)
        && hasRequiredSameFiniteNumber(enrollment?.ide_persona, discount?.estudiante_id ?? discount?.estudianteId)
        && hasRequiredSameFiniteNumber(1, discount?.categoria_pago_id ?? discount?.categoriaPagoId);
};

export const filterDiscountsForCurrentEnrollment = (discounts: any[], enrollment: any): any[] => {
    const filteredDiscounts = filterDiscountsForEnrollment(discounts, enrollment);

    if (!isSpecializationEnrollment(enrollment)) {
        return filteredDiscounts.filter((discount) => isApprovedDiscount(discount));
    }

    return filteredDiscounts.filter((discount) => isSpecializationDiscountForCurrentEnrollment(discount, enrollment));
};

const isSpecializationTuitionConcept = (concept: any): boolean => {
    return SPECIALIZATION_TUITION_CONCEPT_IDS.has(Number(concept?.concepto_id));
};

export const canApplyTuitionDiscount = (
    enrollment: any,
    concept: any,
    discount: any,
    conceptIds: number[],
): boolean => {
    if (isSpecializationEnrollment(enrollment)) {
        return isSpecializationOrdinaryDiscount(discount) && isSpecializationTuitionConcept(concept);
    }

    return concept?.descuento_ext == '1'
        && Number(discount?.accion) === 1
        && getDiscountableTuitionConceptIds(discount, conceptIds).includes(concept?.concepto_id);
};

const canApplyIncrease = (
    concept: any,
    discount: any,
    conceptIds: number[],
): boolean => {
    if (concept?.descuento_ext != '1' || Number(discount?.accion) === 1) {
        return false;
    }

    if (Number(discount?.tipo) === 1) {
        return true;
    }

    return conceptIds.includes(Number(concept?.concepto_id));
};

const resolveSpecializationPackage = async (
    enrollment: any,
    profile: ProfileLogger,
) => {
    const packageResult = await profile(
        "getPaqueteByProgramName",
        () => getPaqueteByProgramName(enrollment?.nom_nivel_educativo),
    );

    return validateSpecializationPackageResult(packageResult);
};

export const resolverCodigoPaqueteInscripcion = (matricula: any, packageParam?: any): number => {
    const packageCode = Number(packageParam);
    if (Number.isFinite(packageCode) && packageCode > 0) {
        return packageCode;
    }

    const nivel = normalizeLevelName(matricula?.nom_nivel_educativo);
    if (nivel.includes("ESPECIALIZ")) {
        return INSCRIPTION_PACKAGE_SPECIALIZATION;
    }

    if (nivel.includes("TECNOLOG")) {
        return INSCRIPTION_PACKAGE_TECHNOLOGY;
    }

    if (SPECIALIZATION_LEVEL_CODES.has(Number(matricula?.cod_nivel_edu))) {
        return INSCRIPTION_PACKAGE_SPECIALIZATION;
    }

    return INSCRIPTION_PACKAGE_TECHNOLOGY;
};

//====================
//   /matricula/generarpagoinscripcion 
//=====================
export const consultarPagoInscripcion = async (req: any, res: any) => {
    let resultDB: any;
    let resultPaquete: any;
    let total = 0;
    let total_a_pagar = 0;
    let total_con_descuento = 0;
    let total_sin_descuento = 0;
    let porcentaje_descuento = 0;
    let porcentaje_aumento = 0;
    let descripcionFactura = "";
    let auxDescripcion = "";
    let precios: any;
    let periodo: any;
    let id_matricula = req.params.id_matricula.trim();

    try {
        let result = await getInfoMatricula(id_matricula);
        console.log(result);

        resultDB = result[0][0];

        if (result[0].length > 0) {

            const paqueteInscripcion = resolverCodigoPaqueteInscripcion(resultDB, req.query.package);

            resultPaquete = await getPaquete(paqueteInscripcion);
            if (!resultPaquete || resultPaquete.length < 1) {
                throw new Error("No se encontraron precios configurados");
            }
            //consular los descuentos y multas que un estudiante tiene asignados
            let resultDto = await getDescuento(resultPaquete[0].categoria_id, resultDB.cod_periodo, resultDB.ide_persona);
            resultDto.forEach((row: any) => {
                //si aplica descuento sino aplica aumento, si es 1 añade un descuento
                if (row.accion == 1) {
                    porcentaje_descuento = porcentaje_descuento + row.porcentaje;
                    auxDescripcion = auxDescripcion + " + DESCUENTO " + (row.porcentaje * 100) + "% " + row.observacion
                } else {
                    porcentaje_aumento = porcentaje_aumento + row.porcentaje;
                    auxDescripcion = auxDescripcion + " + AUMENTO " + (row.porcentaje * 100) + "% " + row.observacion
                }
            });

            resultPaquete.forEach((element: any, index: number) => {

                //calcula el total sin descuento
                if (element.cantidad > 0) {
                    total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
                } else {
                    total = element.subtotal * Number(resultDB.nro_creditos);
                    total_a_pagar = total_a_pagar + total;
                }
                total_sin_descuento = total_a_pagar;



            });


        } else {
            throw new Error("No se encontró la inscripción");
        }


        // let estadoPago = await existePago('6', id_matricula);



        //verifica si ya existe una factura creada con esa matricula y con ese paquete

        let pagoFactura: any = [];
        const paqueteInscripcion = resolverCodigoPaqueteInscripcion(resultDB, req.query.package);
        let resFactura = await getFacturaByMatricula(id_matricula, paqueteInscripcion.toString());
        //si encuentra factura creada verifica si tiene pagos
        if (resFactura.length > 0) {
            pagoFactura = await getPagoFactura(resFactura[0]._id);

            //si encuentra pagos exitosos
            if (pagoFactura.length > 0) {


                pagoFactura.forEach((pago: any) => {
                    pago.fecha = format(pago.fecha, 'DD-MM-YYYY hh:mm:ss A');
                });

                //actualizamos los conceptos de la factura a mostrar
                resultPaquete.forEach((con: any) => {

                    resFactura.forEach((fact: any) => {

                        if (con.concepto_id == fact.concepto_id) {
                            con.cantidad = fact.cantidad;
                            con.descuento = fact.descuento;
                            con.valor_unidad = fact.valor_unidad;
                            con.aumento = fact.aumento;
                        }

                    });

                });

                //actualizamos el total a pagar
                total_a_pagar = 0;
                resultPaquete.forEach((element: any, index: number) => {
                    let subtotal = (element.valor_unidad * element.cantidad);
                    resultPaquete[index].subtotal = (subtotal + (subtotal * element.aumento)) - (subtotal * element.descuento)
                    total_a_pagar = element.subtotal + total_a_pagar;
                });

            }



        }




        return res.status(200).json({
            error: false,
            message: "Ejecución correcta",
            estadopago: pagoFactura,
            matricula: resultDB,
            detalle_factura: resultPaquete,
            total_a_pagar: moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim(),
            total_general: moneda.format(total_sin_descuento, { locale: 'es-CO' }).replace('$', '').trim(),
            total_a_pagar_int: moneda.unformat(moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim(), { locale: 'es-CO' })
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }
}



export const consultarpagoMatricula = async (id_matricula: any, profile: ProfileLogger = createProfileLogger(false, "matricula")) => {
    let fechaActual = format(new Date(), 'YYYY-MM-DD');
    //let token = req.body.token;
    let resultDB: any;
    let descuentos = [];
    let aumentos = [];
    let resultPaquete: any;
    let total = 0;
    let total_a_pagar = 0;
    let total_con_descuento = 0;
    let total_sin_descuento = 0;
    let porcentaje_descuento = 0;
    let porcentaje_aumento = 0;
    let descripcionFactura = "";
    let auxDescripcion = "";
    let precios: any;
    let periodo: any;
    id_matricula = id_matricula.trim();
    let resultDescuentos: any = [];
    try {
        let result = await profile("getInfoMatricula", () => getInfoMatricula(id_matricula));
        if (result[0].length > 0) {
            resultDB = result[0][0];
            const resultConfigPromise = profile("getConfigPeriodo", () => getConfigPeriodo());
            const resultDtoPromise = profile("getDescuento", () => getDescuento("1", resultDB.cod_periodo, resultDB.ide_persona, id_matricula));

            // TODO: para consultar las fechas de matriculas 
            // periodo = await getDetPeriodo(resultDB.cod_colegio, resultDB.cod_periodo, fechaActual);

           const studentTypeUrl = getStudentTypeUrl();
           const response = await profile("getStudentType.fetch", () => fetch(`${studentTypeUrl}?matriculaId=${id_matricula}`));
           const studentType: IStudentType =  await profile("getStudentType.parseJson", () => response.json());
           const currenDate =  new Date();

           const momentCurrent = moment().utcOffset(-5);

           const momentDb = moment(studentType.fechaFinMatricula)
             .utcOffset(-5)
             .set({ hour: 23, minute: 59, second: 59 });

           if (
            momentCurrent > momentDb && studentType.fechaFinMatricula !=null
          ) {
            periodo = false;
          }else{
            periodo =  studentType;
          }


          



            //consular los descuentos y multas que un estudiante tiene asignados
            const [resultConfig, resultDtoRaw] = await Promise.all([resultConfigPromise, resultDtoPromise]);
            const invoiceMode = resultDB.nro_creditos <= resultConfig.min_creditos && resultDB.nro_creditos > 0
                ? 'INDIVIDUAL_CREDIT_PAYMENT'
                : 'FULL_ENROLLMENT_PAYMENT';
            if (process.env.DISCOUNT_TRACE === 'true') {
                console.log(`[DISCOUNT-TRACE] enrollment=${id_matricula}`);
                console.log(`[DISCOUNT-TRACE] credits=${resultDB.nro_creditos}`);
                console.log(`[DISCOUNT-TRACE] invoiceMode=${invoiceMode}`);
                console.log(`[DISCOUNT-TRACE] academicLevelCode=${resultDB.cod_nivel_edu}`);
            }
            traceDiscounts('discountsBeforeFilter', resultDtoRaw);
            const resultDto = deduplicateDiscountsByCategory(filterDiscountsForCurrentEnrollment(resultDtoRaw, resultDB));
            traceDiscounts('discountsAfterFilter', resultDto);


            resultDto.forEach((row: any) => {
                //si aplica descuento sino aplica aumento, si es 1 añade un descuento
                if (row.accion == 1) {
                    const discountRate = clampDiscountRate(row.porcentaje);
                    let registro = {
                        'id': row._id,
                        'descripcion': row.descripcion,
                        'descuento': (discountRate * 100)
                    };
                    resultDescuentos.push(registro);

                    // Business rule: never allow effective discount over 100%.
                    porcentaje_descuento = sumDiscountRateWithCap(porcentaje_descuento, discountRate);
                    let desc = (row.observacion == null) ? row.descripcion + " " : row.observacion;
                    auxDescripcion = `+ DESCUENTO ${(discountRate * 100)}% ${desc}`;
                } else {
                    porcentaje_aumento = porcentaje_aumento + row.porcentaje;
                    let desc = (row.observacion == null) ? row.descripcion + " " : row.observacion;
                    auxDescripcion = `+ DESCUENTO ${(row.porcentaje * 100)}% ${desc}`;
                }
            });

            //configurar deacuerdo a la configuracion del periodo
            if (resultDB.nro_creditos <= resultConfig.min_creditos && resultDB.nro_creditos > 0) {

                //se debe cobrar por credito individual
                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(1));
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(4));
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(5));
                }else if(resultDB.cod_nivel_edu == 11){
                    resultPaquete = await resolveSpecializationPackage(resultDB, profile);
                }




                // resultPaquete = await getPaquete( 1);


                if (resultPaquete != false && resultPaquete !=undefined) {

                    descripcionFactura = " " + resultPaquete[0].paquete + " + " + auxDescripcion

                    precios = resultPaquete;
                    //recorrer los detalles de paquete
                    precios.forEach((element: any, index: number) => {


                        resultDto.forEach((row: any) => {
                            if (row.accion == 1) {
                                if (row.tipo == 1 && !isSpecializationEnrollment(resultDB) && element.descuento_ext == '1') {
                                    precios[index].descuento = sumDiscountRateWithCap(precios[index].descuento, row.porcentaje);
                                } else if (canApplyTuitionDiscount(resultDB, precios[index], row, TUITION_DISCOUNT_CONCEPT_IDS)) {
                                    precios[index].descuento = sumDiscountRateWithCap(precios[index].descuento, row.porcentaje);
                                }
                            } else if (canApplyIncrease(precios[index], row, [5, 6, 7, 52])) {
                                precios[index].aumento = precios[index].aumento + row.porcentaje;
                            }
                        });





                            //añade aumento para matricula extraordinaria
                            if (periodo == false) {
                                precios[index].aumento = precios[index].aumento = resultConfig.porcentaje_ext;

                                if (resultConfig.porcentaje_ext != 0 && index == 0) {
                                    descripcionFactura = descripcionFactura + "+ AUMENTO 20% MATRICULA EXTRAORDINARIA";
                                }

                            }
                            let totaAPagar = 0;
                            if (element.cantidad > 0) {
                                totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            } else {
                                precios[index].cantidad = resultDB.nro_creditos;
                                //  precios[index].descuento = porcentaje_descuento;
                                precios[index].aumento = porcentaje_aumento + precios[index].aumento;
                                porcentaje_descuento = 0;
                                porcentaje_aumento = 0;
                                total = element.subtotal * Number(resultDB.nro_creditos);
                                totaAPagar = totaAPagar + total;
                            }
                        total_con_descuento = totaAPagar - (totaAPagar * porcentaje_descuento);


                        //calcula el total sin descuento
                        if (element.cantidad > 0) {
                            total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
                        } else {
                            total = element.subtotal * Number(resultDB.nro_creditos);
                            total_a_pagar = total_a_pagar + total;
                        }
                        total_sin_descuento = total_a_pagar;

                    });


                    //volvemos a recorrer para calcular totales
                    total_a_pagar = 0;
                    precios.forEach((element: any, index: number) => {
                        precios[index].paquete = descripcionFactura;
                        precios[index].descuento = clampDiscountRate(precios[index].descuento);
                        precios[index].subtotal = calculateSubtotalWithDiscountCap(
                            element.valor_unidad,
                            element.cantidad,
                            element.aumento,
                            element.descuento,
                        );
                        traceConceptDiscount(precios[index]);
                        total_a_pagar = element.subtotal + total_a_pagar;
                    });


                } else {
                    throw new Error("No se encontraron precios configurados");
                }




            } else {
                //se cobra el valor total de la matricula
                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(2));
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(3));
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(5));
                }else if(resultDB.cod_nivel_edu == 11){
                    resultPaquete = await resolveSpecializationPackage(resultDB, profile);
                }

                if (resultPaquete != false && resultPaquete !=undefined) {


                    descripcionFactura = "" + resultPaquete[0].paquete + auxDescripcion

                    precios = resultPaquete;
                    //recorrer los detalles de paquete
                    precios.forEach((element: any, index: number) => {


                        resultDto.forEach((row: any) => {
                            if (row.accion == 1) {
                                if (row.tipo == 1 && !isSpecializationEnrollment(resultDB) && element.descuento_ext == '1') {
                                    precios[index].descuento = sumDiscountRateWithCap(precios[index].descuento, row.porcentaje);
                                } else if (canApplyTuitionDiscount(resultDB, precios[index], row, FULL_TUITION_DISCOUNT_CONCEPT_IDS)) {
                                    precios[index].descuento = sumDiscountRateWithCap(precios[index].descuento, row.porcentaje);
                                }
                            } else if (canApplyIncrease(precios[index], row, [5, 6, 7, 1, 2, 52])) {
                                precios[index].aumento = precios[index].aumento + row.porcentaje;
                            }
                        });



                            //añade aumento para matricula extraordinaria
                            if (periodo == false) {
                                let auxDes = descripcionFactura;
                                precios[index].aumento = precios[index].aumento + resultConfig.porcentaje_ext;
                                if (resultConfig.porcentaje_ext != 0 && index == 0) {
                                    descripcionFactura = descripcionFactura + "+ AUMENTO 20% MATRICULA EXTRAORDINARIA";
                                }


                            }

                            let totaAPagar = 0;
                            totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            // precios[index].descuento = porcentaje_descuento; tener en cuenta


                            total_con_descuento = totaAPagar - (totaAPagar * porcentaje_descuento);

                        //calcula el total sin descuento
                        if (element.cantidad > 0) {
                            total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
                        } else {
                            total = element.subtotal * Number(resultDB.nro_creditos);
                            total_a_pagar = total_a_pagar + total;
                        }
                        total_sin_descuento = total_a_pagar;

                    });




                } else {
                    throw new Error("No se encontraron precios configurados");
                }

                //RECORREMOS PARA APLICAR LOS DESCUENTOS EN ORDEN ASCENDENTE
                /*  resultPaquete.forEach((element_fac: any) => {
  
                      if(element_fac.descuento_ext=='1'){
                          let auxSubtotal =  (element_fac.cantidad * element_fac.valor_unidad) +  ((element_fac.cantidad * element_fac.valor_unidad) * element_fac.aumento);
                          let subtotal = 0;
                          resultDescuentos.forEach((element_desc: any, index: number) => {
                              auxSubtotal =  auxSubtotal -  (auxSubtotal * (element_desc.descuento/100));
                          });
                          element_fac.subtotal = auxSubtotal;
                          console.log(element_fac);
                      }
  
                  });
                  */

                //volvemos a recorrer para calcular totales
                total_a_pagar = 0;
                precios.forEach((element: any, index: number) => {
                    precios[index].paquete = descripcionFactura;
                    precios[index].descuento = clampDiscountRate(precios[index].descuento);
                    precios[index].subtotal = calculateSubtotalWithDiscountCap(
                        element.valor_unidad,
                        element.cantidad,
                        element.aumento,
                        element.descuento,
                    );
                    total_a_pagar = element.subtotal + total_a_pagar;
                });



                // console.log(resultPaquete);

            }


            //verifica si ya existe una factura creada con esa matricula y con ese paquete
            // let estadoPago = await existePago(resultPaquete[0].codigo, id_matricula);
            const pagoFactura: any[] = [];
            const resFactura: any[] = await profile("getFacturaByMatricula", () => getFacturaByMatricula(id_matricula, resultPaquete[0].codigo));
            const facturaIds = Array.from(new Set(resFactura.map((factura) => factura._id)));
            pagoFactura.push(...await profile("getPagoFacturaByFacturaIds", () => getPagoFacturaByFacturaIds(facturaIds)));



            //si encuentra factura creada verifica si tiene pagos
            if (resFactura.length > 0) {

                //si encuentra pagos exitosos
                if (pagoFactura.length > 0) {


                    pagoFactura.forEach((pago: any) => {
                        pago.fecha = format(pago.fecha, 'DD-MM-YYYY hh:mm:ss A');
                    });

                    //actualizamos los conceptos de la factura a mostrar
                    resultPaquete.forEach((con: any) => {

                        resFactura.forEach((fact: any) => {

                            if (con.concepto_id == fact.concepto_id) {
                                con.cantidad = fact.cantidad;
                                con.descuento = clampDiscountRate(fact.descuento);
                                con.valor_unidad = fact.valor_unidad;
                                con.aumento = fact.aumento;
                            }

                        });

                    });

                    //actualizamos el total a pagar
                    total_a_pagar = 0;
                    resultPaquete.forEach((element: any, index: number) => {
                        resultPaquete[index].descuento = clampDiscountRate(resultPaquete[index].descuento);
                        resultPaquete[index].subtotal = calculateSubtotalWithDiscountCap(
                            element.valor_unidad,
                            element.cantidad,
                            element.aumento,
                            element.descuento,
                        );
                        total_a_pagar = element.subtotal + total_a_pagar;
                    });

                }



            }
            // Defensive guard: never expose payable totals below zero.
            // This protects payment flows even if upstream data is inconsistent.
            const safeTotalToPay = Math.max(toNumber(total_a_pagar), 0);

            const soportes = deduplicateDiscountsByCategory(filterDiscountsForEnrollment(
                await profile("getCategoriaPorcentajeByMatricula", () => getCategoriaPorcentajeByMatricula('1', resultDB.ide_persona, resultDB.cod_periodo, id_matricula)),
                resultDB,
            ));

            return {
                error: false,
                message: "Ejecución correcta",
                matricula: resultDB,
                estadopago: pagoFactura,
                soportes,
                descuentos: resultDescuentos,
                detalle_factura: resultPaquete,
                total_a_pagar: moneda.format(safeTotalToPay, { locale: 'es-CO' }).replace('$', '').trim(),
                total_general: moneda.format(total_sin_descuento, { locale: 'es-CO' }).replace('$', '').trim(),
                total_a_pagar_int: moneda.unformat(moneda.format(safeTotalToPay, { locale: 'es-CO' }).replace('$', '').trim(), { locale: 'es-CO' })

            };

        } else {
            throw new Error("No se encontró matricula académica");
        }


    } catch (error) {
        throw new Error(error.message);
    }

}




//====================
//   /matricula/generarpagomatricula 
//=====================
export const generarpagoMatricula = async (req: any, res: any) => {
    const startedAt = Date.now();
    const idMatricula = req.params.id_matricula?.trim();
    const endpoint = `/api/matricula/generarpagomatricula/${idMatricula}`;
    console.log(`[perf:rest-sgd] GET ${endpoint} start params=${JSON.stringify(req.params)} query=${JSON.stringify(req.query)}`);

    try {
        const enableProfile = true;
        const profile = createProfileLogger(enableProfile, `pagomatricula:${idMatricula}`);
        const [result, categorias]: any[] = await Promise.all([
            profile("consultarpagoMatricula", () => consultarpagoMatricula(idMatricula, profile)),
            profile("getCategriaDescuento", () => getCategriaDescuento(1)),
        ]);

        result.categorias = categorias;
        logProfileSummary(profile, Date.now() - startedAt);
        console.log(`[perf:rest-sgd] GET ${endpoint} total ${Date.now() - startedAt}ms`);
        console.log(`[perf] GET ${endpoint} fin ${Date.now() - startedAt}ms`);
        return res.status(200).json(result);

    } catch (error) {
        console.log(`[perf] GET ${endpoint} fin ${Date.now() - startedAt}ms`);
        console.log(`[perf:rest-sgd] GET ${endpoint} failed ${Date.now() - startedAt}ms error=${error?.message}`);
        return res.status(error?.statusCode || 500).json({
            error: true,
            message: error.message
        });
    }

}



//====================
//   /matricula/generarpagomatricula 
//=====================
export const generarpagoMatricula2 = async (req: any, res: any) => {
    let fechaActual = format(new Date(), 'YYYY-MM-DD');
    let token = req.body.token;
    let resultDB: any;
    let resultPaquete: any;
    let total = 0;
    let total_a_pagar = 0;
    let total_con_descuento = 0;
    let total_sin_descuento = 0;
    let porcentaje_descuento = 0;
    let precios: any;
    let periodo: any;
    let id_matricula = req.params.id_matricula.trim();
    try {
        let result = await getInfoMatricula(id_matricula);
        console.log(result[0]);
        if (result[0].length > 0) {
            resultDB = result[0][0];
            let resultConfig = await getConfigPeriodo();
            //para consultar las fechas de matriculas 
            periodo = await getDetPeriodo(resultDB.cod_colegio, resultDB.cod_periodo, fechaActual);

            //consular los descuentos que un estudiante tiene asignados
            let resultDto = await getDescuento(1, resultDB.cod_periodo, resultDB.ide_persona);
            resultDto.forEach((row: any) => {
                porcentaje_descuento = porcentaje_descuento + row.porcentaje;
            });


            //configurar deacuerdo a la configuracion del periodo
            if (resultDB.nro_creditos <= resultConfig.min_creditos) {

                //se debe cobrar por credito individual
                console.log("Se cobra por creditos");

                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await getPaquete(1);
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await getPaquete(4);
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await getPaquete(5);
                }else if(resultDB.cod_nivel_edu == 11){
                    resultPaquete = await resolveSpecializationPackage(resultDB, createProfileLogger(false, "matricula"));
                }


                // resultPaquete = await getPaquete( 1);


                if (resultPaquete != false) {

                    precios = resultPaquete;
                    //recorrer los detalles de paquete
                    precios.forEach((element: any, index: number) => {


                        //si se puede aplicar descuento externo
                        if (element.descuento_ext == '1') {

                            if (periodo == false) {
                                precios[index].aumento = resultConfig.porcentaje_ext;
                            }


                            let totaAPagar = 0;
                            if (element.cantidad > 0) {
                                totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            } else {
                                precios[index].cantidad = resultDB.nro_creditos;
                                precios[index].descuento = porcentaje_descuento;
                                porcentaje_descuento = 0;
                                total = element.subtotal * Number(resultDB.nro_creditos);
                                totaAPagar = totaAPagar + total;
                            }
                            total_con_descuento = totaAPagar - (totaAPagar * porcentaje_descuento);

                        } else {
                            let totaAPagar = 0;
                            if (element.cantidad > 0) {
                                totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            } else {
                                total = element.subtotal * Number(resultDB.nro_creditos);
                                totaAPagar = totaAPagar + total;
                                precios[index].cantidad = resultDB.nro_creditos;
                            }
                            total_sin_descuento = totaAPagar;
                        }

                        //calcula el total sin descuento
                        if (element.cantidad > 0) {
                            total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
                        } else {
                            total = element.subtotal * Number(resultDB.nro_creditos);
                            total_a_pagar = total_a_pagar + total;
                        }
                        total_sin_descuento = total_a_pagar;

                    });


                    //volvemos a recorrer para calcular totales
                    total_a_pagar = 0;
                    precios.forEach((element: IDetalleFactura, index: number) => {
                        const subtotal = calcularSubTotal(element);
                        total_a_pagar =  total_a_pagar+ subtotal;
                    });





                } else {
                    throw new Error("No se encontraron precios configurados");
                }




            } else {
                //se cobra el valor total de la matricula
                console.log("Se cobra matricula completa");

                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await getPaquete(2);
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await getPaquete(3);
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await getPaquete(5);
                }else if(resultDB.cod_nivel_edu == 11){
                    resultPaquete = await resolveSpecializationPackage(resultDB, createProfileLogger(false, "matricula"));
                }

                if (resultPaquete != false) {



                    precios = resultPaquete;
                    //recorrer los detalles de paquete
                    precios.forEach((element: any, index: number) => {


                        //si se puede aplicar descuento externo
                        if (element.descuento_ext == '1') {

                            //añade aumento para matricula extraordinaria
                            if (periodo == false) {
                                precios[index].aumento = resultConfig.porcentaje_ext;
                            }

                            let totaAPagar = 0;
                            totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            precios[index].descuento = porcentaje_descuento;


                            total_con_descuento = totaAPagar - (totaAPagar * porcentaje_descuento);

                        } else {
                            let totaAPagar = 0;
                            totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            total_sin_descuento = totaAPagar;
                        }

                        //calcula el total sin descuento
                        if (element.cantidad > 0) {
                            total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
                        } else {
                            total = element.subtotal * Number(resultDB.nro_creditos);
                            total_a_pagar = total_a_pagar + total;
                        }
                        total_sin_descuento = total_a_pagar;

                    });

                    //volvemos a recorrer para calcular totales
                    total_a_pagar = 0;
                    precios.forEach((element: IDetalleFactura, index: number) => {
                        const subtotal =calcularSubTotal(element);
                        total_a_pagar = subtotal + total_a_pagar;
                    });


                } else {
                    throw new Error("No se encontraron precios configurados");
                }




            }


            return res.status(200).json({
                error: false,
                message: "Ejecución correcta",
                categorias: await getCategriaDescuento(1),
                matricula: resultDB,
                detalle_factura: resultPaquete,
                total_a_pagar: moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim(),
                total_general: moneda.format(total_sin_descuento, { locale: 'es-CO' }).replace('$', '').trim(),
                total_a_pagar_int: moneda.unformat(moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim(), { locale: 'es-CO' })


            });

        } else {
            throw new Error("No se encontró la matricula académica");
        }


    } catch (error) {
        return res.status(error?.statusCode || 500).json({
            error: true,
            message: error.message
        });
    }



}


//====================
//   /matricula/CargaPlantillaDescuento 
//=====================
export const cargaPlantillaDescuento = async (req: any, res: any) => {

    let body = req.body;

    try {

        if (!req.files) {
            throw new UploadValidationError("No se ha seleccionado un archivo");
        }

        if (!req.files.archivo) {
            throw new UploadValidationError("No se recibió el campo de archivo esperado");
        }

        const archivo = Array.isArray(req.files.archivo) ? req.files.archivo[0] : req.files.archivo;
        const extension = path.extname(archivo.name || "").toLowerCase();

        console.log("[CargaPlantillaDescuento] archivo recibido", {
            nombre: archivo.name,
            extension,
            size: archivo.size,
            tieneData: Boolean(archivo.data && archivo.data.length > 0),
            tieneTempFilePath: Boolean(archivo.tempFilePath),
        });

        if (![".xlsx", ".xls"].includes(extension)) {
            throw new UploadValidationError("Formato de archivo no permitido. Cargue un archivo .xlsx o .xls");
        }

        if (!archivo.size || archivo.size <= 0) {
            throw new UploadValidationError("El archivo recibido está vacío");
        }

        const fileBuffer = obtenerBufferArchivoCargado(archivo);
        if (!fileBuffer.length) {
            throw new UploadValidationError("El archivo recibido está vacío");
        }

        let workSheetsFromBuffer: any[];
        try {
            workSheetsFromBuffer = xlsx.parse(fileBuffer as any);
        } catch (parseError) {
            console.error("[CargaPlantillaDescuento] error leyendo contenido Excel", {
                message: parseError.message,
            });
            throw new UploadValidationError("No se pudo leer la plantilla. Verifique que sea un archivo Excel válido.");
        }

        if (!workSheetsFromBuffer[0] || !workSheetsFromBuffer[0].data) {
            throw new UploadValidationError("La plantilla no contiene hojas válidas para procesar.");
        }

        const primeraHoja = workSheetsFromBuffer[0].data;
        const codigo_Cargue = uuidv4();
        const fechaActual = format(new Date(), 'YYYY-MM-DD HH:mm:ss');
        const { validShapeRows, errors } = normalizeDiscountImportRows(primeraHoja, codigo_Cargue, fechaActual);
        const totalRows = primeraHoja.slice(1).filter((row: any[]) => !isEmptyExcelRow(row)).length;

        if (totalRows === 0) {
            throw new UploadValidationError("La plantilla no contiene filas para procesar.");
        }

        const unique = (values: any[]) => Array.from(new Set(values.filter((value: any) => value !== undefined && value !== null && toCellText(value).length > 0)));
        const references = await getDiscountImportReferences({
            configIds: unique(validShapeRows.map((row: any) => row.data.config_id)),
            statusIds: unique(validShapeRows.map((row: any) => row.data.porcentaje_estado_id)),
            studentIds: unique(validShapeRows.map((row: any) => row.data.estudiante_id)),
            enrollmentIds: unique(validShapeRows.map((row: any) => row.data.matricula_id)),
            categoryIds: unique(validShapeRows.map((row: any) => row.data.porcentaje_categoria_id)),
            periodIds: unique(validShapeRows.map((row: any) => row.data.periodo_id)),
        });

        const configIds = new Set(references.configs.map((item: any) => String(item._id)));
        const statusIds = new Set(references.statuses.map((item: any) => String(item._id)));
        const studentMap = new Map(references.students.map((item: any) => [String(item.ide_persona), item]));
        const enrollmentMap = new Map(references.enrollments.map((item: any) => [String(item.cod_matricula), String(item.ide_estudiante)]));
        const categoryIds = new Set(references.categories.map((item: any) => String(item._id)));
        const periodIds = new Set(references.periods.map((item: any) => String(item.cod_periodo)));
        const existingRows = await getExistingDiscountImportRows({
            studentIds: unique(validShapeRows.map((row: any) => row.data.estudiante_id)),
            periodIds: unique(validShapeRows.map((row: any) => row.data.periodo_id)),
            categoryIds: unique(validShapeRows.map((row: any) => row.data.porcentaje_categoria_id)),
        });
        const existingKeys = new Set(existingRows.map((row: any) => buildImportKey({
            estudiante_id: String(row.estudiante_id),
            matricula_id: row.matricula_id === undefined ? null : row.matricula_id,
            porcentaje_categoria_id: row.porcentaje_categoria_id,
            periodo_id: row.periodo_id,
        })));
        const excelKeys = new Map<string, number>();
        const rowsToInsert: any[] = [];

        for (const row of validShapeRows) {
            const student = studentMap.get(row.data.estudiante_id);
            const studentName = buildStudentName(student);
            const rowErrors: any[] = [];

            if (row.data.config_id !== null && !configIds.has(String(row.data.config_id))) {
                rowErrors.push(createImportError(row.row, row.data.estudiante_id, "CONFIG_NOT_FOUND", "La configuración indicada no existe.", studentName, row.data));
            }
            if (!statusIds.has(String(row.data.porcentaje_estado_id))) {
                rowErrors.push(createImportError(row.row, row.data.estudiante_id, "STATUS_NOT_FOUND", "El estado de porcentaje indicado no existe.", studentName, row.data));
            }
            if (!student) {
                rowErrors.push(createImportError(row.row, row.data.estudiante_id, "STUDENT_NOT_FOUND", "El estudiante no existe en la base de datos.", "", row.data));
            }
            if (row.data.matricula_id !== null) {
                const enrollmentOwner = enrollmentMap.get(String(row.data.matricula_id));
                if (!enrollmentOwner) {
                    rowErrors.push(createImportError(row.row, row.data.estudiante_id, "ENROLLMENT_NOT_FOUND", "La matrícula indicada no existe.", studentName, row.data));
                } else if (enrollmentOwner !== row.data.estudiante_id) {
                    rowErrors.push(createImportError(row.row, row.data.estudiante_id, "ENROLLMENT_STUDENT_MISMATCH", "La matrícula indicada no corresponde al estudiante.", studentName, row.data));
                }
            }
            if (!categoryIds.has(String(row.data.porcentaje_categoria_id))) {
                rowErrors.push(createImportError(row.row, row.data.estudiante_id, "CATEGORY_NOT_FOUND", "La categoría de descuento indicada no existe.", studentName, row.data));
            }
            if (!periodIds.has(String(row.data.periodo_id))) {
                rowErrors.push(createImportError(row.row, row.data.estudiante_id, "PERIOD_NOT_FOUND", "El periodo indicado no existe.", studentName, row.data));
            }

            const importKey = buildImportKey(row.data);
            if (excelKeys.has(importKey)) {
                rowErrors.push(createImportError(row.row, row.data.estudiante_id, "DUPLICATE_IN_FILE", `La fila duplica la fila ${excelKeys.get(importKey)} del mismo archivo.`, studentName, row.data));
            }
            if (existingKeys.has(importKey)) {
                rowErrors.push(createImportError(row.row, row.data.estudiante_id, "DUPLICATE_IN_DATABASE", "Ya existe un descuento equivalente registrado en la base de datos.", studentName, row.data));
            }

            if (rowErrors.length > 0) {
                errors.push(...rowErrors);
                continue;
            }

            excelKeys.set(importKey, row.row);
            rowsToInsert.push(row);
        }

        const insertResult = rowsToInsert.length > 0 ? await insertDiscountImportRows(rowsToInsert) : { inserted: [], failed: [] };
        const dbErrors = insertResult.failed.map((item: any) => {
            console.error("[CargaPlantillaDescuento] error insertando fila", {
                row: item.row.row,
                code: item.error?.code,
                constraint: item.error?.constraint,
            });
            return createImportError(
                item.row.row,
                item.row.data.estudiante_id,
                item.error?.code || "DB_INSERT_ERROR",
                sanitizeDbErrorMessage(item.error),
                "",
                item.row.data,
            );
        });
        errors.push(...dbErrors);

        const inserted = insertResult.inserted.length;
        const duplicates = errors.filter((errorItem: any) => ["DUPLICATE_IN_FILE", "DUPLICATE_IN_DATABASE"].includes(errorItem.code)).length;
        const skipped = totalRows - inserted;
        const status = inserted === totalRows ? "success" : inserted > 0 ? "partial" : "failed";
        const rejectionReasons = buildRejectionReasonSummary(errors);
        const rejectedReport = saveDiscountRejectionReport({
            codigoCarga: codigo_Cargue,
            fechaProcesamiento: fechaActual,
            totalRows,
            inserted,
            skipped,
            duplicates,
            errors,
        });
        const responsePayload = {
            error: status === "failed",
            status,
            message: status === "success"
                ? `Cargado exitosamente, se han afectado ${inserted} registros`
                : status === "partial"
                    ? `El archivo fue procesado parcialmente. Cargados: ${inserted} de ${totalRows}. Rechazados: ${skipped}.`
                    : "No fue posible cargar descuentos de la plantilla. Revise el reporte de errores.",
            summary: {
                totalRows,
                inserted,
                skipped,
                duplicates,
                rejectionReasons,
            },
            errors,
            data: {
                codigo: codigo_Cargue,
                fecha: fechaActual,
                registros: inserted,
                totalRows,
                skipped,
                hasRejectedReport: Boolean(rejectedReport),
                rejectedReportUrl: rejectedReport?.rejectedReportUrl || null,
            }
        };

        if (status === "failed") {
            throw new UploadRowsValidationError(responsePayload.message, responsePayload);
        }

        return res.status(200).json(responsePayload);


    } catch (error) {
        console.error("[CargaPlantillaDescuento] error procesando archivo", {
            message: error.message,
            stack: error.stack,
        });

        if (error instanceof UploadValidationError) {
            return res.status(400).json({
                error: true,
                status: "failed",
                message: error.message
            });
        }

        if (error instanceof UploadRowsValidationError) {
            return res.status(error.statusCode).json(error.payload);
        }

        return res.status(500).json({
            error: true,
            message: "Ocurrió un error al procesar la plantilla de descuentos"
        });

    }

}

//====================
//   /matricula/ListaCargueDescuento
//=====================
export const listaCargueDescuento = async (req: any, res: any) => {
    try {

        let resultDB = await getCargaDescuentos();
        const reportMetadata = listDiscountRejectionMetadata();
        const reportByCode = new Map(reportMetadata.map((item: any) => [item.codigo_cargue, item]));
        const loadedCodes = new Set(resultDB.map((item: any) => item.codigo_cargue));

        resultDB = resultDB.map((item: any) => {
            const report = reportByCode.get(item.codigo_cargue) as any;
            return {
                ...item,
                total_procesados: report?.totalRows || item.numero,
                total_cargados: item.numero,
                total_rechazados: report?.skipped || 0,
                total_duplicados: report?.duplicates || 0,
                rejectionReasons: report?.rejectionReasons || [],
                hasRejectedReport: Boolean(report && report.skipped > 0),
            };
        });

        reportMetadata.forEach((report: any) => {
            if (!loadedCodes.has(report.codigo_cargue)) {
                resultDB.push({
                    codigo_cargue: report.codigo_cargue,
                    fecha: report.fecha,
                    numero: report.inserted || 0,
                    total_procesados: report.totalRows || 0,
                    total_cargados: report.inserted || 0,
                    total_rechazados: report.skipped || 0,
                    total_duplicados: report.duplicates || 0,
                    rejectionReasons: report.rejectionReasons || [],
                    hasRejectedReport: Boolean(report.skipped > 0),
                });
            }
        });

        return res.status(200).json({
            error: false,
            data: resultDB
        });


    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }

}
//====================
//   /matricula/eliminarCargueDescuento
//=====================
export const eliminarCargueDescuento = async (req: any, res: any) => {
    let codigoFile = req.params.codigo.trim();
    try {

        //si encuentra registros significa que alguno ya se uso en una factura
        let resultDB = await verificaCargueFacturado(codigoFile);

        if (resultDB.length > 0) {
            return res.status(200).json({
                error: true,
                message: "Algunos descuentos del archivo que se intenta eliminar ya fueron facturados "
            });
        }

        resultDB = await eliminaDescuentosCargue(codigoFile);

        if (!resultDB) {
            throw new Error("Error al eliminar el archivo");
        }

        const reportPaths = getDiscountRejectionReportPaths(codigoFile);
        [reportPaths.xlsxPath, reportPaths.metaPath].forEach((filePath) => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        return res.status(200).json({
            error: false,
            message: "Archivo eliminado "
        });



    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }

}


//====================
//   /matricula/DescargarRechazadosDescuento/:codigo
//=====================
export const descargarRechazadosDescuento = async (req: any, res: any) => {
    const codigoFile = toCellText(req.params.codigo);

    try {
        const reportPaths = getDiscountRejectionReportPaths(codigoFile);
        const metadata = readDiscountRejectionMetadata(codigoFile);

        if (!metadata) {
            const cargaDB = await getDataDescuentosByCodigo(codigoFile);
            if (cargaDB.length > 0) {
                return res.status(404).json({
                    error: true,
                    message: "La carga no tiene registros rechazados para descargar."
                });
            }

            return res.status(404).json({
                error: true,
                message: "No se encontró una carga asociada al código solicitado."
            });
        }

        if (!fs.existsSync(reportPaths.xlsxPath)) {
            return res.status(404).json({
                error: true,
                message: "La carga no tiene registros rechazados para descargar."
            });
        }

        const fileName = `Rechazados_${codigoFile}.xlsx`;
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("X-Content-Type-Options", "nosniff");

        return fs.createReadStream(reportPaths.xlsxPath).pipe(res);
    } catch (error) {
        if (error instanceof UploadValidationError) {
            return res.status(400).json({
                error: true,
                message: error.message,
            });
        }

        console.error("[DescargarRechazadosDescuento] error", { message: error.message });
        return res.status(500).json({
            error: true,
            message: "No fue posible descargar el reporte de rechazados."
        });
    }
}


//====================
//   /matricula/descargarCargueDescuento 
//=====================
export const descargarCargueDescuento = async (req: any, res: any) => {
    let codigoFile = req.params.codigo.trim();

    let columns: any = [];
    let arrayData: any = [];
    try {
        console.log("consultando registros en DB");
        let resultDB = await getDataDescuentosByCodigo(codigoFile);
        console.log("Fin de la consulta");

        if (resultDB.length > 0) {
            console.log(Object.entries(resultDB[0]));
            for (const [key, value] of Object.entries(resultDB[0])) {
                columns.push(key);
            }
            arrayData.push(columns);

            resultDB.forEach((element: any) => {
                let row: any = [];
                for (const [key, value] of Object.entries(element)) {
                    row.push(value);
                }
                arrayData.push(row)
            });

            console.log("construyendo excel");
            const data = arrayData;
            const options = { '!cols': [{ wch: 6 }, { wch: 7 }, { wch: 10 }, { wch: 20 }] };
            var buffer = await xlsx.build([{ name: "Hoja 1", data: data }], options); // Returns a buffer
            console.log("buffer generado excel");

            // return res.download(buffer);
            let fileName: string = `Cargue_${codigoFile}.xlsx`;

            var readStream = new stream.PassThrough();
            readStream.end(buffer);

            res.set('Content-disposition', 'attachment; filename=' + fileName.toString());
            res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            console.log("Iniciando descarga");

            readStream.pipe(res);
            // return res.download(buffer);

        } else {
            res.send(`<h1>No se encontró el archivo solicitado</h1>`);
        }


    } catch (error) {
        console.log("Error al descargar");
        console.log(error);
        res.send(`<h1>Ocurrio un error: ${error.message}</h1>`);
    }


}
