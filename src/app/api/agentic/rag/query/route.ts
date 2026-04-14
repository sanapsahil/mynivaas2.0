import { NextRequest, NextResponse } from "next/server";
import {
  indexRagDocuments,
  multimodalRetrieve,
  RagDocument,
} from "@/lib/agentic/rag";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const textQuery = String(formData.get("query") || "").trim();

    if (!textQuery) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const docsRaw = String(formData.get("documents") || "[]");
    const documents = JSON.parse(docsRaw) as RagDocument[];
    if (documents.length > 0) {
      indexRagDocuments(documents);
    }

    const imageFile = formData.get("image") as File | null;
    let imageBuffer: Buffer | undefined;
    if (imageFile && imageFile.type.startsWith("image/")) {
      imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    }

    const results = await multimodalRetrieve({
      textQuery,
      imageBuffer,
      topK: 8,
    });

    return NextResponse.json({ success: true, results, indexed: documents.length });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to run multimodal RAG: ${String(error)}` },
      { status: 500 }
    );
  }
}
