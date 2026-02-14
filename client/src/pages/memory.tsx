import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Zap,
  TrendingUp,
  Clock,
  Filter,
  Brain,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { memoryTimeline, crossCallInsights, riskDriftData } from "@/lib/mock-data";

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "decision":
      return <CheckCircle2 className="h-4 w-4 text-primary" />;
    case "risk":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "action":
      return <Zap className="h-4 w-4 text-orange-500" />;
    case "jira":
      return <FileText className="h-4 w-4 text-blue-500" />;
    default:
      return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  }
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 28;
  const w = 80;
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

export default function Memory() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filtered = memoryTimeline.filter((item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (severityFilter !== "all") {
      if (!item.severity) return false;
      if (item.severity !== severityFilter) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Project Memory" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="decision">Decisions</SelectItem>
              <SelectItem value="risk">Risks</SelectItem>
              <SelectItem value="action">Actions</SelectItem>
              <SelectItem value="jira">Jira Drafts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-severity-filter">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Med">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </h3>
            {filtered.length > 0 ? (
              <div className="space-y-2">
                {filtered.map((item) => (
                  <Card key={item.id} className="hover-elevate" data-testid={`timeline-item-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <TypeIcon type={item.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{item.title}</p>
                            {item.severity && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  item.severity === "High"
                                    ? "bg-destructive/10 text-destructive border-destructive/20"
                                    : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                                }`}
                              >
                                {item.severity}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                            <span className="text-xs text-muted-foreground">{item.project}</span>
                            <span className="text-xs text-muted-foreground">{item.date}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{item.source}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No items match your filters.
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 italic">
                    "No risks detected. Either you're crushing it or the transcript is empty."
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card data-testid="card-risk-drift-memory">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Risk Drift</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {riskDriftData.slice(0, 3).map((risk) => (
                  <div key={risk.id} className="space-y-1" data-testid={`risk-drift-memory-${risk.id}`}>
                    <p className="text-xs truncate">{risk.risk}</p>
                    <div className="flex items-center gap-2">
                      <MiniSparkline data={risk.trend} />
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          risk.severity === "High"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                        }`}
                      >
                        {risk.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card data-testid="card-cross-call-insights">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Cross-call Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recurring Risks</p>
                  {crossCallInsights.recurringRisks.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-xs truncate">{r.risk}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{r.count}x</Badge>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Repeated Blockers</p>
                  {crossCallInsights.repeatedBlockers.map((b, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-xs truncate">{b.blocker}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{b.count}x</Badge>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Decisions Not Executed</p>
                  {crossCallInsights.unexecutedDecisions.map((d, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-xs truncate">{d.decision}</span>
                      <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 shrink-0">
                        {d.daysPending}d pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
