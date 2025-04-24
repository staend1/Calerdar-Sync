const express = require('express');
const webhookController = require('../controllers/webhookController');
const router = express.Router();

// 캘린더 웹훅 엔드포인트
router.post('/calendar', webhookController.handleCalendarNotification);

module.exports = router;