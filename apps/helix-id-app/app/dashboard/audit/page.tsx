"use client"

import { useState } from "react"
import {
  FileText,
  Search,
  Download,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  Fingerprint,
  Activity,
  Wallet,
  Bot,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AuditEntry = {
  id: string
  agentDid: string
  agentName: string
  credentialUsed: string
  actionPerformed: string
  timestamp: string
  decision: "Approved" | "Rejected"
  verifierSystem: string
  hederaRef: string
  type: "action" | "presentation" | "verification" | "revocation" | "violation"
}

const auditLogs: AuditEntry[] = [
  {
    id: "log-001",
    agentDid: "did:hedera:mainnet:z6Mk...a4Xq",
    agentName: "OrderBot-v3",
    credentialUsed: "vc-001",
    actionPerformed: "Book Order #12847",
    timestamp: "2026-02-27T10:30:00Z",
    decision: "Approved",
    verifierSystem: "Order Management API",
    hederaRef: "0.0.1234567",
    type: "action",
  },
  {
    id: "log-002",
    agentDid: "did:hedera:mainnet:z6Mk...b8Rw",
    agentName: "FlightAgent-prod",
    credentialUsed: "vc-002",
    actionPerformed: "Present VC to Flight Booking System",
    timestamp: "2026-02-27T10:15:00Z",
    decision: "Approved",
    verifierSystem: "Flight Booking Gateway",
    hederaRef: "0.0.1234568",
    type: "presentation",
  },
  {
    id: "log-003",
    agentDid: "did:hedera:mainnet:z6Mk...c2Yz",
    agentName: "DataRetriever-v2",
    credentialUsed: "vc-003",
    actionPerformed: "Access HR Database - Unauthorized Scope",
    timestamp: "2026-02-27T09:45:00Z",
    decision: "Rejected",
    verifierSystem: "Internal Data Gateway",
    hederaRef: "0.0.1234569",
    type: "violation",
  },
  {
    id: "log-004",
    agentDid: "did:hedera:mainnet:z6Mk...c2Yz",
    agentName: "DataRetriever-v2",
    credentialUsed: "vc-003",
    actionPerformed: "Credential Revoked by Admin",
    timestamp: "2026-02-27T09:30:00Z",
    decision: "Approved",
    verifierSystem: "HelixID Admin",
    hederaRef: "0.0.1234570",
    type: "revocation",
  },
  {
    id: "log-005",
    agentDid: "did:hedera:mainnet:z6Mk...a4Xq",
    agentName: "OrderBot-v3",
    credentialUsed: "vc-001",
    actionPerformed: "Verify Credential Validity",
    timestamp: "2026-02-27T09:00:00Z",
    decision: "Approved",
    verifierSystem: "Order Management API",
    hederaRef: "0.0.1234571",
    type: "verification",
  },
  {
    id: "log-006",
    agentDid: "did:hedera:mainnet:z6Mk...d9Lm",
    agentName: "PaymentProcessor",
    credentialUsed: "vc-004",
    actionPerformed: "Execute Payment $15,000 - Over Limit",
    timestamp: "2026-02-27T08:45:00Z",
    decision: "Rejected",
    verifierSystem: "Payment Gateway",
    hederaRef: "0.0.1234572",
    type: "violation",
  },
  {
    id: "log-007",
    agentDid: "did:hedera:mainnet:z6Mk...e5Np",
    agentName: "SupportAgent-v1",
    credentialUsed: "vc-005",
    actionPerformed: "Retrieve Customer Record #4521",
    timestamp: "2026-02-27T08:30:00Z",
    decision: "Approved",
    verifierSystem: "CRM System",
    hederaRef: "0.0.1234573",
    type: "action",
  },
  {
    id: "log-008",
    agentDid: "did:hedera:mainnet:z6Mk...b8Rw",
    agentName: "FlightAgent-prod",
    credentialUsed: "vc-002",
    actionPerformed: "Book Flight SFO-ORD",
    timestamp: "2026-02-27T08:00:00Z",
    decision: "Approved",
    verifierSystem: "Flight Booking Gateway",
    hederaRef: "0.0.1234574",
    type: "action",
  },
  {
    id: "log-009",
    agentDid: "did:hedera:mainnet:z6Mk...a4Xq",
    agentName: "OrderBot-v3",
    credentialUsed: "vc-001",
    actionPerformed: "Present VC to Supplier Portal",
    timestamp: "2026-02-27T07:45:00Z",
    decision: "Approved",
    verifierSystem: "Supplier API Gateway",
    hederaRef: "0.0.1234575",
    type: "presentation",
  },
  {
    id: "log-010",
    agentDid: "did:hedera:mainnet:z6Mk...d9Lm",
    agentName: "PaymentProcessor",
    credentialUsed: "vc-004",
    actionPerformed: "Credential Expired - Auto Revoke",
    timestamp: "2026-02-26T23:59:00Z",
    decision: "Approved",
    verifierSystem: "HelixID Scheduler",
    hederaRef: "0.0.1234576",
    type: "revocation",
  },
]

const typeConfig: Record<
  string,
  { label: string; color: string; icon: typeof Activity }
> = {
  action: { label: "Action", color: "text-primary", icon: Activity },
  presentation: {
    label: "Presentation",
    color: "text-chart-2",
    icon: ShieldCheck,
  },
  verification: {
    label: "Verification",
    color: "text-chart-4",
    icon: CheckCircle2,
  },
  revocation: { label: "Revocation", color: "text-warning", icon: XCircle },
  violation: {
    label: "Violation",
    color: "text-destructive",
    icon: AlertTriangle,
  },
}

export default function AuditPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [decisionFilter, setDecisionFilter] = useState("all")
  const [complianceMode, setComplianceMode] = useState(false)

  const filteredLogs = auditLogs.filter((log) => {
    if (typeFilter !== "all" && log.type !== typeFilter) return false
    if (decisionFilter !== "all" && log.decision !== decisionFilter)
      return false
    if (
      searchQuery &&
      !log.agentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.actionPerformed.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.agentDid.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false
    return true
  })

  const totalLogs = auditLogs.length
  const violations = auditLogs.filter((l) => l.type === "violation").length
  const revocations = auditLogs.filter((l) => l.type === "revocation").length
  const presentations = auditLogs.filter(
    (l) => l.type === "presentation"
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Log Entries",
            value: totalLogs,
            icon: FileText,
          },
          {
            label: "Credential Presentations",
            value: presentations,
            icon: ShieldCheck,
          },
          {
            label: "Revocation Events",
            value: revocations,
            icon: XCircle,
            color: "text-warning",
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

      {/* Trust Architecture */}
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

      {/* Filters */}
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
              <SelectItem value="action">Actions</SelectItem>
              <SelectItem value="presentation">Presentations</SelectItem>
              <SelectItem value="verification">Verifications</SelectItem>
              <SelectItem value="revocation">Revocations</SelectItem>
              <SelectItem value="violation">Violations</SelectItem>
            </SelectContent>
          </Select>
          <Select value={decisionFilter} onValueChange={setDecisionFilter}>
            <SelectTrigger className="h-9 w-36 bg-secondary">
              <SelectValue placeholder="Decision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Decisions</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audit Log Table */}
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
                    Agent DID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Credential
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Action Performed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Decision
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Verifier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Hedera Ref
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const config = typeConfig[log.type]
                  const TypeIcon = config.icon
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-border last:border-0 ${
                        log.type === "violation"
                          ? "bg-destructive/5"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`h-3.5 w-3.5 ${config.color}`} />
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
                            {log.agentName}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {log.agentDid}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                        {log.credentialUsed}
                      </td>
                      <td className="max-w-48 px-4 py-3 text-sm text-foreground">
                        {log.actionPerformed}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            log.decision === "Approved"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            log.decision === "Approved"
                              ? "bg-success/10 text-success hover:bg-success/10"
                              : ""
                          }
                        >
                          {log.decision}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {log.verifierSystem}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 font-mono text-sm text-muted-foreground">
                          {log.hederaRef}
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filteredLogs.length} of {auditLogs.length} entries
        </span>
        <span>
          All records are immutably anchored to Hedera Distributed Ledger
        </span>
      </div>
    </div>
  )
}
