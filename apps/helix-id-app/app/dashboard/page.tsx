import {
  Bot,
  ShieldCheck,
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Fingerprint,
  Wallet,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { readJsonFile } from "@/lib/server/json-store"

type Agent = {
  id: string
  did: string
  name: string
  walletId: string
  status: string
  createdAt: string
  vc_id?: string
}

type AgentVC = {
  vc_id: string
  agent_id: string
  status: string
  issued_at: string
}

type Activity = {
  id: string
  timestamp: string
  type: string
  description: string
  agentName?: string
}

type Stat = {
  label: string
  value: string
  change: string
  trend: "up" | "down"
  icon: typeof Bot
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} hour${diffH > 1 ? "s" : ""} ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD} day${diffD > 1 ? "s" : ""} ago`
}

function formatActivityType(type: string): string {
  const map: Record<string, string> = {
    VC_ISSUED: "VC Issued",
    AGENT_CREATED: "Agent Created",
  }
  return map[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function DashboardPage() {
  const [agents, vcs, activity] = await Promise.all([
    readJsonFile<Agent[]>("data/agents.json", []),
    readJsonFile<AgentVC[]>("data/agent-vcs.json", []),
    readJsonFile<Activity[]>("data/activity-log.json", []),
  ])

  const totalAgents = agents.length
  const activeAgents = agents.filter((a) => a.status === "active").length

  const activeCreds = vcs.filter((vc) => vc.status === "active").length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const actionsToday = activity.filter((a) => {
    const t = new Date(a.timestamp)
    return !Number.isNaN(t.getTime()) && t >= today
  }).length

  const riskAlerts = activity.filter((a) =>
    (a.type || "").toUpperCase().includes("VIOLATION")
  ).length

  const stats: Stat[] = [
    {
      label: "Total Agents",
      value: String(totalAgents),
      change: `${activeAgents} active`,
      trend: "up",
      icon: Bot,
    },
    {
      label: "Active Credentials",
      value: String(activeCreds),
      change: "Based on issued VCs",
      trend: "up",
      icon: ShieldCheck,
    },
    {
      label: "Actions Today",
      value: String(actionsToday),
      change: "Events in activity log",
      trend: "up",
      icon: ActivityIcon,
    },
    {
      label: "Risk Alerts",
      value: String(riskAlerts),
      change: "Violations in logs",
      trend: riskAlerts > 0 ? "up" : "down",
      icon: AlertTriangle,
    },
  ]

  const recentAgents = [...agents]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)

  const recentActivity = [...activity]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your AI agent identity layer at a glance.
        </p>
      </div>

      {/* Stats Grid - synced with Agents / Credentials / Activity */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <stat.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-success" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-success" />
                  )}
                  <span className="text-muted-foreground">{stat.change}</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trust Architecture Banner */}
      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trust Architecture
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { icon: Fingerprint, label: "Verifiable Identity (DID)" },
              { icon: ShieldCheck, label: "Scoped Authority (VC)" },
              { icon: Wallet, label: "Proof Before Acting" },
              { icon: ActivityIcon, label: "Continuously Audited" },
              { icon: XCircle, label: "Instantly Revocable" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
                  <step.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    {step.label}
                  </span>
                </div>
                {i < 4 && (
                  <span className="text-muted-foreground">{">"}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Agents */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground">
              Recent Agents
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex flex-col gap-3">
              {recentAgents.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No agents onboarded yet. Use Agent Onboarding to register a
                  new agent.
                </p>
              )}
              {recentAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-md border border-border bg-secondary/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {agent.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {agent.did}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        agent.status === "active" ? "default" : "destructive"
                      }
                      className={
                        agent.status === "active"
                          ? "bg-success/10 text-success hover:bg-success/10"
                          : ""
                      }
                    >
                      {agent.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(agent.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex flex-col gap-3">
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No recent activity yet. Once agents begin acting with
                  credentials, events will appear here.
                </p>
              )}
              {recentActivity.map((item) => {
                const isViolation = (item.type || "")
                  .toUpperCase()
                  .includes("VIOLATION")
                const iconApproved = !isViolation
                return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-border bg-secondary/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {iconApproved ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatActivityType(item.type || "")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.agentName || "Unknown agent"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        iconApproved ? "default" : "destructive"
                      }
                      className={
                        iconApproved
                          ? "bg-success/10 text-success hover:bg-success/10"
                          : ""
                      }
                    >
                      {iconApproved ? "Approved" : "Violation"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(item.timestamp)}
                    </span>
                  </div>
                </div>
              )})}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
