/**
 * 캘린더-파이프라인 스테이지 매핑 클래스
 */
class Mapping {
  /**
   * 매핑 객체 생성
   * @param {Object} mappingData - 매핑 데이터
   */
  constructor(mappingData = {}) {
    this.userId = mappingData.userId || '';
    this.calendarId = mappingData.calendarId || '';
    this.calendarName = mappingData.calendarName || '';
    this.pipelineId = mappingData.pipelineId || '';
    this.pipelineName = mappingData.pipelineName || '';
    this.stageId = mappingData.stageId || '';
    this.stageName = mappingData.stageName || '';
    this.active = mappingData.active !== undefined ? mappingData.active : true;
    this.createdAt = mappingData.createdAt || new Date().toISOString();
    this.updatedAt = mappingData.updatedAt || new Date().toISOString();
  }

  /**
   * 매핑 객체를 평범한 객체로 변환
   * @returns {Object} 일반 객체
   */
  toObject() {
    return {
      userId: this.userId,
      calendarId: this.calendarId,
      calendarName: this.calendarName,
      pipelineId: this.pipelineId,
      pipelineName: this.pipelineName,
      stageId: this.stageId,
      stageName: this.stageName,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * 매핑이 유효한지 확인
   * @returns {boolean} 유효성 여부
   */
  isValid() {
    return Boolean(
      this.userId &&
      this.calendarId &&
      this.pipelineId &&
      this.stageId
    );
  }
}

module.exports = Mapping;