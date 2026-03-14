// API client for backend communication

const API_BASE = "/api";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    });

    // Log the response for debugging
    console.log(`[API] ${options.method || 'GET'} ${endpoint}:`, response.status, response.statusText);

    if (!response.ok) {
      // Try to parse error as JSON, fallback to text
      let errorMessage = "Request failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text();
          console.error('[API] Error response (text):', errorText);
          errorMessage = errorText || errorMessage;
        } catch (textError) {
          console.error('[API] Could not parse error response');
        }
      }
      throw new Error(errorMessage);
    }

    // Try to parse response as JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    } else {
      // If not JSON, get the text to see what we're receiving
      const text = await response.text();
      console.error('[API] Received non-JSON response:', text.substring(0, 200));
      throw new Error("Server returned non-JSON response");
    }
  } catch (error) {
    console.error('[API] Fetch error:', error);
    throw error;
  }
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

  rename: (analysisId: string, name: string) =>
    fetchAPI(`/analyses/${analysisId}/rename`, { method: "PATCH", body: JSON.stringify({ name }) }),

  delete: (analysisId: string) =>
    fetchAPI(`/analyses/${analysisId}`, { method: "DELETE" }),
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

// Calendar
export const calendar = {
  getByProject: (projectId: string) =>
    fetchAPI(`/calendar/project/${projectId}`),
  
  getByDateRange: (projectId: string, start: string, end: string) =>
    fetchAPI(`/calendar/project/${projectId}/range?start=${start}&end=${end}`),
  
  getUpcoming: (projectId: string, limit = 10) =>
    fetchAPI(`/calendar/project/${projectId}/upcoming?limit=${limit}`),
  
  get: (id: string) =>
    fetchAPI(`/calendar/${id}`),
  
  create: (data: {
    projectId: string;
    title: string;
    description?: string;
    eventType: string;
    startDate: string;
    endDate?: string;
    allDay?: boolean;
    location?: string;
    attendees?: string[];
    relatedAnalysisId?: string;
    relatedActionItemId?: string;
    reminderMinutes?: number;
  }) =>
    fetchAPI("/calendar", { method: "POST", body: JSON.stringify(data) }),
  
  update: (id: string, data: Partial<any>) =>
    fetchAPI(`/calendar/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  
  delete: (id: string) =>
    fetchAPI(`/calendar/${id}`, { method: "DELETE" }),

  // Google Calendar integration
  getGoogleStatus: () =>
    fetchAPI("/calendar/google/status"),

  disconnectGoogle: () =>
    fetchAPI("/calendar/google/disconnect", { method: "POST" }),

  connectGoogle: (code: string) =>
    fetchAPI("/calendar/google/auth", { method: "POST", body: JSON.stringify({ code }) }),

  syncToGoogle: (eventId: string) =>
    fetchAPI(`/calendar/${eventId}/sync-to-google`, { method: "POST" }),

  importFromGoogle: (projectId: string, startDate: string, endDate: string) =>
    fetchAPI(`/calendar/google/import/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ startDate, endDate }),
    }),

  removeDuplicates: (projectId: string) =>
    fetchAPI(`/calendar/remove-duplicates/${projectId}`, { method: "POST" }),
};

// Jira Integration
export const jira = {
  getStatus: () =>
    fetchAPI("/jira/status"),

  saveConfig: (data: { baseUrl: string; email: string; apiToken: string }) =>
    fetchAPI("/jira/config", { method: "POST", body: JSON.stringify(data) }),

  testConnection: () =>
    fetchAPI("/jira/test"),

  getProjects: () =>
    fetchAPI("/jira/projects"),

  getIssueTypes: (projectKey: string) =>
    fetchAPI(`/jira/projects/${projectKey}/issue-types`),

  createIssue: (data: any) =>
    fetchAPI("/jira/issues", { method: "POST", body: JSON.stringify(data) }),

  getIssue: (issueKey: string) =>
    fetchAPI(`/jira/issues/${issueKey}`),

  updateIssue: (issueKey: string, fields: any) =>
    fetchAPI(`/jira/issues/${issueKey}`, { 
      method: "PUT", 
      body: JSON.stringify({ fields }) 
    }),

  searchIssues: (jql: string, maxResults = 50) =>
    fetchAPI("/jira/search", { 
      method: "POST", 
      body: JSON.stringify({ jql, maxResults }) 
    }),
};
