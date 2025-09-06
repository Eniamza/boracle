// app/providers.jsx
"use client";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ModeToggle } from "@/components/light-toggle";
import { Toaster } from "sonner";
export function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <SidebarInset>
            <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-950/60 px-4">
              <SidebarTrigger className="-ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex-1">
                <h1 className="font-semibold text-gray-900 dark:text-white">Dashboard</h1>
              </div>
              <div className="ml-auto">
                <ModeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}