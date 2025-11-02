import type { Database } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ResearchersFilter } from './schema';
import type { ResearcherPerformance, ResearchersAggregateResponse, Publication } from './types';

export class ResearcherService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * 연구자별 성과 조회
   */
  async getResearchers(filters: ResearchersFilter): Promise<ResearcherPerformance[]> {
    // Step 1: 연구비 데이터 조회
    let projectsQuery = this.supabase
      .from('research_projects')
      .select('principal_investigator, total_budget, funding_agency, department:departments(college_name, department_name)');

    if (filters.researcher_name) {
      projectsQuery = projectsQuery.ilike('principal_investigator', `%${filters.researcher_name}%`);
    }

    if (filters.department_name) {
      projectsQuery = projectsQuery.eq('departments.department_name', filters.department_name);
    }

    const { data: projectsData, error: projectsError } = await projectsQuery;

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    // Step 2: 논문 데이터 조회
    let pubsQuery = this.supabase
      .from('publications')
      .select('main_author, journal_grade, impact_factor, project_linked, publication_date, department:departments(college_name, department_name)');

    if (filters.researcher_name) {
      pubsQuery = pubsQuery.ilike('main_author', `%${filters.researcher_name}%`);
    }

    if (filters.year_start) {
      pubsQuery = pubsQuery.gte('publication_date', `${filters.year_start}-01-01`);
    }

    if (filters.year_end) {
      pubsQuery = pubsQuery.lte('publication_date', `${filters.year_end}-12-31`);
    }

    if (filters.department_name) {
      pubsQuery = pubsQuery.eq('departments.department_name', filters.department_name);
    }

    const { data: pubsData, error: pubsError } = await pubsQuery;

    if (pubsError) {
      throw new Error(`Failed to fetch publications: ${pubsError.message}`);
    }

    // Step 3: 데이터 집계
    const researcherMap = new Map<string, ResearcherPerformance>();

    // 연구비 집계
    (projectsData || []).forEach((project: any) => {
      const name = project.principal_investigator;
      const existing = researcherMap.get(name) || this.createEmptyPerformance(name);

      existing.total_budget += project.total_budget || 0;
      existing.project_count += 1;

      if (project.department) {
        existing.department_name = project.department.department_name || 'Unknown';
        existing.college_name = project.department.college_name || 'Unknown';
      }

      if (project.funding_agency && !existing.funding_agencies.includes(project.funding_agency)) {
        existing.funding_agencies.push(project.funding_agency);
      }

      researcherMap.set(name, existing);
    });

    // 논문 집계
    (pubsData || []).forEach((pub: any) => {
      const name = pub.main_author;
      const existing = researcherMap.get(name) || this.createEmptyPerformance(name);

      existing.publication_count += 1;

      if (pub.journal_grade === 'SCIE') existing.scie_count += 1;
      if (pub.journal_grade === 'KCI') existing.kci_count += 1;
      if (pub.project_linked) existing.project_linked_count += 1;

      if (pub.impact_factor) {
        const currentTotal = (existing.avg_impact_factor || 0) * (existing.publication_count - 1);
        existing.avg_impact_factor = (currentTotal + pub.impact_factor) / existing.publication_count;
      }

      if (!existing.latest_publication_date || pub.publication_date > existing.latest_publication_date) {
        existing.latest_publication_date = pub.publication_date;
      }

      if (pub.department && !existing.department_name) {
        existing.department_name = pub.department.department_name || 'Unknown';
        existing.college_name = pub.department.college_name || 'Unknown';
      }

      researcherMap.set(name, existing);
    });

    // Step 4: 과제연계 비율 계산
    researcherMap.forEach((perf) => {
      if (perf.publication_count > 0) {
        perf.project_linked_ratio = (perf.project_linked_count / perf.publication_count) * 100;
      }
      if (perf.project_count > 0) {
        perf.avg_project_budget = perf.total_budget / perf.project_count;
      }
    });

    // Step 5: 정렬 및 페이지네이션
    const researchers = Array.from(researcherMap.values());

    researchers.sort((a, b) => {
      const aVal = a[filters.sort_by];
      const bVal = b[filters.sort_by];
      const order = filters.sort_order === 'asc' ? 1 : -1;
      return ((aVal || 0) - (bVal || 0)) * order;
    });

    return researchers.slice(filters.offset, filters.offset + filters.limit);
  }

  /**
   * 집계 통계
   */
  async getAggregate(filters: ResearchersFilter): Promise<ResearchersAggregateResponse> {
    const researchers = await this.getResearchers({ ...filters, limit: 1000, offset: 0 });

    const totalBudget = researchers.reduce((sum, r) => sum + r.total_budget, 0);
    const totalPublications = researchers.reduce((sum, r) => sum + r.publication_count, 0);
    const totalProjectLinkedPubs = researchers.reduce((sum, r) => sum + r.project_linked_count, 0);

    return {
      total_researchers: researchers.length,
      total_budget: totalBudget,
      avg_budget_per_researcher: researchers.length > 0 ? totalBudget / researchers.length : 0,
      total_publications: totalPublications,
      avg_publications_per_researcher: researchers.length > 0 ? totalPublications / researchers.length : 0,
      overall_project_linked_ratio: totalPublications > 0 ? (totalProjectLinkedPubs / totalPublications) * 100 : 0,
      top_by_budget: researchers.slice(0, 10),
      top_by_publications: [...researchers].sort((a, b) => b.publication_count - a.publication_count).slice(0, 10),
    };
  }

  private createEmptyPerformance(name: string): ResearcherPerformance {
    return {
      researcher_name: name,
      department_name: '',
      college_name: '',
      total_budget: 0,
      project_count: 0,
      avg_project_budget: 0,
      publication_count: 0,
      scie_count: 0,
      kci_count: 0,
      avg_impact_factor: null,
      project_linked_count: 0,
      project_linked_ratio: 0,
      funding_agencies: [],
      latest_publication_date: null,
    };
  }
}
