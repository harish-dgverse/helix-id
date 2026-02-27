import { NextResponse } from "next/server"
// @ts-ignore
import { getAgentById } from "@/lib/db.js"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const agent = getAgentById(params.id)

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  return NextResponse.json(agent)
}

