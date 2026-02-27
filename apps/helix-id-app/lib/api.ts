export type Agent = {
  id: string
  did: string
  name: string
  walletId: string
  status: string
  createdAt: string
  vc_id?: string
  permissions?: string[]
  externalApiBaseUrl?: string
  externalApiKey?: string
  agentCallbackUrl?: string
}

export type AgentVC = {
  vc_id: string
  agent_id: string
  agent_did: string
  issuer: string
  type: string
  name: string
  scopes: string[]
  issued_at: string
  expires_at: string
  status: string
  full_vc: unknown
}

export type Activity = {
  id: string
  timestamp: string
  type: string
  description: string
  agentId?: string
  agentName?: string
  agentDid?: string
  vcId?: string
}

export async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch("/api/agents")
  if (!res.ok) throw new Error("Failed to fetch agents")
  return res.json()
}

export async function fetchVcs(status?: string): Promise<AgentVC[]> {
  const url = status ? `/api/vcs?status=${encodeURIComponent(status)}` : "/api/vcs"
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch credentials")
  return res.json()
}

export async function fetchActivity(limit?: number): Promise<Activity[]> {
  const url = typeof limit === "number" ? `/api/activity?limit=${limit}` : "/api/activity"
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch activity")
  return res.json()
}

export type PostVcPayload = {
  agentId: string
  type?: string
  name?: string
  scopes: string[]
  validityDays?: number
  constraints?: Record<string, unknown>
}

export async function postVc(payload: PostVcPayload): Promise<AgentVC> {
  const res = await fetch("/api/vcs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to issue credential")
  return res.json()
}

export type PostVpPayload = {
  holder_did?: string
  credentials?: string[]
}

export type MockVP = {
  vp_id: string
  holder_did: string
  credentials: string[]
  created_at: string
  type: string
}

export async function postVp(payload: PostVpPayload): Promise<MockVP> {
  const res = await fetch("/api/vps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to create presentation")
  return res.json()
}
