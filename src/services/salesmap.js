const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Salesmap API 클라이언트 생성 함수
 * @param {string} apiKey - Salesmap API 키
 * @returns {object} 설정된 axios 인스턴스
 */
function createSalesmapClient(apiKey) {
  return axios.create({
    baseURL: process.env.SALESMAP_API_URL || 'https://api.salesmap.kr/v2',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * 딜 상태(파이프라인 스테이지) 업데이트 함수
 * @param {string} apiKey - Salesmap API 키
 * @param {string} dealId - Salesmap의 딜 ID
 * @param {string} stageId - 파이프라인 스테이지 ID
 */
async function updateDealStage(apiKey, dealId, stageId) {
  try {
    const client = createSalesmapClient(apiKey);
    const response = await client.patch(`/deals/${dealId}`, {
      stage_id: stageId
    });
    
    logger.info('Deal stage updated successfully', { 
      dealId, 
      stageId, 
      status: response.status 
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to update deal stage', { 
      error: error.message, 
      dealId, 
      stageId,
      responseData: error.response?.data
    });
    throw error;
  }
}

/**
 * 딜 정보 조회 함수
 * @param {string} apiKey - Salesmap API 키
 * @param {string} dealId - Salesmap의 딜 ID
 */
async function getDeal(apiKey, dealId) {
  try {
    const client = createSalesmapClient(apiKey);
    const response = await client.get(`/deals/${dealId}`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get deal information', { 
      error: error.message, 
      dealId 
    });
    throw error;
  }
}

/**
 * 파이프라인 목록 조회 함수
 * @param {string} apiKey - Salesmap API 키
 */
async function listPipelines(apiKey) {
  try {
    const client = createSalesmapClient(apiKey);
    const response = await client.get('/pipeline');
    
    if (response.data && response.data.success) {
      return response.data.data.pipeLineList;
    }
    
    logger.error('Invalid response format from Salesmap API', {
      responseData: response.data
    });
    throw new Error('Invalid pipeline data format');
  } catch (error) {
    logger.error('Failed to list pipelines', { 
      error: error.message,
      response: error.response?.data
    });
    throw error;
  }
}

/**
 * 특정 파이프라인의 스테이지 목록 조회 함수
 * @param {string} apiKey - Salesmap API 키
 * @param {string} pipelineId - 파이프라인 ID
 */
async function getPipelineStages(apiKey, pipelineId) {
  try {
    const pipelines = await listPipelines(apiKey);
    const pipeline = pipelines.find(p => p.id === pipelineId);
    
    if (!pipeline) {
      throw new Error(`Pipeline with ID ${pipelineId} not found`);
    }
    
    return pipeline.pipelineStageList;
  } catch (error) {
    logger.error('Failed to get pipeline stages', { 
      error: error.message,
      pipelineId
    });
    throw error;
  }
}

module.exports = {
  createSalesmapClient,
  updateDealStage,
  getDeal,
  listPipelines,
  getPipelineStages
};