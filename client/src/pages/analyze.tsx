import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/hooks/use-project";
import { analyses, approvals, calendar, jira } from "@/lib/api";
import { Upload, Play, Loader2, AlertTriangle, CheckCircle2, Ban, Copy, MessageSquare, ChevronRight, Lightbulb, ArrowRight, FileText, Mail, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, string> = {
    High: "bg-destructive/10 text-destructive border-destructive/20",
    Med: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    Low: "bg-highlight/10 text-highlight-foreground dark:text-highlight border-highlight/20",
  };
  return <Badge variant="outline" className={`text-[11px] font-medium ${variants[severity] || ""}`}>{severity}</Badge>;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const isLow = confidence < 70;
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${isLow ? "bg-orange-500" : "bg-primary"}`} style={{ width: `${confidence}%` }} />
      </div>
      <span className={`text-xs ${isLow ? "text-orange-500" : "text-muted-foreground"}`}>{confidence}%</span>
      {isLow && <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/20">Needs Review</Badge>}
    </div>
  );
}

export default function Analyze() {
  const { toast } = useToast();
  const { selectedProjectId } = useProject();
  const [inputTab, setInputTab] = useState("upload");
  const [resultsTab, setResultsTab] = useState("summary");
  const [meetingType, setMeetingType] = useState("");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [jiraStories, setJiraStories] = useState<any>(null);
  const [followUpEmails, setFollowUpEmails] = useState<any>(null);
  const [weeklyStatus, setWeeklyStatus] = useState<any>(null);
  const [whatChanged, setWhatChanged] = useState<any>(null);
  const [isGeneratingJira, setIsGeneratingJira] = useState(false);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [isGeneratingChanges, setIsGeneratingChanges] = useState(false);
  const [isApprovingActions, setIsApprovingActions] = useState(false);
  const [actionsApproved, setActionsApproved] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [deadlineDate, setDeadlineDate] = useState("");
  const queryClient = useQueryClient();
  
  // Intake mode
  const [intakeStep, setIntakeStep] = useState(0);
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [followUpCount, setFollowUpCount] = useState(0);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);

  const { data: intakeQuestions } = useQuery({
    queryKey: ["intake-questions"],
    queryFn: analyses.getIntakeQuestions,
    enabled: inputTab === "intake",
  });

  // Check if we should load a specific analysis (from dashboard view)
  useEffect(() => {
    const viewAnalysisId = sessionStorage.getItem('viewAnalysisId');
    if (viewAnalysisId) {
      sessionStorage.removeItem('viewAnalysisId');
      loadAnalysis(viewAnalysisId);
    }
  }, []);

  const loadAnalysis = async (analysisId: string) => {
    try {
      setIsAnalyzing(true);
      const result = await analyses.get(analysisId);
      
      // Set the analysis result with all the data
      setAnalysisResult({
        id: result.id,
        analysis: result,
        summary: result.summary || [],
        decisions: result.decisions || [],
        risks: result.risks || [],
        actionItems: result.actionItems || [],
        dependencies: result.dependencies || [],
        workflow: result.workflow,
      });
      
      setResultsTab("summary");
      toast({ 
        title: "Analysis Loaded", 
        description: `Viewing analysis from ${new Date(result.createdAt).toLocaleDateString()}` 
      });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: "Failed to load analysis", 
        variant: "destructive" 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRunAnalysis = async () => {
    if (!transcript && !file) {
      toast({ title: "Error", description: "Please provide a transcript or upload a file", variant: "destructive" });
      return;
    }

    if (!selectedProjectId) {
      toast({ title: "Error", description: "Please select a project first", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyses.analyze({
        projectId: selectedProjectId,
        meetingType,
        content: transcript,
        file: file || undefined,
      });
      
      // Store the full result including the analysis.id
      setAnalysisResult({
        id: result.analysis.id, // Extract the ID from the nested analysis object
        ...result,
      });
      setResultsTab("summary");
      toast({ title: "Analysis Complete", description: "Transcript processed successfully." });
    } catch (error: any) {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleIntakeSubmit = async (skipFollowUp = false) => {
    if (!currentAnswer.trim() && !skipFollowUp) return;
    if (!intakeQuestions) return;

    if (!selectedProjectId) {
      toast({ title: "Error", description: "Please select a project first", variant: "destructive" });
      return;
    }

    // If answering a follow-up question
    if (followUpQuestion && currentAnswer.trim()) {
      const followUpId = `followup_${followUpCount}`;
      const newAnswers = { ...intakeAnswers, [followUpId]: currentAnswer.trim() };
      setIntakeAnswers(newAnswers);
      setCurrentAnswer("");
      setFollowUpQuestion(null);
      
      // Process with these answers
      await processIntake(newAnswers, true); // Skip further follow-ups
      return;
    }

    const questionId = intakeQuestions.questions[intakeStep].id;
    const newAnswers = { ...intakeAnswers, [questionId]: currentAnswer.trim() };
    setIntakeAnswers(newAnswers);
    setCurrentAnswer("");

    if (intakeStep < intakeQuestions.questions.length - 1) {
      setIntakeStep(intakeStep + 1);
    } else {
      // All initial questions answered, process intake
      await processIntake(newAnswers, skipFollowUp || followUpCount >= 2);
    }
  };

  const processIntake = async (answers: Record<string, string>, skipFollowUp: boolean) => {
    setIsAnalyzing(true);
    try {
      const result = await analyses.processIntake({
        projectId: selectedProjectId!,
        answers,
        skipFollowUp,
      });
      
      if (result.needsFollowUp && !skipFollowUp && followUpCount < 2) {
        // Show follow-up question
        setFollowUpQuestion(result.question);
        setFollowUpCount(followUpCount + 1);
        setIsAnalyzing(false);
      } else {
        // Store the full result including the analysis.id
        setAnalysisResult({
          id: result.analysis.id,
          ...result,
        });
        setResultsTab("summary");
        setFollowUpQuestion(null);
        setFollowUpCount(0);
        toast({ title: "Intake Complete", description: "Analysis generated from your responses." });
        setIsAnalyzing(false);
      }
    } catch (error: any) {
      toast({ title: "Processing Failed", description: error.message, variant: "destructive" });
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const handleGenerateJira = async () => {
    if (!analysisResult?.id) return;
    
    setIsGeneratingJira(true);
    try {
      // Check Jira connection status
      const jiraStatus = await jira.getStatus();
      
      if (!jiraStatus.configured) {
        toast({ 
          title: "Jira Not Connected", 
          description: "Please configure Jira integration first. Contact your admin to set up Jira credentials.",
          variant: "destructive" 
        });
        setIsGeneratingJira(false);
        return;
      }

      // Generate Jira stories (AI drafts)
      const result = await analyses.generateJira(analysisResult.id);
      setJiraStories({ stories: result.jiraDrafts });
      
      // Ask user if they want to create tickets in Jira
      const shouldCreate = confirm(
        `Generated ${result.jiraDrafts.length} Jira stories. Do you want to create these tickets in your Jira project now?`
      );
      
      if (shouldCreate) {
        // Get Jira projects to let user select
        const projects = await jira.getProjects();
        
        if (projects.length === 0) {
          toast({ 
            title: "No Jira Projects", 
            description: "No Jira projects found. Please create a project in Jira first.",
            variant: "destructive" 
          });
          return;
        }
        
        // Use first project or let user select (for now, using first)
        const projectKey = projects[0].key;
        
        // Create tickets in Jira
        let createdCount = 0;
        for (const story of result.jiraDrafts) {
          try {
            await jira.createIssue({
              fields: {
                project: { key: projectKey },
                summary: story.title,
                description: {
                  type: "doc",
                  version: 1,
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: story.description || "" }]
                    },
                    {
                      type: "heading",
                      attrs: { level: 3 },
                      content: [{ type: "text", text: "Acceptance Criteria" }]
                    },
                    ...(story.acceptanceCriteria || []).map((ac: string) => ({
                      type: "paragraph",
                      content: [{ type: "text", text: `• ${ac}` }]
                    }))
                  ]
                },
                issuetype: { name: story.type === "epic" ? "Epic" : "Story" },
                priority: { name: story.priority === "high" ? "High" : story.priority === "low" ? "Low" : "Medium" }
              }
            });
            createdCount++;
          } catch (error) {
            console.error("Failed to create Jira ticket:", error);
          }
        }
        
        toast({ 
          title: "Jira Tickets Created", 
          description: `Successfully created ${createdCount} of ${result.jiraDrafts.length} tickets in Jira project ${projectKey}.` 
        });
      } else {
        toast({ title: "Jira Stories Generated", description: "AI-generated tickets are ready for review." });
      }
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingJira(false);
    }
  };

  const handleGenerateFollowUp = async () => {
    if (!analysisResult?.id) return;
    
    setIsGeneratingFollowUp(true);
    try {
      const result = await analyses.generateFollowUp(analysisResult.id);
      // Backend returns { emails } with multiple targeted emails
      setFollowUpEmails(result.emails);
      
      const emailCount = [
        result.emails.general,
        result.emails.risks,
        result.emails.blockers,
        result.emails.actions
      ].filter(Boolean).length;
      
      toast({ 
        title: "Follow-Ups Generated", 
        description: `${emailCount} targeted email${emailCount > 1 ? 's' : ''} ready for different stakeholders.` 
      });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const handleGenerateWeeklyStatus = async () => {
    if (!selectedProjectId) return;
    
    setIsGeneratingWeekly(true);
    try {
      const result = await analyses.generateWeeklyStatus(selectedProjectId);
      setWeeklyStatus(result.statusUpdate);
      toast({ title: "Weekly Status Generated", description: "Status update is ready." });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingWeekly(false);
    }
  };

  const handleGenerateWhatChanged = async () => {
    if (!analysisResult?.id) return;
    
    setIsGeneratingChanges(true);
    try {
      const result = await analyses.generateWhatChanged(analysisResult.id);
      setWhatChanged(result.changes);
      toast({ title: "Changes Identified", description: "What changed summary is ready." });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingChanges(false);
    }
  };

  const handleApproveActions = async () => {
    if (!analysisResult?.id || !analysisResult?.workflow?.proposedActions) return;
    
    setIsApprovingActions(true);
    try {
      const actionTypes = analysisResult.workflow.proposedActions.map((a: any) => a.type);
      await approvals.approve(analysisResult.id, { actions: actionTypes });
      setActionsApproved(true);
      toast({ 
        title: "Actions Approved", 
        description: "Proposed actions have been approved and queued for execution." 
      });
    } catch (error: any) {
      toast({ title: "Approval Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsApprovingActions(false);
    }
  };

  const handleRejectActions = async () => {
    if (!analysisResult?.id) return;
    
    setIsApprovingActions(true);
    try {
      await approvals.reject(analysisResult.id, "Actions rejected by user");
      
      // Mark all action items as cancelled
      const updatedActionItems = analysisResult.actionItems?.map((item: any) => ({
        ...item,
        status: "cancelled"
      })) || [];
      
      setAnalysisResult({
        ...analysisResult,
        actionItems: updatedActionItems
      });
      
      setActionsApproved(true);
      toast({ 
        title: "Actions Rejected", 
        description: "Proposed actions have been rejected and marked as cancelled." 
      });
    } catch (error: any) {
      toast({ title: "Rejection Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsApprovingActions(false);
    }
  };

  // Schedule story deadline mutation
  const scheduleDeadlineMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('[Schedule] Sending data:', data);
      try {
        const result = await calendar.create(data);
        console.log('[Schedule] Success:', result);
        return result;
      } catch (error) {
        console.error('[Schedule] Error details:', error);
        // Log the full error object
        if (error instanceof Error) {
          console.error('[Schedule] Error message:', error.message);
          console.error('[Schedule] Error stack:', error.stack);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Don't invalidate calendar queries here since we're not on the calendar page
      // The calendar page will fetch fresh data when the user navigates to it
      toast({ 
        title: "Deadline Scheduled", 
        description: "Story deadline has been added to your calendar. Visit the Calendar page to see it." 
      });
      setScheduleDialogOpen(false);
      setSelectedStory(null);
      setDeadlineDate("");
    },
    onError: (error: any) => {
      console.error('[Schedule] Mutation error:', error);
      const errorMessage = error?.message || error?.error || "Failed to schedule deadline";
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });

  const handleScheduleStory = (story: any) => {
    setSelectedStory(story);
    setScheduleDialogOpen(true);
  };

  const handleConfirmSchedule = () => {
    if (!selectedProjectId || !selectedStory || !deadlineDate) {
      toast({ title: "Error", description: "Please select a deadline date", variant: "destructive" });
      return;
    }

    console.log('[Schedule] Creating event with:', {
      projectId: selectedProjectId,
      title: `Deadline: ${selectedStory.title}`,
      deadlineDate,
      analysisId: analysisResult?.id,
    });

    const eventData = {
      projectId: selectedProjectId,
      title: `Deadline: ${selectedStory.title}`,
      description: selectedStory.userStory || "",
      eventType: "deadline",
      startDate: new Date(deadlineDate).toISOString(),
      allDay: true,
      relatedAnalysisId: analysisResult?.id || undefined,
      reminderMinutes: 1440, // 1 day before
    };

    console.log('[Schedule] Event data:', eventData);
    scheduleDeadlineMutation.mutate(eventData);
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Transcript Analysis" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {!analysisResult ? (
          <Card>
            <CardContent className="p-6">
              <Tabs value={inputTab} onValueChange={setInputTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="upload">
                    <Upload className="h-4 w-4 mr-1.5" />
                    Upload / Paste Transcript
                  </TabsTrigger>
                  <TabsTrigger value="intake">
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    No Transcript? Quick Intake
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload file</label>
                    <Input type="file" accept=".txt,.md,.pdf" onChange={handleFileChange} />
                    {file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Or paste transcript</label>
                    <Textarea
                      placeholder="Paste your meeting transcript here..."
                      className="min-h-[200px]"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meeting type</label>
                    <Select value={meetingType} onValueChange={setMeetingType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meeting type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Client Call">Client Call</SelectItem>
                        <SelectItem value="Internal Standup">Internal Standup</SelectItem>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="Incident Review">Incident Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={handleRunAnalysis} disabled={isAnalyzing} className="gap-2">
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {isAnalyzing ? "Analyzing..." : "Run Analysis"}
                  </Button>
                </TabsContent>

                <TabsContent value="intake" className="space-y-4">
                  {intakeQuestions && (
                    <div className="max-w-lg space-y-4">
                      {Object.entries(intakeAnswers).map(([questionId, answer], idx) => {
                        const question = intakeQuestions.questions.find((q: any) => q.id === questionId);
                        return (
                          <div key={questionId} className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                                <Lightbulb className="h-3 w-3 text-primary-foreground" />
                              </div>
                              <p className="text-sm font-medium">{question?.question}</p>
                            </div>
                            <div className="ml-8 rounded-md bg-accent p-3">
                              <p className="text-sm">{answer}</p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {intakeStep < intakeQuestions.questions.length && !followUpQuestion && (
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                              <Lightbulb className="h-3 w-3 text-primary-foreground" />
                            </div>
                            <p className="text-sm font-medium">{intakeQuestions.questions[intakeStep].question}</p>
                          </div>
                          <div className="ml-8 flex gap-2">
                            <Input
                              value={currentAnswer}
                              onChange={(e) => setCurrentAnswer(e.target.value)}
                              placeholder="Type your answer..."
                              onKeyDown={(e) => e.key === "Enter" && handleIntakeSubmit()}
                              disabled={isAnalyzing}
                            />
                            <Button onClick={() => handleIntakeSubmit()} size="icon" disabled={isAnalyzing}>
                              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground ml-8">
                            Question {intakeStep + 1} of {intakeQuestions.questions.length}
                          </p>
                        </div>
                      )}

                      {followUpQuestion && (
                        <div className="space-y-3 mt-4 p-4 bg-primary/5 rounded-md border border-primary/20">
                          <div className="flex items-start gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                              <Lightbulb className="h-3 w-3 text-primary-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1">Follow-up Question</p>
                              <p className="text-sm text-muted-foreground">{followUpQuestion}</p>
                            </div>
                          </div>
                          <div className="ml-8 flex gap-2">
                            <Input
                              value={currentAnswer}
                              onChange={(e) => setCurrentAnswer(e.target.value)}
                              placeholder="Type your answer..."
                              onKeyDown={(e) => e.key === "Enter" && handleIntakeSubmit()}
                              disabled={isAnalyzing}
                            />
                            <Button onClick={() => handleIntakeSubmit()} size="icon" disabled={isAnalyzing}>
                              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => handleIntakeSubmit(true)} 
                              disabled={isAnalyzing}
                            >
                              Skip
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Analysis Results</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateJira}
                  disabled={isGeneratingJira}
                >
                  {isGeneratingJira ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <FileText className="h-4 w-4 mr-1.5" />}
                  Generate Jira Stories
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateFollowUp}
                  disabled={isGeneratingFollowUp}
                >
                  {isGeneratingFollowUp ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Mail className="h-4 w-4 mr-1.5" />}
                  Generate Follow-Up
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateWeeklyStatus}
                  disabled={isGeneratingWeekly}
                >
                  {isGeneratingWeekly ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <FileText className="h-4 w-4 mr-1.5" />}
                  Weekly Status
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateWhatChanged}
                  disabled={isGeneratingChanges}
                >
                  {isGeneratingChanges ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <TrendingUp className="h-4 w-4 mr-1.5" />}
                  What Changed?
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setAnalysisResult(null); setJiraStories(null); setFollowUpEmails(null); setWeeklyStatus(null); setWhatChanged(null); setActionsApproved(false); setIntakeStep(0); setIntakeAnswers({}); }}>
                  New Analysis
                </Button>
              </div>
            </div>

            <Tabs value={resultsTab} onValueChange={setResultsTab}>
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="decisions">Decisions ({analysisResult.decisions?.length || 0})</TabsTrigger>
                <TabsTrigger value="risks">Risks ({analysisResult.risks?.length || 0})</TabsTrigger>
                <TabsTrigger value="actions">Actions ({analysisResult.actionItems?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analysisResult.decisions?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Decisions</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="rounded-md bg-destructive/10 p-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analysisResult.risks?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Risks</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="rounded-md bg-orange-500/10 p-2">
                        <Ban className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analysisResult.actionItems?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Action Items</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {analysisResult.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Executive Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.summary.map((point: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="decisions" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Decision</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisResult.decisions?.map((d: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{d.decision}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{d.rationale}</p>
                                {d.evidence && (
                                  <Accordion type="single" collapsible className="mt-1">
                                    <AccordionItem value="evidence" className="border-0">
                                      <AccordionTrigger className="py-1 text-xs text-primary hover:no-underline">
                                        View evidence
                                      </AccordionTrigger>
                                      <AccordionContent className="text-xs text-muted-foreground italic">
                                        "{d.evidence}"
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{d.owner || "Unassigned"}</TableCell>
                            <TableCell><ConfidenceBadge confidence={d.confidence || 0} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="risks" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Risk</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisResult.risks?.map((r: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{r.risk}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{r.mitigation}</p>
                              </div>
                            </TableCell>
                            <TableCell><SeverityBadge severity={r.severity} /></TableCell>
                            <TableCell className="text-sm">{r.owner || "Unassigned"}</TableCell>
                            <TableCell><ConfidenceBadge confidence={r.confidence || 0} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisResult.actionItems?.map((a: any, i: number) => (
                          <TableRow key={i} className={a.status === "cancelled" ? "opacity-50" : ""}>
                            <TableCell className={`text-sm ${a.status === "cancelled" ? "line-through" : ""}`}>
                              {a.action}
                            </TableCell>
                            <TableCell className="text-sm">{a.owner || "Unassigned"}</TableCell>
                            <TableCell><SeverityBadge severity={a.priority || "Med"} /></TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`text-[11px] ${
                                  a.status === "completed" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                  a.status === "cancelled" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                  a.status === "in-progress" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                  "bg-gray-500/10 text-gray-600 border-gray-500/20"
                                }`}
                              >
                                {a.status || "pending"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {jiraStories && (
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Generated Jira Stories</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(JSON.stringify(jiraStories.stories, null, 2), "Jira stories")}
                  >
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jiraStories.stories?.map((story: any, i: number) => (
                    <Card key={i} className="border-l-4 border-l-primary">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{story.title}</h4>
                            <p className="text-xs text-muted-foreground">{story.userStory}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopy(
                              `Title: ${story.title}\n\nUser Story: ${story.userStory}\n\nAcceptance Criteria:\n${story.acceptanceCriteria.map((c: string) => `- ${c}`).join('\n')}\n\nPriority: ${story.priority}\nOwner: ${story.owner}`,
                              "Story"
                            )}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium mb-1.5">Acceptance Criteria:</p>
                          <ul className="space-y-1">
                            {story.acceptanceCriteria?.map((criteria: string, j: number) => (
                              <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                {criteria}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex items-center gap-4 pt-2 border-t">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Priority:</span>
                            <SeverityBadge severity={story.priority} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Owner:</span>
                            <span className="text-xs font-medium">{story.owner || "Unassigned"}</span>
                          </div>
                          {story.dependencies && story.dependencies.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">Dependencies:</span>
                              <span className="text-xs">{story.dependencies.join(", ")}</span>
                            </div>
                          )}
                          <div className="ml-auto">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleScheduleStory(story)}
                            >
                              <CalendarIcon className="h-3 w-3 mr-1.5" />
                              Schedule Deadline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {followUpEmails && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Follow-Up Emails</h3>
                  <p className="text-xs text-muted-foreground">
                    {[followUpEmails.general, followUpEmails.risks, followUpEmails.blockers, followUpEmails.actions].filter(Boolean).length} targeted emails generated
                  </p>
                </div>

                {/* General Summary Email */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        General Summary
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        To: {followUpEmails.general.recipients}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCopy(
                        `Subject: ${followUpEmails.general.subject}\n\n${followUpEmails.general.body}`,
                        "General email"
                      )}
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copy
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Subject:</p>
                      <p className="text-sm font-semibold">{followUpEmails.general.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Body:</p>
                      <div className="bg-muted/50 rounded-md p-4 text-sm whitespace-pre-wrap">
                        {followUpEmails.general.body}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Email */}
                {followUpEmails.risks && (
                  <Card className="border-l-4 border-l-destructive">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          Risk Alert
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          To: {followUpEmails.risks.recipients}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopy(
                          `Subject: ${followUpEmails.risks.subject}\n\n${followUpEmails.risks.body}`,
                          "Risk email"
                        )}
                      >
                        <Copy className="h-4 w-4 mr-1.5" />
                        Copy
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Subject:</p>
                        <p className="text-sm font-semibold">{followUpEmails.risks.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Body:</p>
                        <div className="bg-destructive/5 rounded-md p-4 text-sm whitespace-pre-wrap border border-destructive/20">
                          {followUpEmails.risks.body}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Blocker Email */}
                {followUpEmails.blockers && (
                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Ban className="h-4 w-4 text-orange-500" />
                          Blockers & Dependencies
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          To: {followUpEmails.blockers.recipients}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopy(
                          `Subject: ${followUpEmails.blockers.subject}\n\n${followUpEmails.blockers.body}`,
                          "Blocker email"
                        )}
                      >
                        <Copy className="h-4 w-4 mr-1.5" />
                        Copy
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Subject:</p>
                        <p className="text-sm font-semibold">{followUpEmails.blockers.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Body:</p>
                        <div className="bg-orange-500/5 rounded-md p-4 text-sm whitespace-pre-wrap border border-orange-500/20">
                          {followUpEmails.blockers.body}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Items Email */}
                {followUpEmails.actions && (
                  <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Action Items
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          To: {followUpEmails.actions.recipients}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopy(
                          `Subject: ${followUpEmails.actions.subject}\n\n${followUpEmails.actions.body}`,
                          "Action items email"
                        )}
                      >
                        <Copy className="h-4 w-4 mr-1.5" />
                        Copy
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Subject:</p>
                        <p className="text-sm font-semibold">{followUpEmails.actions.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Body:</p>
                        <div className="bg-primary/5 rounded-md p-4 text-sm whitespace-pre-wrap border border-primary/20">
                          {followUpEmails.actions.body}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {analysisResult?.workflow && !actionsApproved && (
              <Card className="mt-6 border-primary/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Proposed Actions - Human Approval Required
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Workflow outcome: <Badge variant="outline" className="ml-1">{analysisResult.workflow.outcome}</Badge>
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">AI Reasoning:</p>
                    <p className="text-sm text-muted-foreground">{analysisResult.workflow.reasoning}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <ConfidenceBadge confidence={analysisResult.workflow.confidence} />
                    </div>
                  </div>

                  {analysisResult.workflow.proposedActions && analysisResult.workflow.proposedActions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Proposed Actions:</p>
                      {analysisResult.workflow.proposedActions.map((action: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-md border bg-card">
                          <div className={`rounded-full p-1.5 shrink-0 ${
                            action.priority === "high" ? "bg-destructive/10" : "bg-primary/10"
                          }`}>
                            {action.type === "escalate" ? (
                              <AlertTriangle className={`h-3 w-3 ${
                                action.priority === "high" ? "text-destructive" : "text-orange-500"
                              }`} />
                            ) : action.type === "jira" ? (
                              <FileText className="h-3 w-3 text-primary" />
                            ) : (
                              <Mail className="h-3 w-3 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px]">{action.type}</Badge>
                              <SeverityBadge severity={action.priority === "high" ? "High" : action.priority === "medium" ? "Med" : "Low"} />
                            </div>
                            <p className="text-sm">{action.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {analysisResult.workflow.needsReview && analysisResult.workflow.needsReview.length > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-3">
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">⚠️ Needs Review:</p>
                      <ul className="space-y-1">
                        {analysisResult.workflow.needsReview.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleApproveActions}
                      disabled={isApprovingActions}
                    >
                      {isApprovingActions ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                      Approve All Actions
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRejectActions}
                      disabled={isApprovingActions}
                    >
                      <Ban className="h-4 w-4 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {weeklyStatus && (
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Weekly Status Update</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <Badge variant={
                        weeklyStatus.status === "green" ? "default" : 
                        weeklyStatus.status === "yellow" ? "secondary" : 
                        "destructive"
                      } className="text-[10px]">
                        {weeklyStatus.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(
                      `Subject: ${weeklyStatus.subject}\n\n${weeklyStatus.body}`,
                      "Weekly status"
                    )}
                  >
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy Status
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Subject:</p>
                    <p className="text-sm font-semibold">{weeklyStatus.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Status Update:</p>
                    <div className="bg-muted/50 rounded-md p-4 text-sm whitespace-pre-wrap">
                      {weeklyStatus.body}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {whatChanged && (
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    What Changed?
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(
                      `What Changed:\n\n${whatChanged.summary}\n\nNew Decisions:\n${whatChanged.newDecisions.join('\n')}\n\nChanged Risks:\n${whatChanged.changedRisks.join('\n')}\n\nResolved Items:\n${whatChanged.resolvedItems.join('\n')}`,
                      "What changed summary"
                    )}
                  >
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy Summary
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Summary:</p>
                    <p className="text-sm text-muted-foreground">{whatChanged.summary}</p>
                  </div>

                  {whatChanged.newDecisions && whatChanged.newDecisions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        New Decisions ({whatChanged.newDecisions.length})
                      </p>
                      <ul className="space-y-1">
                        {whatChanged.newDecisions.map((decision: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground pl-6">• {decision}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {whatChanged.changedRisks && whatChanged.changedRisks.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Changed Risks ({whatChanged.changedRisks.length})
                      </p>
                      <ul className="space-y-1">
                        {whatChanged.changedRisks.map((risk: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground pl-6">• {risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {whatChanged.resolvedItems && whatChanged.resolvedItems.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Resolved Items ({whatChanged.resolvedItems.length})
                      </p>
                      <ul className="space-y-1">
                        {whatChanged.resolvedItems.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground pl-6">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Schedule Deadline Dialog */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Story Deadline</DialogTitle>
            </DialogHeader>
            {selectedStory && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{selectedStory.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedStory.userStory}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline Date</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will create a deadline event in your calendar with a 1-day reminder
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setScheduleDialogOpen(false);
                setSelectedStory(null);
                setDeadlineDate("");
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSchedule}
                disabled={scheduleDeadlineMutation.isPending || !deadlineDate}
              >
                {scheduleDeadlineMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="h-4 w-4 mr-1.5" />
                    Add to Calendar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
