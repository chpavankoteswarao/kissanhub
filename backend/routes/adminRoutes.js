const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdminToken } = require('../controllers/authController');

// All admin routes require admin authorization
router.use(verifyAdminToken);

// Farmers
router.get('/farmers', adminController.getAllFarmers);
router.get('/farmers/:id', adminController.getFarmerDetails);
router.delete('/farmers/:id', adminController.deleteFarmer);

// Buyers
router.get('/buyers', adminController.getAllBuyers);
router.get('/buyers/:id', adminController.getBuyerDetails);
router.delete('/buyers/:id', adminController.deleteBuyer);

// Crops & Requirements
router.get('/crops', adminController.getAllCrops);
router.delete('/crops/:id', adminController.deleteCrop);
router.get('/requirements', adminController.getAllRequirements);
router.delete('/requirements/:id', adminController.deleteRequirement);

// Statistics
router.get('/statistics', adminController.getStatistics);

// Prices CRUD
router.get('/prices', adminController.getPrices);
router.post('/prices', adminController.addPrice);
router.put('/prices/:id', adminController.updatePrice);
router.delete('/prices/:id', adminController.deletePrice);

module.exports = router;
