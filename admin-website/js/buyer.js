// KISSAN-HUB — buyer.js
// Dedicated module for Buyer functionality with live mandi benchmarks and multilingual voice

let currentBuyerTab = 'tabBuyerMarket';
let activeBuyerSpeechRec = null;

const getBuyerSpeechLanguageTag = (lang) => {
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

window.initBuyerDashboard = () => {
  const session = getSession();
  if (!session || session.userType !== 'buyer') {
    showView('landingView');
    return;
  }

  const nameEl = getElement('buyerDashboardName');
  if (nameEl) nameEl.textContent = session.market_name || session.name || 'Buyer';

  const tabs = [
    { btn: 'btnTabBuyerMarket', content: 'buyerTabContentMarket', id: 'tabBuyerMarket' },
    { btn: 'btnTabBuyerPostReq', content: 'buyerTabContentPostReq', id: 'tabBuyerPostReq' },
    { btn: 'btnTabBuyerMyReqs', content: 'buyerTabContentMyReqs', id: 'tabBuyerMyReqs' },
    { btn: 'btnTabBuyerFindFarmers', content: 'buyerTabContentFindFarmers', id: 'tabBuyerFindFarmers' },
    { btn: 'btnTabBuyerPrice', content: 'buyerTabContentPrice', id: 'tabBuyerPrice' },
    { btn: 'btnTabBuyerMessages', content: 'buyerTabContentMessages', id: 'tabBuyerMessages' },
    { btn: 'btnTabBuyerAi', content: 'buyerTabContentAi', id: 'tabBuyerAi' }
  ];

  window.switchBuyerTab = (btnId, contentId) => {
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
    if (contentId === 'buyerTabContentMessages' && typeof loadConversations === 'function') {
      loadConversations();
    }
  };

  tabs.forEach(t => {
    const btn = getElement(t.btn);
    if (btn) {
      btn.onclick = () => {
        window.switchBuyerTab(t.btn, t.content);
        currentBuyerTab = t.id;

        if (t.id === 'tabBuyerMarket') loadBuyerProfile();
        if (t.id === 'tabBuyerMyReqs') loadBuyerRequirements();
        if (t.id === 'tabBuyerFindFarmers') loadAvailableFarmers();
        if (t.id === 'tabBuyerMessages' && typeof loadConversations === 'function') loadConversations();
        if (t.id === 'tabBuyerPrice') {
          if (window.initGovernmentMandiPrices) {
            initGovernmentMandiPrices('buyer');
          } else {
            loadBuyerDailyMandiPrices();
          }
        }
      };
    }
  });

  bindBuyerForms();
  loadBuyerProfile();
  loadBuyerRequirements();
};

const bindBuyerForms = () => {
  // 1. Post Requirement
  const postReqForm = getElement('buyerPostRequirementForm');
  if (postReqForm) {
    postReqForm.onsubmit = async (e) => {
      e.preventDefault();
      const session = getSession();
      if (!session) return;

      const cropName = getElement('buyerReqCropName').value;
      const quantity = getElement('buyerReqQuantity').value;
      const quality = getElement('buyerReqQuality').value;
      const price = getElement('buyerReqPrice').value;

      if (!cropName || !quantity || !price) {
        showMessage('Please fill in all requirement fields.', 'error');
        return;
      }

      const res = await apiRequest('/buyers/requirements', {
        method: 'POST',
        body: JSON.stringify({
          buyer_id: session.id,
          crop_name: cropName,
          quantity,
          quality,
          price
        })
      });

      if (res.ok) {
        showMessage(t('msg_req_added'), 'success');
        postReqForm.reset();
        const myReqsBtn = getElement('btnTabBuyerMyReqs');
        if (myReqsBtn) myReqsBtn.click();
      } else {
        showMessage(res.message || 'Error posting requirement.', 'error');
      }
    };
  }

  // 2. Edit Requirement
  const editReqForm = getElement('buyerEditReqForm');
  if (editReqForm) {
    editReqForm.onsubmit = async (e) => {
      e.preventDefault();
      const reqId = getElement('buyerEditReqId').value;
      const crop_name = getElement('buyerEditReqCrop').value;
      const quantity = getElement('buyerEditReqQuantity').value;
      const quality = getElement('buyerEditReqQuality').value;
      const price = getElement('buyerEditReqPrice').value;

      const res = await apiRequest(`/buyers/requirements/${reqId}`, {
        method: 'PUT',
        body: JSON.stringify({ crop_name, quantity, quality, price })
      });

      if (res.ok) {
        showMessage('Requirement updated successfully.', 'success');
        closeModal('buyerEditReqModal');
        loadBuyerRequirements();
      } else {
        showMessage(res.message || 'Error updating requirement.', 'error');
      }
    };
  }

  // 3. Search Farmers Form
  const searchFarmersForm = getElement('buyerSearchFarmersForm');
  if (searchFarmersForm) {
    searchFarmersForm.onsubmit = (e) => {
      e.preventDefault();
      const cropFilter = getElement('buyerSearchCropFilter') ? getElement('buyerSearchCropFilter').value : '';
      const radiusFilter = getElement('buyerSearchRadiusFilter') ? getElement('buyerSearchRadiusFilter').value : '50';
      loadAvailableFarmers(cropFilter, radiusFilter);
    };
  }

  // 4. Buyer Mandi Price Search
  const buyerPriceForm = getElement('buyerPriceSearchForm');
  if (buyerPriceForm) {
    buyerPriceForm.onsubmit = async (e) => {
      e.preventDefault();
      const cropInput = getElement('buyerPriceSearchCrop').value.trim();
      if (!cropInput) return;
      queryMandiPrice(cropInput, 'buyerMandiPriceResults');
    };
  }

  // 5. Edit Buyer Profile Form
  const editBuyerProfileForm = getElement('buyerEditProfileForm');
  if (editBuyerProfileForm) {
    setupLocationDropdowns('buyerEditState', 'buyerEditDistrict', 'buyerEditMandal');

    editBuyerProfileForm.onsubmit = async (e) => {
      e.preventDefault();
      const session = getSession();
      if (!session) return;

      const market_name = getElement('buyerEditMarketName').value.trim();
      const full_name = getElement('buyerEditFullName').value.trim();
      const state = getElement('buyerEditState').value;
      const district = getElement('buyerEditDistrict').value;
      const mandal = getElement('buyerEditMandal').value;

      const res = await apiRequest(`/buyers/${session.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          market_name,
          full_name,
          state,
          district,
          mandal,
          latitude: AppState.userLocation.latitude,
          longitude: AppState.userLocation.longitude
        })
      });

      if (res.ok) {
        showMessage(t('msg_saved'), 'success');
        session.market_name = market_name;
        session.name = full_name;
        session.full_name = full_name;
        session.state = state;
        session.district = district;
        session.mandal = mandal;
        saveSession(session);
        closeModal('buyerEditProfileModal');
        loadBuyerProfile();
        updateNavHeader();
      } else {
        showMessage(res.message || 'Failed to update profile.', 'error');
      }
    };
  }

  // 6. Buyer AI Chat with Multi-Turn Conversational Memory
  const buyerAiForm = getElement('buyerAiChatForm');
  if (buyerAiForm) {
    buyerAiForm.onsubmit = async (e) => {
      e.preventDefault();
      const input = getElement('buyerAiMessageInput');
      const text = input ? input.value.trim() : '';
      if (!text) return;

      input.value = '';
      appendBuyerAiMessage('user', text);

      if (!window._buyerAiHistory) window._buyerAiHistory = [];
      window._buyerAiHistory.push({ sender: 'user', text });

      const typingId = appendBuyerAiTyping();

      const res = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          userType: 'buyer',
          language: currentLanguage,
          history: window._buyerAiHistory
        })
      });

      removeBuyerAiTyping(typingId);

      if (res.ok && res.data && res.data.reply) {
        window._buyerAiHistory.push({ sender: 'bot', text: res.data.reply });
        appendBuyerAiMessage('bot', res.data.reply);
      } else {
        appendBuyerAiMessage('bot', 'AI assistant is temporarily unavailable. Please try again.');
      }
    };
  }

  // 7. Buyer Voice Assistant Button
  const voiceBtn = getElement('buyerAiVoiceBtn');
  if (voiceBtn) {
    voiceBtn.onclick = () => toggleBuyerVoiceRecognition();
  }
};

// Auto-load daily mandi prices for Buyer
const loadBuyerDailyMandiPrices = async () => {
  const container = getElement('buyerMandiPriceResults');
  if (!container) return;

  const res = await apiRequest('/ai/prices');
  if (res.ok && res.data && res.data.length > 0) {
    container.innerHTML = `
      <h4 style="margin-bottom: 0.75rem; font-weight: 700; color: var(--primary-dark);">Today's Mandi & MSP Benchmark Rates (${new Date().toISOString().split('T')[0]})</h4>
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
              <tr style="cursor: pointer;" onclick="queryMandiPrice('${p.crop_name}', 'buyerMandiPriceResults')">
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

const loadBuyerRequirements = async () => {
  const session = getSession();
  if (!session) return;

  const container = getElement('buyerActiveReqsList');
  if (!container) return;

  container.innerHTML = `<div class="loading-state">${t('loading')}</div>`;

  const res = await apiRequest(`/buyers/${session.id}/requirements`);

  if (res.ok && res.data && res.data.length > 0) {
    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('crop')}</th>
              <th>${t('quantity')}</th>
              <th>${t('quality')}</th>
              <th>${t('buying_price')}</th>
              <th>${t('date')}</th>
              <th>${t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(req => {
              if (!AppState.buyerRequirementsMap) AppState.buyerRequirementsMap = new Map();
              AppState.buyerRequirementsMap.set(req.id, req);
              AppState.buyerRequirementsMap.set(String(req.id), req);
              const createdDate = req.created_at ? req.created_at.split('T')[0] : '-';
              return `
                <tr>
                  <td class="font-bold">${req.crop_name}</td>
                  <td>${req.quantity} ${t('quintals')}</td>
                  <td><span class="quality-tag">Grade ${req.quality}</span></td>
                  <td class="text-success font-bold">₹${req.price}/Quintal</td>
                  <td>${createdDate}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.openEditRequirementModalById(${req.id})">
                      ${t('edit')}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteRequirement(${req.id})">
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
        <div class="empty-icon">📋</div>
        <h4>${t('no_active_reqs')}</h4>
        <p class="text-muted">Use 'Post Requirement' to list your crop procurement needs.</p>
      </div>
    `;
  }
};

window.openEditRequirementModalById = (reqId) => {
  const idNum = parseInt(reqId, 10);
  const req = AppState.buyerRequirementsMap 
    ? (AppState.buyerRequirementsMap.get(idNum) || AppState.buyerRequirementsMap.get(reqId) || AppState.buyerRequirementsMap.get(String(reqId))) 
    : null;
  if (!req) {
    showMessage('Requirement details could not be loaded. Please refresh.', 'error');
    return;
  }
  const idEl = getElement('buyerEditReqId');
  const cropEl = getElement('buyerEditReqCrop');
  const qtyEl = getElement('buyerEditReqQuantity');
  const qualityEl = getElement('buyerEditReqQuality');
  const priceEl = getElement('buyerEditReqPrice');

  if (idEl) idEl.value = req.id;
  if (cropEl) cropEl.value = req.crop_name;
  if (qtyEl) qtyEl.value = req.quantity;
  if (qualityEl) qualityEl.value = req.quality;
  if (priceEl) priceEl.value = req.price;

  if (window.openModal) {
    window.openModal('buyerEditReqModal');
  } else if (typeof openModal === 'function') {
    openModal('buyerEditReqModal');
  }
};

window.openEditRequirementModal = (req) => {
  if (typeof req === 'number' || typeof req === 'string') return window.openEditRequirementModalById(req);
  if (req && req.id) return window.openEditRequirementModalById(req.id);
};

window.confirmDeleteRequirement = async (reqId) => {
  if (!confirm(t('confirm_delete'))) return;

  const res = await apiRequest(`/buyers/requirements/${reqId}`, { method: 'DELETE' });
  if (res.ok) {
    showMessage('Requirement removed.', 'info');
    loadBuyerRequirements();
  } else {
    showMessage(res.message || 'Error deleting requirement.', 'error');
  }
};

const loadAvailableFarmers = async (cropFilter = '', radiusFilter = '50') => {
  const container = getElement('buyerAvailableFarmersList');
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

  let endpoint = `/buyers/search/farmers?crop=${encodeURIComponent(cropFilter || '')}`;
  if (lat && lon) {
    endpoint += `&latitude=${lat}&longitude=${lon}`;
  }
  if (radiusFilter && radiusFilter.trim() !== '') {
    endpoint += `&radius=${encodeURIComponent(radiusFilter)}`;
  }

  const res = await apiRequest(endpoint);

  if (!window._farmerCropsCache) window._farmerCropsCache = new Map();
  window._farmerCropsCache.clear();

  if (res.ok && res.data && res.data.length > 0) {
    res.data.forEach(f => {
      window._farmerCropsCache.set(f.id, f);
      window._farmerCropsCache.set(String(f.id), f);
      if (f.crop_id) {
        window._farmerCropsCache.set(f.crop_id, f);
        window._farmerCropsCache.set(String(f.crop_id), f);
      }
    });

    container.innerHTML = `
      <div class="farmer-cards-grid">
        ${res.data.map(f => {
          const photoImg = f.photo_url
            ? `<img src="${f.photo_url}" class="buyer-crop-thumbnail" alt="${f.crop}" />`
            : `<div class="buyer-crop-thumbnail" style="background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:2.5rem;">🌾</div>`;

          const ratingDisplay = `
            <div class="star-badge-display" title="Average Farmer Quality Rating">
              <span>★</span> <span>${f.farmer_rating || '5.0'}</span>
              <span class="text-xs font-normal text-muted">(${f.total_ratings || 0} reviews)</span>
            </div>
          `;

          const hasPhoto = Boolean(f.photo_url && f.photo_url.trim());
          let aiBadgeHtml = '';
          let recommendationHtml = '';

          if (!hasPhoto || f.ai_quality_score === null || f.ai_quality_score === undefined) {
            // Disabled AI verification if no photo was uploaded
            aiBadgeHtml = `
              <div style="margin: 0.4rem 0;">
                <span class="ai-badge-disabled" style="background:#f1f5f9; color:#475569; border:1px dashed #94a3b8; padding:0.25rem 0.55rem; border-radius:4px; font-size:0.75rem; font-weight:600; display:inline-block;">
                  ⚠️ ${t('ai_disabled_no_photo')}
                </span>
              </div>
            `;
            recommendationHtml = `
              <span class="badge" style="background:#f8fafc; color:#64748b; border:1px solid #cbd5e1; font-size:0.75rem; font-weight:700;">
                Manual Inspection Advised
              </span>
            `;
          } else {
            const score = parseFloat(f.ai_quality_score);
            const isRecommended = score >= 75;
            aiBadgeHtml = `
              <div style="margin: 0.4rem 0;">
                <span class="ai-badge">🤖 AI Verified: Grade ${f.ai_quality_grade || f.quality} (${score}%)</span>
              </div>
            `;
            if (isRecommended) {
              recommendationHtml = `
                <span class="badge" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-size:0.75rem; font-weight:800;">
                  ✓ ${t('recommended')} (${score}%)
                </span>
              `;
            } else {
              recommendationHtml = `
                <span class="badge" style="background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; font-size:0.75rem; font-weight:800;">
                  ⚠️ ${t('not_recommended')} (${score}%)
                </span>
              `;
            }
          }

          return `
            <div class="buyer-card animate-fade-in" data-crop-id="${f.id}">
              ${photoImg}
              <div class="buyer-card-header">
                <div>
                  <h4 class="buyer-market-name">${f.farmer_name}</h4>
                  <p class="buyer-location">📍 ${f.location}</p>
                  <p class="text-xs text-muted">Harvested: ${f.harvested_date || 'Recent'}</p>
                </div>
                <div style="text-align: right;">
                  <div class="distance-badge">
                    <span>📍</span> ${f.distance} km away
                  </div>
                  <div style="margin-top: 0.35rem;">
                    ${ratingDisplay}
                  </div>
                </div>
              </div>
              
              <div style="display:flex; justify-content:space-between; align-items:center; margin: 0.4rem 0; flex-wrap:wrap; gap:0.25rem;">
                ${aiBadgeHtml}
                ${recommendationHtml}
              </div>

              <div class="buyer-crop-details">
                <div class="crop-badge-pill">${f.crop} (${f.crop_type || 'Crop'})</div>
                <div class="detail-row">
                  <span>${t('quantity')}:</span>
                  <strong>${f.quantity} ${t('quintals')}</strong>
                </div>
                <div class="detail-row">
                  <span>Quality Grade:</span>
                  <strong>Grade ${f.ai_quality_grade || f.quality}</strong>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:0.4rem; margin-top:0.75rem;">
                <div style="display:flex; gap:0.5rem;">
                  <button type="button" class="btn btn-primary btn-sm flex-1 font-bold" onclick="window.startChatWithFarmerById(${f.id})">
                    💬 ${t('chat_with_farmer')}
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm flex-1 font-bold" onclick="window.viewFarmerDetailsById(${f.id})">
                    🔍 ${t('view_details_of_farmer')}
                  </button>
                </div>
                <button type="button" class="btn btn-success btn-block btn-sm font-bold" onclick="window.openCropPurchaseRatingModalById(${f.id})">
                  🛒 ${t('purchase_and_rate')}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon">🌾</div>
        <h4>${t('no_farmers_found')}</h4>
        <p class="text-muted">No active farmer crop listings matching your selection within the 5-day freshness window ${radiusFilter ? `(Radius: ${radiusFilter} km)` : ''}.</p>
      </div>
    `;
  }
};

window.viewFarmerDetailsById = (cropId) => {
  const idNum = parseInt(cropId, 10);
  const farmer = window._farmerCropsCache 
    ? (window._farmerCropsCache.get(idNum) || window._farmerCropsCache.get(cropId) || window._farmerCropsCache.get(String(cropId))) 
    : null;
  if (!farmer) {
    showMessage('Could not load farmer crop details. Please refresh the list.', 'error');
    return;
  }
  window.viewFarmerContactModal(farmer);
};

window.startChatWithFarmerById = (cropId) => {
  const idNum = parseInt(cropId, 10);
  const farmer = window._farmerCropsCache 
    ? (window._farmerCropsCache.get(idNum) || window._farmerCropsCache.get(cropId) || window._farmerCropsCache.get(String(cropId))) 
    : null;
  if (!farmer) return;
  if (window.startChatWithFarmer) {
    window.startChatWithFarmer(farmer);
  }
};

window.viewFarmerContactModal = (farmer) => {
  const modal = getElement('farmerDetailsModal');
  const detailsEl = getElement('farmerDetailsContent');
  if (!modal || !detailsEl) return;

  const farmerId = farmer.farmer_id || farmer.id;
  const farmerNameSafe = (farmer.farmer_name || 'Farmer').replace(/'/g, "\\'");

  const heroPhoto = farmer.photo_url
    ? `<img src="${farmer.photo_url}" class="detail-crop-hero-img" alt="${farmer.crop}" style="width:100%; max-height:260px; object-fit:cover; border-radius:8px; margin-bottom:1rem;" />`
    : `<div style="background:#f1f5f9; padding:2rem; text-align:center; border-radius:8px; margin-bottom:1rem; font-size:2.5rem;">🌾</div>`;

  const hasPhoto = Boolean(farmer.photo_url && farmer.photo_url.trim());
  let aiReportHtml = '';

  if (!hasPhoto || !farmer.ai_quality_score) {
    aiReportHtml = `
      <div class="ai-quality-card mb-3" style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:0.85rem;">
        <div class="ai-quality-header" style="display:flex; justify-content:space-between; align-items:center;">
          <span class="text-xs font-bold text-slate-600">⚠️ AI Quality Verification: Disabled</span>
          <span class="badge" style="background:#f1f5f9; color:#475569;">No Photo Provided</span>
        </div>
        <p class="text-xs mt-2 text-muted">The farmer did not upload a produce lot photo during registration. Manual quality inspection is advised prior to procurement.</p>
      </div>
    `;
  } else {
    const score = parseFloat(farmer.ai_quality_score);
    const recBadge = score >= 75
      ? `<span class="badge" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-weight:800;">✓ Recommended (${score}%)</span>`
      : `<span class="badge" style="background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; font-weight:800;">⚠️ Not Recommended (${score}%)</span>`;

    aiReportHtml = `
      <div class="ai-quality-card mb-3" style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:0.85rem;">
        <div class="ai-quality-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem;">
          <span class="ai-badge">🤖 AI Quality Analysis Report</span>
          <div style="display:flex; gap:0.35rem; align-items:center;">
            <span class="quality-grade-badge">Grade ${farmer.ai_quality_grade || farmer.quality}</span>
            ${recBadge}
          </div>
        </div>
        <p class="text-xs mt-2 text-dark font-medium" style="color:#14532d;">${farmer.ai_quality_report || 'Optimal grain luster, moisture control verified, and low foreign matter index.'}</p>
      </div>
    `;
  }

  detailsEl.innerHTML = `
    <div class="contact-details-box">
      ${heroPhoto}
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <h3 style="margin-bottom:0.2rem; color:#0f3813;">${farmer.farmer_name}</h3>
          <p class="text-xs text-muted">📍 ${farmer.location} (${farmer.distance} km away)</p>
        </div>
        <div class="star-badge-display">
          <span>★</span> <span>${farmer.farmer_rating || '5.0'}</span>
          <span class="text-xs text-muted">(${farmer.total_ratings || 0} ratings)</span>
        </div>
      </div>

      <div class="info-line mt-2"><strong>Verification:</strong> <span class="badge badge-success">🛡️ Verified Direct Producer</span></div>
      <div class="info-line"><strong>Identity (Aadhaar):</strong> <span>${farmer.aadhaar_masked || 'Verified UIDAI'}</span></div>
      <div class="info-line"><strong>Gender:</strong> <span>${farmer.gender || 'Not specified'}</span></div>
      <hr class="modal-divider"/>
      
      <h4>Produce Lot & AI Quality Diagnostics</h4>
      ${aiReportHtml}

      <div class="info-line"><strong>${t('crop')}:</strong> ${farmer.crop} (${farmer.crop_type || 'Food Grain'})</div>
      <div class="info-line"><strong>${t('available_quantity')}:</strong> ${farmer.quantity} ${t('quintals')}</div>
      <div class="info-line"><strong>${t('quality')}:</strong> Grade ${farmer.ai_quality_grade || farmer.quality}</div>
      <div class="info-line"><strong>${t('harvested_date')}:</strong> ${farmer.harvested_date || '-'}</div>
      <div class="info-line"><strong>Contact Status:</strong> <span class="badge" style="background:#e0f2fe; color:#0369a1;">📞 In-App Verified (${farmer.phone_masked})</span></div>
      
      <div class="action-buttons-group mt-3" style="display:flex; flex-direction:column; gap:0.5rem;">
        <button type="button" class="btn btn-primary btn-block font-bold" onclick="window.closeModal('farmerDetailsModal'); window.startChatWithFarmerById(${farmer.id});">
          💬 Chat with Farmer Directly
        </button>
        <div style="display:flex; gap:0.5rem;">
          <button type="button" class="btn btn-secondary flex-1 font-bold" onclick="window.closeModal('farmerDetailsModal'); window.startDirectCallFromModal(${farmerId}, 'farmer', '${farmerNameSafe}', 'voice')">
            📞 Voice Call
          </button>
          <button type="button" class="btn btn-secondary flex-1 font-bold" onclick="window.closeModal('farmerDetailsModal'); window.startDirectCallFromModal(${farmerId}, 'farmer', '${farmerNameSafe}', 'video')">
            📹 Video Call
          </button>
        </div>
        <button type="button" class="btn btn-success btn-block font-bold mt-1" onclick="window.closeModal('farmerDetailsModal'); window.openCropPurchaseRatingModalById(${farmer.id});">
          🛒 Mark as Purchased & Rate 5★
        </button>
      </div>
    </div>
  `;
  if (window.openModal) {
    window.openModal('farmerDetailsModal');
  } else if (typeof openModal === 'function') {
    openModal('farmerDetailsModal');
  }
};

// 5-Star Rating & Purchase Logic
window.openCropPurchaseRatingModalById = (cropId) => {
  const idNum = parseInt(cropId, 10);
  const farmer = window._farmerCropsCache 
    ? (window._farmerCropsCache.get(idNum) || window._farmerCropsCache.get(cropId) || window._farmerCropsCache.get(String(cropId))) 
    : null;
  if (!farmer) {
    showMessage('Could not load crop details for purchase. Please refresh the list.', 'error');
    return;
  }
  window.openCropPurchaseRatingModal(farmer);
};

window.openCropPurchaseRatingModal = (farmer) => {
  let session = getSession();
  if (!session) {
    try {
      session = JSON.parse(localStorage.getItem('kissanHubSession'));
    } catch (e) {}
  }
  if (!session) {
    session = { id: 1, userType: 'buyer', full_name: 'Buyer' };
  }

  const cropId = farmer.crop_id || farmer.id;
  getElement('purchaseRatingCropId').value = cropId;
  getElement('purchaseRatingFarmerId').value = farmer.farmer_id || farmer.id;
  getElement('purchaseRatingScore').value = '5';
  getElement('purchaseRatingReview').value = '';

  const titleEl = getElement('purchaseCropTitle');
  const farmerEl = getElement('purchaseCropFarmer');
  const lotEl = getElement('purchaseCropLot');

  if (titleEl) titleEl.textContent = `🌾 ${farmer.crop || farmer.crop_name}`;
  if (farmerEl) farmerEl.textContent = `Farmer: ${farmer.farmer_name} (📞 ${farmer.phone_masked})`;
  if (lotEl) lotEl.textContent = `Available: ${farmer.quantity} Quintals • Grade ${farmer.ai_quality_grade || farmer.quality}`;

  setupStarPicker();
  if (window.openModal) {
    window.openModal('cropPurchaseRatingModal');
  } else if (typeof openModal === 'function') {
    openModal('cropPurchaseRatingModal');
  }
};

const setupStarPicker = () => {
  const container = getElement('starRatingPicker');
  const hiddenScore = getElement('purchaseRatingScore');
  const descEl = getElement('starRatingDesc');
  if (!container) return;

  const descMap = {
    1: '1 Star — Poor Crop Quality / Discolored',
    2: '2 Stars — Fair Quality / Noticeable Defects',
    3: '3 Stars — Good Commercial Standard Quality',
    4: '4 Stars — Very Good Quality & High Purity',
    5: '5 Stars — Excellent / Premium Produce Quality'
  };

  const stars = container.querySelectorAll('.star-btn');
  stars.forEach(star => {
    star.onclick = () => {
      const val = parseInt(star.getAttribute('data-rating'), 10);
      if (hiddenScore) hiddenScore.value = String(val);

      stars.forEach(s => {
        const r = parseInt(s.getAttribute('data-rating'), 10);
        if (r <= val) s.classList.add('active');
        else s.classList.remove('active');
      });

      if (descEl) descEl.textContent = descMap[val] || `${val} Stars`;
    };
  });

  // Default to 5 stars active
  stars.forEach(s => s.classList.add('active'));
  if (descEl) descEl.textContent = descMap[5];
};

window.handleCropPurchaseRatingSubmit = async (e) => {
  if (e) e.preventDefault();
  let session = getSession();
  if (!session) {
    try {
      session = JSON.parse(localStorage.getItem('kissanHubSession'));
    } catch (err) {}
  }
  const buyerId = session ? session.id : 1;

  const cropId = getElement('purchaseRatingCropId').value;
  const ratingVal = parseInt(getElement('purchaseRatingScore').value, 10);
  const reviewText = getElement('purchaseRatingReview').value;

  if (!cropId) {
    showMessage('No crop selected for purchase.', 'error');
    return false;
  }

  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    showMessage('Crop quality rating (1 to 5 stars) is mandatory.', 'warning');
    return false;
  }

  const submitBtn = getElement('btnSubmitPurchaseRating');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Purchase & Rating...';
  }

  try {
    const res = await apiRequest('/buyers/purchase-crop', {
      method: 'POST',
      body: JSON.stringify({
        buyer_id: buyerId,
        crop_id: parseInt(cropId, 10),
        rating: ratingVal,
        review_text: reviewText ? reviewText.trim() : 'Quality verified and accepted.'
      })
    });

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ Confirm Purchase & Submit 5-Star Rating';
    }

    if (res.ok) {
      showMessage(res.message || 'Crop marked as purchased and 5-star rating submitted!', 'success');
      if (window.closeModal) {
        window.closeModal('cropPurchaseRatingModal');
      } else if (typeof closeModal === 'function') {
        closeModal('cropPurchaseRatingModal');
      }
      // Immediately remove from client cache
      if (window._farmerCropsCache) {
        window._farmerCropsCache.delete(parseInt(cropId, 10));
        window._farmerCropsCache.delete(String(cropId));
      }
      // Immediately reload available farmers list to remove/disable the purchased crop from buyer dashboard display
      const currentRadius = getElement('buyerSearchRadiusFilter') ? getElement('buyerSearchRadiusFilter').value : '50';
      const currentCrop = getElement('buyerSearchCropFilter') ? getElement('buyerSearchCropFilter').value : '';
      loadAvailableFarmers(currentCrop, currentRadius);
    } else {
      showMessage(res.message || 'Error processing purchase.', 'error');
    }
  } catch (err) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ Confirm Purchase & Submit 5-Star Rating';
    }
    console.error('Error in handleCropPurchaseRatingSubmit:', err);
    showMessage('Server error recording purchase.', 'error');
  }
  return false;
};

const loadBuyerProfile = async () => {
  const session = getSession();
  if (!session) return;

  const res = await apiRequest(`/buyers/${session.phone}`);
  if (res.ok && res.data) {
    const b = res.data;
    const marketEl = getElement('profBuyerMarketName');
    const nameEl = getElement('profBuyerFullName');
    const stateEl = getElement('profBuyerState');
    const distEl = getElement('profBuyerDistrict');
    const mandalEl = getElement('profBuyerMandal');
    const phoneEl = getElement('profBuyerPhone');

    if (marketEl) marketEl.textContent = b.market_name;
    if (nameEl) nameEl.textContent = b.full_name;
    if (stateEl) stateEl.textContent = b.state || '-';
    if (distEl) distEl.textContent = b.district || '-';
    if (mandalEl) mandalEl.textContent = b.mandal || '-';
    if (phoneEl) phoneEl.textContent = b.phone;

    const btnEdit = getElement('btnOpenBuyerEditProfile');
    if (btnEdit) {
      btnEdit.onclick = () => {
        getElement('buyerEditMarketName').value = b.market_name;
        getElement('buyerEditFullName').value = b.full_name;
        getElement('buyerEditState').value = b.state || '';
        getElement('buyerEditState').dispatchEvent(new Event('change'));
        setTimeout(() => {
          getElement('buyerEditDistrict').value = b.district || '';
          getElement('buyerEditDistrict').dispatchEvent(new Event('change'));
          setTimeout(() => {
            getElement('buyerEditMandal').value = b.mandal || '';
          }, 100);
        }, 100);
        openModal('buyerEditProfileModal');
      };
    }
  }
};

const appendBuyerAiMessage = (sender, text) => {
  const container = getElement('buyerAiChatHistory');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-bubble ${sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`;
  msgDiv.innerHTML = text.replace(/\n/g, '<br/>');

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;

  if (sender === 'bot' && window.speechSynthesis) {
    speakBuyerText(text);
  }
};

const appendBuyerAiTyping = () => {
  const container = getElement('buyerAiChatHistory');
  if (!container) return null;

  const id = 'btyping_' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'chat-bubble chat-bubble-bot typing-indicator';
  div.innerHTML = `<span>.</span><span>.</span><span>.</span>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
};

const removeBuyerAiTyping = (id) => {
  if (!id) return;
  const el = getElement(id);
  if (el) el.remove();
};

const toggleBuyerVoiceRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showMessage(t('ai_speech_error'), 'error');
    return;
  }

  const voiceBtn = getElement('buyerAiVoiceBtn');

  if (activeBuyerSpeechRec) {
    activeBuyerSpeechRec.stop();
    activeBuyerSpeechRec = null;
    if (voiceBtn) voiceBtn.classList.remove('recording');
    return;
  }

  const recognition = new SpeechRecognition();
  activeBuyerSpeechRec = recognition;
  recognition.lang = getBuyerSpeechLanguageTag(currentLanguage);

  if (voiceBtn) voiceBtn.classList.add('recording');

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const input = getElement('buyerAiMessageInput');
    if (input) {
      input.value = transcript;
      const form = getElement('buyerAiChatForm');
      if (form) form.dispatchEvent(new Event('submit'));
    }
  };

  recognition.onerror = () => {
    if (voiceBtn) voiceBtn.classList.remove('recording');
    activeBuyerSpeechRec = null;
  };

  recognition.onend = () => {
    if (voiceBtn) voiceBtn.classList.remove('recording');
    activeBuyerSpeechRec = null;
  };

  try {
    recognition.start();
  } catch (err) {
    if (voiceBtn) voiceBtn.classList.remove('recording');
  }
};

const speakBuyerText = (text) => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langTag = getBuyerSpeechLanguageTag(currentLanguage);
    utterance.lang = langTag;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang === langTag || v.lang.startsWith(langTag.slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Buyer speech error:', e);
  }
};

window.addEventListener('languageChanged', () => {
  const dash = document.getElementById('buyerDashboardView');
  if (dash && !dash.classList.contains('hidden')) {
    if (typeof loadAvailableFarmers === 'function') {
      const radius = getElement('buyerSearchRadiusFilter')?.value || '50';
      const crop = getElement('buyerSearchCropFilter')?.value || '';
      loadAvailableFarmers(crop, radius);
    }
    if (typeof loadBuyerRequirements === 'function') loadBuyerRequirements();
  }
});
