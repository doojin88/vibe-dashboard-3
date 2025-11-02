'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

type HeroSectionProps = {
  isAuthenticated: boolean;
  isLoading: boolean;
};

export function HeroSection({ isAuthenticated, isLoading }: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-bold tracking-tight text-white md:text-6xl">
        대학교 데이터 시각화 대시보드
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-slate-300 md:text-xl">
        Ecount에서 추출한 데이터를 기반으로 실적, 논문 게재 수, 학생 수, 예산 등을
        직관적으로 파악하고 공유할 수 있는 맞춤형 그래프 및 차트를 제공합니다.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        {!isLoading && !isAuthenticated && (
          <Button asChild size="lg" className="px-8">
            <Link href="/login">Google로 로그인</Link>
          </Button>
        )}

        {!isLoading && isAuthenticated && (
          <Button asChild size="lg" className="px-8">
            <Link href="/dashboard">대시보드로 이동</Link>
          </Button>
        )}

        {isLoading && (
          <Button disabled size="lg" className="px-8">
            로딩 중...
          </Button>
        )}
      </div>
    </section>
  );
}
