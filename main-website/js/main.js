// KISSAN-HUB — main.js
// Central source of truth for utilities, API calls, sessions, modals, navigation & location

const API_BASE_URL = window.API_BASE_URL || (window.KISSAN_CONFIG && window.KISSAN_CONFIG.BACKEND_URL ? (window.KISSAN_CONFIG.BACKEND_URL.replace(/\/+$/, '') + '/api') : '/api');

const AppState = {
  session: null,
  userLocation: {
    latitude: null,
    longitude: null,
    available: false,
    addressText: ''
  }
};

// Comprehensive Pan-India State -> District -> Mandal Dataset
const INDIA_LOCATION_DATA = {
  "Telangana": {
    "Hyderabad": ["Bowenpally", "Secunderabad", "Charminar", "Jubilee Hills", "Amberpet", "Khairatabad"],
    "Warangal": ["Hanamkonda", "Warangal Rural", "Narsampet", "Parkal", "Wardhannapet"],
    "Karimnagar": ["Karimnagar Rural", "Choppadandi", "Manakondur", "Huzurabad", "Jammikunta"],
    "Nizamabad": ["Nizamabad North", "Armoor", "Bodhan", "Bheemgal", "Varni"],
    "Khammam": ["Khammam Urban", "Madhira", "Sathupalli", "Wyra", "Kallur"],
    "Nalgonda": ["Nalgonda Rural", "Miryalaguda", "Devarakonda", "Nakrekal", "Suryapet"],
    "Mahabubnagar": ["Jadcherla", "Bhoothpur", "Devarkadra", "Narayanpet", "Makthal"]
  },
  "Andhra Pradesh": {
    "Guntur": ["Guntur Rural", "Tenali", "Mangalagiri", "Ponnur", "Narasaraopet"],
    "Krishna": ["Vijayawada Urban", "Gudivada", "Machilipatnam", "Nuzvid", "Jaggaiahpet"],
    "Kurnool": ["Kurnool Urban", "Adoni", "Nandyal", "Yemmiganur", "Dhone"],
    "Annamayya": ["Madanapalle", "Rayachoti", "Rajampet", "Railway Kodur"],
    "Visakhapatnam": ["Anakapalle", "Bheemunipatnam", "Gajuwaka", "Pendurthi"],
    "East Godavari": ["Kakinada", "Rajahmundry", "Amalapuram", "Peddapuram"],
    "West Godavari": ["Eluru", "Bhimavaram", "Tadepalligudem", "Tanuku", "Narasapuram"]
  },
  "Maharashtra": {
    "Nashik": ["Lasalgaon", "Niphad", "Yeola", "Sinnar", "Malegaon", "Dindori"],
    "Kolhapur": ["Karveer", "Shirol", "Hatkanangle", "Radhanagari", "Kagal"],
    "Pune": ["Haveli", "Baramati", "Shirur", "Junnar", "Khed", "Daund"],
    "Nagpur": ["Nagpur Rural", "Kamptee", "Hingna", "Katol", "Saoner"],
    "Ahmednagar": ["Rahata", "Sangamner", "Kopargaon", "Shrirampur", "Newasa"]
  },
  "Punjab": {
    "Ludhiana": ["Khanna", "Jagraon", "Samrala", "Raikot", "Payal"],
    "Patiala": ["Nabha", "Rajpura", "Samana", "Patran"],
    "Amritsar": ["Ajnala", "Baba Bakrala", "Majitha"],
    "Bathinda": ["Rampura Phul", "Talwandi Sabo", "Maur"]
  },
  "Karnataka": {
    "Kalaburagi": ["Gulbarga Urban", "Sedam", "Chincholi", "Aland", "Afzalpur"],
    "Belagavi": ["Chikkodi", "Athani", "Bailhongal", "Gokak", "Hukkeri"],
    "Mysuru": ["Nanjangud", "Hunsur", "T. Narasipura", "K.R. Nagar"],
    "Davanagere": ["Harihar", "Channagiri", "Honnali", "Jagalur"]
  },
  "Uttar Pradesh": {
    "Agra": ["Etmadpur", "Kiraoli", "Fatehabad", "Bah", "Kheragarh"],
    "Varanasi": ["Pindra", "Raja Talab", "Varanasi Sadar"],
    "Lucknow": ["Bakshi Ka Talab", "Malihabad", "Mohanlalganj", "Sarojini Nagar"],
    "Meerut": ["Mawana", "Sardhana", "Meerut Sadar"]
  },
  "Madhya Pradesh": {
    "Indore": ["Sanwer", "Depalpur", "Mhow", "Hatod"],
    "Ujjain": ["Badnagar", "Mahidpur", "Tarana", "Khachrod"],
    "Bhopal": ["Huzur", "Berasia", "Kolar"],
    "Jabalpur": ["Patan", "Sihora", "Panagar", "Shahpura"]
  },
  "Gujarat": {
    "Rajkot": ["Gondal", "Jetpur", "Jasdan", "Dhoraji", "Morbi"],
    "Ahmedabad": ["Sanand", "Dholka", "Viramgam", "Dhandhuka"],
    "Surat": ["Bardoli", "Mandvi", "Kamrej", "Olpad"],
    "Mehsana": ["Visnagar", "Kadi", "Unjha", "Vadnagar"]
  },
  "Tamil Nadu": {
    "Coimbatore": ["Pollachi", "Mettupalayam", "Sulur", "Annur"],
    "Madurai": ["Melur", "Thirumangalam", "Vadipatti", "Usilampatti"],
    "Salem": ["Attur", "Mettur", "Omalur", "Sankari"],
    "Thanjavur": ["Kumbakonam", "Papanasam", "Pattukkottai"]
  },
  "Rajasthan": {
    "Jaipur": ["Chomu", "Amer", "Sanganer", "Kotputli", "Phulera"],
    "Jodhpur": ["Bilara", "Osian", "Phalodi", "Bhopalgarh"],
    "Bharatpur": ["Deeg", "Bayana", "Kaman", "Nadbai"],
    "Sri Ganganagar": ["Suratgarh", "Raisinghnagar", "Anupgarh"]
  },
  "Haryana": {
    "Karnal": ["Assandh", "Gharaunda", "Indri", "Nilokheri"],
    "Ambala": ["Barara", "Naraingarh", "Saha"],
    "Hisar": ["Hansi", "Barwala", "Narnaund"]
  },
  "Bihar": {
    "Patna": ["Barh", "Danapur", "Masaurhi", "Paliganj"],
    "Muzaffarpur": ["Kanti", "Motipur", "Paroo", "Sahebganj"]
  },
  "West Bengal": {
    "Burdwan": ["Burdwan Sadar", "Kalna", "Katwa"],
    "Hooghly": ["Chinsurah", "Chandannagar", "Arambagh", "Serampore"]
  },
  "Kerala": {
    "Palakkad": ["Alathur", "Chittur", "Mannarkkad", "Ottapalam"],
    "Wayanad": ["Mananthavady", "Sulthan Bathery", "Vythiri"]
  },
  "Odisha": {
    "Cuttack": ["Athagarh", "Banki", "Baramba", "Salepur"],
    "Bargarh": ["Attabira", "Bhatli", "Padampur", "Sohela"]
  }
};

const getElement = (id) => document.getElementById(id);

// Consistent API Request Wrapper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (AppState.session && AppState.session.token) {
    headers['Authorization'] = `Bearer ${AppState.session.token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    let json = {};
    try {
      json = await res.json();
    } catch (parseErr) {
      json = { success: false, message: 'Invalid server response.' };
    }

    if (res.ok && json.success !== false) {
      return {
        ok: true,
        status: res.status,
        data: json.data !== undefined ? json.data : json,
        message: json.message
      };
    } else {
      return {
        ok: false,
        status: res.status,
        data: json.data || null,
        message: json.message || 'Request failed.'
      };
    }
  } catch (netErr) {
    console.error('Network Error in apiRequest:', netErr);
    return {
      ok: false,
      status: 0,
      data: null,
      message: t('err_network') || 'Cannot connect to KISSAN-HUB server.'
    };
  }
};

window.openModal = (modalId) => {
  const modal = getElement(modalId);
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    modal.style.zIndex = '99999';
    modal.style.pointerEvents = 'auto';
    document.body.classList.add('modal-open');
  }
};

window.closeModal = (modalId) => {
  const modal = getElement(modalId);
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    document.body.classList.remove('modal-open');
  }
};

const openModal = window.openModal;
const closeModal = window.closeModal;

const showMessage = (text, type = 'info') => {
  const container = getElement('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span class="toast-text">${text}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
};

window.showMessage = showMessage;
window.getElement = getElement;

// Session handling
const saveSession = (sessionData) => {
  AppState.session = sessionData;
  localStorage.setItem('kissanHubSession', JSON.stringify(sessionData));
};

const getSession = () => {
  if (!AppState.session) {
    const stored = localStorage.getItem('kissanHubSession');
    if (stored) {
      try {
        AppState.session = JSON.parse(stored);
      } catch (e) {
        AppState.session = null;
      }
    }
  }
  return AppState.session;
};

const clearSession = () => {
  AppState.session = null;
  localStorage.removeItem('kissanHubSession');
};

const showView = (viewId) => {
  const views = ['landingView', 'farmerDashboardView', 'buyerDashboardView'];
  views.forEach((v) => {
    const el = getElement(v);
    if (el) {
      if (v === viewId) {
        el.classList.remove('hidden');
        window.scrollTo(0, 0);
      } else {
        el.classList.add('hidden');
      }
    }
  });

  const navbar = getElement('mainAppNavbar');
  if (navbar) {
    if (viewId === 'landingView') {
      navbar.classList.add('hidden');
    } else {
      navbar.classList.remove('hidden');
    }
  }

  updateNavHeader();
};

const logoutUser = async () => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (e) {}
  clearSession();
  showMessage('Logged out successfully.', 'info');
  showView('landingView');
  updateNavHeader();
};

// Global Window Role Card Click Handlers
window.handleCardRoleFarmerClick = () => {
  const session = getSession();
  if (session && String(session.userType || '').toLowerCase() === 'farmer') {
    showView('farmerDashboardView');
    if (window.initFarmerDashboard) window.initFarmerDashboard();
  } else {
    if (typeof window.resetFarmerLoginForm === 'function') {
      window.resetFarmerLoginForm();
    } else if (typeof resetFarmerLoginForm === 'function') {
      resetFarmerLoginForm();
    }
    openModal('farmerLoginModal');
  }
};

window.handleCardRoleBuyerClick = () => {
  const session = getSession();
  if (session && String(session.userType || '').toLowerCase() === 'buyer') {
    showView('buyerDashboardView');
    if (window.initBuyerDashboard) window.initBuyerDashboard();
  } else {
    const banner = getElement('buyerCrossRoleBanner');
    if (banner) banner.classList.add('hidden');
    openModal('buyerLoginModal');
  }
};

window.handleGoDashboardClick = () => {
  const session = getSession();
  if (session && String(session.userType || '').toLowerCase() === 'farmer') {
    showView('farmerDashboardView');
    if (window.initFarmerDashboard) window.initFarmerDashboard();
  } else if (session && String(session.userType || '').toLowerCase() === 'buyer') {
    showView('buyerDashboardView');
    if (window.initBuyerDashboard) window.initBuyerDashboard();
  } else if (session && String(session.userType || '').toLowerCase() === 'admin') {
    window.location.href = '/admin';
  } else {
    openModal('farmerLoginModal');
  }
};

window.showView = showView;
window.saveSession = saveSession;
window.getSession = getSession;
window.clearSession = clearSession;
window.logoutUser = logoutUser;

const updateNavHeader = () => {
  const session = getSession();
  const authNav = getElement('authNavButtons');
  const userNav = getElement('userNavMenu');
  const userNameSpan = getElement('navUserName');
  const farmerBarName = getElement('farmerBarName');
  const buyerBarName = getElement('buyerBarName');
  const landingNotice = getElement('landingSessionNotice');
  const landingName = getElement('landingSessionName');
  const landingRoleBadge = getElement('landingSessionRoleBadge');
  const landingTopLogout = getElement('landingTopLogoutBtn');

  if (session && session.userType) {
    if (authNav) authNav.classList.add('hidden');
    if (userNav) userNav.classList.remove('hidden');
    const displayName = session.name || session.full_name || session.username || session.market_name || 'User';
    if (userNameSpan) userNameSpan.textContent = displayName;
    if (farmerBarName) farmerBarName.textContent = displayName;
    if (buyerBarName) buyerBarName.textContent = displayName;

    if (landingNotice) {
      landingNotice.classList.remove('hidden');
      if (landingName) landingName.textContent = displayName;
      if (landingRoleBadge) {
        landingRoleBadge.textContent = session.userType === 'farmer' ? 'Farmer 🌾' : (session.userType === 'buyer' ? 'Buyer 🏪' : 'Admin 🛡️');
      }
    }
    if (landingTopLogout) landingTopLogout.classList.remove('hidden');
  } else {
    if (authNav) authNav.classList.remove('hidden');
    if (userNav) userNav.classList.add('hidden');
    if (landingNotice) landingNotice.classList.add('hidden');
    if (landingTopLogout) landingTopLogout.classList.add('hidden');
  }
};

// Browser Geolocation Helper
const requestUserLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      showMessage('Geolocation is not supported by your browser.', 'error');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        AppState.userLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          available: true
        };
        resolve(AppState.userLocation);
      },
      (err) => {
        console.warn('Location permission error:', err.message);
        AppState.userLocation.available = false;
        resolve(null);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
};

// Detect GPS Location Action Handler with Button Feedback
const triggerLocationDetection = async (btnElement, stateSelectId, districtSelectId) => {
  if (btnElement) {
    btnElement.innerHTML = `<span>⏳</span> Detecting GPS...`;
    btnElement.disabled = true;
  }

  const loc = await requestUserLocation();
  if (loc && loc.available) {
    showMessage(`GPS location detected: Lat ${loc.latitude.toFixed(4)}, Long ${loc.longitude.toFixed(4)}`, 'success');
    if (btnElement) {
      btnElement.innerHTML = `<span>✓</span> Location Detected (${loc.latitude.toFixed(2)}°, ${loc.longitude.toFixed(2)}°)`;
      btnElement.classList.remove('btn-secondary');
      btnElement.classList.add('btn-success');
    }
  } else {
    showMessage(t('err_location_denied'), 'error');
    if (btnElement) {
      btnElement.innerHTML = `<span>📍</span> ${t('detect_location')}`;
      btnElement.disabled = false;
    }
  }
};

// Cascading Location Dropdowns
const setupLocationDropdowns = (stateId, districtId, mandalId) => {
  const stateSelect = getElement(stateId);
  const districtSelect = getElement(districtId);
  const mandalSelect = getElement(mandalId);

  if (!stateSelect || !districtSelect || !mandalSelect) return;

  stateSelect.innerHTML = `<option value="">-- ${t('state')} --</option>`;
  Object.keys(INDIA_LOCATION_DATA).forEach((state) => {
    stateSelect.innerHTML += `<option value="${state}">${state}</option>`;
  });

  stateSelect.addEventListener('change', () => {
    const selectedState = stateSelect.value;
    districtSelect.innerHTML = `<option value="">-- ${t('district')} --</option>`;
    mandalSelect.innerHTML = `<option value="">-- ${t('mandal')} --</option>`;

    if (selectedState && INDIA_LOCATION_DATA[selectedState]) {
      Object.keys(INDIA_LOCATION_DATA[selectedState]).forEach((district) => {
        districtSelect.innerHTML += `<option value="${district}">${district}</option>`;
      });
    }
  });

  districtSelect.addEventListener('change', () => {
    const selectedState = stateSelect.value;
    const selectedDistrict = districtSelect.value;
    mandalSelect.innerHTML = `<option value="">-- ${t('mandal')} --</option>`;

    if (
      selectedState &&
      selectedDistrict &&
      INDIA_LOCATION_DATA[selectedState] &&
      INDIA_LOCATION_DATA[selectedState][selectedDistrict]
    ) {
      INDIA_LOCATION_DATA[selectedState][selectedDistrict].forEach((mandal) => {
        mandalSelect.innerHTML += `<option value="${mandal}">${mandal}</option>`;
      });
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  // If currently on admin portal, do not run landing/farmer/buyer page logic
  if (window.location.pathname.includes('admin')) {
    return;
  }

  const session = getSession();
  if (session && session.userType) {
    if (session.userType === 'farmer') {
      showView('farmerDashboardView');
      if (window.initFarmerDashboard) window.initFarmerDashboard();
    } else if (session.userType === 'buyer') {
      showView('buyerDashboardView');
      if (window.initBuyerDashboard) window.initBuyerDashboard();
    } else if (session.userType === 'admin') {
      window.location.href = '/admin';
    }
  } else {
    showView('landingView');
  }

  document.querySelectorAll('.modal-close-btn, .modal-backdrop').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    });
  });

  // Global Back to Home Button
  const navBackHomeBtn = getElement('navBackHomeBtn');
  if (navBackHomeBtn) {
    navBackHomeBtn.onclick = (e) => {
      e.preventDefault();
      showView('landingView');
    };
  }

  // Active Session Go to Dashboard Button
  const btnLandingGoDashboard = getElement('btnLandingGoDashboard');
  if (btnLandingGoDashboard) {
    btnLandingGoDashboard.onclick = () => {
      const session = getSession();
      if (session && session.userType === 'farmer') {
        showView('farmerDashboardView');
        if (window.initFarmerDashboard) window.initFarmerDashboard();
      } else if (session && session.userType === 'buyer') {
        showView('buyerDashboardView');
        if (window.initBuyerDashboard) window.initBuyerDashboard();
      } else {
        window.location.href = '/admin';
      }
    };
  }

  // Global Logout Triggers
  document.querySelectorAll('#navLogoutBtn, #btnLandingLogout, #landingTopLogoutBtn, .btn-logout').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  });

  // Global Back to Home Triggers
  document.querySelectorAll('.btn-back-home').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showView('landingView');
    });
  });
});
