"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ShieldCheck,
  Bot,
  FileText,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  fetchAgents,
  fetchVcs,
  postVc,
  type Agent,
  type AgentVC,
} from "@/lib/api"

const BOOK_ORDERING_SCOPES = [
  "search_books",
  "place_order",
  "view_inventory",
  "check_order_status",
] as const

const templates = [
  {
    id: "book-ordering",
    label: "Book Ordering Credential",
    icon: FileText,
    scopes: [...BOOK_ORDERING_SCOPES],
    vcType: "BookOrderingCredential",
  },
  {
    id: "ecommerce",
    label: "E-commerce Template",
    icon: FileText,
    scopes: ["search", "add_to_cart", "place_order", "view_inventory"],
    vcType: "EcommerceCredential",
  },
  {
    id: "data-retrieval",
    label: "Data Retrieval Access",
    icon: FileText,
    scopes: ["query_data", "export_data"],
    vcType: "DataRetrievalCredential",
  },
  {
    id: "custom",
    label: "Custom Template",
    icon: FileText,
    scopes: [],
    vcType: "CustomCredential",
  },
]

function getVcDisplayStatus(vc: AgentVC): "Active" | "Expired" {
  const isExpired = new Date(vc.expires_at).getTime() < Date.now()
  return isExpired ? "Expired" : "Active"
}

export default function CredentialsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [vcs, setVcs] = useState<AgentVC[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [credentialName, setCredentialName] = useState("")
  const [validityDays, setValidityDays] = useState<number>(90)
  const [isIssuing, setIsIssuing] = useState(false)
  const [issuedVc, setIssuedVc] = useState<AgentVC | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"issue" | "issued">("issue")
  const [selectedIssuedId, setSelectedIssuedId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [agentsData, vcsData] = await Promise.all([
        fetchAgents(),
        fetchVcs(),
      ])
      setAgents(agentsData)
      setVcs(vcsData)
    } catch (err) {
      console.error("Failed to load credentials data", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleIssue = async () => {
    if (!selectedAgent || !selectedTemplate) return
    const agent = agents.find((a) => a.id === selectedAgent)
    if (!agent) return
    const template = templates.find((t) => t.id === selectedTemplate)
    if (!template) return

    setIsIssuing(true)
    setIssuedVc(null)
    try {
      const scopes =
        selectedScopes.length > 0 ? selectedScopes : template.scopes
      const name =
        credentialName.trim() || `${template.label} permissions`

      const vc = await postVc({
        agentId: agent.id,
        type: template.vcType,
        name,
        scopes,
        validityDays,
      })
      setIssuedVc(vc)
      setVcs((prev) => [vc, ...prev])
      setSelectedIssuedId(vc.vc_id)

      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "VC_ISSUED",
          description: `Issued credential ${vc.vc_id} to agent "${agent.name}"`,
          agentId: agent.id,
          agentName: agent.name,
          agentDid: agent.did,
          vcId: vc.vc_id,
        }),
      })

      setCredentialName("")
      setActiveTab("issued")
      setSelectedAgent("")
      setSelectedTemplate("")
      setSelectedScopes([])
      setValidityDays(90)
      // setActiveTab("issued") // Stay on the issue tab to see the result on the right

    } catch (err) {
      console.error("Failed to issue credential", err)
    } finally {
      setIsIssuing(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getAgentName = (agentId: string) =>
    agents.find((a) => a.id === agentId)?.name ?? "Unknown"

  if (loading) {
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
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
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
            <div className="flex flex-col gap-6">
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
                  {agents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No agents yet. Onboard an agent first.
                    </p>
                  ) : (
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
                  )}
                </CardContent>
              </Card>

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
                    <Label className="text-sm text-foreground">Template</Label>
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
                  {selectedTemplate && (
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
                          Scopes encoded in the credential:{" "}
                          <code className="font-mono">search_books</code>,{" "}
                          <code className="font-mono">place_order</code>,{" "}
                          <code className="font-mono">view_inventory</code>,{" "}
                          <code className="font-mono">check_order_status</code>.
                        </p>
                      </div>
                      {selectedScopes.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs text-muted-foreground">
                            Selected scopes ({selectedScopes.length})
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
                        Expires in (days)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        className="bg-secondary"
                        value={String(validityDays)}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10)
                          setValidityDays(
                            Number.isFinite(parsed) && parsed > 0 ? parsed : 90
                          )
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleIssue}
                disabled={
                  !selectedAgent ||
                  !selectedTemplate ||
                  isIssuing ||
                  agents.length === 0
                }
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

            <div>
              {issuedVc ? (
                <Card className="border-primary/20 bg-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-foreground">
                        Credential Issued
                      </CardTitle>
                      <Badge className="bg-success/10 text-success hover:bg-success/10">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <CopyField
                      label="Credential Name"
                      value={issuedVc.name}
                      fieldKey="cred-name"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                    <CopyField
                      label="Credential ID"
                      value={issuedVc.vc_id}
                      fieldKey="cred-id"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                      mono
                    />
                    <CopyField
                      label="Agent"
                      value={getAgentName(issuedVc.agent_id)}
                      fieldKey="cred-agent"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                    <CopyField
                      label="Template"
                      value={issuedVc.type}
                      fieldKey="cred-template"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                    <CopyField
                      label="Scope Summary"
                      value={issuedVc.scopes.join(", ")}
                      fieldKey="cred-scope"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                    <div className="flex flex-wrap gap-2">
                      {issuedVc.scopes.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <CopyField
                      label="Issuer"
                      value={issuedVc.issuer}
                      fieldKey="cred-issuer"
                      copiedField={copiedField}
                      onCopy={copyToClipboard}
                    />
                    <CopyField
                      label="Issued At"
                      value={new Date(
                        issuedVc.issued_at
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
                    {vcs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No credentials issued yet.
                        </td>
                      </tr>
                    ) : (
                      vcs.map((vc) => {
                        const status = getVcDisplayStatus(vc)
                        const isSelected = vc.vc_id === selectedIssuedId
                        return (
                          <tr
                            key={vc.vc_id}
                            onClick={() => setSelectedIssuedId(vc.vc_id)}
                            className={`cursor-pointer border-b border-border last:border-0 transition-colors ${
                              isSelected ? "bg-primary/5" : "hover:bg-secondary"
                            }`}
                          >
                            <td className="px-4 py-3 text-sm text-foreground">
                              {vc.name}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                              {vc.vc_id}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {getAgentName(vc.agent_id)}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {vc.type}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {vc.scopes.join(", ")}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={
                                  status === "Active"
                                    ? "bg-success/10 text-success hover:bg-success/10"
                                    : "bg-warning/10 text-warning hover:bg-warning/10"
                                }
                              >
                                {status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(vc.issued_at).toLocaleDateString()}
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

          {vcs.length > 0 && selectedIssuedId && (
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Credential details
                  </CardTitle>
                  <Badge
                    className={
                      getVcDisplayStatus(
                        vcs.find((v) => v.vc_id === selectedIssuedId)!
                      ) === "Active"
                        ? "bg-success/10 text-success hover:bg-success/10"
                        : "bg-warning/10 text-warning hover:bg-warning/10"
                    }
                  >
                    {getVcDisplayStatus(
                      vcs.find((v) => v.vc_id === selectedIssuedId)!
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {(() => {
                  const vc =
                    vcs.find((v) => v.vc_id === selectedIssuedId) ?? vcs[0]
                  return (
                    <>
                      <CopyField
                        label="Credential Name"
                        value={vc.name}
                        fieldKey="issued-name"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                      />
                      <CopyField
                        label="Credential ID"
                        value={vc.vc_id}
                        fieldKey="issued-id"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                        mono
                      />
                      <CopyField
                        label="Agent"
                        value={getAgentName(vc.agent_id)}
                        fieldKey="issued-agent"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                      />
                      <CopyField
                        label="Template"
                        value={vc.type}
                        fieldKey="issued-template"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                      />
                      <CopyField
                        label="Scope"
                        value={vc.scopes.join(", ")}
                        fieldKey="issued-scope"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                      />
                      <div className="flex flex-wrap gap-2">
                        {vc.scopes.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-foreground"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <CopyField
                        label="Issuer"
                        value={vc.issuer}
                        fieldKey="issued-issuer"
                        copiedField={copiedField}
                        onCopy={copyToClipboard}
                      />
                      <CopyField
                        label="Issued At"
                        value={new Date(vc.issued_at).toLocaleString()}
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
