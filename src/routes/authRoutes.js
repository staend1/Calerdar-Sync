const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// 구글 인증
router.get('/google', authController.redirectToAuth);
router.get('/google/callback', authController.handleAuthCallback);

// 로그아웃
router.get('/logout', authController.logout);

module.exports = router;