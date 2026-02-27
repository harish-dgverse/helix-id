import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
// @ts-ignore
import {
  getAgentVCs,
  getAgentById,
  getManagerDID,
  saveAgentVCs,
  logActivity,
} from "@/lib/db.js"

// GET /api/vcs - List all VCs
export async function GET() {
  try {
    const vcs = getAgentVCs() as any[]
    // Sort by issued_at descending (newest first)
    vcs.sort((a: any, b: any) => {
      const dateA = new Date(a.issued_at || a.full_vc?.issuanceDate || 0).getTime()
      const dateB = new Date(b.issued_at || b.full_vc?.issuanceDate || 0).getTime()
      return dateB - dateA
    })
    return NextResponse.json(vcs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/vcs - Issue a new VC
export async function POST(request: Request) {
  try {
    const {
      agentId,
      type,
      name,
      scopes,
      constraints,
      validityDays = 90,
    } = (await request.json()) as {
      agentId?: string
      type?: string
      name?: string
      scopes?: string[]
      constraints?: Record<string, unknown>
      validityDays?: number
    }

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    const agent = getAgentById(agentId)
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Import real VC functions dynamically to match original pattern
    const { issueCredential } = await import("@/lib/vc-real.js")
    const manager = getManagerDID()

    const now = new Date()
    const validUntil = new Date(
      now.getTime() + validityDays * 24 * 60 * 60 * 1000
    ).toISOString()

    // Prepare credential subject
    const credentialSubject = {
      id: agent.did,
      name: name || type,
      scopes: scopes || [],
      ...(constraints || {}),
    }

    // Build credential structure (W3C V1 + Ed25519)
    const credential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1",
        "https://helixid.io/contexts/agent-permissions/v1",
      ],
      id: `urn:uuid:${randomUUID()}`,
      type: ["VerifiableCredential", type || "VerifiableCredential"],
      issuer: manager.did,
      issuanceDate: now.toISOString(),
      expirationDate: validUntil,
      credentialSubject,
    }

    console.log(`Issuing VC of type ${type} for agent ${agent.name}...`)

    // Issue REAL VC
    const signedVC: any = await issueCredential({
      issuerDid: manager.did,
      holderDid: agent.did,
      issuerPrivateKey: manager.privateKeyString,
      credential,
    })

    // Create VC record for DB
    const vcRecord = {
      vc_id: signedVC.id,
      agent_id: agentId,
      agent_did: agent.did,
      issuer: manager.did,
      type: type || "VerifiableCredential",
      name: name || type,
      scopes: scopes || [],
      issued_at: signedVC.issuanceDate,
      expires_at: signedVC.expirationDate,
      status: "active",
      full_vc: signedVC,
    }

    // Save to DB
    const vcs = getAgentVCs()
    vcs.push(vcRecord)
    saveAgentVCs(vcs)

    // Log activity
    logActivity({
      type: "VC_ISSUED",
      description: `Issued ${type} to agent "${agent.name}"`,
      metadata: {
        vcId: signedVC.id,
        vcType: type,
        agentId: agent.id,
        agentName: agent.name,
        issuer: manager.did,
      },
    })

    return NextResponse.json(vcRecord, { status: 201 })
  } catch (error: any) {
    console.error("VC Issuance Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

