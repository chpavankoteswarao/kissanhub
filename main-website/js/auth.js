// KISSAN-HUB — auth.js
// Handles Farmer, Buyer, and Registration flows with robust error handling

const AuthState = {
  farmerPhone: '',
  farmerRegData: null,
  buyerPhone: '',
  buyerRegData: null,
  forgotBuyerPhone: ''
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

const isValidPhone = (phone) => {
  const cleaned = normalizeIndianPhone(phone);
  return /^\d{10}$/.test(cleaned);
};

// Global Farmer Login Handler (Callable from inline onsubmit, onclick, and event listeners)
window.handleFarmerLoginSubmit = async (e) => {
  if (e && e.preventDefault) e.preventDefault();
  const phoneInput = getElement('farmerLoginPhone');
  const passInput = getElement('farmerLoginPassword');
  const rawPhone = phoneInput ? phoneInput.value.trim() : '';
  const cleanPhone = normalizeIndianPhone(rawPhone);
  const password = passInput ? passInput.value.trim() : '123456';

  const crossRoleBanner = getElement('farmerCrossRoleBanner');
  if (crossRoleBanner) crossRoleBanner.classList.add('hidden');

  if (!isValidPhone(cleanPhone)) {
    showMessage(t('err_phone_10') || 'Please enter a valid 10-digit Indian phone number.', 'error');
    if (phoneInput) phoneInput.focus();
    return false;
  }

  AuthState.farmerPhone = cleanPhone;
  const submitBtn = getElement('btnFarmerLoginSubmit');
  const originalText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in... 🌾';
  }

  try {
    const res = await apiRequest('/auth/farmer/login', {
      method: 'POST',
      body: JSON.stringify({ phone: cleanPhone, password: password || '123456', otp: password || '123456' })
    });

    if (res.ok && res.data) {
      const sessionData = {
        ...res.data,
        userType: 'farmer'
      };
      saveSession(sessionData);
      closeModal('farmerLoginModal');
      showView('farmerDashboardView');
      if (window.initFarmerDashboard) {
        window.initFarmerDashboard();
      }
      showMessage(`${t('welcome')}, ${sessionData.name || sessionData.full_name || 'Farmer'}!`, 'success');
    } else {
      showMessage(res.message || 'Login failed. Universal password is 123456.', 'error');
    }
  } catch (err) {
    console.error('Farmer login error:', err);
    showMessage('Network error while logging in. Please try again.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText || 'Login to Farmer Dashboard';
    }
  }
  return false;
};

// ==================== FARMER AUTH ====================
const initFarmerAuth = () => {
  const formFarmerLogin = getElement('farmerLoginForm');
  const formRegister = getElement('farmerRegisterForm');

  setupLocationDropdowns('farmerRegState', 'farmerRegDistrict', 'farmerRegMandal');

  // GPS detection button for Farmer registration
  const btnGpsFarmer = getElement('btnFarmerRegGps');
  if (btnGpsFarmer) {
    btnGpsFarmer.onclick = () => triggerLocationDetection(btnGpsFarmer, 'farmerRegState', 'farmerRegDistrict');
  }

  // Demo Farmer auto-fill button
  const btnDemoFarmer = getElement('btnDemoFarmerFill');
  if (btnDemoFarmer) {
    btnDemoFarmer.onclick = () => {
      const phoneInput = getElement('farmerLoginPhone');
      const passInput = getElement('farmerLoginPassword');
      if (phoneInput) phoneInput.value = '9123456780';
      if (passInput) passInput.value = '123456';
    };
  }

  // Direct Register button from login modal
  const btnDirectReg = getElement('btnFarmerDirectReg');
  if (btnDirectReg) {
    btnDirectReg.onclick = () => {
      closeModal('farmerLoginModal');
      openModal('farmerRegModal');
    };
  }

  // Direct Farmer Login Form Submit listener
  if (formFarmerLogin) {
    formFarmerLogin.onsubmit = window.handleFarmerLoginSubmit;
  }

  // Switch to Buyer Login from Farmer modal
  const btnSwitchBuyer = getElement('btnSwitchToBuyerLogin');
  if (btnSwitchBuyer) {
    btnSwitchBuyer.onclick = () => {
      closeModal('farmerLoginModal');
      openModal('buyerLoginModal');
      const bPhone = getElement('buyerLoginPhone');
      if (bPhone && AuthState.farmerPhone) bPhone.value = AuthState.farmerPhone;
    };
  }

  // 3. Farmer Registration Form Submit
  if (formRegister) {
    formRegister.onsubmit = async (e) => {
      e.preventDefault();
      const fullName = getElement('farmerRegName').value.trim();
      const state = getElement('farmerRegState').value;
      const district = getElement('farmerRegDistrict').value;
      const mandal = getElement('farmerRegMandal').value;
      const phone = getElement('farmerRegPhone').value.trim();
      const gender = getElement('farmerRegGender').value;
      const aadhaar = getElement('farmerRegAadhaar').value.trim();

      if (!fullName || !state || !district || !mandal || !phone) {
        showMessage('Please complete all required fields.', 'error');
        return;
      }

      if (!isValidPhone(phone)) {
        showMessage(t('err_phone_10'), 'error');
        return;
      }

      AuthState.farmerRegData = {
        full_name: fullName,
        state,
        district,
        mandal,
        phone,
        gender,
        aadhaar,
        latitude: AppState.userLocation.latitude,
        longitude: AppState.userLocation.longitude
      };

      getElement('farmerRegFormContainer').classList.add('hidden');
      getElement('farmerRegOtpContainer').classList.remove('hidden');
      getElement('farmerRegOtpPhoneDisplay').textContent = phone;
      const otpInput = getElement('farmerRegOtp');
      if (otpInput) otpInput.value = '123456';
    };
  }

  // 4. Registration OTP
  const regOtpForm = getElement('farmerRegOtpForm');
  if (regOtpForm) {
    regOtpForm.onsubmit = async (e) => {
      e.preventDefault();
      const otp = getElement('farmerRegOtp').value.trim();
      if (otp !== '123456') {
        showMessage(t('err_otp_invalid'), 'error');
        return;
      }

      const res = await apiRequest('/farmers/register', {
        method: 'POST',
        body: JSON.stringify(AuthState.farmerRegData)
      });

      if (res.ok && res.data) {
        saveSession(res.data);
        closeModal('farmerRegModal');
        showMessage('Farmer account registered successfully!', 'success');
        showView('farmerDashboardView');
        if (window.initFarmerDashboard) window.initFarmerDashboard();
      } else {
        showMessage(res.message || 'Registration failed.', 'error');
      }
    };
  }
};

// ==================== BUYER AUTH (IMPROVED & FIXED) ====================
const initBuyerAuth = () => {
  const formBuyerLogin = getElement('buyerLoginForm');
  const formBuyerOtpLogin = getElement('buyerOtpLoginForm');
  const formRegister = getElement('buyerRegisterForm');
  const formRegOtp = getElement('buyerRegOtpForm');
  const formCreatePwd = getElement('buyerCreatePasswordForm');
  const formForgotPhone = getElement('buyerForgotPhoneForm');
  const formForgotReset = getElement('buyerForgotResetForm');

  const btnBuyerTabPwd = getElement('btnBuyerTabPwd');
  const btnBuyerTabOtp = getElement('btnBuyerTabOtp');
  const buyerCrossRoleBanner = getElement('buyerCrossRoleBanner');
  const buyerCrossRoleMsg = getElement('buyerCrossRoleMsg');
  const btnSwitchFarmer = getElement('btnSwitchToFarmerLogin');

  setupLocationDropdowns('buyerRegState', 'buyerRegDistrict', 'buyerRegMandal');

  // GPS detection button for Buyer registration
  const btnGpsBuyer = getElement('btnBuyerRegGps');
  if (btnGpsBuyer) {
    btnGpsBuyer.onclick = () => triggerLocationDetection(btnGpsBuyer, 'buyerRegState', 'buyerRegDistrict');
  }

  // Demo Buyer Credentials Auto-Fill Button
  const btnDemoBuyerFill = getElement('btnDemoBuyerFill');
  if (btnDemoBuyerFill) {
    btnDemoBuyerFill.onclick = (e) => {
      e.preventDefault();
      const phoneInput = getElement('buyerLoginPhone');
      const passInput = getElement('buyerLoginPassword');
      if (phoneInput) phoneInput.value = '9876543210';
      if (passInput) passInput.value = 'Buyer@123';
      showMessage('Filled Demo Buyer credentials (9876543210 / Buyer@123)', 'info');
    };
  }

  // Switch to Farmer Login from Buyer modal
  if (btnSwitchFarmer) {
    btnSwitchFarmer.onclick = () => {
      closeModal('buyerLoginModal');
      openModal('farmerLoginModal');
      const fPhone = getElement('farmerLoginPhone');
      if (fPhone && AuthState.buyerPhone) fPhone.value = AuthState.buyerPhone;
    };
  }

  // Tab Switching: Password Login vs OTP Login
  if (btnBuyerTabPwd && btnBuyerTabOtp) {
    btnBuyerTabPwd.onclick = () => {
      btnBuyerTabPwd.style.background = '#ffffff';
      btnBuyerTabPwd.style.color = 'var(--primary)';
      btnBuyerTabOtp.style.background = 'transparent';
      btnBuyerTabOtp.style.color = 'var(--text-muted)';
      if (formBuyerLogin) formBuyerLogin.classList.remove('hidden');
      if (formBuyerOtpLogin) formBuyerOtpLogin.classList.add('hidden');
    };

    btnBuyerTabOtp.onclick = () => {
      btnBuyerTabOtp.style.background = '#ffffff';
      btnBuyerTabOtp.style.color = 'var(--primary)';
      btnBuyerTabPwd.style.background = 'transparent';
      btnBuyerTabPwd.style.color = 'var(--text-muted)';
      if (formBuyerLogin) formBuyerLogin.classList.add('hidden');
      if (formBuyerOtpLogin) formBuyerOtpLogin.classList.remove('hidden');
      const p = getElement('buyerLoginPhone');
      const op = getElement('buyerOtpLoginPhone');
      if (p && op && p.value) op.value = p.value;
    };
  }

  // 1A. Unified Direct Buyer Login (Phone + Password)
  if (formBuyerLogin) {
    formBuyerLogin.onsubmit = async (e) => {
      e.preventDefault();
      const phoneInput = getElement('buyerLoginPhone');
      const passInput = getElement('buyerLoginPassword');
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const password = passInput ? passInput.value : '';

      if (buyerCrossRoleBanner) buyerCrossRoleBanner.classList.add('hidden');

      if (!isValidPhone(phone)) {
        showMessage(t('err_phone_10'), 'error');
        return;
      }

      if (!password) {
        showMessage('Please enter your password.', 'error');
        return;
      }

      AuthState.buyerPhone = phone;
      const res = await apiRequest('/auth/buyer/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password })
      });

      if (res.ok && res.data) {
        saveSession(res.data);
        closeModal('buyerLoginModal');
        showMessage(`${t('welcome')}, ${res.data.name || res.data.market_name}!`, 'success');
        showView('buyerDashboardView');
        if (window.initBuyerDashboard) window.initBuyerDashboard();
      } else {
        if (res.data && res.data.isFarmer && buyerCrossRoleBanner && buyerCrossRoleMsg) {
          buyerCrossRoleMsg.textContent = res.message || 'This phone number is registered as a Farmer.';
          buyerCrossRoleBanner.classList.remove('hidden');
        } else if (res.data && res.data.notRegistered) {
          showMessage(res.message || 'Buyer not registered. Redirecting to registration...', 'error');
          setTimeout(() => {
            closeModal('buyerLoginModal');
            openModal('buyerRegModal');
            const regP = getElement('buyerRegPhone');
            if (regP) regP.value = phone;
          }, 1200);
        } else {
          showMessage(res.message || t('err_login_failed'), 'error');
        }
      }
    };
  }

  // 1B. Buyer Login with OTP (123456)
  if (formBuyerOtpLogin) {
    formBuyerOtpLogin.onsubmit = async (e) => {
      e.preventDefault();
      const phoneInput = getElement('buyerOtpLoginPhone');
      const otpInput = getElement('buyerOtpLoginOtp');
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const otp = otpInput ? otpInput.value.trim() : '';

      if (buyerCrossRoleBanner) buyerCrossRoleBanner.classList.add('hidden');

      if (!isValidPhone(phone)) {
        showMessage(t('err_phone_10'), 'error');
        return;
      }

      if (!otp || otp !== '123456') {
        showMessage(t('err_otp_invalid'), 'error');
        return;
      }

      AuthState.buyerPhone = phone;
      const res = await apiRequest('/auth/buyer/otp-login', {
        method: 'POST',
        body: JSON.stringify({ phone, otp })
      });

      if (res.ok && res.data) {
        saveSession(res.data);
        closeModal('buyerLoginModal');
        showMessage(`${t('welcome')}, ${res.data.name || res.data.market_name}!`, 'success');
        showView('buyerDashboardView');
        if (window.initBuyerDashboard) window.initBuyerDashboard();
      } else {
        if (res.data && res.data.isFarmer && buyerCrossRoleBanner && buyerCrossRoleMsg) {
          buyerCrossRoleMsg.textContent = res.message || 'This phone number is registered as a Farmer.';
          buyerCrossRoleBanner.classList.remove('hidden');
        } else if (res.data && res.data.notRegistered) {
          showMessage(res.message || 'Buyer not registered. Redirecting to registration...', 'error');
          setTimeout(() => {
            closeModal('buyerLoginModal');
            openModal('buyerRegModal');
            const regP = getElement('buyerRegPhone');
            if (regP) regP.value = phone;
          }, 1200);
        } else {
          showMessage(res.message || 'OTP Login failed.', 'error');
        }
      }
    };
  }

  // 2. Buyer Registration Step 1
  if (formRegister) {
    formRegister.onsubmit = async (e) => {
      e.preventDefault();
      const marketName = getElement('buyerRegMarketName').value.trim();
      const fullName = getElement('buyerRegFullName').value.trim();
      const state = getElement('buyerRegState').value;
      const district = getElement('buyerRegDistrict').value;
      const mandal = getElement('buyerRegMandal').value;
      const phone = getElement('buyerRegPhone').value.trim();
      const passInput = getElement('buyerRegPassword');
      const confirmInput = getElement('buyerRegConfirmPassword');
      const password = passInput ? passInput.value : '';
      const confirmPassword = confirmInput ? confirmInput.value : '';

      if (!marketName || !fullName || !state || !district || !mandal || !phone) {
        showMessage('Please fill all required fields.', 'error');
        return;
      }

      if (!isValidPhone(phone)) {
        showMessage(t('err_phone_10'), 'error');
        return;
      }

      if (password && password.length < 6) {
        showMessage('Password must be at least 6 characters.', 'error');
        return;
      }

      if (password && confirmPassword && password !== confirmPassword) {
        showMessage('Passwords do not match.', 'error');
        return;
      }

      AuthState.buyerRegData = {
        market_name: marketName,
        full_name: fullName,
        state,
        district,
        mandal,
        phone,
        password: password || 'Buyer@123',
        latitude: AppState.userLocation.latitude,
        longitude: AppState.userLocation.longitude
      };

      getElement('buyerRegStep1').classList.add('hidden');
      getElement('buyerRegStep2Otp').classList.remove('hidden');
      getElement('buyerRegOtpPhoneDisplay').textContent = phone;
      const otpField = getElement('buyerRegOtp');
      if (otpField) {
        otpField.value = '123456';
        otpField.focus();
      }
    };
  }

  // 3. Buyer Registration OTP & Immediate Session Login
  if (formRegOtp) {
    formRegOtp.onsubmit = async (e) => {
      e.preventDefault();
      const otp = getElement('buyerRegOtp').value.trim();
      if (otp !== '123456') {
        showMessage(t('err_otp_invalid'), 'error');
        return;
      }

      const res = await apiRequest('/buyers/register', {
        method: 'POST',
        body: JSON.stringify(AuthState.buyerRegData)
      });

      if (res.ok && res.data) {
        saveSession(res.data);
        closeModal('buyerRegModal');
        showMessage('Buyer account registered and logged in successfully!', 'success');
        showView('buyerDashboardView');
        if (window.initBuyerDashboard) window.initBuyerDashboard();
      } else {
        showMessage(res.message || 'Registration error.', 'error');
      }
    };
  }

  // 4. Fallback Buyer Create Password (if triggered from legacy route)
  if (formCreatePwd) {
    formCreatePwd.onsubmit = async (e) => {
      e.preventDefault();
      const newPassword = getElement('buyerCreatePassword').value;
      const confirmPassword = getElement('buyerCreateConfirmPassword').value;

      if (!newPassword || newPassword.length < 6) {
        showMessage('Password must be at least 6 characters.', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showMessage('Passwords do not match.', 'error');
        return;
      }

      const res = await apiRequest('/auth/buyer/create-password', {
        method: 'POST',
        body: JSON.stringify({
          phone: AuthState.buyerRegData ? AuthState.buyerRegData.phone : AuthState.buyerPhone,
          password: newPassword,
          confirmPassword
        })
      });

      if (res.ok) {
        showMessage('Password saved successfully! Please login.', 'success');
        closeModal('buyerRegModal');
        openModal('buyerLoginModal');
        const pInput = getElement('buyerLoginPhone');
        if (pInput && AuthState.buyerRegData) pInput.value = AuthState.buyerRegData.phone;
      } else {
        showMessage(res.message || 'Error setting password.', 'error');
      }
    };
  }

  // 5. Buyer Forgot Password
  if (formForgotPhone) {
    formForgotPhone.onsubmit = async (e) => {
      e.preventDefault();
      const phone = getElement('buyerForgotPhone').value.trim();
      if (!isValidPhone(phone)) {
        showMessage(t('err_phone_10'), 'error');
        return;
      }

      AuthState.forgotBuyerPhone = phone;
      const res = await apiRequest('/auth/buyer/check-phone', {
        method: 'POST',
        body: JSON.stringify({ phone })
      });

      if (res.ok && res.data.exists) {
        getElement('buyerForgotStepPhone').classList.add('hidden');
        getElement('buyerForgotStepReset').classList.remove('hidden');
        getElement('buyerForgotPhoneDisplay').textContent = phone;
        const oInput = getElement('buyerForgotOtp');
        if (oInput) oInput.value = '123456';
      } else {
        showMessage('Buyer not registered with this number.', 'error');
      }
    };
  }

  if (formForgotReset) {
    formForgotReset.onsubmit = async (e) => {
      e.preventDefault();
      const otp = getElement('buyerForgotOtp').value.trim();
      const newPassword = getElement('buyerForgotNewPassword').value;
      const confirmPassword = getElement('buyerForgotConfirmPassword').value;

      if (otp !== '123456') {
        showMessage(t('err_otp_invalid'), 'error');
        return;
      }

      if (newPassword.length < 6) {
        showMessage('Password must be at least 6 characters.', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showMessage('Passwords do not match.', 'error');
        return;
      }

      const res = await apiRequest('/auth/buyer/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          phone: AuthState.forgotBuyerPhone,
          otp,
          newPassword,
          confirmPassword
        })
      });

      if (res.ok) {
        showMessage('Password reset successfully! Please login.', 'success');
        closeModal('buyerForgotModal');
        openModal('buyerLoginModal');
      } else {
        showMessage(res.message || 'Error resetting password.', 'error');
      }
    };
  }
};

const resetFarmerLoginForm = () => {
  const crossRoleBanner = getElement('farmerCrossRoleBanner');
  if (crossRoleBanner) crossRoleBanner.classList.add('hidden');
  const passInput = getElement('farmerLoginPassword');
  if (passInput) passInput.value = '123456';
};

const resetBuyerRegistrationModal = () => {
  const step1 = getElement('buyerRegStep1');
  const step2 = getElement('buyerRegStep2Otp');
  if (step1) step1.classList.remove('hidden');
  if (step2) step2.classList.add('hidden');
};

document.addEventListener('DOMContentLoaded', () => {
  initFarmerAuth();
  initBuyerAuth();

  // Landing Cards Click Triggers
  const cardFarmer = getElement('cardRoleFarmer');
  if (cardFarmer) {
    cardFarmer.onclick = () => {
      resetFarmerLoginForm();
      openModal('farmerLoginModal');
    };
  }

  const cardBuyer = getElement('cardRoleBuyer');
  if (cardBuyer) {
    cardBuyer.onclick = () => {
      const banner = getElement('buyerCrossRoleBanner');
      if (banner) banner.classList.add('hidden');
      openModal('buyerLoginModal');
    };
  }

  const cardAdmin = getElement('cardRoleAdmin');
  if (cardAdmin) {
    cardAdmin.onclick = () => {
      window.location.href = '/admin';
    };
  }

  // Direct modal trigger links
  const linkFarmerToReg = getElement('linkFarmerToReg');
  if (linkFarmerToReg) {
    linkFarmerToReg.onclick = () => {
      closeModal('farmerLoginModal');
      openModal('farmerRegModal');
    };
  }

  const linkBuyerToReg = getElement('linkBuyerToReg');
  if (linkBuyerToReg) {
    linkBuyerToReg.onclick = () => {
      closeModal('buyerLoginModal');
      resetBuyerRegistrationModal();
      openModal('buyerRegModal');
    };
  }

  const linkForgotPwd = getElement('linkBuyerForgotPassword');
  if (linkForgotPwd) {
    linkForgotPwd.onclick = (e) => {
      e.preventDefault();
      closeModal('buyerLoginModal');
      openModal('buyerForgotModal');
    };
  }
});
