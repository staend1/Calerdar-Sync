const { google } = require('googleapis');
const logger = require('../utils/logger');

/**
 * OAuth2 클라이언트 생성
 * @returns {google.auth.OAuth2} OAuth2 클라이언트 인스턴스
 */
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * 토큰 설정 및 Calendar API 클라이언트 생성
 * @param {Object} tokens - OAuth 토큰
 * @returns {google.calendar} Calendar API 클라이언트
 */
function createCalendarClient(tokens) {
  const oAuth2Client = createOAuth2Client();
  oAuth2Client.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth: oAuth2Client });
}

/**
 * 사용자별 캘린더 웹훅 설정
 * 최대 7일간 유효한 웹훅을 등록
 * @param {string} userId - 사용자 ID
 * @param {Object} tokens - OAuth 토큰
 * @param {string} calendarId - 감시할 캘린더 ID
 */
async function setupWebhookForUser(userId, tokens, calendarId = 'primary') {
  try {
    const calendar = createCalendarClient(tokens);
    
    // 현재 시간으로부터 7일후 타임스탬프 계산 (밀리초)
    const expirationTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    
    // 채널 ID에 사용자 ID 포함
    const channelId = `calendar-webhook-${userId}-${Date.now()}`;
    
    const response = await calendar.events.watch({
      calendarId: calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: process.env.WEBHOOK_URL,
        expiration: expirationTime.toString()
      }
    });
    
    logger.info('Webhook setup successful for user', {
      userId,
      calendarId,
      channelId: response.data.id,
      resourceId: response.data.resourceId,
      expiration: new Date(parseInt(response.data.expiration))
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to set up webhook for user', { 
      error: error.message,
      userId,
      calendarId,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * 웹훅 중지 함수
 * @param {Object} tokens - OAuth 토큰
 * @param {string} channelId - 채널 ID
 * @param {string} resourceId - 리소스 ID
 */
async function stopWebhook(tokens, channelId, resourceId) {
  try {
    const calendar = createCalendarClient(tokens);
    
    await calendar.channels.stop({
      requestBody: {
        id: channelId,
        resourceId: resourceId
      }
    });
    
    logger.info('Webhook stopped successfully', { channelId, resourceId });
    return true;
  } catch (error) {
    logger.error('Failed to stop webhook', { 
      error: error.message,
      channelId,
      resourceId
    });
    throw error;
  }
}

/**
 * 특정 이벤트 조회 함수
 * @param {string} eventId - 이벤트 ID
 * @param {Object} tokens - OAuth 토큰
 * @param {string} calendarId - 캘린더 ID
 */
async function getEvent(eventId, tokens, calendarId = 'primary') {
  try {
    const calendar = createCalendarClient(tokens);
    
    const response = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to get event', { 
      error: error.message, 
      eventId, 
      calendarId 
    });
    return null;
  }
}

/**
 * 사용자의 캘린더 목록 조회
 * @param {Object} tokens - OAuth 토큰
 */
async function listCalendars(tokens) {
  try {
    const calendar = createCalendarClient(tokens);
    
    const response = await calendar.calendarList.list();
    return response.data.items;
  } catch (error) {
    logger.error('Failed to list calendars', { error: error.message });
    throw error;
  }
}

/**
 * OAuth2 인증 URL 생성
 */
function getAuthUrl() {
  const oAuth2Client = createOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];
  
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // 항상 사용자 동의 화면 표시 (refresh token 획득용)
  });
}

/**
 * 인증 코드로 토큰 교환
 * @param {string} code - 인증 코드
 */
async function getTokensFromCode(code) {
  const oAuth2Client = createOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

/**
 * 토큰으로 사용자 정보 가져오기
 * @param {Object} tokens - OAuth 토큰
 */
async function getUserInfo(tokens) {
  try {
    const oAuth2Client = createOAuth2Client();
    oAuth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({
      auth: oAuth2Client,
      version: 'v2'
    });
    
    const response = await oauth2.userinfo.get();
    return response.data;
  } catch (error) {
    logger.error('Failed to get user info', { error: error.message });
    throw error;
  }
}

module.exports = {
  createOAuth2Client,
  createCalendarClient,
  setupWebhookForUser,
  stopWebhook,
  getEvent,
  listCalendars,
  getAuthUrl,
  getTokensFromCode,
  getUserInfo
};