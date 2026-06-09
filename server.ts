import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

// Lazy initialize Gemini client to avoid crashes if API key is not ready
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI Coach will run in backup mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Global state simulation (in-memory for simple hackathon showcase)
let userProfile: {
  id: string;
  name: string;
  level: "Seed" | "Sapling" | "Tree" | "Forest Guardian" | "Earth Hero";
  xp: number;
  greenPoints: number;
  streak: number;
} = {
  id: "carbon_usr_1",
  name: "Eco Champion",
  level: "Seed",
  xp: 120,
  greenPoints: 340,
  streak: 3
};

let userCalculatorData = {
  transportation: {
    carMiles: 120,
    carType: "hybrid" as const,
    publicTransitHours: 4,
    flightsCount: 2
  },
  electricity: {
    monthlyKwh: 350,
    renewableRatio: 0.3
  },
  food: {
    dietType: "omnivore" as const,
    wasteRatio: 3
  },
  shopping: {
    clothingSpend: 80,
    electronicsSpend: 150,
    miscSpend: 50
  },
  water: {
    dailyShowers: 10,
    appliancesWeekly: 5
  }
};

// GHG Protocol Carbon Calculation Logic
function calculateEmissions(data: typeof userCalculatorData) {
  // Travel calculation
  let transCO2 = 0;
  const carEmissionFactors = {
    petrol: 0.404,  // kg CO2 per mile
    diesel: 0.430,
    electric: 0.120,
    hybrid: 0.220
  };
  transCO2 += data.transportation.carMiles * (carEmissionFactors[data.transportation.carType] || 0.22);
  transCO2 += data.transportation.publicTransitHours * 1.5; // 1.5kg CO2 / hour on train or bus
  transCO2 += data.transportation.flightsCount * 230; // 230kg per average domestic flight

  // Electricity
  // 1 kWh is approx 0.38 kg CO2, offset by renewable ratio
  const gridMixFactor = 0.38;
  const electricityMonthlyCO2 = data.electricity.monthlyKwh * gridMixFactor * (1 - data.electricity.renewableRatio);
  const electricityCO2 = electricityMonthlyCO2 * 12; // annualized

  // Food Habits (Annual base emissions)
  const dietEmissionFactors = {
    vegan: 800,
    vegetarian: 1200,
    pescatarian: 1550,
    omnivore: 2100,
    meatHeavy: 3100
  };
  let foodCO2 = dietEmissionFactors[data.food.dietType] || 2100;
  foodCO2 += data.food.wasteRatio * 15; // 15 kg CO2 per waste point per year

  // Shopping (estimated carbon intensity of consumption)
  // clothing: ~0.15 kg CO2 per dollar
  // electronics: ~0.35 kg CO2 per dollar
  // misc: ~0.10 kg CO2 per dollar
  let shoppingCO2 = (data.shopping.clothingSpend * 0.15 + 
                     data.shopping.electronicsSpend * 0.35 + 
                     data.shopping.miscSpend * 0.1) * 12; // annualized from monthly budget

  // Water heating and processing emission estimates (annually)
  let waterCO2 = (data.water.dailyShowers * 0.12 * 365) + (data.water.appliancesWeekly * 0.5 * 52);

  const total = transCO2 + electricityCO2 + foodCO2 + shoppingCO2 + waterCO2;

  // Calculate carbon score (0 to 100 where higher is better - representing efficiency)
  // US average is ~16,000 kg CO2 (16 tons). Let's use 10,000 as a competitive threshold.
  // Less than 2000 kg total = 100 points, 15000+ kg = 10 points. Linear interpolation.
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

// -------------------------------------------------------------
// REST API Routes
// -------------------------------------------------------------

// Post and Calculate User Carbon Footprint
app.post("/api/calculator/submit", (req, res) => {
  const data = req.body;
  if (data) {
    userCalculatorData = { ...userCalculatorData, ...data };
  }
  const breakdown = calculateEmissions(userCalculatorData);
  
  // Award level based on scoring
  let level: typeof userProfile.level = "Seed";
  if (breakdown.carbonScore > 85) level = "Earth Hero";
  else if (breakdown.carbonScore > 70) level = "Forest Guardian";
  else if (breakdown.carbonScore > 50) level = "Tree";
  else if (breakdown.carbonScore > 35) level = "Sapling";

  userProfile.level = level;
  userProfile.xp += 30; // completed calculator wizard XP boost

  res.json({
    profile: userProfile,
    calculatorData: userCalculatorData,
    breakdown
  });
});

// Fetch current carbon profile and metrics
app.get("/api/carbon/metrics", (req, res) => {
  const breakdown = calculateEmissions(userCalculatorData);
  res.json({
    profile: userProfile,
    calculatorData: userCalculatorData,
    breakdown
  });
});

// Update Quest Completion
app.post("/api/quests/complete", (req, res) => {
  const { xp, points } = req.body;
  userProfile.xp += xp || 15;
  userProfile.greenPoints += points || 25;
  userProfile.streak += 1;

  // Recalculate level if XP thresholds met
  const xpThresholds = {
    "Seed": 100,
    "Sapling": 250,
    "Tree": 500,
    "Forest Guardian": 1000,
    "Earth Hero": 2000
  };

  const score = calculateEmissions(userCalculatorData).carbonScore;
  let computedLevel: typeof userProfile.level = "Seed";
  if (userProfile.xp > 1000 && score > 75) {
    computedLevel = "Earth Hero";
  } else if (userProfile.xp > 600 && score > 60) {
    computedLevel = "Forest Guardian";
  } else if (userProfile.xp > 350) {
    computedLevel = "Tree";
  } else if (userProfile.xp > 150) {
    computedLevel = "Sapling";
  }
  
  userProfile.level = computedLevel;

  res.json({
    success: true,
    profile: userProfile
  });
});

function isClimaticTopic(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  
  // Allow greetings and standard app-relative help prompts
  const greetings = [
    "hello", "hi", "hey", "who are you", "what can you do", "help", "how does this work", 
    "options", "questions", "guide", "info", "explain", "about you", "get started", "welcome"
  ];
  if (greetings.some(g => normalized === g || normalized.startsWith(g + " ") || normalized.endsWith(" " + g))) {
    return true;
  }

  // Core thematic tokens matching environmental and sustainability domains
  const keywords = [
    "carbon", "co2", "footprint", "climate", "emission", "greenhouse", "transit", "train", "flight", 
    "eco", "vegan", "veget", "meat", "diet", "recycle", "electricity", "energy", "solar", "wind", 
    "power", "waste", "water", "sustain", "green", "earth", "plant", "environmental", "tree", "forest", 
    "commute", "car", "fuel", "gas", "hybrid", "electric", "saving", "mitigat", "offset", "planet", 
    "warm", "global", "temperature", "coal", "fossil", "plastic", "appliance", "shower", "compost",
    "led", "bulb", "consumption", "shopping", "transport", "mile", "kwh", "habit", "eco-friendly"
  ];

  return keywords.some(keyword => normalized.includes(keyword));
}

// AI Climate Coach
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, userContext } = req.body;
  const lastUserMessage = messages[messages.length - 1]?.content || "";

  // Topic validation rule
  if (!isClimaticTopic(lastUserMessage)) {
    return res.json({
      role: "model",
      content: "As your dedicated AI Climate Advisor, my expertise is strictly configured for questions about carbon footprints, environmental sustainability, climate change, greenhouse gas calculations, energy efficiency, and eco-friendly habit changes. Please request guidance within these sustainability fields!",
      timestamp: new Date().toISOString()
    });
  }

  const systemPrompt = `You are the Expert AI Climate Coach of "CarbonVerse AI" platform, a living digital carbon supervisor, carbon accountant, and behavior modification counselor.
Your character is analytical yet motivating. Use strict scientifically accurate sustainability insights in accordance with the GHG Protocol.

**CRITICAL TOPIC BOUNDARY POLICY**:
You are strictly restricted to processing carbon footprint audit, energy optimization, fuel emissions, climate mitigation, environmental footprint, ecology, organic agriculture/diet, and climate change questions. 
If the user's message is not directly related to these sustainable topics, you MUST politely reject and refuse the answer. Ask them to stick to sustainability topics.

At the end of your response, you MUST estimate:
1. Expected CO2 savings in kg if the user adopts the specific habit discussed.
2. Approximate financial (money) savings in USD per year.

Represent these at the end of your message block exactly in this custom format:
[SAVINGS:{"co2Kg": X, "usd": Y}]
where X and Y are numbers representing the potential impact.

User's current profile Context:
- Annual Emissions: ${userContext?.total || 4500} kg CO2
- Carbon Efficiency Score: ${userContext?.score || 55}/100
- Diet: ${userContext?.diet || 'omnivore'}
- Main source of emission: ${userContext?.highestSource || 'Transportation'}

Ensure the advice is specifically tailored to their biggest emitting category. Avoid generic platitudes. Speak directly, with a highly premium, intelligent, objective tone.`;

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant fallback simulation if API Key is not set or valid
    const answer = `Based on your highest emission category of Transportation (${userContext?.highestSource || 'Transportation'}), transitioning from average hybrid transit to active low carbon travel is the most significant upgrade you can make. Implementing standard meat-free days can yield up to an additional 400kg of annual mitigation.

Here is an actionable 3-step schedule for this week:
- Use public transit or cycle for distances under 5 miles.
- Try introducing plant-based ingredients to your cooking 3 times a week.
- Target smart power strip optimization to offset idle smart-device consumption.

[SAVINGS:{"co2Kg": 320, "usd": 150}]`;

    return res.json({
      role: "model",
      content: answer,
      timestamp: new Date().toISOString(),
      projectedSavings: { co2Kg: 320, usd: 150 }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: lastUserMessage,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const textResult = response.text || "";

    // Parse out potential savings from format [SAVINGS:{"co2Kg": 123, "usd": 456}]
    let co2Kg = 0;
    let usd = 0;
    const match = textResult.match(/\[SAVINGS:\s*({[^}]+})\s*\]/);
    let cleanedText = textResult;
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        co2Kg = parsed.co2Kg || 0;
        usd = parsed.usd || 0;
        // Strip the raw tag from user view for cleaner visual renders
        cleanedText = textResult.replace(match[0], "").trim();
      } catch (err) {
        console.error("Failed to parse savings metadata), err");
      }
    }

    res.json({
      role: "model",
      content: cleanedText,
      timestamp: new Date().toISOString(),
      projectedSavings: co2Kg > 0 ? { co2Kg, usd } : undefined
    });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "Climate Coach model was unable to process request.", details: err.message });
  }
});

// AI Receipt Scanner
app.post("/api/gemini/receipt", async (req, res) => {
  const { imageBase64, textContent } = req.body;

  const systemInstructions = `You are the Expert Carbon Receipt Scanner on the CarbonVerse AI Platform.
Analyze the provided shopping receipt itemization or receipt contents.
Extract the top 3-4 items from this receipt that carry the highest hidden carbon intensity (production, transport, processing).
Calculate of estimate:
- Item name
- Extracted quantity
- Estimated Greenhouse gas (GHG) footprint in CO2 kg
- Sustainability Rating (Green / Amber / Red)
- Eco-friendly Alternative selection that achieves lower footprints.

You MUST respond strictly in valid minified JSON format fitting this exact schema:
{
  "totalReceiptCO2Kg": number,
  "scannedItems": [
    {
      "name": "string",
      "quantity": string,
      "co2Kg": number,
      "rating": "Green" | "Amber" | "Red",
      "alternative": "string"
    }
  ],
  "overallVerdict": "string"
}`;

  const ai = getGeminiClient();
  if (!ai) {
    // Beautiful fallback scanner response
    const mockScannerResult = {
      totalReceiptCO2Kg: 28.4,
      scannedItems: [
        { name: "Sirloin Steak (Pack of 2)", quantity: "1x", co2Kg: 18.5, rating: "Red", alternative: "Organic Pea Protein Patties or Salmon Fillet" },
        { name: "Imported Asparagus (Peru)", quantity: "2x", co2Kg: 5.2, rating: "Red", alternative: "Locally sourced Summer Squash or Broccoli" },
        { name: "Conventional Almond Milk", quantity: "1L", co2Kg: 1.8, rating: "Amber", alternative: "Local Oat Milk (lower transportation & water impact)" },
        { name: "Recycled Dishwasher Pods", quantity: "1x", co2Kg: 0.5, rating: "Green", alternative: "None needed (already environment friendly choice)" }
      ],
      overallVerdict: "This receipt shows a carbon-intense purchasing profile, predominantly driven by high beef footprint and air-freighted imported produce. Transitioning to local vegetables and alternative plant proteins would offset up to 70% of this receipt's carbon cost immediately."
    };
    return res.json(mockScannerResult);
  }

  try {
    let response;
    
    if (imageBase64) {
      // Image analysis
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      };
      
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          imagePart,
          { text: "Analyze this shopping receipt image and extract carbon details in the strictly requested JSON schema." }
        ],
        config: {
          systemInstruction: systemInstructions,
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });
    } else {
      // Text fallback
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Process this receipt text content:\n${textContent || "Whole Foods Market: Steak $19.99, Imported Strawberries $5.99, Toilet Paper $4.50"}`,
        config: {
          systemInstruction: systemInstructions,
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });
    }

    try {
      const resultObj = JSON.parse(response.text?.trim() || "{}");
      res.json(resultObj);
    } catch (parseErr) {
      console.error("Receipt parsing error for:", response.text);
      res.status(500).json({ error: "Unable to parse scanned carbon breakdown from receipt", modelOutput: response.text });
    }
  } catch (err: any) {
    console.error("Gemini receipt error:", err);
    res.status(500).json({ error: "Failed to scan receipt carbon impact.", details: err.message });
  }
});

// Eco Route Planner
app.post("/api/gemini/route", async (req, res) => {
  const { start, destination } = req.body;

  if (!start || !destination) {
    return res.status(400).json({ error: "Please enter a valid starting point and destination." });
  }

  const ai = getGeminiClient();
  const systemInstructions = `You are the Advanced Eco Transit Engine of CarbonVerse AI.
Calculate route alternatives between "${start}" and "${destination}" to find optimal ecological choices.
Provide 4 options: standard driving (gas vehicle), eco public transit, cycling, and walking (if distance aligns).
Compare distance (km), duration (minutes), carbon emissions (CO2 kg), and whether it represents an eco choice.
Estimate carbon savings compared to driving a conventional motor vehicle.

You MUST respond strictly in valid minified JSON format matching this schema:
[
  {
    "name": "string (e.g., Highway Drive, High Speed Rail, Quiet Bikeway, Direct Walk)",
    "mode": "driving" | "transit" | "biking" | "walking",
    "distanceKm": number,
    "durationMin": number,
    "co2EmissionsKg": number,
    "isEcoChoice": boolean,
    "savingsVsDriverKg": number
  }
]`;

  if (!ai) {
    // Reliable high-quality fallback simulator
    const mockRoutes = [
      { name: "Conventional Drive (Highway)", mode: "driving", distanceKm: 18.4, durationMin: 22, co2EmissionsKg: 7.4, isEcoChoice: false, savingsVsDriverKg: 0 },
      { name: "Urban Commuter Train", mode: "transit", distanceKm: 19.2, durationMin: 28, co2EmissionsKg: 1.2, isEcoChoice: true, savingsVsDriverKg: 6.2 },
      { name: "scenic Green Path Cycling Route", mode: "biking", distanceKm: 15.6, durationMin: 45, co2EmissionsKg: 0, isEcoChoice: true, savingsVsDriverKg: 7.4 },
      { name: "Active Direct Footpath", mode: "walking", distanceKm: 14.8, durationMin: 180, co2EmissionsKg: 0, isEcoChoice: true, savingsVsDriverKg: 7.4 }
    ];
    return res.json(mockRoutes);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Calculate eco routes from "${start}" to "${destination}". Ensure outputs are mathematically consistent.`,
      config: {
        systemInstruction: systemInstructions,
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const parsedRoutes = JSON.parse(response.text?.trim() || "[]");
    res.json(parsedRoutes);
  } catch (err: any) {
    console.error("Gemini Route Err:", err);
    res.status(500).json({ error: "Route analysis failed", details: err.message });
  }
});

// Express startup with Vite dev middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite dev server middleware
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CarbonVerse full-stack engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
