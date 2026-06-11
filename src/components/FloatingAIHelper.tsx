import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, X, Send, Sparkles, User, 
  Cpu, Leaf, DollarSign, Globe, Check
} from 'lucide-react';
import { Message, EmissionBreakdown } from '../types';
import MultiStageSkeleton from './MultiStageSkeleton';

interface FloatingAIHelperProps {
  userBreakdown?: EmissionBreakdown;
}

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'Hindi (हिंदी)' },
  { code: 'Urdu', label: 'Urdu (اردو)' },
  { code: 'Tamil', label: 'Tamil (தமிழ்)' },
  { code: 'Punjabi', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'Bhojpuri', label: 'Bhojpuri (भोजपुरी)' },
  { code: 'Kannada', label: 'Kannada (ಕನ್ನಡ)' }
];

const INTRO_MESSAGES: Record<string, string> = {
  English: "Hello Pioneer! I am your 24/7 AI Climate Assistant. How can I help you optimize your carbon profile, analyze receipt impact, or plan eco-friendly commutes today?",
  Hindi: "नमस्ते अग्रणी! मैं आपका 24/7 एआई क्लाइमेट सहायक हूँ। आज आपके कार्बन प्रोफाइल को बेहतर बनाने या पर्यावरण-अनुकूल यात्रा की योजना बनाने में मैं क्या मदद कर सकता हूँ?",
  Urdu: "سلام! میں آپ کا 24/7 اے آئی ماحولیاتی مربی ہوں۔ کاربن فٹ پرنٹس کو کم کرنے یا ماحول دوست سفر کی منصوبہ بندی میں آج میں آپ کی کیا مدد کر سکتا ہوں؟",
  Tamil: "வணக்கம்! நான் உங்கள் 24/7 ஏஐ காலநிலை உதவியாளர். உமிழ்வைக் குறைப்பது, பயண செயல்திறனை மேம்படுத்துவது பற்றி நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
 Punjabi: "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ 24/7 ਏਆਈ ਜਲਵਾਯੂ ਸਹਾਇਕ ਹਾਂ। ਅੱਜ ਕਾਰਬਨ ਪ੍ਰੋਫਾਈਲ ਨੂੰ ਬਿਹਤਰ ਬਣਾਉਣ ਜਾਂ ਸਫ਼ਰ ਦੀ ਯੋਜਨਾ ਬਣਾਉਣ ਵਿੱਚ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
  Bhojpuri: "प्रणाम! हम रउआ 24/7 एआई क्लाइमेट सहायक हईं। रउआ कार्बन उत्सर्जन कम करे भा हरियर यात्रा खातिर कवन मदद चाहीं?",
  Kannada: "ನಮಸ್ತೆ! ನಾನು ನಿಮ್ಮ 24/7 ಎಐ ಹವಾಮಾನ ಸಹಾಯಕ. ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆ ನಿಯಂತ್ರಣ ಮತ್ತು ಗ್ರೀನ್ ಲೈಫ್ ಸ್ಟೈಲ್ ಅಳವಡಿಸಿಕೊಳ್ಳಲು ನಾನು ಇಂದು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
};

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  English: [
    "Recommend standard diet swaps for low footprints.",
    "Show me commuting switches that save $100+.",
    "How do I recycle electronic waste?"
  ],
  Hindi: [
    "कम कार्बन उत्सर्जन के लिए कुछ बेहतरीन भोजन विकल्प बताएं।",
    "मुझे ऐसी यात्राएं दिखाएं जिससे ₹10,000+ की बचत हो।",
    "इलेक्ट्रॉनिक कचरे को रीसायकल कैसे करें?"
  ],
  Urdu: [
    "کم کاربن خوراک کے انتخاب کے لیے موزوں غذائی تجویز کریں۔",
    "روزمرہ کے سفری متبادل دکھائیں جو اہم بچت دیں۔",
    "الیکٹرانک فضلہ کو ٹھکانے لگانے کا صحیح طریقہ کیا ہے؟"
  ],
  Tamil: [
    "குறைந்த உமிழ்வுக்கான உணவு மாற்றங்களை பரிந்துரைக்கவும்.",
    "பணத்தை சேமிக்கும் பயண மாற்றங்களை காட்டு.",
    "மின்னணு கழிவுகளை எவ்வாறு மறுசுழற்சி செய்வது?"
  ],
  Punjabi: [
    "ਘੱਟ ਕਾਰਬਨ ਫੁੱਟਪ੍ਰਿੰਟ ਲਈ ਭੋਜਨ ਬਦਲਾਵ ਸੁਝਾਓ।",
    "ਫੰਡ ਬਚਾਉਣ ਲਈ ਵਾਤਾਵਰਣ ਅਨੁਕੂਲ ਸਫ਼ਰ ਵਿਕਲਪ ਦਿਖਾਓ।",
    "ਇਲੈਕਟ੍ਰਾਨਿਕ ਕੂੜੇ ਨੂੰ ਰੀਸਾਈਕਲ ਕਿਵੇਂ ਕਰੀਏ?"
  ],
  Bhojpuri: [
    "कम कार्बन उत्सर्जन खातिर बढ़िया खाना के सुझाव दीं।",
    "पैसा बचावे वाला यात्रा के उपाय बताईं।",
    "बिजली के कबाड़ सामान कइसे रीसायकल करीं?"
  ],
  Kannada: [
    "ಕಡಿಮೆ ಹೊರಸೂಸುವಿಕೆಗಾಗಿ ಹಸಿರು ಆಹಾರ ಕ್ರಮಗಳನ್ನು ಸೂಚಿಸಿ.",
    "ಹಣ ಉಳಿಸುವ ಉತ್ತಮ ಸಾರಿಗೆ ಬದಲಾವಣೆಗಳನ್ನು ತೋರಿಸಿ.",
    "ವಿದ್ಯುತ್ ಉಪಕರಣಗಳ ಕಸವನ್ನು ಮರುಬಳಕೆ ಮಾಡುವುದು ಹೇಗೆ?"
  ]
};

const PLACEHOLDERS_BY_LANG: Record<string, string> = {
  English: "Type your query...",
  Hindi: "अपना सवाल लिखें...",
  Urdu: "اپنا سوال لکھیں...",
  Tamil: "உங்கள் கேள்வியை தட்டச்சு செய்யவும்...",
  Punjabi: "ਆਪਣਾ ਸਵਾਲ ਲਿਖੋ...",
  Bhojpuri: "कवनो सवाल लिखीं...",
  Kannada: "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಹಾಕಿ..."
};

const HELP_LABELS: Record<string, string> = {
  English: "AI Helper Active",
  Hindi: "एआई सहायक सक्रिय",
  Urdu: "اے آئی مددگار فعال ہے",
  Tamil: "ஏஐ காலநிலை உதவி",
  Punjabi: "ਏਆਈ ਸਹਾਇਕ",
  Bhojpuri: "एआई सहायक",
  Kannada: "ಹವಾಮಾನ ತಜ್ಞ ಎಐ"
};

const BANNER: Record<string, string> = {
  English: "Strict Carbon Policy Protection Active",
  Hindi: "सख्त कार्बन डोमेन सुरक्षा सक्रिय",
  Urdu: "سخت کاربن ڈومین تحفظ سرگرم",
  Tamil: "கார்பன் பாதுகாப்பு செயலில் உள்ளது",
  Punjabi: "ਕਾਰਬਨ ਸੁਰੱਖਿਆ ਸਰਗਰਮ",
  Bhojpuri: "पर्यावरण सुरक्षा सक्रिय",
  Kannada: "ಪರಿಸರ ಸಂರಕ್ಷಣಾ ನಿಯಮ ಸಕ್ರಿಯ"
};

export default function FloatingAIHelper({ userBreakdown }: FloatingAIHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('carbonsteps_selected_language') || 'English';
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPromptedCommit, setHasPromptedCommit] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep local language preference synced with core system preference
  useEffect(() => {
    const syncLang = () => {
      const stored = localStorage.getItem('carbonsteps_selected_language') || 'English';
      if (stored !== selectedLanguage) {
        setSelectedLanguage(stored);
      }
    };
    
    // Initial sync
    syncLang();
    
    // Establish a short interval to check language shifts across views
    const interval = setInterval(syncLang, 1000);
    return () => clearInterval(interval);
  }, [selectedLanguage]);

  // Initial welcome message setting on language change
  useEffect(() => {
    setMessages([
      {
        id: 'floating-welcome',
        role: 'model',
        content: INTRO_MESSAGES[selectedLanguage] || INTRO_MESSAGES['English'],
        timestamp: new Date().toISOString()
      }
    ]);
  }, [selectedLanguage]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages, loading]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLang = e.target.value;
    setSelectedLanguage(nextLang);
    localStorage.setItem('carbonsteps_selected_language', nextLang);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userContext: userBreakdown ? {
            total: userBreakdown.total,
            score: userBreakdown.carbonScore,
            highestSource: getHighestSource(userBreakdown),
            language: selectedLanguage
          } : {
            language: selectedLanguage
          }
        })
      });

      if (!response.ok) {
        throw new Error('Chat failed');
      }

      const botMsg = await response.json();
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error(err);
      // Localized smart fallback answer matching selected regional language and input keywords
      setTimeout(() => {
        let textResult = "Please focus on travel optimization and diet alternatives.";
        let co2Val = 75;
        let usdVal = 30;

        const norm = text.toLowerCase();
        if (norm.match(/(car|commute|travel|flight|train|bus|cycle|transit|mile|drive|vehicle)/)) {
          textResult = selectedLanguage === 'Hindi' ? "समीपस्थ स्थानों के लिए वाहन छोड़ पैदल अथवा साइकिल यात्रा का उपयोग आपको साल भर में 340 किलो कार्बन बचत प्रदान करेगा।" :
                       selectedLanguage === 'Urdu' ? "ٹرانسپورٹ کے لیے پبلک ٹرانسپورٹ یا سائیکل کا استعمال کر کے آپ سالانہ 340 کلوگرام کاربن بچا سکتے ہیں۔" :
                       selectedLanguage === 'Tamil' ? "8 கிமீக்கும் குறைவான தூரத்திற்கு பொது போக்குவரத்து அல்லது மிதிவண்டியை பயன்படுத்துவதன் மூலம் ஆண்டுக்கு 340 கிலோ கார்பன் உமிழ்வைக் குறைக்கலாம்." :
                       selectedLanguage === 'Punjabi' ? "8 ਕਿਲੋਮੀਟਰ ਤੋਂ ਘੱਟ ਦੂਰੀ ਲਈ ਸਾਈਕਲ ਜਾਂ ਜਨਤਕ ਸਾਧਨਾਂ ਦੀ ਵਰਤੋਂ ਨਾਲ ਸਾਲਾਨਾ 340 ਕਿਲੋ ਕਾਰਬਨ ਬਚਾਓ।" :
                       selectedLanguage === 'Bhojpuri' ? "8 किमी से कम यात्रा खातिर साइकिल भा सरकारी बस के इस्तेमाल मज़ेदार आ 340 किलो कार्बन बचावे वाला होखी।" :
                       selectedLanguage === 'Kannada' ? "8 ಕಿಮೀಗಿಂತ ಕಡಿಮೆ ದೂರಕ್ಕೆ ಸೈಕಲ್ ಅಥವಾ ಸಾರ್वಜನಿಕ ಸಾರಿಗೆ ಬಳಸಿ ವರ್ಷಕ್ಕೆ 340 ಕೆಜಿ ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆಯನ್ನು ನಿಯಂತ್ರಿಸಿ." :
                       "Switching routes under 5 miles to cycling saves up to 340kg CO2 and nearly $200 per year.";
          co2Val = 340;
          usdVal = 200;
        } else if (norm.match(/(electricity|energy|solar|power|led|bulb|heater|ac|fan|light|standby|kilowatt)/)) {
          textResult = selectedLanguage === 'Hindi' ? "LED बल्बों और 5-स्टार प्रमाणित उपकरणों का चयन करने से प्रतिवर्ष आपके 180 किलोग्राम CO2 उत्पन्न होने से रोक सकते हैं।" :
                       selectedLanguage === 'Urdu' ? "ایل ای ڈی لائٹس کا استعمال اور غیر ضروری برقی آلات کو بند کرنے سے سالانہ 180 کلوگرام کاربن بچتا ہے۔" :
                       selectedLanguage === 'Tamil' ? "எல்இடி விளக்குகள் மற்றும் தேவையற்ற மின் சாதனங்களை அணைப்பதன் மூலம் 180 கிலோ CO2 உமிழ்வை குறைக்கலாம்." :
                       selectedLanguage === 'Punjabi' ? "LED ਬੱਲਬਾਂ ਦੀ ਵਰਤੋਂ ਅਤੇ ਲੋੜ ਨਾ ਹੋਣ 'ਤੇ ਬਿਜਲੀ ਬੰਦ ਕਰਨ ਨਾਲ ਸਾਲਾਨਾ 180 ਕਿਲੋ CO2 ਬਚਾਓ।" :
                       selectedLanguage === 'Bhojpuri' ? "LED बलिया बार के आ अनावस्यक पंखा-टीभी बंद कइला से रउआ सालाने 180 किलो कार्बन बाचा सकीं।" :
                       selectedLanguage === 'Kannada' ? "ಎಲ್ಇಡಿ ಬಲ್ಬ್‌ ಬಳಸಿ ಹಾಗೂ ಅನಗತ್ಯ ವಿದ್ಯುತ್ ಉಪಕರಣಗಳನ್ನು ಬಂದ್ ಮಾಡುವ ಮೂಲಕ ವರ್ಷಕ್ಕೆ 180 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿಸಿ." :
                       "Using 5-Star rated appliances and smart LEDs offsets up to 180kg CO2 emissions.";
          co2Val = 180;
          usdVal = 120;
        } else if (norm.match(/(diet|food|vegan|veget|meat|cook|grocery|eat|waste|compost|shakahari|bhojan|khana)/)) {
          textResult = selectedLanguage === 'Hindi' ? "भोजन बर्बादी को न्यूनतम कर एवं शाकाहार पद्धतियां अपनाकर आप 450 किलोग्राम कार्बन फुटप्रिंट का शमन कर सकते हैं।" :
                       selectedLanguage === 'Urdu' ? "ہفتے میں 4 دن سبزی خور یا پودوں پر مبنی خوراک اپنا کر اپنے سالانہ کاربن اثرات کو 450 کلوگرام تک کم کریں۔" :
                       selectedLanguage === 'Tamil' ? "வாரத்தில் 4 நாட்கள் தாவர அடிப்படையிலான உணவுகளை உட்கொள்வதன் மூலம் ஆண்டுக்கு 450 கிலோ கார்பன் உமிழ்வைக் குறைக்கலாம்." :
                       selectedLanguage === 'Punjabi' ? "ਹਫ਼ਤੇ ਵਿੱਚ 4 ਦਿਨ ਸ਼ਾਕਾਹਾਰੀ ਜਾਂ ਪੌਦਿਆਂ 'ਤੇ ਅਧਾਰਤ ਭੋਜਨ ਖਾਣ ਨਾਲ ਸਾਲਾਨਾ 450 ਕਿਲੋ ਭੋਜਨ ਕਾਰਬਨ ਘਟਾਇਆ ਜਾ ਸਕਦਾ ਹੈ।" :
                       selectedLanguage === 'Bhojpuri' ? "हफ्ता में 4 दिन शाकाहारी भोजन खइला से भोजन के कार्बन फुटप्रिंट सालाने 450 किलो तक कम हो जाई।" :
                       selectedLanguage === 'Kannada' ? "ವಾರದಲ್ಲಿ 4 ದಿನ ಹಸಿರು ಸಸ್ಯಾಹಾರಿ ಆಹಾರ ಸೇವಿಸುವುದರಿಂದ ವರ್ಷಕ್ಕೆ 450 ಕೆಜಿ ಇಂಗಾಲದ ಹೊರೆ ಕಡಿಮೆ ಮಾಡಲು ಸಾಧ್ಯವಿದೆ." :
                       "Minimizing food waste and switching to a plant-forward diet mitigates 450kg CO2.";
          co2Val = 440;
          usdVal = 150;
        } else {
          textResult = selectedLanguage === 'Hindi' ? "पर्यावरण-अनुकूल दिनचर्या अपनाएं: छोटी यात्राओं में पैदल चलें, LED बल्ब चालू करें, और शाकाहार को प्राथमिकता दें।" :
                       selectedLanguage === 'Urdu' ? "روزمرہ کے چھوٹے اقدامات: کم فاصلے کے لیے پیدل چلیں اور بجلی کی بچت حاصل کریں۔" :
                       selectedLanguage === 'Tamil' ? "சில எளிய யோசனைகள்: சிறிய பயணங்களுக்கு பொது சவாரிகளை அல்லது சைக்கிள் பயன்படுத்தவும்." :
                       selectedLanguage === 'Punjabi' ? "ਛੋਟੇ ਵਾਤਾਵਰਣ ਅਨੁਕੂਲ ਕਦਮ: ਘੱਟ ਦੂਰੀ ਪੈਦਲ ਯਾਤਰਾ ਕਰੋ ਅਤੇ ਬਿਜਲੀ ਬਚਾਓ।" :
                       selectedLanguage === 'Bhojpuri' ? "सुन्दर दिनचर्या: छोट दूरी खातिर पैदल चलीं आ हरियर भोजन खाए के आदत डालीं।" :
                       selectedLanguage === 'Kannada' ? "ಹಸಿರು ಜೀವನಶೈಲಿ ರೂಢಿಸಿಕೊಳ್ಳಿ: ಸಣ್ಣ ಪ್ರಯಾಣಕ್ಕೆ ಸೈಕಲ್ ಅಥವಾ ಇಂಗಾಲ ನಿಯಂತ್ರಣ ಕ್ರಮಗಳನ್ನು ಅನುಸರಿಸಿ." :
                       "Opt for green choices: switch off passive standby hardware, use bicycle commutes, and minimize food wastes.";
          co2Val = 300;
          usdVal = 80;
        }

        const fallbackMsg: Message = {
          id: `bot_${Date.now()}`,
          role: 'model',
          content: textResult,
          timestamp: new Date().toISOString(),
          projectedSavings: { co2Kg: co2Val, usd: usdVal }
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }, 900);
    } finally {
      setLoading(false);
    }
  };

  const getHighestSource = (b: EmissionBreakdown) => {
    const scores = [
      { name: 'Commuting & flights', val: b.transportation },
      { name: 'Grid mix electricity', val: b.electricity },
      { name: 'Diet & food waste', val: b.food },
      { name: 'Consumption shopping', val: b.shopping },
      { name: 'Water & appliances', val: b.water }
    ];
    scores.sort((a, b) => b.val - a.val);
    return scores[0].name;
  };

  const currentSuggested = SUGGESTED_QUESTIONS[selectedLanguage] || SUGGESTED_QUESTIONS['English'];
  const currentPlaceholder = PLACEHOLDERS_BY_LANG[selectedLanguage] || PLACEHOLDERS_BY_LANG['English'];
  const activeLabel = HELP_LABELS[selectedLanguage] || HELP_LABELS['English'];
  const strictBanner = BANNER[selectedLanguage] || BANNER['English'];

  return (
    <div id="floating-ai-assistant" className="fixed bottom-6 right-6 z-[100] font-sans antialiased">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute bottom-16 right-0 w-[92vw] sm:w-[380px] h-[500px] bg-[#0E1712]/95 border border-emerald-500/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
            style={{ originX: 1, originY: 1 }}
          >
            {/* Header bar */}
            <div className="px-4 py-3 bg-[#131F18]/90 border-b border-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold font-display tracking-tight leading-none mb-0.5">{activeLabel}</span>
                  <span className="text-[9px] text-[#10B981] font-mono leading-none font-bold uppercase tracking-widest">{strictBanner}</span>
                </div>
              </div>

              {/* Language Selector in Header */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/45 border border-white/5 py-1 px-2 rounded-lg">
                  <Globe className="w-3 h-3 text-[#10B981]" />
                  <select
                    value={selectedLanguage}
                    onChange={handleLanguageChange}
                    className="bg-transparent text-[10px] text-white border-none outline-none font-medium cursor-pointer"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-slate-900 text-white text-[10px]">
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                  className="p-1 px-[5px] text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {messages.map((m) => {
                const isBot = m.role === 'model';
                return (
                  <div key={m.id} className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}>
                    {isBot && (
                      <div className="w-6 h-6 rounded-full bg-emerald-550/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3 text-[#10B981]" />
                      </div>
                    )}
                    <div className="space-y-0.5 max-w-[85%]">
                      <div className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-line shadow ${
                        isBot 
                          ? 'bg-white/5 text-slate-200 border border-white/5' 
                          : 'bg-emerald-555/20 border border-emerald-500/20 text-white font-medium'
                      }`}>
                        {m.content}

                        {m.projectedSavings && (
                          <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-col gap-1.5 bg-emerald-950/10 p-2 rounded border border-[#10B981]/15">
                            <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                              <span className="text-[#10B981] font-bold">+{m.projectedSavings.co2Kg}kg CO₂</span>
                              <span className="text-amber-300 font-bold">${m.projectedSavings.usd}/yr</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="max-w-[75%]">
                  <MultiStageSkeleton 
                    stages={[
                      "Analyzing eco baseline...",
                      "Translating answer template..."
                    ]}
                    durationMs={900}
                  />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested quick helper questions */}
            <div className="px-3 py-2 bg-black/10 border-t border-white/5 border-dashed flex gap-1.5 overflow-x-auto no-scrollbar">
              {currentSuggested.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="text-[10px] text-slate-400 bg-white/5 border border-dashed border-white/10 px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer hover:border-[#10B981] hover:text-white transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Message input footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 bg-[#111C15] border-t border-emerald-500/10 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentPlaceholder}
                disabled={loading}
                className="flex-1 bg-[#090F0C] border border-[#10B981]/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-emerald-400 placeholder-slate-600 transition-all"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-gradient-to-r from-emerald-550 to-teal-450 hover:brightness-110 text-slate-950 font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#0B130E]" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sparkles Toggle Button icon */}
      <motion.button
        aria-label={isOpen ? "Close AI Helper" : "Open AI Helper"}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#10B981] to-emerald-400 text-[#090F0C] flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-300/30 cursor-pointer relative group-hover:brightness-110 transition-all select-none focus:outline-none"
      >
        <div className="absolute inset-0 rounded-full bg-[#10B981] animate-ping opacity-25" />
        {isOpen ? (
          <X className="w-6 h-6 stroke-[2.5]" />
        ) : (
          <MessageSquare className="w-6 h-6 stroke-[2.5]" />
        )}
      </motion.button>
    </div>
  );
}
