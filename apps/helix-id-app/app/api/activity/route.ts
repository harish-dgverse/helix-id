import { NextResponse } from "next/server"
import { readJsonFile, writeJsonFile } from "@/lib/server/json-store"
import { randomUUID } from "crypto"

const ACTIVITY_PATH = "data/activity-log.json"

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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  const activity = await readJsonFile<Activity[]>(ACTIVITY_PATH, [])
  const sorted = [...activity].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const sliced = typeof limit === "number" && !Number.isNaN(limit)
    ? sorted.slice(0, limit)
    : sorted

  return NextResponse.json(sliced)
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Activity>
  console.log(body);
  const activity = await readJsonFile<Activity[]>(ACTIVITY_PATH, [])

  const entry: Activity = {
    id: body.id ?? randomUUID(),
    timestamp: body.timestamp ?? new Date().toISOString(),
    type: body.type ?? "GENERIC",
    description: body.description ?? "",
    agentId: body.agentId,
    agentName: body.agentName,
    agentDid: body.agentDid,
    vcId: body.vcId,
  }

  const updated = [...activity, entry]
  await writeJsonFile(ACTIVITY_PATH, updated)

  return NextResponse.json(entry, { status: 201 })
}

