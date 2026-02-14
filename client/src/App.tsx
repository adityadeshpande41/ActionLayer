import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ProjectProvider } from "@/hooks/use-project";
import { ProtectedRoute } from "@/components/protected-route";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Analyze from "@/pages/analyze";
import Command from "@/pages/command";
import Memory from "@/pages/memory";
import CalendarPage from "@/pages/calendar";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import Preferences from "@/pages/preferences";
import NotFound from "@/pages/not-found";

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
} as React.CSSProperties;

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const [location] = useLocation();
  const isHomePage = location === "/";

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/analyze">
        <ProtectedRoute>
          <AppLayout>
            <Analyze />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/command">
        <ProtectedRoute>
          <AppLayout>
            <Command />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/memory">
        <ProtectedRoute>
          <AppLayout>
            <Memory />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/calendar">
        <ProtectedRoute>
          <AppLayout>
            <CalendarPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <AppLayout>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <AppLayout>
            <Profile />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/preferences">
        <ProtectedRoute>
          <AppLayout>
            <Preferences />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ProjectProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </ProjectProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
