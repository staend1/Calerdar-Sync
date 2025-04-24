document.addEventListener('DOMContentLoaded', () => {
  // 상태 요소
  const googleStatus = document.querySelector('#googleStatus .status');
  const salesmapStatus = document.querySelector('#salesmapStatus .status');
  const mappingStatus = document.querySelector('#mappingStatus .status');
  
  // 버튼 요소
  const setupGoogleBtn = document.getElementById('setupGoogle');
  const setupSalesmapBtn = document.getElementById('setupSalesmap');
  const manageMappingsBtn = document.getElementById('manageMappings');
  
  // 섹션 요소
  const mappingsSection = document.getElementById('mappingsSection');
  const webhooksSection = document.getElementById('webhooksSection');
  const noMappings = document.getElementById('noMappings');
  
  // 모달 요소
  const apiKeyModal = document.getElementById('apiKeyModal');
  const apiKeyForm = document.getElementById('apiKeyForm');
  const cancelApiKeyBtn = document.getElementById('cancelApiKey');
  
  // 사용자 정보 가져오기
  async function fetchUserInfo() {
    try {
      const response = await fetch('/api/user/info');
      const data = await response.json();
      
      if (data.success) {
        updateStatusUI(data.data);
        return data.data;
      } else {
        showError('사용자 정보를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      showError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    }
  }
  
  // 매핑 목록 가져오기
  async function fetchMappings() {
    try {
      const response = await fetch('/api/user/mappings');
      const data = await response.json();
      
      if (data.success) {
        renderMappingsTable(data.data);
        return data.data;
      } else {
        showError('매핑 정보를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching mappings:', error);
      showError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    }
  }
  
  // UI 상태 업데이트
  function updateStatusUI(userData) {
    // Google 상태
    if (userData.hasGoogleAuth) {
      updateStatus(googleStatus, 'success', '연결됨');
      setupGoogleBtn.style.display = 'none';
    } else {
      updateStatus(googleStatus, 'error', '연결 필요');
      setupGoogleBtn.style.display = 'block';
    }
    
    // Salesmap 상태
    if (userData.hasSalesmapApi) {
      updateStatus(salesmapStatus, 'success', '연결됨');
      setupSalesmapBtn.style.display = 'none';
    } else {
      updateStatus(salesmapStatus, 'error', 'API 키 필요');
      setupSalesmapBtn.style.display = 'block';
    }
    
    // 매핑 상태
    if (userData.mappingCount > 0) {
      updateStatus(mappingStatus, 'success', `${userData.mappingCount}개 설정됨`);
      mappingsSection.style.display = 'block';
      noMappings.style.display = 'none';
    } else {
      updateStatus(mappingStatus, 'warning', '설정 필요');
      manageMappingsBtn.style.display = 'block';
      noMappings.style.display = 'block';
    }
    
    // 웹훅 섹션 표시
    if (userData.hasGoogleAuth && userData.hasSalesmapApi) {
      webhooksSection.style.display = 'block';
    }
  }
  
  // 매핑 테이블 렌더링
  function renderMappingsTable(mappings) {
    const tableBody = document.querySelector('#mappingsTable tbody');
    tableBody.innerHTML = '';
    
    if (mappings.length === 0) {
      mappingsSection.style.display = 'none';
      noMappings.style.display = 'block';
      return;
    }
    
    mappingsSection.style.display = 'block';
    noMappings.style.display = 'none';
    
    mappings.forEach(mapping => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${mapping.calendarName}</td>
        <td>${mapping.pipelineName}</td>
        <td>${mapping.stageName}</td>
        <td>
          <span class="status-pill ${mapping.active ? 'active' : 'inactive'}">
            ${mapping.active ? '활성' : '비활성'}
          </span>
        </td>
        <td>
          <button class="btn btn-small delete-mapping" data-calendar-id="${mapping.calendarId}">
            삭제
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // 삭제 버튼 이벤트 설정
    document.querySelectorAll('.delete-mapping').forEach(btn => {
      btn.addEventListener('click', async function() {
        const calendarId = this.dataset.calendarId;
        await deleteMapping(calendarId);
      });
    });
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
        showNotification('매핑이 삭제되었습니다.');
        await fetchMappings();
        await fetchUserInfo();
      } else {
        showError(data.message || '매핑 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting mapping:', error);
      showError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    }
  }
  
  // 상태 업데이트 헬퍼 함수
  function updateStatus(element, status, text) {
    element.dataset.status = status;
    element.querySelector('.status-text').textContent = text;
  }
  
  // 에러 메시지 표시
  function showError(message) {
    alert(message);
  }
  
  // 알림 메시지 표시
  function showNotification(message) {
    alert(message);
  }
  
  // 모달 관련 이벤트
  setupSalesmapBtn.addEventListener('click', () => {
    apiKeyModal.style.display = 'block';
  });
  
  cancelApiKeyBtn.addEventListener('click', () => {
    apiKeyModal.style.display = 'none';
  });
  
  apiKeyModal.querySelector('.close').addEventListener('click', () => {
    apiKeyModal.style.display = 'none';
  });
  
  window.addEventListener('click', (event) => {
    if (event.target === apiKeyModal) {
      apiKeyModal.style.display = 'none';
    }
  });
  
  // API 키 폼 제출
  apiKeyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const apiKey = document.getElementById('apiKey').value;
    
    if (!apiKey) {
      showError('API 키를 입력해주세요.');
      return;
    }
    
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
        apiKeyModal.style.display = 'none';
        showNotification('API 키가 성공적으로 저장되었습니다.');
        await fetchUserInfo();
      } else {
        showError(data.message || 'API 키 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      showError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    }
  });
  
  // 구글 연결 버튼
  setupGoogleBtn.addEventListener('click', () => {
    window.location.href = '/api/auth/google';
  });
  
  // 매핑 관리 버튼
  manageMappingsBtn.addEventListener('click', () => {
    window.location.href = '/settings';
  });
  
  // 초기화
  async function initialize() {
    await fetchUserInfo();
    await fetchMappings();
  }
  
  initialize();
});