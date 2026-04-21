import type { ReactNode } from "react";

import { InptLogo } from "@/components/branding/inpt-logo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <main className="auth-grid relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.65),transparent_42%)]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.24),transparent_55%)]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <InptLogo />
        </div>
        {children}
      </div>
    </main>
  );
}
