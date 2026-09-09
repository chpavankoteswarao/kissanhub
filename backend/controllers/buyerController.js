const bcrypt = require('bcryptjs');
const { runQuery, getRow, getAll, cleanExpiredCrops } = require('../database/database');

const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999.0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Register Buyer
const registerBuyer = async (req, res) => {
  try {
    const { market_name, full_name, state, district, mandal, phone, password, latitude, longitude } = req.body;

    if (!market_name || !full_name || !state || !district || !mandal || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Market Name, Full Name, State, District, Mandal, and Phone Number are required.'
      });
    }

    const cleanPhone = String(phone).trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const chosenPass = (password && password.trim().length >= 6) ? password.trim() : 'Buyer@123';
    const password_hash = await bcrypt.hash(chosenPass, salt);

    const existing = await getRow('SELECT id, market_name, full_name, state, district, mandal, phone FROM buyers WHERE phone = ?', [cleanPhone]);
    if (existing) {
      // User is already registered - update password and profile so they can login immediately
      await runQuery(
        `UPDATE buyers
         SET market_name = ?, full_name = ?, state = ?, district = ?, mandal = ?, password_hash = ?,
             latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude), updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          market_name.trim(),
          full_name.trim(),
          state.trim(),
          district.trim(),
          mandal.trim(),
          password_hash,
          latitude ? parseFloat(latitude) : null,
          longitude ? parseFloat(longitude) : null,
          existing.id
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Buyer account updated and logged in successfully!',
        data: {
          id: existing.id,
          market_name: market_name.trim(),
          full_name: full_name.trim(),
          name: full_name.trim(),
          phone: cleanPhone,
          state: state.trim(),
          district: district.trim(),
          mandal: mandal.trim(),
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: latitude ? parseFloat(longitude) : null,
          userType: 'buyer'
        }
      });
    }

    const result = await runQuery(
      `INSERT INTO buyers (market_name, full_name, state, district, mandal, phone, password_hash, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        market_name.trim(),
        full_name.trim(),
        state.trim(),
        district.trim(),
        mandal.trim(),
        cleanPhone,
        password_hash,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Buyer account registered and logged in successfully!',
      data: {
        id: result.lastID,
        market_name: market_name.trim(),
        full_name: full_name.trim(),
        name: full_name.trim(),
        phone: cleanPhone,
        state: state.trim(),
        district: district.trim(),
        mandal: mandal.trim(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: latitude ? parseFloat(longitude) : null,
        userType: 'buyer'
      }
    });
  } catch (error) {
    console.error('Error in registerBuyer:', error.message);
    res.status(500).json({ success: false, message: 'Server error during buyer registration.' });
  }
};

// Get Buyer by Phone
const getBuyerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const buyer = await getRow(
      'SELECT id, market_name, full_name, state, district, mandal, phone, latitude, longitude, created_at FROM buyers WHERE phone = ?',
      [phone.trim()]
    );

    if (!buyer) {
      return res.status(404).json({ success: false, message: 'Buyer not found.' });
    }

    res.json({
      success: true,
      data: buyer
    });
  } catch (error) {
    console.error('Error in getBuyerByPhone:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching buyer details.' });
  }
};

// Update Buyer Profile
const updateBuyerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { market_name, full_name, state, district, mandal, latitude, longitude } = req.body;

    const buyer = await getRow('SELECT id FROM buyers WHERE id = ?', [id]);
    if (!buyer) {
      return res.status(404).json({ success: false, message: 'Buyer not found.' });
    }

    await runQuery(
      `UPDATE buyers
       SET market_name = COALESCE(?, market_name),
           full_name = COALESCE(?, full_name),
           state = COALESCE(?, state),
           district = COALESCE(?, district),
           mandal = COALESCE(?, mandal),
           latitude = COALESCE(?, latitude),
           longitude = COALESCE(?, longitude),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [market_name, full_name, state, district, mandal, latitude, longitude, id]
    );

    const updated = await getRow('SELECT id, market_name, full_name, state, district, mandal, phone, latitude, longitude FROM buyers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Buyer profile updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Error in updateBuyerProfile:', error.message);
    res.status(500).json({ success: false, message: 'Error updating buyer profile.' });
  }
};

// Create Crop Requirement
const createRequirement = async (req, res) => {
  try {
    const { buyer_id, crop_name, quantity, quality, price } = req.body;

    if (!buyer_id || !crop_name || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Buyer ID, Crop Name, Required Quantity, and Buying Price are required.'
      });
    }

    const result = await runQuery(
      `INSERT INTO buyer_crop_requirements (buyer_id, crop_name, quantity, quality, price, status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [buyer_id, crop_name.trim(), parseFloat(quantity), quality || 'A', parseFloat(price)]
    );

    res.status(201).json({
      success: true,
      message: 'Crop requirement posted successfully.',
      data: {
        id: result.lastID,
        buyer_id,
        crop_name,
        quantity: parseFloat(quantity),
        quality,
        price: parseFloat(price),
        status: 'ACTIVE'
      }
    });
  } catch (error) {
    console.error('Error in createRequirement:', error.message);
    res.status(500).json({ success: false, message: 'Error posting crop requirement.' });
  }
};

// Get Buyer Requirements
const getBuyerRequirements = async (req, res) => {
  try {
    const { id } = req.params;
    const requirements = await getAll(
      `SELECT id, crop_name, quantity, quality, price, created_at, status
       FROM buyer_crop_requirements
       WHERE buyer_id = ? AND status = 'ACTIVE'
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    console.error('Error in getBuyerRequirements:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving requirements.' });
  }
};

// Update Requirement
const updateRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const { crop_name, quantity, quality, price } = req.body;

    const existing = await getRow('SELECT id FROM buyer_crop_requirements WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    await runQuery(
      `UPDATE buyer_crop_requirements
       SET crop_name = COALESCE(?, crop_name),
           quantity = COALESCE(?, quantity),
           quality = COALESCE(?, quality),
           price = COALESCE(?, price),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [crop_name, quantity, quality, price, id]
    );

    res.json({
      success: true,
      message: 'Requirement updated successfully.'
    });
  } catch (error) {
    console.error('Error in updateRequirement:', error.message);
    res.status(500).json({ success: false, message: 'Error updating requirement.' });
  }
};

// Delete Requirement
const deleteRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery('DELETE FROM buyer_crop_requirements WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    res.json({
      success: true,
      message: 'Requirement removed successfully.'
    });
  } catch (error) {
    console.error('Error in deleteRequirement:', error.message);
    res.status(500).json({ success: false, message: 'Error removing requirement.' });
  }
};

// Buyer Search for Active Farmers (excludes expired & purchased crops, calculates distance, includes AI quality & ratings)
const searchFarmers = async (req, res) => {
  try {
    const { crop, latitude, longitude, radius } = req.query;

    // Clean expired crops first
    await cleanExpiredCrops();

    const buyerLat = latitude ? parseFloat(latitude) : null;
    const buyerLon = longitude ? parseFloat(longitude) : null;
    const maxRadius = radius ? parseFloat(radius) : null;

    let query = `
      SELECT c.id as crop_id, c.crop_type, c.crop_name, c.quality, c.quantity, c.harvested_date,
             c.created_at, c.expires_at, c.photo_url, c.ai_quality_grade, c.ai_quality_score, c.ai_quality_report,
             c.aadhaar, c.gender,
             f.id as farmer_id, f.full_name as farmer_name, f.phone,
             f.state, f.district, f.mandal, f.latitude, f.longitude,
             COALESCE((SELECT ROUND(AVG(rating), 1) FROM crop_ratings WHERE farmer_id = f.id), 5.0) as farmer_rating,
             COALESCE((SELECT COUNT(*) FROM crop_ratings WHERE farmer_id = f.id), 0) as total_ratings
      FROM farmer_crops c
      JOIN farmers f ON c.farmer_id = f.id
      WHERE c.status = 'ACTIVE' AND c.expires_at > CURRENT_TIMESTAMP
    `;
    const params = [];

    if (crop && crop.trim() && crop.toLowerCase() !== 'all') {
      query += ` AND LOWER(c.crop_name) LIKE ?`;
      params.push(`%${crop.trim().toLowerCase()}%`);
    }

    const rows = await getAll(query, params);

    // Calculate distance and sort nearest first
    let results = rows.map((item) => {
      let distanceKm = 0;
      if (buyerLat && buyerLon && item.latitude && item.longitude) {
        distanceKm = calculateHaversineKm(buyerLat, buyerLon, item.latitude, item.longitude);
      } else {
        distanceKm = Math.floor(Math.random() * 20) + 2;
      }

      const hasPhoto = Boolean(item.photo_url && item.photo_url.trim());

      return {
        id: item.crop_id,
        crop_id: item.crop_id,
        farmer_id: item.farmer_id,
        farmer_name: item.farmer_name,
        crop: item.crop_name,
        crop_name: item.crop_name,
        crop_type: item.crop_type,
        quantity: item.quantity,
        quality: item.quality,
        harvested_date: item.harvested_date,
        photo_url: hasPhoto ? item.photo_url : null,
        ai_quality_grade: hasPhoto ? (item.ai_quality_grade || item.quality || 'A') : null,
        ai_quality_score: hasPhoto && item.ai_quality_score ? parseFloat(item.ai_quality_score) : null,
        ai_quality_report: hasPhoto ? item.ai_quality_report : null,
        aadhaar_masked: item.aadhaar ? '•••• •••• ' + String(item.aadhaar).slice(-4) : null,
        gender: item.gender || 'Not specified',
        farmer_rating: item.farmer_rating || 5.0,
        total_ratings: item.total_ratings || 0,
        state: item.state,
        district: item.district,
        mandal: item.mandal,
        location: `${item.mandal ? item.mandal + ', ' : ''}${item.district}, ${item.state}`,
        distance: distanceKm,
        phone_masked: item.phone ? item.phone.slice(0, 2) + '••••••' + item.phone.slice(-2) : 'Verified Producer',
        can_call_in_app: true,
        created_at: item.created_at,
        expires_at: item.expires_at
      };
    });

    if (maxRadius && maxRadius > 0) {
      results = results.filter((item) => item.distance <= maxRadius);
    }

    results.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in searchFarmers:', error.message);
    res.status(500).json({ success: false, message: 'Error searching for farmers.' });
  }
};

// Purchase Farmer Crop & Submit 5-Star Quality Rating (Disables crop from active buyer marketplace)
const purchaseAndRateCrop = async (req, res) => {
  try {
    const { buyer_id, crop_id, rating, review_text = '' } = req.body;

    if (!buyer_id || !crop_id) {
      return res.status(400).json({
        success: false,
        message: 'Buyer ID and Crop ID are required.'
      });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'A quality rating between 1 and 5 stars is mandatory to complete the crop purchase.'
      });
    }
    const numRating = parsedRating;

    // Verify crop exists
    const crop = await getRow('SELECT id, farmer_id, crop_name, status FROM farmer_crops WHERE id = ?', [crop_id]);
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop listing not found.' });
    }

    if (crop.status === 'PURCHASED') {
      return res.status(400).json({ success: false, message: 'This crop has already been purchased and disabled.' });
    }

    // 1. Mark crop as PURCHASED (which disables it from all active buyer displays)
    await runQuery(
      `UPDATE farmer_crops 
       SET status = 'PURCHASED', purchased_by = ?, purchased_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [buyer_id, crop_id]
    );

    // 2. Insert 5-star quality rating
    await runQuery(
      `INSERT INTO crop_ratings (crop_id, farmer_id, buyer_id, rating, review_text)
       VALUES (?, ?, ?, ?, ?)`,
      [crop_id, crop.farmer_id, buyer_id, numRating, review_text ? review_text.trim() : 'Quality verified and accepted.']
    );

    // 3. Compute updated farmer average rating
    const ratingStats = await getRow(
      'SELECT ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as total_ratings FROM crop_ratings WHERE farmer_id = ?',
      [crop.farmer_id]
    );

    res.json({
      success: true,
      message: `Successfully purchased "${crop.crop_name}" and submitted ${numRating}-star rating! Crop listing is now disabled from active marketplace.`,
      data: {
        crop_id,
        farmer_id: crop.farmer_id,
        rating: numRating,
        status: 'PURCHASED',
        farmer_new_avg_rating: ratingStats ? ratingStats.avg_rating : numRating,
        total_ratings: ratingStats ? ratingStats.total_ratings : 1
      }
    });
  } catch (error) {
    console.error('Error in purchaseAndRateCrop:', error.message);
    res.status(500).json({ success: false, message: 'Error processing crop purchase and rating.' });
  }
};

// Get Ratings and Reviews for a Farmer or Crop
const getCropRatings = async (req, res) => {
  try {
    const { farmer_id } = req.params;
    const ratings = await getAll(
      `SELECT r.id, r.rating, r.review_text, r.created_at,
              b.market_name, b.full_name as buyer_name,
              c.crop_name
       FROM crop_ratings r
       JOIN buyers b ON r.buyer_id = b.id
       JOIN farmer_crops c ON r.crop_id = c.id
       WHERE r.farmer_id = ?
       ORDER BY r.created_at DESC`,
      [farmer_id]
    );

    res.json({
      success: true,
      data: ratings
    });
  } catch (error) {
    console.error('Error in getCropRatings:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching ratings.' });
  }
};

module.exports = {
  registerBuyer,
  getBuyerByPhone,
  updateBuyerProfile,
  createRequirement,
  getBuyerRequirements,
  updateRequirement,
  deleteRequirement,
  searchFarmers,
  purchaseAndRateCrop,
  getCropRatings
};
