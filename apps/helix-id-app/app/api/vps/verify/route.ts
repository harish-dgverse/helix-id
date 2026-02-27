import { NextResponse } from "next/server"
// @ts-ignore
import { getAgents, logActivity } from "@/lib/db.js"
import { verifyPresentation } from "@/lib/vc-real.js"

// POST /api/vps/verify - Verify a Verifiable Presentation
export async function POST(request: Request) {
  try {
    const { vp, challenge, domain } = (await request.json()) as {
      vp?: any
      challenge?: string
      domain?: string
    }

    if (!vp) {
      return NextResponse.json({ error: "vp is required" }, { status: 400 })
    }

    console.log("Verifying VP...")
    const result: any = await verifyPresentation(vp, challenge, domain)
    console.log("VP verification result:", result.verified)

    const responseBody = {
      valid: result.verified,
      error: result.error,
      results: result.results,
    }

    // Log activity
    const agents = getAgents()
    const agent = agents.find((a: any) => a.did === vp.holder)
    const agentName = agent ? agent.name : "Unknown Agent"

    logActivity({
      type: "VP_VERIFIED",
      description: `VP verification ${
        result.verified ? "successful" : "failed"
      } for agent '${agentName}'`,
      metadata: {
        holderDid: vp.holder,
        agentName,
        verifier: domain || "Unknown Verifier",
        valid: result.verified,
        challenge,
      },
    })

    return NextResponse.json(responseBody)
  } catch (error: any) {
    console.error("VP verification error:", error)
    return NextResponse.json(
      {
        valid: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

