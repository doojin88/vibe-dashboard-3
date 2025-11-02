'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Database, Users, BookOpen } from 'lucide-react';

export default function DataUploadPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">데이터 업로드</h1>
          <p className="text-muted-foreground">Excel 파일을 업로드하여 데이터베이스에 저장</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                학과 KPI 데이터
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                취업률, 교원 현황, 기술이전 수입 등
              </p>
              <Button className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                파일 업로드
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                논문 게재 데이터
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                논문 제목, 저자, 학술지, Impact Factor 등
              </p>
              <Button className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                파일 업로드
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                연구과제 데이터
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                과제명, 연구책임자, 예산, 기간 등
              </p>
              <Button className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                파일 업로드
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                학생 명단 데이터
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                학번, 이름, 학과, 학년, 재학상태 등
              </p>
              <Button className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                파일 업로드
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>업로드 가이드</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">1. Excel 파일(.xlsx)만 업로드 가능합니다</p>
            <p className="text-sm">2. 첫 번째 행은 컬럼 헤더로 사용됩니다</p>
            <p className="text-sm">3. 필수 컬럼이 누락되면 업로드가 실패합니다</p>
            <p className="text-sm">4. 업로드 전 데이터 검증이 자동으로 수행됩니다</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
