'use client';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700/50 bg-slate-900/80 py-8">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-400">
        <p>University Dashboard © {currentYear}. All rights reserved.</p>
      </div>
    </footer>
  );
}
