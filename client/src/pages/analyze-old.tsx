import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Play,
  FileText,
  AlertTriangle,
  Ban,
  Copy,
  Download,
  Send,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import {
  analysisSummary,
  analysisDecisions,
  analysisRisks,
  jiraDrafts,
  followUpDraft,
  proposedActions,
  intakeQuestions,
} from "@/lib/mock-data";

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, string> = {
    High: "bg-destructive/10 text-destructive border-destructive/20",
    Med: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    Low: "bg-highlight/10 text-highlight-foreground dark:text-highlight border-highlight/20",
  };
  return (
    <Badge variant="outline" className={`text-[11px] font-medium ${variants[severity] || ""}`}>
      {severity}
    </Badge>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const isLow = confidence < 70;
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isLow ? "bg-orange-500" : "bg-primary"
          }`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className={`text-xs ${isLow ? "text-orange-500" : "text-muted-foreground"}`}>
        {confidence}%
      </span>
      {isLow && (
        <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/20">
          Needs Review
        </Badge>
      )}
    </div>
  );
}

export default function Analyze() {
  const { toast } = useToast();
  const [showResults, setShowResults] = useState(false);
  const [inputTab, setInputTab] = useState("upload");
  const [resultsTab, setResultsTab] = useState("summary");
  const [meetingType, setMeetingType] = useState("");
  const [transcript, setTranscript] = useState("");
  const [intakeStep, setIntakeStep] = useState(0);
  const [intakeAnswers, setIntakeAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [selectedActions, setSelectedActions] = useState<Record<string, boolean>>(
    Object.fromEntries(proposedActions.map((a) => [a.id, a.selected]))
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const handleRunAnalysis = () => {
    setShowResults(true);
    setResultsTab("summary");
    toast({ title: "Analysis Complete", description: "Transcript processed successfully." });
  };

  const handleIntakeSubmit = () => {
    if (currentAnswer.trim()) {
      const newAnswers = [...intakeAnswers, currentAnswer.trim()];
      setIntakeAnswers(newAnswers);
      setCurrentAnswer("");
      if (intakeStep < intakeQuestions.length - 1) {
        setIntakeStep(intakeStep + 1);
      } else {
        setShowResults(true);
        setResultsTab("summary");
        toast({ title: "Intake Complete", description: "Generating outputs from your responses." });
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Transcript Analysis" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {!showResults ? (
          <Card data-testid="card-input">
            <CardContent className="p-6">
              <Tabs value={inputTab} onValueChange={setInputTab}>
                <TabsList className="mb-6" data-testid="tabs-input-method">
                  <TabsTrigger value="upload" data-testid="tab-upload">
                    <Upload className="h-4 w-4 mr-1.5" />
                    Upload / Paste Transcript
                  </TabsTrigger>
                  <TabsTrigger value="intake" data-testid="tab-intake">
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    No Transcript? Quick Intake
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <div role="button" tabIndex={0} aria-label="Upload transcript file" className="border-2 border-dashed rounded-md p-8 text-center hover-elevate cursor-pointer" data-testid="dropzone-upload">
                    <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">Drop your transcript here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Accepts .txt, .md, .pdf
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Or paste transcript</label>
                    <Textarea
                      placeholder="Paste your meeting transcript here..."
                      className="min-h-[160px] text-sm resize-none"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      data-testid="textarea-transcript"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meeting type</label>
                    <Select value={meetingType} onValueChange={setMeetingType}>
                      <SelectTrigger data-testid="select-meeting-type">
                        <SelectValue placeholder="Select meeting type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client Call</SelectItem>
                        <SelectItem value="standup">Internal Standup</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="incident">Incident Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleRunAnalysis} className="gap-2" data-testid="button-run-analysis">
                    <Play className="h-4 w-4" />
                    Run Analysis
                  </Button>
                </TabsContent>

                <TabsContent value="intake" className="space-y-4">
                  <div className="max-w-lg space-y-4">
                    {intakeAnswers.map((answer, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                            <Lightbulb className="h-3 w-3 text-primary-foreground" />
                          </div>
                          <p className="text-sm font-medium">{intakeQuestions[idx]}</p>
                        </div>
                        <div className="ml-8 rounded-md bg-accent p-3">
                          <p className="text-sm">{answer}</p>
                        </div>
                      </div>
                    ))}
                    {intakeStep < intakeQuestions.length && (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                            <Lightbulb className="h-3 w-3 text-primary-foreground" />
                          </div>
                          <p className="text-sm font-medium">{intakeQuestions[intakeStep]}</p>
                        </div>
                        <div className="ml-8 flex gap-2">
                          <Input
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder="Type your answer..."
                            onKeyDown={(e) => e.key === "Enter" && handleIntakeSubmit()}
                            data-testid="input-intake-answer"
                          />
                          <Button onClick={handleIntakeSubmit} size="icon" data-testid="button-intake-submit">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground ml-8">
                          Question {intakeStep + 1} of {intakeQuestions.length}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-sm font-medium text-muted-foreground" data-testid="text-results-title">Analysis Results</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowResults(false);
                  setIntakeStep(0);
                  setIntakeAnswers([]);
                }}
                data-testid="button-new-analysis"
              >
                New Analysis
              </Button>
            </div>

            <Tabs value={resultsTab} onValueChange={setResultsTab}>
              <TabsList className="flex-wrap" data-testid="tabs-results">
                <TabsTrigger value="summary" data-testid="tab-summary">Summary</TabsTrigger>
                <TabsTrigger value="decisions" data-testid="tab-decisions">Decisions</TabsTrigger>
                <TabsTrigger value="risks" data-testid="tab-risks">Risks</TabsTrigger>
                <TabsTrigger value="dependencies" data-testid="tab-dependencies">Dependencies</TabsTrigger>
                <TabsTrigger value="jira" data-testid="tab-jira">Jira Drafts</TabsTrigger>
                <TabsTrigger value="followup" data-testid="tab-followup">Follow-up</TabsTrigger>
                <TabsTrigger value="actions" data-testid="tab-actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card data-testid="card-decisions-count">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analysisSummary.decisionsCount}</p>
                        <p className="text-xs text-muted-foreground">Decisions</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-risks-count">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="rounded-md bg-destructive/10 p-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analysisSummary.risksCount}</p>
                        <p className="text-xs text-muted-foreground">Risks</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-blockers-count">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="rounded-md bg-orange-500/10 p-2">
                        <Ban className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analysisSummary.blockersCount}</p>
                        <p className="text-xs text-muted-foreground">Blockers</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card data-testid="card-exec-summary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisSummary.execSummary.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="decisions" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Decision</TableHead>
                          <TableHead className="text-xs">Owner</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisDecisions.map((d) => (
                          <TableRow key={d.id} data-testid={`row-decision-${d.id}`}>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{d.decision}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{d.rationale}</p>
                                <Accordion type="single" collapsible className="mt-1">
                                  <AccordionItem value="evidence" className="border-0">
                                    <AccordionTrigger className="py-1 text-xs text-primary hover:no-underline">
                                      View evidence
                                    </AccordionTrigger>
                                    <AccordionContent className="text-xs text-muted-foreground italic pb-1">
                                      "{d.evidence}"
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{d.owner}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{d.date}</TableCell>
                            <TableCell>
                              <ConfidenceBadge confidence={d.confidence} />
                            </TableCell>
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
                          <TableHead className="text-xs">Risk</TableHead>
                          <TableHead className="text-xs">Likelihood</TableHead>
                          <TableHead className="text-xs">Impact</TableHead>
                          <TableHead className="text-xs">Severity</TableHead>
                          <TableHead className="text-xs">Owner</TableHead>
                          <TableHead className="text-xs">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisRisks.map((r) => (
                          <TableRow key={r.id} data-testid={`row-risk-${r.id}`}>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{r.risk}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{r.mitigation}</p>
                                <Accordion type="single" collapsible className="mt-1">
                                  <AccordionItem value="evidence" className="border-0">
                                    <AccordionTrigger className="py-1 text-xs text-primary hover:no-underline">
                                      View evidence
                                    </AccordionTrigger>
                                    <AccordionContent className="text-xs text-muted-foreground italic pb-1">
                                      "{r.evidence}"
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{r.likelihood}</TableCell>
                            <TableCell className="text-sm">{r.impact}</TableCell>
                            <TableCell>
                              <SeverityBadge severity={r.severity} />
                            </TableCell>
                            <TableCell className="text-sm">{r.owner}</TableCell>
                            <TableCell>
                              <ConfidenceBadge confidence={r.confidence} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dependencies" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Dependency Chains</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysisDecisions.slice(0, 3).map((d, i) => (
                      <div key={i} className="flex items-center gap-3 flex-wrap">
                        <div className="rounded-md bg-primary/10 px-3 py-2">
                          <p className="text-sm font-medium">{d.decision.split(" ").slice(0, 4).join(" ")}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="rounded-md bg-destructive/10 px-3 py-2">
                          <p className="text-sm text-destructive">Blocked by: {d.rationale.split(" ").slice(0, 4).join(" ")}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Badge variant="secondary">{d.owner}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="jira" className="mt-4 space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleCopy(JSON.stringify(jiraDrafts, null, 2), "Jira JSON")}
                    data-testid="button-export-json"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export JSON
                  </Button>
                </div>
                <Accordion type="multiple" className="space-y-3" data-testid="accordion-jira-drafts">
                  {jiraDrafts.map((draft) => (
                    <AccordionItem
                      key={draft.id}
                      value={draft.id}
                      className="border rounded-md px-4"
                    >
                      <AccordionTrigger className="hover:no-underline" data-testid={`accordion-jira-${draft.id}`}>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-medium">{draft.title}</span>
                          <SeverityBadge severity={draft.priority} />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pb-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">User Story</p>
                          <p className="text-sm">{draft.story}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Acceptance Criteria</p>
                          <ul className="space-y-1">
                            {draft.criteria.map((c, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-3.5 w-3.5 text-highlight shrink-0 mt-0.5" />
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Dependencies</p>
                          {draft.dependencies.map((dep, i) => (
                            <Badge key={i} variant="secondary" className="text-xs mr-1">{dep}</Badge>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() =>
                            handleCopy(
                              `${draft.title}\n\n${draft.story}\n\nAcceptance Criteria:\n${draft.criteria.map((c) => `- ${c}`).join("\n")}`,
                              "Jira ticket"
                            )
                          }
                          data-testid={`button-copy-jira-${draft.id}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Jira
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="followup" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                    <CardTitle className="text-base">Follow-up Email Draft</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-regenerate">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Regenerate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleCopy(followUpDraft, "Follow-up email")}
                        data-testid="button-copy-followup"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border p-4 bg-accent/30 font-mono text-sm whitespace-pre-wrap leading-relaxed" data-testid="text-followup-draft">
                      {followUpDraft}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Proposed Actions</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Review and approve the actions below</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {proposedActions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center gap-3 p-3 rounded-md bg-accent/30"
                        data-testid={`action-item-${action.id}`}
                      >
                        <Checkbox
                          checked={selectedActions[action.id]}
                          onCheckedChange={(checked) =>
                            setSelectedActions({ ...selectedActions, [action.id]: !!checked })
                          }
                          data-testid={`checkbox-action-${action.id}`}
                        />
                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                          {action.type === "jira" && <FileText className="h-4 w-4 text-primary" />}
                          {action.type === "email" && <Send className="h-4 w-4 text-primary" />}
                          {action.type === "escalate" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          <span className="text-sm">{action.action}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2 flex-wrap">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="gap-1.5" data-testid="button-approve-selected">
                            <CheckCircle2 className="h-4 w-4" />
                            Approve Selected
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                            <AlertDialogDescription>
                              You are about to approve {Object.values(selectedActions).filter(Boolean).length} action(s).
                              This will create tickets, send emails, and/or escalate risks as selected. Continue?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid="button-cancel-approve">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => toast({ title: "Actions Approved", description: "Selected actions have been queued for execution." })}
                              data-testid="button-confirm-approve"
                            >
                              Approve
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button variant="outline" className="gap-1.5" data-testid="button-edit-before-approving">
                        Edit Before Approving
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
