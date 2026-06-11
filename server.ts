import express from "express";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();

// Apply dynamic compression middleware
app.use(compression());

// Set up security headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: "10mb" }));

// Rate limiting to mitigate DDoS and brute-force (OWASP Top 10)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});

app.use("/api/", apiLimiter);

// Zod schemas for input validation
const CalculatorDataSchema = z.object({
  transportation: z.object({
    carMiles: z.number().nonnegative(),
    carType: z.enum(["petrol", "diesel", "electric", "hybrid"]),
    publicTransitHours: z.number().nonnegative(),
    flightsCount: z.number().nonnegative()
  }).partial().optional(),
  electricity: z.object({
    monthlyKwh: z.number().nonnegative(),
    renewableRatio: z.number().min(0).max(1)
  }).partial().optional(),
  food: z.object({
    dietType: z.enum(["vegan", "vegetarian", "pescatarian", "omnivore", "meatHeavy"]),
    wasteRatio: z.number().min(0).max(10)
  }).partial().optional(),
  shopping: z.object({
    clothingSpend: z.number().nonnegative(),
    electronicsSpend: z.number().nonnegative(),
    miscSpend: z.number().nonnegative()
  }).partial().optional(),
  water: z.object({
    dailyShowers: z.number().nonnegative(),
    appliancesWeekly: z.number().nonnegative()
  }).partial().optional()
}).partial();

const QuestCompleteSchema = z.object({
  xp: z.number().int().optional(),
  points: z.number().int().optional()
});

const RoutePlannerSchema = z.object({
  start: z.string().trim().min(1, "Starting point is required"),
  destination: z.string().trim().min(1, "Destination is required")
});

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

let userCalculatorData: {
  transportation: {
    carMiles: number;
    carType: "petrol" | "diesel" | "electric" | "hybrid";
    publicTransitHours: number;
    flightsCount: number;
  };
  electricity: {
    monthlyKwh: number;
    renewableRatio: number;
  };
  food: {
    dietType: "vegan" | "vegetarian" | "pescatarian" | "omnivore" | "meatHeavy";
    wasteRatio: number;
  };
  shopping: {
    clothingSpend: number;
    electronicsSpend: number;
    miscSpend: number;
  };
  water: {
    dailyShowers: number;
    appliancesWeekly: number;
  };
} = {
  transportation: {
    carMiles: 120,
    carType: "hybrid",
    publicTransitHours: 4,
    flightsCount: 2
  },
  electricity: {
    monthlyKwh: 350,
    renewableRatio: 0.3
  },
  food: {
    dietType: "omnivore",
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
  const result = CalculatorDataSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Invalid calculator parameters", details: result.error.format() });
  }
  const data = result.data;
  if (data) {
    userCalculatorData = {
      transportation: { ...userCalculatorData.transportation, ...(data.transportation || {}) },
      electricity: { ...userCalculatorData.electricity, ...(data.electricity || {}) },
      food: { ...userCalculatorData.food, ...(data.food || {}) },
      shopping: { ...userCalculatorData.shopping, ...(data.shopping || {}) },
      water: { ...userCalculatorData.water, ...(data.water || {}) }
    };
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
  const result = QuestCompleteSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Invalid quest completion parameters", details: result.error.format() });
  }
  const { xp, points } = result.data;
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

// -------------------------------------------------------------
// High-Fidelity Multi-Language Dynamic Feedback Engine
// -------------------------------------------------------------
function getSmartFallbackResponse(query: string, language: string, context?: Record<string, unknown>): string {
  const normalized = query.toLowerCase().trim();
  const name = context?.name || "Pioneer";
  
  const greetings: Record<string, string> = {
    English: `Hello ${name}! I'm your digital climate coach. I can help analyze your carbon footprint and guide you toward sustainable habits. What would you like to discuss today?`,
    Hindi: `नमस्ते ${name}! मैं आपका डिजिटल क्लाइमेट कोच हूँ। मैं आपके कार्बन उत्सर्जन को कम करने और हरित आदतों को अपनाने में मदद कर सकता हूँ। आप किस बारे में बात करना चाहेंगे?`,
    Urdu: `ہیلو ${name}! میں آپ کا ماحولیاتی کوچ ہوں۔ میں کاربن فٹ پرنٹ کم کرنے اور ماحول دوست عادات کے بارے میں مدد کر سکتا ہوں۔ کیا موضوع گفتگو ہونا چاہیے؟`,
    Tamil: `வணக்கம் ${name}! உங்களது கார்பன் தடத்தை குறைக்கவும் பசுமை பழக்கங்களை உருவாக்கவும் உதவும் ஏஐ காலநிலை பயிற்சியாளர் நான். நாம் எதைப்பற்றி பேசலாம்?`,
    Punjabi: `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ${name}! ਮੈਂ ਤੁਹਾਡਾ ਜਲਵਾਯੂ ਕੋਚ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੇ ਕਾਰਬਨ ਨਿਕਾਸ ਨੂੰ ਘਟਾਉਣ ਅਤੇ ਚੰਗੀਆਂ ਆਦਤਾਂ ਬਣਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।`,
    Bhojpuri: `प्रणाम ${name}! रउआ पर्यावरण सहायक हईं। रउआ कार्बन उत्सर्जन कम करे खातिर कवन मदद चाहीं? बताईं का चर्चा होखे?`,
    Kannada: `ನಮಸ್ತೆ ${name}! ನಿಮ್ಮ ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆ ನಿಯಂತ್ರಣ ಮತ್ತು ಗ್ರೀನ್ ಹ್ಯಾಬಿಟ್ಸ್ ಅಳವಡಿಕೆಗೆ ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುವ ಹವಾಮಾನ ತಜ್ಞ ಎಐ ಆಗಿದ್ದೇನೆ.`
  };

  const isGreeting = ["hello", "hi", "hey", "namaste", "pranam", "salam", "hola", "welcome"].some(g => normalized.startsWith(g) || normalized === g);
  if (isGreeting) {
    return greetings[language] || greetings["English"];
  }

  const englishTemplates = {
    travel: [
      `As your environmental advisor, looking at your transit profile, switching your shorter trips to walking, electric scooter, or hybrid options would offset substantial emissions. Doing this regularly can reduce your vehicle emissions by 340kg of CO2 per year, saving you up to $200!`,
      `Consider modern carpooling or scheduling bus transit twice a week. Based on standard commuting ratios, this simple adjustment offsets about 310kg CO2 and puts $180 back into your annual pocket.`,
      `We should focus on reducing solo car miles. Setting up active cycling commutes for local errands under 5 miles prevents approximately 400kg CO2 and improves cardiac health.`
    ],
    energy: [
      `To optimize your household electricity demand, swapping standard bulbs to smart LEDs and lowering your thermostat by 1.5 degrees Celsius acts as a high-impact shield, saving up to 180kg CO2 and $120 each year!`,
      `Did you know phantom load appliances (TVs, chargers, games consoles on standby) consume valuable power? Connecting them to a smart outlet or switching them off completely prevents 110kg CO2 and reduces utility costs.`,
      `Consider looking into solar panel efficiency or grid solar options. A basic utility transition protects the air from 500kg CO2 per kilowatt-hour saved.`
    ],
    diet: [
      `Your diet profile is incredibly powerful. Swapping just 3-4 meals a week from meat-heavy options to rich plant-based alternatives (like green vegetables, nuts, and clean grains) limits your footprint by 450kg CO2!`,
      `Minimizing home food waste by planning groceries in advance of store visits protects your wallet and keeps food out of landfills, preventing 150kg of municipal carbon emissions.`,
      `Transitioning to a plant-forward, seasonal organic diet represents an immediate 30% reduction in personal food greenhouse footprint, shaving off nearly 420kg CO2 annually.`
    ],
    water: [
      `Optimizing shower sessions by 3 minutes and preferring laundry cold-wash cycles prevents 90kg of boiler fuel-oil emissions and keeps fresh water conserved.`,
      `Repairing minor drip leaks on household faucets saves hundreds of gallons of processed energy-intensive tap water, offsetting 40kg of municipal power carbon.`,
      `Installing a low-flow aerator on your kitchen tap reduces hot water usage, avoiding 110kg of CO2 emissions generated by hot water heating system yearly.`
    ],
    general: [
      `Every climate action compound. By optimizing transit selection, moving toward greener organic options, and tracking household standby power, you'll save up to 400kg of annual CO2!`,
      `Let's start your sustainability journey with small steps. Small adjustments in commute and diet can collectively offset up to 450kg CO2 without major lifestyle compromises.`,
      `A robust carbon strategy involves target focus. Focus on your biggest emission category, analyze fuel/power consumption, and commit to one eco-friendly prompt weekly.`
    ]
  };

  const hindiTemplates = {
    travel: [
      `आपके यात्रा प्रोफ़ाइल के अनुसार, छोटी यात्राओं के लिए साइकिल या पैदल चलना एक स्मार्ट विकल्प है। इससे आपका वार्षिक उत्सर्जन लगभग 340 किलोग्राम कम होगा और ₹15,000 की बचत होगी!`,
      `हफ्ते में दो बार कारपूल या सार्वजनिक बसों का चुनाव करें। इससे लगभग 310 किलोग्राम कार्बन उत्सर्जन बचेगा और ईंधन का खर्च काफी कम होगा।`
    ],
    energy: [
      `बिजली की खपत कम करने के लिए, साधारण बल्बों को LED से बदलें और हीटर-AC का तापमान 2 डिग्री अनुकूलित करें। इससे सालाना 180 किलोग्राम CO2 उत्पन्न नहीं होगी।`,
      `निष्क्रिय उपकरणों को प्लग से बंद करने से बिजली का बिल और कार्बन टर्नओवर बचेगा।`
    ],
    diet: [
      `शाकाहारी या पौधे आधारित आहार सप्ताह में 4 दिन अपनाना भोजन कार्बन उत्सर्जन को 450 किलोग्राम तक कम कर सकता है। भोजन बर्बाद न करना और भी बेहतर है।`,
      `ताज़ी सब्जियों और स्थानीय अनाजों को भोजन में स्थान देने से कीटनाशक एवं परिवहन उत्सर्जन कम होता है।`
    ],
    water: [
      `नहाने का समय 3 मिनट कम करने और ठंडे पानी से कपड़े धोने से आपकी बिजली और जल संसाधन बचेंगे, जिससे 90 किलोग्राम ईंधन CO2 का शमन होगा।`
    ],
    general: [
      `पर्यावरण-अनुकूल दिनचर्या अपनाएं। छोटी यात्राओं में पैदल चलें, LED बल्ब चालू करें, और शाकाहार को प्राथमिकता दें। यह आपको हरियर जीवन देगा।`
    ]
  };

  const urduTemplates = {
    travel: [
      `آپ کے سفری پروفائل کے مطابق، کار کے بجائے سائیکل یا پبلک ٹرانسپورٹ کا استعمال سالانہ 340 کلوگرام کاربن اور اہم تیل بچا سکتا ہے!`
    ],
    energy: [
      `ایل ای ڈی بلب کا استعمال اور تھرموسٹیٹ کو 2 ڈگری پر ایڈجسٹ کرنا آپ کو 180 کلوگرام کاربن سے محفوظ رکھتا ہے۔`
    ],
    diet: [
      `ہفتے میں 4 دن پودوں پر مبنی غذا کا انتخاب آپ کے ماحولیاتی اثرات کو 450 کلوگرام تک کم کرتا ہے اور پیسے بچاتا ہے۔`
    ],
    water: [
      `نہانے کا وقت 3 منٹ کم کر کے اور پانی کا دانشمندانہ استعمال کر کے سالانہ 90 کلوگرام ماحولیاتی ایندھن کا کاربن بچائیں۔`
    ],
    general: [
      `روزمرہ کی چھوٹی تبدیلیاں: ٹرانسپورٹ اور بجلی کی بچت سے سالانہ 400 کلوگرام تک کاربن کا خاتمہ کریں۔`
    ]
  };

  const tamilTemplates = {
    travel: [
      `உங்கள் பயண முறையில் காரை தவிர்த்து பொது போக்குவரத்து அல்லது சைக்கிள் பயன்படுத்துவது ஆண்டுக்கு 340 கிலோ கார்பன் உமிழ்வைக் குறைக்க உதவும்.`
    ],
    energy: [
      `மின்சாதனங்கள், எல்இடி விளக்குகள் மற்றும் தேவையற்ற மின் கருவிகளை அணைப்பதன் மூலம் 180 கிலோ CO2 உமிழ்வையும் மின் கட்டணத்தையும் குறைக்கலாம்.`
    ],
    diet: [
      `வாரத்தில் 4 நாட்கள் தாவர அடிப்படையிலான உணவுகளை உட்கொள்வதன் மூலம் ஆண்டுக்கு 450 கிலோ கார்பன் உமிழ்வைக் குறைக்கலாம்.`
    ],
    water: [
      `குளிக்கும் நேரத்தை 3 நிமிடங்கள் குறைப்பதን மூலம் ஆண்டிற்கு 90 கிலோ உமிழ்வை தவிர்க்க முடியும்.`
    ],
    general: [
      `சிறிய பயணங்களுக்கு பொது சவாரிகளைப் பயன்படுத்தவும் மற்றும் மின்சாதனங்களை அணைத்து கார்பனைச் சேமிக்கவும்.`
    ]
  };

  const punjabiTemplates = {
    travel: [
      `ਛੋਟੇ ਸਫ਼ਰ ਨੂੰ ਪੈਦਲ ਜਾਂ ਸਾਈਕਲ ਵਿੱਚ ਬਦਲੋ। ਸਾਈਕਲ ਦੀ ਵਰਤੋਂ ਨਾਲ ਸਾਲਾਨਾ 340 ਕਿਲੋ ਕਾਰਬਨ ਬਚੇਗਾ ਅਤੇ ਤੇਲ ਦਾ ਖਰਚਾ ਬਚੇਗਾ।`
    ],
    energy: [
      `LED ਬੱਲਬਾਂ ਦੀ ਵਰਤੋਂ ਅਤੇ ਲੋੜ ਨਾ ਹੋਣ 'ਤੇ ਬਿਜਲੀ ਬੰਦ ਕਰਨ ਨਾਲ ਸਾਲਾਨਾ 180 ਕਿਲੋ CO2 ਅਤੇ ਬਿਜਲੀ ਦਾ ਬਿੱਲ ਬਚਾਓ।`
    ],
    diet: [
      `ਹਫ਼ਤੇ ਵਿੱਚ 4 ਦਿਨ ਸ਼ਾਕਾਹਾਰੀ ਭੋਜਨ ਖਾਣ ਨਾਲ ਸਾਲਾਨਾ 450 ਕਿਲੋ ਭੋਜਨ ਕਾਰਬਨ ਘਟਾਇਆ ਜਾ ਸਕਦਾ ਹੈ।`
    ],
    water: [
      `ਨਹਾਉਣ ਦੇ ਸਮੇਂ ਨੂੰ 3 ਮਿੰਟ ਘਟਾ ਕੇ ਅਤੇ ਠੰਢੇ ਪਾਣੀ ਨਾਲ ਕੱਪੜੇ ਧো ਕੇ ਸਾਲਾਨਾ 90 ਕਿਲੋ ਕਾਰਬਨ ਬਚਾਓ।`
    ],
    general: [
      `ਵਾਤਾਵਰਣ ਅਨੁਕੂਲ ਕਦਮ: ਘੱਟ ਦੂਰੀ ਪੈਦਲ ਯਾਤਰਾ ਕਰੋ, ਬਿਜਲੀ ਬਚਾਓ ਅਤੇ ਹਰੀਆਂ ਆਦਤਾਂ ਅਪਣਾਓ।`
    ]
  };

  const bhojpuriTemplates = {
    travel: [
      `सायकल भइया भा सरकारी बस के उपयोग मज़ेदार आ सालाने 340 किलो carbon बचावे वाला होई। भाड़ा के पइसा खूब बची!`
    ],
    energy: [
      `LED बलिया बार के आ बेफालतू के पंखा बंद कके रउआ सालाने 180 किलो carbon आ बिजली बिल के खूब पइसा बाचा सकीं।`
    ],
    diet: [
      `हफ्ता में 4 दिन साकाहारी भोजन कके भोजन के कार्बन फुटप्रिंट सालाने 450 किलो तक कम कइल जा सकेला।`
    ],
    water: [
      `नहाए के समय 3 मिनट कम कइला से आ ठंढा पानी से कपड़ा धोइला से सालाने 90 किलो गरम पानी के ईंधन बच जाई।`
    ],
    general: [
      `छोट दूरी खातिर पैदल चलीं आ हरियर भोजन खाए के आदत डालीं। रउआ सालाने खूब कार्बन उत्सर्जन बचा सकीं।`
    ]
  };

  const kannadaTemplates = {
    travel: [
      `ಕನ್ನಡ: 8 ಕಿಮೀಗಿಂತ ಕಡಿಮೆ ದೂರಕ್ಕೆ ಸೈಕಲ್ ಅಥವಾ ಸಾರ್ವಜನಿಕ ಸಾರಿಗೆ ಬಳಸಿ ವರ್ಷಕ್ಕೆ 340 ಕೆಜಿ ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆಯನ್ನು ನಿಯಂತ್ರಿಸಿ.`
    ],
    energy: [
      `ಎಲ್ಇಡಿ ಬಲ್ಬ್‌ ಬಳಸಿ ಹಾಗೂ ವಿದ್ಯುತ್ ಉಳಿಸುವ ಮೂಲಕ ವರ್ಷಕ್ಕೆ 180 ಕೆಜಿ ಇಂಗಾಲ ಮತ್ತು ವಿದ್ಯುತ್ ಬಿಲ್ ಉಳಿಸಿ.`
    ],
    diet: [
      `ವಾರದಲ್ಲಿ 4 ದಿನ ಹಸಿರು ಸಸ್ಯಾಹಾರಿ ಆಹಾರ ಸೇವಿಸುವುದರಿಂದ ವರ್ಷಕ್ಕೆ 450 ಕೆಜಿ ಇಂಗಾಲದ ಹೊರೆ ಕಡಿಮೆ ಮಾಡಲು ಸಾಧ್ಯವಿದೆ.`
    ],
    water: [
      `ಸ್ನಾನದ ಸಮಯವನ್ನು 3 ನಿಮಿಷ ಕಡಿಮೆ ಮಾಡುವುದರಿಂದ ವಾರ್ಷಿಕ 90 ಕೆಜಿಯಷ್ಟು ಗೃಹ ಇಂಧನ ಮತ್ತು ಬಿಸಿ ನೀರು ಉಳಿಸಬಹುದು.`
    ],
    general: [
      `ನಿಮ್ಮ ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆ ನಿಯಂತ್ರಣ ಮತ್ತು ಗ್ರೀನ್ ಹ್ಯಾಬಿಟ್ಸ್ ಅಳವಡಿಕೆಗೆ ಸಣ್ಣ ಹಸಿರು ಹೆಜ್ಜೆಗಳನ್ನು ಇಡಿ.`
    ]
  };

  let activeTemplates = englishTemplates;
  if (language === "Hindi") activeTemplates = hindiTemplates as any;
  else if (language === "Urdu") activeTemplates = urduTemplates as any;
  else if (language === "Tamil") activeTemplates = tamilTemplates as any;
  else if (language === "Punjabi") activeTemplates = punjabiTemplates as any;
  else if (language === "Bhojpuri") activeTemplates = bhojpuriTemplates as any;
  else if (language === "Kannada") activeTemplates = kannadaTemplates as any;

  let categoryFocus: "general" | "travel" | "energy" | "diet" | "water" = "general";
  if (normalized.match(/(car|commute|travel|flight|train|bus|cycle|transit|mile|drive|vehicle)/)) {
    categoryFocus = "travel";
  } else if (normalized.match(/(electricity|energy|solar|power|led|bulb|heater|ac|fan|light|standby|kilowatt)/)) {
    categoryFocus = "energy";
  } else if (normalized.match(/(diet|food|vegan|veget|meat|cook|grocery|eat|waste|compost|shakahari|bhojan|khana)/)) {
    categoryFocus = "diet";
  } else if (normalized.match(/(water|shower|wash|hose|tap|bath|rins)/)) {
    categoryFocus = "water";
  }

  const list = activeTemplates[categoryFocus] || activeTemplates["general"];
  const index = Math.abs(query.length + language.length) % list.length;
  return list[index];
}

// AI Climate Coach
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, userContext } = req.body;
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const preferredLanguage = userContext?.language || "English";

  const FALLBACKS_BY_LANG: Record<string, {
    general: string;
    travel: string;
    energy: string;
    diet: string;
    water: string;
    validationError: string;
    actionLabel: string;
  }> = {
    English: {
      general: "Climate action starts with minor everyday switches. Focus on transit selection, sustainable nutrition, and reducing standby appliance wastes to save up to 400kg of annual CO2!",
      travel: "By switching to public commutes, train transit, or active cycling for routes under 8 km, you prevent up to 340kg of air transport intensity emissions and save nearly $200 per year.",
      energy: "Using LED lighting, optimizing thermostats by 2 degrees Celsius, and disabling phantom standby power loads can offset 180kg CO2 and save $120 annually.",
      diet: "Adopting vegetarian or tree-based dietary options just 4 days a week reduces dietary footprint demand by 450kg CO2 annually while saving $180 in grocery bills.",
      water: "Reducing shower times by 3 minutes and using full cold-water cycles for washing machines mitigates 90kg of annual heating fuel carbon.",
      validationError: "As your dedicated AI Climate Advisor, my expertise is strictly configured for questions about carbon footprints, environmental sustainability, climate change, greenhouse gas calculations, energy efficiency, and eco-friendly habit changes. Please request guidance within these sustainability fields!",
      actionLabel: "Commit to this recommendation"
    },
    Hindi: {
      general: "जलवायु संरक्षण की शुरुआत रोजमर्रा के छोटे बदलावों से होती है। वर्ष में 400 किलोग्राम CO2 की बचत करने के लिए ईंधन अनुकूलन और हरित आहार को अपनाएं!",
      travel: "8 किमी से कम की दूरी के लिए साइकिल या सार्वजनिक वाहनों का उपयोग करके आप वार्षिक 340 किलोग्राम कार्बन उत्सर्जन बचा सकते हैं और लगभग ₹16,000 बचा सकते हैं.",
      energy: "LED बल्बों का उपयोग करने, वाटर हीटर तापमान को 2 डिग्री कम करने और निष्क्रिय उपकरणों को बंद करने से 180 किलोग्राम CO2 और बिजली का बिल बचता है।",
      diet: "हफ्ते में 4 दिन शाकाहारी या पेड़-पौधे आधारित आहार अपनाने से वार्षिक भोजन कार्बन फुटप्रिंट 450 किलोग्राम कम हो सकता है और किराना खर्च बच सकता है।",
      water: "नहाने के समय को 3 मिनट कम करने और ठंडे पानी से कपड़े धोने से वार्षिक गर्मी ईंधन उत्सर्जन में 90 किलोग्राम की कमी आती है।",
      validationError: "आपके जलवायु सलाहकार के रूप में, मेरी विशेषज्ञता विशेष रूप से कार्बन उत्सर्जन, पर्यावरण संरक्षण और पर्यावरण-अनुकूल आदतों के प्रश्नों के लिए बनी है। कृपया इसी से जुड़े सवाल पूछें।",
      actionLabel: "इस सुझाव का पालन करने का संकल्प लें"
    },
    Urdu: {
      general: "ماحولیاتی تحفظ کا آغاز روزمرہ کی چھوٹی تبدیلیوں سے ہوتا ہے۔ کاربن کے اخراج میں سالانہ 400 کلوگرام بچت کے لیے توانائی اور سبز غذا کا دانشمندانہ استعمال کریں۔",
      travel: "8 کلومیٹر سے کم کے سفر کے لیے پبلک ٹرانسپورٹ یا سائیکل کا استعمال کر کے آپ سالانہ 340 کلوگرام کاربن بچا سکتے ہیں اور ہزاروں روپے کی بچت کر سکتے ہیں۔",
      energy: "ایل ای ڈی لائٹس کا استعمال اور غیر ضروری برقی آلات کو بند کرنے سے سالانہ 180 کلوگرام کاربن اور اہم مالی بچت حاصل ہوتی ہے۔",
      diet: "ہفتے میں 4 دن سبزی خور یا پودوں برائے خوراک اپنا کر اپنے سالانہ کاربن اثرات کو 450 کلوگرام تک کم کریں اور کھانے پینے کے بجٹ میں بچت کریں۔",
      water: "نہانے کے وقت کو 3 منٹ کم کر کے اور ٹھنڈے پانی کے واش کا استعمال کر کے سالانہ 90 کلوگرام ایندھن کا کاربن بچائیں۔",
      validationError: "آپ کے ماحولیاتی مربی کے طور پر، میری مہارت کاربن فٹ پرنٹس، ماحولیاتی تسلسل، اور سبز عادات تک محدود ہے۔ براہ کرم اس دائرے کے اندر سوالات پوچھیں۔",
      actionLabel: "اس اختیار پر عمل پیرا ہونے کی تصدیق کریں"
    },
    Tamil: {
      general: "சுற்றுச்சூழல் பாதுகாப்பு நமது அன்றாட சிறு மாற்றங்களில் இருந்து தொடங்குகிறது. உங்கள் போக்குவரத்து தேர்வுகள் மற்றும் நிலையான பசுமை உணவுகள் மூலம் ஆண்டுக்கு 400 கிலோ CO2 ஐ சேமிக்கலாம்!",
      travel: "8 கிமீக்கும் குறைவான தூரத்திற்கு பொது போக்குவரத்து அல்லது மிதிவண்டியை பயன்படுத்துவதன் மூலம் ஆண்டுக்கு 340 கிலோ கார்பன் உமிழ்வைக் குறைத்து கணிசமான பணத்தை சேமிக்கலாம்.",
      energy: "எல்இடி விளக்குகள் மற்றும் தேவையற்ற மின் சாதனங்களை அணைப்பதன் மூலம் 180 கிலோ CO2 உமிழ்வையும் மின் கட்டணத்தையும் எளிதாக குறைக்கலாம்.",
      diet: "வாரத்தில் 4 நாட்கள் தாவர அடிப்படையிலான உணவுகளை உட்கொள்வதன் மூலம் ஆண்டுக்கு 450 கிலோ கார்பன் உமிழ்வைக் குறைக்கலாம் மற்றும் மளிகை செலவை மிச்சப்படுத்தலாம்.",
      water: "குளிக்கும் நேரத்தை 3 நிமிடங்கள் குறைப்பதன் மூலம் ஆண்டிற்கு 90 கிலோ உமிழ்வை தவிர்க்க முடியும்.",
      validationError: "உங்கள் காலநிலை ஆலோசகராக, கார்பன் தடம், ஆற்றல் சேமிப்பு மற்றும் நிலையான பழக்கவழக்கங்கள் தொடர்பான கேள்விகளுக்கு மட்டுமே என்னால் பதிலளிக்க முடியும்.",
      actionLabel: "இந்த பசுமை திட்டத்திற்கு உறுதியளிக்கவும்"
    },
    Punjabi: {
      general: "ਜਲਵਾਯੂ ਸੰਭਾਲ ਦੀ ਸ਼ੁਰੂਆਤ ਰੋਜ਼ਾਨਾ ਦੇ ਛੋਟੇ ਬਦਲਾਵਾਂ ਤੋਂ ਹੁੰਦੀ ਹੈ। ਸਾਲਾਨਾ 400 ਕਿਲੋ CO2 ਦੀ ਬਚਤ ਲਈ ਹਰੀ ਖੁਰਾਕ ਅਤੇ ਬਿਜਲੀ ਅਨੁਕੂਲਤਾ ਅਪਣਾਓ!",
      travel: "8 ਕਿਲੋਮੀਟਰ ਤੋਂ ਘੱਟ ਦੂਰੀ ਲਈ ਸਾਈਕਲ ਜਾਂ ਜਨਤਕ ਸਾਧਨਾਂ ਦੀ ਵਰਤੋਂ ਨਾਲ ਸਾਲਾਨਾ 340 ਕਿਲੋ ਕਾਰਬਨ ਬਚਾਓ ਅਤੇ ਬਾਲਣ ਦਾ ਖਰਚਾ ਘਟਾਓ।",
      energy: "ਬਿਜਲੀ ਉਪਕਰਨਾਂ ਨੂੰ ਲੋੜ ਨਾ ਹੋਣ 'ਤੇ ਬੰਦ ਰੱਖਣ ਅਤੇ LED ਬੱਲਬਾਂ ਦੀ ਵਰਤੋਂ ਨਾਲ ਸਾਲਾਨਾ 180 ਕਿਲੋ CO2 ਅਤੇ ਬਿਜਲੀ ਦਾ ਬਿੱਲ ਬਚਾਇਆ ਜਾ ਸਕਦਾ ਹੈ।",
      diet: "ਹਫ਼ਤੇ ਵਿੱਚ 4 ਦਿਨ ਸ਼ਾਕਾਹਾਰੀ ਜਾਂ ਪੌਦਿਆਂ 'ਤੇ ਅਧਾਰਤ ਭੋਜਨ ਖਾਣ ਨਾਲ ਸਾਲਾਨਾ 450 ਕਿਲੋ ਭੋਜਨ ਕਾਰਬਨ ਘਟਾਇਆ ਜਾ ਸਕਦਾ ਹੈ ਅਤੇ ਪੈਸੇ ਬਚਾਏ ਜਾ ਸਕਦੇ ਹਨ।",
      water: "ਨਹਾਉਣ ਦੇ ਸਮੇਂ ਨੂੰ 3 ਮਿੰਟ ਘਟਾ ਕੇ ਅਤੇ ਠੰਢੇ ਪਾਣੀ ਨਾਲ ਕੱਪੜੇ ਧੋ ਕੇ ਸਾਲਾਨਾ 90 ਕਿਲੋ ਕਾਰਬਨ ਬਚਾਓ।",
      validationError: "ਤੁਹਾਡੇ ਜਲਵਾਯੂ ਸਲਾਹਕਾਰ ਵਜੋਂ, ਮੇਰੀ ਮੁਹਾਰਤ ਕਾਰਬਨ ਫੁੱਟਪ੍ਰਿੰਟ, ਵਾਤਾਵਰਣ ਦੀ ਸਥਿਰਤਾ ਅਤੇ ਹਰੀ ਆਦਤਾਂ ਬਾਰੇ ਸਵਾਲਾਂ ਤੱਕ ਸੀਮਤ ਹੈ।",
      actionLabel: "ਇਸ ਹਰੀ ਆਦਤ ਦਾ ਸੰਕਲਪ ਲਓ"
    },
    Bhojpuri: {
      general: "पर्यावरण बचावे के सुरुआत रोजमर्रा के छोट-छोट बदलाव से होला। सालाने 400 किलो CO2 बचावे खातिर हरियर खान-पान आ बिजली के सही उपयोग करीं!",
      travel: "8 किमी से कम दूरी खातिर साइकिल चाहे सरकारी बस-ट्रेन के इस्तेमाल कके रउआ सालाने 340 किलो कार्बन उत्सर्जन बाचा सकीं आ भाड़ा के खूब पइसा बचा सकीं।",
      energy: "LED बलिया बार के, आ बेफालतू के पंखा-टीभी बंद कके रउआ 180 किलो कार्बन आ ढेर सारा बिजली के बिल के पइसा बचा सकीं।",
      diet: "हफ्ता में 4 दिन शाकाहारी भोजन खइला से भोजन के कार्बन फुटप्रिंट सालाने 450 किलो तक कम हो जाई आ सालाने खूब पइसा बची।",
      water: "नहाए के समय 3 मिनट कम कइला से आ ठंढा पानी से कपड़ा धोइला से सालाने 90 किलो गरम पानी के ईंधन बच जाई।",
      validationError: "रउआ पर्यावरण सलाहकार होखला के नाते, हमार काम खाली कार्बन उत्सर्जन, खेती-बारी आ पर्यावरण बचावे से जुड़ल बा। कृपा कके इहे सब सवाल पूछीं।",
      actionLabel: "एह सुन्दर आदत खातिर संकल्प लीं"
    },
    Kannada: {
      general: "ಪರಿಸರ ಸಂರಕ್ಷಣೆ ನಮ್ಮ ದೈನಂದಿನ ಸಣ್ಣ ಬದಲಾವಣೆಗಳಿಂದ ಆರಂಭವಾಗುತ್ತದೆ. ಸಾರಿಗೆ ಮತ್ತು ಹಸಿರು ತರಕಾರಿ ಆಹಾರಗಳ ಮೂಲಕ ವರ್ಷಕ್ಕೆ 400 ಕೆಜಿ CO2 ಉಳಿಸಿ!",
      travel: "8 ಕಿಮೀಗಿಂತ ಕಡಿಮೆ ದೂರಕ್ಕೆ ಸೈಕಲ್ ಅಥವಾ ಸಾರ್ವಜನಿಕ ಸಾರಿಗೆ ಬಳಸಿ ವರ್ಷಕ್ಕೆ 340 ಕೆಜಿ ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆಯನ್ನು ನಿಯಂತ್ರಿಸಿ ಮತ್ತು ಹಣ ಉಳಿಸಿ.",
      energy: "ಎಲ್ಇಡಿ ಬಲ್ಬ್‌ ಬಳಸಿ ಹಾಗೂ ವಿದ್ಯುತ್ ಉಳಿಸುವ ಮೂಲಕ ವರ್ಷಕ್ಕೆ 180 ಕೆಜಿ ಇಂಗಾಲ ಮತ್ತು ವಿದ್ಯುತ್ ಬಿಲ್ ಉಳಿಸಿ.",
      diet: "ವಾರದಲ್ಲಿ 4 ದಿನ ಹಸಿರು ಸಸ್ಯಾಹಾರಿ ಆಹಾರ ಸೇವಿಸುವುದರಿಂದ ವರ್ಷಕ್ಕೆ 450 ಕೆಜಿ ಇಂಗಾಲದ ಹೊರೆ ಕಡಿಮೆ ಮಾಡಲು ಸಾಧ್ಯವಿದೆ ಮತ್ತು ದಿನಸಿ ವೆಚ್ಚ ಉಳಿತಾಯವಾಗುತ್ತದೆ.",
      water: "ಸ್ನಾನದ ಸಮಯವನ್ನು 3 ನಿಮಿಷ ಕಡಿಮೆ ಮಾಡುವುದರಿಂದ ವಾರ್ಷಿಕ 90 ಕೆಜಿಯಷ್ಟು ಗೃಹ ಇಂಧನ ಮತ್ತು ಬಿಸಿ ನೀರು ಉಳಿಸಬಹುದು.",
      validationError: "ನಿಮ್ಮ ಪರಿಸರ ಸಲಹೆಗಾರನಾಗಿ, ನಾನು ಕೇವಲ ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆ ನಿಯಂತ್ರಣ ಮತ್ತು ಸುಸ್ಥಿರ ಅಭ್ಯಾಸಗಳ ಬಗ್ಗೆ ಮಾತ್ರ ಉತ್ತರಿಸಬಲ್ಲೆ.",
      actionLabel: "ಈ ಹಸಿರು ಯೋಜನೆಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲು ಒಪ್ಪಿಕೊಳ್ಳಿ"
    }
  };

  // Resolve language fallback bundle
  const langConfig = FALLBACKS_BY_LANG[preferredLanguage] || FALLBACKS_BY_LANG["English"];

  // Topic validation rule
  if (!isClimaticTopic(lastUserMessage)) {
    return res.json({
      role: "model",
      content: langConfig.validationError,
      timestamp: new Date().toISOString()
    });
  }

  // Determine user intent category dynamically based on keywords
  const normalizedText = lastUserMessage.toLowerCase();
  let categoryFocus: "general" | "travel" | "energy" | "diet" | "water" = "general";
  let projectedSavings = { co2Kg: 320, usd: 150 };

  if (normalizedText.match(/(car|commute|travel|flight|train|bus|cycle|transit|mile|drive|vehicle)/)) {
    categoryFocus = "travel";
    projectedSavings = { co2Kg: 340, usd: 200 };
  } else if (normalizedText.match(/(electricity|energy|solar|power|led|bulb|heater|ac|fan|light|standby|kilowatt)/)) {
    categoryFocus = "energy";
    projectedSavings = { co2Kg: 180, usd: 120 };
  } else if (normalizedText.match(/(diet|food|vegan|veget|meat|cook|grocery|eat|waste|compost|shakahari|bhojan|khana)/)) {
    categoryFocus = "diet";
    projectedSavings = { co2Kg: 450, usd: 180 };
  } else if (normalizedText.match(/(water|shower|wash|hose|tap|bath|rins)/)) {
    categoryFocus = "water";
    projectedSavings = { co2Kg: 90, usd: 65 };
  }

  const systemPrompt = `You are the Expert AI Climate Coach of "CarbonVerse AI" platform, a living digital carbon supervisor, carbon accountant, and behavior modification counselor.
Your character is analytical yet motivating. Use strict scientifically accurate sustainability insights in accordance with the GHG Protocol.

**CRITICAL LANGUAGE REQ**:
The user's preferred language is: ${preferredLanguage}. You MUST respond exclusively in this language: ${preferredLanguage}.

**CRITICAL TOPIC BOUNDARY POLICY**:
You are strictly restricted to processing carbon footprint audit, energy optimization, fuel emissions, climate mitigation, environmental footprint, ecology, organic agriculture/diet, and climate change questions. 
If the user's message is not directly related to these sustainable topics, you MUST politely reject and refuse the answer. Ask them to stick to sustainability topics.

At the end of your response, you MUST estimate:
1. Expected CO2 savings in kg if the user adopts the specific habit discussed.
2. Approximate financial (money) savings in USD (or converted equivalent local currency if clear) per year.

Represent these at the end of your message block exactly in this custom format:
[SAVINGS:{"co2Kg": X, "usd": Y}]
where X and Y are numbers representing the potential impact.

User's current profile Context:
- Annual Emissions: ${userContext?.total || 4500} kg CO2
- Carbon Efficiency Score: ${userContext?.score || 55}/100
- Diet: ${userContext?.diet || 'omnivore'}
- Main source of emission: ${userContext?.highestSource || 'Transportation'}

Ensure the advice is specifically tailored to their biggest emitting category, and completely outputted in the ${preferredLanguage} language. Speak directly, with a highly premium, intelligent, objective tone.`;

  const ai = getGeminiClient();
  if (!ai) {
    const fallbackAnswer = getSmartFallbackResponse(lastUserMessage, preferredLanguage, userContext);
    const savingsTag = `\n\n[SAVINGS:{"co2Kg": ${projectedSavings.co2Kg}, "usd": ${projectedSavings.usd}}]`;

    return res.json({
      role: "model",
      content: fallbackAnswer + savingsTag,
      timestamp: new Date().toISOString(),
      projectedSavings
    });
  }

  try {
    // Format full conversational message history using current @google/genai syntax schema
    const formattedHistory = (messages || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // If formattedHistory is empty, seed it with the last message
    if (formattedHistory.length === 0) {
      formattedHistory.push({
        role: "user",
        parts: [{ text: lastUserMessage }]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedHistory,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.75,
      }
    });

    const textResult = response.text || "";

    // Parse out potential savings from format [SAVINGS:{"co2Kg": 123, "usd": 456}]
    let co2Kg = projectedSavings.co2Kg;
    let usd = projectedSavings.usd;
    const match = textResult.match(/\[SAVINGS:\s*({[^}]+})\s*\]/);
    let cleanedText = textResult;
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        co2Kg = parsed.co2Kg || co2Kg;
        usd = parsed.usd || usd;
        cleanedText = textResult.replace(match[0], "").trim();
      } catch (err) {
        console.error("Failed to parse savings metadata", err);
      }
    }

    res.json({
      role: "model",
      content: cleanedText,
      timestamp: new Date().toISOString(),
      projectedSavings: { co2Kg, usd }
    });
  } catch (err: unknown) {
    console.error("Gemini API Error, reverting to localized dynamic fallback:", err);
    const fallbackAnswer = getSmartFallbackResponse(lastUserMessage, preferredLanguage, userContext);
    res.json({
      role: "model",
      content: fallbackAnswer + `\n\n[SAVINGS:{"co2Kg": ${projectedSavings.co2Kg}, "usd": ${projectedSavings.usd}}]`,
      timestamp: new Date().toISOString(),
      projectedSavings
    });
  }
});



// AI Receipt Scanner
app.post("/api/gemini/receipt", async (req, res) => {
  const { imageBase64, textContent } = req.body;

  const systemInstructions = `You are the Expert Carbon Receipt Scanner on the CarbonVerse AI Platform.
Analyze the provided shopping receipt itemization or receipt contents.
Extract the top 3-5 items from this receipt that carry the highest hidden carbon intensity (production, transport, processing).
Calculate or estimate:
- Item name
- Extracted quantity
- Estimated Greenhouse gas (GHG) footprint in CO2 kg
- Sustainability Rating (Green / Amber / Red)
- Eco-friendly Alternative selection that achieves lower footprints.
- The estimated CO2 kg footprint of the suggested eco-friendly alternative item.
- An overall sustainability score for the entire receipt from 0 to 100 (where 100 is extremely low impact and sustainable, and <40 is highly carbon-dense).

You MUST respond strictly in valid minified JSON format fitting this exact schema:
{
  "totalReceiptCO2Kg": number,
  "sustainabilityScore": number,
  "scannedItems": [
    {
      "name": "string",
      "quantity": "string",
      "co2Kg": number,
      "rating": "Green" | "Amber" | "Red",
      "alternative": "string",
      "alternativeCo2Kg": number
    }
  ],
  "overallVerdict": "string"
}`;

  const ai = getGeminiClient();
  if (!ai) {
    // Beautiful fallback scanner response
    const mockScannerResult = {
      totalReceiptCO2Kg: 26.0,
      sustainabilityScore: 45,
      scannedItems: [
        { name: "Sirloin Beef Steak", quantity: "1x", co2Kg: 16.8, rating: "Red", alternative: "Impossible meat patties or local Trout fillet", alternativeCo2Kg: 2.1 },
        { name: "Imported Cherries (Peru)", quantity: "1 Pack", co2Kg: 4.8, rating: "Red", alternative: "Locally sourced Organic Apples", alternativeCo2Kg: 0.6 },
        { name: "Regular Almond Milk (Imported)", quantity: "1L", co2Kg: 2.1, rating: "Amber", alternative: "Local Oat Milk (lower transport & water cost)", alternativeCo2Kg: 0.6 },
        { name: "Recycled Trash Bags", quantity: "1 pack", co2Kg: 0.5, rating: "Green", alternative: "No changes needed (eco optimization active)", alternativeCo2Kg: 0.5 }
      ],
      overallVerdict: "Your scanner identified premium beef steak as the carbon anchor in this receipt. Beef represents 65% of cumulative carbon weight due to land clearance footprints. Swapping high-methane beef with local fish and opting for local seasonal fruits reduces the overall impact by up to 18.5kg today!"
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
      // Add dynamic fallback values just in case AI missed any fields
      if (typeof resultObj.sustainabilityScore !== 'number') {
        resultObj.sustainabilityScore = Math.max(5, Math.round(100 - (resultObj.totalReceiptCO2Kg * 3)));
      }
      if (Array.isArray(resultObj.scannedItems)) {
        resultObj.scannedItems = resultObj.scannedItems.map((item: Record<string, unknown>) => {
          if (typeof item.alternativeCo2Kg !== 'number') {
            item.alternativeCo2Kg = item.rating === 'Green' ? Number(item.co2Kg) : Math.round((Number(item.co2Kg) * 0.2) * 10) / 10;
          }
          return item;
        });
      }
      res.json(resultObj);
    } catch (parseErr) {
      console.error("Receipt parsing error for:", response.text);
      res.status(500).json({ error: "Unable to parse scanned carbon breakdown from receipt", modelOutput: response.text });
    }
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error("Gemini receipt error:", errorDetails);
    res.status(500).json({ error: "Failed to scan receipt carbon impact.", details: errorDetails });
  }
});

// Eco Route Planner
app.post("/api/gemini/route", async (req, res) => {
  const result = RoutePlannerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Please enter a valid starting point and destination.", details: result.error.format() });
  }
  const { start, destination } = result.data;

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
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error("Gemini Route Err:", errorDetails);
    res.status(500).json({ error: "Route analysis failed", details: errorDetails });
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
    
    // Serve static files with custom headers and 1-year max-age caching for fingerprint assets
    app.use(express.static(distPath, {
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        if (filePath.match(/\.(js|css|woff2|webp|png|jpg|jpeg|svg|gif)$/i)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    }));
    
    app.get("*", (req, res) => {
      // Never cache the index.html fallback to keep app updates fresh
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CarbonVerse full-stack engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
