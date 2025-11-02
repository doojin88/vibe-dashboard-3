import { z } from 'zod';

export const researchersFilterSchema = z.object({
  researcher_name: z.string().optional(),
  department_name: z.string().optional(),
  year_start: z.coerce.number().min(2000).max(2100).optional(),
  year_end: z.coerce.number().min(2000).max(2100).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sort_by: z.enum(['total_budget', 'publication_count', 'project_linked_ratio']).default('total_budget'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type ResearchersFilter = z.infer<typeof researchersFilterSchema>;
