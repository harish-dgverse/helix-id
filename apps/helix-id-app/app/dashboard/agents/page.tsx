"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fetchAgents, fetchVcs, type Agent, type AgentVC } from "@/lib/api"

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [vcs, setVcs] = useState<AgentVC[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [agentsData, vcsData] = await Promise.all([
          fetchAgents(),
          fetchVcs(),
        ])
        setAgents(agentsData)
        setVcs(vcsData)
        if (agentsData.length > 0 && !selectedAgentId) {
          setSelectedAgentId(agentsData[0].id)
        }
      } catch (err) {
        console.error("Failed to load agents", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectedAgent = useMemo(
    () =>
      agents.find((a) => a.id === selectedAgentId) ||
      agents[agents.length - 1] ||
      null,
    [agents, selectedAgentId]
  )

  const agentVcs = useMemo(() => {
    if (!selectedAgentId) return []
    return vcs.filter((vc) => vc.agent_id === selectedAgentId)
  }, [vcs, selectedAgentId])

  if (loading) {
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
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

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
                      {selectedAgent.name}
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
                  {agentVcs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No credentials attached to this wallet yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {agentVcs.map((vc) => (
                        <div
                          key={vc.vc_id}
                          className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {vc.name}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {vc.vc_id}
                            </span>
                          </div>
                          <Badge
                            className={
                              vc.status === "active"
                                ? "bg-success/10 text-success hover:bg-success/10"
                                : "bg-destructive/10 text-destructive hover:bg-destructive/10"
                            }
                          >
                            {vc.status === "active" ? "Active" : "Expired"}
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
