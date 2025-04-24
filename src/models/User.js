const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// 사용자 데이터를 저장할 디렉토리 경로
const DATA_DIR = path.join(__dirname, '../../data/users');

/**
 * 사용자 모델 클래스
 */
class User {
  /**
   * 사용자 객체 생성
   * @param {Object} userData - 사용자 데이터
   */
  constructor(userData = {}) {
    this.id = userData.id || '';
    this.email = userData.email || '';
    this.name = userData.name || '';
    this.googleTokens = userData.googleTokens || {};
    this.salesmapApiKey = userData.salesmapApiKey || '';
    this.mappings = userData.mappings || [];
    this.createdAt = userData.createdAt || new Date().toISOString();
    this.updatedAt = userData.updatedAt || new Date().toISOString();
  }

  /**
   * 사용자 정보 저장
   */
  async save() {
    try {
      // 디렉토리가 존재하지 않으면 생성
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // 현재 시간으로 updatedAt 설정
      this.updatedAt = new Date().toISOString();
      
      // 파일에 사용자 데이터 저장
      const filePath = path.join(DATA_DIR, `${this.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(this, null, 2));
      
      logger.info('User data saved', { userId: this.id });
      return true;
    } catch (error) {
      logger.error('Failed to save user data', { error: error.message, userId: this.id });
      throw error;
    }
  }

  /**
   * ID로 사용자 조회
   * @param {string} userId - 사용자 ID
   * @returns {User|null} 사용자 객체 또는 null
   */
  static async findById(userId) {
    try {
      const filePath = path.join(DATA_DIR, `${userId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return new User(userData);
    } catch (error) {
      logger.error('Failed to find user by ID', { error: error.message, userId });
      return null;
    }
  }

  /**
   * 이메일로 사용자 조회
   * @param {string} email - 사용자 이메일
   * @returns {User|null} 사용자 객체 또는 null
   */
  static async findByEmail(email) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        return null;
      }
      
      const files = fs.readdirSync(DATA_DIR);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(DATA_DIR, file);
        const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (userData.email === email) {
          return new User(userData);
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to find user by email', { error: error.message, email });
      return null;
    }
  }

  /**
   * 모든 사용자 조회
   * @returns {Array<User>} 사용자 객체 배열
   */
  static async findAll() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        return [];
      }
      
      const files = fs.readdirSync(DATA_DIR);
      const users = [];
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(DATA_DIR, file);
        const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        users.push(new User(userData));
      }
      
      return users;
    } catch (error) {
      logger.error('Failed to find all users', { error: error.message });
      return [];
    }
  }

  /**
   * 매핑 추가 또는 업데이트
   * @param {Object} mapping - 캘린더-파이프라인 스테이지 매핑
   */
  async addOrUpdateMapping(mapping) {
    // 기존 매핑 찾기
    const existingIndex = this.mappings.findIndex(m => m.calendarId === mapping.calendarId);
    
    if (existingIndex >= 0) {
      // 기존 매핑 업데이트
      this.mappings[existingIndex] = {
        ...this.mappings[existingIndex],
        ...mapping,
        updatedAt: new Date().toISOString()
      };
    } else {
      // 새 매핑 추가
      this.mappings.push({
        ...mapping,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // 변경사항 저장
    return this.save();
  }

  /**
   * 매핑 삭제
   * @param {string} calendarId - 구글 캘린더 ID
   */
  async deleteMapping(calendarId) {
    this.mappings = this.mappings.filter(m => m.calendarId !== calendarId);
    return this.save();
  }

  /**
   * 사용자 삭제
   */
  async delete() {
    try {
      const filePath = path.join(DATA_DIR, `${this.id}.json`);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('User deleted', { userId: this.id });
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to delete user', { error: error.message, userId: this.id });
      throw error;
    }
  }
}

module.exports = User;