// API client for backend communication

const API_BASE = "/api";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// Auth
export const auth = {
  register: (data: { username: string; password: string; email?: string }) =>
    fetchAPI("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  
  login: (data: { username: string; password: string }) =>
    fetchAPI("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  
  logout: () =>
    fetchAPI("/auth/logout", { method: "POST" }),
  
  me: () =>
    fetchAPI("/auth/me"),
};

// Projects
export const projects = {
  list: () =>
    fetchAPI("/projects"),
  
  get: (id: string) =>
    fetchAPI(`/projects/${id}`),
  
  create: (data: { name: string; description?: string }) =>
    fetchAPI("/projects", { method: "POST", body: JSON.stringify(data) }),
  
  update: (id: string, data: Partial<{ name: string; description: string }>) =>
    fetchAPI(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// Analyses
export const analyses = {
  getByProject: (projectId: string) =>
    fetchAPI(`/analyses/project/${projectId}`),
  
  getRecent: (limit = 10) =>
    fetchAPI(`/analyses/recent?limit=${limit}`),
  
  get: (id: string) =>
    fetchAPI(`/analyses/${id}`),
  
  // Intake mode
  getIntakeQuestions: () =>
    fetchAPI("/analyses/intake/questions"),
  
  processIntake: (data: { projectId: string; answers: Record<string, string> }) =>
    fetchAPI("/analyses/intake/process", { method: "POST", body: JSON.stringify(data) }),
  
  analyze: async (data: {
    projectId: string;
    meetingType?: string;
    content?: string;
    file?: File;
  }) => {
    const formData = new FormData();
    formData.append("projectId", data.projectId);
    if (data.meetingType) formData.append("meetingType", data.meetingType);
    if (data.content) formData.append("content", data.content);
    if (data.file) formData.append("file", data.file);

    const response = await fetch(`${API_BASE}/analyses/analyze`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Analysis failed" }));
      throw new Error(error.error || "Analysis failed");
    }

    return response.json();
  },
  
  generateJira: (analysisId: string) =>
    fetchAPI(`/analyses/${analysisId}/jira`, { method: "POST" }),
  
  generateFollowUp: (analysisId: string) =>
    fetchAPI(`/analyses/${analysisId}/followup`, { method: "POST" }),
  
  generateWeeklyStatus: (projectId: string) =>
    fetchAPI(`/analyses/weekly-status/${projectId}`, { method: "POST" }),
  
  generateWhatChanged: (analysisId: string) =>
    fetchAPI(`/analyses/${analysisId}/what-changed`, { method: "POST" }),
};

// Command
export const command = {
  execute: (data: { command: string; projectId?: string }) =>
    fetchAPI("/command", { method: "POST", body: JSON.stringify(data) }),
  
  getInsights: (projectId: string) =>
    fetchAPI(`/command/insights/${projectId}`),
};

// Dashboard
export const dashboard = {
  metrics: () =>
    fetchAPI("/dashboard/metrics"),
  
  riskDrift: () =>
    fetchAPI("/dashboard/risk-drift"),
  
  recentRuns: (limit = 10) =>
    fetchAPI(`/dashboard/recent-runs?limit=${limit}`),
};

// Approvals
export const approvals = {
  get: (analysisId: string) =>
    fetchAPI(`/approvals/analysis/${analysisId}`),
  
  approve: (analysisId: string, data: { actions: string[]; edits?: any }) =>
    fetchAPI(`/approvals/analysis/${analysisId}/approve`, { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),
  
  reject: (analysisId: string, reason: string) =>
    fetchAPI(`/approvals/analysis/${analysisId}/reject`, { 
      method: "POST", 
      body: JSON.stringify({ reason }) 
    }),
};
