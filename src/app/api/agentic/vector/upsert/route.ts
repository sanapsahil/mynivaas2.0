import { NextRequest, NextResponse } from "next/server";
import { getVectorDbAdapter, VectorRecord } from "@/lib/agentic/vectorDb";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { records: VectorRecord[] };
    if (!Array.isArray(body.records) || body.records.length === 0) {
      return NextResponse.json({ error: "records[] is required" }, { status: 400 });
    }

    const adapter = getVectorDbAdapter();
    await adapter.upsert(body.records);

    return NextResponse.json({ success: true, upserted: body.records.length });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to upsert vectors: ${String(error)}` },
      { status: 500 }
    );
  }
}
