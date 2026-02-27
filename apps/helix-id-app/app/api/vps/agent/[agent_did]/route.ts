import { NextResponse } from "next/server"
// @ts-ignore
import { getAgentVCs, getAgents, logActivity } from "@/lib/db.js"

// GET /api/vps/agent/:agent_did - Get VP for an agent (creates on-demand)
export async function GET(
  request: Request,
  { params }: { params: { agent_did: string } }
) {
  try {
    const { agent_did } = params
    const url = new URL(request.url)
    const challenge = url.searchParams.get("challenge") || undefined
    const domain = url.searchParams.get("domain") || undefined
    const type = url.searchParams.get("type") || undefined

    // Find agent
    const agents = getAgents()
    const agent = agents.find((a: any) => a.did === agent_did)

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (!agent.privateKeyString) {
      return NextResponse.json(
        { error: "Agent does not have private key stored" },
        { status: 400 }
      )
    }

    // Get agent's VCs
    const vcs = getAgentVCs()

    // Find all active VCs for this agent, optionally filtered by type
    const agentVcs = vcs.filter(
      (v: any) =>
        v.agent_did === agent_did &&
        v.status === "active" &&
        (!type || v.type === type)
    )

    if (agentVcs.length === 0) {
      return NextResponse.json(
        { error: "Active VC not found for agent" },
        { status: 404 }
      )
    }

    // Filter by type if requested, otherwise fallback to any active VC (sorted by date)
    const filteredVcs = type ? agentVcs.filter((v: any) => v.type === type) : agentVcs

    if (filteredVcs.length === 0) {
      console.warn(
        `No active VC of type ${type} found, using latest available active VC.`
      )
    }

    const finalVcs = filteredVcs.length > 0 ? filteredVcs : agentVcs

    // Sort by issued_at descending (newest first)
    finalVcs.sort((a: any, b: any) => {
      const dateA = new Date(
        a.issued_at || a.full_vc?.issuanceDate || 0
      ).getTime()
      const dateB = new Date(
        b.issued_at || b.full_vc?.issuanceDate || 0
      ).getTime()
      return dateB - dateA
    })

    const vcRecord = finalVcs[0]

    if (!vcRecord || !vcRecord.full_vc) {
      return NextResponse.json(
        { error: "Valid VC record not found" },
        { status: 404 }
      )
    }

    // Create VP
    const { createPresentation } = await import("@/lib/vc-real.js")

    const vp = await createPresentation({
      credentials: [vcRecord.full_vc],
      holderDid: agent_did,
      holderPrivateKey: agent.privateKeyString,
      challenge: challenge || `challenge_${Date.now()}`,
      domain: domain || undefined,
    })

    const responseBody = {
      vp,
      agent_did,
      vc_id: vcRecord.vc_id,
    }

    // Log activity
    logActivity({
      type: "VP_ISSUED",
      description: `VP issued for agent DID ${agent_did.slice(
        0,
        20
      )}... (On-demand)`,
      metadata: {
        agentDid: agent_did,
        agentName: agent.name,
        vcId: vcRecord.vc_id,
        challenge,
        domain,
        vcType: type,
      },
    })

    return NextResponse.json(responseBody)
  } catch (error: any) {
    console.error("VP generation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

