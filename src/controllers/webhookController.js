const { getEvent } = require('../services/googleCalendar');
const { updateDealStage } = require('../services/salesmap');
const User = require('../models/User');
const logger = require('../utils/logger');
const { extractDealIdFromEvent } = require('../utils/helpers');

/**
 * 구글 캘린더 알림을 처리하는 함수
 */
async function handleCalendarNotification(req, res) {
  try {
    // 구글 캘린더 웹훅은 헤더에 채널 ID와 리소스 ID를 포함
    const channelId = req.headers['x-goog-channel-id'];
    const resourceId = req.headers['x-goog-resource-id'];
    const resourceState = req.headers['x-goog-resource-state'];
    
    logger.info('Calendar notification received', { 
      channelId, 
      resourceId, 
      resourceState 
    });
    
    // 즉시 응답 (Google은 빠른 응답을 요구)
    res.status(200).send('OK');
    
    // 'sync'는 초기 동기화 메시지, 'exists'는 변경사항 발생
    if (resourceState === 'sync') {
      logger.info('Sync message received, webhook setup successful');
      return;
    }

    if (resourceState !== 'exists') {
      logger.info(`Ignoring notification with resource state: ${resourceState}`);
      return;
    }
    
    // channelId에서 사용자 ID 추출 
    // 예시: 'calendar-webhook-userId-timestamp'
    const userId = extractUserIdFromChannelId(channelId);
    
    if (!userId) {
      logger.warn('Could not extract user ID from channel ID', { channelId });
      return;
    }
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      logger.warn('User not found', { userId });
      return;
    }
    
    // 변경된 이벤트 정보 가져오기
    // resourceId에서 이벤트 ID 추출 로직 필요
    const eventId = extractEventIdFromResourceId(resourceId);
    const event = await getEvent(eventId, user.googleTokens);
    
    if (!event) {
      logger.warn('Event not found or access denied', { eventId, userId });
      return;
    }
    
    // 이벤트 설명에서 Salesmap 딜 ID 추출
    const dealId = extractDealIdFromEvent(event);
    
    if (!dealId) {
      logger.info('No deal ID found in event, skipping', { 
        eventId: event.id,
        summary: event.summary
      });
      return;
    }
    
    // 현재 이벤트가 속한 캘린더 ID 확인
    const calendarId = event.organizer?.email || event.calendar_id;
    
    // 사용자의 매핑에서 캘린더 ID에 해당하는 정보 찾기
    const mapping = user.mappings.find(m => 
      m.calendarId === calendarId && m.active === true
    );
    
    if (!mapping) {
      logger.warn('No active mapping found for calendar', { 
        calendarId, userId 
      });
      return;
    }
    
    // Salesmap API를 통해 딜 상태 업데이트
    await updateDealStage(user.salesmapApiKey, dealId, mapping.stageId);
    logger.info('Successfully updated deal stage', { 
      dealId, 
      stageId: mapping.stageId, 
      calendarId,
      userId
    });
    
  } catch (error) {
    logger.error('Error processing calendar notification', { 
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * 채널 ID에서 사용자 ID를 추출하는 함수
 * 예시: 'calendar-webhook-userId-timestamp'
 */
function extractUserIdFromChannelId(channelId) {
  try {
    const parts = channelId.split('-');
    // 예상 형식: ['calendar', 'webhook', 'userId', timestamp]
    if (parts.length >= 3) {
      return parts[2];
    }
    return null;
  } catch (error) {
    logger.error('Failed to extract user ID from channel ID', { 
      error: error.message, 
      channelId 
    });
    return null;
  }
}

/**
 * 리소스 ID에서 이벤트 ID를 추출하는 헬퍼 함수
 */
function extractEventIdFromResourceId(resourceId) {
  try {
    // 리소스 ID 형식에 따라 구현 필요
    // 일반적으로 Google API는 특정 형식을 가짐
    const parts = resourceId.split('_');
    return parts[parts.length - 1]; // 예시 구현, 실제 형식에 맞게 수정 필요
  } catch (error) {
    logger.error('Failed to extract event ID from resource ID', { 
      error: error.message, 
      resourceId 
    });
    return null;
  }
}

/**
 * 사용자별 웹훅 설정 함수
 */
async function setupUserWebhooks(req, res) {
  try {
    const userId = req.user.id;
    const { calendarIds } = req.body;
    
    if (!Array.isArray(calendarIds) || calendarIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '적어도 하나 이상의 캘린더 ID가 필요합니다.' 
      });
    }
    
    const user = req.user;
    const results = [];
    
    // 각 캘린더에 대해 웹훅 설정
    for (const calendarId of calendarIds) {
      try {
        const webhookData = await setupWebhookForUser(
          userId, 
          user.googleTokens, 
          calendarId
        );
        
        results.push({
          calendarId,
          channelId: webhookData.id,
          resourceId: webhookData.resourceId,
          expiration: new Date(parseInt(webhookData.expiration)).toISOString(),
          success: true
        });
      } catch (error) {
        logger.error('Failed to set up webhook for calendar', { 
          error: error.message, 
          calendarId, 
          userId 
        });
        
        results.push({
          calendarId,
          success: false,
          error: error.message
        });
      }
    }
    
    return res.json({ 
      success: true, 
      message: '웹훅 설정이 완료되었습니다.',
      data: results
    });
  } catch (error) {
    logger.error('Error in setting up user webhooks', { 
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      success: false, 
      message: '웹훅 설정 중 오류가 발생했습니다.' 
    });
  }
}

module.exports = {
  handleCalendarNotification,
  setupUserWebhooks
};