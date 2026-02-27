import { NextResponse } from "next/server"
// @ts-ignore
import { getAgentVCs, logActivity } from "@/lib/db.js"

// POST /api/vps/create - Create a Verifiable Presentation
export async function POST(request: Request) {
  try {
    const {
      vc_id,
      agent_did,
      agent_private_key,
      challenge,
      domain,
    } = (await request.json()) as {
      vc_id?: string
      agent_did?: string
      agent_private_key?: string
      challenge?: string
      domain?: string
    }

    if (!agent_did || !agent_private_key) {
      return NextResponse.json(
        {
          error: "agent_did and agent_private_key are required",
        },
        { status: 400 }
      )
    }

    // Import VP functions
    const { createPresentation } = await import("@/lib/vc-real.js")

    // Get the VC
    const vcs = getAgentVCs() as any[]
    let vcRecord: any

    if (vc_id) {
      vcRecord = vcs.find((v) => v.vc_id === vc_id)
    } else {
      // If no vc_id provided, find latest active for agent
      const agentVcs = vcs.filter(
        (v) => v.agent_did === agent_did && v.status === "active"
      )
      if (agentVcs.length > 0) {
        agentVcs.sort((a: any, b: any) => {
          const dateA = new Date(
            a.issued_at || a.full_vc?.issuanceDate || 0
          ).getTime()
          const dateB = new Date(
            b.issued_at || b.full_vc?.issuanceDate || 0
          ).getTime()
          return dateB - dateA
        })
        vcRecord = agentVcs[0]
      }
    }

    if (!vcRecord) {
      return NextResponse.json({ error: "VC not found" }, { status: 404 })
    }

    if (!vcRecord.full_vc) {
      return NextResponse.json(
        { error: "VC does not have full credential data" },
        { status: 400 }
      )
    }

    // Create VP
    console.log("Creating VP for agent:", agent_did)
    const vp = await createPresentation({
      credentials: [vcRecord.full_vc],
      holderDid: agent_did,
      holderPrivateKey: agent_private_key,
      challenge: challenge || `challenge_${Date.now()}`,
      domain: domain || undefined,
    })
    console.log("VP created successfully")

    const responseBody = {
      vp,
      message: "Verifiable Presentation created successfully",
    }

    // Log activity
    logActivity({
      type: "VP_ISSUED",
      description: `VP issued for agent DID ${agent_did.slice(0, 20)}...`,
      metadata: {
        agentDid: agent_did,
        vcId: vc_id,
        challenge,
        domain,
      },
    })

    return NextResponse.json(responseBody)
  } catch (error: any) {
    console.error("VP creation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

