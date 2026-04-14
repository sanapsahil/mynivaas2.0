import { NextRequest, NextResponse } from "next/server";
import { stageRoomImage } from "@/lib/agentic/virtualStaging";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      imageUrl?: string;
      prompt?: string;
      roomType?: string;
      style?: string;
    };

    const result = await stageRoomImage(body);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to stage room image: ${String(error)}` },
      { status: 500 }
    );
  }
}
