/**
 * 웹훅 갱신 스크립트
 * 
 * Google Calendar 웹훅은 최대 7일간 유효하므로,
 * 이 스크립트를 cron job으로 6일마다 실행하여 갱신해야 합니다.
 */
require('dotenv').config();
const { stopWebhook, setupWebhook } = require('../services/googleCalendar');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// 기존 웹훅 정보 저장 파일 경로
const webhookInfoPath = path.join(__dirname, '../../data/webhook-info.json');

async function renewWebhook() {
  let oldChannelId, oldResourceId;
  
  // 기존 웹훅 정보 로드 시도
  try {
    if (fs.existsSync(webhookInfoPath)) {
      const webhookInfo = JSON.parse(fs.readFileSync(webhookInfoPath, 'utf-8'));
      oldChannelId = webhookInfo.channelId;
      oldResourceId = webhookInfo.resourceId;
      logger.info('Loaded existing webhook info', { oldChannelId, oldResourceId });
    }
  } catch (error) {
    logger.warn('Failed to load existing webhook info, proceeding with new setup', {
      error: error.message
    });
  }
  
  // 기존 웹훅이 있으면 중지
  if (oldChannelId && oldResourceId) {
    try {
      await stopWebhook(oldChannelId, oldResourceId);
      logger.info('Successfully stopped old webhook');
    } catch (error) {
      logger.warn('Failed to stop old webhook, proceeding anyway', {
        error: error.message
      });
    }
  }
  
  // 새 웹훅 설정
  try {
    const newWebhook = await setupWebhook();
    
    // 웹훅 정보 저장 디렉토리 확인 및 생성
    const dataDir = path.dirname(webhookInfoPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 웹훅 정보 저장
    fs.writeFileSync(webhookInfoPath, JSON.stringify({
      channelId: newWebhook.id,
      resourceId: newWebhook.resourceId,
      createdAt: new Date().toISOString(),
      expiration: new Date(parseInt(newWebhook.expiration)).toISOString()
    }, null, 2));
    
    logger.info('Successfully renewed webhook', {
      channelId: newWebhook.id,
      expiration: new Date(parseInt(newWebhook.expiration))
    });
    
    return newWebhook;
  } catch (error) {
    logger.error('Failed to renew webhook', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// 스크립트가 직접 실행된 경우에만 실행
if (require.main === module) {
  renewWebhook()
    .then(() => {
      logger.info('Webhook renewal completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Webhook renewal failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = renewWebhook;