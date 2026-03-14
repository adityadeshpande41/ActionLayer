import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, FileText, Ban, Loader2, TrendingUp, Pencil, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProject } from "@/hooks/use-project";
import { dashboard, analyses } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function SeverityBadge({ severity }: { severity: "High" | "Med" | "Low" }) {
  const variants: Record<string, string> = {
    High: "bg-destructive/10 text-destructive border-destructive/20",
    Med: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    Low: "bg-highlight/10 text-highlight-foreground dark:text-highlight border-highlight/20",
  };
  return (
    <Badge variant="outline" className={`text-[11px] font-medium ${variants[severity]}`}>
      {severity}
    </Badge>
  );
}

export default function Memory() {
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => analyses.rename(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-analyses"] });
      setEditingId(null);
      toast({ title: "Renamed", description: "Analysis name updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const startEdit = (analysis: any) => {
    setEditingId(analysis.id);
    setEditName(analysis.name || `Analysis #${analysis.id.slice(0, 8)}`);
  };

  const confirmEdit = (id: string) => {
    if (editName.trim()) renameMutation.mutate({ id, name: editName.trim() });
  };

  // Fetch risk drift (recurring risks)
  const { data: riskDrift, isLoading: riskLoading } = useQuery({
    queryKey: ["risk-drift"],
    queryFn: dashboard.riskDrift,
  });

  // Fetch recent analyses for timeline
  const { data: recentAnalyses, isLoading: analysesLoading } = useQuery({
    queryKey: ["recent-analyses"],
    queryFn: () => analyses.getRecent(20),
  });

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Project Memory" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cross-call insights and project history
            </p>
          </CardHeader>
          <CardContent>
            {analysesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading timeline...</p>
              </div>
            ) : recentAnalyses && recentAnalyses.length > 0 ? (
              <div className="space-y-3">
                {recentAnalyses.slice(0, 10).map((analysis: any) => {
                    const createdAt = new Date(analysis.createdAt);
                    const dateStr = createdAt.getFullYear() >= 2020
                      ? createdAt.toLocaleDateString()
                      : "Unknown date";
                    const displayName = analysis.name || `Analysis #${analysis.id.slice(0, 8)}`;

                    return (
                      <div key={analysis.id} className="flex items-start gap-3 p-3 rounded-md border group">
                        <div className="rounded-full bg-primary/10 p-2 shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {editingId === analysis.id ? (
                              <div className="flex items-center gap-1 flex-1">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmEdit(analysis.id);
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  className="h-6 text-sm py-0 px-2"
                                  autoFocus
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => confirmEdit(analysis.id)}>
                                  <Check className="h-3 w-3 text-green-600" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}>
                                  <X className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium">{displayName}</p>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:opacity-100"
                                  onClick={() => startEdit(analysis)}
                                >
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </Button>
                                <Badge variant="outline" className="text-[10px]">{dateStr}</Badge>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{analysis.decisionsCount || 0} decisions</span>
                            <span>{analysis.risksCount || 0} risks</span>
                            <span>{analysis.blockersCount || 0} blockers</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No project history yet. Start analyzing transcripts to build your project memory.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recurring Risks</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Risks mentioned across multiple calls
              </p>
            </CardHeader>
            <CardContent>
              {riskLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                </div>
              ) : riskDrift && riskDrift.length > 0 ? (
                <div className="space-y-3">
                  {riskDrift.map((risk: any, i: number) => (
                    <div key={i} className="p-3 rounded-md border border-destructive/20 bg-destructive/5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium flex-1">{risk.risk}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {risk.occurrences}x
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>First seen {risk.lastSeen && risk.lastSeen !== "Unknown" ? risk.lastSeen : "recently"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No recurring risks detected yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Repeated Blockers</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Common blockers across projects
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Ban className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No repeated blockers found yet
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unexecuted Decisions</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Decisions that haven't been acted upon
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                All decisions are up to date
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
