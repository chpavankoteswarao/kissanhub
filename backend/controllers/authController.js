const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getRow, runQuery } = require('../database/database');

// Active admin tokens cache in-memory
const activeAdminTokens = new Set();

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

const validateIndianPhone = (phone) => {
  const cleaned = normalizeIndianPhone(phone);
  return /^\d{10}$/.test(cleaned);
};

// Check farmer phone
const checkFarmerPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = normalizeIndianPhone(phone);
    if (!cleanPhone || !validateIndianPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number.'
      });
    }

    const farmer = await getRow('SELECT id, full_name, phone, state, district, mandal FROM farmers WHERE phone = ?', [cleanPhone]);
    if (farmer) {
      return res.json({
        success: true,
        exists: true,
        message: 'Farmer registered',
        data: { id: farmer.id, full_name: farmer.full_name, phone: farmer.phone }
      });
    } else {
      // Check if registered as Buyer
      const buyer = await getRow('SELECT id, full_name, market_name FROM buyers WHERE phone = ?', [cleanPhone]);
      if (buyer) {
        return res.status(404).json({
          success: false,
          exists: false,
          isBuyer: true,
          message: 'This phone number is registered as a Buyer. Please switch to Buyer Login.',
          buyerName: buyer.full_name || buyer.market_name
        });
      }

      return res.status(404).json({
        success: false,
        exists: false,
        message: 'Farmer not registered.'
      });
    }
  } catch (error) {
    console.error('Error in checkFarmerPhone:', error.message);
    res.status(500).json({ success: false, message: 'Server error while checking farmer registration.' });
  }
};

// Check buyer phone
const checkBuyerPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = normalizeIndianPhone(phone);
    if (!cleanPhone || !validateIndianPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number.'
      });
    }

    const buyer = await getRow('SELECT id, market_name, full_name, phone, state, district, mandal FROM buyers WHERE phone = ?', [cleanPhone]);
    if (buyer) {
      return res.json({
        success: true,
        exists: true,
        message: 'Buyer registered',
        data: { id: buyer.id, market_name: buyer.market_name, full_name: buyer.full_name, phone: buyer.phone }
      });
    } else {
      // Check if registered as Farmer
      const farmer = await getRow('SELECT id, full_name FROM farmers WHERE phone = ?', [cleanPhone]);
      if (farmer) {
        return res.status(404).json({
          success: false,
          exists: false,
          isFarmer: true,
          message: 'This phone number is registered as a Farmer. Please switch to Farmer Login.',
          farmerName: farmer.full_name
        });
      }

      return res.status(404).json({
        success: false,
        exists: false,
        message: 'Buyer not registered.'
      });
    }
  } catch (error) {
    console.error('Error in checkBuyerPhone:', error.message);
    res.status(500).json({ success: false, message: 'Server error while checking buyer registration.' });
  }
};

// Verify OTP (Demo OTP: 123456)
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!otp || String(otp).trim() !== '123456') {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Universal password/OTP is 123456.'
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully.'
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error.message);
    res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
  }
};

// Farmer Login with Phone and Universal Password / OTP (123456)
const farmerLogin = async (req, res) => {
  try {
    const { phone, otp, password } = req.body;
    const cleanPhone = normalizeIndianPhone(phone);

    if (!cleanPhone || !validateIndianPhone(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian phone number.' });
    }

    const enteredPass = String(password || otp || '123456').trim();
    if (enteredPass && enteredPass !== '123456') {
      return res.status(400).json({ success: false, message: 'Universal password for all phone numbers is 123456.' });
    }

    let farmer = await getRow(
      'SELECT id, full_name, state, district, mandal, phone, latitude, longitude, gender FROM farmers WHERE phone = ?',
      [cleanPhone]
    );

    if (!farmer) {
      // Check if registered as Buyer
      const buyer = await getRow('SELECT id, market_name, full_name, state, district, mandal, phone, latitude, longitude FROM buyers WHERE phone = ?', [cleanPhone]);
      if (buyer) {
        const ins = await runQuery(
          `INSERT INTO farmers (full_name, state, district, mandal, phone, latitude, longitude, gender)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [buyer.full_name || buyer.market_name, buyer.state || 'Andhra Pradesh', buyer.district || 'West Godavari', buyer.mandal || 'Bhimavaram', cleanPhone, buyer.latitude, buyer.longitude, 'Male']
        );
        farmer = {
          id: ins.lastID,
          full_name: buyer.full_name || buyer.market_name,
          state: buyer.state || 'Andhra Pradesh',
          district: buyer.district || 'West Godavari',
          mandal: buyer.mandal || 'Bhimavaram',
          phone: cleanPhone,
          latitude: buyer.latitude,
          longitude: buyer.longitude,
          gender: 'Male'
        };
      } else {
        // Auto-register farmer immediately with universal credentials 123456
        const ins = await runQuery(
          `INSERT INTO farmers (full_name, state, district, mandal, phone, gender)
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['Kisan Farmer', 'Andhra Pradesh', 'West Godavari', 'Bhimavaram', cleanPhone, 'Male']
        );
        farmer = {
          id: ins.lastID,
          full_name: 'Kisan Farmer',
          state: 'Andhra Pradesh',
          district: 'West Godavari',
          mandal: 'Bhimavaram',
          phone: cleanPhone,
          latitude: null,
          longitude: null,
          gender: 'Male'
        };
      }
    }

    res.json({
      success: true,
      message: 'Farmer authenticated successfully.',
      data: {
        id: farmer.id,
        userType: 'farmer',
        name: farmer.full_name,
        full_name: farmer.full_name,
        phone: farmer.phone,
        state: farmer.state,
        district: farmer.district,
        mandal: farmer.mandal,
        latitude: farmer.latitude,
        longitude: farmer.longitude,
        gender: farmer.gender
      }
    });
  } catch (error) {
    console.error('Error in farmerLogin:', error.message);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

// Buyer Login with Password (Universal Password 123456 or custom)
const buyerLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const cleanPhone = normalizeIndianPhone(phone);
    if (!cleanPhone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required.' });
    }

    let buyer = await getRow(
      'SELECT id, market_name, full_name, state, district, mandal, phone, password_hash, latitude, longitude FROM buyers WHERE phone = ?',
      [cleanPhone]
    );

    if (!buyer) {
      // Check if registered as Farmer instead
      const farmer = await getRow('SELECT id, full_name, state, district, mandal, phone, latitude, longitude FROM farmers WHERE phone = ?', [cleanPhone]);
      if (farmer) {
        // Auto-create buyer profile from farmer info
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('123456', salt);
        const ins = await runQuery(
          `INSERT INTO buyers (market_name, full_name, state, district, mandal, phone, password_hash, latitude, longitude)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [farmer.full_name + ' Market', farmer.full_name, farmer.state || 'Andhra Pradesh', farmer.district || 'West Godavari', farmer.mandal || 'Bhimavaram', cleanPhone, hash, farmer.latitude, farmer.longitude]
        );
        buyer = {
          id: ins.lastID,
          market_name: farmer.full_name + ' Market',
          full_name: farmer.full_name,
          state: farmer.state,
          district: farmer.district,
          mandal: farmer.mandal,
          phone: cleanPhone,
          latitude: farmer.latitude,
          longitude: farmer.longitude
        };
      } else {
        return res.status(404).json({
          success: false,
          notRegistered: true,
          message: 'Buyer not registered with this number. Please click Register Now to create an account.'
        });
      }
    }

    // Universal password 123456 works for all accounts, plus custom bcrypt check
    let isMatch = false;
    if (String(password).trim() === '123456') {
      isMatch = true;
    } else if (buyer.password_hash) {
      isMatch = await bcrypt.compare(password, buyer.password_hash);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        incorrectPassword: true,
        message: 'Incorrect password. Universal password for all phone numbers is 123456.'
      });
    }

    res.json({
      success: true,
      message: 'Buyer authenticated successfully.',
      data: {
        id: buyer.id,
        userType: 'buyer',
        name: buyer.full_name,
        full_name: buyer.full_name,
        market_name: buyer.market_name,
        phone: buyer.phone,
        state: buyer.state,
        district: buyer.district,
        mandal: buyer.mandal,
        latitude: buyer.latitude,
        longitude: buyer.longitude
      }
    });
  } catch (error) {
    console.error('Error in buyerLogin:', error.message);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

// Buyer Login with OTP (Universal: 123456)
const buyerOtpLogin = async (req, res) => {
  try {
    const { phone, otp, password } = req.body;
    const cleanPhone = normalizeIndianPhone(phone);
    if (!cleanPhone || !validateIndianPhone(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
    }
    const entered = String(otp || password || '').trim();
    if (entered && entered !== '123456' && entered.length < 4) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Universal password/OTP is 123456.' });
    }

    let buyer = await getRow(
      'SELECT id, market_name, full_name, state, district, mandal, phone, latitude, longitude FROM buyers WHERE phone = ?',
      [cleanPhone]
    );

    if (!buyer) {
      const farmer = await getRow('SELECT id, full_name, state, district, mandal, phone, latitude, longitude FROM farmers WHERE phone = ?', [cleanPhone]);
      if (farmer) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('123456', salt);
        const ins = await runQuery(
          `INSERT INTO buyers (market_name, full_name, state, district, mandal, phone, password_hash, latitude, longitude)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [farmer.full_name + ' Market', farmer.full_name, farmer.state || 'Andhra Pradesh', farmer.district || 'West Godavari', farmer.mandal || 'Bhimavaram', cleanPhone, hash, farmer.latitude, farmer.longitude]
        );
        buyer = {
          id: ins.lastID,
          market_name: farmer.full_name + ' Market',
          full_name: farmer.full_name,
          state: farmer.state,
          district: farmer.district,
          mandal: farmer.mandal,
          phone: cleanPhone,
          latitude: farmer.latitude,
          longitude: farmer.longitude
        };
      } else {
        return res.status(404).json({
          success: false,
          notRegistered: true,
          message: 'Buyer not registered with this number. Please click Register Now to create an account.'
        });
      }
    }

    res.json({
      success: true,
      message: 'Buyer authenticated successfully with OTP.',
      data: {
        id: buyer.id,
        userType: 'buyer',
        name: buyer.full_name,
        full_name: buyer.full_name,
        market_name: buyer.market_name,
        phone: buyer.phone,
        state: buyer.state,
        district: buyer.district,
        mandal: buyer.mandal,
        latitude: buyer.latitude,
        longitude: buyer.longitude
      }
    });
  } catch (error) {
    console.error('Error in buyerOtpLogin:', error.message);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

// Buyer Create Password (during registration)
const buyerCreatePassword = async (req, res) => {
  try {
    const { phone, password, confirmPassword } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required.' });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const update = await runQuery('UPDATE buyers SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?', [password_hash, phone.trim()]);
    if (update.changes === 0) {
      return res.status(404).json({ success: false, message: 'Buyer not found.' });
    }

    res.json({
      success: true,
      message: 'Password created successfully. Please login with your new credentials.'
    });
  } catch (error) {
    console.error('Error in buyerCreatePassword:', error.message);
    res.status(500).json({ success: false, message: 'Error creating password.' });
  }
};

// Buyer Reset Password (forgot password flow)
const buyerResetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword, confirmPassword } = req.body;
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (String(otp).trim() !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    const update = await runQuery('UPDATE buyers SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?', [password_hash, phone.trim()]);
    if (update.changes === 0) {
      return res.status(404).json({ success: false, message: 'Buyer not found.' });
    }

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    console.error('Error in buyerResetPassword:', error.message);
    res.status(500).json({ success: false, message: 'Error resetting password.' });
  }
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const admin = await getRow('SELECT id, username, password_hash FROM admins WHERE username = ?', [username.trim()]);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    // Generate secure admin token
    const token = 'kh_admin_' + crypto.randomBytes(24).toString('hex');
    activeAdminTokens.add(token);

    res.json({
      success: true,
      message: 'Admin authenticated successfully.',
      data: {
        id: admin.id,
        username: admin.username,
        userType: 'admin',
        token
      }
    });
  } catch (error) {
    console.error('Error in adminLogin:', error.message);
    res.status(500).json({ success: false, message: 'Server error during admin authentication.' });
  }
};

// Admin auth middleware helper
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['x-admin-token'];
  let token = authHeader;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token || !activeAdminTokens.has(token)) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: Valid Admin access token required.'
    });
  }
  next();
};

// Logout
const logout = async (req, res) => {
  const authHeader = req.headers['authorization'] || req.headers['x-admin-token'];
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    activeAdminTokens.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
};

module.exports = {
  checkFarmerPhone,
  checkBuyerPhone,
  verifyOtp,
  farmerLogin,
  buyerLogin,
  buyerOtpLogin,
  buyerCreatePassword,
  buyerResetPassword,
  adminLogin,
  verifyAdminToken,
  logout
};
