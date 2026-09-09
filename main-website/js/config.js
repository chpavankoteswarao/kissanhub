// KISSAN-HUB — Global Environment & Server URL Configuration
// ==============================================================================
// 📌 DEPLOYMENT INSTRUCTIONS FOR VERCEL (Frontend) + RENDER (Backend):
//
// 1. Deploy your backend repository/folder to Render.
//    Render will assign you a live backend URL (e.g. https://kissan-hub-backend.onrender.com).
//
// 2. Open this file (js/config.js) and paste that Render URL below into BACKEND_URL:
//    BACKEND_URL: 'https://kissan-hub-backend.onrender.com'
//
// 3. Deploy this frontend repository/folder to Vercel.
//
// * Note: If BACKEND_URL is left empty '', it automatically defaults to the same origin (ideal for local testing).
// ==============================================================================

window.KISSAN_CONFIG = {
  // 👉 PASTE YOUR RENDER BACKEND URL HERE WHEN DEPLOYING:
  BACKEND_URL: ''
};

(function () {
  const customUrl = (window.KISSAN_CONFIG && window.KISSAN_CONFIG.BACKEND_URL || '').replace(/\/+$/, '');
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  window.API_BASE_URL = customUrl ? `${customUrl}/api` : '/api';
  window.BACKEND_ORIGIN = customUrl || (isLocal ? window.location.origin : '');
})();
