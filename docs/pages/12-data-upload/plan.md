# Implementation Plan: 파일 업로드 페이지
# /data/upload

**페이지 경로:** `/data/upload`
**접근 권한:** Administrator Only
**버전:** 1.0
**작성일:** 2025-11-02

---

## 목차

1. [개요](#1-개요)
2. [페이지 구조 분석](#2-페이지-구조-분석)
3. [상태 관리 설계](#3-상태-관리-설계)
4. [컴포넌트 구조](#4-컴포넌트-구조)
5. [API 설계](#5-api-설계)
6. [데이터 플로우](#6-데이터-플로우)
7. [파일 검증 로직](#7-파일-검증-로직)
8. [에러 핸들링](#8-에러-핸들링)
9. [구현 단계](#9-구현-단계)
10. [테스트 계획](#10-테스트-계획)

---

## 1. 개요

### 1.1 페이지 목적

관리자가 Ecount에서 추출한 CSV/XLSX 파일을 시스템에 업로드하여 데이터베이스에 적재할 수 있는 인터페이스를 제공합니다.

### 1.2 주요 기능

1. **드래그앤드롭 파일 업로드**: 직관적인 파일 선택
2. **데이터 유형 선택**: 학과KPI, 논문, 연구과제, 학생명단
3. **파일 검증**: 형식, 크기, MIME 타입 검증
4. **업로드 진행률 표시**: 실시간 진행률 피드백
5. **Supabase Storage 저장**: 임시 파일 저장
6. **자동 검증 페이지 이동**: 업로드 완료 후 자동 리다이렉트

### 1.3 기술 스택

**Frontend:**
- Next.js 15 App Router
- React 19
- TypeScript 5
- Shadcn UI (드롭존, 셀렉트, 버튼)
- React Hook Form + Zod (폼 검증)
- React Query (업로드 상태 관리)

**Backend:**
- Hono API Routes
- Supabase Storage (파일 저장)
- Clerk (인증 및 권한)
- PostgreSQL (upload_logs 테이블)

---

## 2. 페이지 구조 분석

### 2.1 URL 구조

```
/data/upload
```

**쿼리 파라미터:** 없음

### 2.2 레이아웃

```
┌─────────────────────────────────────────────────┐
│ Header (공통)                                   │
├───────────┬─────────────────────────────────────┤
│ Sidebar   │ Main Content                        │
│ (공통)    │                                     │
│           │ ┌─────────────────────────────────┐ │
│           │ │ 파일 업로드                     │ │
│           │ ├─────────────────────────────────┤ │
│           │ │ 데이터 유형 선택 [드롭다운]    │ │
│           │ │                                 │ │
│           │ │ ┌─────────────────────────────┐ │ │
│           │ │ │ 드래그앤드롭 영역           │ │ │
│           │ │ │ "파일을 드래그하거나..."    │ │ │
│           │ │ │ 최대 10MB                   │ │ │
│           │ │ └─────────────────────────────┘ │ │
│           │ │                                 │ │
│           │ │ [선택된 파일 정보]             │ │
│           │ │ - 파일명: example.csv          │ │
│           │ │ - 크기: 2.3 MB                 │ │
│           │ │                                 │ │
│           │ │ [업로드 진행률]                │ │
│           │ │ ████████░░ 75%                 │ │
│           │ │                                 │ │
│           │ │ [업로드] [취소]                │ │
│           │ └─────────────────────────────────┘ │
└───────────┴─────────────────────────────────────┘
```

### 2.3 권한 요구사항

- **인증 상태:** 필수 (Clerk)
- **역할:** `administrator` (RBAC)
- **권한 검증:** Middleware + API Route

---

## 3. 상태 관리 설계

### 3.1 로컬 상태 (React Hook Form)

```typescript
// src/app/(protected)/data/upload/page.tsx
type UploadFormData = {
  dataType: DataType;
  file: File | null;
};

type DataType =
  | 'department_kpi'
  | 'publication_list'
  | 'research_project_data'
  | 'student_roster';
```

### 3.2 업로드 상태 (React Query)

```typescript
// src/features/data-upload/hooks/useFileUpload.ts
import { useMutation } from '@tanstack/react-query';

type UploadState = {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number; // 0-100
  fileId?: string;
  error?: string;
};
```

### 3.3 전역 상태

**사용하지 않음** - 페이지 단위 로컬 상태로 충분

---

## 4. 컴포넌트 구조

### 4.1 파일 구조

```
src/
├── app/
│   └── (protected)/
│       └── data/
│           └── upload/
│               └── page.tsx          # 메인 페이지 컴포넌트
│
├── features/
│   └── data-upload/
│       ├── components/
│       │   ├── data-type-selector.tsx   # 데이터 유형 선택
│       │   ├── file-dropzone.tsx        # 드래그앤드롭 영역
│       │   ├── file-info-card.tsx       # 선택된 파일 정보
│       │   └── upload-progress.tsx      # 진행률 표시
│       │
│       ├── hooks/
│       │   └── useFileUpload.ts         # 업로드 로직
│       │
│       ├── lib/
│       │   ├── validation.ts            # 클라이언트 검증
│       │   └── types.ts                 # 타입 정의
│       │
│       └── backend/
│           ├── route.ts                 # Hono API Routes
│           ├── schema.ts                # Zod 스키마
│           └── storage.ts               # Supabase Storage 로직
│
└── lib/
    └── supabase/
        └── storage-client.ts            # Storage Client 유틸리티
```

### 4.2 컴포넌트 상세 설계

#### 4.2.1 DataTypeSelector

```typescript
// src/features/data-upload/components/data-type-selector.tsx
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { DataType } from '../lib/types';

type DataTypeSelectorProps = {
  value: DataType | null;
  onChange: (value: DataType) => void;
};

const DATA_TYPE_OPTIONS = [
  { value: 'department_kpi', label: '학과 KPI' },
  { value: 'publication_list', label: '논문 게재 목록' },
  { value: 'research_project_data', label: '연구과제 데이터' },
  { value: 'student_roster', label: '학생 명부' },
] as const;

export function DataTypeSelector({ value, onChange }: DataTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="data-type">데이터 유형</Label>
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger id="data-type">
          <SelectValue placeholder="데이터 유형을 선택하세요" />
        </SelectTrigger>
        <SelectContent>
          {DATA_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

#### 4.2.2 FileDropzone

```typescript
// src/features/data-upload/components/file-dropzone.tsx
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFile } from '../lib/validation';

type FileDropzoneProps = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileDropzone({ onFileSelect, disabled }: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const validation = validateFile(file);

    if (!validation.success) {
      // 에러 토스트 표시
      return;
    }

    onFileSelect(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive && 'border-primary bg-primary/5',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      {isDragActive ? (
        <p className="text-sm">파일을 여기에 놓으세요...</p>
      ) : (
        <>
          <p className="text-sm font-medium mb-1">
            CSV 또는 XLSX 파일을 드래그하거나 클릭하여 선택하세요
          </p>
          <p className="text-xs text-muted-foreground">최대 10MB</p>
        </>
      )}
    </div>
  );
}
```

#### 4.2.3 FileInfoCard

```typescript
// src/features/data-upload/components/file-info-card.tsx
'use client';

import { File, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils/number';

type FileInfoCardProps = {
  file: File;
  onRemove: () => void;
};

export function FileInfoCard({ file, onRemove }: FileInfoCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <File className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### 4.2.4 UploadProgress

```typescript
// src/features/data-upload/components/upload-progress.tsx
'use client';

import { Progress } from '@/components/ui/progress';

type UploadProgressProps = {
  progress: number; // 0-100
};

export function UploadProgress({ progress }: UploadProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">업로드 중...</span>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
}
```

### 4.3 메인 페이지 컴포넌트

```typescript
// src/app/(protected)/data/upload/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTypeSelector } from '@/features/data-upload/components/data-type-selector';
import { FileDropzone } from '@/features/data-upload/components/file-dropzone';
import { FileInfoCard } from '@/features/data-upload/components/file-info-card';
import { UploadProgress } from '@/features/data-upload/components/upload-progress';
import { useFileUpload } from '@/features/data-upload/hooks/useFileUpload';
import { showErrorToast, showSuccessToast } from '@/lib/errors/toast';
import type { DataType } from '@/features/data-upload/lib/types';

export default function DataUploadPage() {
  const router = useRouter();
  const [dataType, setDataType] = useState<DataType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { mutate: uploadFile, isPending, progress } = useFileUpload({
    onSuccess: (data) => {
      showSuccessToast('파일 업로드 완료');
      router.push(`/data/validation?file_id=${data.fileId}`);
    },
    onError: (error) => {
      showErrorToast(error, '파일 업로드 실패');
    },
  });

  const handleUpload = () => {
    if (!dataType || !selectedFile) return;

    uploadFile({
      file: selectedFile,
      dataType,
    });
  };

  const canUpload = dataType && selectedFile && !isPending;

  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>파일 업로드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <DataTypeSelector value={dataType} onChange={setDataType} />

          {!selectedFile ? (
            <FileDropzone
              onFileSelect={setSelectedFile}
              disabled={isPending}
            />
          ) : (
            <FileInfoCard
              file={selectedFile}
              onRemove={() => setSelectedFile(null)}
            />
          )}

          {isPending && <UploadProgress progress={progress} />}

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!canUpload}
            >
              업로드
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDataType(null);
                setSelectedFile(null);
              }}
              disabled={isPending}
            >
              취소
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 5. API 설계

### 5.1 Hono Route 구조

```typescript
// src/features/data-upload/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { uploadFileSchema } from './schema';
import { uploadFileToStorage, createUploadLog } from './storage';
import { requirePermission } from '@/lib/auth/rbac';

export function registerDataUploadRoutes(app: Hono<AppEnv>) {
  const upload = new Hono<AppEnv>();

  upload.post(
    '/',
    zValidator('form', uploadFileSchema),
    async (c) => {
      // 1. 권한 확인
      await requirePermission('data:upload');

      // 2. FormData 파싱
      const { file, dataType } = c.req.valid('form');

      // 3. 파일 검증
      if (file.size > 10 * 1024 * 1024) {
        return c.json({ error: 'File size exceeds 10MB' }, 413);
      }

      // 4. Supabase Storage 업로드
      const { filePath, error: storageError } = await uploadFileToStorage(
        file,
        c.get('userId')
      );

      if (storageError) {
        return c.json({ error: storageError }, 500);
      }

      // 5. upload_logs 테이블 기록
      const { fileId, error: logError } = await createUploadLog({
        userId: c.get('userId'),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        dataType,
        filePath,
        status: 'uploaded',
      });

      if (logError) {
        return c.json({ error: logError }, 500);
      }

      // 6. 성공 응답
      return c.json({
        fileId,
        fileName: file.name,
        fileSize: file.size,
      });
    }
  );

  app.route('/data/upload', upload);
}
```

### 5.2 Zod 스키마

```typescript
// src/features/data-upload/backend/schema.ts
import { z } from 'zod';

export const uploadFileSchema = z.object({
  file: z.instanceof(File),
  dataType: z.enum([
    'department_kpi',
    'publication_list',
    'research_project_data',
    'student_roster',
  ]),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
```

### 5.3 Supabase Storage 로직

```typescript
// src/features/data-upload/backend/storage.ts
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const BUCKET_NAME = 'temp-uploads';

export async function uploadFileToStorage(
  file: File,
  userId: string
): Promise<{ filePath?: string; error?: string }> {
  const supabase = getSupabaseServiceClient();

  // 파일 경로: temp-uploads/{userId}/{timestamp}_{filename}
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}_${file.name}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    return { error: error.message };
  }

  return { filePath };
}

export async function createUploadLog(params: {
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataType: string;
  filePath: string;
  status: string;
}): Promise<{ fileId?: string; error?: string }> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('upload_logs')
    .insert({
      user_id: params.userId,
      file_name: params.fileName,
      file_type: params.fileType,
      file_size: params.fileSize,
      data_type: params.dataType,
      status: params.status,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Upload log error:', error);
    return { error: error.message };
  }

  return { fileId: data.id };
}
```

---

## 6. 데이터 플로우

### 6.1 업로드 플로우

```
[사용자 액션]
    ↓
1. 데이터 유형 선택 (dataType 상태 업데이트)
    ↓
2. 파일 선택 (드래그앤드롭 또는 클릭)
    ↓
3. 클라이언트 검증 (validateFile)
    - 파일 확장자: .csv, .xlsx
    - 파일 크기: ≤ 10MB
    - MIME 타입 검증
    ↓
4. "업로드" 버튼 클릭
    ↓
5. React Query Mutation 실행 (useFileUpload)
    ↓
6. POST /api/hono/data/upload (FormData)
    ↓
7. Hono Middleware
    - Clerk 인증 확인
    - 권한 검증 (requirePermission)
    ↓
8. 파일 검증 (서버 사이드)
    - 매직 바이트 검증
    - 파일 크기 재확인
    ↓
9. Supabase Storage 업로드
    - 경로: temp-uploads/{userId}/{timestamp}_{filename}
    ↓
10. upload_logs 테이블 INSERT
    - status: 'uploaded'
    ↓
11. 성공 응답 { fileId }
    ↓
12. React Query onSuccess
    - 성공 토스트 메시지
    - 자동 리다이렉트: /data/validation?file_id={fileId}
```

### 6.2 진행률 추적

```typescript
// src/features/data-upload/hooks/useFileUpload.ts
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

export function useFileUpload(options?: {
  onSuccess?: (data: { fileId: string }) => void;
  onError?: (error: Error) => void;
}) {
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async ({ file, dataType }: { file: File; dataType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataType', dataType);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/hono/data/upload');
        xhr.send(formData);
      });
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return {
    ...mutation,
    progress,
  };
}
```

---

## 7. 파일 검증 로직

### 7.1 클라이언트 검증

```typescript
// src/features/data-upload/lib/validation.ts
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type ValidationResult = {
  success: boolean;
  error?: string;
};

export function validateFile(file: File): ValidationResult {
  // 1. 파일 확장자 검증
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      success: false,
      error: 'CSV 또는 XLSX 파일만 업로드 가능합니다.',
    };
  }

  // 2. 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `파일 크기는 10MB 이하여야 합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    };
  }

  // 3. MIME 타입 검증
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: '유효하지 않은 파일 형식입니다.',
    };
  }

  return { success: true };
}
```

### 7.2 서버 검증 (매직 바이트)

```typescript
// src/features/data-upload/lib/magic-bytes.ts
const MAGIC_BYTES = {
  csv: [0x2c], // ','
  xlsx: [0x50, 0x4b, 0x03, 0x04], // 'PK..'
};

export async function validateMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // CSV 체크 (간단히 콤마 존재 여부)
  if (file.type === 'text/csv') {
    return true; // CSV는 매직 바이트가 명확하지 않아 생략
  }

  // XLSX 체크 (ZIP 파일 형식)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return true;
  }

  return false;
}
```

---

## 8. 에러 핸들링

### 8.1 클라이언트 에러

| 에러 상황 | 처리 방법 |
|----------|----------|
| 파일 형식 불일치 | 드롭존에서 즉시 차단, 에러 토스트 표시 |
| 파일 크기 초과 | 드롭존에서 즉시 차단, 에러 토스트 표시 |
| 데이터 유형 미선택 | 업로드 버튼 비활성화 |
| 파일 미선택 | 업로드 버튼 비활성화 |

### 8.2 서버 에러

| HTTP 상태 | 에러 상황 | 사용자 메시지 |
|----------|----------|-------------|
| 401 | 인증 실패 | "로그인이 필요합니다." |
| 403 | 권한 없음 | "접근 권한이 없습니다. 관리자만 파일 업로드가 가능합니다." |
| 413 | 파일 크기 초과 | "파일 크기는 10MB 이하여야 합니다." |
| 507 | Storage 용량 부족 | "저장 공간이 부족합니다. 시스템 관리자에게 문의하세요." |
| 500 | 서버 에러 | "파일 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." |

### 8.3 에러 핸들링 코드

```typescript
// React Query onError
onError: (error) => {
  if (error instanceof Error) {
    showErrorToast(error, '파일 업로드 실패');
  }
}
```

---

## 9. 구현 단계

### Phase 1: 기본 구조 (1-2일)

1. **페이지 파일 생성**
   - `src/app/(protected)/data/upload/page.tsx`

2. **타입 정의**
   - `src/features/data-upload/lib/types.ts`

3. **공통 컴포넌트 재사용**
   - Shadcn UI: Card, Button, Select, Progress

4. **권한 검증**
   - Middleware에서 administrator 확인

### Phase 2: 파일 업로드 UI (2-3일)

1. **DataTypeSelector 컴포넌트**
   - Shadcn Select 사용

2. **FileDropzone 컴포넌트**
   - `react-dropzone` 설치 및 통합
   - 드래그앤드롭 UI 구현

3. **FileInfoCard 컴포넌트**
   - 선택된 파일 정보 표시

4. **UploadProgress 컴포넌트**
   - Shadcn Progress 사용

### Phase 3: API 통합 (2-3일)

1. **Hono Route 구현**
   - `src/features/data-upload/backend/route.ts`
   - Zod 스키마 검증

2. **Supabase Storage 통합**
   - `src/features/data-upload/backend/storage.ts`
   - 파일 업로드 로직
   - upload_logs 테이블 INSERT

3. **React Query Hook**
   - `src/features/data-upload/hooks/useFileUpload.ts`
   - XHR 진행률 추적

### Phase 4: 검증 및 에러 처리 (1-2일)

1. **클라이언트 검증**
   - `src/features/data-upload/lib/validation.ts`

2. **에러 핸들링**
   - 에러 토스트 메시지
   - 에러 상태 UI

3. **성공 플로우**
   - 검증 페이지 자동 리다이렉트

### Phase 5: 테스트 및 최적화 (1-2일)

1. **단위 테스트**
   - 검증 로직 테스트

2. **통합 테스트**
   - 파일 업로드 E2E 테스트

3. **성능 최적화**
   - 대용량 파일 처리 개선

**총 예상 기간:** 7-12일

---

## 10. 테스트 계획

### 10.1 단위 테스트

```typescript
// src/features/data-upload/lib/__tests__/validation.test.ts
import { validateFile } from '../validation';

describe('validateFile', () => {
  it('should accept valid CSV file', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const result = validateFile(file);
    expect(result.success).toBe(true);
  });

  it('should reject file size over 10MB', () => {
    const file = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.csv', {
      type: 'text/csv',
    });
    const result = validateFile(file);
    expect(result.success).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('should reject invalid file type', () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const result = validateFile(file);
    expect(result.success).toBe(false);
    expect(result.error).toContain('CSV 또는 XLSX');
  });
});
```

### 10.2 통합 테스트

```typescript
// src/features/data-upload/__tests__/upload-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataUploadPage from '@/app/(protected)/data/upload/page';

describe('DataUploadPage', () => {
  it('should upload file and redirect to validation', async () => {
    render(<DataUploadPage />);

    // 데이터 유형 선택
    const dataTypeSelect = screen.getByLabelText('데이터 유형');
    await userEvent.selectOptions(dataTypeSelect, 'department_kpi');

    // 파일 선택
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/드래그/);
    await userEvent.upload(input, file);

    // 업로드 버튼 클릭
    const uploadButton = screen.getByRole('button', { name: '업로드' });
    await userEvent.click(uploadButton);

    // 성공 후 리다이렉트 확인
    await waitFor(() => {
      expect(window.location.pathname).toBe('/data/validation');
    });
  });
});
```

### 10.3 수동 테스트 체크리스트

- [ ] 관리자 계정으로 로그인
- [ ] `/data/upload` 페이지 접근 가능
- [ ] 데이터 유형 4가지 모두 선택 가능
- [ ] CSV 파일 드래그앤드롭 성공
- [ ] XLSX 파일 클릭 선택 성공
- [ ] 10MB 초과 파일 업로드 차단
- [ ] PDF 파일 업로드 차단
- [ ] 업로드 진행률 정상 표시
- [ ] 업로드 성공 시 검증 페이지 이동
- [ ] 에러 토스트 메시지 정상 표시
- [ ] 일반 사용자 접근 시 403 에러
- [ ] Supabase Storage에 파일 저장 확인
- [ ] upload_logs 테이블에 레코드 생성 확인

---

## 11. 주의사항 및 제약사항

### 11.1 기술적 제약사항

1. **파일 크기 제한:** 10MB (Vercel 제한 고려)
2. **동시 업로드:** 1개 파일만 (다중 업로드 미지원)
3. **브라우저 호환성:** Chrome, Firefox, Safari, Edge 최신 버전

### 11.2 보안 고려사항

1. **인증 필수:** Clerk 인증 없이 접근 불가
2. **권한 검증:** administrator 역할만 업로드 가능
3. **파일 격리:** 사용자별 디렉토리 분리 (`temp-uploads/{userId}/`)
4. **매직 바이트 검증:** 파일 확장자 위장 방지

### 11.3 성능 고려사항

1. **진행률 추적:** XHR `progress` 이벤트 사용
2. **대용량 파일:** 10MB 제한으로 성능 이슈 최소화
3. **Storage 용량:** Supabase 무료 플랜 1GB 제한 고려

---

## 12. 향후 개선 사항 (Phase 2)

1. **다중 파일 업로드:** 여러 파일 동시 업로드
2. **청크 업로드:** 대용량 파일 분할 업로드
3. **재시도 로직:** 네트워크 오류 시 자동 재시도
4. **CSV 미리보기:** 업로드 전 데이터 샘플 표시
5. **드래그앤드롭 개선:** 파일 순서 변경 등

---

## 부록

### A. 의존성 패키지

```json
{
  "dependencies": {
    "react-dropzone": "^14.2.3"
  }
}
```

**설치 명령:**
```bash
npm install react-dropzone
```

### B. 환경 변수

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

### C. Supabase Storage 버킷 생성

```sql
-- Supabase Dashboard에서 실행
-- Storage > Buckets > Create bucket

-- 버킷 이름: temp-uploads
-- Public: false
-- File size limit: 10MB
```

**RLS 정책:**
```sql
-- Service Role만 접근 허용
CREATE POLICY "Service role full access"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'temp-uploads')
  WITH CHECK (bucket_id = 'temp-uploads');
```

---

**문서 종료**

이 구현 계획은 PRD, Userflow, Database Design, Common Modules 문서를 기반으로 작성되었으며, 기존 코드베이스 구조를 엄격히 따릅니다. DRY 원칙을 준수하며, 공통 모듈을 최대한 재사용합니다.
