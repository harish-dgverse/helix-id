import { NextResponse } from "next/server"
import { readJsonFile, writeJsonFile } from "@/lib/server/json-store"
import { randomUUID } from "crypto"

const VCS_PATH = "data/agent-vcs.json"

type AgentVC = {
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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const status = url.searchParams.get("status")

  const vcs = await readJsonFile<AgentVC[]>(VCS_PATH, [])
  const filtered =
    status && status !== "all"
      ? vcs.filter((vc) => vc.status === status)
      : vcs

  return NextResponse.json(filtered)
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AgentVC>
  const vcs = await readJsonFile<AgentVC[]>(VCS_PATH, [])

  const now = new Date().toISOString()
  const vc_id = body.vc_id ?? `urn:uuid:${randomUUID()}`

  const vc: AgentVC = {
    vc_id,
    agent_id: body.agent_id ?? "",
    agent_did: body.agent_did ?? "",
    issuer: body.issuer ?? "",
    type: body.type ?? "AgentCredential",
    name: body.name ?? "Agent permissions credential",
    scopes: body.scopes ?? [],
    issued_at: body.issued_at ?? now,
    expires_at:
      body.expires_at ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    status: body.status ?? "active",
    full_vc: body.full_vc ?? {},
  }

  const updated = [...vcs, vc]
  await writeJsonFile(VCS_PATH, updated)

  return NextResponse.json(vc, { status: 201 })
}

