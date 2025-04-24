const User = require('../models/User');
const Mapping = require('../models/Mapping');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { listCalendars } = require('../services/googleCalendar');
const { listPipelines, getPipelineStages } = require('../services/salesmap');

/**
 * 사용자 정보 조회
 */
async function getUserInfo(req, res) {
  try {
    // 세션에서 사용자 ID 가져오기
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    
    // 민감한 정보 제외
    const userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      hasGoogleAuth: Boolean(user.googleTokens.access_token),
      hasSalesmapApi: Boolean(user.salesmapApiKey),
      mappingCount: user.mappings.length,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    return res.json({ success: true, data: userInfo });
  } catch (error) {
    logger.error('Failed to get user info', { error: error.message });
    return res.status(500).json({ success: false, message: '사용자 정보 조회 중 오류가 발생했습니다.' });
  }
}

/**
 * Salesmap API 키 업데이트
 */
async function updateSalesmapApiKey(req, res) {
  try {
    const { apiKey } = req.body;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'API 키가 필요합니다.' });
    }
    
    // 사용자 정보 조회
    let user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    
    // API 키 유효성 검사 (파이프라인 목록 조회)
    try {
      await listPipelines(apiKey);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Salesmap API 키가 유효하지 않습니다.' 
      });
    }
    
    // API 키 업데이트
    user.salesmapApiKey = apiKey;
    await user.save();
    
    return res.json({ 
      success: true, 
      message: 'Salesmap API 키가 업데이트되었습니다.'
    });
  } catch (error) {
    logger.error('Failed to update Salesmap API key', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      message: 'Salesmap API 키 업데이트 중 오류가 발생했습니다.' 
    });
  }
}

/**
 * 매핑 목록 조회
 */
async function getMappings(req, res) {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    
    return res.json({ success: true, data: user.mappings });
  } catch (error) {
    logger.error('Failed to get mappings', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      message: '매핑 목록 조회 중 오류가 발생했습니다.' 
    });
  }
}

/**
 * 매핑 추가 또는 업데이트
 */
async function addOrUpdateMapping(req, res) {
  try {
    const { calendarId, pipelineId, stageId } = req.body;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    if (!calendarId || !pipelineId || !stageId) {
      return res.status(400).json({ 
        success: false, 
        message: '캘린더 ID, 파이프라인 ID, 스테이지 ID가 필요합니다.' 
      });
    }
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    
    if (!user.googleTokens.access_token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Google 계정 인증이 필요합니다.' 
      });
    }
    
    if (!user.salesmapApiKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Salesmap API 키가 필요합니다.' 
      });
    }
    
    // 캘린더와 파이프라인 정보 가져오기
    const [calendars, pipelines] = await Promise.all([
      listCalendars(user.googleTokens), 
      listPipelines(user.salesmapApiKey)
    ]);
    
    // 캘린더 정보 찾기
    const calendar = calendars.find(cal => cal.id === calendarId);
    if (!calendar) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 캘린더를 찾을 수 없습니다.' 
      });
    }
    
    // 파이프라인 정보 찾기
    const pipeline = pipelines.find(pipe => pipe.id === pipelineId);
    if (!pipeline) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 파이프라인을 찾을 수 없습니다.' 
      });
    }
    
    // 스테이지 정보 찾기
    const stage = pipeline.pipelineStageList.find(stage => stage.id === stageId);
    if (!stage) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 스테이지를 찾을 수 없습니다.' 
      });
    }
    
    // 매핑 생성 또는 업데이트
    const mapping = new Mapping({
      userId: user.id,
      calendarId: calendar.id,
      calendarName: calendar.summary,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      stageId: stage.id,
      stageName: stage.name,
      active: true
    });
    
    // 사용자 데이터에 매핑 저장
    await user.addOrUpdateMapping(mapping.toObject());
    
    return res.json({ 
      success: true, 
      message: '매핑이 저장되었습니다.',
      data: mapping.toObject()
    });
  } catch (error) {
    logger.error('Failed to add or update mapping', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      message: '매핑 저장 중 오류가 발생했습니다.' 
    });
  }
}

/**
 * 매핑 삭제
 */
async function deleteMapping(req, res) {
  try {
    const { calendarId } = req.params;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    if (!calendarId) {
      return res.status(400).json({ 
        success: false, 
        message: '캘린더 ID가 필요합니다.' 
      });
    }
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    
    // 매핑이 있는지 확인
    const mappingExists = user.mappings.some(m => m.calendarId === calendarId);
    
    if (!mappingExists) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 매핑을 찾을 수 없습니다.' 
      });
    }
    
    // 매핑 삭제
    await user.deleteMapping(calendarId);
    
    return res.json({ 
      success: true, 
      message: '매핑이 삭제되었습니다.' 
    });
  } catch (error) {
    logger.error('Failed to delete mapping', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      message: '매핑 삭제 중 오류가 발생했습니다.' 
    });
  }
}

/**
 * 사용자 구글 캘린더 목록 조회
 */
async function getUserCalendars(req, res) {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    
    if (!user.googleTokens.access_token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Google 계정 인증이 필요합니다.' 
      });
    }
    
    // 캘린더 목록 조회
    const calendars = await listCalendars(user.googleTokens);
    
    // 필요한 정보만 추출
    const calendarList = calendars.map(calendar => ({
      id: calendar.id,
      summary: calendar.summary,
      description: calendar.description,
      primary: calendar.primary === true,
      backgroundColor: calendar.backgroundColor
    }));
    
    return res.json({ success: true, data: calendarList });
  } catch (error) {
    logger.error('Failed to get user calendars', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      message: '캘린더 목록 조회 중 오류가 발생했습니다.' 
    });
  }
}

/**
 * 파이프라인 목록 조회
 */
async function getPipelines(req, res) {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    
    if (!user.salesmapApiKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Salesmap API 키가 필요합니다.' 
      });
    }
    
    // 파이프라인 목록 조회
    const pipelines = await listPipelines(user.salesmapApiKey);
    
    return res.json({ success: true, data: pipelines });
  } catch (error) {
    logger.error('Failed to get pipelines', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      message: '파이프라인 목록 조회 중 오류가 발생했습니다.' 
    });
  }
}

module.exports = {
  getUserInfo,
  updateSalesmapApiKey,
  getMappings,
  addOrUpdateMapping,
  deleteMapping,
  getUserCalendars,
  getPipelines
};