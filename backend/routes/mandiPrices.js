const express = require('express');
const router = express.Router();
const mandiPriceService = require('../services/mandiPriceService');

/**
 * GET /api/mandi-prices
 * Query parameters:
 * - crop (or commodity)
 * - state
 * - district
 * - market
 * - limit
 * - page
 * - refresh (boolean)
 */
router.get('/', async (req, res) => {
  try {
    const { crop, commodity, state, district, market, limit = 100, page = 1, refresh } = req.query;

    const filters = {
      crop: crop || commodity || '',
      state: state || '',
      district: district || '',
      market: market || '',
      limit: parseInt(limit, 10) || 100,
      offset: ((parseInt(page, 10) || 1) - 1) * (parseInt(limit, 10) || 100)
    };

    const forceRefresh = refresh === 'true' || refresh === '1';

    const result = await mandiPriceService.getMandiPrices(filters, forceRefresh);

    if (result.success) {
      return res.json({
        success: true,
        data: result.data,
        total: result.total || result.data.length,
        last_data_date: result.last_data_date || 'N/A',
        is_cached: !!result.is_cached,
        cached_notice: result.cached_notice || null,
        source: 'Government of India OGD Platform (data.gov.in)',
        api_note: result.api_note || null
      });
    }

    return res.status(200).json({
      success: false,
      message: result.message || 'Government market-price service is temporarily unavailable. Please try again later.',
      error: result.error,
      data: []
    });
  } catch (error) {
    console.error('Error in GET /api/mandi-prices:', error.message);
    res.status(500).json({
      success: false,
      message: 'Government market-price service is temporarily unavailable. Please try again later.',
      data: []
    });
  }
});

/**
 * GET /api/mandi-prices/nearby
 * Returns official government mandi prices in farmer's registered district/state
 */
router.get('/nearby', async (req, res) => {
  try {
    const { state, district, crop } = req.query;

    if (!state && !district) {
      return res.status(400).json({
        success: false,
        message: 'State or District is required to determine nearby mandis.',
        data: []
      });
    }

    const filters = {
      state: state || '',
      district: district || '',
      crop: crop || '',
      limit: 30
    };

    const result = await mandiPriceService.getMandiPrices(filters, false);

    res.json({
      success: result.success,
      data: result.data || [],
      last_data_date: result.last_data_date || 'N/A',
      location: `${district ? district + ', ' : ''}${state || ''}`,
      source: 'Government of India OGD Platform'
    });
  } catch (error) {
    console.error('Error in /api/mandi-prices/nearby:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve nearby mandi prices.',
      data: []
    });
  }
});

/**
 * GET /api/mandi-prices/filters
 * Returns list of distinct commodities, states, and districts from available government records
 */
router.get('/filters', async (req, res) => {
  try {
    const filters = await mandiPriceService.getAvailableFilters();
    res.json({
      success: true,
      data: filters
    });
  } catch (error) {
    console.error('Error in /api/mandi-prices/filters:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve filters.',
      data: { commodities: [], states: [], districts: [] }
    });
  }
});

/**
 * GET /api/mandi-prices/status
 * Admin monitoring endpoint. Never reveals the secret API key.
 */
router.get('/status', async (req, res) => {
  try {
    const status = await mandiPriceService.getAdminStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error in /api/mandi-prices/status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve government API status.'
    });
  }
});

/**
 * POST /api/mandi-prices/sync
 * Admin trigger to force a live sync from data.gov.in
 */
router.post('/sync', async (req, res) => {
  try {
    const result = await mandiPriceService.fetchFromGovernmentApi({ limit: 200 });
    res.json(result);
  } catch (error) {
    console.error('Error in /api/mandi-prices/sync:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger sync.'
    });
  }
});

module.exports = router;
