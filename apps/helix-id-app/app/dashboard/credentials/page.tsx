"use client"

import { useState } from "react"
import {
  ShieldCheck,
  Bot,
  FileText,
  Clock,
  DollarSign,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const agents = [
  { id: "1", name: "OrderBot-v3", did: "did:hedera:mainnet:z6Mk...a4Xq" },
  {
    id: "2",
    name: "FlightAgent-prod",
    did: "did:hedera:mainnet:z6Mk...b8Rw",
  },
  {
    id: "3",
    name: "DataRetriever-v2",
    did: "did:hedera:mainnet:z6Mk...c2Yz",
  },
  {
    id: "4",
    name: "PaymentProcessor",
    did: "did:hedera:mainnet:z6Mk...d9Lm",
  },
  {
    id: "5",
    name: "SupportAgent-v1",
    did: "did:hedera:mainnet:z6Mk...e5Np",
  },
]

const templates = [
  { id: "book-order", label: "Book Order", icon: FileText },
  { id: "book-flight", label: "Book Flight Ticket", icon: FileText },
  { id: "access-system", label: "Access Internal System", icon: FileText },
  { id: "execute-payment", label: "Execute Payment (with limit)", icon: DollarSign },
  { id: "data-retrieval", label: "Data Retrieval Access", icon: FileText },
  { id: "custom", label: "Custom Template", icon: FileText },
]

type IssuedCredential = {
  id: string
  agent: string
  template: string
  scope: string
  issuer: string
  status: "Active" | "Revoked" | "Expired"
  hederaRef: string
  issuedAt: string
}

const existingCredentials: IssuedCredential[] = [
  {
    id: "vc-001",
    agent: "OrderBot-v3",
    template: "Book Order",
    scope: "Max $5,000 per order",
    issuer: "Acme Corp",
    status: "Active",
    hederaRef: "0.0.1234567",
    issuedAt: "2026-02-25T10:30:00Z",
  },
  {
    id: "vc-002",
    agent: "FlightAgent-prod",
    template: "Book Flight Ticket",
    scope: "Domestic flights only",
    issuer: "Acme Corp",
    status: "Active",
    hederaRef: "0.0.1234568",
    issuedAt: "2026-02-24T14:15:00Z",
  },
  {
    id: "vc-003",
    agent: "DataRetriever-v2",
    template: "Access Internal System",
    scope: "Read-only, CRM database",
    issuer: "Acme Corp",
    status: "Revoked",
    hederaRef: "0.0.1234569",
    issuedAt: "2026-02-20T08:00:00Z",
  },
  {
    id: "vc-004",
    agent: "PaymentProcessor",
    template: "Execute Payment",
    scope: "Max $10,000 per transaction",
    issuer: "Acme Corp",
    status: "Expired",
    hederaRef: "0.0.1234570",
    issuedAt: "2026-01-15T09:45:00Z",
  },
]

export default function CredentialsPage() {
  const [selectedAgent, setSelectedAgent] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [isIssuing, setIsIssuing] = useState(false)
  const [issuedCredential, setIssuedCredential] =
    useState<IssuedCredential | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [revocable, setRevocable] = useState(true)

  const handleIssue = async () => {
    if (!selectedAgent || !selectedTemplate) return
    setIsIssuing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const agentName =
      agents.find((a) => a.id === selectedAgent)?.name || "Unknown"
    const templateLabel =
      templates.find((t) => t.id === selectedTemplate)?.label || "Custom"

    setIssuedCredential({
      id: `vc-${Date.now().toString(36)}`,
      agent: agentName,
      template: templateLabel,
      scope: "As configured",
      issuer: "Acme Corp",
      status: "Active",
      hederaRef: `0.0.${Math.floor(Math.random() * 9999999)}`,
      issuedAt: new Date().toISOString(),
    })
    setIsIssuing(false)
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Credential Issuance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Issue scoped Verifiable Credentials to onboarded agents.
        </p>
      </div>

      <Tabs defaultValue="issue" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="issue">Issue Credential</TabsTrigger>
          <TabsTrigger value="issued">Issued Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="issue" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left: Form */}
            <div className="flex flex-col gap-6">
              {/* Step 1: Select Agent */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      1
                    </div>
                    <CardTitle className="text-sm font-medium text-foreground">
                      Select Agent
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedAgent}
                    onValueChange={setSelectedAgent}
                  >
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Choose an onboarded agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div className="flex items-center gap-2">
                            <Bot className="h-3.5 w-3.5 text-primary" />
                            <span>{agent.name}</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {agent.did}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Step 2: Template */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      2
                    </div>
                    <CardTitle className="text-sm font-medium text-foreground">
                      Choose Credential Template
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                          selectedTemplate === template.id
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-secondary text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        }`}
                      >
                        <template.icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{template.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Scope */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      3
                    </div>
                    <CardTitle className="text-sm font-medium text-foreground">
                      Define Scope
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm text-foreground">
                        Monetary Limit
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="5,000"
                          className="bg-secondary pl-8"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm text-foreground">
                        Delegated By
                      </Label>
                      <Select defaultValue="org">
                        <SelectTrigger className="bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="org">Organization</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm text-foreground">
                        Valid From
                      </Label>
                      <Input type="date" className="bg-secondary" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm text-foreground">
                        Expires On
                      </Label>
                      <Input type="date" className="bg-secondary" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-foreground">
                      Context Restrictions
                    </Label>
                    <Input
                      placeholder="e.g. Domestic only, Read-only access..."
                      className="bg-secondary"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        Revocable Credential
                      </span>
                    </div>
                    <Switch
                      checked={revocable}
                      onCheckedChange={setRevocable}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleIssue}
                disabled={!selectedAgent || !selectedTemplate || isIssuing}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isIssuing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Issuing Credential...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Issue Verifiable Credential
                  </>
                )}
              </Button>
            </div>

            {/* Right: Result */}
            <div>
              {issuedCredential ? (
                <Card className="border-primary/20 bg-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-foreground">
                        Credential Issued
                      </CardTitle>
                      <Badge className="bg-success/10 text-success hover:bg-success/10">
                        {issuedCredential.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <CopyField
                      label="Credential ID"
                      value={issuedCredential.id}
                      fieldKey="cred-id"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                      mono
                    />
                    <CopyField
                      label="Agent"
                      value={issuedCredential.agent}
                      fieldKey="cred-agent"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                    <CopyField
                      label="Template"
                      value={issuedCredential.template}
                      fieldKey="cred-template"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                    <CopyField
                      label="Scope Summary"
                      value={issuedCredential.scope}
                      fieldKey="cred-scope"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                    <CopyField
                      label="Issuer"
                      value={issuedCredential.issuer}
                      fieldKey="cred-issuer"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                    <CopyField
                      label="Hedera Anchor"
                      value={issuedCredential.hederaRef}
                      fieldKey="cred-hedera"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                      mono
                    />
                    <CopyField
                      label="Issued At"
                      value={new Date(
                        issuedCredential.issuedAt
                      ).toLocaleString()}
                      fieldKey="cred-time"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border bg-card">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                      <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-foreground">
                      No credential issued yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Fill out the form to issue a new Verifiable Credential.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="issued" className="mt-6">
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Credential ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Agent
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Template
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Scope
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Hedera Ref
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Issued
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingCredentials.map((cred) => (
                      <tr
                        key={cred.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-mono text-sm text-foreground">
                          {cred.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {cred.agent}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {cred.template}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {cred.scope}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              cred.status === "Active"
                                ? "default"
                                : "destructive"
                            }
                            className={
                              cred.status === "Active"
                                ? "bg-success/10 text-success hover:bg-success/10"
                                : cred.status === "Expired"
                                  ? "bg-warning/10 text-warning hover:bg-warning/10"
                                  : ""
                            }
                          >
                            {cred.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                          {cred.hederaRef}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(cred.issuedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CopyField({
  label,
  value,
  fieldKey,
  copiedField,
  onCopy,
  mono = false,
}: {
  label: string
  value: string
  fieldKey: string
  copiedField: string | null
  onCopy: (text: string, field: string) => void
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2">
        <span
          className={`truncate text-sm text-foreground ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
        <button
          onClick={() => onCopy(value, fieldKey)}
          className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={`Copy ${label}`}
        >
          {copiedField === fieldKey ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
