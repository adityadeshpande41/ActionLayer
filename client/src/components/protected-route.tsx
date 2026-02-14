import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { auth } from "@/lib/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[ProtectedRoute] Checking authentication...');
      const user = await auth.me();
      console.log('[ProtectedRoute] Auth successful:', user);
      setIsAuthenticated(true);
      
      // Initialize default project if needed
      try {
        await fetch("/api/init/initialize", {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {
        console.log("Init failed, continuing anyway");
      }
    } catch (error) {
      console.error('[ProtectedRoute] Auth failed:', error);
      setIsAuthenticated(false);
      setLocation("/");
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
