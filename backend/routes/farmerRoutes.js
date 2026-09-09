const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');

// Sell my crop & buyer search (placed before /:phone so it is not intercepted)
router.get('/nearby-buyers', farmerController.getNearbyBuyers);

// Registration and profile
router.post('/register', farmerController.registerFarmer);
router.get('/:phone', farmerController.getFarmerByPhone);
router.put('/:id', farmerController.updateFarmerProfile);

// Crop listings & alerts
router.post('/crops', farmerController.registerCrop);
router.get('/:id/crops', farmerController.getFarmerCrops);
router.get('/:id/alerts', farmerController.getFarmerAlerts);
router.delete('/crops/:id', farmerController.deleteCrop);

module.exports = router;
