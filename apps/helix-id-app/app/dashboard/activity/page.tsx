"use client"

import { useState } from "react"
import {
  Bot,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Fingerprint,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AgentData = {
  name: string
  did: string
  identityStatus: "Verified" | "Pending"
  permissionStatus: "Granted" | "Restricted" | "Revoked"
  totalActions: number
  approvedActions: number
  rejectedActions: number
  activeCredentials: number
  revokedCredentials: number
  riskAlerts: number
  lastActivity: string
}

const agentsData: AgentData[] = [
  {
    name: "OrderBot-v3",
    did: "did:hedera:mainnet:z6Mk...a4Xq",
    identityStatus: "Verified",
    permissionStatus: "Granted",
    totalActions: 847,
    approvedActions: 832,
    rejectedActions: 15,
    activeCredentials: 5,
    revokedCredentials: 1,
    riskAlerts: 0,
    lastActivity: "2 min ago",
  },
  {
    name: "FlightAgent-prod",
    did: "did:hedera:mainnet:z6Mk...b8Rw",
    identityStatus: "Verified",
    permissionStatus: "Granted",
    totalActions: 423,
    approvedActions: 418,
    rejectedActions: 5,
    activeCredentials: 3,
    revokedCredentials: 0,
    riskAlerts: 0,
    lastActivity: "15 min ago",
  },
  {
    name: "DataRetriever-v2",
    did: "did:hedera:mainnet:z6Mk...c2Yz",
    identityStatus: "Verified",
    permissionStatus: "Restricted",
    totalActions: 1256,
    approvedActions: 1180,
    rejectedActions: 76,
    activeCredentials: 7,
    revokedCredentials: 2,
    riskAlerts: 2,
    lastActivity: "1 hour ago",
  },
  {
    name: "PaymentProcessor",
    did: "did:hedera:mainnet:z6Mk...d9Lm",
    identityStatus: "Verified",
    permissionStatus: "Revoked",
    totalActions: 312,
    approvedActions: 290,
    rejectedActions: 22,
    activeCredentials: 0,
    revokedCredentials: 2,
    riskAlerts: 1,
    lastActivity: "3 hours ago",
  },
  {
    name: "SupportAgent-v1",
    did: "did:hedera:mainnet:z6Mk...e5Np",
    identityStatus: "Pending",
    permissionStatus: "Granted",
    totalActions: 189,
    approvedActions: 185,
    rejectedActions: 4,
    activeCredentials: 4,
    revokedCredentials: 0,
    riskAlerts: 0,
    lastActivity: "30 min ago",
  },
]

const actionLog = [
  {
    agent: "OrderBot-v3",
    action: "Book Order #12847",
    credential: "vc-001",
    result: "Approved" as const,
    timestamp: "2026-02-27T10:30:00Z",
  },
  {
    agent: "FlightAgent-prod",
    action: "Book Flight LAX-JFK",
    credential: "vc-002",
    result: "Approved" as const,
    timestamp: "2026-02-27T10:15:00Z",
  },
  {
    agent: "DataRetriever-v2",
    action: "Access HR Database",
    credential: "vc-003",
    result: "Rejected" as const,
    timestamp: "2026-02-27T09:45:00Z",
  },
  {
    agent: "OrderBot-v3",
    action: "Book Order #12846",
    credential: "vc-001",
    result: "Approved" as const,
    timestamp: "2026-02-27T09:30:00Z",
  },
  {
    agent: "PaymentProcessor",
    action: "Execute Payment $15,000",
    credential: "vc-004",
    result: "Rejected" as const,
    timestamp: "2026-02-27T09:00:00Z",
  },
  {
    agent: "SupportAgent-v1",
    action: "Retrieve Customer Data",
    credential: "vc-005",
    result: "Approved" as const,
    timestamp: "2026-02-27T08:45:00Z",
  },
  {
    agent: "DataRetriever-v2",
    action: "Query Sales Database",
    credential: "vc-003",
    result: "Approved" as const,
    timestamp: "2026-02-27T08:30:00Z",
  },
  {
    agent: "FlightAgent-prod",
    action: "Book Flight SFO-ORD",
    credential: "vc-002",
    result: "Approved" as const,
    timestamp: "2026-02-27T08:00:00Z",
  },
]

export default function ActivityPage() {
  const [agentFilter, setAgentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const totalActions = agentsData.reduce((sum, a) => sum + a.totalActions, 0)
  const totalApproved = agentsData.reduce(
    (sum, a) => sum + a.approvedActions,
    0
  )
  const totalRejected = agentsData.reduce(
    (sum, a) => sum + a.rejectedActions,
    0
  )
  const totalAlerts = agentsData.reduce((sum, a) => sum + a.riskAlerts, 0)

  const filteredLog = actionLog.filter((item) => {
    if (agentFilter !== "all" && item.agent !== agentFilter) return false
    if (statusFilter !== "all" && item.result !== statusFilter) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Agent Activity
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time monitoring of agent behavior and credential usage.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Actions",
            value: totalActions.toLocaleString(),
            icon: Activity,
          },
          {
            label: "Approved",
            value: totalApproved.toLocaleString(),
            icon: CheckCircle2,
            color: "text-success",
          },
          {
            label: "Rejected",
            value: totalRejected.toLocaleString(),
            icon: XCircle,
            color: "text-destructive",
          },
          {
            label: "Risk Alerts",
            value: totalAlerts.toString(),
            icon: AlertTriangle,
            color: "text-warning",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  <stat.icon
                    className={`h-4.5 w-4.5 ${stat.color || "text-primary"}`}
                  />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Cards */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Agent Status Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agentsData.map((agent) => (
            <Card key={agent.name} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Bot className="h-5 w-5 text-primary" />
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
                  {agent.riskAlerts > 0 && (
                    <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
                      {agent.riskAlerts} alert{agent.riskAlerts > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center rounded-md bg-secondary p-2">
                    <div className="flex items-center gap-1">
                      <Fingerprint className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Identity
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`mt-1 text-xs ${
                        agent.identityStatus === "Verified"
                          ? "border-success/30 text-success"
                          : "border-warning/30 text-warning"
                      }`}
                    >
                      {agent.identityStatus}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-center rounded-md bg-secondary p-2">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Perms
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`mt-1 text-xs ${
                        agent.permissionStatus === "Granted"
                          ? "border-success/30 text-success"
                          : agent.permissionStatus === "Restricted"
                            ? "border-warning/30 text-warning"
                            : "border-destructive/30 text-destructive"
                      }`}
                    >
                      {agent.permissionStatus}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-center rounded-md bg-secondary p-2">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Last
                      </span>
                    </div>
                    <span className="mt-1 text-xs font-medium text-foreground">
                      {agent.lastActivity}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>
                    {agent.totalActions.toLocaleString()} total actions
                  </span>
                  <span>
                    {agent.activeCredentials} active /{" "}
                    {agent.revokedCredentials} revoked
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters + Action Log */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-medium text-foreground">
              Action Log
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="h-8 w-40 bg-secondary text-sm">
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agentsData.map((a) => (
                    <SelectItem key={a.name} value={a.name}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 bg-secondary text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search..."
                className="h-8 w-40 bg-secondary text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Credential
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Result
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLog.map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm text-foreground">
                          {item.agent}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {item.action}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                      {item.credential}
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
