const { getAll, getRow, cleanExpiredCrops } = require('../database/database');
const geminiService = require('../services/geminiService');

// Crop name standardizer
const standardCrops = ['paddy', 'maize', 'cotton', 'chilli', 'groundnut', 'tomato', 'onion', 'wheat', 'sugarcane', 'pulses', 'soybean', 'mustard', 'potato', 'turmeric', 'bajra'];

const detectCrop = (text) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const crop of standardCrops) {
    if (lower.includes(crop)) return crop;
  }
  // Telugu
  if (lower.includes('వరి') || lower.includes('ధాన్యం')) return 'paddy';
  if (lower.includes('మొక్కజొన్న')) return 'maize';
  if (lower.includes('పత్తి')) return 'cotton';
  if (lower.includes('మిర్చి')) return 'chilli';
  if (lower.includes('వేరుశనగ')) return 'groundnut';
  if (lower.includes('టమోటా')) return 'tomato';
  if (lower.includes('ఉల్లిపాయ') || lower.includes('ఉల్లి')) return 'onion';
  if (lower.includes('గోధుమ')) return 'wheat';
  if (lower.includes('చెరకు')) return 'sugarcane';
  if (lower.includes('పప్పు') || lower.includes('కందులు')) return 'pulses';
  if (lower.includes('సోయాబీన్')) return 'soybean';
  if (lower.includes('ఆవాలు')) return 'mustard';
  if (lower.includes('బంగాళాదుంప')) return 'potato';
  if (lower.includes('పసుపు')) return 'turmeric';
  if (lower.includes('సజ్జలు')) return 'bajra';

  // Hindi & Marathi
  if (lower.includes('धान') || lower.includes('चावल') || lower.includes('भात')) return 'paddy';
  if (lower.includes('मक्का') || lower.includes('मका')) return 'maize';
  if (lower.includes('कपास') || lower.includes('कापूस')) return 'cotton';
  if (lower.includes('मिर्च') || lower.includes('मिरची')) return 'chilli';
  if (lower.includes('मूंगफली') || lower.includes('भुईमूग')) return 'groundnut';
  if (lower.includes('टमाटर') || lower.includes('टोमॅटो')) return 'tomato';
  if (lower.includes('प्याज') || lower.includes('कांदा')) return 'onion';
  if (lower.includes('गेहूं') || lower.includes('गहू')) return 'wheat';
  if (lower.includes('गन्ना') || lower.includes('ऊस')) return 'sugarcane';
  if (lower.includes('दाल') || lower.includes('तूर')) return 'pulses';
  if (lower.includes('सोयाबीन')) return 'soybean';
  if (lower.includes('सरसों') || lower.includes('मोहरी')) return 'mustard';
  if (lower.includes('आलू') || lower.includes('बटाटा')) return 'potato';
  if (lower.includes('हल्दी') || lower.includes('हळद')) return 'turmeric';
  if (lower.includes('बाजरा') || lower.includes('बाजरी')) return 'bajra';

  // Tamil & Kannada
  if (lower.includes('நெல்') || lower.includes('ಭತ್ತ')) return 'paddy';
  if (lower.includes('சோளம்') || lower.includes('ಮೆಕ್ಕೆಜೋಳ')) return 'maize';
  if (lower.includes('பருத்தி') || lower.includes('ಹತ್ತಿ')) return 'cotton';
  if (lower.includes('மிளகாய்') || lower.includes('ಮೆಣಸಿನಕಾಯಿ')) return 'chilli';
  if (lower.includes('வேர்க்கடலை') || lower.includes('ಕಡಲೆಕಾಯಿ')) return 'groundnut';
  if (lower.includes('தக்காளி') || lower.includes('ಟೊಮೆಟೊ')) return 'tomato';
  if (lower.includes('வெங்காயம்') || lower.includes('ಈರುಳ್ಳಿ')) return 'onion';
  if (lower.includes('கோதுமை') || lower.includes('ಗೋಧಿ')) return 'wheat';

  return null;
};

// AI Price Search Endpoint (Strictly never invents prices)
const getPriceAdvice = async (req, res) => {
  try {
    const { crop, language = 'en' } = req.body;
    if (!crop || !crop.trim()) {
      return res.status(400).json({ success: false, message: 'Crop name is required.' });
    }

    const detected = detectCrop(crop) || crop.trim().toLowerCase();

    // Query verified market prices
    const prices = await getAll(
      'SELECT * FROM market_prices WHERE LOWER(crop_name) LIKE ? ORDER BY price_date DESC, price DESC LIMIT 3',
      [`%${detected}%`]
    );

    if (!prices || prices.length === 0) {
      const messages = {
        en: `Current reliable price information is unavailable for "${crop}". We do not display unverified price estimates.`,
        te: `"${crop}" కోసం ప్రస్తుతం విశ్వసనీయమైన మార్కెట్ ధర సమాచారం అందుబాటులో లేదు. ధృవీకరించని ధరల అంచనాలను మేము ప్రదర్శించము.`,
        hi: `"${crop}" के लिए वर्तमान में विश्वसनीय मंडी मूल्य जानकारी उपलब्ध नहीं है। हम असत्यापित मूल्य अनुमान नहीं दिखाते हैं।`
      };
      return res.json({
        success: true,
        available: false,
        message: messages[language] || messages.en,
        data: null
      });
    }

    const primary = prices[0];
    const avgPrice = Math.round(prices.reduce((acc, p) => acc + p.price, 0) / prices.length);
    const minPrice = Math.min(...prices.map(p => p.price));
    const maxPrice = Math.max(...prices.map(p => p.price));

    // Determine trend based on price level
    let trend = 'Stable';
    let trendTe = 'స్థిరంగా ఉంది';
    let trendHi = 'स्थिर';

    if (primary.price > avgPrice * 1.03) {
      trend = 'Upward / High Demand';
      trendTe = 'పెరుగుదల / అధిక డిమాండ్';
      trendHi = 'बढ़त / उच्च मांग';
    } else if (primary.price < avgPrice * 0.97) {
      trend = 'Softening / High Arrivals';
      trendTe = 'తగ్గుదల / ఎక్కువ రాకలు';
      trendHi = 'गिरावट / आवक में वृद्धि';
    }

    // AI Explanations in selected language
    let explanation = '';
    if (language === 'te') {
      explanation = `${primary.crop_name} ధర ${primary.market_name} లో క్వింటాలుకు ₹${primary.price} గా నమోదైంది (తేదీ: ${primary.price_date}). మార్కెట్ ట్రెండ్: ${trendTe}. ఇతర కేంద్రాల సగటు ధర ₹${avgPrice}/క్వింటాల్. నాణ్యత గ్రేడ్ A ఉన్న పంటకు వ్యాపారులు అధిక ధర చెల్లించే అవకాశం ఉంది.`;
    } else if (language === 'hi') {
      explanation = `${primary.crop_name} का भाव ${primary.market_name} में ₹${primary.price}/${primary.unit} दर्ज किया गया है (दिनांक: ${primary.price_date})। मंडी का रुख: ${trendHi}। अन्य प्रमुख मंडियों में औसत भाव ₹${avgPrice}/क्विंटल रहा। ग्रेड A गुणवत्ता वाली फसल के लिए बेहतर दाम प्राप्त हो सकते हैं।`;
    } else {
      explanation = `The verified mandi price for ${primary.crop_name} at ${primary.market_name} is ₹${primary.price} per ${primary.unit} as of ${primary.price_date}. Market Trend: ${trend}. Across key tracking mandis, prices range between ₹${minPrice} and ₹${maxPrice}. Verified institutional buyers usually offer higher spot payments for Grade A moisture-controlled lots.`;
    }

    res.json({
      success: true,
      available: true,
      data: {
        crop: primary.crop_name,
        market: primary.market_name,
        location: `${primary.district ? primary.district + ', ' : ''}${primary.state || 'National APMC'}`,
        price: primary.price,
        unit: primary.unit,
        date: primary.price_date,
        source: primary.source,
        price_range: `₹${minPrice} - ₹${maxPrice}`,
        trend: language === 'te' ? trendTe : language === 'hi' ? trendHi : trend,
        explanation,
        other_mandis: prices.slice(1).map(p => ({
          market: p.market_name,
          price: `₹${p.price} ${p.unit}`,
          date: p.price_date
        }))
      }
    });
  } catch (error) {
    console.error('Error in getPriceAdvice:', error.message);
    res.status(500).json({ success: false, message: 'Current reliable price information is unavailable.' });
  }
};

// AI Chatbot Assistant Endpoint
const handleChat = async (req, res) => {
  try {
    const { message, userType = 'farmer', language = 'en', history = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    await cleanExpiredCrops();
    const queryText = message.toLowerCase().trim();
    const detectedCrop = detectCrop(queryText);

    // Prepare grounded market context from official DB
    let priceContext = '';
    let buyerContext = '';
    let cropContext = '';

    if (detectedCrop) {
      const priceRows = await getAll(
        `SELECT market, district, state, commodity, modal_price, unit, arrival_date, source 
         FROM gov_mandi_cache 
         WHERE LOWER(commodity) LIKE ? 
         ORDER BY arrival_date DESC LIMIT 2`,
        [`%${detectedCrop}%`]
      );
      if (priceRows && priceRows.length > 0) {
        priceContext = priceRows.map(p => `${p.commodity} at ${p.market} (${p.district}, ${p.state}): ₹${p.modal_price}/${p.unit} (Date: ${p.arrival_date})`).join('\n');
      }
    }

    const activeBuyers = await getAll(
      `SELECT r.crop_name, r.quantity, r.quality, r.price, b.market_name, b.district, b.state 
       FROM buyer_crop_requirements r 
       JOIN buyers b ON r.buyer_id = b.id 
       WHERE r.status = 'ACTIVE' ${detectedCrop ? 'AND LOWER(r.crop_name) LIKE ?' : ''} 
       ORDER BY r.price DESC LIMIT 2`,
      detectedCrop ? [`%${detectedCrop}%`] : []
    );
    if (activeBuyers && activeBuyers.length > 0) {
      buyerContext = activeBuyers.map(b => `${b.market_name} in ${b.district}: Buying ${b.crop_name} (${b.quantity} Qtl, Grade ${b.quality}) at ₹${b.price}/Qtl`).join('\n');
    }

    // 1. Attempt Real Gemini AI Multilingual Response with conversation history
    try {
      const geminiResult = await geminiService.chatWithGemini({
        message,
        userType,
        language,
        history,
        marketContext: {
          verifiedPrices: priceContext,
          activeBuyers: buyerContext,
          activeCrops: cropContext
        }
      });

      if (geminiResult && geminiResult.reply) {
        return res.json({
          success: true,
          reply: geminiResult.reply,
          language: language,
          engine: 'Google Gemini AI'
        });
      }
    } catch (geminiErr) {
      console.warn('[Gemini Chat Fallback]: Proceeding to rule-based response engine.');
    }

    // Helper to enforce strictly 3 to 4 lines on fallback responses
    const formatToStrictLines = (text) => {
      let lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 4) lines = lines.slice(0, 4);
      return lines.join('\n');
    };

    // Scenario 1: User asks for crop price
    if (queryText.includes('price') || queryText.includes('ధర') || queryText.includes('రేటు') || queryText.includes('भाव') || queryText.includes('कीमत') || queryText.includes('today')) {
      if (detectedCrop) {
        const priceRow = await getRow(
          'SELECT * FROM market_prices WHERE LOWER(crop_name) LIKE ? ORDER BY price_date DESC LIMIT 1',
          [`%${detectedCrop}%`]
        );
        if (priceRow) {
          if (language === 'te') {
            reply = `🌾 ${priceRow.crop_name} మార్కెట్ ధర వివరాలు:
- మార్కెట్: ${priceRow.market_name} (${priceRow.state})
- ధృవీకరించిన ధర: ₹${priceRow.price} / ${priceRow.unit} (తేదీ: ${priceRow.price_date})
- గ్రేడ్ A పంటకు వ్యాపారులు అధిక ధర చెల్లిస్తారు.`;
          } else if (language === 'hi') {
            reply = `🌾 ${priceRow.crop_name} का सत्यापित मंडी भाव:
- मंडी: ${priceRow.market_name} (${priceRow.state})
- ताजा भाव: ₹${priceRow.price} / ${priceRow.unit} (दिनांक: ${priceRow.price_date})
- ग्रेड A गुणवत्ता वाली फसल पर व्यापारी बेहतर मूल्य देते हैं।`;
          } else {
            reply = `🌾 Verified Mandi Price for ${priceRow.crop_name}:
- Market: ${priceRow.market_name} (${priceRow.state})
- Price: ₹${priceRow.price} per ${priceRow.unit} (${priceRow.price_date})
- Tip: High-grade lots receive premium spot rates from verified buyers.`;
          }
        } else {
          reply = language === 'te' 
            ? `క్షమించండి, "${detectedCrop}" కోసం ప్రస్తుత అధికారిక ధర నమోదు కాలేదు.
మేము మార్కెట్ నుండి ధృవీకరించని ఊహాజనిత ధరలను అందించము.
దయచేసి కాసేపటి తర్వాత ఇతర మార్కెట్ పేర్లతో మళ్ళీ ప్రయత్నించండి.`
            : language === 'hi'
            ? `क्षमा करें, "${detectedCrop}" के लिए वर्तमान में विश्वसनीय मंडी भाव उपलब्ध नहीं है।
हम असत्यापित या काल्पनिक मूल्य प्रदर्शित नहीं करते हैं।
कृपया कुछ समय बाद पुनः प्रयास करें या अन्य मंडी खोजें।`
            : `Verified daily mandi data is currently unavailable for "${detectedCrop}".
KISSAN-HUB connects directly to APMC records and never invents prices.
Please try again shortly or check the Live Mandi Prices tab.`;
        }
      } else {
        reply = language === 'te'
          ? `మీరు ఏ పంట మార్కెట్ ధర తెలుసుకోవాలనుకుంటున్నారు?
ఉదాహరణ: "వరి ధర ఎంత?", "మిర్చి రేటు", లేదా "టమోటా ధర".
పంట పేరు నమోదు చేస్తే నేటి అధికారిక APMC ధర లభిస్తుంది.`
          : language === 'hi'
          ? `आप किस फसल का आधिकारिक मंडी भाव जानना चाहते हैं?
उदाहरण: "धान का भाव क्या है?", "कपास का ताजा रेट", या "टमाटर भाव"।
फसल का नाम लिखकर भेजें, सटीक सरकारी आंकड़े प्राप्त होंगे।`
          : `Which crop's verified APMC mandi rate would you like to check?
Examples: "Paddy price", "Cotton rate", "Chilli price", or "Tomato".
Type the specific crop name to get official APMC benchmark figures.`;
      }
      return res.json({ success: true, reply: formatToStrictLines(reply), language });
    }

    // Scenario 2: Farmer asks for nearby buyers or "who is buying"
    if (queryText.includes('buyer') || queryText.includes('కొనేవారు') || queryText.includes('వ్యాపారి') || queryText.includes('खरीदार') || queryText.includes('व्यापारी') || queryText.includes('sell')) {
      let buyerQuery = `
        SELECT r.crop_name, r.quantity, r.quality, r.price, b.market_name, b.full_name, b.state, b.district, b.phone
        FROM buyer_crop_requirements r
        JOIN buyers b ON r.buyer_id = b.id
        WHERE r.status = 'ACTIVE'
      `;
      const params = [];
      if (detectedCrop) {
        buyerQuery += ` AND LOWER(r.crop_name) LIKE ?`;
        params.push(`%${detectedCrop}%`);
      }
      buyerQuery += ` ORDER BY r.price DESC LIMIT 2`;

      const activeBuyers = await getAll(buyerQuery, params);

      if (activeBuyers && activeBuyers.length > 0) {
        if (language === 'te') {
          reply = `🏢 ప్రస్తుత యాక్టివ్ కొనుగోలుదారులు:
` + activeBuyers.map(b => `- ${b.market_name} (${b.district}): ${b.crop_name} ₹${b.price}/క్విం (${b.quantity} Qtl, గ్రేడ్ ${b.quality})`).join('\n') + `
- సంప్రదించడానికి డ్యాష్‌బోర్డ్‌లోని 'Sell My Crop' విభాగం చూడండి.`;
        } else if (language === 'hi') {
          reply = `🏢 सक्रिय सत्यापित खरीदार:
` + activeBuyers.map(b => `- ${b.market_name} (${b.district}): ${b.crop_name} ₹${b.price}/क्विंटल (${b.quantity} Qtl, ग्रेड ${b.quality})`).join('\n') + `
- संपर्क करने के लिए 'Sell My Crop' सेक्शन का उपयोग करें।`;
        } else {
          reply = `🏢 Active Verified Buyers in KISSAN-HUB:
` + activeBuyers.map(b => `- ${b.market_name} (${b.district}): Buying ${b.crop_name} at ₹${b.price}/Qtl (${b.quantity} Qtl, Grade ${b.quality})`).join('\n') + `
- Use 'Sell My Crop' tab for direct secure contact and phone-masked calls.`;
        }
      } else {
        reply = language === 'te'
          ? `ప్రస్తుతం ${detectedCrop ? detectedCrop : 'ఈ పంట'} కోసం యాక్టివ్ కొనుగోలుదారులు లేరు.
రోజువారీ కొత్త డిమాండ్లు క్రమం తప్పకుండా నమోదు చేయబడుతున్నాయి.
మీరు పంటను రిజిస్టర్ చేసి మార్కెట్‌లో 5 రోజులు ఉంచవచ్చు.`
          : language === 'hi'
          ? `वर्तमान में ${detectedCrop ? detectedCrop : 'इस फसल'} के लिए कोई खरीदार उपलब्ध नहीं है।
नए मांग पत्र प्रतिदिन खरीदारों द्वारा पोस्ट किए जाते हैं।
अपनी फसल लिस्ट करें, यह 5 दिनों तक बाजार में लाइव रहेगी।`
          : `No active buyer demand is currently listed for ${detectedCrop || 'this selection'}.
New institutional procurement demands are published daily.
List your crop in 'Register Crop' to remain live for 5 days.`;
      }
      return res.json({ success: true, reply: formatToStrictLines(reply), language });
    }

    // Scenario 3: Buyer asks about available crops / registered farmers
    if (queryText.includes('farmer') || queryText.includes('available') || queryText.includes('రైతు') || queryText.includes('అందుబాటు') || queryText.includes('किसान') || queryText.includes('उपलब्ध') || queryText.includes('stock')) {
      let cropQuery = `
        SELECT c.crop_name, c.crop_type, c.quantity, c.quality, c.harvested_date, c.expires_at,
               f.full_name as farmer_name, f.state, f.district, f.phone
        FROM farmer_crops c
        JOIN farmers f ON c.farmer_id = f.id
        WHERE c.status = 'ACTIVE' AND c.expires_at > CURRENT_TIMESTAMP
      `;
      const params = [];
      if (detectedCrop) {
        cropQuery += ` AND LOWER(c.crop_name) LIKE ?`;
        params.push(`%${detectedCrop}%`);
      }
      cropQuery += ` ORDER BY c.created_at DESC LIMIT 2`;

      const availableProduce = await getAll(cropQuery, params);

      if (availableProduce && availableProduce.length > 0) {
        if (language === 'te') {
          reply = `🌾 మార్కెట్‌లో అందుబాటులో ఉన్న తాజా పంటలు:
` + availableProduce.map(p => `- ${p.crop_name} (${p.quantity} Qtl, గ్రేడ్ ${p.quality}): రైతు ${p.farmer_name} (${p.district})`).join('\n') + `
- పూర్తి వివరాలు మరియు కొనుగోలుకు 'Find Farmers' చూడండి.`;
        } else if (language === 'hi') {
          reply = `🌾 बाजार में उपलब्ध ताजा फसलें:
` + availableProduce.map(p => `- ${p.crop_name} (${p.quantity} Qtl, ग्रेड ${p.quality}): किसान ${p.farmer_name} (${p.district})`).join('\n') + `
- विवरण देखने व खरीदारी के लिए 'Find Farmers' पर जाएं।`;
        } else {
          reply = `🌾 Available Fresh Produce Lots:
` + availableProduce.map(p => `- ${p.crop_name} (${p.quantity} Qtl, Grade ${p.quality}): Farmer ${p.farmer_name} (${p.district})`).join('\n') + `
- Browse 'Find Farmers / Crops' for GPS-sorted distance and direct purchase.`;
        }
      } else {
        reply = language === 'te'
          ? `ప్రస్తుతం 5 రోజుల వ్యాలిడిటీ గల తాజా ${detectedCrop || 'పంటల'} నిల్వలు లేవు.
రైతులు నిత్యం కొత్త పంటలను నమోదు చేస్తుంటారు.
దయచేసి కాసేపటి తర్వాత మళ్ళీ శోధించండి.`
          : language === 'hi'
          ? `वर्तमान में 5-दिवसीय सक्रिय अवधि वाली कोई ${detectedCrop || 'फसल'} उपलब्ध नहीं है।
किसान प्रतिदिन नई फसलें पंजीकृत करते हैं।
कृपया कुछ समय पश्चात पुनः जांचें।`
          : `No active 5-day fresh farmer lots are currently available for ${detectedCrop || 'this selection'}.
Farmers list newly harvested lots continuously.
Please check back shortly in 'Find Farmers'.`;
      }
      return res.json({ success: true, reply: formatToStrictLines(reply), language });
    }

    // Scenario 4: Quality grading advisory & selling tips
    if (queryText.includes('quality') || queryText.includes('grade') || queryText.includes('నాణ్యత') || queryText.includes('గ్రేడ్') || queryText.includes('गुणवत्ता') || queryText.includes('check')) {
      if (language === 'te') {
        reply = `🔍 పంట నాణ్యత మరియు గ్రేడింగ్ ప్రమాణాలు:
- గ్రేడ్ A+: 92-99% స్కోరు, 12% లోపు తేమ, ఎగుమతి నాణ్యత.
- గ్రేడ్ A/B: కనీస మలినాలు, మంచి రంగు, సరైన పరిపక్వత.
- అమ్మేముందు ధాన్యాన్ని ఎండబెట్టి, శుభ్రం చేసి నమోదు చేయండి.`;
      } else if (language === 'hi') {
        reply = `🔍 फसल गुणवत्ता एवं ग्रेडिंग मानक:
- ग्रेड A+: 92-99% स्कोर, 12% से कम नमी, प्रीमियम निर्यात गुणवत्ता।
- ग्रेड A/B: न्यूनतम अशुद्धियां, एक समान दाना व सही परिपक्वता।
- फसल लिस्ट करने से पूर्व उसे सुखाकर व साफ करके रखें।`;
      } else {
        reply = `🔍 Crop Quality & Grading Criteria:
- Grade A+: 92-99% Score, moisture < 12%, zero defects (Top spot price).
- Grade A/B: Standard moisture 12-14%, high uniformity, minimal impurities.
- Tip: Proper winnowing and sun-drying secures immediate buyer purchases.`;
      }
      return res.json({ success: true, reply: formatToStrictLines(reply), language });
    }

    // Default assistant response - strictly 3-4 lines
    if (language === 'te') {
      reply = `నమస్కారం! నేను మీ కిసాన్-హబ్ AI సహాయకుడిని.
- తాజా ప్రభుత్వ APMC మండి ధరలను తెలుసుకోవచ్చు.
- సమీప కొనుగోలుదారులు మరియు పంట నాణ్యత గ్రేడింగ్ సమాచారం పొందవచ్చు.
మీ ప్రశ్నకు సంబంధించిన సమాచారాన్ని వెంటనే అడగండి.`;
    } else if (language === 'hi') {
      reply = `नमस्ते! मैं आपका किसान-हब AI कृषि सहायक हूँ।
- आप आज के आधिकारिक APMC मंडी भाव जान सकते हैं।
- निकटतम खरीदार और फसल गुणवत्ता ग्रेडिंग की जानकारी प्राप्त कर सकते हैं।
अपनी कृषि आवश्यकता लिखकर पूछें, तुरंत सहायता मिलेगी।`;
    } else {
      reply = `Hello! I am your KISSAN-HUB Multilingual AI Assistant.
- Get official APMC government mandi rates instantly.
- Find verified buyers, demand lots, and quality grading standards.
Ask your specific query to receive immediate factual guidance.`;
    }

    res.json({
      success: true,
      reply: formatToStrictLines(reply),
      language
    });
  } catch (error) {
    console.error('Error in handleChat:', error.message);
    res.status(500).json({
      success: false,
      message: 'AI assistant is temporarily unavailable. Please try again.'
    });
  }
};

// AI Dynamic Website Translation endpoint (Translates UI text dictionary using Gemini)
const translateWebsiteWithAi = async (req, res) => {
  try {
    const { texts = {}, targetLanguage = 'en' } = req.body;
    if (!texts || typeof texts !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid texts payload.' });
    }

    if (targetLanguage === 'en') {
      return res.json({ success: true, data: texts, engine: 'default' });
    }

    const translated = await geminiService.translateWithGemini({
      texts,
      targetLanguage
    });

    if (translated && typeof translated === 'object') {
      return res.json({
        success: true,
        data: translated,
        targetLanguage,
        engine: 'Google Gemini AI'
      });
    }

    return res.json({
      success: false,
      data: texts,
      message: 'AI translation unavailable, keeping current dictionary.'
    });
  } catch (err) {
    console.error('[AI Translation Exception]:', err.message);
    return res.status(500).json({ success: false, message: 'Translation error.' });
  }
};

// Voice response generator for Web Speech API integration
const getVoiceResponse = async (req, res) => {
  try {
    const { query, language = 'en' } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required.' });
    }

    // Forward to chat logic and generate a clean concise speech response
    req.body.message = query;
    return handleChat(req, res);
  } catch (error) {
    console.error('Error in getVoiceResponse:', error.message);
    res.status(500).json({ success: false, message: 'Speech service temporarily unavailable.' });
  }
};

// Public Mandi Prices endpoint (Accessible by Farmers, Buyers & Public without Admin auth)
const getPublicMandiPrices = async (req, res) => {
  try {
    const prices = await getAll('SELECT * FROM market_prices ORDER BY price_date DESC, crop_name ASC LIMIT 50');
    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Error in getPublicMandiPrices:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve daily mandi prices.' });
  }
};

// AI Crop Quality Assessment from Image Upload (Powered by Google Gemini Vision)
const analyzeCropQuality = async (req, res) => {
  try {
    const { image, crop_name = 'Crop', crop_type = 'Produce', language = 'en' } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Crop image is required for AI quality analysis.' });
    }

    const result = await geminiService.analyzeCropPhotoWithGemini({
      image,
      crop_name,
      crop_type,
      language
    });

    return res.json(result);
  } catch (error) {
    console.error('Error in analyzeCropQuality:', error.message);
    res.status(500).json({ success: false, message: 'AI Quality analysis encountered an error.' });
  }
};

module.exports = {
  getPriceAdvice,
  handleChat,
  translateWebsiteWithAi,
  getVoiceResponse,
  getPublicMandiPrices,
  analyzeCropQuality
};
