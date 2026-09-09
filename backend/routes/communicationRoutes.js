const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');

// WebRTC STUN/TURN configuration
router.get('/webrtc-config', communicationController.getWebRtcConfig);

// Conversations management
router.post('/conversations/get-or-create', communicationController.getOrCreateConversation);
router.get('/conversations', communicationController.getConversations);

// Messages in conversation
router.get('/conversations/:id/messages', communicationController.getMessages);
router.post('/conversations/:id/messages', communicationController.sendMessage);
router.post('/conversations/:id/read', communicationController.markRead);

// Call logs
router.get('/calls/history', communicationController.getCallHistory);

module.exports = router;
