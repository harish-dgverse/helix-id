"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { OnboardedAgent } from "@/lib/agents"
import { loadAgents } from "@/lib/agents"

export default function AgentsPage() {
  const [agents, setAgents] = useState<OnboardedAgent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  useEffect(() => {
    const stored = loadAgents()
    if (stored.length === 0) {
      const placeholder: OnboardedAgent = {
        id: "placeholder-agent-x",
        name: "Agent X",
        organization: "Sandbox Org",
        did: "did:example:agent-x",
        walletId: "0.0.000000",
        createdAt: new Date().toISOString(),
        credentials: [
          {
            id: "cred-x-1",
            type: "Demo Access Credential",
            status: "Active",
          },
        ],
      }
      setAgents([placeholder])
      setSelectedAgentId(placeholder.id)
    } else {
      setAgents(stored)
      setSelectedAgentId(stored[stored.length - 1]?.id ?? null)
    }
  }, [])

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
          Agents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View onboarded agents, their wallets, and credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Agents list */}
        <Card className="border-border bg-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">
              Onboarded Agents
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {agents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No agents found. Go to Agent Onboarding to register a new agent.
              </p>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Wallet + credentials details */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {selectedAgent && (
            <>
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
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Created At
                    </span>
                    <span className="text-sm text-foreground">
                      {new Date(selectedAgent.createdAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-foreground">
                    Credentials in Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {selectedAgent.credentials.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No credentials attached to this wallet yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
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
                  )}
                </CardContent>
              </Card>
            </>
          )}
          {!selectedAgent && agents.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Select an agent from the list to view wallet details and
              credentials.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

