import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { InsightsDock } from "@/components/insights/InsightsDock";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import ScrollToTop from "@/components/common/ScrollToTop";
import { useNavigate } from "react-router-dom";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useTenant } from "@/contexts/TenantContext";

import { Button } from "@/components/ui/button";
import { Sparkles, Home } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const navigate = useNavigate();
  const { currentTenant } = useTenant();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        {/* Top Bar - Fixo no topo */}
        <header className="fixed top-0 left-0 right-0 h-16 border-b flex items-center justify-between px-3 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="flex items-center gap-2 md:gap-4">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-primary/10"
              title="Ir para Dashboard"
            >
              <Home className="h-5 w-5" />
            </Button>
            
            {/* TENANT LOGO (se existir) */}
            {currentTenant?.logo_url ? (
              <img
                src={currentTenant.logo_url}
                alt={currentTenant.name}
                className="h-8 w-auto hidden sm:block"
              />
            ) : currentTenant ? (
              <div
                className="h-8 w-8 rounded flex items-center justify-center text-white text-xs font-bold hidden sm:flex"
                style={{ backgroundColor: currentTenant.primary_color }}
                title={currentTenant.name}
              >
                {currentTenant.name.substring(0, 2).toUpperCase()}
              </div>
            ) : null}
            
            <h2 className="font-semibold text-sm md:text-lg hidden sm:block">STRATEVO Intelligence</h2>
            
            {/* 🌍 WORKSPACE SWITCHER - Multi-tenant */}
            <div className="hidden lg:flex ml-4">
              <WorkspaceSwitcher />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-2xl mx-2 md:mx-4">
            <GlobalSearch />
            <Button
              variant="outline"
              onClick={() => setInsightsOpen(true)}
              className="relative gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
            </Button>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <NotificationBell />
            <ModeToggle />
          </div>
        </header>

        {/* Sidebar - Começa após o header */}
        <AppSidebar />
        
        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${insightsOpen ? 'mr-[600px] md:mr-[700px] lg:mr-[800px]' : ''}`}>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 mt-16">
            <Breadcrumb />
            {children}
          </main>
        </div>

        <InsightsDock open={insightsOpen} onOpenChange={setInsightsOpen} />
        
        {/* ScrollToTop Universal - Aparece em TODAS as páginas */}
        <ScrollToTop />
      </div>
    </SidebarProvider>
  );
}
