// src/features/publications/components/PublicationsFilterPanel.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { usePublicationStore } from '../store/publicationStore';
import { useMemo } from 'react';

export function PublicationsFilterPanel() {
  const { filters, setFilters, resetFilters } = usePublicationStore();

  // 연도 옵션 생성 (2020 ~ 현재)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 2020; year--) {
      years.push({ label: `${year}년`, value: String(year) });
    }
    return years;
  }, []);

  // 저널 등급 옵션
  const gradeOptions = [
    { label: 'SCIE', value: 'SCIE' },
    { label: 'SSCI', value: 'SSCI' },
    { label: 'A&HCI', value: 'A&HCI' },
    { label: 'SCOPUS', value: 'SCOPUS' },
    { label: 'KCI', value: 'KCI' },
    { label: 'Other', value: 'Other' },
  ];

  // TODO: 실제로는 API에서 가져와야 함
  const collegeOptions = [
    { label: '공과대학', value: '공과대학' },
    { label: '경영대학', value: '경영대학' },
    { label: '인문대학', value: '인문대학' },
  ];

  const departmentOptions = [
    { label: '컴퓨터공학과', value: '컴퓨터공학과' },
    { label: '기계공학과', value: '기계공학과' },
    { label: '경영학과', value: '경영학과' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 게재 연도 */}
        <div className="space-y-2">
          <Label>게재 연도</Label>
          <MultiSelect
            options={yearOptions}
            value={filters.year?.map(String) || []}
            onChange={(value) => setFilters({ year: value.map(Number) })}
            placeholder="연도 선택"
          />
        </div>

        {/* 단과대학 */}
        <div className="space-y-2">
          <Label>단과대학</Label>
          <MultiSelect
            options={collegeOptions}
            value={filters.college_name || []}
            onChange={(college_name) => setFilters({ college_name, department_name: [] })}
            placeholder="단과대학 선택"
          />
        </div>

        {/* 학과 */}
        <div className="space-y-2">
          <Label>학과</Label>
          <MultiSelect
            options={departmentOptions}
            value={filters.department_name || []}
            onChange={(department_name) => setFilters({ department_name })}
            placeholder="학과 선택"
            disabled={!filters.college_name?.length}
          />
        </div>

        {/* 저널 등급 */}
        <div className="space-y-2">
          <Label>저널 등급</Label>
          <MultiSelect
            options={gradeOptions}
            value={filters.journal_grade || []}
            onChange={(journal_grade) => setFilters({ journal_grade })}
            placeholder="등급 선택"
          />
        </div>

        {/* 주저자 검색 */}
        <div className="space-y-2">
          <Label>주저자</Label>
          <Input
            type="text"
            placeholder="저자 이름 검색"
            value={filters.main_author || ''}
            onChange={(e) => setFilters({ main_author: e.target.value })}
          />
        </div>

        {/* 초기화 버튼 */}
        <Button variant="outline" onClick={resetFilters} className="w-full">
          초기화
        </Button>
      </CardContent>
    </Card>
  );
}
