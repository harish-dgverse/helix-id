import { NextResponse } from "next/server"
import { readJsonFile, writeJsonFile } from "@/lib/server/json-store"
import { randomUUID } from "crypto"

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

export async function GET() {
  const agents = await readJsonFile<Agent[]>(AGENTS_PATH, [])
  return NextResponse.json(agents)
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Agent>
  const agents = await readJsonFile<Agent[]>(AGENTS_PATH, [])

  const id = body.id ?? String(agents.length + 1)
  const now = new Date().toISOString()

  const agent: Agent = {
    id,
    did:
      body.did ??
      `did:hedera:testnet:${randomUUID()}`,
    name: body.name ?? "New Agent",
    walletId: body.walletId ?? `w${id}`,
    status: body.status ?? "active",
    createdAt: body.createdAt ?? now,
    vc_id: body.vc_id,
    permissions: body.permissions ?? [],
    externalApiBaseUrl: body.externalApiBaseUrl ?? "",
    externalApiKey: body.externalApiKey ?? "",
    agentCallbackUrl: body.agentCallbackUrl ?? "",
  }

  const updated = [...agents, agent]
  await writeJsonFile(AGENTS_PATH, updated)

  return NextResponse.json(agent, { status: 201 })
}

