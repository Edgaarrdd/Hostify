import { Suspense } from "react";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { ThemeSwitcher } from "@/components/theme-switcher";

// Disable prerendering for all protected routes
export const dynamic = 'force-dynamic';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Suspense fallback={<div className="w-64 border-r border-border-light dark:border-border-dark bg-content-light dark:bg-content-dark" />}>
        <SidebarWrapper />
      </Suspense>
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="border-b border-border-light dark:border-border-dark bg-content-light dark:bg-content-dark p-4 flex justify-end flex-shrink-0">
          <ThemeSwitcher />
        </header>
        <div className="flex-1 p-6 lg:p-10 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
