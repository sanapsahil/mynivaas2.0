import { NextRequest, NextResponse } from "next/server";
import {
  ListingGraphEdge,
  ListingGraphNode,
  upsertGraphData,
} from "@/lib/agentic/neo4j";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      nodes: ListingGraphNode[];
      edges: ListingGraphEdge[];
    };

    if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
      return NextResponse.json(
        { error: "nodes[] and edges[] are required" },
        { status: 400 }
      );
    }

    const result = await upsertGraphData(body.nodes, body.edges);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to sync graph data: ${String(error)}` },
      { status: 500 }
    );
  }
}
