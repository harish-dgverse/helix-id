import { NextResponse } from "next/server"
import { readJsonFile } from "@/lib/server/json-store"

const AGENTS_PATH = "data/agents.json"

type Agent = {
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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const agents = await readJsonFile<Agent[]>(AGENTS_PATH, [])
  const agent = agents.find((a) => a.id === params.id)

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  return NextResponse.json(agent)
}

