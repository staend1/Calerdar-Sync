/**
 * 캘린더 ID에 해당하는 Salesmap 파이프라인 스테이지 ID 반환
 * @param {string} calendarId - 구글 캘린더 ID
 * @returns {string|null} 매핑된 Salesmap 파이프라인 스테이지 ID
 */
function getStageIdForCalendar(calendarId) {
  // 환경 변수에서 매핑 정보 로드
  const mappings = {
    [process.env.CALENDAR_MAPPING_A?.split('=')[0]]: process.env.CALENDAR_MAPPING_A?.split('=')[1],
    [process.env.CALENDAR_MAPPING_B?.split('=')[0]]: process.env.CALENDAR_MAPPING_B?.split('=')[1],
    [process.env.CALENDAR_MAPPING_C?.split('=')[0]]: process.env.CALENDAR_MAPPING_C?.split('=')[1],
  };
  
  // .env 파일에 정의된 모든 CALENDAR_MAPPING_* 환경 변수 처리
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('CALENDAR_MAPPING_')) {
      const [calId, stageId] = process.env[key].split('=');
      if (calId && stageId) {
        mappings[calId] = stageId;
      }
    }
  });
  
  return mappings[calendarId] || null;
}

/**
 * 캘린더 이벤트 설명에서 Salesmap 딜 ID 추출
 * @param {Object} event - 구글 캘린더 이벤트 객체
 * @returns {string|null} Salesmap 딜 ID 또는 찾지 못한 경우 null
 */
function extractDealIdFromEvent(event) {
  if (!event.description) {
    return null;
  }
  
  // 정규식으로 [SALESMAP:딜ID] 형식 찾기
  const dealIdMatch = event.description.match(/\[SALESMAP:([^\]]+)\]/);
  
  if (dealIdMatch && dealIdMatch[1]) {
    return dealIdMatch[1].trim();
  }
  
  return null;
}

/**
 * 환경 변수에서 모든 매핑 정보 반환
 * @returns {Object} 캘린더 ID와 스테이지 ID 매핑 테이블
 */
function getAllCalendarMappings() {
  const mappings = {};
  
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('CALENDAR_MAPPING_')) {
      const [calId, stageId] = process.env[key].split('=');
      if (calId && stageId) {
        mappings[calId] = stageId;
      }
    }
  });
  
  return mappings;
}

module.exports = {
  getStageIdForCalendar,
  extractDealIdFromEvent,
  getAllCalendarMappings
};