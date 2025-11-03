import type { ReactNode } from "react";

type ProtectedLayoutProps = {
  children: ReactNode;
};

// 비로그인 상태로 모든 콘텐츠 접근 허용
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <>{children}</>;
}
