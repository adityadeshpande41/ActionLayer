import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Bell, Moon, Sun, ChevronDown, AlertTriangle, Clock, CheckCircle2, FileText, Terminal, LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/hooks/use-project";
import { auth } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { dashboard } from "@/lib/api";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { selectedProjectId, setSelectedProjectId, projects } = useProject();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Fetch high-priority notifications (high-severity risks)
  const { data: riskDrift } = useQuery({
    queryKey: ["risk-drift"],
    queryFn: dashboard.riskDrift,
  });

  const { data: recentRuns } = useQuery({
    queryKey: ["recent-runs"],
    queryFn: () => dashboard.recentRuns(5),
  });

  // Generate notifications from high-severity risks
  const notifications = riskDrift
    ?.filter((risk: any) => risk.occurrences >= 2)
    .map((risk: any) => ({
      id: risk.risk,
      type: "risk",
      title: "Recurring Risk Alert",
      message: risk.risk,
      count: risk.occurrences,
      time: new Date(risk.lastSeen),
      priority: "high",
    })) || [];

  // Add recent analysis notifications
  const analysisNotifications = recentRuns
    ?.filter((run: any) => run.risksCount > 0)
    .slice(0, 3)
    .map((run: any) => ({
      id: run.id,
      type: "analysis",
      title: "Analysis Complete",
      message: `Found ${run.risksCount} risks and ${run.decisionsCount} decisions`,
      time: new Date(run.createdAt),
      priority: run.risksCount >= 2 ? "high" : "normal",
    })) || [];

  const allNotifications = [...notifications, ...analysisNotifications]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 5);

  const unreadCount = allNotifications.filter(n => n.priority === "high").length;

  const handleLogout = async () => {
    try {
      await auth.logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleCreateProject = async () => {
    setIsCreatingProject(true);
    try {
      const projectName = prompt("Enter project name:");
      if (!projectName) {
        setIsCreatingProject(false);
        return;
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: projectName, description: "" }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const newProject = await response.json();
      
      // Refresh projects list by invalidating the query
      window.location.reload();
      
      toast({
        title: "Project Created",
        description: `${projectName} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b px-4 min-h-14 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 flex-wrap">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <h1 className="text-lg font-semibold tracking-tight" data-testid="text-page-title">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {projects && projects.length > 0 ? (
          <div className="flex items-center gap-2">
            <Select value={selectedProjectId || ""} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[160px] text-sm" data-testid="select-project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} data-testid={`option-project-${p.id}`}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCreateProject}
              disabled={isCreatingProject}
              aria-label="Create new project"
              data-testid="button-create-project"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCreateProject}
            disabled={isCreatingProject}
            data-testid="button-create-first-project"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Project
          </Button>
        )}
        
        {/* Search */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Search" data-testid="button-search">
              <Search className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[300px]" align="end">
            <Command>
              <CommandInput placeholder="Search decisions, risks, actions..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Quick Actions">
                  <CommandItem onSelect={() => { setSearchOpen(false); setLocation("/analyze"); }}>
                    <FileText className="h-4 w-4 mr-2" />
                    New Analysis
                  </CommandItem>
                  <CommandItem onSelect={() => { setSearchOpen(false); setLocation("/command"); }}>
                    <Terminal className="h-4 w-4 mr-2" />
                    Command Mode
                  </CommandItem>
                  <CommandItem onSelect={() => { setSearchOpen(false); setLocation("/dashboard"); }}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    View Dashboard
                  </CommandItem>
                </CommandGroup>
                {recentRuns && recentRuns.length > 0 && (
                  <CommandGroup heading="Recent Analyses">
                    {recentRuns.slice(0, 3).map((run: any) => (
                      <CommandItem 
                        key={run.id}
                        onSelect={() => {
                          setSearchOpen(false);
                          toast({ title: "Analysis", description: `${run.decisionsCount} decisions, ${run.risksCount} risks` });
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(run.createdAt).toLocaleDateString()} - {run.decisionsCount}D / {run.risksCount}R
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Notifications */}
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" data-testid="button-notifications" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  {unreadCount} high priority
                </Badge>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {allNotifications.length > 0 ? (
                allNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b hover:bg-accent cursor-pointer ${
                      notif.priority === "high" ? "bg-destructive/5" : ""
                    }`}
                    onClick={() => {
                      setNotificationsOpen(false);
                      if (notif.type === "risk") {
                        setLocation("/memory");
                      } else {
                        setLocation("/dashboard");
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full p-1.5 shrink-0 ${
                        notif.priority === "high" 
                          ? "bg-destructive/10" 
                          : "bg-primary/10"
                      }`}>
                        {notif.type === "risk" ? (
                          <AlertTriangle className={`h-3 w-3 ${
                            notif.priority === "high" ? "text-destructive" : "text-orange-500"
                          }`} />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold">{notif.title}</p>
                          {notif.count && (
                            <Badge variant="outline" className="text-[9px]">
                              {notif.count}x
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {notif.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" data-testid="button-theme-toggle">
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2" data-testid="button-user-menu">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">PM</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="menu-profile">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/preferences")} data-testid="menu-preferences">
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} data-testid="menu-signout">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
