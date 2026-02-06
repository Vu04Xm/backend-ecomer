const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Endpoint: POST /api/chat/send
router.post('/send', chatController.handleChat);

module.exports = router;