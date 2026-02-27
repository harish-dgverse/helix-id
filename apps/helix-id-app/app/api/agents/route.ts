import { NextResponse } from "next/server"
// @ts-ignore
import { getAgents, saveAgents, logActivity } from "@/lib/db.js"
import { generateAgentDID } from "@/lib/vc-real.js"

export async function GET() {
  const agents = getAgents()
  return NextResponse.json(agents)
}

export async function POST(request: Request) {
  try {
    const { name, externalApiBaseUrl, externalApiKey, agentCallbackUrl } =
      (await request.json()) as {
        name?: string
        externalApiBaseUrl?: string
        externalApiKey?: string
        agentCallbackUrl?: string
      }

    if (!name) {
      return NextResponse.json(
        { error: "Agent name is required" },
        { status: 400 }
      )
    }

    const agents = getAgents()
    const id = String(agents.length + 1)
    const walletId = `w${id}`

    // Generate REAL Hedera DID for agent
    console.log("Generating Hedera DID for agent...")
    const agentDIDData: any = await generateAgentDID()
    console.log("Agent DID generated:", agentDIDData.did)

    const now = new Date().toISOString().slice(0, 10)

    // Default permissions for new agents
    const permissions = [
      "search_books",
      "place_order",
      "view_inventory",
      "check_order_status",
    ]

    const newAgent = {
      id,
      did: agentDIDData.did,
      name,
      walletId,
      status: "active",
      createdAt: now,
      permissions,
      // Store agent keys
      privateKeyString: agentDIDData.privateKeyString,
      publicKeyString: agentDIDData.publicKeyString,
      externalApiBaseUrl: externalApiBaseUrl || "",
      externalApiKey: externalApiKey || "",
      agentCallbackUrl: agentCallbackUrl || "",
    }

    // Save agent
    agents.unshift(newAgent)
    saveAgents(agents)

    // Log activity
    logActivity({
      type: "AGENT_CREATED",
      description: `New agent "${name}" created with DID ${agentDIDData.did}`,
      metadata: {
        agentId: id,
        agentName: name,
        agentDid: agentDIDData.did,
      },
    })

    return NextResponse.json(newAgent, { status: 201 })
  } catch (error: any) {
    console.error("Agent creation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

