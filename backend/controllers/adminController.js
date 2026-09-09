const { runQuery, getRow, getAll, cleanExpiredCrops } = require('../database/database');

// Get all farmers with optional filters
const getAllFarmers = async (req, res) => {
  try {
    const { search, state, district } = req.query;
    let query = `
      SELECT f.id, f.full_name, f.state, f.district, f.mandal, f.phone, f.gender, f.created_at,
             COUNT(c.id) as total_crops,
             SUM(CASE WHEN c.status = 'ACTIVE' AND c.expires_at > CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as active_crops
      FROM farmers f
      LEFT JOIN farmer_crops c ON f.id = c.farmer_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (f.full_name LIKE ? OR f.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (state) {
      query += ` AND f.state = ?`;
      params.push(state);
    }
    if (district) {
      query += ` AND f.district = ?`;
      params.push(district);
    }

    query += ` GROUP BY f.id ORDER BY f.created_at DESC`;

    const farmers = await getAll(query, params);

    res.json({
      success: true,
      data: farmers
    });
  } catch (error) {
    console.error('Error in getAllFarmers:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving farmers.' });
  }
};

// Get single farmer by id
const getFarmerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const farmer = await getRow(
      'SELECT id, full_name, state, district, mandal, phone, latitude, longitude, gender, aadhaar, created_at FROM farmers WHERE id = ?',
      [id]
    );
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found.' });
    }

    const crops = await getAll('SELECT * FROM farmer_crops WHERE farmer_id = ? ORDER BY created_at DESC', [id]);

    res.json({
      success: true,
      data: {
        ...farmer,
        crops
      }
    });
  } catch (error) {
    console.error('Error in getFarmerDetails:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving farmer details.' });
  }
};

// Get all buyers with optional filters
const getAllBuyers = async (req, res) => {
  try {
    const { search, state, district } = req.query;
    let query = `
      SELECT b.id, b.market_name, b.full_name, b.state, b.district, b.mandal, b.phone, b.created_at,
             COUNT(r.id) as total_requirements,
             SUM(CASE WHEN r.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_requirements
      FROM buyers b
      LEFT JOIN buyer_crop_requirements r ON b.id = r.buyer_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (b.market_name LIKE ? OR b.full_name LIKE ? OR b.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (state) {
      query += ` AND b.state = ?`;
      params.push(state);
    }
    if (district) {
      query += ` AND b.district = ?`;
      params.push(district);
    }

    query += ` GROUP BY b.id ORDER BY b.created_at DESC`;

    const buyers = await getAll(query, params);

    res.json({
      success: true,
      data: buyers
    });
  } catch (error) {
    console.error('Error in getAllBuyers:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving buyers.' });
  }
};

// Get single buyer by id
const getBuyerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const buyer = await getRow(
      'SELECT id, market_name, full_name, state, district, mandal, phone, latitude, longitude, created_at FROM buyers WHERE id = ?',
      [id]
    );
    if (!buyer) {
      return res.status(404).json({ success: false, message: 'Buyer not found.' });
    }

    const requirements = await getAll('SELECT * FROM buyer_crop_requirements WHERE buyer_id = ? ORDER BY created_at DESC', [id]);

    res.json({
      success: true,
      data: {
        ...buyer,
        requirements
      }
    });
  } catch (error) {
    console.error('Error in getBuyerDetails:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving buyer details.' });
  }
};

// Get all crop listings
const getAllCrops = async (req, res) => {
  try {
    await cleanExpiredCrops();
    const { search, crop_type, quality, status } = req.query;

    let query = `
      SELECT c.id, c.crop_type, c.crop_name, c.quality, c.quantity, c.harvested_date,
             c.created_at, c.expires_at, c.status,
             f.full_name as farmer_name, f.phone as farmer_phone,
             f.state, f.district, f.mandal
      FROM farmer_crops c
      JOIN farmers f ON c.farmer_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (c.crop_name LIKE ? OR f.full_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (crop_type) {
      query += ` AND c.crop_type = ?`;
      params.push(crop_type);
    }
    if (quality) {
      query += ` AND c.quality = ?`;
      params.push(quality);
    }
    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY c.created_at DESC`;

    const crops = await getAll(query, params);

    res.json({
      success: true,
      data: crops
    });
  } catch (error) {
    console.error('Error in getAllCrops:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving crops.' });
  }
};

// Get all requirements
const getAllRequirements = async (req, res) => {
  try {
    const { search, quality } = req.query;

    let query = `
      SELECT r.id, r.crop_name, r.quantity, r.quality, r.price, r.created_at, r.status,
             b.market_name, b.full_name as buyer_name, b.phone as buyer_phone,
             b.state, b.district, b.mandal
      FROM buyer_crop_requirements r
      JOIN buyers b ON r.buyer_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (r.crop_name LIKE ? OR b.market_name LIKE ? OR b.full_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (quality) {
      query += ` AND r.quality = ?`;
      params.push(quality);
    }

    query += ` ORDER BY r.created_at DESC`;

    const requirements = await getAll(query, params);

    res.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    console.error('Error in getAllRequirements:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving requirements.' });
  }
};

// Get Marketplace Statistics
const getStatistics = async (req, res) => {
  try {
    await cleanExpiredCrops();

    const farmersCount = await getRow('SELECT COUNT(*) as count FROM farmers');
    const buyersCount = await getRow('SELECT COUNT(*) as count FROM buyers');
    const activeCropsCount = await getRow("SELECT COUNT(*) as count FROM farmer_crops WHERE status = 'ACTIVE' AND expires_at > CURRENT_TIMESTAMP");
    const expiredCropsCount = await getRow("SELECT COUNT(*) as count FROM farmer_crops WHERE status = 'EXPIRED' OR expires_at <= CURRENT_TIMESTAMP");
    const activeReqCount = await getRow("SELECT COUNT(*) as count FROM buyer_crop_requirements WHERE status = 'ACTIVE'");

    // Top crop availability
    const cropAvailability = await getAll(`
      SELECT crop_name, SUM(quantity) as total_quantity, COUNT(*) as listings_count
      FROM farmer_crops
      WHERE status = 'ACTIVE' AND expires_at > CURRENT_TIMESTAMP
      GROUP BY crop_name
      ORDER BY total_quantity DESC
      LIMIT 5
    `);

    // Top buyer crop demand
    const cropDemand = await getAll(`
      SELECT crop_name, SUM(quantity) as total_demand, AVG(price) as avg_price
      FROM buyer_crop_requirements
      WHERE status = 'ACTIVE'
      GROUP BY crop_name
      ORDER BY total_demand DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        total_farmers: farmersCount.count,
        total_buyers: buyersCount.count,
        active_crops: activeCropsCount.count,
        expired_crops: expiredCropsCount.count,
        active_requirements: activeReqCount.count,
        crop_availability: cropAvailability,
        crop_demand: cropDemand
      }
    });
  } catch (error) {
    console.error('Error in getStatistics:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving marketplace statistics.' });
  }
};

// Market Prices Management (CRUD)
const getPrices = async (req, res) => {
  try {
    const { crop, state } = req.query;
    let query = 'SELECT * FROM market_prices WHERE 1=1';
    const params = [];

    if (crop) {
      query += ' AND LOWER(crop_name) LIKE ?';
      params.push(`%${crop.trim().toLowerCase()}%`);
    }
    if (state) {
      query += ' AND state = ?';
      params.push(state);
    }

    query += ' ORDER BY price_date DESC, crop_name ASC';

    const prices = await getAll(query, params);

    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Error in getPrices:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving market prices.' });
  }
};

const addPrice = async (req, res) => {
  try {
    const { crop_name, market_name, state, district, price, unit, price_date, source } = req.body;

    if (!crop_name || !market_name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Crop Name, Market Name, and Price are required.'
      });
    }

    const result = await runQuery(
      `INSERT INTO market_prices (crop_name, market_name, state, district, price, unit, price_date, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crop_name.trim(),
        market_name.trim(),
        state || '',
        district || '',
        parseFloat(price),
        unit || '₹/Quintal',
        price_date || new Date().toISOString().split('T')[0],
        source || 'Admin Verified Mandi Record'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Verified market price recorded successfully.',
      data: { id: result.lastID }
    });
  } catch (error) {
    console.error('Error in addPrice:', error.message);
    res.status(500).json({ success: false, message: 'Error adding market price.' });
  }
};

const updatePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { crop_name, market_name, state, district, price, unit, price_date, source } = req.body;

    const existing = await getRow('SELECT id FROM market_prices WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Price record not found.' });
    }

    await runQuery(
      `UPDATE market_prices
       SET crop_name = COALESCE(?, crop_name),
           market_name = COALESCE(?, market_name),
           state = COALESCE(?, state),
           district = COALESCE(?, district),
           price = COALESCE(?, price),
           unit = COALESCE(?, unit),
           price_date = COALESCE(?, price_date),
           source = COALESCE(?, source),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [crop_name, market_name, state, district, price, unit, price_date, source, id]
    );

    res.json({
      success: true,
      message: 'Market price updated successfully.'
    });
  } catch (error) {
    console.error('Error in updatePrice:', error.message);
    res.status(500).json({ success: false, message: 'Error updating market price.' });
  }
};

const deletePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery('DELETE FROM market_prices WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Price record not found.' });
    }

    res.json({
      success: true,
      message: 'Market price deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deletePrice:', error.message);
    res.status(500).json({ success: false, message: 'Error deleting market price.' });
  }
};

// Delete a farmer and all their enrolled crops
const deleteFarmer = async (req, res) => {
  try {
    const { id } = req.params;
    const farmer = await getRow('SELECT id, full_name, phone FROM farmers WHERE id = ?', [id]);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found.' });
    }

    // Delete all associated crops/enrollments
    const deletedCrops = await runQuery('DELETE FROM farmer_crops WHERE farmer_id = ?', [id]);
    // Delete farmer record
    await runQuery('DELETE FROM farmers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Farmer ${farmer.full_name} and ${deletedCrops.changes || 0} enrolled crop listing(s) deleted successfully.`
    });
  } catch (error) {
    console.error('Error in deleteFarmer:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting farmer.' });
  }
};

// Delete a buyer and all their requirements
const deleteBuyer = async (req, res) => {
  try {
    const { id } = req.params;
    const buyer = await getRow('SELECT id, market_name, full_name, phone FROM buyers WHERE id = ?', [id]);
    if (!buyer) {
      return res.status(404).json({ success: false, message: 'Buyer not found.' });
    }

    // Delete all associated requirements
    const deletedReqs = await runQuery('DELETE FROM buyer_crop_requirements WHERE buyer_id = ?', [id]);
    // Delete buyer record
    await runQuery('DELETE FROM buyers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Buyer "${buyer.market_name || buyer.full_name}" and ${deletedReqs.changes || 0} requirement(s) deleted successfully.`
    });
  } catch (error) {
    console.error('Error in deleteBuyer:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting buyer.' });
  }
};

// Delete an individual crop listing / enrollment
const deleteCrop = async (req, res) => {
  try {
    const { id } = req.params;
    const crop = await getRow('SELECT id, crop_name FROM farmer_crops WHERE id = ?', [id]);
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop listing enrollment not found.' });
    }

    await runQuery('DELETE FROM farmer_crops WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Crop enrollment for "${crop.crop_name}" deleted successfully.`
    });
  } catch (error) {
    console.error('Error in deleteCrop:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting crop listing.' });
  }
};

// Delete an individual buyer requirement enrollment
const deleteRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const reqItem = await getRow('SELECT id, crop_name FROM buyer_crop_requirements WHERE id = ?', [id]);
    if (!reqItem) {
      return res.status(404).json({ success: false, message: 'Buyer requirement not found.' });
    }

    await runQuery('DELETE FROM buyer_crop_requirements WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Buyer requirement for "${reqItem.crop_name}" deleted successfully.`
    });
  } catch (error) {
    console.error('Error in deleteRequirement:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting buyer requirement.' });
  }
};

module.exports = {
  getAllFarmers,
  getFarmerDetails,
  deleteFarmer,
  getAllBuyers,
  getBuyerDetails,
  deleteBuyer,
  getAllCrops,
  deleteCrop,
  getAllRequirements,
  deleteRequirement,
  getStatistics,
  getPrices,
  addPrice,
  updatePrice,
  deletePrice
};
