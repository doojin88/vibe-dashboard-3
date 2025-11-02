// src/features/publications/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const publicationFilterSchema = z.object({
  year: z.array(z.coerce.number()).or(z.coerce.number().transform((v) => [v])).optional(),
  college_name: z.array(z.string()).or(z.string().transform((v) => [v])).optional(),
  department_name: z.array(z.string()).or(z.string().transform((v) => [v])).optional(),
  journal_grade: z.array(z.string()).or(z.string().transform((v) => [v])).optional(),
  main_author: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
  sort: z.string().default('publication_date'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export function registerPublicationRoutes(app: Hono<AppEnv>) {
  const pub = new Hono<AppEnv>();

  // GET /api/publications - 논문 목록 조회
  pub.get('/', zValidator('query', publicationFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('publications')
      .select('*, department:departments(college_name, department_name)', {
        count: 'exact',
      });

    // 필터 적용
    if (filters.year && filters.year.length > 0) {
      const yearFilters = filters.year.map((y) => {
        const startDate = `${y}-01-01`;
        const endDate = `${y}-12-31`;
        return { gte: startDate, lte: endDate };
      });

      // 연도별 OR 조건
      if (yearFilters.length === 1) {
        query = query
          .gte('publication_date', yearFilters[0].gte)
          .lte('publication_date', yearFilters[0].lte);
      } else {
        // 여러 연도 선택 시 OR 필터 (Supabase에서는 직접 지원하지 않으므로 클라이언트 측 필터링 필요)
        // 간단한 해결책: 최소~최대 범위로 필터링
        const minYear = Math.min(...filters.year);
        const maxYear = Math.max(...filters.year);
        query = query
          .gte('publication_date', `${minYear}-01-01`)
          .lte('publication_date', `${maxYear}-12-31`);
      }
    }

    if (filters.college_name && filters.college_name.length > 0) {
      query = query.in('departments.college_name', filters.college_name);
    }

    if (filters.department_name && filters.department_name.length > 0) {
      query = query.in('departments.department_name', filters.department_name);
    }

    if (filters.journal_grade && filters.journal_grade.length > 0) {
      query = query.in('journal_grade', filters.journal_grade);
    }

    if (filters.main_author) {
      query = query.ilike('main_author', `%${filters.main_author}%`);
    }

    // 정렬
    query = query.order(filters.sort, { ascending: filters.order === 'asc' });

    // 페이지네이션
    const offset = (filters.page - 1) * filters.limit;
    query = query.range(offset, offset + filters.limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({
      items: data || [],
      total: count || 0,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil((count || 0) / filters.limit),
    });
  });

  // GET /api/publications/kpi - KPI 집계
  pub.get('/kpi', zValidator('query', publicationFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('publications')
      .select('journal_grade, impact_factor');

    // 필터 적용 (동일 로직)
    if (filters.year && filters.year.length > 0) {
      const minYear = Math.min(...filters.year);
      const maxYear = Math.max(...filters.year);
      query = query
        .gte('publication_date', `${minYear}-01-01`)
        .lte('publication_date', `${maxYear}-12-31`);
    }

    if (filters.main_author) {
      query = query.ilike('main_author', `%${filters.main_author}%`);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // KPI 계산
    const totalCount = data?.length || 0;
    const scieCount = data?.filter((p) => p.journal_grade === 'SCIE').length || 0;
    const kciCount = data?.filter((p) => p.journal_grade === 'KCI').length || 0;

    const impactFactors = data
      ?.filter((p) => p.impact_factor !== null)
      .map((p) => p.impact_factor as number) || [];

    const avgImpactFactor = impactFactors.length > 0
      ? impactFactors.reduce((sum, val) => sum + val, 0) / impactFactors.length
      : null;

    return c.json({
      total_count: totalCount,
      scie_count: scieCount,
      kci_count: kciCount,
      avg_impact_factor: avgImpactFactor,
    });
  });

  // GET /api/publications/trend - 연도별 추이
  pub.get('/trend', zValidator('query', publicationFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('publications')
      .select('publication_date, journal_grade');

    if (filters.main_author) {
      query = query.ilike('main_author', `%${filters.main_author}%`);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 연도별 집계
    const yearMap = new Map<number, { total: number; scie: number; kci: number }>();

    data?.forEach((pub) => {
      const year = new Date(pub.publication_date).getFullYear();
      const entry = yearMap.get(year) || { total: 0, scie: 0, kci: 0 };

      entry.total++;
      if (pub.journal_grade === 'SCIE') entry.scie++;
      if (pub.journal_grade === 'KCI') entry.kci++;

      yearMap.set(year, entry);
    });

    const trend = Array.from(yearMap.entries())
      .map(([year, counts]) => ({
        year,
        total_count: counts.total,
        scie_count: counts.scie,
        kci_count: counts.kci,
      }))
      .sort((a, b) => b.year - a.year);

    return c.json(trend);
  });

  // GET /api/publications/grade-distribution - 저널 등급별 분포
  pub.get('/grade-distribution', zValidator('query', publicationFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('publications')
      .select('journal_grade');

    if (filters.year && filters.year.length > 0) {
      const minYear = Math.min(...filters.year);
      const maxYear = Math.max(...filters.year);
      query = query
        .gte('publication_date', `${minYear}-01-01`)
        .lte('publication_date', `${maxYear}-12-31`);
    }

    if (filters.main_author) {
      query = query.ilike('main_author', `%${filters.main_author}%`);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 등급별 집계
    const gradeMap = new Map<string, number>();
    const total = data?.length || 0;

    data?.forEach((pub) => {
      const grade = pub.journal_grade || 'Other';
      gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
    });

    const distribution = Array.from(gradeMap.entries())
      .map(([grade, count]) => ({
        journal_grade: grade,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return c.json(distribution);
  });

  // GET /api/publications/department-count - 학과별 논문 수
  pub.get('/department-count', zValidator('query', publicationFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('publications')
      .select('department_id, department:departments(college_name, department_name)');

    if (filters.year && filters.year.length > 0) {
      const minYear = Math.min(...filters.year);
      const maxYear = Math.max(...filters.year);
      query = query
        .gte('publication_date', `${minYear}-01-01`)
        .lte('publication_date', `${maxYear}-12-31`);
    }

    if (filters.main_author) {
      query = query.ilike('main_author', `%${filters.main_author}%`);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 학과별 집계
    const deptMap = new Map<string, { id: string; college: string; department: string; count: number }>();

    data?.forEach((pub) => {
      if (pub.department) {
        const key = pub.department_id;
        const entry = deptMap.get(key) || {
          id: pub.department_id,
          college: pub.department.college_name,
          department: pub.department.department_name,
          count: 0,
        };
        entry.count++;
        deptMap.set(key, entry);
      }
    });

    const departmentCounts = Array.from(deptMap.values())
      .map((entry) => ({
        department_id: entry.id,
        college_name: entry.college,
        department_name: entry.department,
        count: entry.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20

    return c.json(departmentCounts);
  });

  // GET /api/publications/impact-trend - Impact Factor 추이
  pub.get('/impact-trend', zValidator('query', publicationFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('publications')
      .select('publication_date, impact_factor')
      .not('impact_factor', 'is', null);

    if (filters.main_author) {
      query = query.ilike('main_author', `%${filters.main_author}%`);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 연도별 평균 Impact Factor 계산
    const yearMap = new Map<number, number[]>();

    data?.forEach((pub) => {
      if (pub.impact_factor !== null) {
        const year = new Date(pub.publication_date).getFullYear();
        const impacts = yearMap.get(year) || [];
        impacts.push(pub.impact_factor);
        yearMap.set(year, impacts);
      }
    });

    const trend = Array.from(yearMap.entries())
      .map(([year, impacts]) => ({
        year,
        avg_impact_factor: impacts.reduce((sum, val) => sum + val, 0) / impacts.length,
      }))
      .sort((a, b) => b.year - a.year);

    return c.json(trend);
  });

  // GET /api/publications/author-ranking - 주저자 랭킹
  pub.get('/author-ranking', zValidator('query', publicationFilterSchema), async (c) => {
    const filters = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('publications')
      .select('main_author, impact_factor, department:departments(department_name)');

    if (filters.year && filters.year.length > 0) {
      const minYear = Math.min(...filters.year);
      const maxYear = Math.max(...filters.year);
      query = query
        .gte('publication_date', `${minYear}-01-01`)
        .lte('publication_date', `${maxYear}-12-31`);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // 저자별 집계
    const authorMap = new Map<string, {
      department: string;
      count: number;
      impacts: number[];
    }>();

    data?.forEach((pub) => {
      const author = pub.main_author;
      const entry = authorMap.get(author) || {
        department: pub.department?.department_name || '',
        count: 0,
        impacts: [],
      };

      entry.count++;
      if (pub.impact_factor !== null) {
        entry.impacts.push(pub.impact_factor);
      }

      authorMap.set(author, entry);
    });

    const ranking = Array.from(authorMap.entries())
      .map(([author, data]) => ({
        main_author: author,
        department_name: data.department,
        publication_count: data.count,
        avg_impact_factor: data.impacts.length > 0
          ? data.impacts.reduce((sum, val) => sum + val, 0) / data.impacts.length
          : null,
      }))
      .sort((a, b) => b.publication_count - a.publication_count)
      .slice(0, 20); // Top 20

    return c.json(ranking);
  });

  // GET /api/publications/:id - 논문 상세
  pub.get('/:id', async (c) => {
    const id = c.req.param('id');
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('publications')
      .select('*, department:departments(college_name, department_name)')
      .eq('id', id)
      .single();

    if (error) {
      return c.json({ error: error.message }, 404);
    }

    return c.json(data);
  });

  app.route('/publications', pub);
}
