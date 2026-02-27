import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
// @ts-ignore
import { getAgents, saveAgents, logActivity } from "@/lib/db.js"
import { generateAgentDID } from "@/lib/vc-real.js"

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
  privateKeyString?: string
  publicKeyString?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<{
    name: string
    organization: string
    externalApiBaseUrl: string
    externalApiKey: string
    agentCallbackUrl: string
  }>

  const agents = getAgents() as Agent[]

  const id = String(agents.length + 1)
  const walletId = `w${id}`

  // Generate REAL Hedera DID for agent
  console.log("Generating Hedera DID for agent...")
  const agentDIDData: any = await generateAgentDID()
  console.log("Agent DID generated:", agentDIDData.did)

  const now = new Date().toISOString()

  const agent: Agent = {
    id,
    did: agentDIDData.did || `did:hedera:testnet:${randomUUID()}`,
    name: body.name || "New Agent",
    walletId,
    status: "active",
    createdAt: now,
    permissions: [],
    externalApiBaseUrl: body.externalApiBaseUrl || "http://localhost:3000/",
    externalApiKey: body.externalApiKey || "1234",
    agentCallbackUrl: body.agentCallbackUrl || "http://localhost:3000/callback",
    privateKeyString: agentDIDData.privateKeyString,
    publicKeyString: agentDIDData.publicKeyString,
  }

  // Save agent (newest first)
  agents.unshift(agent)
  saveAgents(agents)

  // Log activity
  logActivity({
    type: "AGENT_CREATED",
    description: `New agent "${agent.name}" created with DID ${agent.did}`,
    metadata: {
      agentId: agent.id,
      agentName: agent.name,
      agentDid: agent.did,
    },
  })

  return NextResponse.json(
    {
      agent,
    },
    { status: 201 }
  )
}
