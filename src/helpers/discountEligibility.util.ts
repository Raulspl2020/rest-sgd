const MAX_DISCOUNT_RATE = 1;
const RATE_DECIMAL_FACTOR = 1000000;
const GRATUITY_DISCOUNT_CATEGORY_ID = 13;
const GRATUITY_INELIGIBLE_LEVEL_CODES = new Set([11, 16]);

export const INDIVIDUAL_CREDIT_DISCOUNT_CONCEPT_IDS = [33, 35];
export const TUITION_DISCOUNT_CONCEPT_IDS = [1, 2, 5, 6, 7, 52, ...INDIVIDUAL_CREDIT_DISCOUNT_CONCEPT_IDS];
export const FULL_TUITION_DISCOUNT_CONCEPT_IDS = [5, 6, 7, 52];

export const toNumber = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const clampDiscountRate = (value: any): number => {
  const discountRate = toNumber(value);
  if (discountRate <= 0) {
    return 0;
  }

  const clampedRate = discountRate > MAX_DISCOUNT_RATE ? MAX_DISCOUNT_RATE : discountRate;
  return Math.round(clampedRate * RATE_DECIMAL_FACTOR) / RATE_DECIMAL_FACTOR;
};

export const sumDiscountRateWithCap = (currentRate: any, incomingRate: any): number => {
  const current = clampDiscountRate(currentRate);
  const incoming = clampDiscountRate(incomingRate);
  return clampDiscountRate(current + incoming);
};

export const isGratuityDiscount = (discount: any): boolean => {
  const categoryId = Number(discount?.porcentaje_categoria_id ?? discount?.porcentajeCategoriaId);
  if (categoryId === GRATUITY_DISCOUNT_CATEGORY_ID) {
    return true;
  }

  return String(discount?.descripcion || "").trim().toUpperCase() === "POLITICA DE GRATUIDAD";
};

export const isDiscountApplicableToEnrollment = (discount: any, enrollment: any): boolean => {
  const currentEnrollmentId = Number(enrollment?.cod_matricula);
  const discountEnrollmentId = Number(discount?.matricula_id ?? discount?.matriculaId);

  if (Number.isFinite(discountEnrollmentId) && discountEnrollmentId > 0 && discountEnrollmentId !== currentEnrollmentId) {
    return false;
  }

  // Legacy gratuity without matricula_id must still obey institutional eligibility rules.
  if (isGratuityDiscount(discount) && GRATUITY_INELIGIBLE_LEVEL_CODES.has(Number(enrollment?.cod_nivel_edu))) {
    return false;
  }

  return true;
};

export const filterDiscountsForEnrollment = (discounts: any[], enrollment: any): any[] => {
  return (discounts || []).filter((discount) => isDiscountApplicableToEnrollment(discount, enrollment));
};

const getDiscountCategoryId = (discount: any): number => {
  const categoryId = Number(discount?.porcentaje_categoria_id ?? discount?.porcentajeCategoriaId);
  return Number.isFinite(categoryId) ? categoryId : 0;
};

const getDiscountId = (discount: any): number => {
  const id = Number(discount?._id ?? discount?.id);
  return Number.isFinite(id) ? id : 0;
};

const getDiscountTime = (discount: any, field: string): number => {
  const value = discount?.[field];
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const shouldReplaceDiscount = (current: any, candidate: any): boolean => {
  const currentUpdatedAt = getDiscountTime(current, "fecha_update") || getDiscountTime(current, "fechaUpdate");
  const candidateUpdatedAt = getDiscountTime(candidate, "fecha_update") || getDiscountTime(candidate, "fechaUpdate");
  if (candidateUpdatedAt !== currentUpdatedAt) {
    return candidateUpdatedAt > currentUpdatedAt;
  }

  const currentCreatedAt = getDiscountTime(current, "fecha");
  const candidateCreatedAt = getDiscountTime(candidate, "fecha");
  if (candidateCreatedAt !== currentCreatedAt) {
    return candidateCreatedAt > currentCreatedAt;
  }

  return getDiscountId(candidate) > getDiscountId(current);
};

export const deduplicateDiscountsByCategory = (discounts: any[]): any[] => {
  const selectedByCategory = new Map<number, any>();
  const withoutCategory: any[] = [];

  (discounts || []).forEach((discount) => {
    const categoryId = getDiscountCategoryId(discount);
    if (categoryId <= 0) {
      withoutCategory.push(discount);
      return;
    }

    const current = selectedByCategory.get(categoryId);
    if (!current || shouldReplaceDiscount(current, discount)) {
      selectedByCategory.set(categoryId, discount);
    }
  });

  return [...selectedByCategory.values(), ...withoutCategory];
};

export const getDiscountableTuitionConceptIds = (discount: any, conceptIds: number[]): number[] => {
  return isGratuityDiscount(discount)
    ? Array.from(new Set([...conceptIds, ...INDIVIDUAL_CREDIT_DISCOUNT_CONCEPT_IDS]))
    : conceptIds;
};
