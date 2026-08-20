export interface RateCalculationInput {
  pickupPincode: string;
  dropPincode: string;
  pickupZoneId?: string | null;
  dropZoneId?: string | null;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
  orderType: 'B2B' | 'B2C';
  paymentType: 'PREPAID' | 'COD';
}

export interface RateCardRule {
  id: string;
  orderType: 'B2B' | 'B2C';
  relation: 'INTRA' | 'INTER';
  ratePerKg: number;
  baseCharge: number;
  minCharge: number;
  isActive: boolean;
}

export interface CodConfigRule {
  id: string;
  orderType: 'B2B' | 'B2C';
  surchargeType: 'FLAT' | 'PERCENT';
  value: number;
  isActive: boolean;
}

export interface QuoteResult {
  pickupZoneId: string | null;
  dropZoneId: string | null;
  relation: 'INTRA' | 'INTER';
  volumetricWeightKg: number;
  billedWeightKg: number;
  baseCharge: number;
  codSurcharge: number;
  totalCharge: number;
  breakdown: {
    volumetricFormula: string;
    weightUsed: 'ACTUAL' | 'VOLUMETRIC';
    ratePerKg: number;
    baseChargeApplied: number;
    surchargeApplied: number;
  };
}

/**
 * Calculates volumetric weight in kg from dimensions in cm.
 * Formula: (Length * Breadth * Height) / 5000
 */
export function calculateVolumetricWeight(lengthCm: number, breadthCm: number, heightCm: number): number {
  if (lengthCm <= 0 || breadthCm <= 0 || heightCm <= 0) {
    throw new Error('Dimensions (length, breadth, height) must be greater than zero');
  }
  const volWeight = (lengthCm * breadthCm * heightCm) / 5000;
  return Number(volWeight.toFixed(2));
}

/**
 * Pure Rate Engine Function
 * Calculates charges based on zone relation, weight rules, and payment surcharge configs.
 */
export function calculateQuote(
  input: RateCalculationInput,
  rateCard: RateCardRule,
  codConfig?: CodConfigRule | null
): QuoteResult {
  if (input.actualWeightKg <= 0) {
    throw new Error('Actual weight must be greater than zero');
  }

  // 1. Calculate Volumetric & Billed Weight
  const volumetricWeightKg = calculateVolumetricWeight(input.lengthCm, input.breadthCm, input.heightCm);
  const billedWeightKg = Math.max(input.actualWeightKg, volumetricWeightKg);
  const weightUsed = billedWeightKg === input.actualWeightKg ? 'ACTUAL' : 'VOLUMETRIC';

  // 2. Zone Relation Detection
  const relation: 'INTRA' | 'INTER' =
    input.pickupZoneId && input.dropZoneId && input.pickupZoneId === input.dropZoneId
      ? 'INTRA'
      : 'INTER';

  // 3. Base Charge Calculation
  const calculatedCharge = billedWeightKg * rateCard.ratePerKg;
  const baseCharge = Math.max(rateCard.baseCharge, rateCard.minCharge, calculatedCharge);
  const roundedBaseCharge = Number(baseCharge.toFixed(2));

  // 4. COD Surcharge Calculation
  let codSurcharge = 0;
  if (input.paymentType === 'COD' && codConfig && codConfig.isActive) {
    if (codConfig.surchargeType === 'FLAT') {
      codSurcharge = codConfig.value;
    } else if (codConfig.surchargeType === 'PERCENT') {
      codSurcharge = (roundedBaseCharge * codConfig.value) / 100;
    }
  }
  const roundedCodSurcharge = Number(codSurcharge.toFixed(2));

  // 5. Total Charge
  const totalCharge = Number((roundedBaseCharge + roundedCodSurcharge).toFixed(2));

  return {
    pickupZoneId: input.pickupZoneId || null,
    dropZoneId: input.dropZoneId || null,
    relation,
    volumetricWeightKg,
    billedWeightKg,
    baseCharge: roundedBaseCharge,
    codSurcharge: roundedCodSurcharge,
    totalCharge,
    breakdown: {
      volumetricFormula: `(${input.lengthCm} * ${input.breadthCm} * ${input.heightCm}) / 5000 = ${volumetricWeightKg} kg`,
      weightUsed,
      ratePerKg: rateCard.ratePerKg,
      baseChargeApplied: roundedBaseCharge,
      surchargeApplied: roundedCodSurcharge,
    },
  };
}
