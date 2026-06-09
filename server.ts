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
      general: "Climate action starts with minor everyday switches. Focus on transit selection, sustainable nutrition, and reducing standby appliance wastes to save up to 400kg of annual CO2!\n\nHere is your custom 3-step schedule:\n- Shift short trips underneath 5km to walking or cycling.\n- Incorporate plant-based meals 2-3 times per week to offset agricultural footprint.\n- Configure smart power strips to cancel standby electricity leaks.",
      travel: "By switching to public commutes, train transit, or active cycling for routes under 8 km, you prevent up to 340kg of air transport intensity emissions and save nearly $200 per year.",
      energy: "Using LED lighting, optimizing thermostats by 2 degrees Celsius, and disabling phantom standby power loads can offset 180kg CO2 and save $120 annually.",
      diet: "Adopting vegetarian or tree-based dietary options just 4 days a week reduces dietary footprint demand by 450kg CO2 annually while saving $180 in grocery bills.",
      water: "Reducing shower times by 3 minutes and using full cold-water cycles for washing machines mitigates 90kg of annual heating fuel carbon.",
      validationError: "As your dedicated AI Climate Advisor, my expertise is strictly configured for questions about carbon footprints, environmental sustainability, climate change, greenhouse gas calculations, energy efficiency, and eco-friendly habit changes. Please request guidance within these sustainability fields!",
      actionLabel: "Commit to this recommendation"
    },
    Hindi: {
      general: "जलवायु संरक्षण की शुरुआत रोजमर्रा के छोटे बदलावों से होती है। वर्ष में 400 किलोग्राम CO2 की बचत करने के लिए ईंधन अनुकूलन और हरित आहार को अपनाएं!\n\nयहाँ आपके लिए 3 आसान कदम दिए गए हैं:\n- 5 किमी से कम की छोटी यात्राओं को चलने या साइकिल चलाने में बदलें।\n- कृषि उत्पाद कार्बन को कम करने के लिए प्रति सप्ताह 2-3 बार पौधे आधारित भोजन शामिल करें।\n- बिजली के लीकेज को रोकने के लिए स्मार्ट पावर स्ट्रिप्स सेट करें।",
      travel: "8 किमी से कम की दूरी के लिए साइकिल या सार्वजनिक वाहनों का उपयोग करके आप वार्षिक 340 किलोग्राम कार्बन उत्सर्जन बचा सकते हैं और लगभग ₹16,000 बचा सकते हैं।",
      energy: "LED बल्बों का उपयोग करने, वाटर हीटर तापमान को 2 डिग्री कम करने और निष्क्रिय उपकरणों को बंद करने से 180 किलोग्राम CO2 और बिजली का बिल बचता है।",
      diet: "हफ्ते में 4 दिन शाकाहारी या पेड़-पौधे आधारित आहार अपनाने से वार्षिक भोजन कार्बन फुटप्रिंट 450 किलोग्राम कम हो सकता है और किराना खर्च बच सकता है।",
      water: "नहाने के समय को 3 मिनट कम करने और ठंडे पानी से कपड़े धोने से वार्षिक गर्मी ईंधन उत्सर्जन में 90 किलोग्राम की कमी आती है।",
      validationError: "आपके जलवायु सलाहकार के रूप में, मेरी विशेषज्ञता विशेष रूप से कार्बन उत्सर्जन, पर्यावरण संरक्षण और पर्यावरण-अनुकूल आदतों के प्रश्नों के लिए बनी है। कृपया इसी से जुड़े सवाल पूछें।",
      actionLabel: "इस सुझाव का पालन करने का संकल्प लें"
    },
    Urdu: {
      general: "ماحولیاتی تحفظ کا آغاز روزمرہ کی چھوٹی تبدیلیوں سے ہوتا ہے۔ کاربن کے اخراج میں سالانہ 400 کلوگرام بچت کے لیے توانائی اور سبز غذا کا دانشمندانہ استعمال کریں۔\n\nیہاں آپ کے لیے 3 آسان اقدامات ہیں:\n- 5 کلومیٹر سے کم کے سفر کے لیے پیدल چلیں یا سائیکل استعمال کریں۔\n- زراعتی کاربن کم کرنے کے لیے پودوں پر مبنی غذا ہفتے میں 2-3 بار آزمائیں۔\n- اضافی بجلی کے رساؤ کو روکنے کے لیے اسمارٹ پاور سٹرپس کا استعمال کریں۔",
      travel: "8 کلومیٹر سے کم کے سفر کے لیے پبلک ٹرانسپورٹ یا سائیکل کا استعمال کر کے آپ سالانہ 340 کلوگرام کاربن بچا سکتے ہیں اور ہزاروں روپے کی بچت کر سکتے ہیں۔",
      energy: "ایل ای ڈی لائٹس کا استعمال اور غیر ضروری برقی آلات کو بند کرنے سے سالانہ 180 کلوگرام کاربن اور اہم مالی بچت حاصل ہوتی ہے۔",
      diet: "ہفتے میں 4 دن سبزی خور یا پودوں پر مبنی خوراک اپنا کر اپنے سالانہ کاربن اثرات کو 450 کلوگرام تک کم کریں اور کھانے پینے کے بجٹ میں بچत کریں۔",
      water: "نہانے کے وقت کو 3 منٹ کم کر کے اور ٹھنڈے پانی کے واش کا استعمال کر کے سالانہ 90 کلوگرام ایندھن کا کاربن بچائیں۔",
      validationError: "آپ کے ماحولیاتی مربی کے طور پر، میری مہارت کاربن فٹ پرنٹس، ماحولیاتی تسلسل، اور سبز عادات تک محدود ہے۔ براہ کرم اس دائرے کے اندر سوالات پوچھیں۔",
      actionLabel: "اس اختیار پر عمل پیرا ہونے کی تصدیق کریں"
    },
    Tamil: {
      general: "சுற்றுச்சூழல் பாதுகாப்பு நமது அன்றாட சிறு மாற்றங்களில் இருந்து தொடங்குகிறது. உங்கள் போக்குவரத்து தேர்வுகள் மற்றும் நிலையான பசுமை உணவுகள் மூலம் ஆண்டுக்கு 400 கிலோ CO2 ஐ சேமிக்கலாம்!\n\nஇதோ உங்களுக்கான 3-படி வழிகாட்டி:\n- 5 கிமீக்கும் குறைவான தூரத்தை நடைபயிற்சி அல்லது மிதிவண்டிக்கு மாற்றுங்கள்.\n- வாரத்திற்கு 2-3 முறை தாவர அடிப்படையிலான உணவை உண்ணுங்கள்.\n- தேவையற்ற மின் இழப்புகளைத் தவிர்க்க ஸ்மார்ட் பவர் ஸ்ட்ரிப்களைப் பயன்படுத்துங்கள்.",
      travel: "8 கிமீக்கும் குறைவான தூரத்திற்கு பொது போக்குவரத்து அல்லது மிதிவண்டியை பயன்படுத்துவதன் மூலம் ஆண்டுக்கு 340 கிலோ கார்பன் உமிழ்வை குறைத்து கணிசமான பணத்தை சேமிக்கலாம்.",
      energy: "எல்இடி விளக்குகள் மற்றும் தேவையற்ற மின் சாதனங்களை அணைப்பதன் மூலம் 180 கிலோ CO2 உமிழ்வையும் மின் கட்டணத்தையும் எளிதாக குறைக்கலாம்.",
      diet: "வாரத்தில் 4 நாட்கள் தாவர அடிப்படையிலான உணவுகளை உட்கொள்வதன் மூலம் ஆண்டுக்கு 450 கிலோ கார்பன் உமிழ்வைக் குறைக்கலாம் மற்றும் மளிகை செலவை மிச்சப்படுத்தலாம்.",
      water: "குளிக்கும் நேரத்தை 3 நிமிடங்கள் குறைப்பதன் மூலம் ஆண்டிற்கு 90 கிலோ எரிபொருள் உமிழ்வை தவிர்க்க முடியும்.",
      validationError: "உங்கள் காலநிலை ஆலோசகராக, கார்பன் தடம், ஆற்றல் சேமிப்பு ಮತ್ತು நிலையான பழக்கவழக்கங்கள் தொடர்பான கேள்விகளுக்கு மட்டுமே என்னால் பதிலளிக்க முடியும்.",
      actionLabel: "இந்த பசுமை திட்டத்திற்கு உறுதியளிக்கவும்"
    },
    Punjabi: {
      general: "ਜਲਵਾਯੂ ਸੰਭਾਲ ਦੀ ਸ਼ੁਰੂਆਤ ਰੋਜ਼ਾਨਾ ਦੇ ਛੋਟੇ ਬਦਲਾਵਾਂ ਤੋਂ ਹੁੰਦੀ ਹੈ। ਸਾਲਾਨਾ 400 ਕਿਲੋ CO2 ਦੀ ਬਚਤ ਲਈ ਹਰੀ ਖੁਰਾਕ ਅਤੇ ਬਿਜਲੀ ਅਨੁਕੂਲਤਾ ਅਪਣਾਓ!\n\nਇਹ ਹਨ ਤੁਹਾਡੇ ਲਈ 3 ਕਦਮ:\n- 5 ਕਿਲੋਮੀਟਰ ਤੋਂ ਘੱਟ ਦੇ ਸਫ਼ਰ ਨੂੰ ਪੈਦਲ ਜਾਂ ਸਾਈਕਲ ਵਿੱਚ ਬਦਲੋ।\n- ਹਫ਼ਤੇ ਵਿੱਚ 2-3 ਵਾਰ ਪੌਦਿਆਂ 'ਤੇ ਅਧਾਰਤ ਭੋਜਨ ਨੂੰ ਸ਼ਾਮਲ ਕਰੋ।\n- ਵਾਧੂ ਬਿਜਲੀ ਲੀਕ ਨੂੰ ਰੋਕਣ ਲਈ ਸਮਾਰਟ ਪਾਵਰ ਸਟ੍ਰਿਪ ਦੀ ਵਰਤੋਂ ਕਰੋ।",
      travel: "8 ਕਿਲੋਮੀਟਰ ਤੋਂ ਘੱਟ ਦੂਰੀ ਲਈ ਸਾਈਕਲ ਜਾਂ ਜਨਤਕ ਸਾਧਨਾਂ ਦੀ ਵਰਤੋਂ ਨਾਲ ਸਾਲਾਨਾ 340 ਕਿਲੋ ਕਾਰਬਨ ਬਚਾਓ ਅਤੇ ਬਾਲਣ ਦਾ ਖਰਚਾ ਘਟਾਓ।",
      energy: "ਬਿਜਲੀ ਉਪਕਰਨਾਂ ਨੂੰ ਲੋੜ ਨਾ ਹੋਣ 'ਤੇ ਬੰਦ ਰੱਖਣ ਅਤੇ LED ਬੱਲਬਾਂ ਦੀ ਵਰਤੋਂ ਨਾਲ ਸਾਲਾਨਾ 180 ਕਿਲੋ CO2 ਅਤੇ ਬਿਜਲੀ ਦਾ ਬਿੱਲ ਬਚਾਇਆ ਜਾ ਸਕਦਾ ਹੈ।",
      diet: "ਹਫ਼ਤੇ ਵਿੱਚ 4 ਦਿਨ ਸ਼ਾਕਾਹਾਰੀ ਜਾਂ ਪੌਦਿਆਂ 'ਤੇ ਅਧਾਰਤ ਭੋਜਨ ਖਾਣ ਨਾਲ ਸਾਲਾਨਾ 450 ਕਿਲੋ ਭੋਜਨ ਕਾਰਬਨ ਘਟਾਇਆ ਜਾ ਸਕਦਾ ਹੈ ਅਤੇ ਪੈਸੇ ਬਚਾਏ ਜਾ ਸਕਦੇ ਹਨ।",
      water: "ਨਹਾਉਣ ਦੇ ਸਮੇਂ ਨੂੰ 3 ਮਿੰਟ ਘਟਾ ਕੇ ਅਤੇ ਠੰਢੇ ਪਾਣੀ ਨਾਲ ਕੱਪੜੇ ਧੋ ਕੇ ਸਾਲਾਨਾ 90 ਕਿਲੋ ਕਾਰਬਨ ਬਚਾਓ।",
      validationError: "ਤੁਹਾਡੇ ਜਲਵਾਯੂ ਕੋਚ ਵਜੋਂ, ਮੇਰੀ ਮੁਹਾਰਤ ਸਿਰਫ਼ ਕਾਰਬਨ ਨਿਕਾਸ, ਊਰਜਾ ਬਚਤ, ਅਤੇ ਵਾਤਾਵਰਣ ਅਨੁਕੂਲ ਆਦਤਾਂ ਬਾਰੇ ਸਵਾਲਾਂ ਲਈ ਹੈ।",
      actionLabel: "ਇਸ ਹਰੀ ਆਦਤ ਦਾ ਸੰਕਲਪ ਲਓ"
    },
    Bhojpuri: {
      general: "पर्यावरण बचावे के सुरुआत रोजमर्रा के छोट-छोट बदलाव से होला। सालाने 400 किलो CO2 बचावे खातिर हरियर खान-पान आ बिजली के सही उपयोग करीं!\n\nइहाँ रउआ खातिर 3 गो छोट कदम बा:\n- 5 किमी से कम दूरी खातिर पैदल चलीं चाहे साइकिल चलाईं।\n- हफ्ता में 2-3 बार पौधा आधारित भोजन कइल सुरू करीं।\n- फालतू के बिजली लीक से बचे खातिर स्मार्ट पावर स्ट्रिप लगाईं।",
      travel: "8 किमी से कम दूरी खातिर साइकिल चाहे सरकारी बस-ट्रेन के इस्तेमाल कके रउआ सालाने 340 किलो कार्बनEmission बाचा सकीं आ भाड़ा के खूब पइसा बचा सकीं।",
      energy: "LED बलिया बार के, आ बेफालतू के पंखा-टीभी बंद कके रउआ 180 किलो कार्बन आ ढेर सारा बिजली के बिल के पइसा बचा सकीं।",
      diet: "हफ्ता में 4 दिन शाकाहारी भोजन खइला से भोजन के कार्बन फुटप्रिंट सालाने 450 किलो तक कम हो जाई आ सालाने खूब पइसा बची।",
      water: "नहाए के समय 3 मिनट कम कइला से आ ठंढा पानी से कपड़ा धोइला से सालाने 90 किलो गरम पानी के ईंधन बच जाई।",
      validationError: "रउआ पर्यावरण सलाहकार होखला के नाते, हमार काम खाली कार्बन उत्सर्जन, खेती-बारी आ पर्यावरण बचावे से जुड़ल बा। कृपा कके इहे सब सवाल पूछीं।",
      actionLabel: "एह सुन्दर आदत खातिर संकल्प लीं"
    },
    Kannada: {
      general: "ಪರಿಸರ ಸಂರಕ್ಷಣೆ ನಮ್ಮ ದೈನಂದಿನ ಸಣ್ಣ ಬದಲಾವಣೆಗಳಿಂದ ಆರಂಭವಾಗುತ್ತದೆ. ಸಾರಿಗೆ ಮತ್ತು ಹಸಿರು ತರಕಾರಿ ಆಹಾರಗಳ ಮೂಲಕ ವರ್ಷಕ್ಕೆ 400 ಕೆಜಿ CO2 ಉಳಿಸಿ!\n\nಆರಂಭಿಸಲು 3 ಸರಳ ಹೆಜ್ಜೆಗಳು:\n- 5 ಹೆಜ್ಜೆಯಿಂದ ಕಡಿಮೆ ದೂರಕ್ಕೆ ನಡೆದುಕೊಂಡು ಹೋಗಿ ಅಥವಾ ಸೈಕಲ್ ಬಳಸಿ.\n- ಕೃಷಿ ಹೊರಸೂಸುವಿಕೆಯನ್ನು ಗಣನೀಯವಾಗಿ ತಗ್ಗಿಸಲು ವಾರಕ್ಕೆ 2-3 ಬಾರಿ ಸಸ್ಯಾಹಾರಿ ಊಟ ಆರಿಸಿ.\n- ವಿದ್ಯುತ್ ಸೋರಿಕೆ ತಡೆಯಲು ಸ್ಮಾರ್ಟ್ ಪವರ್ ಕಾರ್ಡ್‌ಗಳನ್ನು ಬಳಸಿ.",
      travel: "8 ಕಿಮೀಗಿಂತ ಕಡಿಮೆ ದೂರಕ್ಕೆ ಸೈಕಲ್ ಅಥವಾ ಸಾರ್ವಜನಿಕ ಸಾರಿಗೆ ಬಳಸಿ ವರ್ಷಕ್ಕೆ 340 ಕೆಜಿ ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆಯನ್ನು ನಿಯಂತ್ರಿಸಿ ಮತ್ತು ಹಣ ಉಳಿಸಿ.",
      energy: "ಎಲ್ಇಡಿ ಬಲ್ಬ್‌ ಬಳಸಿ ಹಾಗೂ ಅನಗತ್ಯ ವಿದ್ಯುತ್ ಉಪಕರಣಗಳನ್ನು ಬಂದ್ ಮಾಡುವ ಮೂಲಕ ವರ್ಷಕ್ಕೆ 180 ಕೆಜಿ ಇಂಗಾಲ ಮತ್ತು ವಿದ್ಯುತ್ ಬಿಲ್ ಉಳಿಸಿ.",
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
    // Elegant dynamic bilingual/multilingual fallback simulation if API Key is not set
    const fallbackAnswer = langConfig[categoryFocus];
    const savingsTag = `\n\n[SAVINGS:{"co2Kg": ${projectedSavings.co2Kg}, "usd": ${projectedSavings.usd}}]`;

    return res.json({
      role: "model",
      content: fallbackAnswer + savingsTag,
      timestamp: new Date().toISOString(),
      projectedSavings
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: lastUserMessage,
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
        // Strip the raw tag from user view for cleaner visual renders
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
  } catch (err: any) {
    console.error("Gemini API Error, reverting to localized dynamic fallback:", err);
    // Graceful error recovery with high-fidelity localized answers
    const fallbackAnswer = langConfig[categoryFocus];
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
