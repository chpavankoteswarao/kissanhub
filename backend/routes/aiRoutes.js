const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// AI & Public Mandi endpoints
router.get('/prices', aiController.getPublicMandiPrices);
router.post('/price', aiController.getPriceAdvice);
router.post('/chat', aiController.handleChat);
router.post('/translate', aiController.translateWebsiteWithAi);
router.post('/voice-response', aiController.getVoiceResponse);
router.post('/analyze-crop-quality', aiController.analyzeCropQuality);

module.exports = router;
