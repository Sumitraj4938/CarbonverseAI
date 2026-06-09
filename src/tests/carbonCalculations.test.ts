import { describe, it, expect } from 'vitest';

// GHG Protocol calculator test suite
function calculateEmissions(data: any) {
  let transCO2 = 0;
  const carEmissionFactors: Record<string, number> = {
    petrol: 0.404,
    diesel: 0.430,
    electric: 0.120,
    hybrid: 0.220
  };
  transCO2 += data.transportation.carMiles * (carEmissionFactors[data.transportation.carType] || 0.22);
  transCO2 += data.transportation.publicTransitHours * 1.5;
  transCO2 += data.transportation.flightsCount * 230;

  const gridMixFactor = 0.38;
  const electricityMonthlyCO2 = data.electricity.monthlyKwh * gridMixFactor * (1 - data.electricity.renewableRatio);
  const electricityCO2 = electricityMonthlyCO2 * 12;

  const dietEmissionFactors: Record<string, number> = {
    vegan: 800,
    vegetarian: 1200,
    pescatarian: 1550,
    omnivore: 2100,
    meatHeavy: 3100
  };
  let foodCO2 = dietEmissionFactors[data.food.dietType] || 2100;
  foodCO2 += data.food.wasteRatio * 15;

  let shoppingCO2 = (data.shopping.clothingSpend * 0.15 + 
                     data.shopping.electronicsSpend * 0.35 + 
                     data.shopping.miscSpend * 0.1) * 12;

  let waterCO2 = (data.water.dailyShowers * 0.12 * 365) + (data.water.appliancesWeekly * 0.5 * 52);

  const total = transCO2 + electricityCO2 + foodCO2 + shoppingCO2 + waterCO2;

  let carbonScore = 100 - ((total - 2000) / (18000 - 2000)) * 90;
  carbonScore = Math.max(10, Math.min(100, Math.round(carbonScore)));

  return {
    transportation: Math.round(transCO2),
    electricity: Math.round(electricityCO2),
    food: Math.round(foodCO2),
    shopping: Math.round(shoppingCO2),
    water: Math.round(waterCO2),
    total: Math.round(total),
    carbonScore
  };
}

describe('GHG Carbon Footprint Calculator Engine', () => {
  const sampleData = {
    transportation: { carMiles: 120, carType: 'hybrid', publicTransitHours: 4, flightsCount: 2 },
    electricity: { monthlyKwh: 350, renewableRatio: 0.3 },
    food: { dietType: 'omnivore', wasteRatio: 3 },
    shopping: { clothingSpend: 80, electronicsSpend: 150, miscSpend: 50 },
    water: { dailyShowers: 10, appliancesWeekly: 5 }
  };

  it('calculates transit emissions according to vehicle profiles', () => {
    const res = calculateEmissions(sampleData);
    // Hybrid emissions: 120 * 0.22 = 26.4
    // Transit: 4 * 1.5 = 6
    // Flights: 2 * 230 = 460
    // Total transportation: 492.4 (rounded to 492)
    expect(res.transportation).toBe(492);
  });

  it('correctly values electricity grid mix offsets for renewable energy', () => {
    const withNoRenewable = calculateEmissions({
      ...sampleData,
      electricity: { monthlyKwh: 350, renewableRatio: 0 }
    });
    const withRenewable = calculateEmissions({
      ...sampleData,
      electricity: { monthlyKwh: 350, renewableRatio: 0.5 }
    });
    expect(withRenewable.electricity).toBeLessThan(withNoRenewable.electricity);
    expect(withRenewable.electricity).toBe(Math.round(withNoRenewable.electricity * 0.5));
  });

  it('evaluates diets from vegan to meatHeavy based on carbon metrics', () => {
    const veganProfile = calculateEmissions({
      ...sampleData,
      food: { dietType: 'vegan', wasteRatio: 0 }
    });
    const meatProfile = calculateEmissions({
      ...sampleData,
      food: { dietType: 'meatHeavy', wasteRatio: 0 }
    });
    expect(veganProfile.food).toBe(800);
    expect(meatProfile.food).toBe(3100);
  });

  it('clamps carbon scores within scientific scale boundaries of 10 and 100', () => {
    const superGreenProfile = calculateEmissions({
      transportation: { carMiles: 0, carType: 'hybrid', publicTransitHours: 0, flightsCount: 0 },
      electricity: { monthlyKwh: 0, renewableRatio: 1.0 },
      food: { dietType: 'vegan', wasteRatio: 0 },
      shopping: { clothingSpend: 0, electronicsSpend: 0, miscSpend: 0 },
      water: { dailyShowers: 0, appliancesWeekly: 0 }
    });
    expect(superGreenProfile.carbonScore).toBe(100);
  });
});
