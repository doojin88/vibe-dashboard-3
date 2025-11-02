'use client';

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { HomeHeader } from "@/components/home/home-header";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { Footer } from "@/components/home/footer";

export default function Home() {
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <HomeHeader
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16">
        <HeroSection
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
        />

        <FeaturesSection />
      </div>

      <Footer />
    </main>
  );
}
