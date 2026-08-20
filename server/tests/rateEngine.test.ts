import {
  calculateVolumetricWeight,
  calculateQuote,
  RateCalculationInput,
  RateCardRule,
  CodConfigRule,
} from '../src/services/rateEngine';

describe('Rate Calculation Engine', () => {
  describe('calculateVolumetricWeight', () => {
    it('should calculate volumetric weight correctly using formula (L*B*H)/5000', () => {
      // 50 x 40 x 30 = 60,000 / 5000 = 12 kg
      const result = calculateVolumetricWeight(50, 40, 30);
      expect(result).toBe(12);
    });

    it('should throw an error for invalid negative or zero dimensions', () => {
      expect(() => calculateVolumetricWeight(0, 40, 30)).toThrow();
      expect(() => calculateVolumetricWeight(50, -10, 30)).toThrow();
    });
  });

  describe('calculateQuote', () => {
    const mockRateCardIntra: RateCardRule = {
      id: 'rc-1',
      orderType: 'B2C',
      relation: 'INTRA',
      ratePerKg: 15,
      baseCharge: 50,
      minCharge: 40,
      isActive: true,
    };

    const mockRateCardInter: RateCardRule = {
      id: 'rc-2',
      orderType: 'B2B',
      relation: 'INTER',
      ratePerKg: 25,
      baseCharge: 100,
      minCharge: 100,
      isActive: true,
    };

    const mockCodFlatConfig: CodConfigRule = {
      id: 'cod-1',
      orderType: 'B2C',
      surchargeType: 'FLAT',
      value: 30,
      isActive: true,
    };

    const mockCodPercentConfig: CodConfigRule = {
      id: 'cod-2',
      orderType: 'B2B',
      surchargeType: 'PERCENT',
      value: 5, // 5%
      isActive: true,
    };

    it('should use actual weight when actual weight > volumetric weight', () => {
      const input: RateCalculationInput = {
        pickupPincode: '560001',
        dropPincode: '560002',
        pickupZoneId: 'zone-south',
        dropZoneId: 'zone-south',
        lengthCm: 10,
        breadthCm: 10,
        heightCm: 10, // Volumetric = 0.2 kg
        actualWeightKg: 5, // Actual = 5 kg
        orderType: 'B2C',
        paymentType: 'PREPAID',
      };

      const quote = calculateQuote(input, mockRateCardIntra);

      expect(quote.relation).toBe('INTRA');
      expect(quote.volumetricWeightKg).toBe(0.2);
      expect(quote.billedWeightKg).toBe(5);
      expect(quote.breakdown.weightUsed).toBe('ACTUAL');
      // Base charge: 5kg * 15 rate/kg = 75 (max of baseCharge 50, minCharge 40, 75)
      expect(quote.baseCharge).toBe(75);
      expect(quote.codSurcharge).toBe(0);
      expect(quote.totalCharge).toBe(75);
    });

    it('should use volumetric weight when volumetric weight > actual weight', () => {
      const input: RateCalculationInput = {
        pickupPincode: '560001',
        dropPincode: '400001',
        pickupZoneId: 'zone-south',
        dropZoneId: 'zone-west',
        lengthCm: 100,
        breadthCm: 50,
        heightCm: 40, // Volumetric = 200,000 / 5000 = 40 kg
        actualWeightKg: 10,
        orderType: 'B2B',
        paymentType: 'PREPAID',
      };

      const quote = calculateQuote(input, mockRateCardInter);

      expect(quote.relation).toBe('INTER');
      expect(quote.volumetricWeightKg).toBe(40);
      expect(quote.billedWeightKg).toBe(40);
      expect(quote.breakdown.weightUsed).toBe('VOLUMETRIC');
      // Base charge: 40kg * 25 rate/kg = 1000
      expect(quote.baseCharge).toBe(1000);
      expect(quote.totalCharge).toBe(1000);
    });

    it('should apply base charge minimum threshold when calculated weight * rate is lower', () => {
      const input: RateCalculationInput = {
        pickupPincode: '560001',
        dropPincode: '560002',
        pickupZoneId: 'zone-south',
        dropZoneId: 'zone-south',
        lengthCm: 10,
        breadthCm: 10,
        heightCm: 10, // Volumetric = 0.2 kg
        actualWeightKg: 1, // Actual = 1 kg
        orderType: 'B2C',
        paymentType: 'PREPAID',
      };

      // 1kg * 15 rate/kg = 15. Base charge is 50. Should pick 50.
      const quote = calculateQuote(input, mockRateCardIntra);

      expect(quote.baseCharge).toBe(50);
      expect(quote.totalCharge).toBe(50);
    });

    it('should calculate FLAT COD surcharge correctly for COD payment type', () => {
      const input: RateCalculationInput = {
        pickupPincode: '560001',
        dropPincode: '560002',
        pickupZoneId: 'zone-south',
        dropZoneId: 'zone-south',
        lengthCm: 10,
        breadthCm: 10,
        heightCm: 10,
        actualWeightKg: 5,
        orderType: 'B2C',
        paymentType: 'COD',
      };

      const quote = calculateQuote(input, mockRateCardIntra, mockCodFlatConfig);

      expect(quote.baseCharge).toBe(75);
      expect(quote.codSurcharge).toBe(30);
      expect(quote.totalCharge).toBe(105);
    });

    it('should calculate PERCENT COD surcharge correctly for COD payment type', () => {
      const input: RateCalculationInput = {
        pickupPincode: '560001',
        dropPincode: '400001',
        pickupZoneId: 'zone-south',
        dropZoneId: 'zone-west',
        lengthCm: 100,
        breadthCm: 50,
        heightCm: 40, // 40 kg billed weight
        actualWeightKg: 10,
        orderType: 'B2B',
        paymentType: 'COD',
      };

      // Base charge = 40kg * 25 = 1000. COD = 5% of 1000 = 50. Total = 1050
      const quote = calculateQuote(input, mockRateCardInter, mockCodPercentConfig);

      expect(quote.baseCharge).toBe(1000);
      expect(quote.codSurcharge).toBe(50);
      expect(quote.totalCharge).toBe(1050);
    });
  });
});
