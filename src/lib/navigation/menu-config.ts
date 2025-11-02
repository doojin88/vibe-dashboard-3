import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Wallet,
  Users,
  Upload,
  CheckSquare,
  Database,
} from 'lucide-react';

export type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  role?: 'administrator' | 'viewer';
  children?: MenuItem[];
};

export const MENU_ITEMS: MenuItem[] = [
  {
    title: '메인 대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '학과 성과 관리',
    href: '/dashboard/department',
    icon: Building2,
    children: [
      {
        title: '학과별 KPI',
        href: '/dashboard/department/kpi',
        icon: LayoutDashboard,
      },
      {
        title: '취업률 분석',
        href: '/dashboard/department/employment',
        icon: GraduationCap,
      },
      {
        title: '교원 현황',
        href: '/dashboard/department/faculty',
        icon: Users,
      },
    ],
  },
  {
    title: '연구 성과 분석',
    href: '/dashboard/research',
    icon: GraduationCap,
    children: [
      {
        title: '논문 게재 현황',
        href: '/dashboard/research/publications',
        icon: LayoutDashboard,
      },
      {
        title: '연구과제 관리',
        href: '/dashboard/research/projects',
        icon: Database,
      },
      {
        title: '연구자 성과',
        href: '/dashboard/research/researchers',
        icon: Users,
      },
    ],
  },
  {
    title: '예산 관리',
    href: '/dashboard/budget',
    icon: Wallet,
    children: [
      {
        title: '예산 집행 현황',
        href: '/dashboard/budget/execution',
        icon: LayoutDashboard,
      },
      {
        title: '과제별 예산 상세',
        href: '/dashboard/budget/projects',
        icon: Database,
      },
    ],
  },
  {
    title: '학생 현황',
    href: '/dashboard/students',
    icon: Users,
    children: [
      {
        title: '재학생 현황',
        href: '/dashboard/students/enrollment',
        icon: LayoutDashboard,
      },
      {
        title: '지도교수별 현황',
        href: '/dashboard/students/advisors',
        icon: Users,
      },
    ],
  },
  {
    title: '파일 업로드',
    href: '/data/upload',
    icon: Upload,
    role: 'administrator',
  },
  {
    title: '데이터 검증',
    href: '/data/validation',
    icon: CheckSquare,
    role: 'administrator',
  },
  {
    title: '데이터 조회',
    href: '/data/browse',
    icon: Database,
    role: 'administrator',
  },
];
