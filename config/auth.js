/**
 * Google OAuth 인증 관련 설정
 */
const { google } = require('googleapis');

// OAuth2 클라이언트 생성
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Google 인증 URL 생성
 */
function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
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
async function getTokens(code) {
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

/**
 * 토큰 설정
 * @param {Object} tokens - OAuth 토큰
 */
function setCredentials(tokens) {
  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
}

module.exports = {
  oAuth2Client,
  getAuthUrl,
  getTokens,
  setCredentials
};