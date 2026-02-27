"use client"

import { useMemo, useState } from "react"
import {
  Bot,
  Fingerprint,
  Wallet,
  Key,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type OnboardingResult = {
  did: string
  walletStatus: string
  walletId: string
  timestamp: string
}

import type { OnboardedAgent } from "@/lib/agents"

const pipelineSteps = [
  { icon: Bot, label: "Agent Registered" },
  { icon: Fingerprint, label: "DID Created" },
  { icon: Wallet, label: "Wallet Generated" },
  { icon: Key, label: "Keys Stored" },
  { icon: CheckCircle2, label: "Ready" },
]

export default function OnboardingPage() {
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [result, setResult] = useState<OnboardingResult | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [agents, setAgents] = useState<OnboardedAgent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const [agentName, setAgentName] = useState("")
  const [organization, setOrganization] = useState("")

  const [showResultDialog, setShowResultDialog] = useState(false)

  const handleOnboard = async () => {
    setIsOnboarding(true)
    setResult(null)

    try {
      const payload = {
        name: agentName || "New Agent",
        organization: organization || "Unassigned",
      }

      const onboardingPromise = fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to onboard agent")
        }
        return res.json() as Promise<{
          agent: {
            id: string
            did: string
            walletId: string
            createdAt: string
          }
        }>
      })

      for (let i = 0; i < pipelineSteps.length; i++) {
        setCurrentStep(i)
        await new Promise((resolve) => setTimeout(resolve, 800))
      }

      const data = await onboardingPromise
      const { agent } = data

      const newResult: OnboardingResult = {
        did: agent.did,
        walletStatus: "Active",
        walletId: agent.walletId,
        timestamp: agent.createdAt,
      }

      setResult(newResult)

      const safeName = agentName.trim() || "New Agent"
      const safeOrg = organization.trim() || "Unassigned"

      const newAgent: OnboardedAgent = {
        id: agent.id,
        name: safeName,
        organization: safeOrg,
        did: agent.did,
        walletId: agent.walletId,
        createdAt: agent.createdAt,
        credentials: [
          {
            id: "cred-1",
            type: "Agent Identity Credential",
            status: "Active",
          },
          {
            id: "cred-2",
            type: "Access Policy Credential",
            status: "Active",
          },
        ],
      }

      setAgents((prev) => [...prev, newAgent])
      setSelectedAgentId(agent.id)
      setShowResultDialog(true)
    } catch (error) {
      console.error("Onboarding failed", error)
    } finally {
      setIsOnboarding(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const selectedAgent = useMemo(
    () =>
      agents.find((a) => a.id === selectedAgentId) ||
      agents[agents.length - 1] ||
      null,
    [agents, selectedAgentId]
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Agent Onboarding
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register a new AI agent and automatically generate its decentralized
          identity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Onboarding Form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">
              Agent Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="agent-name" className="text-sm text-foreground">
                Agent Name
              </Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. OrderBot-v3"
                className="bg-secondary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="agent-desc" className="text-sm text-foreground">
                Agent Description / Purpose
              </Label>
              <Textarea
                id="agent-desc"
                placeholder="Describe the agent's primary function..."
                className="min-h-20 bg-secondary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="agent-endpoint"
                className="text-sm text-foreground"
              >
                Agent Endpoint URL
              </Label>
              <Input
                id="agent-endpoint"
                placeholder="https://api.example.com/agent/v1"
                className="bg-secondary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="api-key" className="text-sm text-foreground">
                API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter API key for secure integration"
                className="bg-secondary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm text-foreground">Organization</Label>
              <Input
                id="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="bg-secondary"
              />
            </div>

            <Button
              onClick={handleOnboard}
              disabled={isOnboarding}
              className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isOnboarding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Onboarding...
                </>
              ) : (
                "Onboard Agent"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Middle Column: Pipeline + Results */}
        <div className="flex flex-col gap-6">
          {/* Pipeline Visualization */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                Onboarding Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                {pipelineSteps.map((step, i) => {
                  const isCompleted = i <= currentStep
                  const isCurrent = i === currentStep && isOnboarding
                  return (
                    <div key={step.label} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 ${
                            isCompleted
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          } ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
                        >
                          {isCurrent ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <step.icon className="h-4 w-4" />
                          )}
                        </div>
                        {i < pipelineSteps.length - 1 && (
                          <div
                            className={`h-6 w-px transition-colors duration-300 ${
                              i < currentStep
                                ? "bg-primary"
                                : "bg-border"
                            }`}
                          />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium transition-colors duration-300 ${
                          isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

        </div>
        {/* Right Column: Agents sidebar (only after onboarding in this session) */}
        {agents.length > 0 && (
        <div id="agents" className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                Agents
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {agents.map((agent) => {
                    const isSelected = selectedAgent?.id === agent.id
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`flex flex-col items-start rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                        }`}
                      >
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-xs">
                          Org:{" "}
                          <span className="font-medium">
                            {agent.organization}
                          </span>
                        </span>
                        <span className="mt-1 text-xs text-muted-foreground">
                          Wallet:{" "}
                          <span className="font-mono">{agent.walletId}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
            </CardContent>
          </Card>

          {selectedAgent && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">
                  Wallet Details
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Attached Agent
                  </span>
                  <span className="text-sm text-foreground">
                    {selectedAgent.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({selectedAgent.organization})
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Wallet ID
                  </span>
                  <span className="font-mono text-sm text-foreground">
                    {selectedAgent.walletId}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Agent DID
                  </span>
                  <span className="font-mono text-sm text-foreground">
                    {selectedAgent.did}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Credentials in Wallet
                  </span>
                  <div className="flex flex-col gap-1">
                    {selectedAgent.credentials.map((cred) => (
                      <div
                        key={cred.id}
                        className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {cred.type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {cred.id}
                          </span>
                        </div>
                        <Badge
                          className={
                            cred.status === "Active"
                              ? "bg-success/10 text-success hover:bg-success/10"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/10"
                          }
                        >
                          {cred.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        )}
      </div>

      <Dialog
        open={!!result && showResultDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowResultDialog(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent Identity Created</DialogTitle>
          </DialogHeader>
          {result && (
            <div className="mt-4 flex flex-col gap-4">
              <ResultField
                label="Decentralized Identifier (DID)"
                value={result.did}
                fieldKey="did"
                copiedField={copiedField}
                onCopy={copyToClipboard}
                mono
              />
              <ResultField
                label="Wallet Status"
                value={result.walletStatus}
                fieldKey="walletStatus"
                copiedField={copiedField}
                onCopy={copyToClipboard}
              />
              <ResultField
                label="Wallet ID"
                value={result.walletId}
                fieldKey="walletId"
                copiedField={copiedField}
                onCopy={copyToClipboard}
                mono
              />
              <ResultField
                label="Created At"
                value={new Date(result.timestamp).toLocaleString()}
                fieldKey="timestamp"
                copiedField={copiedField}
                onCopy={copyToClipboard}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ResultField({
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
          className={`text-sm text-foreground ${
            mono
              ? "font-mono break-all"
              : "truncate"
          }`}
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
