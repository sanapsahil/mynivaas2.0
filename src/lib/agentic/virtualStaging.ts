import { estimateHash } from "./utils";

export interface VirtualStagingInput {
  imageUrl?: string;
  prompt?: string;
  roomType?: string;
  style?: string;
}

export interface VirtualStagingOutput {
  status: "generated" | "simulated" | "failed";
  stagedImageUrl?: string;
  promptUsed: string;
  notes: string;
}

function buildPrompt(input: VirtualStagingInput): string {
  const roomType = input.roomType ?? "living room";
  const style = input.style ?? "modern minimal";
  return (
    input.prompt ??
    `Virtually stage an empty ${roomType} with ${style} furniture, natural lighting, and realistic shadows.`
  );
}

export async function stageRoomImage(
  input: VirtualStagingInput
): Promise<VirtualStagingOutput> {
  const prompt = buildPrompt(input);
  const apiKey = process.env.STABILITY_API_KEY;

  if (!apiKey) {
    return {
      status: "simulated",
      promptUsed: prompt,
      stagedImageUrl: input.imageUrl,
      notes:
        "STABILITY_API_KEY not configured. Returned simulation response with prompt only.",
    };
  }

  try {
    const response = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image: input.imageUrl,
        output_format: "png",
      }),
    });

    if (!response.ok) {
      return {
        status: "failed",
        promptUsed: prompt,
        notes: `Staging provider error: ${response.status}`,
      };
    }

    const body = (await response.json()) as { image?: string };
    return {
      status: "generated",
      promptUsed: prompt,
      stagedImageUrl: body.image,
      notes: "Generated via Stable Diffusion provider.",
    };
  } catch (error) {
    return {
      status: "failed",
      promptUsed: prompt,
      stagedImageUrl: `staging-fallback-${estimateHash(prompt)}`,
      notes: `Staging request failed: ${String(error)}`,
    };
  }
}
