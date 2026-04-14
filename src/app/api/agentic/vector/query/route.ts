import { NextRequest, NextResponse } from "next/server";
import { getVectorDbAdapter } from "@/lib/agentic/vectorDb";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { vector: number[]; topK?: number };

    if (!Array.isArray(body.vector) || body.vector.length === 0) {
      return NextResponse.json({ error: "vector[] is required" }, { status: 400 });
    }

    const adapter = getVectorDbAdapter();
    const results = await adapter.query(body.vector, body.topK ?? 10);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to query vectors: ${String(error)}` },
      { status: 500 }
    );
  }
}
