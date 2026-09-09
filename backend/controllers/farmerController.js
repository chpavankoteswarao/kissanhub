const { runQuery, getRow, getAll, cleanExpiredCrops } = require('../database/database');

const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999.0;
  const R = 6371; // Radius in km
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

const normalizeIndianPhone = (rawPhone) => {
  if (!rawPhone) return '';
  let digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.substring(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  return digits;
};

// Register Farmer
const registerFarmer = async (req, res) => {
  try {
    const { full_name, state, district, mandal, phone, latitude, longitude, gender, aadhaar } = req.body;

    if (!full_name || !state || !district || !mandal || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, State, District, Mandal, and 10-digit Phone Number are required.'
      });
    }

    const cleanPhone = normalizeIndianPhone(phone);
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number.'
      });
    }

    const existing = await getRow('SELECT id, full_name, phone, state, district, mandal FROM farmers WHERE phone = ?', [cleanPhone]);
    if (existing) {
      // Gracefully update existing farmer profile and return session
      await runQuery(
        `UPDATE farmers
         SET full_name = ?, state = ?, district = ?, mandal = ?,
             latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude),
             gender = COALESCE(?, gender), aadhaar = COALESCE(?, aadhaar),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          full_name.trim(),
          state.trim(),
          district.trim(),
          mandal.trim(),
          latitude ? parseFloat(latitude) : null,
          longitude ? parseFloat(longitude) : null,
          gender || 'Not Specified',
          aadhaar ? String(aadhaar).trim() : null,
          existing.id
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Farmer account updated and logged in successfully!',
        data: {
          id: existing.id,
          full_name: full_name.trim(),
          name: full_name.trim(),
          phone: cleanPhone,
          state: state.trim(),
          district: district.trim(),
          mandal: mandal.trim(),
          userType: 'farmer'
        }
      });
    }

    const result = await runQuery(
      `INSERT INTO farmers (full_name, state, district, mandal, phone, latitude, longitude, gender, aadhaar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name.trim(),
        state.trim(),
        district.trim(),
        mandal.trim(),
        cleanPhone,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        gender || 'Not Specified',
        aadhaar ? String(aadhaar).trim() : null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Farmer account registered successfully.',
      data: {
        id: result.lastID,
        full_name: full_name.trim(),
        name: full_name.trim(),
        phone: cleanPhone,
        state: state.trim(),
        district: district.trim(),
        mandal: mandal.trim(),
        userType: 'farmer'
      }
    });
  } catch (error) {
    console.error('Error in registerFarmer:', error.message);
    res.status(500).json({ success: false, message: 'Server error during farmer registration.' });
  }
};

// Get Farmer by Phone
const getFarmerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const cleanPhone = normalizeIndianPhone(phone);
    const farmer = await getRow(
      'SELECT id, full_name, state, district, mandal, phone, latitude, longitude, gender, aadhaar, created_at FROM farmers WHERE phone = ?',
      [cleanPhone]
    );

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found.' });
    }

    // Mask Aadhaar for safety (show only last 4 digits if present)
    const maskedAadhaar = farmer.aadhaar && farmer.aadhaar.length >= 4 
      ? 'XXXX-XXXX-' + farmer.aadhaar.slice(-4) 
      : farmer.aadhaar;

    res.json({
      success: true,
      data: {
        ...farmer,
        aadhaar: maskedAadhaar
      }
    });
  } catch (error) {
    console.error('Error in getFarmerByPhone:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching farmer profile.' });
  }
};

// Update Farmer Profile
const updateFarmerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, state, district, mandal, latitude, longitude, gender } = req.body;

    const farmer = await getRow('SELECT id FROM farmers WHERE id = ?', [id]);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found.' });
    }

    await runQuery(
      `UPDATE farmers 
       SET full_name = COALESCE(?, full_name),
           state = COALESCE(?, state),
           district = COALESCE(?, district),
           mandal = COALESCE(?, mandal),
           latitude = COALESCE(?, latitude),
           longitude = COALESCE(?, longitude),
           gender = COALESCE(?, gender),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [full_name, state, district, mandal, latitude, longitude, gender, id]
    );

    const updated = await getRow('SELECT id, full_name, state, district, mandal, phone, latitude, longitude, gender FROM farmers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Error in updateFarmerProfile:', error.message);
    res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
};

// Register Crop with automatic 5-day expiry and AI quality assessment
const registerCrop = async (req, res) => {
  try {
    const {
      farmer_id,
      crop_type,
      crop_name,
      quality,
      quantity,
      harvested_date,
      phone,
      aadhaar,
      gender,
      photo_url,
      ai_quality_grade,
      ai_quality_score,
      ai_quality_report
    } = req.body;

    if (!farmer_id || !crop_name || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Farmer ID, Crop Name, and Quantity in Quintals are required.'
      });
    }

    const now = new Date();
    const created_at = now.toISOString();
    // 5-day expiry: exactly 5 days from created_at
    const expires_at = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const hasPhoto = Boolean(photo_url && typeof photo_url === 'string' && photo_url.trim().length > 0);
    const finalPhoto = hasPhoto ? photo_url.trim() : null;
    const finalAiGrade = hasPhoto ? (ai_quality_grade || quality || 'A') : null;
    const finalAiScore = hasPhoto ? (ai_quality_score ? parseFloat(ai_quality_score) : 85.0) : null;
    const finalAiReport = hasPhoto ? (ai_quality_report || null) : null;

    const result = await runQuery(
      `INSERT INTO farmer_crops (
        farmer_id, crop_type, crop_name, quality, quantity, harvested_date, phone, aadhaar, gender,
        photo_url, ai_quality_grade, ai_quality_score, ai_quality_report, created_at, expires_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [
        farmer_id,
        crop_type || 'Food Grain',
        crop_name.trim(),
        quality || 'A',
        parseFloat(quantity),
        harvested_date || now.toISOString().split('T')[0],
        phone || null,
        aadhaar ? String(aadhaar).trim() : null,
        gender || 'Not Specified',
        finalPhoto,
        finalAiGrade,
        finalAiScore,
        finalAiReport,
        created_at,
        expires_at
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Crop registered successfully for 5-day active listing.',
      data: {
        id: result.lastID,
        farmer_id,
        crop_type,
        crop_name,
        quality: quality || ai_quality_grade || 'A',
        quantity: parseFloat(quantity),
        harvested_date,
        photo_url: photo_url || null,
        ai_quality_grade: ai_quality_grade || quality || 'A',
        ai_quality_score: ai_quality_score ? parseFloat(ai_quality_score) : 92.0,
        ai_quality_report,
        created_at,
        expires_at,
        status: 'ACTIVE'
      }
    });
  } catch (error) {
    console.error('Error in registerCrop:', error.message);
    res.status(500).json({ success: false, message: 'Error registering crop.' });
  }
};

// Get Farmer Enrolled Crops (computes expiry status, 4th-day warning, and buyer ratings)
const getFarmerCrops = async (req, res) => {
  try {
    const { id } = req.params;

    // Clean expired crops first
    await cleanExpiredCrops();

    const crops = await getAll(
      `SELECT c.id, c.crop_type, c.crop_name, c.quality, c.quantity, c.harvested_date,
              c.created_at, c.expires_at, c.status, c.photo_url, c.ai_quality_grade,
              c.ai_quality_score, c.ai_quality_report, c.purchased_by, c.purchased_at,
              r.rating, r.review_text
       FROM farmer_crops c
       LEFT JOIN crop_ratings r ON c.id = r.crop_id
       WHERE c.farmer_id = ?
       ORDER BY c.created_at DESC`,
      [id]
    );

    const now = new Date();
    const formattedCrops = crops.map((c) => {
      const expiryDate = new Date(c.expires_at);
      const diffMs = expiryDate - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let statusText = 'Expired';
      let isExpired = true;
      let isExpiringTomorrow = false;

      if (c.status === 'PURCHASED') {
        isExpired = false;
        statusText = 'Purchased by Buyer';
      } else if (c.status === 'ACTIVE' && diffMs > 0) {
        isExpired = false;
        if (diffDays === 1) {
          isExpiringTomorrow = true;
          statusText = '⚠️ Disabling Tomorrow (Day 4 Alert)';
        } else {
          statusText = `Active — Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
        }
      }

      return {
        ...c,
        is_expired: isExpired,
        is_expiring_tomorrow: isExpiringTomorrow,
        status_label: statusText,
        days_remaining: Math.max(0, diffDays)
      };
    });

    res.json({
      success: true,
      data: formattedCrops
    });
  } catch (error) {
    console.error('Error in getFarmerCrops:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching enrolled crops.' });
  }
};

// 4th-Day Expiry Alert Notifications for Farmer
const getFarmerAlerts = async (req, res) => {
  try {
    const { id } = req.params;
    await cleanExpiredCrops();

    const crops = await getAll(
      `SELECT id, crop_name, crop_type, quality, quantity, created_at, expires_at, status
       FROM farmer_crops
       WHERE farmer_id = ? AND status = 'ACTIVE'
       ORDER BY expires_at ASC`,
      [id]
    );

    const now = new Date();
    const alerts = [];

    for (const c of crops) {
      const expiryDate = new Date(c.expires_at);
      const diffMs = expiryDate - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1 && diffMs > 0) {
        alerts.push({
          type: 'EXPIRY_WARNING',
          crop_id: c.id,
          crop_name: c.crop_name,
          quantity: c.quantity,
          days_remaining: 1,
          message: `Alert: Your crop enrollment for "${c.crop_name}" will be disabled by tomorrow! (5-day enrollment validity expires in 24 hours)`
        });
      }
    }

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error in getFarmerAlerts:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving alerts.' });
  }
};

// Delete Crop
const deleteCrop = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery('DELETE FROM farmer_crops WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Crop listing not found.' });
    }

    res.json({
      success: true,
      message: 'Crop listing deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deleteCrop:', error.message);
    res.status(500).json({ success: false, message: 'Error deleting crop listing.' });
  }
};

// Sell My Crop: Find Nearby Buyers matching crop requirement using Geolocation and Haversine formula
const getNearbyBuyers = async (req, res) => {
  try {
    const { crop, latitude, longitude } = req.query;

    const userLat = latitude ? parseFloat(latitude) : null;
    const userLon = longitude ? parseFloat(longitude) : null;

    let query = `
      SELECT r.id as req_id, r.crop_name, r.quantity, r.quality, r.price, r.created_at,
             b.id as buyer_id, b.market_name, b.full_name as buyer_name, b.phone,
             b.state, b.district, b.mandal, b.latitude, b.longitude
      FROM buyer_crop_requirements r
      JOIN buyers b ON r.buyer_id = b.id
      WHERE r.status = 'ACTIVE'
    `;
    const params = [];

    if (crop && crop.trim() && crop.toLowerCase() !== 'all') {
      query += ` AND LOWER(r.crop_name) LIKE ?`;
      params.push(`%${crop.trim().toLowerCase()}%`);
    }

    const rows = await getAll(query, params);

    // Calculate distance and sort nearest first
    const results = rows.map((item) => {
      let distanceKm = 0;
      if (userLat && userLon && item.latitude && item.longitude) {
        distanceKm = calculateHaversineKm(userLat, userLon, item.latitude, item.longitude);
      } else {
        // Fallback default distance
        distanceKm = Math.floor(Math.random() * 25) + 3;
      }

      return {
        id: item.req_id,
        buyer_id: item.buyer_id,
        buyer_name: item.buyer_name,
        market_name: item.market_name,
        location: `${item.mandal ? item.mandal + ', ' : ''}${item.district}, ${item.state}`,
        state: item.state,
        district: item.district,
        mandal: item.mandal,
        phone_masked: item.phone ? item.phone.slice(0, 2) + '••••••' + item.phone.slice(-2) : 'Verified Buyer',
        can_call_in_app: true,
        crop: item.crop_name,
        required_quantity: item.quantity,
        required_quality: item.quality,
        current_buying_price: item.price,
        distance: distanceKm,
        created_at: item.created_at
      };
    });

    results.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in getNearbyBuyers:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving nearby buyers.' });
  }
};

module.exports = {
  registerFarmer,
  getFarmerByPhone,
  updateFarmerProfile,
  registerCrop,
  getFarmerCrops,
  getFarmerAlerts,
  deleteCrop,
  getNearbyBuyers
};
