const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');

// Registration and profile
router.post('/register', buyerController.registerBuyer);
router.get('/:phone', buyerController.getBuyerByPhone);
router.put('/:id', buyerController.updateBuyerProfile);

// Crop requirements
router.post('/requirements', buyerController.createRequirement);
router.get('/:id/requirements', buyerController.getBuyerRequirements);
router.put('/requirements/:id', buyerController.updateRequirement);
router.delete('/requirements/:id', buyerController.deleteRequirement);

// Farmer search & purchase / rating
router.get('/search/farmers', buyerController.searchFarmers);
router.post('/purchase-crop', buyerController.purchaseAndRateCrop);
router.get('/ratings/:farmer_id', buyerController.getCropRatings);

module.exports = router;
