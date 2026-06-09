export interface CarbonProfile {
  id: string;
  name: string;
  level: 'Seed' | 'Sapling' | 'Tree' | 'Forest Guardian' | 'Earth Hero';
  xp: number;
  greenPoints: number;
  streak: number;
}

export interface CarbonCalculatorData {
  transportation: {
    carMiles: number;
    carType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    publicTransitHours: number;
    flightsCount: number;
  };
  electricity: {
    monthlyKwh: number;
    renewableRatio: number; // 0 to 1
  };
  food: {
    dietType: 'vegan' | 'vegetarian' | 'pescatarian' | 'omnivore' | 'meatHeavy';
    wasteRatio: number; // 0 to 10
  };
  shopping: {
    clothingSpend: number;
    electronicsSpend: number;
    miscSpend: number;
  };
  water: {
    dailyShowers: number; // in mins
    appliancesWeekly: number; // dishwasher, washer loads
  };
}

export interface EmissionBreakdown {
  transportation: number; // kg Co2 per year or month
  electricity: number;
  food: number;
  shopping: number;
  water: number;
  total: number;
  carbonScore: number; // 0 to 100 max efficiency
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'transportation' | 'electricity' | 'food' | 'shopping' | 'water';
  xpReward: number;
  pointsReward: number;
  completed: boolean;
  recurring: 'daily' | 'weekly';
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  projectedSavings?: {
    co2Kg: number;
    usd: number;
  };
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  score: number; // carbon intensity score (lower is better, or higher efficiency is better)
  emissions: number; // total tons/year
  level: string;
  isCurrentUser?: boolean;
}

export interface EcoRoute {
  name: string;
  mode: 'driving' | 'transit' | 'biking' | 'walking';
  distanceKm: number;
  durationMin: number;
  co2EmissionsKg: number;
  isEcoChoice: boolean;
  savingsVsDriverKg: number;
}
