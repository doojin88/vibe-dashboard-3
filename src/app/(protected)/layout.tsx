import { SignedIn } from "@clerk/nextjs";
import type { ReactNode } from "react";

type ProtectedLayoutProps = {
  children: ReactNode;
};

// Clerk 키가 설정되어 있는지 확인
const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  // Clerk가 없으면 children을 직접 렌더링 (인증 체크 없음)
  if (!hasClerk) {
    return <>{children}</>;
  }

  // Clerk가 있으면 SignedIn으로 보호
  return <SignedIn>{children}</SignedIn>;
}
