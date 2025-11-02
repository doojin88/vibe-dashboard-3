# 데이터 검증 페이지 구현 계획
# Data Validation Implementation Plan

**페이지 경로**: `/data/validation`
**페이지명**: 데이터 검증
**접근 권한**: Administrator Only
**작성일**: 2025-11-02
**버전**: 1.0

---

## 목차

1. [페이지 개요 및 목적](#1-페이지-개요-및-목적)
2. [UI 구성 요소](#2-ui-구성-요소)
3. [기능 요구사항](#3-기능-요구사항)
4. [데이터 구조 및 API](#4-데이터-구조-및-api)
5. [사용할 공통 컴포넌트](#5-사용할-공통-컴포넌트)
6. [데이터 Fetching 전략](#6-데이터-fetching-전략)
7. [구현 상세](#7-구현-상세)
8. [검증 로직](#8-검증-로직)
9. [성능 최적화](#9-성능-최적화)
10. [에러 핸들링](#10-에러-핸들링)
11. [테스트 시나리오](#11-테스트-시나리오)

---

## 1. 페이지 개요 및 목적

### 1.1 페이지 목적

**주요 목적**: 업로드된 CSV/XLSX 데이터의 무결성을 검증하고 DB 적재 전 미리보기 제공

데이터 검증 페이지는 파일 업로드 직후 자동으로 이동되는 페이지로, 업로드된 데이터의 스키마 검증, 데이터 타입 검증, 중복 검사를 수행하고, 관리자가 검증 결과를 확인한 후 DB 적재를 승인할 수 있도록 합니다.

### 1.2 타겟 사용자

- **관리자 (Administrator)**: 데이터 검증 결과 확인 및 적재 승인 권한

### 1.3 페이지 플로우

```
[파일 업로드 완료] (/data/upload)
    ↓
[자동 리다이렉트] (/data/validation?file_id={id})
    ↓
[데이터 검증 API 호출]
    ├── 파일 파싱 (CSV/XLSX → JSON)
    ├── 스키마 검증 (Zod)
    ├── 비즈니스 로직 검증
    └── 중복 데이터 검사
    ↓
[검증 결과 렌더링]
    ├── 검증 통계 (KPI 카드)
    ├── 오류 상세 테이블
    ├── 데이터 미리보기 테이블
    └── 중복 처리 옵션
    ↓
[관리자 액션]
    ├── 오류 있음: 수정 후 재업로드
    └── 오류 없음: 적재 승인
    ↓
[DB 적재] (POST /api/data/commit)
    ↓
[적재 완료] (/data/browse)
```

---

## 2. UI 구성 요소

### 2.1 레이아웃 구조

```
┌──────────────────────────────────────────────────┐
│ Header (공통)                                    │
│ [Logo] [대시보드] [데이터관리]      [Avatar ▼]  │
├─────────┬────────────────────────────────────────┤
│         │                                        │
│ Sidebar │  데이터 검증 컨텐츠                    │
│ (공통)  │                                        │
│         │  ┌────────────────────────────────┐   │
│         │  │ 페이지 헤더                     │   │
│         │  │ 데이터 검증 결과               │   │
│         │  │ 파일명: department_kpi.csv     │   │
│         │  └────────────────────────────────┘   │
│         │                                        │
│         │  ┌────────────────────────────────┐   │
│         │  │ 검증 통계 (KPI 카드 4개)        │   │
│         │  │ [총 레코드][유효][오류][경고]   │   │
│         │  └────────────────────────────────┘   │
│         │                                        │
│         │  ┌────────────────────────────────┐   │
│         │  │ 오류 상세 테이블 (조건부 표시)  │   │
│         │  │ 행 번호 | 필드 | 오류 | 값     │   │
│         │  │ [오류 데이터 다운로드 CSV]      │   │
│         │  └────────────────────────────────┘   │
│         │                                        │
│         │  ┌────────────────────────────────┐   │
│         │  │ 중복 데이터 섹션 (조건부 표시)  │   │
│         │  │ 중복 레코드: 10건              │   │
│         │  │ ( ) 중복 데이터 제외하고 적재   │   │
│         │  │ ( ) 중복 데이터로 덮어쓰기      │   │
│         │  └────────────────────────────────┘   │
│         │                                        │
│         │  ┌────────────────────────────────┐   │
│         │  │ 데이터 미리보기                 │   │
│         │  │ [최대 100행, 페이지네이션]      │   │
│         │  │ 오류 행: 빨간색 하이라이트      │   │
│         │  │ 경고 행: 노란색 하이라이트      │   │
│         │  └────────────────────────────────┘   │
│         │                                        │
│         │  ┌────────────────────────────────┐   │
│         │  │ 액션 버튼                       │   │
│         │  │ [적재 승인][수정후재업로드][취소]│  │
│         │  └────────────────────────────────┘   │
│         │                                        │
└─────────┴────────────────────────────────────────┘
```

### 2.2 섹션별 상세 구성

#### 2.2.1 페이지 헤더

**레이아웃**: 제목 + 파일 정보

**구성 요소**:
- 제목: "데이터 검증 결과"
- 파일 정보:
  - 파일명: `department_kpi.csv`
  - 파일 크기: `2.5 MB`
  - 데이터 유형: `학과KPI`
  - 업로드 시각: `2025-11-02 14:35:22`

#### 2.2.2 검증 통계 (KPI 카드 섹션)

**레이아웃**: 4개의 카드를 가로로 배치 (그리드 레이아웃)

**카드 구성**:
1. **총 레코드 수**
   - 아이콘: FileText
   - 메인 값: `1,234건`
   - 서브텍스트: `CSV 파일 전체 행`
   - 색상: 파란색

2. **유효 레코드**
   - 아이콘: CheckCircle
   - 메인 값: `1,214건`
   - 서브텍스트: `검증 통과`
   - 색상: 초록색

3. **오류 레코드**
   - 아이콘: XCircle
   - 메인 값: `10건`
   - 서브텍스트: `필수 필드 누락 등`
   - 색상: 빨간색

4. **경고 레코드**
   - 아이콘: AlertTriangle
   - 메인 값: `10건`
   - 서브텍스트: `중복 데이터`
   - 색상: 노란색

**스타일링**:
- 카드 높이: 고정 (약 120px)
- 반응형: 모바일에서는 2x2 그리드로 변경
- 오류 있을 경우 빨간색 테두리 강조

#### 2.2.3 오류 상세 테이블 (조건부 표시)

**표시 조건**: `errorCount > 0`

**테이블 구성**:
- **컬럼**:
  - 행 번호 (Number)
  - 필드명 (String)
  - 오류 내용 (String)
  - 현재 값 (Any)
- **정렬**: 행 번호 오름차순
- **필터**: 필드명으로 필터링 가능
- **페이지네이션**: 20행/페이지

**기능**:
- "오류 데이터 다운로드 (CSV)" 버튼
- 오류 행 클릭 시 미리보기 테이블의 해당 행으로 스크롤

**예시 데이터**:
```
| 행 번호 | 필드명       | 오류 내용                     | 현재 값 |
|---------|--------------|------------------------------|---------|
| 5       | 취업률       | 범위 초과 (0-100)             | 105     |
| 12      | 전임교원수   | 데이터 타입 오류 (숫자 필요)  | "abc"   |
| 23      | 평가년도     | 필수 필드 누락                | NULL    |
```

#### 2.2.4 중복 데이터 섹션 (조건부 표시)

**표시 조건**: `duplicateCount > 0`

**구성 요소**:
- 중복 레코드 수 표시: `중복 데이터: 10건 발견`
- 중복 레코드 목록 테이블 (간략):
  - 고유 식별자 (학과KPI: 평가년도 + 학과, 논문: 논문ID 등)
  - 기존 데이터와 신규 데이터 비교

**처리 옵션 (라디오 버튼)**:
- `(●) 중복 데이터 제외하고 적재` (기본 선택)
  - 설명: "기존 데이터 유지, 중복 10건 제외"
- `( ) 중복 데이터로 기존 데이터 덮어쓰기`
  - 설명: "기존 데이터 업데이트, 중복 10건 갱신"

#### 2.2.5 데이터 미리보기 테이블

**레이아웃**: 전체 너비 테이블

**테이블 구성**:
- **컬럼**: CSV 파일의 모든 컬럼 (동적)
- **행**: 최대 100행 표시
- **페이지네이션**: 50행/페이지
- **정렬**: 모든 컬럼 정렬 가능
- **하이라이트**:
  - 오류 행: 빨간색 배경 (hover 시 툴팁으로 오류 내용 표시)
  - 경고 행 (중복): 노란색 배경

**스크롤**:
- 가로 스크롤 지원 (컬럼이 많을 경우)
- 세로 스크롤: 페이지네이션으로 대체

#### 2.2.6 액션 버튼

**버튼 구성**:

1. **적재 승인** (Primary)
   - 활성화 조건: `errorCount === 0`
   - 비활성화 조건: `errorCount > 0`
   - 클릭 시: 확인 모달 표시 → DB 적재 API 호출
   - 텍스트: "적재 승인 (1,224건)"

2. **수정 후 재업로드** (Secondary)
   - 항상 활성화
   - 클릭 시: /data/upload 페이지로 이동
   - 오류 데이터 CSV 자동 다운로드 (옵션)

3. **취소** (Tertiary)
   - 항상 활성화
   - 클릭 시: 확인 모달 → upload_logs.status = 'cancelled' → /data/upload 이동

**확인 모달 (적재 승인)**:
- 제목: "데이터 적재 확인"
- 메시지: "1,224건의 데이터를 데이터베이스에 적재하시겠습니까?"
- 중복 옵션 표시 (선택한 옵션 강조)
- 버튼: "취소" / "확인"

---

## 3. 기능 요구사항

### 3.1 필수 기능 (MVP)

#### FR-VAL-001: 파일 검증 자동 실행
- **설명**: 페이지 로드 시 자동으로 검증 API 호출
- **입력**: URL 파라미터 `file_id`
- **처리**:
  1. upload_logs 테이블에서 file_id로 파일 정보 조회
  2. Supabase Storage에서 파일 다운로드
  3. CSV/XLSX 파일을 JSON으로 파싱
  4. 검증 로직 실행 (스키마, 비즈니스 로직, 중복 검사)
- **출력**: 검증 결과 JSON

#### FR-VAL-002: 스키마 검증 (Zod)
- **설명**: 데이터 유형별 Zod 스키마로 각 행 검증
- **검증 항목**:
  - 필수 필드 존재 확인
  - 데이터 타입 검증 (Number, String, Date, Boolean)
  - 날짜 형식 검증 (YYYY-MM-DD)
  - 숫자 범위 검증
- **출력**: 오류 레코드 목록 (행 번호, 필드명, 오류 메시지, 값)

#### FR-VAL-003: 비즈니스 로직 검증
- **설명**: 도메인 규칙에 따른 데이터 검증
- **검증 항목**:
  - 취업률: 0 ≤ value ≤ 100
  - 교원 수: value ≥ 0
  - 기술이전 수입: value ≥ 0
  - Impact Factor: value ≥ 0 또는 NULL
  - 날짜: value ≤ 현재 날짜 (미래 날짜 경고)
  - 외래키 참조 무결성 (단과대학명, 학과명)
- **출력**: 오류/경고 레코드 목록

#### FR-VAL-004: 중복 데이터 검사
- **설명**: 고유 식별자 기준으로 중복 검사
- **고유 식별자**:
  - 학과KPI: `(department_id, evaluation_year)`
  - 논문: `publication_id`
  - 연구과제: `project_number`
  - 예산 집행: `execution_id`
  - 학생: `student_number`
- **처리**:
  1. CSV 데이터에서 고유 식별자 추출
  2. DB에서 기존 데이터 조회
  3. 중복 레코드 비교 (기존 vs 신규)
- **출력**: 중복 레코드 목록

#### FR-VAL-005: 검증 통계 표시
- **설명**: 검증 결과를 KPI 카드 형태로 표시
- **입력**: 검증 결과 JSON
- **출력**:
  - 총 레코드 수
  - 유효 레코드 수
  - 오류 레코드 수
  - 경고 레코드 수 (중복)

#### FR-VAL-006: 오류 상세 테이블
- **설명**: 오류 레코드 상세 정보를 테이블로 표시
- **기능**:
  - 정렬 (행 번호, 필드명)
  - 필터링 (필드명)
  - 오류 데이터 CSV 다운로드
  - 오류 행 클릭 시 미리보기 테이블 스크롤

#### FR-VAL-007: 데이터 미리보기
- **설명**: CSV 데이터를 테이블 형태로 미리보기
- **기능**:
  - 최대 100행 표시
  - 50행/페이지 페이지네이션
  - 오류 행 빨간색 하이라이트
  - 경고 행 (중복) 노란색 하이라이트
  - 오류 행 hover 시 툴팁으로 오류 내용 표시

#### FR-VAL-008: 중복 처리 옵션 선택
- **설명**: 중복 데이터 처리 방법 선택
- **옵션**:
  - 중복 제외 (ON CONFLICT DO NOTHING)
  - 덮어쓰기 (ON CONFLICT DO UPDATE)
- **기본값**: 중복 제외

#### FR-VAL-009: DB 적재 승인
- **설명**: 검증 통과 후 DB 적재 실행
- **입력**: file_id, duplicate_action
- **처리**:
  1. 확인 모달 표시
  2. POST /api/data/commit 호출
  3. 트랜잭션 실행 (departments 생성, 메인 테이블 Upsert)
  4. upload_logs 업데이트 (status: 'completed')
- **출력**: 적재 결과 (성공/실패, 적재 행 수)

### 3.2 추가 기능 (Phase 2)

- 외래키 자동 생성 옵션 토글
- 검증 규칙 커스터마이징
- 배치 단위 조정 (1000행 기본)
- 검증 결과 리포트 PDF 다운로드

---

## 4. 데이터 구조 및 API

### 4.1 데이터 소스

**데이터베이스 테이블**:
1. `upload_logs`: 업로드 이력
2. `departments`: 단과대학 및 학과 정보
3. `kpi_metrics`, `publications`, `research_projects`, `budget_executions`, `students`: 검증 대상 테이블

**Supabase Storage**:
- `temp-uploads`: 임시 파일 저장 버킷

### 4.2 API 엔드포인트

#### 4.2.1 데이터 검증 API

**엔드포인트**: `POST /api/data/validate`

**요청 구조**:
```typescript
{
  file_id: string; // UUID
}
```

**응답 구조**:
```typescript
{
  file_id: string;
  file_name: string;
  file_size: number;
  data_type: 'department_kpi' | 'publication_list' | 'research_project_data' | 'student_roster';
  uploaded_at: string; // ISO 8601

  validation: {
    totalRecords: number;
    validRecords: number;
    errorRecords: number;
    warningRecords: number;

    errors: Array<{
      row: number;
      field: string;
      message: string;
      value: any;
    }>;

    duplicates: Array<{
      identifier: string | Record<string, any>;
      existingData: Record<string, any>;
      newData: Record<string, any>;
    }>;

    preview: Array<Record<string, any>>; // 최대 100행
  };
}
```

**예시 응답**:
```json
{
  "file_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "file_name": "department_kpi.csv",
  "file_size": 2621440,
  "data_type": "department_kpi",
  "uploaded_at": "2025-11-02T14:35:22Z",

  "validation": {
    "totalRecords": 1234,
    "validRecords": 1214,
    "errorRecords": 10,
    "warningRecords": 10,

    "errors": [
      {
        "row": 5,
        "field": "employment_rate",
        "message": "범위 초과: 0-100 사이여야 합니다",
        "value": 105
      },
      {
        "row": 12,
        "field": "full_time_faculty",
        "message": "데이터 타입 오류: 숫자여야 합니다",
        "value": "abc"
      }
    ],

    "duplicates": [
      {
        "identifier": {
          "evaluation_year": 2023,
          "college_name": "공과대학",
          "department_name": "컴퓨터공학과"
        },
        "existingData": {
          "employment_rate": 75.5,
          "full_time_faculty": 12
        },
        "newData": {
          "employment_rate": 78.2,
          "full_time_faculty": 13
        }
      }
    ],

    "preview": [
      {
        "_row": 1,
        "_errors": null,
        "evaluation_year": 2023,
        "college_name": "공과대학",
        "department_name": "컴퓨터공학과",
        "employment_rate": 78.5,
        "full_time_faculty": 12,
        "visiting_faculty": 3,
        "tech_transfer_income": 5.2,
        "intl_conference_count": 2
      }
      // ... 최대 100행
    ]
  }
}
```

#### 4.2.2 DB 적재 API

**엔드포인트**: `POST /api/data/commit`

**요청 구조**:
```typescript
{
  file_id: string;
  duplicate_action: 'skip' | 'upsert';
}
```

**응답 구조**:
```typescript
{
  success: true;
  file_id: string;
  rows_processed: number;
  rows_skipped: number; // 중복 제외한 경우
  rows_updated: number; // 중복 갱신한 경우
  duration_ms: number;
  message: string;
}
```

**예시 응답**:
```json
{
  "success": true,
  "file_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "rows_processed": 1214,
  "rows_skipped": 10,
  "rows_updated": 0,
  "duration_ms": 3200,
  "message": "데이터 적재 완료: 1,214건"
}
```

#### 4.2.3 업로드 취소 API

**엔드포인트**: `POST /api/data/cancel`

**요청 구조**:
```typescript
{
  file_id: string;
}
```

**응답 구조**:
```typescript
{
  success: true;
  message: string;
}
```

### 4.3 Zod 스키마 정의

#### 4.3.1 학과KPI 스키마

**파일 경로**: `src/features/data-validation/schemas/kpi-schema.ts`

```typescript
import { z } from 'zod';

export const DepartmentKPISchema = z.object({
  평가년도: z.coerce.number().int()
    .min(2000, "평가년도는 2000년 이상이어야 합니다")
    .max(2100, "평가년도는 2100년 이하여야 합니다"),

  단과대학: z.string()
    .min(1, "단과대학명은 필수입니다"),

  학과: z.string()
    .min(1, "학과명은 필수입니다"),

  졸업생취업률: z.coerce.number()
    .min(0, "취업률은 0 이상이어야 합니다")
    .max(100, "취업률은 100 이하여야 합니다"),

  전임교원수: z.coerce.number().int()
    .min(0, "전임교원수는 0 이상이어야 합니다"),

  초빙교원수: z.coerce.number().int()
    .min(0, "초빙교원수는 0 이상이어야 합니다"),

  연간기술이전수입액: z.coerce.number()
    .min(0, "기술이전 수입액은 0 이상이어야 합니다")
    .optional(),

  국제학술대회개최횟수: z.coerce.number().int()
    .min(0, "국제학술대회 개최 횟수는 0 이상이어야 합니다")
    .optional(),
});

export type DepartmentKPI = z.infer<typeof DepartmentKPISchema>;
```

#### 4.3.2 논문 스키마

```typescript
export const PublicationSchema = z.object({
  논문ID: z.string().min(1, "논문ID는 필수입니다"),

  게재일: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    "게재일은 유효한 날짜여야 합니다 (YYYY-MM-DD)"
  ).refine(
    (val) => new Date(val) <= new Date(),
    "게재일은 미래 날짜일 수 없습니다"
  ),

  단과대학: z.string().min(1, "단과대학명은 필수입니다"),
  학과: z.string().min(1, "학과명은 필수입니다"),

  논문제목: z.string().min(1, "논문제목은 필수입니다"),
  주저자: z.string().min(1, "주저자는 필수입니다"),
  참여저자: z.string().optional(),

  학술지명: z.string().min(1, "학술지명은 필수입니다"),
  저널등급: z.enum(['SCIE', 'SSCI', 'A&HCI', 'SCOPUS', 'KCI', 'Other']),

  'Impact Factor': z.coerce.number()
    .min(0, "Impact Factor는 0 이상이어야 합니다")
    .optional(),

  과제연계여부: z.enum(['Y', 'N', 'true', 'false', '1', '0'])
    .transform((val) => ['Y', 'true', '1'].includes(val)),
});
```

---

## 5. 사용할 공통 컴포넌트

### 5.1 레이아웃 컴포넌트 (공통 모듈)

#### `DashboardLayout`
- **경로**: `src/components/layout/dashboard-layout.tsx`
- **사용**: 페이지 전체 래퍼

### 5.2 UI 컴포넌트 (공통 모듈)

#### `KPICard`
- **경로**: `src/components/dashboard/kpi-card.tsx`
- **사용**: 검증 통계 카드

```tsx
<KPICard
  title="총 레코드"
  value="1,234건"
  icon={FileText}
  description="CSV 파일 전체 행"
  variant="default"
/>
```

#### `DataTable`
- **경로**: `src/components/ui/data-table.tsx`
- **사용**: 오류 상세 테이블, 미리보기 테이블

```tsx
<DataTable
  columns={columns}
  data={previewData}
  rowClassName={(row) => {
    if (row._errors) return "bg-red-50";
    if (row._duplicate) return "bg-yellow-50";
    return "";
  }}
  onRowClick={(row) => scrollToRow(row._row)}
/>
```

#### `Badge`
- **경로**: `src/components/ui/badge.tsx`
- **사용**: 상태 표시 (오류, 경고, 성공)

```tsx
<Badge variant="destructive">오류 10건</Badge>
<Badge variant="warning">경고 10건</Badge>
<Badge variant="success">유효 1,214건</Badge>
```

### 5.3 Shadcn UI 컴포넌트

- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Button`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- `RadioGroup`, `RadioGroupItem`
- `Alert`, `AlertTitle`, `AlertDescription`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- `ScrollArea`
- `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`
- `Skeleton` (로딩 상태)

---

## 6. 데이터 Fetching 전략

### 6.1 React Query 사용

#### 쿼리 키 구조
```typescript
["data-validation", file_id]
```

#### 캐싱 설정
```typescript
{
  staleTime: 0, // 항상 최신 데이터 조회
  cacheTime: 10 * 60 * 1000, // 10분
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 1, // 검증은 재시도 1회만
}
```

### 6.2 Custom Hook

#### `useDataValidation`

**파일 경로**: `src/hooks/api/useDataValidation.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { ValidationResult } from '@/types/data-validation';

export function useDataValidation(fileId: string | null) {
  return useQuery<ValidationResult>({
    queryKey: ["data-validation", fileId],
    queryFn: async () => {
      if (!fileId) throw new Error("file_id is required");

      const response = await fetch('/api/data/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to validate data');
      }

      return response.json();
    },
    enabled: !!fileId,
    staleTime: 0,
    cacheTime: 10 * 60 * 1000,
    retry: 1,
  });
}
```

#### `useDataCommit`

**파일 경로**: `src/hooks/api/useDataCommit.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

type CommitPayload = {
  file_id: string;
  duplicate_action: 'skip' | 'upsert';
};

export function useDataCommit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CommitPayload) => {
      const response = await fetch('/api/data/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to commit data');
      }

      return response.json();
    },
    onSuccess: () => {
      // 대시보드 캐시 무효화
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['data-browse']);
    },
  });
}
```

---

## 7. 구현 상세

### 7.1 페이지 컴포넌트 구조

**파일 경로**: `src/app/data/validation/page.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ValidationSummary } from './_components/validation-summary';
import { ErrorTable } from './_components/error-table';
import { DuplicateSection } from './_components/duplicate-section';
import { DataPreview } from './_components/data-preview';
import { ActionButtons } from './_components/action-buttons';
import { useDataValidation } from '@/hooks/api/useDataValidation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';

export default function DataValidationPage() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get('file_id');

  const { data, isLoading, error } = useDataValidation(fileId);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>검증 실패</AlertTitle>
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold">데이터 검증 결과</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            <p>파일명: {data.file_name}</p>
            <p>데이터 유형: {data.data_type}</p>
            <p>업로드 시각: {new Date(data.uploaded_at).toLocaleString('ko-KR')}</p>
          </div>
        </div>

        {/* 검증 통계 */}
        <ValidationSummary validation={data.validation} />

        {/* 오류 상세 테이블 (조건부) */}
        {data.validation.errorRecords > 0 && (
          <ErrorTable errors={data.validation.errors} />
        )}

        {/* 중복 데이터 섹션 (조건부) */}
        {data.validation.warningRecords > 0 && (
          <DuplicateSection duplicates={data.validation.duplicates} />
        )}

        {/* 데이터 미리보기 */}
        <DataPreview
          preview={data.validation.preview}
          errors={data.validation.errors}
          duplicates={data.validation.duplicates}
        />

        {/* 액션 버튼 */}
        <ActionButtons
          fileId={data.file_id}
          hasErrors={data.validation.errorRecords > 0}
          validRecords={data.validation.validRecords}
        />
      </div>
    </DashboardLayout>
  );
}
```

### 7.2 섹션 컴포넌트

#### 7.2.1 ValidationSummary

**파일 경로**: `src/app/data/validation/_components/validation-summary.tsx`

```typescript
import { KPICard } from '@/components/dashboard/kpi-card';
import { FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

type ValidationSummaryProps = {
  validation: {
    totalRecords: number;
    validRecords: number;
    errorRecords: number;
    warningRecords: number;
  };
};

export function ValidationSummary({ validation }: ValidationSummaryProps) {
  const { totalRecords, validRecords, errorRecords, warningRecords } = validation;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="총 레코드"
        value={`${totalRecords.toLocaleString()}건`}
        icon={FileText}
        description="CSV 파일 전체 행"
        variant="default"
      />

      <KPICard
        title="유효 레코드"
        value={`${validRecords.toLocaleString()}건`}
        icon={CheckCircle}
        description="검증 통과"
        variant="success"
      />

      <KPICard
        title="오류 레코드"
        value={`${errorRecords.toLocaleString()}건`}
        icon={XCircle}
        description="필수 필드 누락 등"
        variant={errorRecords > 0 ? "destructive" : "default"}
      />

      <KPICard
        title="경고 레코드"
        value={`${warningRecords.toLocaleString()}건`}
        icon={AlertTriangle}
        description="중복 데이터"
        variant={warningRecords > 0 ? "warning" : "default"}
      />
    </div>
  );
}
```

#### 7.2.2 ErrorTable

**파일 경로**: `src/app/data/validation/_components/error-table.tsx`

```typescript
import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadCSV } from '@/lib/utils/download';

type ErrorTableProps = {
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }>;
};

export function ErrorTable({ errors }: ErrorTableProps) {
  const handleDownloadErrors = () => {
    const csv = [
      ['행 번호', '필드명', '오류 내용', '현재 값'],
      ...errors.map((err) => [
        err.row,
        err.field,
        err.message,
        err.value ?? '',
      ]),
    ];

    downloadCSV(csv, `errors_${Date.now()}.csv`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-destructive">오류 상세</CardTitle>
          <CardDescription>
            {errors.length}건의 오류가 발견되었습니다. 데이터를 수정한 후 다시 업로드해주세요.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadErrors}
        >
          <Download className="mr-2 h-4 w-4" />
          오류 데이터 다운로드
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>행 번호</TableHead>
              <TableHead>필드명</TableHead>
              <TableHead>오류 내용</TableHead>
              <TableHead>현재 값</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.slice(0, 20).map((error, idx) => (
              <TableRow key={idx}>
                <TableCell>{error.row}</TableCell>
                <TableCell className="font-medium">{error.field}</TableCell>
                <TableCell className="text-destructive">{error.message}</TableCell>
                <TableCell className="font-mono text-sm">
                  {String(error.value ?? 'NULL')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {errors.length > 20 && (
          <p className="mt-4 text-sm text-muted-foreground text-center">
            ... 외 {errors.length - 20}건 (CSV 다운로드로 전체 확인)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 7.2.3 DuplicateSection

**파일 경로**: `src/app/data/validation/_components/duplicate-section.tsx`

```typescript
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type DuplicateSectionProps = {
  duplicates: Array<{
    identifier: string | Record<string, any>;
    existingData: Record<string, any>;
    newData: Record<string, any>;
  }>;
};

export function DuplicateSection({ duplicates }: DuplicateSectionProps) {
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'upsert'>('skip');

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">중복 데이터 발견</CardTitle>
        <CardDescription>
          {duplicates.length}건의 중복 데이터가 발견되었습니다. 처리 방법을 선택하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={duplicateAction} onValueChange={setDuplicateAction as any}>
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="skip" id="skip" />
            <div className="space-y-1">
              <Label htmlFor="skip" className="font-medium cursor-pointer">
                중복 데이터 제외하고 적재 (권장)
              </Label>
              <p className="text-sm text-muted-foreground">
                기존 데이터를 유지하고, 중복 {duplicates.length}건은 제외합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <RadioGroupItem value="upsert" id="upsert" />
            <div className="space-y-1">
              <Label htmlFor="upsert" className="font-medium cursor-pointer">
                중복 데이터로 기존 데이터 덮어쓰기
              </Label>
              <p className="text-sm text-muted-foreground">
                기존 데이터를 새로운 데이터로 업데이트합니다. (중복 {duplicates.length}건 갱신)
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
```

#### 7.2.4 ActionButtons

**파일 경로**: `src/app/data/validation/_components/action-buttons.tsx`

```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useDataCommit } from '@/hooks/api/useDataCommit';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Upload, X } from 'lucide-react';

type ActionButtonsProps = {
  fileId: string;
  hasErrors: boolean;
  validRecords: number;
};

export function ActionButtons({ fileId, hasErrors, validRecords }: ActionButtonsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const commitMutation = useDataCommit();

  const handleCommit = async () => {
    try {
      const result = await commitMutation.mutateAsync({
        file_id: fileId,
        duplicate_action: 'skip', // DuplicateSection에서 선택한 값 전달
      });

      toast({
        title: "적재 완료",
        description: `${result.rows_processed.toLocaleString()}건의 데이터가 적재되었습니다.`,
        variant: "default",
      });

      router.push('/data/browse?recent=true');
    } catch (error: any) {
      toast({
        title: "적재 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => router.push('/data/upload')}
        >
          <X className="mr-2 h-4 w-4" />
          취소
        </Button>

        <Button
          variant="secondary"
          onClick={() => router.push('/data/upload')}
        >
          <Upload className="mr-2 h-4 w-4" />
          수정 후 재업로드
        </Button>

        <Button
          variant="default"
          disabled={hasErrors || commitMutation.isPending}
          onClick={() => setShowConfirmDialog(true)}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {commitMutation.isPending
            ? '적재 중...'
            : `적재 승인 (${validRecords.toLocaleString()}건)`}
        </Button>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>데이터 적재 확인</DialogTitle>
            <DialogDescription>
              {validRecords.toLocaleString()}건의 데이터를 데이터베이스에 적재하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCommit} disabled={commitMutation.isPending}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### 7.3 API Routes (Hono)

#### 7.3.1 검증 API

**파일 경로**: `src/features/data-validation/backend/route.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import { parseCSVFile, parseXLSXFile } from '@/lib/utils/file-parser';
import { validateData } from '../lib/validator';
import { checkDuplicates } from '../lib/duplicate-checker';

const validateRequestSchema = z.object({
  file_id: z.string().uuid(),
});

export function registerDataValidationRoutes(app: Hono<AppEnv>) {
  const dataValidation = new Hono<AppEnv>();

  // POST /api/data/validate
  dataValidation.post('/validate', zValidator('json', validateRequestSchema), async (c) => {
    const { file_id } = c.req.valid('json');
    const supabase = getSupabaseServiceClient();

    // 1. upload_logs에서 파일 정보 조회
    const { data: uploadLog, error: logError } = await supabase
      .from('upload_logs')
      .select('*')
      .eq('id', file_id)
      .single();

    if (logError || !uploadLog) {
      return c.json({ error: 'File not found' }, 404);
    }

    // 2. Supabase Storage에서 파일 다운로드
    const { data: fileData, error: storageError } = await supabase
      .storage
      .from('temp-uploads')
      .download(uploadLog.file_path);

    if (storageError || !fileData) {
      return c.json({ error: 'Failed to download file' }, 500);
    }

    // 3. 파일 파싱
    let parsedData: Record<string, any>[];

    if (uploadLog.file_type === 'text/csv') {
      parsedData = await parseCSVFile(fileData);
    } else if (uploadLog.file_type.includes('spreadsheet')) {
      parsedData = await parseXLSXFile(fileData);
    } else {
      return c.json({ error: 'Unsupported file type' }, 400);
    }

    // 4. 데이터 검증
    const validationResult = await validateData(
      parsedData,
      uploadLog.data_type
    );

    // 5. 중복 검사
    const duplicates = await checkDuplicates(
      validationResult.validRows,
      uploadLog.data_type,
      supabase
    );

    // 6. 미리보기 데이터 (최대 100행)
    const preview = parsedData.slice(0, 100).map((row, idx) => {
      const rowErrors = validationResult.errors.filter((e) => e.row === idx + 1);
      const isDuplicate = duplicates.some((d) => d.rowIndex === idx + 1);

      return {
        _row: idx + 1,
        _errors: rowErrors.length > 0 ? rowErrors : null,
        _duplicate: isDuplicate,
        ...row,
      };
    });

    // 7. upload_logs 상태 업데이트
    await supabase
      .from('upload_logs')
      .update({ status: 'validated' })
      .eq('id', file_id);

    return c.json({
      file_id,
      file_name: uploadLog.file_name,
      file_size: uploadLog.file_size,
      data_type: uploadLog.data_type,
      uploaded_at: uploadLog.created_at,

      validation: {
        totalRecords: parsedData.length,
        validRecords: validationResult.validRows.length,
        errorRecords: validationResult.errors.length,
        warningRecords: duplicates.length,

        errors: validationResult.errors,
        duplicates,
        preview,
      },
    });
  });

  app.route('/data', dataValidation);
}
```

---

## 8. 검증 로직

### 8.1 데이터 검증 함수

**파일 경로**: `src/features/data-validation/lib/validator.ts`

```typescript
import { DepartmentKPISchema, PublicationSchema } from '../schemas';
import type { DataType } from '@/types/data-validation';

export async function validateData(
  data: Record<string, any>[],
  dataType: DataType
) {
  const errors: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }> = [];

  const validRows: Record<string, any>[] = [];

  // 데이터 유형별 스키마 선택
  const schema = getSchemaForDataType(dataType);

  data.forEach((row, idx) => {
    const rowNumber = idx + 1;
    const result = schema.safeParse(row);

    if (!result.success) {
      // Zod 에러를 사용자 친화적인 메시지로 변환
      result.error.errors.forEach((err) => {
        errors.push({
          row: rowNumber,
          field: err.path.join('.'),
          message: err.message,
          value: row[err.path[0]],
        });
      });
    } else {
      validRows.push(result.data);
    }
  });

  return { errors, validRows };
}

function getSchemaForDataType(dataType: DataType) {
  switch (dataType) {
    case 'department_kpi':
      return DepartmentKPISchema;
    case 'publication_list':
      return PublicationSchema;
    // ... 기타 데이터 유형
    default:
      throw new Error(`Unsupported data type: ${dataType}`);
  }
}
```

### 8.2 중복 검사 함수

**파일 경로**: `src/features/data-validation/lib/duplicate-checker.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataType } from '@/types/data-validation';

export async function checkDuplicates(
  validRows: Record<string, any>[],
  dataType: DataType,
  supabase: SupabaseClient
) {
  const duplicates: Array<{
    rowIndex: number;
    identifier: any;
    existingData: Record<string, any>;
    newData: Record<string, any>;
  }> = [];

  // 데이터 유형별 고유 식별자 추출
  const identifiers = extractIdentifiers(validRows, dataType);

  // DB에서 기존 데이터 조회
  const existingData = await fetchExistingData(identifiers, dataType, supabase);

  validRows.forEach((row, idx) => {
    const identifier = getIdentifier(row, dataType);
    const existing = existingData.find((e) => matchesIdentifier(e, identifier, dataType));

    if (existing) {
      duplicates.push({
        rowIndex: idx + 1,
        identifier,
        existingData: existing,
        newData: row,
      });
    }
  });

  return duplicates;
}

function getIdentifier(row: Record<string, any>, dataType: DataType) {
  switch (dataType) {
    case 'department_kpi':
      return {
        evaluation_year: row.평가년도,
        college_name: row.단과대학,
        department_name: row.학과,
      };
    case 'publication_list':
      return row.논문ID;
    // ... 기타 데이터 유형
  }
}
```

---

## 9. 성능 최적화

### 9.1 파일 파싱 최적화

- **스트리밍 파싱**: 대용량 CSV는 스트림으로 파싱
- **워커 스레드**: Web Worker로 파싱 작업 분리 (선택 사항)
- **청킹**: 1000행 단위로 분할 처리

### 9.2 검증 최적화

- **배치 검증**: 1000행 단위로 Zod 검증
- **병렬 처리**: 스키마 검증과 중복 검사 병렬 실행
- **인덱스 활용**: DB 중복 검사 시 인덱스 활용

### 9.3 렌더링 최적화

- **가상화**: 미리보기 테이블 가상화 (react-window)
- **메모이제이션**: 컴포넌트 React.memo 적용
- **지연 로딩**: 오류 테이블은 접을 수 있도록 Accordion 사용

---

## 10. 에러 핸들링

### 10.1 API 에러 처리

```typescript
const { data, error, isError } = useDataValidation(fileId);

if (isError) {
  return (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle>검증 실패</AlertTitle>
      <AlertDescription>
        {error.message}
        <Button variant="link" onClick={() => router.push('/data/upload')}>
          업로드 페이지로 돌아가기
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

### 10.2 파일 파싱 에러

- CSV 인코딩 오류: UTF-8 변환 시도
- 컬럼 누락: 필수 컬럼 검증
- 데이터 형식 오류: 명확한 에러 메시지

### 10.3 DB 적재 에러

- 트랜잭션 실패: 자동 롤백
- 외래키 제약 위반: 에러 메시지 표시
- 타임아웃: 배치 크기 조정 안내

---

## 11. 테스트 시나리오

### 11.1 기능 테스트

#### TC-001: 검증 성공 (오류 없음)
- **전제 조건**: 유효한 CSV 파일 업로드 완료
- **테스트 단계**:
  1. /data/validation?file_id={id} 접근
  2. 검증 통계 확인 (오류 0건)
  3. 미리보기 테이블 확인
  4. 적재 승인 버튼 활성화 확인
- **예상 결과**: 오류 없이 적재 승인 가능

#### TC-002: 스키마 검증 실패
- **전제 조건**: 필수 필드 누락된 CSV
- **테스트 단계**:
  1. 검증 페이지 로드
  2. 오류 레코드 수 확인
  3. 오류 상세 테이블 표시 확인
  4. 적재 승인 버튼 비활성화 확인
- **예상 결과**: 오류 상세 표시, 적재 차단

#### TC-003: 중복 데이터 처리
- **전제 조건**: 중복 데이터 포함 CSV
- **테스트 단계**:
  1. 중복 섹션 표시 확인
  2. 중복 처리 옵션 선택
  3. 적재 승인
- **예상 결과**: 선택한 옵션대로 적재

#### TC-004: DB 적재 성공
- **전제 조건**: 검증 통과
- **테스트 단계**:
  1. 적재 승인 버튼 클릭
  2. 확인 모달 표시 확인
  3. 확인 클릭
  4. 로딩 인디케이터 표시
  5. 성공 토스트 메시지
  6. /data/browse로 리다이렉트
- **예상 결과**: 데이터 적재 성공

---

## 부록

### A. 파일 구조

```
src/
├── app/
│   └── data/
│       └── validation/
│           ├── page.tsx
│           └── _components/
│               ├── validation-summary.tsx
│               ├── error-table.tsx
│               ├── duplicate-section.tsx
│               ├── data-preview.tsx
│               └── action-buttons.tsx
├── features/
│   └── data-validation/
│       ├── backend/
│       │   └── route.ts
│       ├── lib/
│       │   ├── validator.ts
│       │   ├── duplicate-checker.ts
│       │   └── file-parser.ts
│       └── schemas/
│           ├── kpi-schema.ts
│           ├── publication-schema.ts
│           ├── research-project-schema.ts
│           └── student-schema.ts
├── hooks/
│   └── api/
│       ├── useDataValidation.ts
│       └── useDataCommit.ts
└── types/
    └── data-validation.ts
```

### B. 타입 정의

```typescript
// src/types/data-validation.ts

export type DataType =
  | 'department_kpi'
  | 'publication_list'
  | 'research_project_data'
  | 'student_roster';

export type ValidationError = {
  row: number;
  field: string;
  message: string;
  value: any;
};

export type DuplicateRecord = {
  rowIndex: number;
  identifier: any;
  existingData: Record<string, any>;
  newData: Record<string, any>;
};

export type ValidationResult = {
  file_id: string;
  file_name: string;
  file_size: number;
  data_type: DataType;
  uploaded_at: string;

  validation: {
    totalRecords: number;
    validRecords: number;
    errorRecords: number;
    warningRecords: number;

    errors: ValidationError[];
    duplicates: DuplicateRecord[];
    preview: Record<string, any>[];
  };
};
```

### C. 참고 문서

- [PRD v1.0](/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/prd.md)
- [Userflow v1.0](/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/userflow.md)
- [Database Design v2.0](/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/database.md)
- [Common Modules v1.0](/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/common-modules.md)
- [UC-003: 데이터 파일 업로드 및 검증](/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/usecases/3-data-upload/spec.md)
- [UC-004: 데이터 DB 적재 및 관리](/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/usecases/4-data-loading/spec.md)
- [UC-007: 에러 핸들링](/Users/leo/awesomedev/vmc1/vibe-dashboard-2/docs/usecases/7-error-handling/spec.md)

---

**문서 종료**

이 데이터 검증 페이지 구현 계획은 PRD, Userflow, Database, Common Modules, 관련 유스케이스 문서를 기반으로 작성되었습니다. 모든 구현은 기존 코드베이스 구조를 준수하며, DRY 원칙을 철저히 따릅니다.
