import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Clock,
  HelpCircle,
  Ban,
  TrendingUp,
  Loader2,
  Trash2,
  Edit,
  Eye,
  FileText,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboard, analyses } from "@/lib/api";
import { useProject } from "@/hooks/use-project";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";

function SeverityBadge({ severity }: { severity: "High" | "Med" | "Low" }) {
  const variants: Record<string, string> = {
    High: "bg-destructive/10 text-destructive border-destructive/20",
    Med: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    Low: "bg-highlight/10 text-highlight-foreground dark:text-highlight border-highlight/20",
  };
  return (
    <Badge variant="outline" className={`text-[11px] font-medium ${variants[severity]}`} data-testid={`badge-severity-${severity.toLowerCase()}`}>
      {severity}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    completed: "bg-highlight/10 text-highlight-foreground dark:text-highlight border-highlight/20",
    "in-progress": "bg-primary/10 text-primary border-primary/20",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <Badge variant="outline" className={`text-[11px] font-medium ${variants[status] || ""}`} data-testid={`badge-status-${status}`}>
      {status}
    </Badge>
  );
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 56;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Dashboard() {
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [analysisName, setAnalysisName] = useState("");

  // Fetch real data from backend
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: dashboard.metrics,
  });

  const { data: riskDrift, isLoading: riskLoading } = useQuery({
    queryKey: ["risk-drift"],
    queryFn: dashboard.riskDrift,
  });

  const { data: recentRuns, isLoading: runsLoading } = useQuery({
    queryKey: ["recent-runs"],
    queryFn: () => dashboard.recentRuns(10),
  });

  // Fetch saved analyses for selected project
  const { data: savedAnalyses, isLoading: analysesLoading } = useQuery({
    queryKey: ["saved-analyses", selectedProjectId],
    queryFn: () => selectedProjectId ? analyses.getByProject(selectedProjectId) : [],
    enabled: !!selectedProjectId,
  });

  // Delete analysis mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/analyses/${id}`, { 
        method: "DELETE",
        credentials: "include" 
      }).then(res => {
        if (!res.ok) throw new Error("Failed to delete");
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-analyses"] });
      queryClient.invalidateQueries({ queryKey: ["recent-runs"] });
      toast({ title: "Analysis Deleted", description: "The analysis has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete analysis", variant: "destructive" });
    },
  });

  const handleDelete = (analysis: any) => {
    if (confirm(`Delete analysis from ${new Date(analysis.createdAt).toLocaleDateString()}?`)) {
      deleteMutation.mutate(analysis.id);
    }
  };

  const handleRename = (analysis: any) => {
    setSelectedAnalysis(analysis);
    setAnalysisName(analysis.name || `Analysis ${new Date(analysis.createdAt).toLocaleDateString()}`);
    setRenameDialogOpen(true);
  };

  const handleView = (analysis: any) => {
    // Store the analysis ID in sessionStorage and navigate to analyze page
    sessionStorage.setItem('viewAnalysisId', analysis.id);
    setLocation('/analyze');
  };

  const metricCards = [
    {
      label: "High-Risk Items",
      value: metrics?.highRiskItems ?? 0,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Overdue Actions",
      value: metrics?.overdueActions ?? 0,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Decisions Awaiting",
      value: metrics?.decisionsAwaiting ?? 0,
      icon: HelpCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Blocked Items",
      value: metrics?.blockedItems ?? 0,
      icon: Ban,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  if (metricsLoading || riskLoading || runsLoading) {
    return (
      <div className="flex flex-col h-full">
        <AppHeader title="Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Dashboard" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3" data-testid="text-todays-focus">Today's Focus</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((card) => (
              <Card key={card.label} className="hover-elevate cursor-default" data-testid={`card-metric-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-sm text-muted-foreground">{card.label}</span>
                    <div className={`rounded-md p-1.5 ${card.bgColor}`}>
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold tracking-tight" data-testid={`text-metric-value-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-risk-drift">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <div>
                <CardTitle className="text-base">Risk Drift</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Top recurring risks across projects</p>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {riskDrift && riskDrift.length > 0 ? (
                <>
                  {riskDrift.map((risk: any) => (
                    <div
                      key={risk.id}
                      className="flex items-center justify-between gap-3 py-2 border-b last:border-0"
                      data-testid={`risk-drift-item-${risk.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{risk.risk}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <SeverityBadge severity={risk.severity} />
                          <span className="text-xs text-muted-foreground">
                            mentioned {risk.mentions}x
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <MiniSparkline data={risk.trend} />
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {risk.lastSeen}
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground italic pt-1" data-testid="text-watching-edges">
                    ActionLayer is watching the edges.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No risks detected yet. Start analyzing transcripts to track risks.
                </p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-dependency-chains">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dependency Chains</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Tasks blocked by upstream dependencies</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground text-center py-8">
                No dependency chains detected yet. Dependencies will appear here after transcript analysis.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-recent-runs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Runs</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Latest analysis and command executions</p>
          </CardHeader>
          <CardContent>
            {recentRuns && recentRuns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date/Time</TableHead>
                    <TableHead className="text-xs">Project</TableHead>
                    <TableHead className="text-xs">Input Type</TableHead>
                    <TableHead className="text-xs">Outcome</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRuns.map((run: any) => (
                    <TableRow key={run.id} data-testid={`row-run-${run.id}`}>
                      <TableCell className="text-sm font-mono text-muted-foreground">{run.date}</TableCell>
                      <TableCell className="text-sm">{run.project}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[11px]">{run.inputType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">{run.outcome}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={run.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No analysis runs yet. Upload a transcript to get started!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Saved Analyses Section */}
        {selectedProjectId && (
          <Card data-testid="card-saved-analyses">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Saved Analyses</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All analyses for the selected project
                  </p>
                </div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {analysesLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading analyses...</p>
                </div>
              ) : savedAnalyses && savedAnalyses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Decisions</TableHead>
                      <TableHead className="text-xs">Risks</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedAnalyses.map((analysis: any) => (
                      <TableRow key={analysis.id} data-testid={`row-analysis-${analysis.id}`}>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {new Date(analysis.createdAt).toLocaleDateString()}
                          <br />
                          <span className="text-xs">
                            {new Date(analysis.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[11px]">
                            {analysis.inputType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          {analysis.decisionsCount || 0}
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          {analysis.risksCount || 0}
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          {analysis.actionItemsCount || 0}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={analysis.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleView(analysis)}
                              title="View analysis"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleRename(analysis)}
                              title="Rename analysis"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(analysis)}
                              disabled={deleteMutation.isPending}
                              title="Delete analysis"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No saved analyses yet. Run an analysis to see it here!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rename Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Analysis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="analysis-name">Analysis Name</Label>
                <Input
                  id="analysis-name"
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                  placeholder="Enter a name for this analysis"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ 
                  title: "Coming Soon", 
                  description: "Analysis renaming will be available soon!" 
                });
                setRenameDialogOpen(false);
              }}>
                Save Name
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
