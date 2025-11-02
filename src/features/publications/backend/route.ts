// src/features/publications/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const publicationFilterSchema = z.object({
  publication_year: z.coerce.number().array().optional(),
  college_name: z.string().array().optional(),
  department_name: z.string().array().optional(),
  journal_grade: z.string().array().optional(),
  main_author: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

export function registerPublicationRoutes(app: Hono<AppEnv>) {
  const publications = new Hono<AppEnv>();

  // GET /publications - 논문 목록 조회
  publications.get('/', zValidator('query', publicationFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('publications')
      .select(
        `
        *,
        department:departments(
          college_name,
          department_name
        )
      `
      )
      .order('publication_date', { ascending: false });

    // 필터 적용
    if (filters.publication_year && filters.publication_year.length > 0) {
      query = query.gte('publication_date', Math.min(...filters.publication_year) + '-01-01');
      query = query.lte('publication_date', Math.max(...filters.publication_year) + '-12-31');
    }

    if (filters.journal_grade && filters.journal_grade.length > 0) {
      query = query.in('journal_grade', filters.journal_grade);
    }

    if (filters.main_author) {
      query = query.ilike('main_author', `%${filters.main_author}%`);
    }

    const { data: allData, error: dataError } = await query;

    if (dataError) {
      return c.json({ error: dataError.message }, 500);
    }

    // 단과대학/학과 필터링
    let filteredData = allData || [];

    if (filters.college_name && filters.college_name.length > 0) {
      filteredData = filteredData.filter((item: any) =>
        filters.college_name!.includes(item.department.college_name)
      );
    }

    if (filters.department_name && filters.department_name.length > 0) {
      filteredData = filteredData.filter((item: any) =>
        filters.department_name!.includes(item.department.department_name)
      );
    }

    // 페이지네이션
    const total = filteredData.length;
    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;
    const paginatedData = filteredData.slice(start, end);

    return c.json({
      data: paginatedData,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  });

  // GET /publications/aggregate - 집계 데이터
  publications.get('/aggregate', zValidator('query', publicationFilterSchema.omit({ page: true, limit: true })), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('publications')
      .select(
        `
        id,
        journal_grade,
        impact_factor,
        publication_date,
        department:departments(
          college_name,
          department_name
        )
      `
      );

    // 필터 적용
    if (filters.publication_year && filters.publication_year.length > 0) {
      query = query.gte('publication_date', Math.min(...filters.publication_year) + '-01-01');
      query = query.lte('publication_date', Math.max(...filters.publication_year) + '-12-31');
    }

    if (filters.journal_grade && filters.journal_grade.length > 0) {
      query = query.in('journal_grade', filters.journal_grade);
    }

    if (filters.main_author) {
      query = query.ilike('main_author', `%${filters.main_author}%`);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 데이터 필터링
    let filteredData = data || [];

    if (filters.college_name && filters.college_name.length > 0) {
      filteredData = filteredData.filter((item: any) =>
        filters.college_name!.includes(item.department.college_name)
      );
    }

    if (filters.department_name && filters.department_name.length > 0) {
      filteredData = filteredData.filter((item: any) =>
        filters.department_name!.includes(item.department.department_name)
      );
    }

    // 집계 계산
    const total = filteredData.length;
    const scieCount = filteredData.filter((p: any) => p.journal_grade === 'SCIE').length;
    const kciCount = filteredData.filter((p: any) => p.journal_grade === 'KCI').length;
    const avgImpactFactor =
      filteredData
        .filter((p: any) => p.impact_factor !== null)
        .reduce((sum: number, p: any) => sum + p.impact_factor, 0) /
      filteredData.filter((p: any) => p.impact_factor !== null).length || 0;

    return c.json({
      total,
      scieCount,
      kciCount,
      avgImpactFactor: avgImpactFactor ? Number(avgImpactFactor.toFixed(2)) : 0,
    });
  });

  app.route('/publications', publications);
}
