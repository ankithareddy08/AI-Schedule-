import { NextResponse } from "next/server"

import { parseIntent } from "@/lib/server/intent"
import { generateSchedule } from "@/lib/server/scheduler"


export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: number
      prompt?: string
    }

    if (!body.userId || !body.prompt?.trim()) {
      return NextResponse.json(
        { error: "userId and prompt are required" },
        { status: 400 },
      )
    }

    const intent = await parseIntent(body.prompt, body.userId)
    const result = await generateSchedule(body.userId, intent)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Scheduling failed",
      },
      { status: 500 },
    )
  }
}
