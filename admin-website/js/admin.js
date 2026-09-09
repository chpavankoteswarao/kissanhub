// KISSAN-HUB — admin.js
// Dedicated module for all Administrator functionality

let currentAdminTab = 'adminTabOverview';

window.initAdminDashboard = () => {
  const session = getSession();
  if (!session || session.userType !== 'admin') {
    showView('landingView');
    return;
  }

  // Setup tabs
  const tabs = [
    { btn: 'btnAdminTabOverview', content: 'adminContentOverview', id: 'adminTabOverview' },
    { btn: 'btnAdminTabFarmers', content: 'adminContentFarmers', id: 'adminTabFarmers' },
    { btn: 'btnAdminTabBuyers', content: 'adminContentBuyers', id: 'adminTabBuyers' },
    { btn: 'btnAdminTabCrops', content: 'adminContentCrops', id: 'adminTabCrops' },
    { btn: 'btnAdminTabReqs', content: 'adminContentReqs', id: 'adminTabReqs' },
    { btn: 'btnAdminTabPrices', content: 'adminContentPrices', id: 'adminTabPrices' },
    { btn: 'btnAdminTabMandi', content: 'adminContentMandi', id: 'adminTabMandi' }
  ];

  tabs.forEach(t => {
    const btn = getElement(t.btn);
    if (btn) {
      btn.onclick = () => {
        tabs.forEach(item => {
          const b = getElement(item.btn);
          const c = getElement(item.content);
          if (b) b.classList.remove('active');
          if (c) c.classList.add('hidden');
        });
        btn.classList.add('active');
        const activeContent = getElement(t.content);
        if (activeContent) activeContent.classList.remove('hidden');
        currentAdminTab = t.id;

        if (t.id === 'adminTabOverview') loadAdminStatistics();
        if (t.id === 'adminTabFarmers') loadAdminFarmers();
        if (t.id === 'adminTabBuyers') loadAdminBuyers();
        if (t.id === 'adminTabCrops') loadAdminCrops();
        if (t.id === 'adminTabReqs') loadAdminRequirements();
        if (t.id === 'adminTabPrices') loadAdminPrices();
        if (t.id === 'adminTabMandi') loadAdminMandiStatus();
      };
    }
  });

  bindAdminForms();

  // Load initial statistics and data
  loadAdminStatistics();
};

const bindAdminForms = () => {
  // Add Price Form
  const addPriceForm = getElement('adminAddPriceForm');
  if (addPriceForm) {
    addPriceForm.onsubmit = async (e) => {
      e.preventDefault();
      const crop_name = getElement('adminPriceCrop').value.trim();
      const market_name = getElement('adminPriceMarket').value.trim();
      const state = getElement('adminPriceState').value.trim();
      const district = getElement('adminPriceDistrict').value.trim();
      const price = getElement('adminPriceAmount').value;
      const unit = getElement('adminPriceUnit').value;
      const price_date = getElement('adminPriceDate').value;
      const source = getElement('adminPriceSource').value.trim();

      const res = await apiRequest('/admin/prices', {
        method: 'POST',
        body: JSON.stringify({
          crop_name,
          market_name,
          state,
          district,
          price,
          unit,
          price_date,
          source
        })
      });

      if (res.ok) {
        showMessage('Verified mandi price recorded.', 'success');
        addPriceForm.reset();
        closeModal('adminAddPriceModal');
        loadAdminPrices();
      } else {
        showMessage(res.message || 'Error adding price.', 'error');
      }
    };
  }

  // Filter triggers
  const farmerSearchInput = getElement('adminFarmerSearch');
  if (farmerSearchInput) {
    farmerSearchInput.oninput = () => loadAdminFarmers(farmerSearchInput.value);
  }

  const buyerSearchInput = getElement('adminBuyerSearch');
  if (buyerSearchInput) {
    buyerSearchInput.oninput = () => loadAdminBuyers(buyerSearchInput.value);
  }

  const cropSearchInput = getElement('adminCropSearch');
  if (cropSearchInput) {
    cropSearchInput.oninput = () => loadAdminCrops(cropSearchInput.value);
  }

  const cropStatusFilter = getElement('adminCropStatusFilter');
  if (cropStatusFilter) {
    cropStatusFilter.onchange = () => loadAdminCrops(cropSearchInput ? cropSearchInput.value : '', cropStatusFilter.value);
  }

  const btnOpenAddPrice = getElement('btnOpenAddPriceModal');
  if (btnOpenAddPrice) {
    btnOpenAddPrice.onclick = () => {
      const dateInput = getElement('adminPriceDate');
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
      openModal('adminAddPriceModal');
    };
  }
};

// Load Overview Statistics
const loadAdminStatistics = async () => {
  const res = await apiRequest('/admin/statistics');
  if (res.ok && res.data) {
    const s = res.data;
    const statFarmers = getElement('statAdminFarmers');
    const statBuyers = getElement('statAdminBuyers');
    const statActiveCrops = getElement('statAdminActiveCrops');
    const statExpiredCrops = getElement('statAdminExpiredCrops');
    const statReqs = getElement('statAdminReqs');

    if (statFarmers) statFarmers.textContent = s.total_farmers;
    if (statBuyers) statBuyers.textContent = s.total_buyers;
    if (statActiveCrops) statActiveCrops.textContent = s.active_crops;
    if (statExpiredCrops) statExpiredCrops.textContent = s.expired_crops;
    if (statReqs) statReqs.textContent = s.active_requirements;

    // Render crop supply breakdown
    const supplyContainer = getElement('adminSupplyBreakdown');
    if (supplyContainer && s.crop_availability) {
      supplyContainer.innerHTML = s.crop_availability.map(c => `
        <div class="stat-progress-item">
          <div class="stat-progress-label">
            <span>🌾 <strong>${c.crop_name}</strong></span>
            <span>${c.total_quantity} Qtl (${c.listings_count} lots)</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${Math.min(100, c.total_quantity / 5)}%"></div>
          </div>
        </div>
      `).join('') || '<p class="text-muted">No active produce listed currently.</p>';
    }

    // Render crop demand breakdown
    const demandContainer = getElement('adminDemandBreakdown');
    if (demandContainer && s.crop_demand) {
      demandContainer.innerHTML = s.crop_demand.map(d => `
        <div class="stat-progress-item">
          <div class="stat-progress-label">
            <span>🏢 <strong>${d.crop_name}</strong></span>
            <span>${d.total_demand} Qtl (Avg ₹${Math.round(d.avg_price)}/Qtl)</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill bg-secondary" style="width: ${Math.min(100, d.total_demand / 5)}%"></div>
          </div>
        </div>
      `).join('') || '<p class="text-muted">No procurement demands posted currently.</p>';
    }
  }
};

const escapeQuotes = (str) => {
  return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
};

// Load Farmers List
const loadAdminFarmers = async (search = '') => {
  const container = getElement('adminFarmersListTable');
  if (!container) return;

  const res = await apiRequest(`/admin/farmers?search=${encodeURIComponent(search)}`);
  if (res.ok && res.data) {
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>${t('full_name')}</th>
            <th>${t('phone')}</th>
            <th>${t('location')}</th>
            <th>Total Crops</th>
            <th>Active 5-Day Crops</th>
            <th>Registered</th>
            <th>${t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${res.data.map(f => `
            <tr>
              <td>#${f.id}</td>
              <td class="font-bold">${f.full_name}</td>
              <td>📞 ${f.phone}</td>
              <td>${f.mandal ? f.mandal + ', ' : ''}${f.district}, ${f.state}</td>
              <td>${f.total_crops}</td>
              <td><span class="status-badge status-badge-active">${f.active_crops || 0} active</span></td>
              <td>${f.created_at ? f.created_at.split('T')[0] : '-'}</td>
              <td>
                <div style="display: flex; gap: 0.35rem; align-items: center;">
                  <button class="btn btn-secondary btn-sm" onclick="viewAdminFarmerModal(${f.id})">
                    ${t('view_details')}
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="confirmDeleteAdminFarmer(${f.id}, '${escapeQuotes(f.full_name)}')">
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
};

// View Single Farmer Details Modal
window.viewAdminFarmerModal = async (farmerId) => {
  const res = await apiRequest(`/admin/farmers/${farmerId}`);
  if (res.ok && res.data) {
    const f = res.data;
    const modal = getElement('adminFarmerDetailsModal');
    const content = getElement('adminFarmerDetailsContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="contact-details-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h3 style="margin: 0;">Farmer Profile: ${f.full_name} (#${f.id})</h3>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteAdminFarmer(${f.id}, '${escapeQuotes(f.full_name)}')">
            🗑️ Delete Farmer & All Crops
          </button>
        </div>
        <div class="info-line"><strong>${t('phone')}:</strong> ${f.phone}</div>
        <div class="info-line"><strong>${t('location')}:</strong> ${f.mandal ? f.mandal + ', ' : ''}${f.district}, ${f.state}</div>
        <div class="info-line"><strong>${t('gender')}:</strong> ${f.gender || 'Not specified'}</div>
        <div class="info-line"><strong>Registered On:</strong> ${f.created_at}</div>
        <hr class="modal-divider"/>
        <h4>Enrolled Crop Records (${f.crops.length})</h4>
        ${f.crops.length > 0 ? `
          <table class="data-table mt-2">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Qty</th>
                <th>Grade</th>
                <th>Harvested</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${f.crops.map(c => `
                <tr>
                  <td>${c.crop_name}</td>
                  <td>${c.quantity} Qtl</td>
                  <td>Grade ${c.quality}</td>
                  <td>${c.harvested_date || '-'}</td>
                  <td>${c.expires_at ? c.expires_at.split('T')[0] : '-'}</td>
                  <td><span class="status-badge ${c.status === 'ACTIVE' ? 'status-badge-active' : 'status-badge-expired'}">${c.status}</span></td>
                  <td>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteAdminCrop(${c.id}, '${escapeQuotes(c.crop_name)}', ${f.id})">
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="text-muted">No crop listings registered by this farmer.</p>'}
      </div>
    `;
    openModal('adminFarmerDetailsModal');
  }
};

// Load Buyers List
const loadAdminBuyers = async (search = '') => {
  const container = getElement('adminBuyersListTable');
  if (!container) return;

  const res = await apiRequest(`/admin/buyers?search=${encodeURIComponent(search)}`);
  if (res.ok && res.data) {
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>${t('market_name')}</th>
            <th>Contact Person</th>
            <th>${t('phone')}</th>
            <th>${t('location')}</th>
            <th>Active Demands</th>
            <th>Registered</th>
            <th>${t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${res.data.map(b => `
            <tr>
              <td>#${b.id}</td>
              <td class="font-bold">${b.market_name}</td>
              <td>${b.full_name}</td>
              <td>📞 ${b.phone}</td>
              <td>${b.mandal ? b.mandal + ', ' : ''}${b.district}, ${b.state}</td>
              <td><span class="status-badge status-badge-active">${b.active_requirements || 0}</span></td>
              <td>${b.created_at ? b.created_at.split('T')[0] : '-'}</td>
              <td>
                <div style="display: flex; gap: 0.35rem; align-items: center;">
                  <button class="btn btn-secondary btn-sm" onclick="viewAdminBuyerModal(${b.id})">
                    ${t('view_details')}
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="confirmDeleteAdminBuyer(${b.id}, '${escapeQuotes(b.market_name || b.full_name)}')">
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
};

// View Single Buyer Details Modal
window.viewAdminBuyerModal = async (buyerId) => {
  const res = await apiRequest(`/admin/buyers/${buyerId}`);
  if (res.ok && res.data) {
    const b = res.data;
    const modal = getElement('adminBuyerDetailsModal');
    const content = getElement('adminBuyerDetailsContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="contact-details-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h3 style="margin: 0;">${b.market_name} (#${b.id})</h3>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteAdminBuyer(${b.id}, '${escapeQuotes(b.market_name || b.full_name)}')">
            🗑️ Delete Buyer & All Demands
          </button>
        </div>
        <div class="info-line"><strong>Contact Person:</strong> ${b.full_name}</div>
        <div class="info-line"><strong>${t('phone')}:</strong> ${b.phone}</div>
        <div class="info-line"><strong>${t('location')}:</strong> ${b.mandal ? b.mandal + ', ' : ''}${b.district}, ${b.state}</div>
        <div class="info-line"><strong>Registered On:</strong> ${b.created_at}</div>
        <hr class="modal-divider"/>
        <h4>Procurement Demands (${b.requirements.length})</h4>
        ${b.requirements.length > 0 ? `
          <table class="data-table mt-2">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Qty</th>
                <th>Grade</th>
                <th>Offering Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${b.requirements.map(r => `
                <tr>
                  <td>${r.crop_name}</td>
                  <td>${r.quantity} Qtl</td>
                  <td>Grade ${r.quality}</td>
                  <td>₹${r.price}/Qtl</td>
                  <td><span class="status-badge status-badge-active">${r.status}</span></td>
                  <td>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteAdminRequirement(${r.id}, '${escapeQuotes(r.crop_name)}', ${b.id})">
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="text-muted">No requirements posted by this buyer.</p>'}
      </div>
    `;
    openModal('adminBuyerDetailsModal');
  }
};

// Load Crops List
const loadAdminCrops = async (search = '', status = '') => {
  const container = getElement('adminCropsListTable');
  if (!container) return;

  let endpoint = `/admin/crops?search=${encodeURIComponent(search)}`;
  if (status) endpoint += `&status=${status}`;

  const res = await apiRequest(endpoint);
  if (res.ok && res.data) {
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Crop</th>
            <th>Type</th>
            <th>Farmer</th>
            <th>Location</th>
            <th>Qty</th>
            <th>Grade</th>
            <th>Registered</th>
            <th>Expires (5 Days)</th>
            <th>Status</th>
            <th>${t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${res.data.map(c => `
            <tr>
              <td class="font-bold">${c.crop_name}</td>
              <td>${c.crop_type || 'Food Grain'}</td>
              <td>${c.farmer_name} (📞 ${c.farmer_phone})</td>
              <td>${c.district}, ${c.state}</td>
              <td>${c.quantity} Qtl</td>
              <td>Grade ${c.quality}</td>
              <td>${c.created_at ? c.created_at.split('T')[0] : '-'}</td>
              <td>${c.expires_at ? c.expires_at.split('T')[0] : '-'}</td>
              <td><span class="status-badge ${c.status === 'ACTIVE' ? 'status-badge-active' : 'status-badge-expired'}">${c.status}</span></td>
              <td>
                <button class="btn btn-danger btn-sm" onclick="confirmDeleteAdminCrop(${c.id}, '${escapeQuotes(c.crop_name)}')">
                  🗑️ Delete
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
};

// Load Requirements List
const loadAdminRequirements = async () => {
  const container = getElement('adminRequirementsListTable');
  if (!container) return;

  const res = await apiRequest('/admin/requirements');
  if (res.ok && res.data) {
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Crop</th>
            <th>Buyer / Market</th>
            <th>Location</th>
            <th>Required Qty</th>
            <th>Required Grade</th>
            <th>Offering Price</th>
            <th>Posted On</th>
            <th>Status</th>
            <th>${t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${res.data.map(r => `
            <tr>
              <td class="font-bold">${r.crop_name}</td>
              <td>${r.market_name} (👤 ${r.buyer_name})</td>
              <td>${r.district}, ${r.state}</td>
              <td>${r.quantity} Qtl</td>
              <td>Grade ${r.quality}</td>
              <td class="text-success font-bold">₹${r.price}/Qtl</td>
              <td>${r.created_at ? r.created_at.split('T')[0] : '-'}</td>
              <td><span class="status-badge status-badge-active">${r.status}</span></td>
              <td>
                <button class="btn btn-danger btn-sm" onclick="confirmDeleteAdminRequirement(${r.id}, '${escapeQuotes(r.crop_name)}')">
                  🗑️ Delete
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
};

// Delete Handlers for Admin
window.confirmDeleteAdminFarmer = async (farmerId, name) => {
  if (!confirm(`Are you sure you want to permanently delete Farmer "${name}" and all their enrolled crop listings? This action cannot be undone.`)) {
    return;
  }

  const res = await apiRequest(`/admin/farmers/${farmerId}`, { method: 'DELETE' });
  if (res.ok) {
    showMessage(res.message || 'Farmer and all enrolled crops deleted successfully.', 'success');
    closeModal('adminFarmerDetailsModal');
    loadAdminFarmers();
    loadAdminStatistics();
    if (currentAdminTab === 'adminTabCrops') loadAdminCrops();
  } else {
    showMessage(res.message || 'Error deleting farmer.', 'error');
  }
};

window.confirmDeleteAdminBuyer = async (buyerId, name) => {
  if (!confirm(`Are you sure you want to permanently delete Buyer "${name}" and all their procurement requirements? This action cannot be undone.`)) {
    return;
  }

  const res = await apiRequest(`/admin/buyers/${buyerId}`, { method: 'DELETE' });
  if (res.ok) {
    showMessage(res.message || 'Buyer and all requirements deleted successfully.', 'success');
    closeModal('adminBuyerDetailsModal');
    loadAdminBuyers();
    loadAdminStatistics();
    if (currentAdminTab === 'adminTabReqs') loadAdminRequirements();
  } else {
    showMessage(res.message || 'Error deleting buyer.', 'error');
  }
};

window.confirmDeleteAdminCrop = async (cropId, cropName, optFarmerId) => {
  if (!confirm(`Are you sure you want to delete the crop enrollment for "${cropName}"?`)) {
    return;
  }

  const res = await apiRequest(`/admin/crops/${cropId}`, { method: 'DELETE' });
  if (res.ok) {
    showMessage(res.message || 'Crop listing deleted.', 'success');
    if (optFarmerId) {
      window.viewAdminFarmerModal(optFarmerId);
    }
    loadAdminCrops();
    loadAdminStatistics();
    if (currentAdminTab === 'adminTabFarmers') loadAdminFarmers();
  } else {
    showMessage(res.message || 'Error deleting crop listing.', 'error');
  }
};

window.confirmDeleteAdminRequirement = async (reqId, cropName, optBuyerId) => {
  if (!confirm(`Are you sure you want to delete the buyer requirement for "${cropName}"?`)) {
    return;
  }

  const res = await apiRequest(`/admin/requirements/${reqId}`, { method: 'DELETE' });
  if (res.ok) {
    showMessage(res.message || 'Requirement deleted.', 'success');
    if (optBuyerId) {
      window.viewAdminBuyerModal(optBuyerId);
    }
    loadAdminRequirements();
    loadAdminStatistics();
    if (currentAdminTab === 'adminTabBuyers') loadAdminBuyers();
  } else {
    showMessage(res.message || 'Error deleting requirement.', 'error');
  }
};

// Load Market Prices Management
const loadAdminPrices = async () => {
  const container = getElement('adminPricesListTable');
  if (!container) return;

  const res = await apiRequest('/admin/prices');
  if (res.ok && res.data) {
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Crop</th>
            <th>Market / Mandi</th>
            <th>State / District</th>
            <th>Verified Price</th>
            <th>Unit</th>
            <th>Price Date</th>
            <th>Source</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${res.data.map(p => `
            <tr>
              <td class="font-bold">${p.crop_name}</td>
              <td>${p.market_name}</td>
              <td>${p.district ? p.district + ', ' : ''}${p.state || '-'}</td>
              <td class="font-bold text-success">₹${p.price}</td>
              <td>${p.unit}</td>
              <td>${p.price_date}</td>
              <td><span class="text-xs text-muted">${p.source}</span></td>
              <td>
                <button class="btn btn-danger btn-sm" onclick="confirmDeletePrice(${p.id})">
                  ${t('delete')}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
};

// Delete verified price
window.confirmDeletePrice = async (priceId) => {
  if (!confirm('Are you sure you want to delete this verified mandi price record?')) return;

  const res = await apiRequest(`/admin/prices/${priceId}`, { method: 'DELETE' });
  if (res.ok) {
    showMessage('Mandi price record deleted.', 'info');
    loadAdminPrices();
  } else {
    showMessage(res.message || 'Error deleting price.', 'error');
  }
};

// ==========================================
// GOVERNMENT MANDI DATA (OGD) ADMIN SYNC
// ==========================================
window.loadAdminMandiStatus = async () => {
  const statusEl = getElement('adminMandiApiStatus');
  const keyConfigEl = getElement('adminMandiKeyConfigured');
  const countEl = getElement('adminMandiCachedCount');
  const arrivalEl = getElement('adminMandiArrivalDate');
  const resourceEl = getElement('adminMandiResourceId');
  const ttlEl = getElement('adminMandiCacheMinutes');
  const timeEl = getElement('adminMandiLastSyncTime');
  const syncStatusEl = getElement('adminMandiLastSyncStatus');
  const msgEl = getElement('adminMandiSyncMessage');
  const tableEl = getElement('adminMandiCachedSampleTable');

  try {
    const res = await apiRequest('/mandi-prices/status');
    if (res.ok && res.data) {
      const s = res.data;
      if (resourceEl) resourceEl.textContent = s.resource_id || '9ef84268-d588-465a-a308-a864a43d0070';
      if (ttlEl) ttlEl.textContent = s.cache_ttl_minutes || '30';
      if (countEl) countEl.textContent = (s.cached_records_count || 0).toLocaleString();
      if (arrivalEl) arrivalEl.textContent = s.last_data_arrival_date || 'N/A';
      if (timeEl) timeEl.textContent = s.last_sync_time ? new Date(s.last_sync_time).toLocaleString() : 'Never';
      if (syncStatusEl) syncStatusEl.innerHTML = `<span class="badge ${s.last_sync_status === 'SUCCESS' ? 'badge-success' : s.last_sync_status === 'KEY_MISSING' ? 'badge-warning' : 'badge-danger'}">${s.last_sync_status || 'IDLE'}</span>`;

      if (keyConfigEl) {
        if (s.api_key_configured) {
          keyConfigEl.innerHTML = '<span style="color: #15803d;">Configured in .env ✅</span>';
        } else {
          keyConfigEl.innerHTML = '<span style="color: #b91c1c;">Not Set in .env ⚠️</span>';
        }
      }

      if (statusEl) {
        if (!s.api_key_configured) {
          statusEl.innerHTML = '<span style="color: #b45309;">Key Missing ⚠️</span>';
        } else if (s.last_sync_status === 'SUCCESS') {
          statusEl.innerHTML = '<span style="color: #15803d;">Connected 🟢</span>';
        } else if (s.last_sync_status === 'ERROR') {
          statusEl.innerHTML = '<span style="color: #b91c1c;">Error ❌</span>';
        } else {
          statusEl.innerHTML = '<span style="color: #1e3a8a;">Ready 🟡</span>';
        }
      }

      if (msgEl) {
        if (s.last_sync_message) {
          msgEl.style.display = 'block';
          msgEl.style.background = s.last_sync_status === 'SUCCESS' ? '#f0fdf4' : '#fef2f2';
          msgEl.style.color = s.last_sync_status === 'SUCCESS' ? '#166534' : '#991b1b';
          msgEl.style.border = `1px solid ${s.last_sync_status === 'SUCCESS' ? '#bbf7d0' : '#fecaca'}`;
          msgEl.innerHTML = `<strong>Last Sync Notice:</strong> ${s.last_sync_message}`;
        } else {
          msgEl.style.display = 'none';
        }
      }
    }
  } catch (err) {
    console.error('Error fetching mandi status:', err);
    if (statusEl) statusEl.innerHTML = '<span style="color: #b91c1c;">Offline ❌</span>';
  }

  // Initialize and render identical live government mandi explorer as in Farmer/Buyer portals
  if (window.initGovernmentMandiPrices) {
    window.initGovernmentMandiPrices('admin');
  }
};

const renderAdminMandiTable = (records, total) => {
  const tableEl = getElement('adminMandiCachedSampleTable');
  const countEl = getElement('adminMandiResultsCount');
  if (!tableEl) return;

  if (countEl) {
    countEl.textContent = records && records.length > 0 
      ? `Showing ${records.length} of ${total || records.length} live entries` 
      : 'No entries found';
  }

  if (records && records.length > 0) {
    tableEl.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Commodity</th>
            <th>Market / Mandi</th>
            <th>District, State</th>
            <th>Arrival Date</th>
            <th>Min (₹)</th>
            <th>Max (₹)</th>
            <th>Modal Price</th>
            <th>Approx / kg</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(r => `
            <tr>
              <td class="font-bold">${r.commodity} ${r.variety && r.variety !== 'Other' ? `<span class="text-xs text-muted">(${r.variety})</span>` : ''}</td>
              <td>${r.market}</td>
              <td>${r.district}, ${r.state}</td>
              <td>${r.arrival_date}</td>
              <td>₹${r.min_price}</td>
              <td>₹${r.max_price}</td>
              <td class="font-bold text-success">₹${r.modal_price}</td>
              <td>${r.approx_per_kg ? `₹${r.approx_per_kg}/kg` : '-'}</td>
              <td><span class="status-badge ${r.source === 'GOV_API_LIVE' ? 'status-badge-active' : 'status-badge-expired'}">${r.source}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    tableEl.innerHTML = `
      <div class="text-center p-4 text-muted" style="background: #f8fafc; border-radius: 8px;">
        <p style="margin: 0; font-weight: 600;">No matching government mandi records found.</p>
        <p style="font-size: 0.85rem; margin-top: 0.35rem;">
          Try adjusting your commodity, state, or market search filter.
        </p>
      </div>
    `;
  }
};

const loadAdminMandiRecords = async () => {
  const comm = getElement('adminMandiCommoditySelect')?.value || '';
  const state = getElement('adminMandiStateSelect')?.value || '';
  const query = getElement('adminMandiQueryInput')?.value?.trim() || '';
  const tableEl = getElement('adminMandiCachedSampleTable');

  if (tableEl) {
    tableEl.innerHTML = '<div class="text-center text-muted p-4">Loading government mandi prices...</div>';
  }

  try {
    const params = new URLSearchParams({ limit: 50 });
    if (comm) params.append('commodity', comm);
    if (state) params.append('state', state);
    if (query) params.append('market', query);

    const recordsRes = await apiRequest(`/mandi-prices?${params.toString()}`);
    if (recordsRes.ok && recordsRes.data) {
      renderAdminMandiTable(recordsRes.data, recordsRes.total);
    } else {
      renderAdminMandiTable([], 0);
    }
  } catch (err) {
    if (tableEl) {
      tableEl.innerHTML = '<p class="text-danger p-2">Failed to load mandi records.</p>';
    }
  }
};

window.handleAdminMandiSearch = async (e) => {
  if (e && e.preventDefault) e.preventDefault();
  await loadAdminMandiRecords();
  return false;
};

window.adminSyncMandiNow = async () => {
  const syncBtn = getElement('btnAdminMandiSyncNow');
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.textContent = '⏳ Syncing with OGD API...';
  }

  try {
    const res = await apiRequest('/mandi-prices/sync', { method: 'POST' });
    if (res.ok) {
      showMessage(res.message || 'Mandi sync completed successfully!', 'success');
    } else {
      showMessage(res.message || 'Mandi sync failed. Check server logs and API key.', 'error');
    }
  } catch (err) {
    showMessage('Sync request failed: ' + (err.message || 'Network error'), 'error');
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.textContent = '🔄 Sync Live Data Now';
    }
    await loadAdminMandiStatus();
  }
};

