const test = require('node:test');
const assert = require('node:assert/strict');

process.env.MYSQL_SGD_HOST = process.env.MYSQL_SGD_HOST || '127.0.0.1';
process.env.MYSQL_SGD_USER = process.env.MYSQL_SGD_USER || 'test';
process.env.MYSQL_SGD_PASS = process.env.MYSQL_SGD_PASS || 'test';
process.env.MYSQL_SGD_DATABASE = process.env.MYSQL_SGD_DATABASE || 'test';
process.env.MSSQL_DEV_SERVER = process.env.MSSQL_DEV_SERVER || '127.0.0.1';
process.env.MSSQL_DEV_USER = process.env.MSSQL_DEV_USER || 'test';
process.env.MSSQL_DEV_PASS = process.env.MSSQL_DEV_PASS || 'test';
process.env.MSSQL_DEV_DATABASE = process.env.MSSQL_DEV_DATABASE || 'test';
process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/test';

const {
  canApplyTuitionDiscount,
  filterDiscountsForCurrentEnrollment,
} = require('../dist/controllers/matricula');
const {
  FULL_TUITION_DISCOUNT_CONCEPT_IDS,
  TUITION_DISCOUNT_CONCEPT_IDS,
  deduplicateDiscountsByCategory,
  sumDiscountRateWithCap,
} = require('../dist/helpers/discountEligibility.util');

const specializationEnrollment = {
  cod_nivel_edu: 11,
  cod_matricula: 900001,
  cod_periodo: 202601,
  ide_persona: 123456,
};

const technologyEnrollment = {
  cod_nivel_edu: 6,
  cod_matricula: 900002,
  cod_periodo: 202601,
  ide_persona: 234567,
};

const professionalEnrollment = {
  cod_nivel_edu: 7,
  cod_matricula: 900003,
  cod_periodo: 202601,
  ide_persona: 345678,
};

const specializationConcept = { concepto_id: 64, descuento_ext: '0' };
const otherConcept = { concepto_id: 4, descuento_ext: '1' };

const discount = (overrides = {}) => ({
  _id: 1,
  accion: 1,
  tipo: 0,
  porcentaje: 0.1,
  porcentaje_categoria_id: 2,
  porcentaje_estado_id: 2,
  matricula_id: 900001,
  periodo_id: 202601,
  estudiante_id: 123456,
  categoria_pago_id: 1,
  descripcion: 'DESCUENTO DE VOTACION',
  ...overrides,
});

test('especializacion permite votacion, COOTEP y egresado', () => {
  assert.equal(canApplyTuitionDiscount(specializationEnrollment, specializationConcept, discount({ porcentaje_categoria_id: 2 }), FULL_TUITION_DISCOUNT_CONCEPT_IDS), true);
  assert.equal(canApplyTuitionDiscount(specializationEnrollment, specializationConcept, discount({ porcentaje_categoria_id: 16, porcentaje: 0.05 }), FULL_TUITION_DISCOUNT_CONCEPT_IDS), true);
  assert.equal(canApplyTuitionDiscount(specializationEnrollment, specializationConcept, discount({ porcentaje_categoria_id: 15, porcentaje: 0.15 }), FULL_TUITION_DISCOUNT_CONCEPT_IDS), true);
});

test('COOTEP mas votacion serializa 0.15 exacto', () => {
  const rate = [
    discount({ porcentaje_categoria_id: 16, porcentaje: 0.05 }),
    discount({ porcentaje_categoria_id: 2, porcentaje: 0.1 }),
  ].reduce((total, row) => sumDiscountRateWithCap(total, row.porcentaje), 0);

  assert.equal(rate, 0.15);
});

test('gratuidad se ignora para especializacion', () => {
  assert.equal(canApplyTuitionDiscount(
    specializationEnrollment,
    specializationConcept,
    discount({ porcentaje_categoria_id: 13, porcentaje: 1, descripcion: 'POLITICA DE GRATUIDAD' }),
    FULL_TUITION_DISCOUNT_CONCEPT_IDS,
  ), false);
});

test('especializacion exige matricula, periodo, estudiante, categoria y estado', () => {
  assert.equal(filterDiscountsForCurrentEnrollment([discount()], specializationEnrollment).length, 1);
  assert.equal(filterDiscountsForCurrentEnrollment([discount({ matricula_id: null })], specializationEnrollment).length, 0);
  assert.equal(filterDiscountsForCurrentEnrollment([discount({ periodo_id: null })], specializationEnrollment).length, 0);
  assert.equal(filterDiscountsForCurrentEnrollment([discount({ estudiante_id: null })], specializationEnrollment).length, 0);
  assert.equal(filterDiscountsForCurrentEnrollment([discount({ categoria_pago_id: null })], specializationEnrollment).length, 0);
  assert.equal(filterDiscountsForCurrentEnrollment([discount({ porcentaje_estado_id: null })], specializationEnrollment).length, 0);
});

test('especializacion rechaza matricula o periodo diferente', () => {
  assert.equal(filterDiscountsForCurrentEnrollment([discount({ matricula_id: 999999 })], specializationEnrollment).length, 0);
  assert.equal(filterDiscountsForCurrentEnrollment([discount({ periodo_id: 202501 })], specializationEnrollment).length, 0);
});

test('estado pendiente, rechazado, nulo y ausente no aplican', () => {
  assert.equal(filterDiscountsForCurrentEnrollment([discount({ porcentaje_estado_id: 1 })], specializationEnrollment).length, 0);
  assert.equal(filterDiscountsForCurrentEnrollment([discount({ porcentaje_estado_id: 3 })], specializationEnrollment).length, 0);
  assert.equal(filterDiscountsForCurrentEnrollment([discount({ porcentaje_estado_id: null })], specializationEnrollment).length, 0);
  const withoutStatus = discount();
  delete withoutStatus.porcentaje_estado_id;
  assert.equal(filterDiscountsForCurrentEnrollment([withoutStatus], specializationEnrollment).length, 0);
});

test('descuento duplicado conserva un solo registro por categoria', () => {
  const selected = deduplicateDiscountsByCategory(filterDiscountsForCurrentEnrollment([
    discount({ _id: 10, porcentaje_categoria_id: 16, porcentaje: 0.05, fecha: '2026-01-01T10:00:00.000Z' }),
    discount({ _id: 11, porcentaje_categoria_id: 16, porcentaje: 0.05, fecha: '2026-01-01T11:00:00.000Z' }),
  ], specializationEnrollment));

  assert.equal(selected.length, 1);
  assert.equal(selected[0]._id, 11);
});

test('concepto diferente de matricula no recibe descuento de especializacion', () => {
  assert.equal(canApplyTuitionDiscount(specializationEnrollment, otherConcept, discount(), FULL_TUITION_DISCOUNT_CONCEPT_IDS), false);
});

test('especializacion sin descuento conserva valor completo por ausencia de descuentos', () => {
  assert.equal(filterDiscountsForCurrentEnrollment([], specializationEnrollment).length, 0);
});

test('profesional y tecnologico conservan descuento aprobado de matricula', () => {
  assert.equal(canApplyTuitionDiscount(
    professionalEnrollment,
    { concepto_id: 6, descuento_ext: '1' },
    discount({ matricula_id: 900003, periodo_id: 202601, estudiante_id: 345678 }),
    FULL_TUITION_DISCOUNT_CONCEPT_IDS,
  ), true);
  assert.equal(canApplyTuitionDiscount(
    technologyEnrollment,
    { concepto_id: 5, descuento_ext: '1' },
    discount({ matricula_id: null, periodo_id: 202601, estudiante_id: 234567 }),
    FULL_TUITION_DISCOUNT_CONCEPT_IDS,
  ), true);
});

test('pago por creditos conserva regla actual', () => {
  assert.equal(canApplyTuitionDiscount(
    professionalEnrollment,
    { concepto_id: 35, descuento_ext: '1' },
    discount({ matricula_id: 900003, periodo_id: 202601, estudiante_id: 345678 }),
    TUITION_DISCOUNT_CONCEPT_IDS,
  ), true);
});
