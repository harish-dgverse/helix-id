"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bot,
  ShieldCheck,
  Activity as ActivityIcon,
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fetchAgents, fetchVcs, fetchActivity, type Agent, type AgentVC, type Activity } from "@/lib/api"

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} hour${diffH > 1 ? "s" : ""} ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD} day${diffD > 1 ? "s" : ""} ago`
}

function isVcActive(vc: AgentVC): boolean {
  return vc.status === "active" && new Date(vc.expires_at).getTime() > Date.now()
}

export default function ActivityPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [vcs, setVcs] = useState<AgentVC[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [agentsData, vcsData, activityData] = await Promise.all([
          fetchAgents(),
          fetchVcs(),
          fetchActivity(),
        ])
        setAgents(agentsData)
        setVcs(vcsData)
        setActivity(activityData)
      } catch (err) {
        console.error("Failed to load activity data", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const agentStats = useMemo(() => {
    return agents.map((agent) => {
      const agentVcs = vcs.filter((v) => v.agent_id === agent.id)
      const activeCount = agentVcs.filter(isVcActive).length
      const expiredCount = agentVcs.filter((v) => !isVcActive).length
      const lastActivity = activity
        .filter((a) => a.agentId === agent.id)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0]
      const permissionStatus =
        activeCount > 0 ? "Granted" : expiredCount > 0 ? "Expired" : "None"

      return {
        agent,
        activeCredentials: activeCount,
        expiredCredentials: expiredCount,
        permissionStatus,
        lastActivity: lastActivity
          ? formatRelative(lastActivity.timestamp)
          : "—",
        totalEvents: activity.filter((a) => a.agentId === agent.id).length,
      }
    })
  }, [agents, vcs, activity])

  const totalEvents = activity.length
  const totalAgents = agents.length
  const activeCreds = vcs.filter(isVcActive).length
  const riskAlerts = activity.filter((a) =>
    (a.type || "").toUpperCase().includes("VIOLATION")
  ).length

  if (loading) {
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
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Events",
            value: totalEvents.toLocaleString(),
            icon: ActivityIcon,
          },
          {
            label: "Agents",
            value: totalAgents.toLocaleString(),
            icon: Bot,
          },
          {
            label: "Active Credentials",
            value: activeCreds.toLocaleString(),
            icon: CheckCircle2,
            color: "text-success",
          },
          {
            label: "Risk Alerts",
            value: riskAlerts.toString(),
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

      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Agent Status Overview
        </h2>
        {agents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No agents yet. Onboard an agent first.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agentStats.map(({ agent, activeCredentials, expiredCredentials, permissionStatus, lastActivity, totalEvents }) => {
              return (
                <Card key={agent.id} className="border-border bg-card">
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
                          <p className="font-mono text-xs text-muted-foreground break-all">
                            {agent.did}
                          </p>
                        </div>
                      </div>
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
                          className="mt-1 text-xs border-success/30 text-success"
                        >
                          Verified
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
                            permissionStatus === "Granted"
                              ? "border-success/30 text-success"
                              : permissionStatus === "Expired"
                                ? "border-warning/30 text-warning"
                                : "border-muted-foreground/30 text-muted-foreground"
                          }`}
                        >
                          {permissionStatus}
                        </Badge>
                      </div>
                      <div className="flex flex-col items-center rounded-md bg-secondary p-2">
                        <div className="flex items-center gap-1">
                          <ActivityIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Last
                          </span>
                        </div>
                        <span className="mt-1 text-xs font-medium text-foreground">
                          {lastActivity}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                      <span>{totalEvents} events</span>
                      <span>
                        {activeCredentials} active / {expiredCredentials} expired
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
