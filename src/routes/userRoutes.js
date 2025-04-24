const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authController.isAuthenticated);

// 사용자 정보 관리
router.get('/info', userController.getUserInfo);
router.post('/salesmap-api-key', userController.updateSalesmapApiKey);

// 매핑 관리
router.get('/mappings', userController.getMappings);
router.post('/mappings', userController.addOrUpdateMapping);
router.delete('/mappings/:calendarId', userController.deleteMapping);

// 캘린더 및 파이프라인 정보
router.get('/calendars', userController.getUserCalendars);
router.get('/pipelines', userController.getPipelines);

module.exports = router;