import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  dashboardMetrics,
  riskDriftData,
  dependencyChains,
  recentRuns,
} from "@/lib/mock-data";

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
  const metricCards = [
    {
      label: "High-Risk Items",
      value: dashboardMetrics.highRiskItems,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Overdue Actions",
      value: dashboardMetrics.overdueActions,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Decisions Awaiting",
      value: dashboardMetrics.decisionsAwaiting,
      icon: HelpCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Blocked Items",
      value: dashboardMetrics.blockedItems,
      icon: Ban,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

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
              {riskDriftData.map((risk) => (
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
            </CardContent>
          </Card>

          <Card data-testid="card-dependency-chains">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dependency Chains</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Tasks blocked by upstream dependencies</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {dependencyChains.map((chain) => (
                <div
                  key={chain.id}
                  className="rounded-md bg-accent/50 p-3"
                  data-testid={`dependency-chain-${chain.id}`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{chain.task}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Ban className="h-3 w-3 text-destructive shrink-0" />
                    <span>Blocked by:</span>
                    <span className="font-medium text-foreground">{chain.blockedBy}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Owner: <span className="text-foreground">{chain.owner}</span>
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${
                        chain.status === "blocked"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                      }`}
                    >
                      {chain.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-recent-runs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Runs</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Latest analysis and command executions</p>
          </CardHeader>
          <CardContent>
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
                {recentRuns.map((run) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
