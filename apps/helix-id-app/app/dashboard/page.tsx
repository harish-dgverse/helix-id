import {
  Bot,
  ShieldCheck,
  Activity,
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

const stats = [
  {
    label: "Total Agents",
    value: "24",
    change: "+3 this week",
    trend: "up" as const,
    icon: Bot,
  },
  {
    label: "Active Credentials",
    value: "142",
    change: "+12 this week",
    trend: "up" as const,
    icon: ShieldCheck,
  },
  {
    label: "Actions Today",
    value: "1,847",
    change: "+23% vs yesterday",
    trend: "up" as const,
    icon: Activity,
  },
  {
    label: "Risk Alerts",
    value: "3",
    change: "-2 from last week",
    trend: "down" as const,
    icon: AlertTriangle,
  },
]

const recentAgents = [
  {
    name: "OrderBot-v3",
    did: "did:hedera:mainnet:z6Mk...a4Xq",
    status: "Active",
    credentials: 5,
    lastActivity: "2 min ago",
  },
  {
    name: "FlightAgent-prod",
    did: "did:hedera:mainnet:z6Mk...b8Rw",
    status: "Active",
    credentials: 3,
    lastActivity: "15 min ago",
  },
  {
    name: "DataRetriever-v2",
    did: "did:hedera:mainnet:z6Mk...c2Yz",
    status: "Active",
    credentials: 7,
    lastActivity: "1 hour ago",
  },
  {
    name: "PaymentProcessor",
    did: "did:hedera:mainnet:z6Mk...d9Lm",
    status: "Suspended",
    credentials: 2,
    lastActivity: "3 hours ago",
  },
  {
    name: "SupportAgent-v1",
    did: "did:hedera:mainnet:z6Mk...e5Np",
    status: "Active",
    credentials: 4,
    lastActivity: "30 min ago",
  },
]

const recentActivity = [
  {
    agent: "OrderBot-v3",
    action: "Book Order",
    result: "Approved",
    timestamp: "2 min ago",
  },
  {
    agent: "FlightAgent-prod",
    action: "Book Flight Ticket",
    result: "Approved",
    timestamp: "15 min ago",
  },
  {
    agent: "DataRetriever-v2",
    action: "Access Internal System",
    result: "Rejected",
    timestamp: "1 hour ago",
  },
  {
    agent: "PaymentProcessor",
    action: "Execute Payment",
    result: "Approved",
    timestamp: "2 hours ago",
  },
  {
    agent: "SupportAgent-v1",
    action: "Data Retrieval Access",
    result: "Approved",
    timestamp: "3 hours ago",
  },
]

export default function DashboardPage() {
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

      {/* Stats Grid */}
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
              { icon: Activity, label: "Continuously Audited" },
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
              {recentAgents.map((agent) => (
                <div
                  key={agent.name}
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
                        agent.status === "Active" ? "default" : "destructive"
                      }
                      className={
                        agent.status === "Active"
                          ? "bg-success/10 text-success hover:bg-success/10"
                          : ""
                      }
                    >
                      {agent.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {agent.lastActivity}
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
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border border-border bg-secondary/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {item.result === "Approved" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.agent}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        item.result === "Approved" ? "default" : "destructive"
                      }
                      className={
                        item.result === "Approved"
                          ? "bg-success/10 text-success hover:bg-success/10"
                          : ""
                      }
                    >
                      {item.result}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
