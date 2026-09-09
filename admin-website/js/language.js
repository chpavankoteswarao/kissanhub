// KISSAN-HUB — Centralized Multilingual Translation Engine
// Supports 11 Indian Languages: en, te, hi, ta, kn, ml, mr, bn, gu, pa, or

const translations = {
  en: {
    brand_name: "KISSAN-HUB",
    tagline: "Connecting Farmers. Empowering Markets.",
    landing_subtitle: "A trusted space where farmers find fair markets, buyers find quality crops, and every exchange moves agriculture forward.",
    nav_home: "Home",
    nav_farmer: "Farmer Portal",
    nav_buyer: "Buyer Portal",
    nav_admin: "Admin Access",
    nav_ai: "AI Assistant",
    nav_logout: "Logout",
    welcome: "Welcome",
    hello: "Hello",
    loading: "Loading...",
    save: "Save Changes",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    submit: "Submit",
    back: "Back",
    continue: "Continue",
    search: "Search",
    actions: "Actions",
    view_details: "View Details",
    distance: "Distance",
    phone: "Phone Number",
    location: "Location",
    status: "Status",
    date: "Date",
    active: "Active",
    expired: "Expired",
    quintals: "Quintals",
    price: "Price",
    quantity: "Quantity",
    quality: "Quality",
    crop: "Crop",
    crop_type: "Crop Type",
    crop_name: "Crop Name",
    all_crops: "All Crops",
    confirm_delete: "Are you sure you want to delete this listing?",
    
    // Editorial Landing
    kicker: "GROW • CONNECT • PROSPER",
    hero_title_1: "Better harvests",
    hero_title_2: "start together.",
    hero_banner_quote: "From the field to your future.",
    footer_choice: "Your language, your market, your choice.",

    card_farmer_title: "Farmer",
    card_farmer_desc: "List crops & find buyers",
    card_buyer_title: "Buyer",
    card_buyer_desc: "Source fresh produce",
    card_admin_title: "Admin",
    card_admin_desc: "Manage the ecosystem",

    btn_farmer_login: "Farmer Login",
    btn_farmer_reg: "Farmer Registration",
    btn_buyer_login: "Buyer Login",
    btn_buyer_reg: "Buyer Registration",
    btn_admin_login: "Admin Login",

    // Auth & Forms
    title_farmer_login: "Farmer Login",
    title_farmer_reg: "Farmer Registration",
    title_buyer_login: "Buyer Login",
    title_buyer_reg: "Buyer Registration",
    title_buyer_pwd: "Buyer Password Login",
    title_create_pwd: "Create Buyer Password",
    title_forgot_pwd: "Forgot Password",
    title_admin_login: "Admin Secure Portal",
    enter_phone: "Enter 10-digit Phone Number",
    enter_otp: "Enter 6-digit OTP",
    demo_otp_hint: "Demo OTP is 123456",
    verify_otp: "Verify OTP",
    resend_otp: "Resend OTP",
    register_now: "Register Now",
    back_to_login: "Back to Login",
    forgot_password: "Forgot Password?",
    password: "Password",
    new_password: "New Password",
    confirm_password: "Confirm Password",
    username: "Username",
    full_name: "Full Name",
    market_name: "Market / Business Name",
    state: "State",
    district: "District",
    mandal: "Mandal / Tehsil",
    aadhaar_number: "Aadhaar Number",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    detect_location: "Detect My GPS Location 📍",

    // Dashboard Tabs
    tab_farmer_register_crop: "Register Crop",
    tab_farmer_enrolled: "Enrolled Crops",
    tab_farmer_sell: "Sell My Crop",
    tab_farmer_price: "Live Mandi Prices",
    tab_farmer_profile: "My Profile",
    tab_farmer_ai: "AI Assistant",

    reg_crop_heading: "Register New Crop Listing",
    reg_crop_subheading: "Listings remain active in the live marketplace for exactly 5 days before automatic expiry.",
    harvested_date: "Harvested Date",
    available_quantity: "Available Quantity (Quintals)",
    select_crop_type: "Select Crop Type",
    select_crop_name: "Select Crop Name",
    select_quality: "Select Quality Grade",
    btn_register_crop: "Register Crop Listing",
    
    enrolled_heading: "My Enrolled Crop Listings",
    col_reg_date: "Registered On",
    col_expiry_date: "Expires On (5 Days)",
    col_harvest_date: "Harvest Date",
    no_enrolled_crops: "No active crops registered yet. Use 'Register Crop' to list produce.",

    sell_heading: "Sell My Crop — Nearby Verified Buyers",
    sell_subheading: "GPS-powered buyer matching. Verified buyers sorted nearest to your farm location.",
    btn_find_nearby_buyers: "Find Nearby Buyers",
    filter_by_crop: "Search / Filter by Crop",
    offering_price: "Offering Price",
    required_qty: "Required Qty",
    required_grade: "Required Grade",
    no_buyers_found: "No buyers found matching this crop criteria nearby.",

    price_heading: "Official Daily Government & APMC Mandi Rates",
    price_subheading: "Verified daily market prices updated according to official APMC and MSP benchmarks.",
    search_crop_price_btn: "Check Mandi Rate",
    mandi_name: "Market / Mandi",
    benchmark_rate: "Benchmark Rate",
    price_trend: "Market Trend",
    price_source: "Data Source",
    ai_explanation: "AI Market Analysis",
    price_unavailable: "Current reliable price information is unavailable.",

    tab_buyer_market: "My Market Profile",
    tab_buyer_post_req: "Post Requirement",
    tab_buyer_my_reqs: "Active Requirements",
    tab_buyer_find_farmers: "Find Farmers / Crops",
    tab_buyer_price: "Live Mandi Prices",
    tab_buyer_ai: "AI Assistant",

    post_req_heading: "Post Crop Procurement Requirement",
    btn_post_req: "Publish Requirement",
    active_reqs_heading: "My Active Crop Requirements",
    buying_price: "Buying Price (₹/Quintal)",
    no_active_reqs: "No active procurement requirements posted.",

    search_farmers_heading: "Browse Fresh Available Produce",
    search_farmers_subheading: "Active farmer listings within 5-day freshness window sorted by GPS distance.",
    btn_search_farmers: "Search Available Produce",
    no_farmers_found: "No active farmer crops found matching your selection.",

    ai_title: "KISSAN-HUB AI Agricultural Assistant",
    ai_greeting: "Hello! Ask me about daily government mandi prices, buyers near you, crop quality guidelines, or market trends.",
    ai_placeholder: "Ask in your preferred language...",
    ai_mic_start: "Click to Speak",
    ai_mic_listening: "Listening...",
    ai_speech_error: "Speech recognition is not supported in this browser.",
    
    err_phone_10: "Please enter a valid 10-digit Indian phone number.",
    err_otp_invalid: "Invalid OTP. Demo OTP is 123456.",
    err_not_registered: "Farmer not registered.",
    err_buyer_not_registered: "Buyer not registered.",
    err_login_failed: "Invalid phone number or password.",
    err_network: "Cannot connect to KISSAN-HUB server.",
    err_location_denied: "Location access is required to calculate nearby results.",
    msg_saved: "Profile updated successfully.",
    msg_crop_registered: "Crop registered successfully! Active for 5 days.",
    msg_req_added: "Requirement published successfully.",
    recommended: "Recommended",
    not_recommended: "Not Recommended",
    ai_disabled_no_photo: "AI Verification: Disabled (No Crop Photo)",
    purchase_and_rate: "Mark as Purchased & Rate 5★",
    chat_with_farmer: "Chat with Farmer",
    chat_with_buyer: "Chat with Buyer",
    view_details_of_buyer: "View Details of Buyer",
    view_details_of_farmer: "View Details of Farmer",
    within_50km: "Within 50 km"
  },

  te: {
    brand_name: "కిసాన్-హబ్ (KISSAN-HUB)",
    tagline: "రైతుల కలయిక. మార్కెట్ల బలోపేతం.",
    landing_subtitle: "రైతులు న్యాయమైన మార్కెట్లను, వ్యాపారులు నాణ్యమైన పంటలను పొందే విశ్వసనీయ వేదిక.",
    nav_home: "హోమ్",
    nav_farmer: "రైతు పోర్టల్",
    nav_buyer: "కొనుగోలుదారుల పోర్టల్",
    nav_admin: "అడ్మిన్ లాగిన్",
    nav_ai: "AI సహాయకుడు",
    nav_logout: "లాగ్ అవుట్",
    welcome: "స్వాగతం",
    hello: "నమస్కారం",
    loading: "లోడ్ అవుతోంది...",
    save: "భద్రపరుచు",
    cancel: "రద్దు చేయి",
    delete: "తొలగించు",
    edit: "సవరించు",
    close: "మూసివేయి",
    submit: "సమర్పించు",
    back: "వెనుకకు",
    continue: "కొనసాగించు",
    search: "శోధించండి",
    actions: "చర్యలు",
    view_details: "వివరాలు చూడు",
    distance: "దూరం",
    phone: "ఫోన్ నంబర్",
    location: "ప్రాంతం",
    status: "స్థితి",
    date: "తేదీ",
    active: "యాక్టివ్",
    expired: "గడువు ముగిసింది",
    quintals: "క్వింటాళ్లు",
    price: "ధర",
    quantity: "పరిమాణం",
    quality: "నాణ్యత",
    crop: "పంట",
    crop_type: "పంట రకం",
    crop_name: "పంట పేరు",
    all_crops: "అన్ని పంటలు",
    confirm_delete: "ఈ జాబితాను తొలగించాలనుకుంటున్నారా?",

    kicker: "పండించు • కలుపు • అభివృద్ధి చెందు",
    hero_title_1: "మెరుగైన పంటలు",
    hero_title_2: "కలిసి ప్రారంభమవుతాయి.",
    hero_banner_quote: "పొలం నుండి మీ భవిష్యత్తుకు.",
    footer_choice: "మీ భాష, మీ మార్కెట్, మీ ఎంపిక.",

    card_farmer_title: "రైతు",
    card_farmer_desc: "పంటలను జాబితా చేయండి & వ్యాపారులను కనుగొనండి",
    card_buyer_title: "వ్యాపారి",
    card_buyer_desc: "తాజా పంటలను కొనుగోలు చేయండి",
    card_admin_title: "అడ్మిన్",
    card_admin_desc: "వ్యవస్థను నిర్వహించండి",

    btn_farmer_login: "రైతు లాగిన్",
    btn_farmer_reg: "రైతు నమోదు",
    btn_buyer_login: "వ్యాపారి లాగిన్",
    btn_buyer_reg: "వ్యాపారి నమోదు",
    btn_admin_login: "అడ్మిన్ లాగిన్",

    title_farmer_login: "రైతు లాగిన్",
    title_farmer_reg: "నూతన రైతు నమోదు",
    title_buyer_login: "కొనుగోలుదారుల లాగిన్",
    title_buyer_reg: "నూతన వ్యాపారి నమోదు",
    title_buyer_pwd: "పాస్‌వర్డ్ ద్వారా లాగిన్",
    title_create_pwd: "కొత్త పాస్‌వర్డ్ సృష్టించండి",
    title_forgot_pwd: "పాస్‌వర్డ్ మర్చిపోయారా?",
    title_admin_login: "అడ్మిన్ లాగిన్ పోర్టల్",
    enter_phone: "10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి",
    enter_otp: "6 అంకెల OTP నమోదు చేయండి",
    demo_otp_hint: "డెమో OTP: 123456",
    verify_otp: "OTP ధృవీకరించండి",
    resend_otp: "OTP మళ్లీ పంపండి",
    register_now: "ఇప్పుడే నమోదు చేసుకోండి",
    back_to_login: "లాగిన్‌కు తిరిగి వెళ్ళు",
    forgot_password: "పాస్‌వర్డ్ మర్చిపోయారా?",
    password: "పాస్‌వర్డ్",
    new_password: "కొత్త పాస్‌వర్డ్",
    confirm_password: "పాస్‌వర్డ్ నిర్ధారించండి",
    username: "యూజర్‌నేమ్",
    full_name: "పూర్తి పేరు",
    market_name: "మార్కెట్ / వ్యాపార పేరు",
    state: "రాష్ట్రం",
    district: "జిల్లా",
    mandal: "మండలం",
    aadhaar_number: "ఆధార్ సంఖ్య",
    gender: "లింగం",
    male: "పురుషుడు",
    female: "స్త్రీ",
    other: "ఇతర",
    detect_location: "నా జీపీఎస్ లొకేషన్ గుర్తించు 📍",

    tab_farmer_register_crop: "పంట నమోదు",
    tab_farmer_enrolled: "నమోదైన పంటలు",
    tab_farmer_sell: "పంట అమ్మకం",
    tab_farmer_price: "లైవ్ మండి ధరలు",
    tab_farmer_profile: "నా ప్రొఫైల్",
    tab_farmer_ai: "AI సహాయకుడు",

    reg_crop_heading: "నూతన పంట లిస్టింగ్ నమోదు చేయండి",
    reg_crop_subheading: "నమోదు చేసిన పంట సరిగ్గా 5 రోజుల పాటు మార్కెట్‌ప్లేస్‌లో యాక్టివ్‌గా ఉంటుంది.",
    harvested_date: "పంట కోత తేదీ",
    available_quantity: "పరిమాణం (క్వింటాళ్లు)",
    select_crop_type: "పంట రకం",
    select_crop_name: "పంట పేరు",
    select_quality: "నాణ్యత గ్రేడ్",
    btn_register_crop: "పంటను నమోదు చేయండి",

    enrolled_heading: "నేను నమోదు చేసుకున్న పంటలు",
    col_reg_date: "నమోదైన తేదీ",
    col_expiry_date: "గడువు తేదీ (5 రోజులు)",
    col_harvest_date: "కోత తేదీ",
    no_enrolled_crops: "ఇంకా ఏ పంటలు నమోదు కాలేదు. పంట నమోదు మెనూ ఉపయోగించండి.",

    sell_heading: "పంట అమ్మకం — సమీప వ్యాపారులు",
    sell_subheading: "GPS దూరం ఆధారంగా సమీప కొనుగోలుదారులు ముందుగా కనిపిస్తారు.",
    btn_find_nearby_buyers: "సమీప వ్యాపారులను వెతకండి",
    filter_by_crop: "పంట పేరుతో వెతకండి",
    offering_price: "ఆఫర్ ధర",
    required_qty: "కావలసిన పరిమాణం",
    required_grade: "కావలసిన నాణ్యత",
    no_buyers_found: "ఈ పంట కోసం సమీపంలో కొనుగోలుదారులు ఎవరూ లేరు.",

    price_heading: "ప్రభుత్వ మరియు APMC మండి అధికారిక ధరలు",
    price_subheading: "ప్రభుత్వం నిర్దేశించిన తాజా MSP మరియు మండి ధరల ఆధారంగా రోజువారీ నవీకరణ.",
    search_crop_price_btn: "మండి ధర తెలుసుకోండి",
    mandi_name: "మార్కెట్ / మండి",
    benchmark_rate: "నికర ధర",
    price_trend: "మార్కెట్ ట్రెండ్",
    price_source: "సమాచార మూలం",
    ai_explanation: "AI మార్కెట్ విశ్లేషణ",
    price_unavailable: "ప్రస్తుతం విశ్వసనీయ ధర సమాచారం అందుబాటులో లేదు.",

    tab_buyer_market: "నా వ్యాపార ప్రొఫైల్",
    tab_buyer_post_req: "అవసరాలు నమోదు",
    tab_buyer_my_reqs: "యాక్టివ్ అవసరాలు",
    tab_buyer_find_farmers: "రైతులు / పంటలు వెతకండి",
    tab_buyer_price: "లైవ్ మండి ధరలు",
    tab_buyer_ai: "AI సహాయకుడు",

    post_req_heading: "కొత్త పంట కొనుగోలు అవసరం పోస్ట్ చేయండి",
    btn_post_req: "అవసరాన్ని ప్రచురించండి",
    active_reqs_heading: "నా యాక్టివ్ కొనుగోలు జాబితా",
    buying_price: "కొనుగోలు ధర (₹/క్వింటాల్)",
    no_active_reqs: "ప్రస్తుతం ఎటువంటి అవసరాలు పోస్ట్ చేయలేదు.",

    search_farmers_heading: "తాజా పంట నిల్వలను శోధించండి",
    search_farmers_subheading: "5 రోజుల వ్యాలిడిటీ గల తాజా పంటలు దూరం ప్రకారం కనిపిస్తాయి.",
    btn_search_farmers: "రైతుల పంటలను వెతకండి",
    no_farmers_found: "మీ ఎంపికకు సరిపోయే రైతులు ఎవరూ కనుగొనబడలేదు.",

    ai_title: "కిసాన్-హబ్ AI వ్యవసాయ సహాయకుడు",
    ai_greeting: "నమస్కారం! ప్రభుత్వ మండి ధరలు, సమీప వ్యాపారులు, నాణ్యత గ్రేడింగ్ లేదా మార్కెట్ ట్రెండ్స్ గురించి నన్ను అడగండి.",
    ai_placeholder: "మీ భాషలో ప్రశ్న అడగండి...",
    ai_mic_start: "మాట్లాడటానికి క్లిక్ చేయండి",
    ai_mic_listening: "వింటున్నాను...",
    ai_speech_error: "ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు.",

    err_phone_10: "దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.",
    err_otp_invalid: "తప్పుడు OTP. డెమో OTP: 123456.",
    err_not_registered: "రైతు నమోదు కాలేదు.",
    err_buyer_not_registered: "వ్యాపారి నమోదు కాలేదు.",
    err_login_failed: "ఫోన్ నంబర్ లేదా పాస్‌వర్డ్ సరైనది కాదు.",
    err_network: "కిసాన్-హబ్ సర్వర్‌కు కనెక్ట్ కాలేకపోతున్నాము.",
    err_location_denied: "సమీప ఫలితాలను లెక్కించడానికి లొకేషన్ అనుమతి అవసరం.",
    msg_saved: "వివరాలు విజయవంతంగా భద్రపరచబడ్డాయి.",
    msg_crop_registered: "పంట విజయవంతంగా నమోదైంది! 5 రోజుల పాటు యాక్టివ్‌గా ఉంటుంది.",
    msg_req_added: "కొనుగోలు అవసరం విజయవంతంగా నమోదైంది.",
    recommended: "సిఫార్సు చేయబడింది",
    not_recommended: "సిఫార్సు చేయబడలేదు",
    ai_disabled_no_photo: "AI ధృవీకరణ: నిలిపివేయబడింది (పంట ఫోటో లేదు)",
    purchase_and_rate: "కొనుగోలు చేసినట్లు గుర్తించండి & 5★ రేటింగ్ ఇవ్వండి",
    chat_with_farmer: "రైతుతో చాట్ చేయండి",
    chat_with_buyer: "కొనుగోలుదారుతో చాట్ చేయండి",
    view_details_of_buyer: "కొనుగోలుదారు వివరాలను చూడండి",
    view_details_of_farmer: "రైతు వివరాలను చూడండి",
    within_50km: "50 కి.మీ లోపు"
  },

  hi: {
    brand_name: "किसान-हब (KISSAN-HUB)",
    tagline: "किसानों का जुड़ाव। बाजारों का सशक्तिकरण।",
    landing_subtitle: "एक विश्वसनीय मंच जहां किसानों को उचित बाजार और खरीदारों को गुणवत्तापूर्ण फसल मिलती है।",
    nav_home: "होम",
    nav_farmer: "किसान पोर्टल",
    nav_buyer: "खरीदार पोर्टल",
    nav_admin: "व्यवस्थापक पोर्टल",
    nav_ai: "AI सहायक",
    nav_logout: "लॉग आउट",
    welcome: "स्वागत है",
    hello: "नमस्ते",
    loading: "लोड हो रहा है...",
    save: "सहेजें",
    cancel: "रद्द करें",
    delete: "हटाएं",
    edit: "संशोधित करें",
    close: "बंद करें",
    submit: "जमा करें",
    back: "वापस",
    continue: "आगे बढ़ें",
    search: "खोजें",
    actions: "कार्यवाही",
    view_details: "विवरण देखें",
    distance: "दूरी",
    phone: "फ़ोन नंबर",
    location: "स्थान",
    status: "स्थिति",
    date: "दिनांक",
    active: "सक्रिय",
    expired: "समाप्त",
    quintals: "क्विंटल",
    price: "मूल्य",
    quantity: "मात्रा",
    quality: "गुणवत्ता",
    crop: "फसल",
    crop_type: "फसल प्रकार",
    crop_name: "फसल का नाम",
    all_crops: "सभी फसलें",
    confirm_delete: "क्या आप इस लिस्टिंग को हटाना चाहते हैं?",

    kicker: "उगाएं • जुड़ें • समृद्ध हों",
    hero_title_1: "बेहतर फसल",
    hero_title_2: "साथ मिलकर शुरू होती है।",
    hero_banner_quote: "खेत से आपके भविष्य तक।",
    footer_choice: "आपकी भाषा, आपका बाजार, आपकी पसंद।",

    card_farmer_title: "किसान",
    card_farmer_desc: "फसल सूचीबद्ध करें और खरीदार खोजें",
    card_buyer_title: "खरीदार",
    card_buyer_desc: "ताज़ा उपज प्राप्त करें",
    card_admin_title: "व्यवस्थापक",
    card_admin_desc: "प्रणाली का प्रबंधन करें",

    btn_farmer_login: "किसान लॉगिन",
    btn_farmer_reg: "किसान पंजीकरण",
    btn_buyer_login: "खरीदार लॉगिन",
    btn_buyer_reg: "खरीदार पंजीकरण",
    btn_admin_login: "व्यवस्थापक लॉगिन",

    title_farmer_login: "किसान लॉगिन",
    title_farmer_reg: "नया किसान पंजीकरण",
    title_buyer_login: "खरीदार लॉगिन",
    title_buyer_reg: "नया खरीदार पंजीकरण",
    title_buyer_pwd: "पासवर्ड द्वारा लॉगिन",
    title_create_pwd: "नया पासवर्ड बनाएं",
    title_forgot_pwd: "पासवर्ड भूल गए?",
    title_admin_login: "सुरक्षित व्यवस्थापक पोर्टल",
    enter_phone: "10 अंकों का मोबाइल नंबर दर्ज करें",
    enter_otp: "6 अंकों का OTP दर्ज करें",
    demo_otp_hint: "डेमो OTP: 123456",
    verify_otp: "OTP सत्यापित करें",
    resend_otp: "OTP पुनः भेजें",
    register_now: "अभी पंजीकरण करें",
    back_to_login: "लॉगिन पर वापस जाएं",
    forgot_password: "पासवर्ड भूल गए?",
    password: "पासवर्ड",
    new_password: "नया पासवर्ड",
    confirm_password: "पासवर्ड की पुष्टि करें",
    username: "यूज़रनेम",
    full_name: "पूरा नाम",
    market_name: "मंडी / व्यापारिक नाम",
    state: "राज्य",
    district: "जिला",
    mandal: "तहसील / मंडल",
    aadhaar_number: "आधार संख्या",
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    detect_location: "मेरा जीपीएस स्थान खोजें 📍",

    tab_farmer_register_crop: "फसल पंजीकरण",
    tab_farmer_enrolled: "नामांकित फसलें",
    tab_farmer_sell: "फसल बेचें",
    tab_farmer_price: "लाइव मंडी भाव",
    tab_farmer_profile: "मेरी प्रोफ़ाइल",
    tab_farmer_ai: "AI कृषि सहायक",

    reg_crop_heading: "नई फसल लिस्टिंग पंजीकृत करें",
    reg_crop_subheading: "पंजीकृत फसल ठीक 5 दिनों तक बाजार में सक्रिय रहती है।",
    harvested_date: "कटाई की तारीख",
    available_quantity: "उपलब्ध मात्रा (क्विंटल)",
    select_crop_type: "फसल प्रकार चुनें",
    select_crop_name: "फसल का नाम चुनें",
    select_quality: "गुणवत्ता ग्रेड चुनें",
    btn_register_crop: "फसल पंजीकृत करें",

    enrolled_heading: "मेरी नामांकित फसलें",
    col_reg_date: "पंजीकरण दिनांक",
    col_expiry_date: "समाप्ति दिनांक (5 दिन)",
    col_harvest_date: "कटाई दिनांक",
    no_enrolled_crops: "अभी तक कोई फसल नामांकित नहीं है।",

    sell_heading: "फसल बेचें — निकटतम सत्यापित खरीदार",
    sell_subheading: "जीपीएस दूरी के आधार पर सबसे निकटतम खरीदार पहले प्रदर्शित होते हैं।",
    btn_find_nearby_buyers: "निकटतम खरीदार खोजें",
    filter_by_crop: "फसल के अनुसार खोजें",
    offering_price: "प्रस्तावित मूल्य",
    required_qty: "आवश्यक मात्रा",
    required_grade: "आवश्यक ग्रेड",
    no_buyers_found: "इस फसल के लिए कोई खरीदार उपलब्ध नहीं है।",

    price_heading: "आधिकारिक सरकारी एवं APMC मंडी दैनिक भाव",
    price_subheading: "सरकारी एमएसपी और दैनिक मंडी आवक के अनुसार लाइव मूल्य।",
    search_crop_price_btn: "मंडी भाव देखें",
    mandi_name: "मंडी का नाम",
    benchmark_rate: "बेंचमार्क दर",
    price_trend: "बाजार का रुख",
    price_source: "डेटा स्रोत",
    ai_explanation: "AI बाजार विश्लेषण",
    price_unavailable: "वर्तमान में विश्वसनीय मूल्य जानकारी उपलब्ध नहीं है।",

    tab_buyer_market: "मेरा व्यापारिक प्रोफाइल",
    tab_buyer_post_req: "आवश्यकता दर्ज करें",
    tab_buyer_my_reqs: "सक्रिय आवश्यकताएं",
    tab_buyer_find_farmers: "किसान / फसलें खोजें",
    tab_buyer_price: "लाइव मंडी भाव",
    tab_buyer_ai: "AI सहायक",

    post_req_heading: "फसल खरीद आवश्यकता पोस्ट करें",
    btn_post_req: "आवश्यकता प्रकाशित करें",
    active_reqs_heading: "मेरी सक्रिय खरीद आवश्यकताएं",
    buying_price: "खरीद मूल्य (₹/क्विंटल)",
    no_active_reqs: "कोई सक्रिय आवश्यकता पोस्ट नहीं की गई है।",

    search_farmers_heading: "उपलब्ध ताज़ा उपज खोजें",
    search_farmers_subheading: "5-दिवसीय ताजगी अवधि वाली फसलें दूरी के अनुसार सूचीबद्ध हैं।",
    btn_search_farmers: "उपलब्ध फसलें खोजें",
    no_farmers_found: "आपकी पसंद से मेल खाने वाले कोई किसान नहीं मिले।",

    ai_title: "किसान-हब AI कृषि सहायक",
    ai_greeting: "नमस्ते! सरकारी मंडी भाव, निकटतम खरीदार, गुणवत्ता ग्रेडिंग या बाजार रुझानों के बारे में मुझसे पूछें।",
    ai_placeholder: "अपनी पसंदीदा भाषा में पूछें...",
    ai_mic_start: "बोलने के लिए क्लिक करें",
    ai_mic_listening: "सुन रहा हूँ...",
    ai_speech_error: "इस ब्राउज़र में वॉयस रिकग्निशन समर्थित नहीं है।",

    err_phone_10: "कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें।",
    err_otp_invalid: "अमान्य OTP। डेमो OTP: 123456।",
    err_not_registered: "किसान पंजीकृत नहीं है।",
    err_buyer_not_registered: "खरीदार पंजीकृत नहीं है।",
    err_login_failed: "फ़ोन नंबर या पासवर्ड अमान्य है।",
    err_network: "किसान-हब सर्वर से कनेक्ट करने में असमर्थ।",
    err_location_denied: "समीप परिणाम देखने के लिए स्थान की अनुमति आवश्यक है।",
    msg_saved: "विवरण सफलतापूर्वक सहेज लिया गया।",
    msg_crop_registered: "फसल सफलतापूर्वक पंजीकृत! 5 दिनों के लिए सक्रिय रहेगी।",
    msg_req_added: "आवश्यकता सफलतापूर्वक प्रकाशित की गई।",
    recommended: "अनुशंसित",
    not_recommended: "अनुशंसित नहीं",
    ai_disabled_no_photo: "AI सत्यापन: अक्षम (फसल की फोटो नहीं है)",
    purchase_and_rate: "खरीदा गया चिह्नित करें और 5★ रेटिंग दें",
    chat_with_farmer: "किसान से चैट करें",
    chat_with_buyer: "खरीदार से चैट करें",
    view_details_of_buyer: "खरीदार का विवरण देखें",
    view_details_of_farmer: "किसान का विवरण देखें",
    within_50km: "50 किमी के भीतर"
  },

  // Tamil
  ta: {
    brand_name: "கிசான்-ஹப் (KISSAN-HUB)",
    tagline: "விவசாயிகளை இணைத்தல். சந்தைகளை வலுப்படுத்துதல்.",
    landing_subtitle: "விவசாயிகள் நியாயமான சந்தைகளையும் வாங்குபவர்கள் தரமான பயிர்களையும் கண்டறியும் நம்பகமான தளம்.",
    kicker: "வளருங்கள் • இணையுங்கள் • முன்னேறுங்கள்",
    hero_title_1: "சிறந்த அறுவடைகள்",
    hero_title_2: "ஒன்றாகத் தொடங்குகின்றன.",
    hero_banner_quote: "வயலில் இருந்து உங்கள் எதிர்காலத்திற்கு.",
    card_farmer_title: "விவசாயி",
    card_farmer_desc: "பயிர்களைப் பட்டியலிட்டு வாங்குபவர்களைக் கண்டறியவும்",
    card_buyer_title: "வாங்குபவர்",
    card_buyer_desc: "புதிய விளைபொருட்களைப் பெறுங்கள்",
    card_admin_title: "நிர்வாகி",
    card_admin_desc: "கட்டமைப்பை நிர்வகிக்கவும்",
    btn_farmer_login: "விவசாயி உள்நுழைவு",
    btn_farmer_reg: "விவசாயி பதிவு",
    btn_buyer_login: "வாங்குபவர் உள்நுழைவு",
    btn_buyer_reg: "வாங்குபவர் பதிவு",
    btn_admin_login: "நிர்வாகி உள்நுழைவு",
    detect_location: "என் ஜிபிஎஸ் இருப்பிடத்தைக் கண்டறி 📍",
    tab_farmer_price: "மண்டி விலைகள்",
    tab_buyer_price: "மண்டி விலைகள்",
    price_heading: "அரசாங்க மற்றும் மண்டி தினசரி விலைகள்",
    ai_greeting: "வணக்கம்! மண்டி விலைகள் மற்றும் சந்தை போக்குகள் பற்றி என்னிடம் கேளுங்கள்."
  },

  // Kannada
  kn: {
    brand_name: "ಕಿಸಾನ್-ಹಬ್ (KISSAN-HUB)",
    tagline: "ರೈತರ ಜೋಡಣೆ. ಮಾರುಕಟ್ಟೆಗಳ ಸಬಲೀಕರಣ.",
    landing_subtitle: "ರೈತರು ನ್ಯಾಯಯುತ ಮಾರುಕಟ್ಟೆಗಳನ್ನು ಮತ್ತು ಖರೀದಿದಾರರು ಗುಣಮಟ್ಟದ ಬೆಳೆಗಳನ್ನು ಪಡೆಯುವ ವಿಶ್ವಾಸಾರ್ಹ ವೇದಿಕೆ.",
    kicker: "ಬೆಳೆಯಿರಿ • ಸಂಪರ್ಕಿಸಿ • ಸಮೃದ್ಧರಾಗಿ",
    hero_title_1: "ಉತ್ತಮ ಬೆಳೆಗಳು",
    hero_title_2: "ಜತೆಯಾಗಿ ಆರಂಭವಾಗುತ್ತವೆ.",
    hero_banner_quote: "ಹೊಲದಿಂದ ನಿಮ್ಮ ಭವಿಷ್ಯಕ್ಕೆ.",
    card_farmer_title: "ರೈತ",
    card_farmer_desc: "ಬೆಳೆಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ ಮತ್ತು ಖರೀದಿದಾರರನ್ನು ಹುಡುಕಿ",
    card_buyer_title: "ಖರೀದಿದಾರ",
    card_buyer_desc: "ತಾಜಾ ಉತ್ಪನ್ನಗಳನ್ನು ಖರೀದಿಸಿ",
    card_admin_title: "ನಿರ್ವಾಹಕ",
    card_admin_desc: "ವ್ಯವಸ್ಥೆಯನ್ನು ನಿರ್ವಹಿಸಿ",
    btn_farmer_login: "ರೈತ ಲಾಗಿನ್",
    btn_farmer_reg: "ರೈತ ನೋಂದಣಿ",
    btn_buyer_login: "ಖರೀದಿದಾರ ಲಾಗಿನ್",
    btn_buyer_reg: "ಖರೀದಿದಾರ ನೋಂದಣಿ",
    btn_admin_login: "ನಿರ್ವಾಹಕ ಲಾಗಿನ್",
    detect_location: "ನನ್ನ ಜಿಪಿಎಸ್ ಸ್ಥಳ ಪತ್ತೆ ಮಾಡಿ 📍",
    tab_farmer_price: "ಮಂಡಿ ಬೆಲೆಗಳು",
    tab_buyer_price: "ಮಂಡಿ ಬೆಲೆಗಳು",
    price_heading: "ಸರ್ಕಾರಿ ಮತ್ತು ಮಂಡಿ ದೈನಂದಿನ ದರಗಳು",
    ai_greeting: "ನಮಸ್ಕಾರ! ಇಂದಿನ ಮಂಡಿ ದರಗಳು ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿಯನ್ನು ನನ್ನನ್ನು ಕೇಳಿ."
  },

  // Malayalam
  ml: {
    brand_name: "കിസാൻ-ഹബ് (KISSAN-HUB)",
    tagline: "കർഷകരെ ബന്ധിപ്പിക്കുന്നു. വിപണികളെ ശാക്തീകരിക്കുന്നു.",
    landing_subtitle: "കർഷകർക്ക് ന്യായമായ വിപണിയും വാങ്ങുന്നവർക്ക് ഗുണനിലവാരമുള്ള വിളകളും ലഭിക്കുന്ന ഇടം.",
    kicker: "വളരുക • ബന്ധപ്പെടുക • സമൃദ്ധി നേടുക",
    hero_title_1: "നല്ല വിളവെടുപ്പ്",
    hero_title_2: "ഒരുമിച്ച് ആരംഭിക്കുന്നു.",
    hero_banner_quote: "വയലിൽ നിന്ന് നിങ്ങളുടെ ഭാവിയിലേക്ക്.",
    card_farmer_title: "കർഷകൻ",
    card_farmer_desc: "വിളകൾ ലിസ്റ്റ് ചെയ്ത് വാങ്ങുന്നവരെ കണ്ടെത്തുക",
    card_buyer_title: "വാങ്ങുന്നയാൾ",
    card_buyer_desc: "പുതിയ കാർഷിക ഉൽപ്പന്നങ്ങൾ വാങ്ങുക",
    card_admin_title: "അഡ്മിൻ",
    card_admin_desc: "സംവിധാനം നിയന്ത്രിക്കുക",
    btn_farmer_login: "കർഷക ലോഗിൻ",
    btn_farmer_reg: "കർഷക രജിസ്ട്രേഷൻ",
    btn_buyer_login: "വാങ്ങുന്നയാളുടെ ലോഗിൻ",
    btn_buyer_reg: "വാങ്ങുന്നയാളുടെ രജിസ്ട്രേഷൻ",
    btn_admin_login: "അഡ്മിൻ ലോഗിൻ",
    detect_location: "എന്റെ ജിപിഎസ് ലൊക്കേഷൻ കണ്ടെത്തുക 📍",
    tab_farmer_price: "തത്സമയ വിപണി വിലകൾ",
    tab_buyer_price: "തത്സമയ വിപണി വിലകൾ",
    price_heading: "സർക്കാർ മണ്ടി നിരക്കുകൾ",
    ai_greeting: "നമസ്കാരം! വിപണി വിലകളെക്കുറിച്ചും വിവരങ്ങളെക്കുറിച്ചും എന്നോട് ചോദിക്കൂ."
  },

  // Marathi
  mr: {
    brand_name: "किसान-हब (KISSAN-HUB)",
    tagline: "शेतकऱ्यांची जोडणी. बाजारांचे सक्षमीकरण.",
    landing_subtitle: "शेतकऱ्यांना रास्त भाव आणि खरेदीदारांना दर्जेदार शेतमाल मिळवून देणारे विश्वसनीय व्यासपीठ.",
    kicker: "पिकवा • जोडा • समृद्ध व्हा",
    hero_title_1: "चांगले पीक",
    hero_title_2: "एकत्र सुरू होते.",
    hero_banner_quote: "शेतातून तुमच्या भविष्याकडे.",
    card_farmer_title: "शेतकरी",
    card_farmer_desc: "पिके नोंदवा आणि खरेदीदार शोधा",
    card_buyer_title: "खरेदीदार",
    card_buyer_desc: "ताजा शेतमाल खरेदी करा",
    card_admin_title: "प्रशासक",
    card_admin_desc: "प्रणाली व्यवस्थापित करा",
    btn_farmer_login: "शेतकरी लॉगिन",
    btn_farmer_reg: "शेतकरी नोंदणी",
    btn_buyer_login: "खरेदीदार लॉगिन",
    btn_buyer_reg: "खरेदीदार नोंदणी",
    btn_admin_login: "प्रशासक लॉगिन",
    detect_location: "माझे जीपीएस स्थान शोधा 📍",
    tab_farmer_price: "मंडी भाव",
    tab_buyer_price: "मंडी भाव",
    price_heading: "शासकीय हमीभाव व कृषी उत्पन्न बाजार समिती दर",
    ai_greeting: "नमस्कार! बाजारभाव आणि शेती सल्ला यासाठी मला विचारा."
  },

  // Bengali
  bn: {
    brand_name: "কিসান-হাব (KISSAN-HUB)",
    tagline: "কৃষকদের সংযোগ। বাজারের ক্ষমতায়ন।",
    landing_subtitle: "যেখানে কৃষকরা ন্যায্য বাজার পায় এবং ক্রেতারা পায় সেরা মানের ফসল।",
    kicker: "ফলান • যুক্ত হন • সমৃদ্ধ হন",
    hero_title_1: "সেরা ফসল",
    hero_title_2: "একসঙ্গে শুরু হয়।",
    hero_banner_quote: "মাঠ থেকে আপনার ভবিষ্যতের দিকে।",
    card_farmer_title: "কৃষক",
    card_farmer_desc: "ফসল তালিকাভুক্ত করুন ও ক্রেতা খুঁজুন",
    card_buyer_title: "ক্রেতা",
    card_buyer_desc: "তাজা ফসল সংগ্রহ করুন",
    card_admin_title: "অ্যাডমিন",
    card_admin_desc: "ব্যবস্থা পরিচালনা করুন",
    btn_farmer_login: "কৃষক লগইন",
    btn_farmer_reg: "কৃষক নিবন্ধন",
    btn_buyer_login: "ক্রেতা লগইন",
    btn_buyer_reg: "ক্রেতা নিবন্ধন",
    btn_admin_login: "অ্যাডমিন লগইন",
    detect_location: "আমার জিপিএস অবস্থান খুঁজুন 📍",
    tab_farmer_price: "মান্ডি দর",
    tab_buyer_price: "মান্ডি দর",
    price_heading: "সরকারি ও মান্ডি দৈনিক বাজার দর",
    ai_greeting: "নমস্কার! আজকের মান্ডি দর এবং কৃষি তথ্য সম্পর্কে আমাকে জিজ্ঞাসা করুন।"
  },

  // Gujarati
  gu: {
    brand_name: "કિસાન-હબ (KISSAN-HUB)",
    tagline: "ખેડૂતોનું જોડાણ. બજારોનું સશક્તિકરણ.",
    landing_subtitle: "જ્યાં ખેડૂતોને યોગ્ય ભાવ અને ખરીદદારોને ગુણવત્તાયુક્ત પાક મળે છે.",
    kicker: "ઉગાડો • જોડાઓ • સમૃદ્ધ બનો",
    hero_title_1: "શ્રેષ્ઠ પાક",
    hero_title_2: "સાથે મળીને શરૂ થાય છે.",
    hero_banner_quote: "ખેતરમાંથી તમારા ભવિષ્ય તરફ.",
    card_farmer_title: "ખેડૂત",
    card_farmer_desc: "પાકની નોંધણી કરો અને ખરીદદાર શોધો",
    card_buyer_title: "ખરીદદાર",
    card_buyer_desc: "તાજો પાક મેળવો",
    card_admin_title: "એડમિન",
    card_admin_desc: "સિસ્ટમનું સંચાલન કરો",
    btn_farmer_login: "ખેડૂત લૉગિન",
    btn_farmer_reg: "ખેડૂત નોંધણી",
    btn_buyer_login: "ખરીદદાર લૉગિન",
    btn_buyer_reg: "ખરીદદાર નોંધણી",
    btn_admin_login: "એડમિન લૉગિન",
    detect_location: "મારું જીપીએસ સ્થાન શોધો 📍",
    tab_farmer_price: "માર્કેટિંગ યાર્ડ ભાવ",
    tab_buyer_price: "માર્કેટિંગ યાર્ડ ભાવ",
    price_heading: "સરકારી ટેકાના ભાવ અને દૈનિક માર્કેટ યાર્ડ દર",
    ai_greeting: "નમસ્તે! આજના માર્કેટ યાર્ડ ભાવ વિશે મને પૂછો."
  },

  // Punjabi
  pa: {
    brand_name: "ਕਿਸਾਨ-ਹੱਬ (KISSAN-HUB)",
    tagline: "ਕਿਸਾਨਾਂ ਦਾ ਸੁਮੇਲ। ਮੰਡੀਆਂ ਦੀ ਤਾਕਤ।",
    landing_subtitle: "ਇੱਕ ਭਰੋਸੇਯੋਗ ਮੰਚ ਜਿੱਥੇ ਕਿਸਾਨਾਂ ਨੂੰ ਸਹੀ ਮੁੱਲ ਅਤੇ ਖਰੀਦਦਾਰਾਂ ਨੂੰ ਉੱਚ ਗੁਣਵੱਤਾ ਵਾਲੀ ਫਸਲ ਮਿਲਦੀ ਹੈ।",
    kicker: "ਉਗਾਓ • ਜੁੜੋ • ਖੁਸ਼ਹਾਲ ਹੋਵੋ",
    hero_title_1: "ਵਧੀਆ ਫਸਲਾਂ ਦੀ ਸ਼ੁਰੂਆਤ",
    hero_title_2: "ਇਕੱਠੇ ਹੁੰਦੀ ਹੈ।",
    hero_banner_quote: "ਖੇਤਾਂ ਤੋਂ ਤੁਹਾਡੇ ਭਵਿੱਖ ਤੱਕ।",
    card_farmer_title: "ਕਿਸਾਨ",
    card_farmer_desc: "ਫਸਲਾਂ ਸੂਚੀਬੱਧ ਕਰੋ ਅਤੇ ਖਰੀਦਦਾਰ ਲੱਭੋ",
    card_buyer_title: "ਖਰੀਦਦਾਰ",
    card_buyer_desc: "ਤਾਜ਼ੀ ਫਸਲ ਖਰੀਦੋ",
    card_admin_title: "ਪ੍ਰਬੰਧਕ",
    card_admin_desc: "ਸਿਸਟਮ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰੋ",
    btn_farmer_login: "ਕਿਸਾਨ ਲੌਗਇਨ",
    btn_farmer_reg: "ਕਿਸਾਨ ਰਜਿਸਟ੍ਰੇਸ਼ਨ",
    btn_buyer_login: "ਖਰੀਦਦਾਰ ਲੌਗਇਨ",
    btn_buyer_reg: "ਖਰੀਦਦਾਰ ਰਜਿਸਟ੍ਰੇਸ਼ਨ",
    btn_admin_login: "ਪ੍ਰਬੰਧਕ ਲੌਗਇਨ",
    detect_location: "ਮੇਰੀ ਜੀਪੀਐਸ ਲੋਕੇਸ਼ਨ ਲੱਭੋ 📍",
    tab_farmer_price: "ਮੰਡੀ ਰੇਟ",
    tab_buyer_price: "ਮੰਡੀ ਰੇਟ",
    price_heading: "ਸਰਕਾਰੀ ਐਮਐਸਪੀ ਅਤੇ ਅਨਾਜ ਮੰਡੀ ਰੋਜ਼ਾਨਾ ਰੇਟ",
    ai_greeting: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਅੱਜ ਦੇ ਮੰਡੀ ਰੇਟਾਂ ਬਾਰੇ ਮੈਨੂੰ ਪੁੱਛੋ।"
  },

  // Odia
  or: {
    brand_name: "କିସାନ-ହବ୍ (KISSAN-HUB)",
    tagline: "କୃଷକଙ୍କ ସଂଯୋଗ। ବଜାରର ସଶକ୍ତୀକରଣ।",
    landing_subtitle: "ଯେଉଁଠାରେ କୃଷକମାନେ ଉଚିତ୍ ବଜାର ଏବଂ କ୍ରେତାମାନେ ଉନ୍ନତ ମାନର ଫସଲ ପାଆନ୍ତି।",
    kicker: "ବଢ଼ାନ୍ତୁ • ଯୋଡ଼ନ୍ତୁ • ସମୃଦ୍ଧ ହୁଅନ୍ତୁ",
    hero_title_1: "ଉତ୍ତମ ଫସଲର ଶୁଭାରମ୍ଭ",
    hero_title_2: "ଏକାଠି ହୁଏ।",
    hero_banner_quote: "ଜମିରୁ ଆପଣଙ୍କ ଭବିଷ୍ୟତ ପର୍ଯ୍ୟନ୍ତ।",
    card_farmer_title: "କୃଷକ",
    card_farmer_desc: "ଫସଲ ତାଲିକାଭୁକ୍ତ କରନ୍ତୁ ଏବଂ କ୍ରେତା ଖୋଜନ୍ତୁ",
    card_buyer_title: "କ୍ରେତା",
    card_buyer_desc: "ସତେଜ ଉତ୍ପାଦ କ୍ରୟ କରନ୍ତୁ",
    card_admin_title: "ପ୍ରଶାସକ",
    card_admin_desc: "ବ୍ୟବସ୍ଥା ପରିଚାଳନା କରନ୍ତୁ",
    btn_farmer_login: "କୃଷକ ଲଗଇନ୍",
    btn_farmer_reg: "କୃଷକ ପଞ୍ଜୀକରଣ",
    btn_buyer_login: "କ୍ରେତା ଲଗଇନ୍",
    btn_buyer_reg: "କ୍ରେତା ପଞ୍ଜୀକରଣ",
    btn_admin_login: "ପ୍ରଶାସକ ଲଗଇନ୍",
    detect_location: "ମୋର ଜିପିଏସ୍ ଅବସ୍ଥିତି ଚିହ୍ନଟ କରନ୍ତୁ 📍",
    tab_farmer_price: "ମଣ୍ଡି ଦର",
    tab_buyer_price: "ମଣ୍ଡି ଦର",
    price_heading: "ସରକାରୀ ଏମ୍ଏସପି ଓ ମଣ୍ଡି ଦୈନିକ ଦର",
    ai_greeting: "ନମସ୍କାର! ଆଜିର ମଣ୍ଡି ଦର ଏବଂ କୃଷି ସୂଚନା ପାଇଁ ମୋତେ ପଚାରନ୍ତୁ।"
  }
};

let currentLanguage = localStorage.getItem('kissanHubLanguage') || 'en';

const t = (key) => {
  const langPack = translations[currentLanguage] || translations.en;
  return langPack[key] || translations.en[key] || key;
};

// In-memory & local cache for AI-translated dictionaries
const _aiTranslationCacheKey = (lang) => `kissanHub_ai_trans_${lang}`;

const getCachedAiTranslations = (lang) => {
  try {
    const raw = localStorage.getItem(_aiTranslationCacheKey(lang));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const saveAiTranslations = (lang, dict) => {
  try {
    localStorage.setItem(_aiTranslationCacheKey(lang), JSON.stringify(dict));
  } catch (e) {}
};

// Dynamic AI Translation of entire website using backend /api/ai/translate
window.translateEntireWebsiteWithAi = async (lang) => {
  if (!lang || lang === 'en') return;

  // Check local cache first
  const cached = getCachedAiTranslations(lang);
  if (cached && typeof cached === 'object' && Object.keys(cached).length > 20) {
    translations[lang] = Object.assign({}, translations[lang] || {}, cached);
    applyTranslations();
    return;
  }

  // Gather all base english strings to translate
  const baseTexts = Object.assign({}, translations.en);
  // Also collect untranslated visible elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key && !baseTexts[key]) {
      baseTexts[key] = el.textContent.trim();
    }
  });

  try {
    const res = await fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: baseTexts, targetLanguage: lang })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        translations[lang] = Object.assign({}, translations[lang] || {}, json.data);
        saveAiTranslations(lang, translations[lang]);
        applyTranslations();
      }
    }
  } catch (err) {
    console.warn('[AI Website Translation Notice]:', err.message);
  }
};

const setLanguage = (lang) => {
  if (!translations[lang]) translations[lang] = {};
  currentLanguage = lang;
  localStorage.setItem('kissanHubLanguage', lang);
  applyTranslations();

  // Trigger real AI full-site translation if not english
  if (lang !== 'en') {
    window.translateEntireWebsiteWithAi(lang);
  }

  const langSelect = document.getElementById('globalLanguageSelect');
  if (langSelect) {
    langSelect.value = lang;
  }

  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
};

const applyTranslations = () => {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key));
  });
};

document.addEventListener('DOMContentLoaded', () => {
  // Load cached AI translations if active language is non-English
  if (currentLanguage && currentLanguage !== 'en') {
    const cached = getCachedAiTranslations(currentLanguage);
    if (cached) {
      translations[currentLanguage] = Object.assign({}, translations[currentLanguage] || {}, cached);
    }
  }

  applyTranslations();

  const langSelect = document.getElementById('globalLanguageSelect');
  if (langSelect) {
    langSelect.value = currentLanguage;
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }
});
