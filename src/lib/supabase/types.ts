export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string;
          name: string | null;
          role: 'viewer' | 'administrator';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      departments: {
        Row: {
          id: string;
          college_name: string;
          department_name: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };
      kpi_metrics: {
        Row: {
          id: string;
          department_id: string;
          evaluation_year: number;
          employment_rate: number | null;
          full_time_faculty: number | null;
          visiting_faculty: number | null;
          tech_transfer_income: number | null;
          intl_conference_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kpi_metrics']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['kpi_metrics']['Insert']>;
      };
      publications: {
        Row: {
          id: string;
          publication_id: string;
          department_id: string;
          title: string;
          main_author: string;
          co_authors: string | null;
          journal_name: string;
          journal_grade: 'SCIE' | 'SSCI' | 'A&HCI' | 'SCOPUS' | 'KCI' | 'Other' | null;
          impact_factor: number | null;
          publication_date: string;
          project_linked: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['publications']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
          project_linked?: boolean;
        };
        Update: Partial<Database['public']['Tables']['publications']['Insert']>;
      };
      research_projects: {
        Row: {
          id: string;
          project_number: string;
          project_name: string;
          principal_investigator: string;
          department_id: string;
          funding_agency: string;
          total_budget: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['research_projects']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['research_projects']['Insert']>;
      };
      budget_executions: {
        Row: {
          id: string;
          execution_id: string;
          project_id: string;
          execution_date: string;
          execution_item: string;
          execution_amount: number;
          status: '집행완료' | '처리중';
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['budget_executions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['budget_executions']['Insert']>;
      };
      students: {
        Row: {
          id: string;
          student_number: string;
          name: string;
          department_id: string;
          grade: number | null;
          program_type: '학사' | '석사' | '박사' | '석박통합' | null;
          enrollment_status: '재학' | '휴학' | '졸업' | '자퇴' | '제적' | null;
          gender: '남' | '여' | '기타' | null;
          admission_year: number | null;
          advisor: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['students']['Insert']>;
      };
      upload_logs: {
        Row: {
          id: string;
          user_id: string | null;
          file_name: string;
          file_type: string;
          file_size: number | null;
          data_type: 'department_kpi' | 'publication_list' | 'research_project_data' | 'student_roster';
          status: 'uploaded' | 'validated' | 'completed' | 'failed';
          rows_processed: number | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['upload_logs']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['upload_logs']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type SupabaseUserMetadata = Record<string, unknown>;
