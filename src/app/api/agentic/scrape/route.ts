import { NextRequest, NextResponse } from "next/server";
import { agenticScrape } from "@/lib/agentic/scraper";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url") || "";

    if (!url.trim()) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const result = await agenticScrape(url);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to scrape URL: ${String(error)}` },
      { status: 500 }
    );
  }
}
