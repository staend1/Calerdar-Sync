document.addEventListener('DOMContentLoaded', () => {
  // 탭 전환 관련 요소
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // 계정 탭 요소
  const googleConnStatus = document.getElementById('googleConnStatus');
  const salesmapConnStatus = document.getElementById('salesmapConnStatus');
  const googleAccountInfo = document.getElementById('googleAccountInfo');
  const googleEmail = document.getElementById('googleEmail');
  const connectGoogleBtn = document.getElementById('connectGoogle');
  const reconnectGoogleBtn = document.getElementById('reconnectGoogle');
  const salesmapApiKeyInput = document.getElementById('salesmapApiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');

  // 매핑 탭 요소
  const calendarSelect = document.getElementById('calendarSelect');
  const pipelineSelect = document.getElementById('pipelineSelect');
  const stageSelect = document.getElementById('stageSelect');
  const newMappingForm = document.getElementById('newMappingForm');
  const mappingsTableBody = document.querySelector('#mappingsTableSettings tbody');
  const noMappingsSettings = document.getElementById('noMappingsSettings');

  // 웹훅 탭 요소
  const webhooksStatusList = document.getElementById('webhooksStatusList');
  const noWebhooks = document.getElementById('noWebhooks');
  const setupAllWebhooksBtn = document.getElementById('setupAllWebhooks');
  const renewAllWebhooksBtn = document.getElementById('renewAllWebhooks');

  // 탭 전환 기능
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 활성 탭 변경
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // 탭 콘텐츠 표시/숨김
      const tabId = button.dataset.tab;
      tabContents.forEach(content => {
        content.style.display = content.id === `${tabId}-tab` ? 'block' : 'none';
      });
    });
  });

  // 사용자 정보 조회
  async function fetchUserInfo() {
    try {
      const response = await fetch('/api/user/info');
      const data = await response.json();

      if (data.success) {
        updateAccountStatus(data.data);
        return data.data;
      } else {
        showNotification(data.message || '사용자 정보를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  }

  // 캘린더 목록 조회
  async function fetchCalendars() {
    try {
      const response = await fetch('/api/user/calendars');
      const data = await response.json();

      if (data.success) {
        populateCalendarSelect(data.data);
        return data.data;
      } else {
        showNotification(data.message || '캘린더 목록을 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  }

  // 파이프라인 목록 조회
  async function fetchPipelines() {
    try {
      const response = await fetch('/api/user/pipelines');
      const data = await response.json();

      if (data.success) {
        populatePipelineSelect(data.data);
        return data.data;
      } else {
        showNotification(data.message || '파이프라인 목록을 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  }

  // 매핑 목록 조회
  async function fetchMappings() {
    try {
      const response = await fetch('/api/user/mappings');
      const data = await response.json();

      if (data.success) {
        renderMappingsTable(data.data);
        return data.data;
      } else {
        showNotification(data.message || '매핑 정보를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error fetching mappings:', error);
      showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  }

  // 계정 연결 상태 업데이트
  function updateAccountStatus(userData) {
    // Google 계정 상태
    if (userData.hasGoogleAuth) {
      updateStatus(googleConnStatus, 'success', '연결됨');
      googleAccountInfo.style.display = 'block';
      googleEmail.textContent = userData.email;
      connectGoogleBtn.style.display = 'none';
      reconnectGoogleBtn.style.display = 'block';
    } else {
      updateStatus(googleConnStatus, 'error', '연결 필요');
      googleAccountInfo.style.display = 'none';
      connectGoogleBtn.style.display = 'block';
      reconnectGoogleBtn.style.display = 'none';
    }

    // Salesmap API 상태
    if (userData.hasSalesmapApi) {
      updateStatus(salesmapConnStatus, 'success', '연결됨');
    } else {
      updateStatus(salesmapConnStatus, 'error', 'API 키 필요');
    }
  }

  // 캘린더 선택 옵션 채우기
  function populateCalendarSelect(calendars) {
    calendarSelect.innerHTML = '<option value="">캘린더를 선택하세요</option>';

    calendars.forEach(calendar => {
      const option = document.createElement('option');
      option.value = calendar.id;
      option.textContent = calendar.summary;
      if (calendar.primary) {
        option.textContent += ' (기본)';
      }
      calendarSelect.appendChild(option);
    });
  }

  // 파이프라인 선택 옵션 채우기
  function populatePipelineSelect(pipelines) {
    pipelineSelect.innerHTML = '<option value="">파이프라인을 선택하세요</option>';

    pipelines.forEach(pipeline => {
      const option = document.createElement('option');
      option.value = pipeline.id;
      option.textContent = pipeline.name;
      option.dataset.stages = JSON.stringify(pipeline.pipelineStageList);
      pipelineSelect.appendChild(option);
    });
  }

  // 파이프라인 선택 시 스테이지 옵션 업데이트
  pipelineSelect.addEventListener('change', function() {
    stageSelect.innerHTML = '<option value="">단계를 선택하세요</option>';

    if (!this.value) {
      return;
    }

    const selectedOption = this.options[this.selectedIndex];
    const stages = JSON.parse(selectedOption.dataset.stages || '[]');

    stages.forEach(stage => {
      const option = document.createElement('option');
      option.value = stage.id;
      option.textContent = stage.name;
      stageSelect.appendChild(option);
    });
  });

  // 매핑 테이블 렌더링
  function renderMappingsTable(mappings) {
    mappingsTableBody.innerHTML = '';

    if (mappings.length === 0) {
      noMappingsSettings.style.display = 'block';
      return;
    }

    noMappingsSettings.style.display = 'none';

    mappings.forEach(mapping => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${mapping.calendarName}</td>
        <td>${mapping.pipelineName}</td>
        <td>${mapping.stageName}</td>
        <td>
          <div class="toggle-switch">
            <input type="checkbox" id="mapping-${mapping.calendarId}" 
                  ${mapping.active ? 'checked' : ''} 
                  data-calendar-id="${mapping.calendarId}">
            <label for="mapping-${mapping.calendarId}"></label>
          </div>
        </td>
        <td>
          <button class="btn btn-small delete-mapping" data-calendar-id="${mapping.calendarId}">
            삭제
          </button>
        </td>
      `;

      mappingsTableBody.appendChild(row);
    });

    // 삭제 버튼 이벤트 설정
    document.querySelectorAll('.delete-mapping').forEach(btn => {
      btn.addEventListener('click', async function() {
        const calendarId = this.dataset.calendarId;
        await deleteMapping(calendarId);
      });
    });

    // 활성화 토글 이벤트 설정
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', async function() {
        const calendarId = this.dataset.calendarId;
        const active = this.checked;
        await toggleMappingActive(calendarId, active);
      });
    });
  }

  // 매핑 추가
  async function addMapping(formData) {
    try {
      const response = await fetch('/api/user/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showNotification('매핑이 성공적으로 추가되었습니다.', 'success');
        await fetchMappings();
      } else {
        showNotification(data.message || '매핑 추가에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error adding mapping:', error);
      showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  }

  // 매핑 삭제
  async function deleteMapping(calendarId) {
    if (!confirm('정말 이 매핑을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/mappings/${calendarId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showNotification('매핑이 삭제되었습니다.', 'success');
        await fetchMappings();
      } else {
        showNotification(data.message || '매핑 삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error deleting mapping:', error);
      showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  }

  // 매핑 활성화 토글
  async function toggleMappingActive(calendarId, active) {
    // API 엔드포인트 필요
  }

  // API 키 저장
  async function saveApiKey(apiKey) {
    try {
      const response = await fetch('/api/user/salesmap-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('API 키가 성공적으로 저장되었습니다.', 'success');
        await fetchUserInfo();
        await fetchPipelines();
        return true;
      } else {
        showNotification(data.message || 'API 키 저장에 실패했습니다.', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
      return false;
    }
  }

  // 웹훅 설정
  async function setupWebhooks(calendarIds) {
    try {
      const response = await fetch('/api/webhook/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ calendarIds })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('웹훅이 성공적으로 설정되었습니다.', 'success');
        return data.data;
      } else {
        showNotification(data.message || '웹훅 설정에 실패했습니다.', 'error');
        return null;
      }
    } catch (error) {
      console.error('Error setting up webhooks:', error);
      showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
      return null;
    }
  }

  // 상태 업데이트 헬퍼 함수
  function updateStatus(element, status, text) {
    element.dataset.status = status;
    element.querySelector('.status-text').textContent = text;
  }

  // 알림 표시
  function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationMessage = notification.querySelector('.notification-message');

    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }

  // 알림 닫기 버튼
  document.querySelector('.close-notification').addEventListener('click', () => {
    document.getElementById('notification').style.display = 'none';
  });

  // 구글 연결 버튼
  connectGoogleBtn.addEventListener('click', () => {
    window.location.href = '/api/auth/google';
  });

  // 구글 재연결 버튼
  reconnectGoogleBtn.addEventListener('click', () => {
    window.location.href = '/api/auth/google';
  });

  // API 키 저장 버튼
  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = salesmapApiKeyInput.value.trim();
    
    if (!apiKey) {
      showNotification('API 키를 입력해주세요.', 'error');
      return;
    }
    
    const success = await saveApiKey(apiKey);
    if (success) {
      salesmapApiKeyInput.value = '';
    }
  });

  // 매핑 추가 폼
  newMappingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const calendarId = calendarSelect.value;
    const pipelineId = pipelineSelect.value;
    const stageId = stageSelect.value;
    
    if (!calendarId || !pipelineId || !stageId) {
      showNotification('모든 필드를 선택해주세요.', 'error');
      return;
    }
    
    await addMapping({ calendarId, pipelineId, stageId });
    
    // 폼 초기화
    calendarSelect.value = '';
    pipelineSelect.value = '';
    stageSelect.innerHTML = '<option value="">파이프라인을 먼저 선택하세요</option>';
  });

  // 모든 웹훅 설정 버튼
  setupAllWebhooksBtn.addEventListener('click', async () => {
    const mappings = await fetchMappings();
    
    if (!mappings || mappings.length === 0) {
      showNotification('설정된 매핑이 없습니다. 먼저 매핑을 추가해주세요.', 'error');
      return;
    }
    
    const calendarIds = mappings.map(mapping => mapping.calendarId);
    await setupWebhooks(calendarIds);
  });

  // 초기화
  async function initialize() {
    await fetchUserInfo();
    
    const userData = await fetchUserInfo();
    
    if (userData && userData.hasGoogleAuth) {
      await fetchCalendars();
    }
    
    if (userData && userData.hasSalesmapApi) {
      await fetchPipelines();
    }
    
    await fetchMappings();
  }
  
  initialize();
});