const User = require('../models/User');
const { 
  getAuthUrl, 
  getTokensFromCode, 
  getUserInfo 
} = require('../services/googleCalendar');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * 구글 인증 페이지로 리다이렉트
 */
function redirectToAuth(req, res) {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
}

/**
 * 구글 OAuth 콜백 처리
 */
async function handleAuthCallback(req, res) {
  const { code } = req.query;
  
  if (!code) {
    logger.error('No authorization code provided');
    return res.status(400).send('인증 코드가 없습니다.');
  }
  
  try {
    // 코드로 토큰 교환
    const tokens = await getTokensFromCode(code);
    
    // 토큰으로 사용자 정보 조회
    const googleUser = await getUserInfo(tokens);
    
    // 이메일로 기존 사용자 조회
    let user = await User.findByEmail(googleUser.email);
    
    if (!user) {
      // 새 사용자 생성
      user = new User({
        id: uuidv4(),
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split('@')[0],
        googleTokens: tokens
      });
      
      logger.info('New user created', { userId: user.id, email: user.email });
    } else {
      // 기존 사용자 토큰 업데이트
      user.googleTokens = tokens;
      user.name = googleUser.name || user.name;
      
      logger.info('Existing user authenticated', { userId: user.id, email: user.email });
    }
    
    // 사용자 정보 저장
    await user.save();
    
    // 세션에 사용자 ID 저장
    req.session.userId = user.id;
    
    logger.info('Authentication successful, user logged in', { userId: user.id });
    res.redirect('/dashboard');
  } catch (error) {
    logger.error('Authentication failed', { error: error.message });
    res.status(500).send('인증에 실패했습니다.');
  }
}

/**
 * 로그아웃 처리
 */
function logout(req, res) {
  req.session.destroy(err => {
    if (err) {
      logger.error('Error destroying session', { error: err.message });
      return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
    }
    
    res.redirect('/');
  });
}

/**
 * 로그인 상태 확인 미들웨어
 */
async function isAuthenticated(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  
  const user = await User.findById(req.session.userId);
  
  if (!user) {
    req.session.destroy();
    return res.redirect('/');
  }
  
  req.user = user;
  next();
}

module.exports = {
  redirectToAuth,
  handleAuthCallback,
  logout,
  isAuthenticated
};