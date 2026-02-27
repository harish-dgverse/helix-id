import { NextResponse } from "next/server"
// @ts-ignore
import { getVCByAgentId } from "@/lib/db.js"

// GET /api/vcs/agent/:agent_id - Get VC for an agent
export async function GET(
  _request: Request,
  { params }: { params: { agent_id: string } }
) {
  try {
    const vc = getVCByAgentId(params.agent_id)
    if (!vc) {
      return NextResponse.json(
        { error: "VC not found for this agent" },
        { status: 404 }
      )
    }
    return NextResponse.json(vc)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

