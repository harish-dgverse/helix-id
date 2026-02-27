"use client"

import { useEffect, useState } from "react"
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

import { loadAgents, type OnboardedAgent } from "@/lib/agents"

const fallbackAgents = [
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
] as const

const templates = [
  {
    id: "ecommerce",
    label: "E-commerce Template",
    icon: FileText,
    scopes: ["search", "add_to_cart", "place_order", "view_inventory"],
  },
  {
    id: "book-order",
    label: "Order Management",
    icon: FileText,
    scopes: ["Create order", "Update order", "Cancel order"],
  },
  {
    id: "book-flight",
    label: "Book Flight Ticket",
    icon: FileText,
    scopes: ["Search flights", "Book ticket", "Modify itinerary"],
  },
  {
    id: "access-system",
    label: "Access Internal System",
    icon: FileText,
    scopes: ["Read data", "Write data", "Admin operations"],
  },
  {
    id: "execute-payment",
    label: "Execute Payment (with limit)",
    icon: DollarSign,
    scopes: ["Initiate payment", "Refund payment"],
  },
  {
    id: "data-retrieval",
    label: "Data Retrieval Access",
    icon: FileText,
    scopes: ["Query data", "Export data"],
  },
  {
    id: "custom",
    label: "Custom Template",
    icon: FileText,
    scopes: [],
  },
]

type IssuedCredential = {
  id: string
  name: string
  agent: string
  template: string
  scope: string
  actions: string[]
  issuer: string
  status: "Active" | "Revoked" | "Expired"
  hederaRef: string
  issuedAt: string
}

const existingCredentials: IssuedCredential[] = [
  {
    id: "vc-001",
    name: "OrderBot Purchase Credential",
    agent: "OrderBot-v3",
    template: "Book Order",
    scope: "Max $5,000 per order",
    actions: ["Create order", "Update order"],
    issuer: "Acme Corp",
    status: "Active",
    hederaRef: "0.0.1234567",
    issuedAt: "2026-02-25T10:30:00Z",
  },
  {
    id: "vc-002",
    name: "Flight Booking Credential",
    agent: "FlightAgent-prod",
    template: "Book Flight Ticket",
    scope: "Domestic flights only",
    actions: ["Search flights", "Book ticket"],
    issuer: "Acme Corp",
    status: "Active",
    hederaRef: "0.0.1234568",
    issuedAt: "2026-02-24T14:15:00Z",
  },
  {
    id: "vc-003",
    name: "CRM Read Access",
    agent: "DataRetriever-v2",
    template: "Access Internal System",
    scope: "Read-only, CRM database",
    actions: ["Read data"],
    issuer: "Acme Corp",
    status: "Revoked",
    hederaRef: "0.0.1234569",
    issuedAt: "2026-02-20T08:00:00Z",
  },
  {
    id: "vc-004",
    name: "Payments Processor Credential",
    agent: "PaymentProcessor",
    template: "Execute Payment",
    scope: "Max $10,000 per transaction",
    actions: ["Initiate payment"],
    issuer: "Acme Corp",
    status: "Expired",
    hederaRef: "0.0.1234570",
    issuedAt: "2026-01-15T09:45:00Z",
  },
]

export default function CredentialsPage() {
  const [agents, setAgents] =
    useState<{ id: string; name: string; did: string }[]>(fallbackAgents)
  const [selectedAgent, setSelectedAgent] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [credentialName, setCredentialName] = useState("")
  const [isIssuing, setIsIssuing] = useState(false)
  const [issuedCredential, setIssuedCredential] =
    useState<IssuedCredential | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [revocable, setRevocable] = useState(true)
  const [activeTab, setActiveTab] = useState<"issue" | "issued">("issue")
  const [allIssued, setAllIssued] =
    useState<IssuedCredential[]>(existingCredentials)
  const [selectedIssuedId, setSelectedIssuedId] = useState<string | null>(
    existingCredentials[0]?.id ?? null
  )

  useEffect(() => {
    const stored: OnboardedAgent[] = loadAgents()
    if (stored.length) {
      setAgents(
        stored.map((a) => ({
          id: a.id,
          name: a.name,
          did: a.did,
        }))
      )
    }
  }, [])

  const handleIssue = async () => {
    if (!selectedAgent || !selectedTemplate) return
    setIsIssuing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const agentName =
      agents.find((a) => a.id === selectedAgent)?.name || "Unknown"
    const template = templates.find((t) => t.id === selectedTemplate)
    const templateLabel = template?.label || "Custom"

    const newCredential: IssuedCredential = {
      id: `vc-${Date.now().toString(36)}`,
      name: credentialName.trim() || `${templateLabel} Credential`,
      agent: agentName,
      template: templateLabel,
      scope:
        selectedScopes.length && template?.id !== "custom"
          ? selectedScopes.join(", ")
          : "As configured",
      actions:
        selectedScopes.length && template?.id !== "custom"
          ? [...selectedScopes]
          : [],
      issuer: "Acme Corp",
      status: "Active",
      hederaRef: `0.0.${Math.floor(Math.random() * 9999999)}`,
      issuedAt: new Date().toISOString(),
    }

    setIssuedCredential(newCredential)
    setAllIssued((prev) => [newCredential, ...prev])
    setSelectedIssuedId(newCredential.id)
    setCredentialName("")
    setActiveTab("issued")
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

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "issue" | "issued")}
        className="w-full"
      >
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
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-foreground">
                      Template
                    </Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) => {
                        setSelectedTemplate(value)
                        const tmpl = templates.find((t) => t.id === value)
                        setSelectedScopes(tmpl?.scopes ?? [])
                      }}
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Choose credential template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <template.icon className="h-3.5 w-3.5 shrink-0" />
                              <span>{template.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-foreground">
                      Credential name
                    </Label>
                    <Input
                      placeholder="e.g. OrderBot checkout credential"
                      className="bg-secondary"
                      value={credentialName}
                      onChange={(e) => setCredentialName(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Predefined scope selection */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      3
                    </div>
                    <CardTitle className="text-sm font-medium text-foreground">
                      Select Predefined Scope
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {selectedTemplate && selectedTemplate !== "custom" && (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2">
                        <Label className="text-sm text-foreground">
                          Choose predefined scope for this template
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {templates
                            .find((t) => t.id === selectedTemplate)
                            ?.scopes.map((scope) => {
                              const active = selectedScopes.includes(scope)
                              return (
                                <button
                                  key={scope}
                                  type="button"
                                  onClick={() =>
                                    setSelectedScopes((prev) =>
                                      prev.includes(scope)
                                        ? prev.filter((s) => s !== scope)
                                        : [...prev, scope]
                                    )
                                  }
                                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-mono transition-colors ${
                                    active
                                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                      : "border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                  }`}
                                >
                                  {active && (
                                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                                  )}
                                  <span>{scope}</span>
                                </button>
                              )
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          These scope values are what will be encoded directly
                          into the credential (for example:{" "}
                          <code className="font-mono">search</code>,{" "}
                          <code className="font-mono">place_order</code>,{" "}
                          <code className="font-mono">view_inventory</code>).
                        </p>
                      </div>

                      {selectedScopes.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs text-muted-foreground">
                            Selected scopes ({selectedScopes.length}) — will be
                            encoded into the credential
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedScopes.map((scope) => (
                              <span
                                key={scope}
                                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono text-primary"
                              >
                                {scope}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                      label="Credential Name"
                      value={issuedCredential.name}
                      fieldKey="cred-name"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
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
                    {issuedCredential.actions.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Actions encoded in this credential
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {issuedCredential.actions.map((action) => (
                            <span
                              key={action}
                              className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-foreground"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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

        <TabsContent value="issued" className="mt-6 flex flex-col gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Name
                      </th>
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
                        Issued
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allIssued.map((cred) => {
                      const isSelected = cred.id === selectedIssuedId
                      return (
                        <tr
                          key={cred.id}
                          onClick={() => setSelectedIssuedId(cred.id)}
                          className={`cursor-pointer border-b border-border last:border-0 transition-colors ${
                            isSelected ? "bg-primary/5" : "hover:bg-secondary"
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-foreground">
                            {cred.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {cred.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {cred.agent}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {cred.template}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
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
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(cred.issuedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {allIssued.length > 0 && selectedIssuedId && (
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Credential details
                  </CardTitle>
                  <Badge className="bg-success/10 text-success hover:bg-success/10">
                    {allIssued.find((c) => c.id === selectedIssuedId)?.status ??
                      "Active"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {(() => {
                  const cred =
                    allIssued.find((c) => c.id === selectedIssuedId) ??
                    allIssued[0]
                  return (
                    <>
                      <CopyField
                        label="Credential Name"
                        value={cred.name}
                        fieldKey="issued-name"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                      />
                      <CopyField
                        label="Credential ID"
                        value={cred.id}
                        fieldKey="issued-id"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                        mono
                      />
                      <CopyField
                        label="Agent"
                        value={cred.agent}
                        fieldKey="issued-agent"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                      />
                      <CopyField
                        label="Template"
                        value={cred.template}
                        fieldKey="issued-template"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                      />
                      <CopyField
                        label="Scope"
                        value={cred.scope}
                        fieldKey="issued-scope"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                      />
                      {cred.actions.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Actions encoded in this credential
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {cred.actions.map((action) => (
                              <span
                                key={action}
                                className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-foreground"
                              >
                                {action}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <CopyField
                        label="Issuer"
                        value={cred.issuer}
                        fieldKey="issued-issuer"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                      />
                      <CopyField
                        label="Hedera Anchor"
                        value={cred.hederaRef}
                        fieldKey="issued-hedera"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                        mono
                      />
                      <CopyField
                        label="Issued At"
                        value={new Date(cred.issuedAt).toLocaleString()}
                        fieldKey="issued-time"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                      />
                    </>
                  )
                })()}
              </CardContent>
            </Card>
          )}
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
