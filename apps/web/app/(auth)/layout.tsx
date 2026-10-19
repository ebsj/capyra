import type { ReactNode } from "react";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import { AuthIntroPanel } from "@/features/auth";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
      <div className="fixed right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LocaleToggle />
      </div>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/20 p-6 lg:border-b-0 lg:border-r lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_28%),radial-gradient(circle_at_12%_18%,hsl(var(--accent)/0.24),transparent_22%)]" />
        <AuthIntroPanel />
      </section>

      <section className="flex items-center justify-center bg-background/40 p-6 lg:p-10">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
