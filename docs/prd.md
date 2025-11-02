# Product Requirements Document (PRD)
# 대학교 데이터 시각화 대시보드

**버전:** 1.0
**작성일:** 2025-11-02
**프로젝트명:** University Dashboard - Vibe Dashboard 2
**기술 스택:** Next.js 15, React 19, TypeScript, Supabase, Clerk

---

## 1. 제품 개요

### 1.1 프로젝트 목적

대학교 데이터 시각화 대시보드는 대학교 내부의 실적, 논문 게재 수, 학생 수, 예산 등의 데이터를 직관적으로 파악하고 공유하기 위한 웹 기반 시각화 플랫폼입니다. Ecount에서 추출한 CSV 데이터를 기반으로, 사용자가 각 항목의 성과와 추이를 한눈에 파악할 수 있는 맞춤형 그래프 및 차트를 제공합니다.

### 1.2 비즈니스 가치

- **데이터 기반 의사결정 지원**: 학과별, 연도별 성과 데이터를 시각화하여 경영진의 전략적 의사결정 지원
- **투명성 향상**: 연구비, 예산 집행 내역을 투명하게 공개하여 대학 운영의 투명성 확보
- **성과 관리 효율화**: 학과별 KPI를 실시간으로 모니터링하여 성과 관리 효율성 향상
- **연구 성과 가시화**: 논문 게재, 연구과제 수주 등 연구 성과를 체계적으로 관리 및 분석

### 1.3 타겟 사용자

#### Primary Users
- **대학 경영진**: 전체 대학의 핵심 지표 파악 및 전략적 의사결정
- **학과장/단과대학장**: 소속 학과/단과대학의 성과 모니터링 및 개선 계획 수립
- **연구지원 담당자**: 연구과제 및 예산 집행 현황 관리

#### Secondary Users
- **교수진**: 본인의 연구 성과 및 지도학생 현황 확인
- **대학 행정직원**: 데이터 관리 및 보고서 작성

---

## 2. Stakeholders

### 2.1 주요 이해관계자

| 역할 | 이름/부서 | 책임 범위 | 주요 관심사항 |
|------|-----------|----------|--------------|
| Product Owner | 대학 기획처 | 제품 비전 및 우선순위 결정 | ROI, 사용자 만족도, 데이터 정확성 |
| Development Team | 개발팀 | 제품 개발 및 유지보수 | 기술 스택, 개발 일정, 코드 품질 |
| UI/UX Designer | 디자인팀 | 사용자 경험 설계 | 사용성, 접근성, 시각 디자인 |
| Data Administrator | IT 지원팀 | 데이터 관리 및 보안 | 데이터 무결성, 보안, 백업 |
| End Users | 대학 구성원 | 시스템 사용 및 피드백 | 사용 편의성, 정보 정확성, 응답 속도 |

### 2.2 사용자 역할 및 권한

#### 관리자 (Administrator)
- **권한**: 데이터 파일 업로드, DB 적재, 사용자 관리, 전체 대시보드 접근
- **주요 업무**: CSV 데이터 업로드, 데이터 검증, 시스템 관리

#### 이용자 (Viewer)
- **권한**: 대시보드 조회, 데이터 필터링, 리포트 다운로드
- **주요 업무**: 대시보드를 통한 데이터 조회 및 분석

---

## 3. 페이지 구성

### 3.1 페이지 목록

#### 3.1.1 공용 페이지
- **홈페이지 (/)**: 사이트 소개, 주요 기능 안내 (비인증 사용자 접근 가능)

#### 3.1.2 인증 필수 페이지

**대시보드 메뉴**
- **메인 대시보드 (/dashboard)**: 전체 대학 핵심 지표 한눈에 파악
- **학과 성과 관리 (/dashboard/department)**
  - 학과별 KPI 대시보드 (/dashboard/department/kpi)
  - 취업률 분석 (/dashboard/department/employment)
  - 교원 현황 (/dashboard/department/faculty)
- **연구 성과 분석 (/dashboard/research)**
  - 논문 게재 현황 (/dashboard/research/publications)
  - 연구과제 관리 (/dashboard/research/projects)
  - 연구자 성과 (/dashboard/research/researchers)
- **예산 관리 (/dashboard/budget)**
  - 예산 집행 현황 (/dashboard/budget/execution)
  - 과제별 예산 상세 (/dashboard/budget/projects)
- **학생 현황 (/dashboard/students)**
  - 재학생 현황 (/dashboard/students/enrollment)
  - 지도교수별 현황 (/dashboard/students/advisors)

**데이터 관리 메뉴** (관리자 전용)
- **파일 업로드 (/data/upload)**: CSV 파일 업로드 인터페이스
- **데이터 검증 (/data/validation)**: 업로드 데이터 미리보기 및 검증
- **데이터 조회 (/data/browse)**: 전체 데이터 테이블 뷰, 필터링, 다운로드

### 3.2 공용 레이아웃 구조

모든 인증 페이지(홈 제외)는 다음 공용 레이아웃을 공유합니다:

```
┌─────────────────────────────────────────────────┐
│ Header                                          │
│ [Logo] [대시보드] [데이터관리]     [Avatar ▼]  │
├───────────┬─────────────────────────────────────┤
│           │                                     │
│ Sidebar   │  Main Content Area                 │
│           │                                     │
│ - 메인    │                                     │
│ - 학과    │                                     │
│ - 연구    │                                     │
│ - 예산    │                                     │
│ - 학생    │                                     │
│ [관리자]  │                                     │
│ - 업로드  │                                     │
│ - 검증    │                                     │
│ - 조회    │                                     │
│           │                                     │
└───────────┴─────────────────────────────────────┘
```

#### Header 구성요소
- **로고**: 클릭 시 홈페이지로 이동
- **주 메뉴**: 대시보드, 데이터관리
- **프로필**: 사용자 아바타 및 드롭다운 메뉴 (설정, 로그아웃)

#### Sidebar 구성요소
- **대시보드 메뉴**: 계층적 네비게이션
- **데이터관리 메뉴**: 관리자 권한 사용자에게만 표시

---

## 4. 사용자 여정 (User Journey)

### 4.1 신규 사용자 (대학 경영진)

#### Journey: 전체 대학 성과 파악

1. **진입점**: 홈페이지 (/)
   - 사이트 소개 및 주요 기능 확인
   - Google 로그인 버튼 클릭 (Clerk 인증)

2. **인증**: Clerk Google OAuth
   - Google 계정으로 로그인
   - 권한 승인

3. **메인 대시보드 (/dashboard)**
   - 전체 대학 KPI 카드 확인 (취업률, 논문 수, 연구비, 재학생 수)
   - 연도별 트렌드 차트 조회
   - 단과대학별 성과 비교

4. **상세 분석**: 학과 성과 관리 (/dashboard/department/kpi)
   - 평가년도, 단과대학, 학과 필터 적용
   - 학과별 취업률 비교 막대 그래프 확인
   - 기술이전 수입 순위 Top 10 확인

5. **연구 성과 확인**: 연구 성과 분석 (/dashboard/research/publications)
   - 연도별 논문 게재 수 트렌드 분석
   - SCIE vs KCI 분포 확인
   - 학과별 논문 게재 수 비교

6. **액션**: 특정 학과 성과 개선 필요성 인지 및 후속 조치 계획

### 4.2 관리자 (데이터 관리자)

#### Journey: 신규 데이터 업로드 및 검증

1. **진입점**: 홈페이지 (/)
   - Google 로그인 (Clerk 인증)

2. **파일 업로드 (/data/upload)**
   - 데이터 유형 선택 (학과KPI, 논문, 연구과제, 학생명단)
   - CSV 파일 드래그 앤 드롭 또는 파일 선택
   - 업로드 버튼 클릭

3. **데이터 검증 (/data/validation)**
   - 업로드된 데이터 미리보기
   - 데이터 무결성 검증 결과 확인
   - 중복 데이터 경고 확인
   - 필요시 데이터 수정 후 재업로드

4. **DB 적재 확인**: 데이터 조회 (/data/browse)
   - 전체 데이터 테이블 뷰에서 신규 데이터 확인
   - 필터링 및 검색 기능으로 데이터 정합성 검증

5. **대시보드 확인**: 메인 대시보드 (/dashboard)
   - 업데이트된 데이터가 대시보드에 반영되었는지 확인

### 4.3 교수진 (연구자)

#### Journey: 본인 연구 성과 확인

1. **진입점**: 메인 대시보드 (/dashboard)
   - Google 로그인 후 직접 접근

2. **연구자 성과 (/dashboard/research/researchers)**
   - 본인 이름으로 필터링
   - 연구책임자별 연구비 수주액 확인
   - 연구책임자별 논문 수 확인
   - 과제연계 논문 비율 분석

3. **논문 상세 확인 (/dashboard/research/publications)**
   - 주저자 필터로 본인 논문 검색
   - 논문 제목, 학술지명, Impact Factor 확인

4. **지도학생 확인 (/dashboard/students/advisors)**
   - 지도교수별 현황에서 본인 학생 리스트 확인
   - 학생 수, 과정구분별 분포 파악

---

## 5. Information Architecture (IA)

### 5.1 사이트맵 (Tree 구조)

```
University Dashboard
│
├── 홈 (/) [Public]
│   └── 사이트 소개 및 로그인
│
├── 대시보드 (/dashboard) [Authenticated]
│   │
│   ├── 1. 메인 대시보드 (/dashboard) [Default Landing]
│   │   ├── KPI 카드 섹션
│   │   ├── 연도별 트렌드
│   │   └── 단과대학별 성과 비교
│   │
│   ├── 2. 학과 성과 관리 (/dashboard/department)
│   │   ├── 2-1. 학과별 KPI 대시보드 (/kpi)
│   │   ├── 2-2. 취업률 분석 (/employment)
│   │   └── 2-3. 교원 현황 (/faculty)
│   │
│   ├── 3. 연구 성과 분석 (/dashboard/research)
│   │   ├── 3-1. 논문 게재 현황 (/publications)
│   │   ├── 3-2. 연구과제 관리 (/projects)
│   │   └── 3-3. 연구자 성과 (/researchers)
│   │
│   ├── 4. 예산 관리 (/dashboard/budget)
│   │   ├── 4-1. 예산 집행 현황 (/execution)
│   │   └── 4-2. 과제별 예산 상세 (/projects)
│   │
│   └── 5. 학생 현황 (/dashboard/students)
│       ├── 5-1. 재학생 현황 (/enrollment)
│       └── 5-2. 지도교수별 현황 (/advisors)
│
└── 데이터 관리 (/data) [Admin Only]
    ├── 6-1. 파일 업로드 (/upload)
    ├── 6-2. 데이터 검증 (/validation)
    └── 6-3. 데이터 조회 (/browse)
```

### 5.2 네비게이션 계층 구조

```
Level 1 (Top Menu)
├── 대시보드
└── 데이터관리 [Admin]

Level 2 (Sidebar - 대시보드)
├── 메인 대시보드
├── 학과 성과 관리
├── 연구 성과 분석
├── 예산 관리
└── 학생 현황

Level 3 (Sidebar - Expandable)
학과 성과 관리 ▼
├── 학과별 KPI
├── 취업률 분석
└── 교원 현황

연구 성과 분석 ▼
├── 논문 게재 현황
├── 연구과제 관리
└── 연구자 성과

예산 관리 ▼
├── 예산 집행 현황
└── 과제별 예산 상세

학생 현황 ▼
├── 재학생 현황
└── 지도교수별 현황

Level 2 (Sidebar - 데이터관리) [Admin]
├── 파일 업로드
├── 데이터 검증
└── 데이터 조회
```

### 5.3 데이터 아키텍처

#### 데이터 소스 (CSV Files)
1. **department_kpi.csv**: 학과별 KPI 데이터
2. **publication_list.csv**: 논문 게재 목록
3. **research_project_data.csv**: 연구과제 및 예산 집행 데이터
4. **student_roster.csv**: 학생 명부

#### 데이터베이스 스키마 (Supabase)
- **departments**: 단과대학 및 학과 정보
- **kpi_metrics**: 학과별 KPI 메트릭 (평가년도별)
- **publications**: 논문 게재 데이터
- **research_projects**: 연구과제 정보
- **budget_executions**: 예산 집행 내역
- **students**: 학생 정보
- **users**: 사용자 정보 (Clerk 동기화)
- **upload_logs**: 파일 업로드 이력

---

## 6. 주요 기능 요구사항

### 6.1 인증 및 권한 관리

#### FR-AUTH-001: Google 로그인
- **설명**: Clerk를 통한 Google OAuth 인증
- **우선순위**: High
- **상세 요구사항**:
  - 사용자는 Google 계정으로 로그인할 수 있어야 함
  - 신규 사용자 첫 로그인 시 자동으로 사용자 계정 생성
  - 로그인 성공 시 메인 대시보드로 리다이렉트

#### FR-AUTH-002: 세션 관리
- **설명**: 사용자 세션 유지 및 관리
- **우선순위**: High
- **상세 요구사항**:
  - 로그인 상태는 7일간 유지
  - 세션 만료 시 로그인 페이지로 리다이렉트
  - Remember Me 기능 제공 (30일 세션)

#### FR-AUTH-003: 역할 기반 접근 제어 (RBAC)
- **설명**: 사용자 역할에 따른 페이지 접근 제어
- **우선순위**: High
- **상세 요구사항**:
  - 관리자만 데이터 관리 메뉴 접근 가능
  - 역할 정보는 Clerk Metadata에 저장
  - 권한 없는 페이지 접근 시 403 에러 페이지 표시

### 6.2 대시보드 기능

#### FR-DASH-001: 메인 대시보드
- **설명**: 전체 대학 핵심 지표 시각화
- **우선순위**: High
- **상세 요구사항**:
  - KPI 카드: 취업률, 논문 수, 연구비, 재학생 수
  - 연도별 트렌드 차트: 취업률, 기술이전 수입, 논문 게재
  - 단과대학별 성과 비교: 막대 그래프, 파이 차트
  - 실시간 데이터 업데이트 (최근 업로드 데이터 반영)

#### FR-DASH-002: 학과별 KPI 대시보드
- **설명**: 학과별 상세 KPI 분석
- **우선순위**: High
- **상세 요구사항**:
  - 필터: 평가년도, 단과대학, 학과 다중 선택
  - 학과별 취업률 비교 (막대 그래프)
  - 교원 현황 (전임/초빙 스택 바)
  - 기술이전 수입 Top 10 (순위 차트)
  - 국제학술대회 개최 현황 (히트맵)

#### FR-DASH-003: 논문 게재 현황
- **설명**: 논문 게재 데이터 시각화
- **우선순위**: High
- **상세 요구사항**:
  - 연도별 논문 게재 수 (라인 차트)
  - 학술지 등급별 분포 (SCIE vs KCI 파이 차트)
  - 학과별 논문 게재 수 (막대 그래프)
  - Impact Factor 평균 추이
  - 주저자별 논문 수 랭킹 (테이블)
  - 논문 상세 정보 모달 (제목, 저자, 학술지, IF)

#### FR-DASH-004: 연구과제 관리
- **설명**: 연구과제 및 연구비 관리
- **우선순위**: Medium
- **상세 요구사항**:
  - 지원기관별 연구비 수주 현황 (파이 차트)
  - 학과별 총 연구비 (막대 그래프)
  - 과제별 진행 상태 (집행완료/처리중)
  - 연구비 집행 추이 (타임라인)

#### FR-DASH-005: 예산 집행 현황
- **설명**: 예산 집행 내역 추적 및 분석
- **우선순위**: Medium
- **상세 요구사항**:
  - 월별 집행금액 추이 (라인 차트)
  - 집행항목별 비율 (파이 차트)
  - 학과별 집행금액 비교 (막대 그래프)
  - 과제별 예산 집행률 (진행바)

#### FR-DASH-006: 학생 현황
- **설명**: 재학생 및 지도 현황 파악
- **우선순위**: Medium
- **상세 요구사항**:
  - 단과대학별 재학생 분포 (도넛 차트)
  - 학과별 재학생 수 (막대 그래프)
  - 과정구분별 현황 (학사/석사/박사)
  - 교수별 지도학생 수

### 6.3 데이터 관리 기능

#### FR-DATA-001: CSV 파일 업로드
- **설명**: 관리자의 CSV 파일 업로드 기능
- **우선순위**: High
- **상세 요구사항**:
  - 드래그 앤 드롭 파일 업로드 지원
  - 파일 형식: CSV, XLSX
  - 최대 파일 크기: 10MB
  - 데이터 유형 선택: 학과KPI, 논문, 연구과제, 학생명단
  - 업로드 진행률 표시
  - 업로드 성공/실패 알림

#### FR-DATA-002: 데이터 검증
- **설명**: 업로드된 데이터 무결성 검증
- **우선순위**: High
- **상세 요구사항**:
  - 필수 필드 누락 검사
  - 데이터 타입 검증 (숫자, 날짜, 텍스트)
  - 중복 데이터 감지 및 경고
  - 데이터 미리보기 (최대 100행)
  - 검증 결과 리포트 생성
  - 문제 발견 시 수정 가이드 제공

#### FR-DATA-003: 데이터 조회 및 관리
- **설명**: 전체 데이터 테이블 뷰 및 관리
- **우선순위**: Medium
- **상세 요구사항**:
  - 페이지네이션 (페이지당 50행)
  - 컬럼별 정렬 (오름차순/내림차순)
  - 고급 필터링 (텍스트 검색, 날짜 범위, 숫자 범위)
  - CSV/Excel 다운로드
  - 데이터 삭제 (관리자만)

### 6.4 공용 기능

#### FR-COMMON-001: 반응형 디자인
- **설명**: 다양한 디바이스 지원
- **우선순위**: High
- **상세 요구사항**:
  - 데스크톱 (1920x1080 이상)
  - 태블릿 (768x1024)
  - 모바일 (375x667 이상)
  - 터치 제스처 지원 (모바일/태블릿)

#### FR-COMMON-002: 다크 모드
- **설명**: 라이트/다크 테마 전환
- **우선순위**: Low
- **상세 요구사항**:
  - 사용자 선호 테마 저장
  - 시스템 설정 자동 감지
  - 헤더에 테마 토글 버튼 제공

#### FR-COMMON-003: 데이터 내보내기
- **설명**: 차트 및 데이터 내보내기
- **우선순위**: Medium
- **상세 요구사항**:
  - 차트를 PNG/SVG 이미지로 다운로드
  - 테이블 데이터를 CSV/Excel로 다운로드
  - PDF 리포트 생성 (전체 대시보드)

#### FR-COMMON-004: 필터 및 검색
- **설명**: 전역 필터 및 검색 기능
- **우선순위**: High
- **상세 요구사항**:
  - 평가년도 필터 (다중 선택)
  - 단과대학 필터 (다중 선택)
  - 학과 필터 (다중 선택)
  - 필터 상태 URL 파라미터로 저장 (공유 가능)
  - 필터 초기화 버튼

---

## 7. 비기능 요구사항 (Non-Functional Requirements)

### 7.1 성능

#### NFR-PERF-001: 페이지 로딩 시간
- **기준**: 초기 페이지 로드 시간 < 2초 (3G 네트워크)
- **측정 방법**: Lighthouse Performance Score > 90

#### NFR-PERF-002: API 응답 시간
- **기준**:
  - 단순 조회 API: < 500ms
  - 복잡한 집계 API: < 2초
  - 파일 업로드 처리: < 5초 (10MB 파일 기준)

#### NFR-PERF-003: 동시 사용자
- **기준**: 100명 동시 접속 시 성능 저하 없음
- **측정 방법**: Load Testing (JMeter, k6)

### 7.2 보안

#### NFR-SEC-001: 인증 및 인가
- **요구사항**:
  - HTTPS 필수 (TLS 1.3)
  - Clerk를 통한 OAuth 2.0 인증
  - JWT 토큰 기반 세션 관리
  - CSRF 보호 (Next.js 기본 제공)

#### NFR-SEC-002: 데이터 보안
- **요구사항**:
  - 데이터베이스 연결 암호화 (Supabase SSL)
  - 민감 정보 암호화 저장 (AES-256)
  - 환경 변수를 통한 시크릿 관리
  - Row Level Security (RLS) 적용 (Supabase)

#### NFR-SEC-003: 입력 검증
- **요구사항**:
  - 모든 사용자 입력 검증 (Zod 스키마)
  - SQL Injection 방지 (Prepared Statements)
  - XSS 방지 (React 기본 이스케이핑)
  - 파일 업로드 검증 (파일 타입, 크기, 매직 바이트)

### 7.3 가용성

#### NFR-AVAIL-001: 시스템 가동 시간
- **목표**: 99.5% Uptime (월 3.6시간 이내 다운타임)

#### NFR-AVAIL-002: 백업 및 복구
- **요구사항**:
  - 데이터베이스 일일 자동 백업
  - Point-in-Time Recovery (PITR) 지원
  - 백업 데이터 7일 보관

### 7.4 확장성

#### NFR-SCALE-001: 데이터 증가
- **기준**:
  - 최대 100,000개 논문 레코드 처리
  - 최대 10,000개 연구과제 레코드 처리
  - 최대 50,000명 학생 레코드 처리

#### NFR-SCALE-002: 수평 확장
- **요구사항**:
  - Stateless 애플리케이션 아키텍처
  - 로드 밸런싱 지원 (Vercel Edge Network)
  - CDN을 통한 정적 자산 배포

### 7.5 사용성

#### NFR-USE-001: 접근성
- **기준**: WCAG 2.1 Level AA 준수
- **요구사항**:
  - 키보드 네비게이션 지원
  - 스크린 리더 호환성
  - 충분한 색상 대비 (4.5:1 이상)
  - ARIA 레이블 적용

#### NFR-USE-002: 브라우저 호환성
- **지원 브라우저**:
  - Chrome (최신 버전 -2)
  - Firefox (최신 버전 -2)
  - Safari (최신 버전 -2)
  - Edge (최신 버전 -2)

#### NFR-USE-003: 다국어 지원
- **우선순위**: Future (Phase 2)
- **지원 언어**: 한국어 (기본), 영어

### 7.6 유지보수성

#### NFR-MAINT-001: 코드 품질
- **요구사항**:
  - TypeScript Strict Mode 활성화
  - ESLint + Prettier 코드 스타일 통일
  - 코드 커버리지 > 70% (주요 비즈니스 로직)

#### NFR-MAINT-002: 문서화
- **요구사항**:
  - API 문서 (Swagger/OpenAPI)
  - 컴포넌트 문서 (Storybook)
  - README 및 기술 문서 유지

---

## 8. 기술 스택

### 8.1 프론트엔드
- **프레임워크**: Next.js 15 (App Router)
- **UI 라이브러리**: React 19
- **언어**: TypeScript 5
- **스타일링**: Tailwind CSS 4
- **UI 컴포넌트**: Shadcn UI
- **아이콘**: Lucide React
- **차트 라이브러리**: Recharts or Chart.js (TBD)
- **폼 관리**: React Hook Form + Zod
- **상태 관리**: Zustand, React Query (TanStack Query)
- **날짜 처리**: date-fns

### 8.2 백엔드
- **API**: Next.js API Routes (App Router)
- **런타임**: Node.js 20
- **API 프레임워크**: Hono (경량 API)

### 8.3 데이터베이스 및 인프라
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Clerk (Google OAuth)
- **호스팅**: Vercel
- **파일 스토리지**: Supabase Storage

### 8.4 개발 도구
- **패키지 매니저**: npm
- **린터**: ESLint
- **포맷터**: Prettier
- **테스트**: Jest, React Testing Library (TBD)

---

## 9. 데이터 모델

### 9.1 CSV 데이터 구조

#### department_kpi.csv
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| 평가년도 | Number | Y | 평가 연도 (YYYY) |
| 단과대학 | String | Y | 단과대학명 |
| 학과 | String | Y | 학과명 |
| 졸업생취업률 | Number | Y | 취업률 (%) |
| 전임교원수 | Number | Y | 전임교원 수 (명) |
| 초빙교원수 | Number | Y | 초빙교원 수 (명) |
| 기술이전수입 | Number | Y | 연간 기술이전 수입액 (억원) |
| 국제학술대회 | Number | Y | 국제학술대회 개최 횟수 |

#### publication_list.csv
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| 논문ID | String | Y | 고유 논문 식별자 |
| 게재일 | Date | Y | 논문 게재일 (YYYY-MM-DD) |
| 단과대학 | String | Y | 단과대학명 |
| 학과 | String | Y | 학과명 |
| 논문제목 | String | Y | 논문 제목 |
| 주저자 | String | Y | 주저자 이름 |
| 참여저자 | String | N | 참여저자 목록 (콤마 구분) |
| 학술지명 | String | Y | 학술지명 |
| 저널등급 | String | Y | SCIE, KCI 등 |
| Impact Factor | Number | N | Impact Factor 값 |
| 과제연계여부 | Boolean | Y | 연구과제 연계 여부 (Y/N) |

#### research_project_data.csv
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| 집행ID | String | Y | 고유 집행 식별자 |
| 과제번호 | String | Y | 연구과제 번호 |
| 과제명 | String | Y | 연구과제명 |
| 연구책임자 | String | Y | 연구책임자 이름 |
| 소속학과 | String | Y | 연구책임자 소속 학과 |
| 지원기관 | String | Y | 연구비 지원기관 |
| 총연구비 | Number | Y | 총 연구비 (원) |
| 집행일자 | Date | Y | 예산 집행일 (YYYY-MM-DD) |
| 집행항목 | String | Y | 집행 항목 (인건비, 장비비 등) |
| 집행금액 | Number | Y | 집행 금액 (원) |
| 상태 | String | Y | 집행완료, 처리중 |
| 비고 | String | N | 비고 |

#### student_roster.csv
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| 학번 | String | Y | 학생 학번 |
| 이름 | String | Y | 학생 이름 |
| 단과대학 | String | Y | 단과대학명 |
| 학과 | String | Y | 학과명 |
| 학년 | Number | Y | 학년 |
| 과정구분 | String | Y | 학사, 석사, 박사 |
| 학적상태 | String | Y | 재학, 휴학, 졸업 |
| 성별 | String | Y | 남, 여 |
| 입학년도 | Number | Y | 입학 연도 (YYYY) |
| 지도교수 | String | N | 지도교수 이름 |
| 이메일 | String | Y | 학생 이메일 |

### 9.2 데이터베이스 스키마 (Supabase)

```sql
-- departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_name VARCHAR(100) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_name, department_name)
);

-- kpi_metrics
CREATE TABLE kpi_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id),
  evaluation_year INTEGER NOT NULL,
  employment_rate DECIMAL(5,2),
  full_time_faculty INTEGER,
  visiting_faculty INTEGER,
  tech_transfer_income DECIMAL(10,2),
  intl_conference_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, evaluation_year)
);

-- publications
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publication_id VARCHAR(50) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  title TEXT NOT NULL,
  main_author VARCHAR(100) NOT NULL,
  co_authors TEXT,
  journal_name VARCHAR(200) NOT NULL,
  journal_grade VARCHAR(20),
  impact_factor DECIMAL(6,3),
  publication_date DATE NOT NULL,
  project_linked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- research_projects
CREATE TABLE research_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_number VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(300) NOT NULL,
  principal_investigator VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id),
  funding_agency VARCHAR(200) NOT NULL,
  total_budget BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- budget_executions
CREATE TABLE budget_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id VARCHAR(50) UNIQUE NOT NULL,
  project_id UUID REFERENCES research_projects(id),
  execution_date DATE NOT NULL,
  execution_item VARCHAR(100) NOT NULL,
  execution_amount BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id),
  grade INTEGER,
  program_type VARCHAR(20),
  enrollment_status VARCHAR(20),
  gender VARCHAR(10),
  admission_year INTEGER,
  advisor VARCHAR(100),
  email VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- users (Clerk 동기화)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  clerk_user_id VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- upload_logs
CREATE TABLE upload_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  file_name VARCHAR(200) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER,
  data_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  rows_processed INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10. 제약사항 및 가정

### 10.1 제약사항

#### 기술적 제약사항
- **Next.js 15 App Router 필수**: Pages Router 미사용
- **Clerk 인증 의존성**: Google OAuth만 지원 (1차 버전)
- **Supabase 무료 플랜 제한**:
  - 데이터베이스: 500MB 제한
  - 파일 스토리지: 1GB 제한
  - 동시 연결: 60개 제한
- **Vercel 무료 플랜 제한**:
  - 빌드 시간: 월 6,000분
  - 대역폭: 월 100GB

#### 비즈니스 제약사항
- **데이터 소스**: Ecount CSV 파일만 지원
- **사용자 수**: 초기 100명 이하 목표
- **언어**: 한국어만 지원 (1차 버전)

### 10.2 가정

#### 데이터 관련 가정
- CSV 파일은 정해진 포맷을 준수함
- 데이터는 월 1회 업데이트됨
- 과거 3년치 데이터 제공

#### 사용자 관련 가정
- 모든 사용자는 Google 계정 보유
- 사용자는 기본적인 웹 브라우저 사용 능력 보유
- 데스크톱 환경에서 주로 사용 (모바일은 보조)

#### 운영 관련 가정
- 대학 IT 팀의 기술 지원 가능
- 초기 6개월은 베타 운영 기간
- 사용자 피드백 기반 지속적 개선

---

## 11. 성공 지표 (Success Metrics)

### 11.1 비즈니스 지표

#### KPI-BUS-001: 사용자 채택률
- **목표**: 출시 3개월 내 대상 사용자의 60% 활성 사용자 확보
- **측정 방법**: MAU (Monthly Active Users) / 전체 등록 사용자

#### KPI-BUS-002: 사용자 만족도
- **목표**: NPS (Net Promoter Score) > 50
- **측정 방법**: 분기별 사용자 설문조사

#### KPI-BUS-003: 데이터 활용도
- **목표**: 주요 대시보드 페이지 주 1회 이상 방문
- **측정 방법**: Google Analytics 페이지뷰 분석

### 11.2 기술 지표

#### KPI-TECH-001: 페이지 성능
- **목표**: Lighthouse Performance Score > 90
- **측정 방법**: 주간 Lighthouse CI 자동 테스트

#### KPI-TECH-002: 시스템 안정성
- **목표**:
  - Uptime > 99.5%
  - Error Rate < 0.1%
- **측정 방법**: Vercel Analytics, Sentry Error Tracking

#### KPI-TECH-003: API 응답 시간
- **목표**: P95 < 1초
- **측정 방법**: Vercel Analytics API Performance

### 11.3 사용자 행동 지표

#### KPI-UX-001: 세션 시간
- **목표**: 평균 세션 시간 > 5분
- **측정 방법**: Google Analytics

#### KPI-UX-002: 이탈률
- **목표**: Bounce Rate < 30%
- **측정 방법**: Google Analytics

#### KPI-UX-003: 기능 사용률
- **목표**:
  - 필터 기능 사용률 > 70%
  - 데이터 내보내기 기능 사용률 > 30%
- **측정 방법**: Custom Event Tracking (Google Analytics)

---

## 12. 개발 로드맵

### Phase 1: MVP (Minimum Viable Product) - 8주
**목표**: 핵심 기능 구현 및 베타 출시

#### Week 1-2: 프로젝트 설정 및 인증
- Next.js 15 프로젝트 초기화
- Clerk 인증 설정 (Google OAuth)
- Supabase 데이터베이스 구축
- 공용 레이아웃 (Header, Sidebar) 구현

#### Week 3-4: 데이터 관리 기능
- CSV 파일 업로드 UI
- 데이터 파싱 및 검증 로직
- Supabase 데이터 적재
- 데이터 조회 페이지

#### Week 5-6: 메인 대시보드 및 학과 성과
- 메인 대시보드 KPI 카드
- 학과별 KPI 대시보드
- 취업률 분석 페이지
- 차트 라이브러리 통합

#### Week 7-8: 연구 성과 및 테스트
- 논문 게재 현황 페이지
- 연구과제 관리 페이지
- 통합 테스트 및 버그 수정
- 베타 출시

### Phase 2: 기능 확장 - 6주
**목표**: 추가 대시보드 및 고급 기능

#### Week 9-10: 예산 관리 및 학생 현황
- 예산 집행 현황 페이지
- 학생 현황 페이지
- 연구자 성과 페이지

#### Week 11-12: 고급 필터링 및 내보내기
- 고급 필터 UI 개선
- PDF 리포트 생성
- CSV/Excel 다운로드 최적화

#### Week 13-14: 성능 최적화 및 안정화
- 성능 프로파일링 및 최적화
- 에러 핸들링 강화
- 사용자 피드백 반영

### Phase 3: 개선 및 확장 - 진행 중
**목표**: 사용자 피드백 기반 지속적 개선

- 다국어 지원 (영어)
- 모바일 앱 (React Native)
- 알림 기능 (이메일, 푸시)
- AI 기반 인사이트 제공

---

## 13. 위험 관리 (Risk Management)

### 13.1 주요 위험 요소

#### RISK-001: 데이터 품질 문제
- **설명**: CSV 파일의 데이터 오류, 누락, 형식 불일치
- **영향도**: High
- **확률**: Medium
- **대응 방안**:
  - 업로드 시 철저한 데이터 검증 로직 구현
  - 샘플 데이터 템플릿 제공
  - 사용자 매뉴얼 작성

#### RISK-002: Supabase 무료 플랜 한계
- **설명**: 데이터 증가로 무료 플랜 한계 도달
- **영향도**: Medium
- **확률**: Medium
- **대응 방안**:
  - 데이터 증가 추이 모니터링
  - Pro 플랜 전환 예산 확보
  - 데이터 아카이빙 정책 수립

#### RISK-003: 사용자 채택 저조
- **설명**: 목표 사용자 수 미달성
- **영향도**: High
- **확률**: Low
- **대응 방안**:
  - 초기 사용자 대상 온보딩 교육
  - 사용자 피드백 적극 수렴
  - UI/UX 지속적 개선

#### RISK-004: 성능 이슈
- **설명**: 대량 데이터 처리 시 성능 저하
- **영향도**: Medium
- **확률**: Medium
- **대응 방안**:
  - 페이지네이션 및 가상 스크롤링
  - 데이터 캐싱 전략 (React Query)
  - Database Indexing 최적화

---

## 14. 부록

### 14.1 용어집

| 용어 | 설명 |
|------|------|
| KPI | Key Performance Indicator (핵심 성과 지표) |
| SCIE | Science Citation Index Expanded |
| KCI | Korea Citation Index |
| Impact Factor | 학술지 영향력 지수 |
| OAuth | Open Authorization (개방형 인증) |
| RBAC | Role-Based Access Control (역할 기반 접근 제어) |
| CSV | Comma-Separated Values (콤마로 구분된 값) |
| RLS | Row Level Security (행 수준 보안) |

### 14.2 참고 자료

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Clerk Authentication Docs](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query/latest)

### 14.3 문서 버전 히스토리

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-11-02 | AI Assistant | 초안 작성 |

---

## 15. 승인

| 역할 | 이름 | 서명 | 날짜 |
|------|------|------|------|
| Product Owner |  |  |  |
| Tech Lead |  |  |  |
| Stakeholder |  |  |  |

---

**문서 종료**
