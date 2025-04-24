# Salesmap-Calendar Sync

자동으로 Google Calendar 이벤트 이동을 감지하여 Salesmap의 딜 상태를 업데이트하는 서비스입니다.

## 목적

구글 캘린더의 일정 폴더 이동 이벤트를 감지하여 Salesmap의 딜 상태를 자동으로 업데이트합니다.

## 작동 방식

1. 사용자가 구글 캘린더에서 일정을 다른 폴더(캘린더)로 이동
2. 서버가 이 이벤트를 감지하여 Salesmap API로 딜 상태 업데이트 요청

## 주요 기능

- 사용자별 계정 연동 및 설정 관리
- 구글 캘린더와 Salesmap 파이프라인 스테이지 간 맞춤형 매핑
- 간편한 웹 인터페이스를 통한 설정 관리
- 실시간 웹훅을 통한 이벤트 감지 및 처리

## 설치 및 설정

1. 필요 패키지 설치
```bash
npm install
```

2. 환경 변수 설정
```bash
cp .env.sample .env
# .env 파일 내용을 실제 값으로 수정
```

3. Google Cloud Console에서 설정
   - OAuth 인증 정보 생성
   - Calendar API 활성화
   - 웹훅 도메인 등록

4. 서비스 실행
```bash
npm start
```

## 웹훅 갱신

웹훅은 최대 7일간 유효하며, 갱신 명령을 실행해야 합니다:

```bash
npm run renew-webhook
```

## 이벤트-딜 연동 방법

캘린더 이벤트 설명(description) 필드에 다음 형식으로 Salesmap 딜 ID를 추가합니다:

```
[SALESMAP:deal_id]
```

## 페이지 설명

1. **대시보드**: 연동 상태 및 현재 매핑 목록 확인
2. **설정 페이지**: 
   - 계정 연결: Google 계정 및 Salesmap API 연동
   - 매핑 설정: 캘린더와 파이프라인 스테이지 간 매핑 추가/수정/삭제
   - 웹훅 관리: 웹훅 설정 및 갱신

## 기술 스택

- **백엔드**: Node.js, Express, 세션 기반 인증
- **프론트엔드**: HTML, CSS, JavaScript, EJS 템플릿
- **API 연동**: Google Calendar API, Salesmap API
- **데이터 저장**: 파일 기반 사용자 데이터 관리
- **로깅**: Winston