import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

export type MockVP = {
  vp_id: string
  holder_did: string
  credentials: string[]
  created_at: string
  type: "VerifiablePresentation"
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    holder_did?: string
    credentials?: string[]
  }

  const now = new Date().toISOString()
  const vp_id = `urn:uuid:${randomUUID()}`

  const vp: MockVP = {
    vp_id,
    holder_did: body.holder_did ?? "",
    credentials: body.credentials ?? [],
    created_at: now,
    type: "VerifiablePresentation",
  }

  return NextResponse.json(vp, { status: 201 })
}
