const fs = require('fs');
const dotenv = require('dotenv');

// .env 파일이 존재하면 로드, 없으면 로드하지 않음 (클라우드 타입 환경변수 우선)
if (fs.existsSync('.env')) {
  dotenv.config();
}

// 환경 변수 로그 출력 (디버깅용)
console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
console.log('WEBHOOK_URL:', process.env.WEBHOOK_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
const express = require('express');
const session = require('express-session');
const path = require('path');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'salesmap-calendar-sync-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    // HTTPS 환경에서만 secure 활성화
    secure: process.env.NODE_ENV === 'production' && process.env.ENABLE_SECURE_COOKIE === 'true', 
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/webhook', webhookRoutes);

// 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 기본 라우트
app.get('/', (req, res) => {
  // 로그인한 경우 대시보드로 리다이렉트
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  
  res.render('index', {
    title: 'Salesmap-Calendar Sync'
  });
});

// 대시보드
app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  
  res.render('dashboard', {
    title: 'Dashboard - Salesmap-Calendar Sync',
    userId: req.session.userId
  });
});

// 설정 페이지
app.get('/settings', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  
  res.render('settings', {
    title: 'Settings - Salesmap-Calendar Sync',
    userId: req.session.userId
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 서버 시작
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Access the app at http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});