# University Dashboard - Vibe Dashboard 2

대학교 데이터 시각화 대시보드: 대학교 내부의 실적, 논문 게재 수, 학생 수, 예산 등의 데이터를 직관적으로 파악하고 공유하기 위한 웹 기반 시각화 플랫폼입니다.

이 프로젝트는 [`EasyNext`](https://github.com/easynext/easynext)를 사용해 생성된 [Next.js](https://nextjs.org) 프로젝트입니다.

## Quick Start

### 1. 환경 변수 설정

```bash
# .env.example 파일을 복사하여 .env.local 생성
cp .env.example .env.local

# .env.local 파일을 열어 실제 값으로 수정
# 필수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

자세한 설정 방법은 [docs/setup/environment-variables.md](docs/setup/environment-variables.md)를 참고하세요.

### 2. 의존성 설치

```bash
npm install
```

### 3. 데이터베이스 마이그레이션

Supabase 대시보드에서 [docs/database.md](docs/database.md)의 SQL 스크립트를 실행하세요.

### 4. 개발 서버 실행

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인할 수 있습니다.

### 5. 환경 변수 검증

개발 서버 실행 후 http://localhost:3000/api/health/env 에 접속하여 환경 변수가 올바르게 설정되었는지 확인하세요.

## 기본 포함 라이브러리

- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [ESLint](https://eslint.org)
- [Prettier](https://prettier.io)
- [Shadcn UI](https://ui.shadcn.com)
- [Lucide Icon](https://lucide.dev)
- [date-fns](https://date-fns.org)
- [react-use](https://github.com/streamich/react-use)
- [es-toolkit](https://github.com/toss/es-toolkit)
- [Zod](https://zod.dev)
- [React Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com)
- [TS Pattern](https://github.com/gvergnaud/ts-pattern)

## 사용 가능한 명령어

한글버전 사용

```sh
easynext lang ko
```

최신버전으로 업데이트

```sh
npm i -g @easynext/cli@latest
# or
yarn add -g @easynext/cli@latest
# or
pnpm add -g @easynext/cli@latest
```

Supabase 설정

```sh
easynext supabase
```

Next-Auth 설정

```sh
easynext auth

# ID,PW 로그인
easynext auth idpw
# 카카오 로그인
easynext auth kakao
```

유용한 서비스 연동

```sh
# Google Analytics
easynext gtag

# Microsoft Clarity
easynext clarity

# ChannelIO
easynext channelio

# Sentry
easynext sentry

# Google Adsense
easynext adsense
```
