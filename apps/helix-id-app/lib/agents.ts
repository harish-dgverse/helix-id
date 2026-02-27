export type AgentCredential = {
  id: string
  type: string
  status: "Active" | "Revoked"
}

export type OnboardedAgent = {
  id: string
  name: string
  organization: string
  did: string
  walletId: string
  createdAt: string
  credentials: AgentCredential[]
}

const STORAGE_KEY = "helixid_agents"

export function loadAgents(): OnboardedAgent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as OnboardedAgent[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveAgents(agents: OnboardedAgent[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
  } catch {
    // ignore storage errors
  }
}

export function addAgent(agent: OnboardedAgent) {
  const current = loadAgents()
  const next = [...current, agent]
  saveAgents(next)
  return next
}

