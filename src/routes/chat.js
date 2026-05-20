const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Supports:
// POST /api/chat/send
// POST /api/chat/
router.post('/send', chatController.handleChat);
router.post('/', chatController.handleChat);

module.exports = router;