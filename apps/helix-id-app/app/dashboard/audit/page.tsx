"use client"

import { useEffect, useState } from "react"
import {
  FileText,
  Search,
  Download,
  Filter,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Fingerprint,
  Activity as ActivityIcon,
  Wallet,
  Bot,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import { fetchActivity, type Activity as ActivityEntry } from "@/lib/api"

const typeConfig: Record<
  string,
  { label: string; color: string; icon: typeof ActivityIcon }
> = {
  AGENT_CREATED: { label: "Agent Onboarded", color: "text-primary", icon: Bot },
  VC_ISSUED: {
    label: "VC Issued",
    color: "text-chart-2",
    icon: ShieldCheck,
  },
  VIOLATION: {
    label: "Violation",
    color: "text-destructive",
    icon: AlertTriangle,
  },
}

function getTypeConfig(type: string) {
  return (
    typeConfig[type] ?? {
      label: type,
      color: "text-muted-foreground",
      icon: ActivityIcon,
    }
  )
}

export default function AuditPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [complianceMode, setComplianceMode] = useState(false)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchActivity()
        setActivity(data)
      } catch (err) {
        console.error("Failed to load audit data", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredLogs = activity.filter((log) => {
    if (typeFilter !== "all" && log.type !== typeFilter) return false
    if (
      searchQuery &&
      !(log.agentName || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(log.agentDid || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(log.vcId || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false
    return true
  })

  const totalLogs = activity.length
  const violations = activity.filter((l) =>
    (l.type || "").toUpperCase().includes("VIOLATION")
  ).length
  const vcIssued = activity.filter((l) => l.type === "VC_ISSUED").length
  const agentCreated = activity.filter((l) => l.type === "AGENT_CREATED").length

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Audit & Governance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Immutable activity logs, compliance tracking, and DLT-anchored
            records.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Audit & Governance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Immutable activity logs, compliance tracking, and DLT-anchored
            records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={complianceMode ? "default" : "outline"}
            size="sm"
            onClick={() => setComplianceMode(!complianceMode)}
            className={
              complianceMode
                ? "bg-primary text-primary-foreground"
                : "border-border text-foreground"
            }
          >
            <Eye className="mr-2 h-3.5 w-3.5" />
            Compliance Mode
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground"
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground"
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Log Entries",
            value: totalLogs,
            icon: FileText,
          },
          {
            label: "Credential Issued",
            value: vcIssued,
            icon: ShieldCheck,
          },
          {
            label: "Agents Created",
            value: agentCreated,
            icon: Bot,
          },
          {
            label: "Policy Violations",
            value: violations,
            icon: AlertTriangle,
            color: "text-destructive",
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

      {complianceMode && (
        <Card className="border-primary/20 bg-card">
          <CardContent className="p-5">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-primary">
              System Trust Architecture
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { icon: Bot, label: "Organization" },
                { icon: Fingerprint, label: "Issues Identity Credential" },
                { icon: ShieldCheck, label: "Issues Delegated Authority" },
                { icon: Wallet, label: "Agent Presents Proof" },
                { icon: CheckCircle2, label: "Verifier Validates" },
                { icon: FileText, label: "Logged on DLT (Hedera)" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
                    <step.icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">
                      {step.label}
                    </span>
                  </div>
                  {i < 5 && (
                    <span className="text-muted-foreground">{">"}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by agent, DID, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-secondary pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-40 bg-secondary">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="AGENT_CREATED">Agent Onboarded</SelectItem>
              <SelectItem value="VC_ISSUED">VC Issued</SelectItem>
              <SelectItem value="VIOLATION">Violations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Credential
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      No audit entries yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const config = getTypeConfig(log.type)
                    const TypeIcon = config.icon
                    const isViolation = (log.type || "")
                      .toUpperCase()
                      .includes("VIOLATION")
                    return (
                      <tr
                        key={log.id}
                        className={`border-b border-border last:border-0 ${isViolation ? "bg-destructive/5" : "hover:bg-secondary"
                          }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TypeIcon
                              className={`h-3.5 w-3.5 ${config.color}`}
                            />
                            <Badge
                              variant="outline"
                              className={`text-xs ${config.color} border-current/20`}
                            >
                              {config.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm text-foreground">
                              {log.agentName ?? "—"}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {log.agentDid ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-56 px-4 py-3 text-sm text-foreground break-words whitespace-normal">
                          {log.description}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {log.vcId ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filteredLogs.length} of {activity.length} entries
        </span>
        <span>
          All records are immutably anchored to Hedera Distributed Ledger
        </span>
      </div>
    </div>
  )
}
