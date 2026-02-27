import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { readJsonFile, writeJsonFile } from "@/lib/server/json-store"

const AGENTS_PATH = "data/agents.json"
const VCS_PATH = "data/agent-vcs.json"
const ACTIVITY_PATH = "data/activity-log.json"

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

type Activity = {
  id: string
  timestamp: string
  type: string
  description: string
  agentId?: string
  agentName?: string
  agentDid?: string
  vcId?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string
    organization?: string
  }

  const [agents, vcs, activity] = await Promise.all([
    readJsonFile<Agent[]>(AGENTS_PATH, []),
    readJsonFile<AgentVC[]>(VCS_PATH, []),
    readJsonFile<Activity[]>(ACTIVITY_PATH, []),
  ])

  const id = String(agents.length + 1)
  const now = new Date().toISOString()

  const did = `did:hedera:testnet:${randomUUID()}`
  const walletId = `w${id}`
  const vc_id = `vc_${Date.now()}`

  const permissions = [
    "search_books",
    "view_inventory",
    "place_order",
    "check_order_status",
  ]

  const agent: Agent = {
    id,
    did,
    name: body.name || "New Agent",
    walletId,
    status: "active",
    createdAt: now,
    vc_id,
    permissions,
    externalApiBaseUrl: "http://localhost:3000/",
    externalApiKey: "1234",
    agentCallbackUrl: "http://localhost:3000/callback",
  }

  const vc_id_urn = `urn:uuid:${randomUUID()}`

  const vc: AgentVC = {
    vc_id: vc_id_urn,
    agent_id: agent.id,
    agent_did: agent.did,
    issuer: "did:hedera:testnet:issuer-example",
    type: "BookOrderingCredential",
    name: "BookOrderingCredential permissions",
    scopes: permissions,
    issued_at: now,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    full_vc: {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1",
        "https://helixid.io/contexts/agent-permissions/v1",
      ],
      id: vc_id_urn,
      type: ["VerifiableCredential", "BookOrderingCredential"],
      issuer: "did:hedera:testnet:issuer-example",
      issuanceDate: now,
      expirationDate: new Date(
        Date.now() + 90 * 24 * 60 * 60 * 1000
      ).toISOString(),
      credentialSubject: {
        id: agent.did,
        name: "BookOrderingCredential permissions",
        scopes: permissions,
      },
      proof: {
        type: "Ed25519Signature2020",
        created: now,
        verificationMethod:
          "did:hedera:testnet:issuer-example#did-root-key",
        proofPurpose: "assertionMethod",
        proofValue: "mock-proof-value",
      },
    },
  }

  const createdActivity: Activity[] = [
    {
      id: randomUUID(),
      timestamp: now,
      type: "AGENT_CREATED",
      description: `New agent "${agent.name}" created with DID ${agent.did}`,
      agentId: agent.id,
      agentName: agent.name,
      agentDid: agent.did,
      vcId: vc.vc_id,
    },
    {
      id: randomUUID(),
      timestamp: now,
      type: "VC_ISSUED",
      description: `Issued credential ${vc.vc_id} to agent "${agent.name}"`,
      agentId: agent.id,
      agentName: agent.name,
      agentDid: agent.did,
      vcId: vc.vc_id,
    },
  ]

  await Promise.all([
    writeJsonFile(AGENTS_PATH, [...agents, agent]),
    writeJsonFile(VCS_PATH, [...vcs, vc]),
    writeJsonFile(ACTIVITY_PATH, [...activity, ...createdActivity]),
  ])

  return NextResponse.json(
    {
      agent,
      vc,
    },
    { status: 201 }
  )
}

