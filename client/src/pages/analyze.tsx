import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/hooks/use-project";
import { analyses, approvals } from "@/lib/api";
import { Upload, Play, Loader2, AlertTriangle, CheckCircle2, Ban, Copy, MessageSquare, ChevronRight, Lightbulb, ArrowRight, FileText, Mail, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
  const [followUpEmail, setFollowUpEmail] = useState<any>(null);
  const [weeklyStatus, setWeeklyStatus] = useState<any>(null);
  const [whatChanged, setWhatChanged] = useState<any>(null);
  const [isGeneratingJira, setIsGeneratingJira] = useState(false);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [isGeneratingChanges, setIsGeneratingChanges] = useState(false);
  const [isApprovingActions, setIsApprovingActions] = useState(false);
  const [actionsApproved, setActionsApproved] = useState(false);
  
  // Intake mode
  const [intakeStep, setIntakeStep] = useState(0);
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");

  const { data: intakeQuestions } = useQuery({
    queryKey: ["intake-questions"],
    queryFn: analyses.getIntakeQuestions,
    enabled: inputTab === "intake",
  });

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

  const handleIntakeSubmit = async () => {
    if (!currentAnswer.trim() || !intakeQuestions) return;

    if (!selectedProjectId) {
      toast({ title: "Error", description: "Please select a project first", variant: "destructive" });
      return;
    }

    const questionId = intakeQuestions.questions[intakeStep].id;
    const newAnswers = { ...intakeAnswers, [questionId]: currentAnswer.trim() };
    setIntakeAnswers(newAnswers);
    setCurrentAnswer("");

    if (intakeStep < intakeQuestions.questions.length - 1) {
      setIntakeStep(intakeStep + 1);
    } else {
      // Process intake
      setIsAnalyzing(true);
      try {
        const result = await analyses.processIntake({
          projectId: selectedProjectId,
          answers: newAnswers,
        });
        
        if (result.needsFollowUp) {
          // Add follow-up question
          toast({ title: "Follow-up Question", description: result.question });
        } else {
          // Store the full result including the analysis.id
          setAnalysisResult({
            id: result.analysis.id, // Extract the ID from the nested analysis object
            ...result,
          });
          setResultsTab("summary");
          toast({ title: "Intake Complete", description: "Analysis generated from your responses." });
        }
      } catch (error: any) {
        toast({ title: "Processing Failed", description: error.message, variant: "destructive" });
      } finally {
        setIsAnalyzing(false);
      }
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
      const result = await analyses.generateJira(analysisResult.id);
      // Backend returns { jiraDrafts }, map it to { stories }
      setJiraStories({ stories: result.jiraDrafts });
      toast({ title: "Jira Stories Generated", description: "AI-generated tickets are ready." });
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
      // Backend returns { email }, use it directly
      setFollowUpEmail(result.email);
      toast({ title: "Follow-Up Generated", description: "Email draft is ready." });
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
      setActionsApproved(true);
      toast({ 
        title: "Actions Rejected", 
        description: "Proposed actions have been rejected." 
      });
    } catch (error: any) {
      toast({ title: "Rejection Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsApprovingActions(false);
    }
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
                      
                      {intakeStep < intakeQuestions.questions.length && (
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
                            <Button onClick={handleIntakeSubmit} size="icon" disabled={isAnalyzing}>
                              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground ml-8">
                            Question {intakeStep + 1} of {intakeQuestions.questions.length}
                          </p>
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
                <Button variant="outline" size="sm" onClick={() => { setAnalysisResult(null); setJiraStories(null); setFollowUpEmail(null); setWeeklyStatus(null); setWhatChanged(null); setActionsApproved(false); setIntakeStep(0); setIntakeAnswers({}); }}>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisResult.actionItems?.map((a: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{a.action}</TableCell>
                            <TableCell className="text-sm">{a.owner || "Unassigned"}</TableCell>
                            <TableCell><SeverityBadge severity={a.priority || "Med"} /></TableCell>
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {followUpEmail && (
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Follow-Up Email Draft</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(
                      `Subject: ${followUpEmail.subject}\n\n${followUpEmail.body}`,
                      "Email draft"
                    )}
                  >
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy Email
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Subject:</p>
                    <p className="text-sm font-semibold">{followUpEmail.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Body:</p>
                    <div className="bg-muted/50 rounded-md p-4 text-sm whitespace-pre-wrap font-mono">
                      {followUpEmail.body}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
      </div>
    </div>
  );
}
