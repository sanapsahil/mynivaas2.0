import { pipeline } from "@xenova/transformers";
import sharp from "sharp";
import fs from "fs";

async function test() {
  try {
    // Create a simple test image
    const buffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 100, b: 0 }
      }
    }).jpeg().toBuffer();
    
    const dataUrl = "data:image/jpeg;base64," + buffer.toString("base64");
    
    console.log("Loading CLIP image embedding model...");
    const pipe = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32", {
      vision_model: "Xenova/clip-vit-base-patch32",
      pooling: "mean",
    });
    
    console.log("Testing with data URL image...");
    const result = await pipe(dataUrl);
    console.log("✓ Works!");
    console.log("  Result type:", Array.isArray(result) ? "Array" : typeof result);
    if (result && result.data) {
      console.log("  .data length:", result.data.length);
      console.log("  First few values:", Array.from(result.data).slice(0, 5));
    } else if (Array.isArray(result)) {
      console.log("  Array length:", result.length);
      console.log("  First few values:", result.slice(0, 5));
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error.stack);
  }
  process.exit(0);
}

test();
