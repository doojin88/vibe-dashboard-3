import { createHonoApp } from '@/backend/hono/app';

const app = createHonoApp();

async function handleRequest(
  request: Request,
  params: Promise<{ hono?: string[] }>
) {
  const { hono } = await params;
  
  // Next.js catch-all route에서 경로 추출
  // /api/dashboard/overview -> /dashboard/overview
  const path = hono && hono.length > 0 ? `/${hono.join('/')}` : '/';
  
  // 원본 URL에서 경로만 변경하여 Hono 앱에 전달
  const url = new URL(request.url);
  url.pathname = path;
  
  // 새로운 Request 생성
  const honoRequest = new Request(url, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' && request.body
      ? request.body
      : null,
  });

  return app.fetch(honoRequest);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ hono?: string[] }> }
) {
  return handleRequest(request, context.params);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ hono?: string[] }> }
) {
  return handleRequest(request, context.params);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ hono?: string[] }> }
) {
  return handleRequest(request, context.params);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ hono?: string[] }> }
) {
  return handleRequest(request, context.params);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ hono?: string[] }> }
) {
  return handleRequest(request, context.params);
}

export async function OPTIONS(
  request: Request,
  context: { params: Promise<{ hono?: string[] }> }
) {
  return handleRequest(request, context.params);
}

export const runtime = 'nodejs';
