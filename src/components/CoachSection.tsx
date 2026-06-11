import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, User, ShieldAlert, Cpu, 
  HelpCircle, ThumbsUp, Leaf, DollarSign, Globe
} from 'lucide-react';
import { Message, EmissionBreakdown } from '../types';
import MultiStageSkeleton from './MultiStageSkeleton';

interface CoachSectionProps {
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
  English: "Hello! I am your AI Climate Coach. I have loaded your carbon profile and digital twin characteristics. Ask me anything about mitigating emissions, optimizing commute efficiency, transitioning tariffs, or estimating environmental paybacks.",
  Hindi: "नमस्ते! मैं आपका एआई क्लाइमेट कोच हूँ। मैंने आपकी कार्बन प्रोफाइल और डिजिटल ट्विन विशेषताओं को लोड कर लिया है। मुझसे कार्बन उत्सर्जन कम करने, यात्रा दक्षता सुधारने या वित्तीय पर्यावरण बचत पर कुछ भी पूछें।",
  Urdu: "ہیلو! میں آپ کا اے آئی ماحولیاتی مربی ہوں۔ میں نے آپ کا کاربن پروفائل اور کلاؤڈ ڈیجیٹل ٹوئن ڈیٹا لوڈ کیا ہے۔ اخراج کو کم کرنے یا ماحولیاتی بچت پر مجھ سے بلا جھجھک کچھ भी پوچھیں۔",
  Tamil: "வணக்கம்! நான் உங்கள் ஏஐ காலநிலை பயிற்சியாளர். உமிழ்வைக் குறைப்பது, பயண செயல்திறனை மேம்படுத்துவது ಅಥವಾ சுற்றுச்சூழல் சேமிப்பு பற்றி என்னிடம் எதையும் கேளுங்கள்.",
  Punjabi: "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਏਆਈ ਜਲਵਾਯੂ ਕੋਚ ਹਾਂ। ਕਾਰਬਨ ਨਿਕਾਸ ਘਟਾਉਣ, ਯਾਤਰਾ ਕੁਸ਼ਲਤਾ ਸੁਧਾਰਨ ਜਾਂ ਵਾਤਾਵਰਣ ਬਚਤ ਬਾਰੇ ਮੈਨੂੰ ਕੁਝ ਵੀ ਪੁੱਛੋ।",
  Bhojpuri: "प्रणाम! हम रउआ एआई क्लाइमेट कोच हईं। रउआ कार्बन उत्सर्जन कम करे खातिर, यात्रा कुशलता सुधारे खातिर चाहे कवनो पर्यावरण ले बचत पर कवनो सवाल पूछ सकीं।",
  Kannada: "ನಮಸ್ತೆ! ನಾನು ನಿಮ್ಮ ಎಐ ಹವಾಮಾನ ತರಬೇತುದಾರ. ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆ ಕಡಿತ, ಪ್ರಯಾಣದ ದಕ್ಷತೆ ಉತ್ತಮಗೊಳಿಸುವಿಕೆ ಅಥವಾ ಕೈಗೆಟುಕುವ ವೆಚ್ಚದ ಬಗ್ಗೆ ನನ್ನನ್ನು ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ."
};

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  English: [
    "How can I reduce emissions by 20%?",
    "What is the grid carbon factor of my electric tariff?",
    "Show me commuting switches that save $100+.",
    "Recommend standard diet swaps for low footprints."
  ],
  Hindi: [
    "मैं अपना उत्सर्जन 20% कैसे कम कर सकता हूँ?",
    "मेरे बिजली टैरिफ का ग्रिड कार्बन कारक क्या है?",
    "मुझे ऐसी यात्राएं दिखाएं जिससे ₹10,000+ की बचत हो।",
    "कम कार्बन उत्सर्जन के लिए कुछ बेहतरीन भोजन विकल्प बताएं।"
  ],
  Urdu: [
    "میں اخراج میں 20 فیصد کمی کیسے لا سکتا ہوں؟",
    "میری بجلی کا گریڈ کاربن فیکٹر کیا ہے؟",
    "مماثل روزمرہ کے سفری متبادل دکھائیں جو فنڈز بچائیں۔",
    "کم کاربن خوراک کے انتخاب کے لیے موزوں غذائی تجویز کریں۔"
  ],
  Tamil: [
    "சுற்றுச்சூழல் உமிழ்வை 20% குறைப்பது எப்படி?",
    "எனது மின்சாரத்தின் கார்பன் காரணி என்ன?",
    "பணத்தை சேமிக்கும் பயண மாற்றங்களை காட்டு.",
    "குறைந்த உமிழ்வுக்கான உணவு மாற்றங்களை பரிந்துரைக்கவும்."
  ],
  Punjabi: [
    "ਮੈਂ ਆਪਣਾ ਨਿਕਾਸ 20% ਕਿਵੇਂ ਘਟਾ ਸਕਦਾ ਹਾਂ?",
    "ਮੇਰੀ ਬਿਜਲੀ ਟੈਰਿਫ ਦਾ ਗ੍ਰਿਡ ਕਾਰਬਨ ਫੈਕਟਰ ਕੀ ਹੈ?",
    "ਫੰਡ ਬਚਾਉਣ ਲਈ ਵਾਤਾਵਰਣ ਅਨੁਕੂਲ ਸਫ਼ਰ ਵਿਕਲਪ ਦਿਖਾਓ।",
    "ਘੱਟ ਕਾਰਬਨ ਫੁੱਟਪ੍ਰਿੰਟ ਲਈ ਭੋਜਨ ਬਦਲਾਵ ਸੁਝਾਓ।"
  ],
  Bhojpuri: [
    "हम आपन उत्सर्जन 20% कइसे कम कर सकीं?",
    "हमार बिजली के बिल क कार्बन फैक्टर का बा?",
    "पैसा बचावे वाला यात्रा के उपाय बताईं।",
    "कम कार्बन उत्सर्जन खातिर बढ़िया खाना के सुझाव दीं।"
  ],
  Kannada: [
    "ನನ್ನ ಹೊರಸೂಸುವಿಕೆಯನ್ನು ಶೇಕಡಾ 20 ರಷ್ಟು ಕಡಿಮೆ ಮಾಡುವುದು ಹೇಗೆ?",
    "ನನ್ನ ವಿದ್ಯುತ್ ಶಕ್ತಿಯ ಇಂಗಾಲದ ಅಂಶ ಎಷ್ಟು?",
    "ಹಣ ಉಳಿಸುವ ಉತ್ತಮ ಸಾರಿಗೆ ಬದಲಾವಣೆಗಳನ್ನು ತೋರಿಸಿ.",
    "ಕಡಿಮೆ ಹೊರಸೂಸುವಿಕೆಗಾಗಿ ಹಸಿರು ಆಹಾರ ಕ್ರಮಗಳನ್ನು ಸೂಚಿಸಿ."
  ]
};

const PLACEHOLDERS_BY_LANG: Record<string, string> = {
  English: "Ask AI Coach for customizable commuting carbon paybacks...",
  Hindi: "जवाबदेह यात्रा और कम कार्बन बचत के सवाल पूछें...",
  Urdu: "کاربن کی بچت اور سفر کے متبادل کے بارے میں سوال پوچھیں...",
  Tamil: "பயண கார்பன் சேமிப்பு மாற்றங்கள் பற்றி கேட்கவும்...",
  Punjabi: "ਕਾਰਬਨ ਬਚਤ ਅਤੇ ਸਫ਼ਰ ਵਿਕਲਪਾਂ ਬਾਰੇ ਸਵਾਲ ਪੁੱਛੋ...",
  Bhojpuri: "यात्रा आ कार्बन बचत पर सवाल पूछीं...",
  Kannada: "ಸಾರಿಗೆ ಇಂಗಾಲ ನಿಯಂತ್ರಣ ಕ್ರಮಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನಿಸಿ..."
};

const BANNER_BY_LANG: Record<string, string> = {
  English: "Strict Carbon Domain Protection Active: Ask any questions about carbon footprint mitigation, sustainability, green habits, or climate science.",
  Hindi: "सख्त कार्बन डोमेन सुरक्षा सक्रिय: केवल कार्बन उत्सर्जन, पर्यावरण संरक्षण और हरित आदतों के बारे में ही प्रश्न पूछें।",
  Urdu: "کاربن ڈومین کا تحفظ فعال ہے: صرف ماحولیاتی مربی، کاربن کی بچت اور مستحکم عادات پر سوالات پوچھیں۔",
  Tamil: "கார்பன் டொமைன் பாதுகாப்பு செயலில் உள்ளது: கார்பன் தடம், ஆற்றல் சேமிப்பு மற்றும் நிலையான பசுமை பழக்கவழக்கங்கள் தொடர்பான கேள்விகளை மட்டுமே கேட்கவும்.",
  Punjabi: "ਜਲਵਾਯੂ ਖੇਤਰ ਸੁਰੱਖਿਆ ਸਰਗਰਮ: ਕਾਰਬਨ ਨਿਕਾਸ, ਊਰਜਾ ਬਚਤ ਅਤੇ ਵਾਤਾਵਰਣ ਅਨੁਕੂਲ ਆਦਤਾਂ ਬਾਰੇ ਹੀ ਸਵਾਲ ਪੁੱਛੋ।",
  Bhojpuri: "पर्यावरण सुरक्षा सक्रिय: खाली कार्बन उत्सर्जन, हरियर खान-पान आ टिकाऊ आदत से जुड़ल सवाल पूछीं।",
  Kannada: "ಪರಿಸರ ಸಂರಕ್ಷಣಾ ನಿಯಮ ಸಕ್ರಿಯ: ಕೇವಲ ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆ, ಹಸಿರು ಶಕ್ತಿ ಮತ್ತು ಪರಿಸರಸ್ನೇಹಿ ಅಭ್ಯಾಸಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆ ಕೇಳಿ."
};

const COMMIT_LABELS: Record<string, string> = {
  English: "Commit to this option?",
  Hindi: "इस विकल्प का पालन करने का संकल्प लें?",
  Urdu: "کیا آپ اس آپشن کو اختیار کرنا چاہتے ہیں؟",
  Tamil: "இந்த திட்டத்திற்கு உறுதியளிக்கிறீர்களா?",
  Punjabi: "ਕੀ ਤੁਸੀਂ ਇਸ ਵਿਕਲਪ ਨੂੰ ਅਪਣਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
  Bhojpuri: "का रउआ एह उपाय के अपनावे खातिर तैयार बानी?",
  Kannada: "ಈ ಆಯ್ಕೆಯನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಲು ಬಯಸುವಿರಾ?"
};

export default function CoachSection({ userBreakdown }: CoachSectionProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('carbonsteps_selected_language') || 'English';
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cumulativeSavings, setCumulativeSavings] = useState({ co2Kg: 0, usd: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize or re-translate welcome message when selected language changes
  useEffect(() => {
    localStorage.setItem('carbonsteps_selected_language', selectedLanguage);
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        content: INTRO_MESSAGES[selectedLanguage] || INTRO_MESSAGES['English'],
        timestamp: new Date().toISOString()
      }
    ]);
  }, [selectedLanguage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
  };

  const currentSuggestedQuestions = SUGGESTED_QUESTIONS[selectedLanguage] || SUGGESTED_QUESTIONS['English'];
  const currentPlaceholder = PLACEHOLDERS_BY_LANG[selectedLanguage] || PLACEHOLDERS_BY_LANG['English'];
  const currentBanner = BANNER_BY_LANG[selectedLanguage] || BANNER_BY_LANG['English'];
  const currentCommitLabel = COMMIT_LABELS[selectedLanguage] || COMMIT_LABELS['English'];

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

      // If response returned projected savings, aggregate it to cumulative metrics
      if (botMsg.projectedSavings) {
        setCumulativeSavings(prev => ({
          co2Kg: prev.co2Kg + botMsg.projectedSavings.co2Kg,
          usd: prev.usd + botMsg.projectedSavings.usd
        }));
      }

    } catch (err) {
      console.error(err);
      // Localized smart fallback answer matching selected regional language and input keywords
      setTimeout(() => {
        let textResult = "Please focus on traveling efficiency and low-meat nutrition switches.";
        let co2Val = 80;
        let usdVal = 45;

        const norm = text.toLowerCase();
        if (norm.match(/(car|commute|travel|flight|train|bus|cycle|transit|mile|drive|vehicle)/)) {
          textResult = selectedLanguage === 'Hindi' ? "सार्वजनिक वाहनों या 5 किमी से कम यात्रा के लिए साइकिल का उपयोग करके आप वार्षिक 340 किलो कार्बनEmission बाचा सकते हैं।" :
                       selectedLanguage === 'Urdu' ? "ٹرانسپورٹ کے لیے پبلک ٹرانسپورٹ یا سائیکل کا استعمال کر کے آپ سالانہ 340 کلوگرام کاربن بچا سکتے ہیں۔" :
                       selectedLanguage === 'Tamil' ? "8 கிமீக்கும் குறைவான தூரத்திற்கு பொது போக்குவரத்து அல்லது மிதிவண்டியை பயன்படுத்துவதன் மூலம் ஆண்டுக்கு 340 கிலோ கார்பன் உமிழ்வைக் குறைக்கலாம்." :
                       selectedLanguage === 'Punjabi' ? "8 ਕਿਲੋਮੀਟਰ ਤੋਂ ਘੱਟ ਦੂਰੀ ਲਈ ਸਾਈਕਲ ਜਾਂ ਜਨਤਕ ਸਾਧਨਾਂ ਦੀ ਵਰਤੋਂ ਨਾਲ ਸਾਲਾਨਾ 340 ਕਿਲੋ ਕਾਰਬਨ ਬਚਾਓ।" :
                       selectedLanguage === 'Bhojpuri' ? "8 किमी से कम यात्रा खातिर साइकिल भा सार्वजनिक बस-ट्रेन के इस्तेमाल कके रउआ सालाने 340 किलो कार्बन बाचा सकीं।" :
                       selectedLanguage === 'Kannada' ? "8 ಕಿಮೀಗಿಂತ ಕಡಿಮೆ ದೂರಕ್ಕೆ ಸೈಕಲ್ ಅಥವಾ ಸಾರ್ವಜನಿಕ ಸಾರಿಗೆ ಬಳಸಿ ವರ್ಷಕ್ಕೆ 340 ಕೆಜಿ ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆಯನ್ನು ನಿಯಂತ್ರಿಸಿ." :
                       "By switching to public commutes or active cycling for routes under 8 km, you prevent up to 340kg of CO2 and save nearly $200 per year.";
          co2Val = 340;
          usdVal = 200;
        } else if (norm.match(/(electricity|energy|solar|power|led|bulb|heater|ac|fan|light|standby|kilowatt)/)) {
          textResult = selectedLanguage === 'Hindi' ? "LED बल्बों का उपयोग करने, वाटर हीटर को 2 डिग्री कम करने और बेफालतू उपकरणों को बंद करने से 180 किलोग्राम CO2 बचता है।" :
                       selectedLanguage === 'Urdu' ? "ایل ای ڈی لائٹس کا استعمال اور غیر ضروری برقی آلات کو بند کرنے سے سالانہ 180 کلوگرام کاربن بچتا ہے۔" :
                       selectedLanguage === 'Tamil' ? "எல்இடி விளக்குகள் மற்றும் தேவையற்ற மின் சாதனங்களை அணைப்பதன் மூலம் 180 கிலோ CO2 உமிழ்வை குறைக்கலாம்." :
                       selectedLanguage === 'Punjabi' ? "LED ਬੱਲਬਾਂ ਦੀ ਵਰਤੋਂ ਅਤੇ ਲੋੜ ਨਾ ਹੋਣ 'ਤੇ ਬਿਜਲੀ ਬੰਦ ਕਰਨ ਨਾਲ ਸਾਲਾਨਾ 180 ਕਿਲੋ CO2 ਬਚਾਓ।" :
                       selectedLanguage === 'Bhojpuri' ? "LED बलिया बार के आ अनावस्यक पंखा-टीभी बंद कइला से रउआ सालाने 180 किलो कार्बन बाचा सकीं।" :
                       selectedLanguage === 'Kannada' ? "ಎಲ್ಇಡಿ ಬಲ್ಬ್‌ ಬಳಸಿ ಹಾಗೂ ಅನಗತ್ಯ ವಿದ್ಯುತ್ ಉಪಕರಣಗಳನ್ನು ಬಂದ್ ಮಾಡುವ ಮೂಲಕ ವರ್ಷಕ್ಕೆ 180 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿಸಿ." :
                       "Using LED lighting, optimizing thermostats by 2 degrees Celsius, and disabling vampire loads can offset 180kg CO2 and save $120.";
          co2Val = 180;
          usdVal = 120;
        } else if (norm.match(/(diet|food|vegan|veget|meat|cook|grocery|eat|waste|compost|shakahari|bhojan|khana)/)) {
          textResult = selectedLanguage === 'Hindi' ? "हफ्ते में 4 दिन शाकाहारी या पेड़-पौधे आधारित आहार अपनाने से वार्षिक भोजन कार्बन फुटप्रिंट 450 किलोग्राम कम हो सकता है।" :
                       selectedLanguage === 'Urdu' ? "ہفتے میں 4 دن سبزی خور یا پودوں پر مبنی خوراک اپنا کر اپنے سالانہ کاربن اثرات کو 450 کلوگرام تک کم کریں۔" :
                       selectedLanguage === 'Tamil' ? "வாரத்தில் 4 நாட்கள் தாவர அடிப்படையிலான உணவுகளை உட்கொள்வதன் மூலம் ஆண்டுக்கு 450 கிலோ கார்பன் உமிழ்வைக் குறைக்கலாம்." :
                       selectedLanguage === 'Punjabi' ? "ਹਫ਼ਤੇ ਵਿੱਚ 4 ਦਿਨ ਸ਼ਾਕਾਹਾਰੀ ਜਾਂ ਪੌਦਿਆਂ 'ਤੇ ਅਧਾਰਤ ਭੋਜਨ ਖਾਣ ਨਾਲ ਸਾਲਾਨਾ 450 ਕਿਲੋ ਭੋਜਨ ਕਾਰਬਨ ਘਟਾਇਆ ਜਾ ਸਕਦਾ ਹੈ।" :
                       selectedLanguage === 'Bhojpuri' ? "हफ्ता में 4 दिन शाकाहारी भोजन खइला से भोजन के कार्बन फुटप्रिंट सालाने 450 किलो तक कम हो जाई।" :
                       selectedLanguage === 'Kannada' ? "ವಾರದಲ್ಲಿ 4 ದಿನ ಹಸಿರು ಸಸ್ಯಾಹಾರಿ ಆಹಾರ ಸೇವಿಸುವುದರಿಂದ ವರ್ಷಕ್ಕೆ 450 ಕೆಜಿ ಇಂಗಾಲದ ಹೊರೆ ಕಡಿಮೆ ಮಾಡಲು ಸಾಧ್ಯವಿದೆ." :
                       "Adopting vegetarian options just 4 days a week reduces dietary footprint demand by 450kg CO2 annually while saving $180.";
          co2Val = 450;
          usdVal = 180;
        } else {
          textResult = selectedLanguage === 'Hindi' ? "एक छोटा कदम: 5 किमी से कम यात्रा के लिए बाइक/पैदल चलें, बिजली कम करें और हरियर भोजन खाएं जिससे सालाने साल में 400 किलोग्राम कार्बन घट सके।" :
                       selectedLanguage === 'Urdu' ? "چھوٹے اقدام: پبلک ٹرانسپورٹ کا استعمال کریں، توانائی بچائیں اور سالانہ 400 کلوگرام کاربن کم کریں۔" :
                       selectedLanguage === 'Tamil' ? "சிறிய நடவடிக்கை: பொது போக்குவரத்து அல்லது நடப்பதன் மூலம் உமிழ்வை ஆண்டுக்கு 400 கிலோ குறைக்கலாம்." :
                       selectedLanguage === 'Punjabi' ? "ਛੋਟਾ ਕਦਮ: 5 ਕਿਲੋਮੀਟਰ ਤੋਂ ਘੱਟ ਪੈਦਲ/ਸਾਈਕਲ ਚਲੋ ਅਤੇ ਸਾਲਾਨਾ 400 ਕਿਲੋ ਕਾਰਬਨ ਘਟਾਓ।" :
                       selectedLanguage === 'Bhojpuri' ? "छोट कदम: कम दूरी खातिर पैदल चलीं भा साइकिल चलाईं आ सालाने 400 किलो कार्बन बाची।" :
                       selectedLanguage === 'Kannada' ? "ಸಣ್ಣ ಬದಲಾವಣೆ: ಸಣ್ಣ ಪ್ರಯಾಣಕ್ಕೆ ಸೈಕಲ್ ಅಥವಾ ಇಂಗಾಲ ನಿಯಂತ್ರಣ ಕ್ರಮಗಳನ್ನು ಮತ್ತು ಹಸಿರು ತರಕಾರಿ ಆಹಾರಗಳ ಮೂಲಕ 400 ಕೆಜಿ ಕಡಿತಗೊಳಿಸಿ." :
                       "Climate action starts with minor everyday switches. Focus on transit selection and sustainable energy to save up to 400kg of CO2.";
          co2Val = 400;
          usdVal = 150;
        }

        const fallbackMsg: Message = {
          id: `bot_${Date.now()}`,
          role: 'model',
          content: textResult,
          timestamp: new Date().toISOString(),
          projectedSavings: { co2Kg: co2Val, usd: usdVal }
        };
        setMessages(prev => [...prev, fallbackMsg]);
        setCumulativeSavings(prev => ({
          co2Kg: prev.co2Kg + co2Val,
          usd: prev.usd + usdVal
        }));
      }, 1000);
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

  return (
    <div id="ai-coach-section" className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-white">
      {/* Cumulative impact ledger card left */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden h-max">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-15 bg-carbon-accent" />
        
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-carbon-accent/10 text-carbon-accent rounded border border-carbon-accent/20 text-[10px] font-mono">
            <Cpu className="w-3 h-3" />
            AI MITIGATION ACCOUNTANT
          </div>
          <h3 className="text-xl font-display font-medium text-white">Your Mitigation Ledger</h3>
          <p className="text-xs text-slate-400">Commit to actions suggested by your Coach to record cumulative sustainability projections.</p>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="bg-white/5 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">CO₂ Prevented</span>
              <div className="flex items-center gap-1">
                <Leaf className="w-4 h-4 text-carbon-primary" />
                <span className="text-lg font-bold font-mono text-white">{cumulativeSavings.co2Kg} <span className="text-[10px] font-sans text-slate-400">kg</span></span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Direct Savings</span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-carbon-secondary" />
                <span className="text-lg font-bold font-mono text-white">${cumulativeSavings.usd} <span className="text-[10px] font-sans text-slate-400">/yr</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 mt-6 space-y-2">
          <h5 className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Loaded Carbon Baseline:</h5>
          {userBreakdown && (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Footprint:</span>
                <span className="font-mono text-white">{(userBreakdown.total / 1000).toFixed(1)} tons CO₂/yr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Efficiency Index:</span>
                <span className="font-mono text-carbon-primary">{userBreakdown.carbonScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Source:</span>
                <span className="text-carbon-secondary font-medium">{getHighestSource(userBreakdown)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main chat window right */}
      <div className="lg:col-span-3 glass-panel rounded-2xl flex flex-col h-[520px] overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-carbon-primary to-carbon-secondary flex items-center justify-center shadow-lg shadow-carbon-primary/10">
              <Sparkles className="w-4 h-4 text-carbon-dark" />
            </div>
            <div>
              <h4 className="font-medium text-white text-sm font-display">AI Climate Coach</h4>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-carbon-primary rounded-full animate-ping" />
                Gemini Model 3.5 Active
              </span>
            </div>
          </div>

          {/* Local Language Selector Dropdown inside the Widget Header */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-white/10 px-3 py-1.5 rounded-xl">
            <Globe className="w-3.5 h-3.5 text-carbon-primary animate-pulse" aria-hidden="true" />
            <label htmlFor="coach-lang-select" className="sr-only">Select Coaching Language</label>
            <select
              id="coach-lang-select"
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="bg-transparent text-xs text-white border-none outline-none font-medium cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-white text-xs">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dedicated Strict Carbon Topic Policy banner */}
        <div className="px-5 py-2 bg-emerald-950/30 border-b border-emerald-900/40 flex items-center gap-2">
          <Leaf className="w-3.5 h-3.5 text-carbon-primary animate-pulse flex-shrink-0" />
          <p className="text-[10px] text-emerald-400 font-medium leading-normal">
            <span className="font-bold uppercase tracking-wider font-mono">Strict Carbon Domain Protection:</span> {currentBanner}
          </p>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => {
            const isBot = m.role === 'model';
            return (
              <div 
                key={m.id} 
                className={`flex gap-3 max-w-full ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-carbon-secondary" />
                  </div>
                )}
                
                <div className="space-y-1 max-w-[85%]">
                  <div className={`p-4 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                    isBot 
                      ? 'bg-white/5 border border-white/5 text-slate-200' 
                      : 'bg-carbon-accent/20 border border-carbon-accent/30 text-white'
                  }`}>
                    {m.content}
                    
                    {/* Embedded interactive saving voucher tags inside chat response */}
                    {m.projectedSavings && (
                      <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between bg-carbon-primary/5 p-3 rounded-lg border border-carbon-primary/15">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Leaf className="w-4 h-4 text-carbon-primary" />
                          <span>{currentCommitLabel}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-carbon-primary">+{m.projectedSavings.co2Kg}kg CO₂</span>
                          <span className="text-carbon-secondary">${m.projectedSavings.usd}/yr</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 block font-mono px-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {!isBot && (
                  <div className="w-7 h-7 rounded-full bg-carbon-accent/20 border border-carbon-accent/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-100" />
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="max-w-[90%] md:max-w-[70%]">
              <MultiStageSkeleton 
                stages={[
                  "Consulting climate twin profile...",
                  "Evaluating scope 3 grid matrices...",
                  "Computing carbon mitigation paybacks...",
                  "Formulating personalized green habit suggestions..."
                ]}
                durationMs={1800}
              />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested Prompt Options */}
        <div className="px-5 py-2.5 bg-slate-950/20 border-t border-slate-900 border-dashed flex gap-2 overflow-x-auto no-scrollbar">
          {currentSuggestedQuestions.map((q, qidx) => (
            <button
              key={qidx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[11px] text-slate-400 bg-white/5 border border-white/5 hover:border-carbon-primary hover:text-carbon-primary transition-all px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Input bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-4 bg-slate-950/40 border-t border-slate-900 flex gap-3"
        >
          <label htmlFor="coach-chat-input" className="sr-only">Ask AI Coach for carbon footprint questions</label>
          <input
            id="coach-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentPlaceholder}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-carbon-primary outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message to AI Coach"
            className="w-11 h-11 bg-gradient-to-r from-carbon-primary to-carbon-secondary hover:brightness-110 text-carbon-dark font-bold rounded-xl flex items-center justify-center cursor-pointer transition-all disabled:opacity-40"
          >
            <Send className="w-5 h-5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}

