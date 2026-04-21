import { NextResponse } from "next/server"

import { getUserEvents } from "@/lib/server/data"


export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = parseInt(url.searchParams.get("userId") ?? "0", 10)

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const events = await getUserEvents(userId)
  return NextResponse.json({ events })
}
