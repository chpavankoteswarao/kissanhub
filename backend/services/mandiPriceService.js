const { runQuery, getRow, getAll } = require('../database/database');

/**
 * KISSAN-HUB — mandiPriceService.js
 * Dedicated backend service interfacing with the official Government of India
 * Open Government Data (OGD) Platform / data.gov.in API.
 *
 * Strictly adheres to security rules:
 * - Reads API key only from environment variables (process.env.GOV_API_KEY).
 * - Never returns the API key to clients or frontend.
 * - Enforces real government records: never invents, fakes, or hardcodes prices.
 * - High-efficiency caching with configurable TTL (default 30 mins).
 */

const getGovApiKey = () => {
  const key = process.env.GOV_API_KEY ? process.env.GOV_API_KEY.trim() : '';
  if (!key || key === 'YOUR_DATA_GOV_IN_API_KEY_HERE' || key === 'YOUR_API_KEY_HERE') {
    return null;
  }
  return key;
};

const getGovResourceId = () => {
  return (process.env.MANDI_PRICE_RESOURCE_ID && process.env.MANDI_PRICE_RESOURCE_ID.trim())
    ? process.env.MANDI_PRICE_RESOURCE_ID.trim()
    : '9ef84268-d588-465a-a308-a864a43d0070';
};

const getCacheDurationMs = () => {
  const mins = parseInt(process.env.MANDI_CACHE_MINUTES, 10) || 30;
  return mins * 60 * 1000;
};

// In-memory cache for ultra-fast zero-lag responses
let inMemoryCache = {
  data: null,
  timestamp: 0,
  lastDataDate: null,
  totalRecords: 0
};

/**
 * Normalizes raw government API records into KISSAN-HUB standard schema.
 * Handles diverse field naming conventions returned by data.gov.in.
 */
const normalizeGovRecord = (record) => {
  if (!record || typeof record !== 'object') return null;

  const market = String(record.market || record.Market || record.market_name || 'N/A').trim();
  const district = String(record.district || record.District || 'N/A').trim();
  const state = String(record.state || record.State || 'N/A').trim();
  const commodity = String(record.commodity || record.Commodity || record.crop || 'N/A').trim();
  const variety = String(record.variety || record.Variety || 'Standard').trim();
  const grade = String(record.grade || record.Grade || 'FAQ').trim();
  const arrivalDate = String(record.arrival_date || record.Arrival_Date || record.date || 'N/A').trim();

  const minPrice = parseFloat(record.min_price || record.Min_Price || 0) || 0;
  const maxPrice = parseFloat(record.max_price || record.Max_Price || 0) || 0;
  const modalPrice = parseFloat(record.modal_price || record.Modal_Price || minPrice || 0) || 0;

  // Approximate per-kg calculation (1 quintal = 100 kg)
  const approxPerKg = modalPrice > 0 ? parseFloat((modalPrice / 100).toFixed(2)) : 0;

  return {
    market,
    district,
    state,
    commodity,
    variety,
    grade,
    arrival_date: arrivalDate,
    min_price: minPrice,
    max_price: maxPrice,
    modal_price: modalPrice,
    unit: 'quintal',
    approx_per_kg: approxPerKg,
    source: 'Government of India OGD Platform'
  };
};

/**
 * Calls the official data.gov.in API to fetch live mandi prices.
 */
const fetchFromGovernmentApi = async ({ crop = '', state = '', district = '', market = '', limit = 200, offset = 0 } = {}) => {
  const apiKey = getGovApiKey();
  const resourceId = getGovResourceId();

  if (!apiKey) {
    return {
      success: false,
      error: 'API_KEY_NOT_CONFIGURED',
      message: 'Government API key is not configured in backend/.env. Please configure your data.gov.in API key.'
    };
  }

  const queryParams = new URLSearchParams();
  queryParams.append('api-key', apiKey);
  queryParams.append('format', 'json');
  queryParams.append('limit', String(limit));
  queryParams.append('offset', String(offset));

  if (crop && crop.trim() && crop.toLowerCase() !== 'all') {
    queryParams.append('filters[commodity]', crop.trim());
  }
  if (state && state.trim() && state.toLowerCase() !== 'all') {
    queryParams.append('filters[state]', state.trim());
  }
  if (district && district.trim() && district.toLowerCase() !== 'all') {
    queryParams.append('filters[district]', district.trim());
  }
  if (market && market.trim() && market.toLowerCase() !== 'all') {
    queryParams.append('filters[market]', market.trim());
  }

  const endpointUrl = `https://api.data.gov.in/resource/${resourceId}?${queryParams.toString()}`;

  // 10-second timeout safety
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KISSAN-HUB-AgriPlatform/2.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let parsedErr = errorText;
      try {
        parsedErr = JSON.parse(errorText).message || errorText;
      } catch (e) {}

      // Update sync meta status
      await setSyncMeta('last_sync_status', `HTTP_${response.status}`);
      await setSyncMeta('last_error_message', `Government API returned HTTP ${response.status}: ${parsedErr.slice(0, 200)}`);

      return {
        success: false,
        error: `HTTP_${response.status}`,
        message: 'Government market-price service is temporarily unavailable. Please try again later.'
      };
    }

    const json = await response.json();
    const rawRecords = json.records || json.data || [];

    if (!Array.isArray(rawRecords)) {
      await setSyncMeta('last_sync_status', 'INVALID_FORMAT');
      return {
        success: false,
        error: 'INVALID_FORMAT',
        message: 'Government API returned an unexpected response format.'
      };
    }

    const normalizedRecords = rawRecords
      .map(normalizeGovRecord)
      .filter(r => r !== null && r.modal_price > 0);

    // Track latest arrival date from real government data
    let latestDataDate = null;
    if (normalizedRecords.length > 0) {
      latestDataDate = normalizedRecords[0].arrival_date;
      for (const r of normalizedRecords) {
        if (r.arrival_date && r.arrival_date !== 'N/A') {
          latestDataDate = r.arrival_date;
          break;
        }
      }
    }

    // Persist to local SQLite cache table
    if (normalizedRecords.length > 0) {
      await saveRecordsToDbCache(normalizedRecords);
    }

    // Update in-memory cache
    inMemoryCache = {
      data: normalizedRecords,
      timestamp: Date.now(),
      lastDataDate: latestDataDate,
      totalRecords: json.total || normalizedRecords.length
    };

    // Update admin sync meta
    await setSyncMeta('last_sync_time', new Date().toISOString());
    await setSyncMeta('last_sync_status', 'SUCCESS');
    await setSyncMeta('last_data_date', latestDataDate || 'N/A');
    await setSyncMeta('last_records_count', String(normalizedRecords.length));
    await setSyncMeta('last_error_message', '');

    return {
      success: true,
      data: normalizedRecords,
      total: json.total || normalizedRecords.length,
      last_data_date: latestDataDate,
      source: 'Government of India OGD Platform (Live API)',
      is_cached: false
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[Government API Error]:', err.message);

    const isTimeout = err.name === 'AbortError';
    const errMsg = isTimeout
      ? 'Government API connection timed out.'
      : 'Network error connecting to Government of India OGD servers.';

    await setSyncMeta('last_sync_status', isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR');
    await setSyncMeta('last_error_message', errMsg);

    return {
      success: false,
      error: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: 'Government market-price service is temporarily unavailable. Please try again later.'
    };
  }
};

/**
 * Stores verified government records into SQLite gov_mandi_cache table.
 */
const saveRecordsToDbCache = async (records) => {
  try {
    for (const r of records) {
      // Check if exact record exists for market, commodity, and arrival_date
      const existing = await getRow(
        `SELECT id FROM gov_mandi_cache WHERE market = ? AND commodity = ? AND arrival_date = ?`,
        [r.market, r.commodity, r.arrival_date]
      );

      if (!existing) {
        await runQuery(
          `INSERT INTO gov_mandi_cache (
            commodity, market, district, state, variety, grade, arrival_date,
            min_price, max_price, modal_price, unit, source, fetched_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            r.commodity,
            r.market,
            r.district,
            r.state,
            r.variety,
            r.grade,
            r.arrival_date,
            r.min_price,
            r.max_price,
            r.modal_price,
            r.unit,
            r.source
          ]
        );
      } else {
        await runQuery(
          `UPDATE gov_mandi_cache 
           SET min_price = ?, max_price = ?, modal_price = ?, fetched_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [r.min_price, r.max_price, r.modal_price, existing.id]
        );
      }
    }
  } catch (dbErr) {
    console.warn('[Cache DB Warning]: Could not persist government records:', dbErr.message);
  }
};

/**
 * Retrieves cached government records from SQLite when live API is unavailable or within TTL.
 */
const getRecordsFromDbCache = async ({ crop = '', state = '', district = '', market = '', limit = 100 } = {}) => {
  try {
    let query = `
      SELECT commodity, market, district, state, variety, grade, arrival_date,
             min_price, max_price, modal_price, unit, source, fetched_at
      FROM gov_mandi_cache
      WHERE modal_price > 0
    `;
    const params = [];

    if (crop && crop.trim() && crop.toLowerCase() !== 'all') {
      query += ` AND LOWER(commodity) LIKE ?`;
      params.push(`%${crop.trim().toLowerCase()}%`);
    }
    if (state && state.trim() && state.toLowerCase() !== 'all') {
      query += ` AND LOWER(state) LIKE ?`;
      params.push(`%${state.trim().toLowerCase()}%`);
    }
    if (district && district.trim() && district.toLowerCase() !== 'all') {
      query += ` AND LOWER(district) LIKE ?`;
      params.push(`%${district.trim().toLowerCase()}%`);
    }
    if (market && market.trim() && market.toLowerCase() !== 'all') {
      query += ` AND LOWER(market) LIKE ?`;
      params.push(`%${market.trim().toLowerCase()}%`);
    }

    query += ` ORDER BY arrival_date DESC, modal_price DESC LIMIT ?`;
    params.push(parseInt(limit, 10) || 100);

    const rows = await getAll(query, params);

    return rows.map(r => ({
      ...r,
      approx_per_kg: r.modal_price > 0 ? parseFloat((r.modal_price / 100).toFixed(2)) : 0
    }));
  } catch (err) {
    console.error('[Cache DB Fetch Error]:', err.message);
    return [];
  }
};

/**
 * Primary public function to fetch mandi prices with intelligent caching and fallback.
 */
const getMandiPrices = async (filters = {}, forceRefresh = false) => {
  const cacheTtl = getCacheDurationMs();
  const isCacheValid = !forceRefresh && inMemoryCache.data && (Date.now() - inMemoryCache.timestamp < cacheTtl);

  // If in-memory cache is valid and filter matches all or memory filter applied
  if (isCacheValid) {
    let filtered = inMemoryCache.data;
    if (filters.crop && filters.crop.toLowerCase() !== 'all') {
      filtered = filtered.filter(r => r.commodity.toLowerCase().includes(filters.crop.trim().toLowerCase()));
    }
    if (filters.state && filters.state.toLowerCase() !== 'all') {
      filtered = filtered.filter(r => r.state.toLowerCase().includes(filters.state.trim().toLowerCase()));
    }
    if (filters.district && filters.district.toLowerCase() !== 'all') {
      filtered = filtered.filter(r => r.district.toLowerCase().includes(filters.district.trim().toLowerCase()));
    }
    if (filters.market && filters.market.toLowerCase() !== 'all') {
      filtered = filtered.filter(r => r.market.toLowerCase().includes(filters.market.trim().toLowerCase()));
    }

    if (filtered.length > 0) {
      return {
        success: true,
        data: filtered.slice(0, parseInt(filters.limit, 10) || 100),
        total: filtered.length,
        last_data_date: inMemoryCache.lastDataDate,
        is_cached: true,
        cached_notice: `Cached government data (Date: ${inMemoryCache.lastDataDate || 'Recent'})`,
        source: 'Government of India OGD Platform'
      };
    }
  }

  // Attempt live fetch from data.gov.in
  const apiResult = await fetchFromGovernmentApi(filters);

  if (apiResult.success && apiResult.data.length > 0) {
    return apiResult;
  }

  // If API call was not successful or returned empty, check SQLite cache
  const dbCached = await getRecordsFromDbCache(filters);

  if (dbCached.length > 0) {
    const metaDate = await getSyncMeta('last_data_date');
    return {
      success: true,
      data: dbCached,
      total: dbCached.length,
      last_data_date: metaDate || dbCached[0].arrival_date,
      is_cached: true,
      cached_notice: `Cached government data (Date: ${metaDate || dbCached[0].arrival_date || 'Recent'})`,
      source: 'Government of India OGD Platform',
      api_note: apiResult.message || 'Displaying verified cached government records.'
    };
  }

  // NO fake prices allowed! Return clear, transparent error message
  return {
    success: false,
    error: apiResult.error || 'SERVICE_UNAVAILABLE',
    message: 'Government market-price service is temporarily unavailable. Please try again later.',
    details: apiResult.message || null,
    data: []
  };
};

/**
 * Get distinct filters (commodities, states, districts) from available records.
 */
const getAvailableFilters = async () => {
  try {
    const commodities = await getAll(`SELECT DISTINCT commodity FROM gov_mandi_cache ORDER BY commodity ASC`);
    const states = await getAll(`SELECT DISTINCT state FROM gov_mandi_cache WHERE state != 'N/A' ORDER BY state ASC`);
    const districts = await getAll(`SELECT DISTINCT district, state FROM gov_mandi_cache WHERE district != 'N/A' ORDER BY district ASC`);
    const markets = await getAll(`SELECT DISTINCT market FROM gov_mandi_cache WHERE market != 'N/A' ORDER BY market ASC`);

    return {
      commodities: commodities.map(c => c.commodity),
      states: states.map(s => s.state),
      districts: districts,
      markets: markets.map(m => m.market)
    };
  } catch (err) {
    return { commodities: [], states: [], districts: [], markets: [] };
  }
};

/**
 * Metadata Helpers for Admin Dashboard status tracking without secret leakage.
 */
const getSyncMeta = async (key) => {
  try {
    const row = await getRow(`SELECT value FROM gov_api_sync_meta WHERE key = ?`, [key]);
    return row ? row.value : null;
  } catch (err) {
    return null;
  }
};

const setSyncMeta = async (key, value) => {
  try {
    await runQuery(
      `INSERT INTO gov_api_sync_meta (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      [key, String(value)]
    );
  } catch (err) {
    console.warn('[Sync Meta Warning]:', err.message);
  }
};

/**
 * Returns Admin Health & Connectivity Status.
 * Strictly NEVER reveals the actual GOV_API_KEY.
 */
const getAdminStatus = async () => {
  const apiKey = getGovApiKey();
  const resourceId = getGovResourceId();
  const cacheMins = parseInt(process.env.MANDI_CACHE_MINUTES, 10) || 30;

  const lastSync = await getSyncMeta('last_sync_time');
  const lastStatus = await getSyncMeta('last_sync_status');
  const lastDataDate = await getSyncMeta('last_data_date');
  const lastRecordsCount = await getSyncMeta('last_records_count');
  const lastError = await getSyncMeta('last_error_message');

  const totalCachedRow = await getRow(`SELECT COUNT(*) as cnt FROM gov_mandi_cache`);
  const totalCached = totalCachedRow ? totalCachedRow.cnt : 0;

  let connectionState = 'STANDBY';
  if (!apiKey) {
    connectionState = 'API_KEY_NOT_CONFIGURED';
  } else if (lastStatus === 'SUCCESS') {
    connectionState = 'ONLINE';
  } else if (lastStatus) {
    connectionState = 'ERROR';
  }

  let cacheStatus = 'No cached records';
  if (inMemoryCache.timestamp > 0) {
    const elapsedMins = Math.round((Date.now() - inMemoryCache.timestamp) / 60000);
    const remainingMins = Math.max(0, cacheMins - elapsedMins);
    cacheStatus = remainingMins > 0
      ? `Active (${remainingMins} mins remaining before re-fetch)`
      : 'Cache Expired (will re-fetch on next query)';
  } else if (totalCached > 0) {
    cacheStatus = `Database cache available (${totalCached} records)`;
  }

  return {
    api_key_configured: !!apiKey,
    resource_id: resourceId,
    connection_status: connectionState,
    last_sync_status: lastStatus || (apiKey ? 'READY' : 'KEY_MISSING'),
    last_sync_time: lastSync || 'Never',
    last_data_arrival_date: lastDataDate || inMemoryCache.lastDataDate || 'N/A',
    last_data_date: lastDataDate || inMemoryCache.lastDataDate || 'N/A',
    records_fetched: lastRecordsCount ? parseInt(lastRecordsCount, 10) : totalCached,
    cached_records_count: totalCached,
    total_cached_records: totalCached,
    cache_ttl_minutes: cacheMins,
    cache_status: cacheStatus,
    last_sync_message: lastError || (lastStatus === 'SUCCESS' ? 'All records synchronized with OGD Platform.' : null),
    last_error: lastError || null,
    source: 'Government of India — Open Government Data Platform (data.gov.in)'
  };
};

module.exports = {
  getMandiPrices,
  fetchFromGovernmentApi,
  getAvailableFilters,
  getAdminStatus,
  normalizeGovRecord
};
