import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { projects as projectsApi } from "@/lib/api";

interface ProjectContextType {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string) => void;
  projects: any[];
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
  });

  // Initialize default project if user has none
  useEffect(() => {
    const initializeProject = async () => {
      if (!isLoading && projects.length === 0 && !initialized) {
        try {
          const response = await fetch("/api/init/initialize", {
            method: "POST",
            credentials: "include",
          });
          
          if (response.ok) {
            setInitialized(true);
            // Refetch projects after initialization
            refetch();
          }
        } catch (error) {
          console.error("Failed to initialize project:", error);
        }
      }
    };

    initializeProject();
  }, [projects, isLoading, initialized, refetch]);

  // Auto-select first project if none selected
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      // Check if we should select a specific project after reload
      const projectToSelect = localStorage.getItem("selectProjectAfterReload");
      if (projectToSelect) {
        localStorage.removeItem("selectProjectAfterReload");
        const projectExists = projects.find((p: any) => p.id === projectToSelect);
        if (projectExists) {
          setSelectedProjectId(projectToSelect);
          return;
        }
      }
      // Otherwise select the first project
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  return (
    <ProjectContext.Provider value={{ selectedProjectId, setSelectedProjectId, projects, isLoading }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
}
