import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const querySchema = z.object({
  year: z.coerce.number().optional(),
});

const trendsQuerySchema = z.object({
  years: z.coerce.number().default(3),
});

export function registerDashboardRoutes(app: Hono<AppEnv>) {
  const dashboard = new Hono<AppEnv>();

  // GET /api/dashboard/overview
  dashboard.get('/overview', zValidator('query', querySchema), async (c) => {
    const { year } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    try {
      // 최신 연도 조회 (year가 없을 경우)
      let currentYear = year;
      if (!currentYear) {
        const { data: latestYear } = await supabase
          .from('kpi_metrics')
          .select('evaluation_year')
          .order('evaluation_year', { ascending: false })
          .limit(1)
          .single();

        currentYear = latestYear ? (latestYear as any).evaluation_year : new Date().getFullYear();
      }

      const previousYear = currentYear - 1;

      // 평균 취업률
      const { data: employmentData } = await supabase
        .from('kpi_metrics')
        .select('employment_rate, evaluation_year')
        .in('evaluation_year', [currentYear, previousYear]);

      type EmploymentData = { evaluation_year: number; employment_rate: number | null };
      const typedEmploymentData = (employmentData || []) as EmploymentData[];

      const currentEmploymentData = typedEmploymentData.filter(d => d.evaluation_year === currentYear);
      const prevEmploymentData = typedEmploymentData.filter(d => d.evaluation_year === previousYear);

      const currentEmploymentRate = currentEmploymentData.length > 0
        ? currentEmploymentData.reduce((sum, d) => sum + (d.employment_rate || 0), 0) / currentEmploymentData.length
        : 0;

      const prevEmploymentRate = prevEmploymentData.length > 0
        ? prevEmploymentData.reduce((sum, d) => sum + (d.employment_rate || 0), 0) / prevEmploymentData.length
        : 0;

      // 총 논문 수
      const { data: publicationsData } = await supabase
        .from('publications')
        .select('journal_grade, publication_date')
        .gte('publication_date', `${currentYear}-01-01`)
        .lt('publication_date', `${currentYear + 1}-01-01`);

      const { data: prevPublicationsData } = await supabase
        .from('publications')
        .select('journal_grade')
        .gte('publication_date', `${previousYear}-01-01`)
        .lt('publication_date', `${previousYear + 1}-01-01`);

      type PublicationData = { journal_grade: string | null; publication_date?: string };
      const typedPublicationsData = (publicationsData || []) as PublicationData[];
      const typedPrevPublicationsData = (prevPublicationsData || []) as PublicationData[];

      const totalPublications = typedPublicationsData.length;
      const scieCount = typedPublicationsData.filter(p => p.journal_grade === 'SCIE').length;
      const kciCount = typedPublicationsData.filter(p => p.journal_grade === 'KCI').length;
      const prevPublicationsCount = typedPrevPublicationsData.length;

      // 총 연구비
      const { data: budgetData } = await supabase
        .from('research_projects')
        .select('total_budget, created_at');

      type BudgetData = { total_budget: number; created_at: string };
      const typedBudgetData = (budgetData || []) as BudgetData[];

      const currentBudget = typedBudgetData
        .filter(d => new Date(d.created_at).getFullYear() === currentYear)
        .reduce((sum, d) => sum + (d.total_budget || 0), 0);

      const prevBudget = typedBudgetData
        .filter(d => new Date(d.created_at).getFullYear() === previousYear)
        .reduce((sum, d) => sum + (d.total_budget || 0), 0);

      // 재학생 수
      const { data: studentsData } = await supabase
        .from('students')
        .select('program_type')
        .eq('enrollment_status', '재학');

      type StudentData = { program_type: string | null };
      const typedStudentsData = (studentsData || []) as StudentData[];

      const totalStudents = typedStudentsData.length;
      const undergraduate = typedStudentsData.filter(s => s.program_type === '학사').length;
      const master = typedStudentsData.filter(s => s.program_type === '석사').length;
      const doctorate = typedStudentsData.filter(s => s.program_type === '박사').length;

      return c.json({
        currentYear,
        kpis: {
          employmentRate: {
            value: currentEmploymentRate,
            previousYear: prevEmploymentRate,
            change: currentEmploymentRate - prevEmploymentRate,
            trend: currentEmploymentRate > prevEmploymentRate ? 'up' : currentEmploymentRate < prevEmploymentRate ? 'down' : 'stable',
          },
          publicationCount: {
            value: totalPublications,
            scie: scieCount,
            kci: kciCount,
            previousYear: prevPublicationsCount,
            change: totalPublications - prevPublicationsCount,
          },
          researchBudget: {
            value: currentBudget,
            previousYear: prevBudget,
            change: currentBudget - prevBudget,
          },
          studentCount: {
            value: totalStudents,
            undergraduate,
            master,
            doctorate,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      return c.json({ error: 'Failed to fetch dashboard overview' }, 500);
    }
  });

  // GET /api/dashboard/trends
  dashboard.get('/trends', zValidator('query', trendsQuerySchema), async (c) => {
    const { years } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    try {
      // 최신 연도 조회
      const { data: latestYear } = await supabase
        .from('kpi_metrics')
        .select('evaluation_year')
        .order('evaluation_year', { ascending: false })
        .limit(1)
        .single();

      const currentYear = latestYear ? (latestYear as any).evaluation_year : new Date().getFullYear();
      const yearRange = Array.from({ length: years }, (_, i) => currentYear - i).reverse();

      // 연도별 취업률 및 기술이전 수입
      const { data: kpiData } = await supabase
        .from('kpi_metrics')
        .select('employment_rate, evaluation_year, tech_transfer_income')
        .in('evaluation_year', yearRange);

      const employmentRate = yearRange.map(year => {
        const yearData = (kpiData || []).filter((d: any) => d.evaluation_year === year);
        const value = yearData.length > 0
          ? yearData.reduce((sum: number, d: any) => sum + (d.employment_rate || 0), 0) / yearData.length
          : 0;
        return { year, value };
      });

      const techTransferIncome = yearRange.map(year => {
        const yearData = (kpiData || []).filter((d: any) => d.evaluation_year === year);
        const value = yearData.reduce((sum: number, d: any) => sum + (d.tech_transfer_income || 0), 0);
        return { year, value };
      });

      // 연도별 논문 수
      const { data: pubData } = await supabase
        .from('publications')
        .select('publication_date, journal_grade');

      const publications = yearRange.map(year => {
        const yearPubs = (pubData || []).filter((p: any) => {
          const pubYear = new Date(p.publication_date).getFullYear();
          return pubYear === year;
        });

        return {
          year,
          total: yearPubs.length,
          scie: yearPubs.filter((p: any) => p.journal_grade === 'SCIE').length,
          kci: yearPubs.filter((p: any) => p.journal_grade === 'KCI').length,
        };
      });

      return c.json({
        years: yearRange,
        employmentRate,
        techTransferIncome,
        publications,
      });
    } catch (error) {
      console.error('Error fetching dashboard trends:', error);
      return c.json({ error: 'Failed to fetch dashboard trends' }, 500);
    }
  });

  // GET /api/dashboard/colleges
  dashboard.get('/colleges', zValidator('query', querySchema), async (c) => {
    const { year } = c.req.valid('query');
    const supabase = getSupabaseServiceClient();

    try {
      // 최신 연도 조회
      let currentYear = year;
      if (!currentYear) {
        const { data: latestYear } = await supabase
          .from('kpi_metrics')
          .select('evaluation_year')
          .order('evaluation_year', { ascending: false })
          .limit(1)
          .single();

        currentYear = latestYear ? (latestYear as any).evaluation_year : new Date().getFullYear();
      }

      // 단과대학별 집계
      const { data: departments } = await supabase
        .from('departments')
        .select('id, college_name, department_name');

      const { data: kpiData } = await supabase
        .from('kpi_metrics')
        .select('department_id, employment_rate')
        .eq('evaluation_year', currentYear);

      const { data: researchData } = await supabase
        .from('research_projects')
        .select('department_id, total_budget');

      // 단과대학별로 그룹화
      const collegeMap = new Map<string, {
        name: string;
        employmentRates: number[];
        departmentCount: number;
        researchBudget: number;
      }>();

      (departments || []).forEach((dept: any) => {
        if (!collegeMap.has(dept.college_name)) {
          collegeMap.set(dept.college_name, {
            name: dept.college_name,
            employmentRates: [],
            departmentCount: 0,
            researchBudget: 0,
          });
        }
        const college = collegeMap.get(dept.college_name)!;
        college.departmentCount++;

        // 취업률 추가
        const kpi = (kpiData || []).find((k: any) => k.department_id === dept.id) as any;
        if (kpi && kpi.employment_rate !== null) {
          college.employmentRates.push(kpi.employment_rate);
        }

        // 연구비 추가
        const budget = (researchData || []).filter((r: any) => r.department_id === dept.id)
          .reduce((sum: number, r: any) => sum + (r.total_budget || 0), 0);
        college.researchBudget += budget;
      });

      // 총 연구비 계산 (비율 계산용)
      const totalResearchBudget = Array.from(collegeMap.values())
        .reduce((sum, college) => sum + college.researchBudget, 0);

      const colleges = Array.from(collegeMap.values()).map(college => ({
        name: college.name,
        employmentRate: college.employmentRates.length > 0
          ? college.employmentRates.reduce((sum, rate) => sum + rate, 0) / college.employmentRates.length
          : 0,
        departmentCount: college.departmentCount,
        researchBudget: college.researchBudget,
        budgetShare: totalResearchBudget > 0
          ? (college.researchBudget / totalResearchBudget) * 100
          : 0,
      }));

      // 취업률 내림차순 정렬
      colleges.sort((a, b) => b.employmentRate - a.employmentRate);

      return c.json({
        year: currentYear,
        colleges,
      });
    } catch (error) {
      console.error('Error fetching dashboard colleges:', error);
      return c.json({ error: 'Failed to fetch dashboard colleges' }, 500);
    }
  });

  app.route('/dashboard', dashboard);
}
