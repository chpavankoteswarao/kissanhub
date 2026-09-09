// KISSAN-HUB — farmer.js
// Dedicated module for Farmer functionality with live mandi benchmarks and multilingual voice

let currentFarmerTab = 'tabFarmerRegisterCrop';
let activeSpeechRecognition = null;

// BCP-47 Speech Tag Resolver for all 11 Indian languages
const getSpeechLanguageTag = (lang) => {
  const map = {
    te: 'te-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    mr: 'mr-IN',
    bn: 'bn-IN',
    gu: 'gu-IN',
    pa: 'pa-IN',
    or: 'or-IN',
    en: 'en-IN'
  };
  return map[lang] || 'en-IN';
};

window.initFarmerDashboard = () => {
  const session = getSession();
  if (!session || String(session.userType || '').toLowerCase() !== 'farmer') {
    return;
  }

  const nameEl = getElement('farmerDashboardName');
  if (nameEl) nameEl.textContent = session.name || session.full_name || 'Farmer';

  const tabs = [
    { btn: 'btnTabFarmerRegCrop', content: 'farmerTabContentRegCrop', id: 'tabFarmerRegisterCrop' },
    { btn: 'btnTabFarmerEnrolled', content: 'farmerTabContentEnrolled', id: 'tabFarmerEnrolled' },
    { btn: 'btnTabFarmerSell', content: 'farmerTabContentSell', id: 'tabFarmerSell' },
    { btn: 'btnTabFarmerPrice', content: 'farmerTabContentPrice', id: 'tabFarmerPrice' },
    { btn: 'btnTabFarmerProfile', content: 'farmerTabContentProfile', id: 'tabFarmerProfile' },
    { btn: 'btnTabFarmerMessages', content: 'farmerTabContentMessages', id: 'tabFarmerMessages' },
    { btn: 'btnTabFarmerAi', content: 'farmerTabContentAi', id: 'tabFarmerAi' }
  ];

  window.switchFarmerTab = (btnId, contentId) => {
    tabs.forEach(item => {
      const b = getElement(item.btn);
      const c = getElement(item.content);
      if (b) b.classList.remove('active');
      if (c) c.classList.add('hidden');
    });
    const activeBtn = getElement(btnId);
    const activeContent = getElement(contentId);
    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.remove('hidden');
    if (contentId === 'farmerTabContentMessages' && typeof loadConversations === 'function') {
      loadConversations();
    }
  };

  tabs.forEach(t => {
    const btn = getElement(t.btn);
    if (btn) {
      btn.onclick = () => {
        window.switchFarmerTab(t.btn, t.content);
        currentFarmerTab = t.id;

        if (t.id === 'tabFarmerEnrolled') loadEnrolledCrops();
        if (t.id === 'tabFarmerProfile') loadFarmerProfile();
        if (t.id === 'tabFarmerSell') loadNearbyBuyers();
        if (t.id === 'tabFarmerMessages' && typeof loadConversations === 'function') loadConversations();
        if (t.id === 'tabFarmerPrice') {
          if (window.initGovernmentMandiPrices) {
            initGovernmentMandiPrices('farmer');
          } else {
            loadDefaultDailyMandiPrices();
          }
        }
      };
    }
  });

  const phoneField = getElement('cropRegPhone');
  if (phoneField && session.phone) phoneField.value = session.phone;

  const harvestedInput = getElement('cropRegHarvestedDate');
  if (harvestedInput && !harvestedInput.value) {
    harvestedInput.value = new Date().toISOString().split('T')[0];
  }

  // Location detection button on crop registration
  const btnCropRegGps = getElement('btnCropRegGps');
  if (btnCropRegGps) {
    btnCropRegGps.onclick = () => triggerLocationDetection(btnCropRegGps);
  }

  setupCropPhotoAndAiQuality();
  bindFarmerForms();
  loadEnrolledCrops();
  loadFarmerProfile();
  checkFarmerExpiryAlerts();
};

const setupCropPhotoAndAiQuality = () => {
  const photoInput = getElement('cropRegPhotoInput');
  const btnAiAnalyze = getElement('btnAiAnalyzePhoto');
  const previewBox = getElement('cropPhotoPreviewBox');
  const previewImg = getElement('cropPhotoPreviewImg');
  const scanningOverlay = getElement('aiScanningIndicator');
  const hiddenData = getElement('cropRegPhotoData');
  const hiddenGrade = getElement('cropRegAiGrade');
  const hiddenScore = getElement('cropRegAiScore');
  const hiddenReport = getElement('cropRegAiReport');
  const qualitySelect = getElement('cropRegQuality');
  const cropSelect = getElement('cropRegName');

  if (!photoInput) return;

  const runAiQualityScan = async (imageDataUrl) => {
    if (!imageDataUrl) return;
    if (previewBox) previewBox.classList.remove('hidden');
    if (scanningOverlay) scanningOverlay.classList.remove('hidden');

    const cropName = cropSelect ? cropSelect.value : 'Crop';
    const lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : (localStorage.getItem('kissanHubLanguage') || 'en'));

    try {
      const res = await apiRequest('/ai/analyze-crop-quality', {
        method: 'POST',
        body: JSON.stringify({
          image: imageDataUrl,
          crop_name: cropName,
          language: lang
        })
      });

      if (scanningOverlay) scanningOverlay.classList.add('hidden');

      if (res.ok && res.data) {
        const d = res.data;
        if (hiddenGrade) hiddenGrade.value = d.grade;
        if (hiddenScore) hiddenScore.value = d.quality_score;
        if (hiddenReport) hiddenReport.value = d.summary_report;

        // Auto sync quality grade dropdown
        if (qualitySelect) {
          if (d.grade.startsWith('A')) qualitySelect.value = 'A';
          else if (d.grade.startsWith('B')) qualitySelect.value = 'B';
          else qualitySelect.value = 'C';
        }

        const gradeBadge = getElement('aiQualityGradeBadge');
        const scoreBadge = getElement('aiQualityScoreBadge');
        const reportText = getElement('aiQualityReportText');
        const purityVal = getElement('aiPurityVal');
        const uniformityVal = getElement('aiUniformityVal');
        const moistureVal = getElement('aiMoistureVal');

        if (gradeBadge) gradeBadge.textContent = `Grade ${d.grade}`;
        if (scoreBadge) scoreBadge.textContent = `${d.quality_score}%`;
        if (reportText) reportText.textContent = d.summary_report;
        if (purityVal) purityVal.textContent = d.purity;
        if (uniformityVal) uniformityVal.textContent = d.uniformity;
        if (moistureVal) moistureVal.textContent = d.moisture;

        const engineLabel = d.ai_engine || 'Google Gemini AI';
        showMessage(`🤖 AI Crop Quality Scan Complete (${engineLabel}): Grade ${d.grade} (${d.quality_score}%)`, 'success');
      }
    } catch (err) {
      if (scanningOverlay) scanningOverlay.classList.add('hidden');
      console.error('Error in runAiQualityScan:', err);
    }
  };

  photoInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target.result;
      if (previewImg) previewImg.src = dataUrl;
      if (hiddenData) hiddenData.value = dataUrl;
      if (previewBox) previewBox.classList.remove('hidden');
      // Automatically trigger AI scan upon photo selection
      runAiQualityScan(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  if (btnAiAnalyze) {
    btnAiAnalyze.onclick = () => {
      const dataUrl = hiddenData ? hiddenData.value : null;
      if (!dataUrl) {
        showMessage('Please choose or capture a crop photo first.', 'warning');
        if (photoInput) photoInput.click();
        return;
      }
      runAiQualityScan(dataUrl);
    };
  }
};

const checkFarmerExpiryAlerts = async () => {
  const session = getSession();
  if (!session || session.userType !== 'farmer') return;

  const banner = getElement('farmerExpiryAlertBanner');
  if (!banner) return;

  try {
    const res = await apiRequest(`/farmers/${session.id}/alerts`);
    if (res.ok && res.data && res.data.length > 0) {
      const alert = res.data[0];
      const titleEl = getElement('farmerExpiryAlertTitle');
      const msgEl = getElement('farmerExpiryAlertMsg');

      if (titleEl) titleEl.textContent = `⚠️ Day 4 Expiry Warning: "${alert.crop_name}" Expires Tomorrow!`;
      if (msgEl) msgEl.textContent = alert.message;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  } catch (err) {
    console.error('Error fetching farmer alerts:', err);
  }
};

const bindFarmerForms = () => {
  // 1. Crop Registration
  const cropRegForm = getElement('farmerCropRegistrationForm');
  if (cropRegForm) {
    cropRegForm.onsubmit = async (e) => {
      e.preventDefault();
      const session = getSession();
      if (!session) return;

      const cropType = getElement('cropRegType').value;
      const cropName = getElement('cropRegName').value;
      const quality = getElement('cropRegQuality').value;
      const quantity = getElement('cropRegQuantity').value;
      const harvestedDate = getElement('cropRegHarvestedDate').value;
      const phone = getElement('cropRegPhone').value;
      const aadhaar = getElement('cropRegAadhaar').value;
      const gender = getElement('cropRegGender').value;

      const rawPhotoUrl = getElement('cropRegPhotoData') ? getElement('cropRegPhotoData').value.trim() : '';
      const hasPhoto = Boolean(rawPhotoUrl && rawPhotoUrl.length > 0);
      const photoUrl = hasPhoto ? rawPhotoUrl : null;
      const aiGrade = hasPhoto && getElement('cropRegAiGrade') ? getElement('cropRegAiGrade').value : null;
      const aiScore = hasPhoto && getElement('cropRegAiScore') ? getElement('cropRegAiScore').value : null;
      const aiReport = hasPhoto && getElement('cropRegAiReport') ? getElement('cropRegAiReport').value : null;

      if (!cropName || !quantity) {
        showMessage('Please specify crop name and quantity.', 'error');
        return;
      }

      const res = await apiRequest('/farmers/crops', {
        method: 'POST',
        body: JSON.stringify({
          farmer_id: session.id,
          crop_type: cropType,
          crop_name: cropName,
          quality,
          quantity,
          harvested_date: harvestedDate,
          phone: phone || session.phone,
          aadhaar,
          gender,
          photo_url: photoUrl,
          ai_quality_grade: aiGrade,
          ai_quality_score: aiScore,
          ai_quality_report: aiReport
        })
      });

      if (res.ok) {
        showMessage(t('msg_crop_registered'), 'success');
        cropRegForm.reset();
        const previewBox = getElement('cropPhotoPreviewBox');
        if (previewBox) previewBox.classList.add('hidden');
        if (getElement('cropRegPhotoData')) getElement('cropRegPhotoData').value = '';
        getElement('cropRegPhone').value = session.phone;
        getElement('cropRegHarvestedDate').value = new Date().toISOString().split('T')[0];
        const enrolledTabBtn = getElement('btnTabFarmerEnrolled');
        if (enrolledTabBtn) enrolledTabBtn.click();
        checkFarmerExpiryAlerts();
      } else {
        showMessage(res.message || 'Failed to register crop.', 'error');
      }
    };
  }

  // 2. Sell Search
  const sellSearchForm = getElement('farmerSellSearchForm');
  if (sellSearchForm) {
    sellSearchForm.onsubmit = (e) => {
      e.preventDefault();
      const cropFilter = getElement('farmerSellCropFilter').value;
      loadNearbyBuyers(cropFilter);
    };
  }

  // 3. Mandi Price Search
  const priceSearchForm = getElement('farmerPriceSearchForm');
  if (priceSearchForm) {
    priceSearchForm.onsubmit = async (e) => {
      e.preventDefault();
      const cropInput = getElement('farmerPriceSearchCrop').value.trim();
      if (!cropInput) return;
      queryMandiPrice(cropInput, 'mandiPriceResults');
    };
  }

  // 4. Edit Profile
  const editProfileForm = getElement('farmerEditProfileForm');
  if (editProfileForm) {
    setupLocationDropdowns('farmerEditState', 'farmerEditDistrict', 'farmerEditMandal');

    editProfileForm.onsubmit = async (e) => {
      e.preventDefault();
      const session = getSession();
      if (!session) return;

      const full_name = getElement('farmerEditName').value.trim();
      const state = getElement('farmerEditState').value;
      const district = getElement('farmerEditDistrict').value;
      const mandal = getElement('farmerEditMandal').value;
      const gender = getElement('farmerEditGender').value;

      const res = await apiRequest(`/farmers/${session.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name,
          state,
          district,
          mandal,
          gender,
          latitude: AppState.userLocation.latitude,
          longitude: AppState.userLocation.longitude
        })
      });

      if (res.ok) {
        showMessage(t('msg_saved'), 'success');
        session.name = full_name;
        session.full_name = full_name;
        session.state = state;
        session.district = district;
        session.mandal = mandal;
        saveSession(session);
        closeModal('farmerEditProfileModal');
        loadFarmerProfile();
        updateNavHeader();
      } else {
        showMessage(res.message || 'Failed to update profile.', 'error');
      }
    };
  }

  // 5. AI Chat with Multi-Turn Conversational Memory
  const aiChatForm = getElement('farmerAiChatForm');
  if (aiChatForm) {
    aiChatForm.onsubmit = async (e) => {
      e.preventDefault();
      const input = getElement('farmerAiMessageInput');
      const text = input ? input.value.trim() : '';
      if (!text) return;

      input.value = '';
      appendFarmerAiMessage('user', text);

      if (!window._farmerAiHistory) window._farmerAiHistory = [];
      window._farmerAiHistory.push({ sender: 'user', text });

      const typingId = appendFarmerAiTyping();

      const res = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          userType: 'farmer',
          language: currentLanguage,
          history: window._farmerAiHistory
        })
      });

      removeFarmerAiTyping(typingId);

      if (res.ok && res.data && res.data.reply) {
        window._farmerAiHistory.push({ sender: 'bot', text: res.data.reply });
        appendFarmerAiMessage('bot', res.data.reply);
      } else {
        appendFarmerAiMessage('bot', 'AI assistant is temporarily unavailable. Please try again.');
      }
    };
  }

  // 6. Voice Assistant
  const voiceBtn = getElement('farmerAiVoiceBtn');
  if (voiceBtn) {
    voiceBtn.onclick = () => toggleFarmerVoiceRecognition();
  }
};

// Reusable Mandi Price Query Function (Used by both Farmer and Buyer)
const queryMandiPrice = async (cropInput, containerId) => {
  const resultsContainer = getElement(containerId);
  if (!resultsContainer) return;

  resultsContainer.innerHTML = `<div class="loading-state">${t('loading')}</div>`;

  const res = await apiRequest('/ai/price', {
    method: 'POST',
    body: JSON.stringify({ crop: cropInput, language: currentLanguage })
  });

  if (res.ok && res.data && res.data.available) {
    const item = res.data.data;
    resultsContainer.innerHTML = `
      <div class="price-result-card animate-fade-in">
        <div class="price-card-header">
          <div>
            <h3 class="price-crop-title">${item.crop}</h3>
            <p class="price-mandi-location">📍 ${item.market}, ${item.location}</p>
          </div>
          <div class="price-trend-badge ${item.trend.includes('Up') || item.trend.includes('పెరుగు') || item.trend.includes('बढ़') ? 'trend-up' : 'trend-stable'}">
            ${item.trend}
          </div>
        </div>
        <div class="price-metrics-grid">
          <div class="metric-box">
            <span class="metric-label">${t('benchmark_rate')}</span>
            <span class="metric-value">₹${item.price}</span>
            <span class="metric-sub">${item.unit}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Price Range</span>
            <span class="metric-value text-secondary">${item.price_range}</span>
            <span class="metric-sub">${item.unit}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">${t('date')}</span>
            <span class="metric-value text-sm">${item.date}</span>
            <span class="metric-sub">Official Today's Rate</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">${t('price_source')}</span>
            <span class="metric-value text-sm">${item.source}</span>
            <span class="metric-sub">Verified Govt Feed</span>
          </div>
        </div>
        <div class="ai-explanation-box">
          <div class="ai-box-title">
            <span>🤖</span> <strong>${t('ai_explanation')}</strong>
          </div>
          <p class="ai-box-text">${item.explanation}</p>
        </div>
      </div>
    `;
  } else {
    resultsContainer.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon">⚠️</div>
        <h4>${t('price_unavailable')}</h4>
        <p class="text-muted">Verified daily mandi data for "${cropInput}" is currently not indexed. We never fabricate market rates.</p>
      </div>
    `;
  }
};

// Auto-load daily benchmark prices table
const loadDefaultDailyMandiPrices = async (targetContainerId = 'mandiPriceResults') => {
  const container = getElement(targetContainerId);
  if (!container) return;

  const res = await apiRequest('/ai/prices'); // retrieves today's verified prices publicly
  if (res.ok && res.data && res.data.length > 0) {
    container.innerHTML = `
      <h4 style="margin-bottom: 0.75rem; font-weight: 700; color: var(--primary-dark);">Today's Govt & APMC Benchmark Rates (${new Date().toISOString().split('T')[0]})</h4>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('crop')}</th>
              <th>${t('mandi_name')}</th>
              <th>${t('location')}</th>
              <th>${t('price')}</th>
              <th>${t('date')}</th>
              <th>${t('price_source')}</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.slice(0, 10).map(p => `
              <tr style="cursor: pointer;" onclick="queryMandiPrice('${p.crop_name}', '${targetContainerId}')">
                <td class="font-bold text-success">🌾 ${p.crop_name}</td>
                <td>${p.market_name}</td>
                <td>${p.district ? p.district + ', ' : ''}${p.state || '-'}</td>
                <td class="font-bold">₹${p.price} <span class="text-xs text-muted">${p.unit}</span></td>
                <td><span class="status-badge status-badge-active">${p.price_date}</span></td>
                <td><span class="text-xs text-muted">${p.source}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

const loadEnrolledCrops = async () => {
  const session = getSession();
  if (!session) return;

  const container = getElement('farmerEnrolledCropsList');
  if (!container) return;

  container.innerHTML = `<div class="loading-state">${t('loading')}</div>`;

  const res = await apiRequest(`/farmers/${session.id}/crops`);

  if (res.ok && res.data && res.data.length > 0) {
    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Produce</th>
              <th>${t('crop_type')}</th>
              <th>AI Quality & Grade</th>
              <th>${t('quantity')}</th>
              <th>${t('col_harvest_date')}</th>
              <th>${t('col_reg_date')}</th>
              <th>${t('col_expiry_date')}</th>
              <th>${t('status')}</th>
              <th>${t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(crop => {
              const regFormatted = crop.created_at ? crop.created_at.split('T')[0] : '-';
              const expFormatted = crop.expires_at ? crop.expires_at.split('T')[0] : '-';
              let statusBadge = `<span class="status-badge status-badge-active">${crop.status_label}</span>`;
              if (crop.status === 'PURCHASED') {
                statusBadge = `<span class="status-badge" style="background:#dcfce7; color:#15803d; border:1px solid #86efac; font-weight:800;">✅ Sold / Purchased (${crop.rating ? '★ ' + crop.rating : 'Rated'})</span>`;
              } else if (crop.is_expiring_tomorrow) {
                statusBadge = `<span class="status-badge" style="background:#fef3c7; color:#b45309; border:1px solid #f59e0b; font-weight:800;">⚠️ Disabling Tomorrow! (Day 4)</span>`;
              } else if (crop.is_expired) {
                statusBadge = `<span class="status-badge status-badge-expired">Expired</span>`;
              }

              const photoThumb = crop.photo_url
                ? `<img src="${crop.photo_url}" style="width:38px;height:38px;object-fit:cover;border-radius:4px;border:1px solid #cbd5e1;" alt="${crop.crop_name}" />`
                : `<span style="font-size:1.4rem;">🌾</span>`;

              return `
                <tr>
                  <td class="font-bold">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                      ${photoThumb}
                      <div>
                        <div>${crop.crop_name}</div>
                        ${crop.photo_url ? '<span class="text-xs text-muted">📷 Photo verified</span>' : ''}
                      </div>
                    </div>
                  </td>
                  <td>${crop.crop_type || 'Food Grain'}</td>
                  <td>
                    <span class="quality-tag">Grade ${crop.ai_quality_grade || crop.quality}</span>
                    <span class="text-xs text-muted" style="display:block;">AI: ${crop.ai_quality_score || 92}%</span>
                  </td>
                  <td>${crop.quantity} ${t('quintals')}</td>
                  <td>${crop.harvested_date || '-'}</td>
                  <td>${regFormatted}</td>
                  <td>${expFormatted}</td>
                  <td>${statusBadge}</td>
                  <td>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteCrop(${crop.id})">
                      ${t('delete')}
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon">🌾</div>
        <h4>${t('no_enrolled_crops')}</h4>
      </div>
    `;
  }
};

window.confirmDeleteCrop = async (cropId) => {
  if (!confirm(t('confirm_delete'))) return;

  const res = await apiRequest(`/farmers/crops/${cropId}`, { method: 'DELETE' });
  if (res.ok) {
    showMessage('Crop listing deleted.', 'info');
    loadEnrolledCrops();
  } else {
    showMessage(res.message || 'Error deleting crop.', 'error');
  }
};

const loadNearbyBuyers = async (cropFilter = '') => {
  const container = getElement('farmerNearbyBuyersList');
  if (!container) return;

  container.innerHTML = `<div class="loading-state">${t('loading')}</div>`;

  let lat = AppState.userLocation.latitude;
  let lon = AppState.userLocation.longitude;

  if (!lat || !lon) {
    const loc = await requestUserLocation();
    if (loc) {
      lat = loc.latitude;
      lon = loc.longitude;
    }
  }

  let endpoint = `/farmers/nearby-buyers?crop=${encodeURIComponent(cropFilter || '')}`;
  if (lat && lon) {
    endpoint += `&latitude=${lat}&longitude=${lon}`;
  }

  const res = await apiRequest(endpoint);

  if (!window._nearbyBuyersCache) window._nearbyBuyersCache = new Map();
  window._nearbyBuyersCache.clear();

  if (res.ok && res.data && res.data.length > 0) {
    res.data.forEach(b => window._nearbyBuyersCache.set(b.id, b));

    container.innerHTML = `
      <div class="buyer-cards-grid">
        ${res.data.map(b => `
          <div class="buyer-card animate-fade-in">
            <div class="buyer-card-header">
              <div>
                <h4 class="buyer-market-name">${b.market_name}</h4>
                <p class="buyer-owner">👤 ${b.buyer_name}</p>
                <p class="buyer-location">📍 ${b.location}</p>
              </div>
              <div class="distance-badge">
                <span>📍</span> ${b.distance} km away
              </div>
            </div>
            <div class="buyer-crop-details">
              <div class="crop-badge-pill">${b.crop}</div>
              <div class="detail-row">
                <span>${t('required_qty')}:</span>
                <strong>${b.required_quantity} ${t('quintals')}</strong>
              </div>
              <div class="detail-row">
                <span>${t('required_grade')}:</span>
                <strong>Grade ${b.required_quality}</strong>
              </div>
              <div class="detail-row price-highlight">
                <span>${t('offering_price')}:</span>
                <strong>₹${b.current_buying_price}/${t('quintals')}</strong>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
              <button type="button" class="btn btn-primary btn-sm flex-1 font-bold" onclick="window.startChatWithBuyerById(${b.id})">
                💬 ${t('chat_with_buyer')}
              </button>
              <button type="button" class="btn btn-secondary btn-sm flex-1 font-bold" onclick="window.viewBuyerDetailsById(${b.id})">
                🔍 ${t('view_details_of_buyer')}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon">🏢</div>
        <h4>${t('no_buyers_found')}</h4>
        <p class="text-muted">Try searching for a different crop or check back as verified buyers register new demands.</p>
      </div>
    `;
  }
};

window.viewBuyerDetailsById = (buyerId) => {
  const idNum = parseInt(buyerId, 10);
  const buyer = window._nearbyBuyersCache ? window._nearbyBuyersCache.get(idNum) : null;
  if (!buyer) {
    showMessage('Could not load buyer details.', 'error');
    return;
  }
  viewBuyerContactModal(buyer);
};

window.startChatWithBuyerById = (buyerId) => {
  const idNum = parseInt(buyerId, 10);
  const buyer = window._nearbyBuyersCache ? window._nearbyBuyersCache.get(idNum) : null;
  if (!buyer) return;
  if (window.startChatWithBuyer) {
    window.startChatWithBuyer(buyer);
  }
};

window.viewBuyerContactModal = (buyer) => {
  const modal = getElement('buyerDetailsModal');
  const detailsEl = getElement('buyerDetailsContent');
  if (!modal || !detailsEl) return;

  const buyerId = buyer.buyer_id || buyer.id;
  const buyerNameSafe = (buyer.buyer_name || buyer.market_name || 'Buyer').replace(/'/g, "\\'");

  detailsEl.innerHTML = `
    <div class="contact-details-box">
      <h3 style="color:#0f3813; margin-bottom:0.4rem;">${buyer.market_name}</h3>
      <div class="info-line"><strong>${t('full_name')}:</strong> ${buyer.buyer_name}</div>
      <div class="info-line"><strong>${t('location')}:</strong> ${buyer.location}</div>
      <div class="info-line"><strong>${t('distance')}:</strong> ${buyer.distance} km away</div>
      <div class="info-line"><strong>Verification:</strong> <span class="badge badge-success">🛡️ Verified Procurement Partner</span></div>
      <div class="info-line"><strong>Contact Status:</strong> <span class="badge" style="background:#e0f2fe; color:#0369a1;">📞 In-App Verified (${buyer.phone_masked || 'Verified'})</span></div>
      <hr class="modal-divider"/>
      <h4>Crop Demand Lot</h4>
      <div class="info-line"><strong>${t('crop')}:</strong> ${buyer.crop}</div>
      <div class="info-line"><strong>${t('quantity')}:</strong> ${buyer.required_quantity} ${t('quintals')}</div>
      <div class="info-line"><strong>${t('quality')}:</strong> Grade ${buyer.required_quality}</div>
      <div class="info-line"><strong>${t('offering_price')}:</strong> ₹${buyer.current_buying_price}/Quintal</div>
      
      <div class="action-buttons-group mt-3" style="display: flex; flex-direction: column; gap: 0.5rem;">
        <button type="button" class="btn btn-primary btn-block font-bold" onclick="closeModal('buyerDetailsModal'); window.startChatWithBuyerById(${buyer.id});">
          💬 Chat with Buyer Directly
        </button>
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-secondary flex-1 font-bold" onclick="closeModal('buyerDetailsModal'); window.startDirectCallFromModal(${buyerId}, 'buyer', '${buyerNameSafe}', 'voice')">
            📞 Voice Call
          </button>
          <button type="button" class="btn btn-secondary flex-1 font-bold" onclick="closeModal('buyerDetailsModal'); window.startDirectCallFromModal(${buyerId}, 'buyer', '${buyerNameSafe}', 'video')">
            📹 Video Call
          </button>
        </div>
      </div>
    </div>
  `;
  openModal('buyerDetailsModal');
};

const loadFarmerProfile = async () => {
  const session = getSession();
  if (!session) return;

  const res = await apiRequest(`/farmers/${session.phone}`);
  if (res.ok && res.data) {
    const f = res.data;
    const nameEl = getElement('profFarmerName');
    const stateEl = getElement('profFarmerState');
    const distEl = getElement('profFarmerDistrict');
    const mandalEl = getElement('profFarmerMandal');
    const phoneEl = getElement('profFarmerPhone');
    const aadhaarEl = getElement('profFarmerAadhaar');
    const genderEl = getElement('profFarmerGender');

    if (nameEl) nameEl.textContent = f.full_name;
    if (stateEl) stateEl.textContent = f.state || '-';
    if (distEl) distEl.textContent = f.district || '-';
    if (mandalEl) mandalEl.textContent = f.mandal || '-';
    if (phoneEl) phoneEl.textContent = f.phone;
    if (aadhaarEl) aadhaarEl.textContent = f.aadhaar || 'Not Provided';
    if (genderEl) genderEl.textContent = f.gender || 'Not Specified';

    const btnEdit = getElement('btnOpenFarmerEditProfile');
    if (btnEdit) {
      btnEdit.onclick = () => {
        getElement('farmerEditName').value = f.full_name;
        getElement('farmerEditState').value = f.state || '';
        getElement('farmerEditState').dispatchEvent(new Event('change'));
        setTimeout(() => {
          getElement('farmerEditDistrict').value = f.district || '';
          getElement('farmerEditDistrict').dispatchEvent(new Event('change'));
          setTimeout(() => {
            getElement('farmerEditMandal').value = f.mandal || '';
          }, 100);
        }, 100);
        getElement('farmerEditGender').value = f.gender || 'Male';
        openModal('farmerEditProfileModal');
      };
    }
  }
};

const appendFarmerAiMessage = (sender, text) => {
  const container = getElement('farmerAiChatHistory');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-bubble ${sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`;
  msgDiv.innerHTML = text.replace(/\n/g, '<br/>');

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;

  if (sender === 'bot' && window.speechSynthesis) {
    speakText(text);
  }
};

const appendFarmerAiTyping = () => {
  const container = getElement('farmerAiChatHistory');
  if (!container) return null;

  const id = 'typing_' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'chat-bubble chat-bubble-bot typing-indicator';
  div.innerHTML = `<span>.</span><span>.</span><span>.</span>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
};

const removeFarmerAiTyping = (id) => {
  if (!id) return;
  const el = getElement(id);
  if (el) el.remove();
};

const toggleFarmerVoiceRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showMessage(t('ai_speech_error'), 'error');
    return;
  }

  const voiceBtn = getElement('farmerAiVoiceBtn');

  if (activeSpeechRecognition) {
    activeSpeechRecognition.stop();
    activeSpeechRecognition = null;
    if (voiceBtn) voiceBtn.classList.remove('recording');
    return;
  }

  const recognition = new SpeechRecognition();
  activeSpeechRecognition = recognition;
  recognition.lang = getSpeechLanguageTag(currentLanguage);
  recognition.continuous = false;
  recognition.interimResults = false;

  if (voiceBtn) voiceBtn.classList.add('recording');

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const input = getElement('farmerAiMessageInput');
    if (input) {
      input.value = transcript;
      const form = getElement('farmerAiChatForm');
      if (form) form.dispatchEvent(new Event('submit'));
    }
  };

  recognition.onerror = () => {
    if (voiceBtn) voiceBtn.classList.remove('recording');
    activeSpeechRecognition = null;
  };

  recognition.onend = () => {
    if (voiceBtn) voiceBtn.classList.remove('recording');
    activeSpeechRecognition = null;
  };

  try {
    recognition.start();
  } catch (err) {
    if (voiceBtn) voiceBtn.classList.remove('recording');
  }
};

const speakText = (text) => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langTag = getSpeechLanguageTag(currentLanguage);
    utterance.lang = langTag;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang === langTag || v.lang.startsWith(langTag.slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
};

window.addEventListener('languageChanged', () => {
  const dash = document.getElementById('farmerDashboardView');
  if (dash && !dash.classList.contains('hidden')) {
    if (typeof loadEnrolledCrops === 'function') loadEnrolledCrops();
    if (typeof loadNearbyBuyers === 'function') loadNearbyBuyers();
  }
});
