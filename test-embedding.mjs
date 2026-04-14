import { pipeline } from "@xenova/transformers";

async function test() {
  try {
    console.log("Loading CLIP model...");
    const pipe = await pipeline("feature-extraction", "Xenova/clip-vit-base-patch32");
    
    console.log("Testing with text input...");
    const textResult = await pipe("a beautiful living room with natural light", {
      pooling: "mean",
      normalize: true,
    });
    console.log("✓ Text input works");
    console.log("  Result type:", Array.isArray(textResult) ? "Array" : typeof textResult);
    if (textResult && textResult.data) {
      console.log("  Has .data property, length:", textResult.data.length);
    }
    if (Array.isArray(textResult)) {
      console.log("  Direct array, length:", textResult.length);
    }
    
    console.log("\nTesting with data URL...");
    const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDA";
    try {
      const urlResult = await pipe(dataUrl, {
        pooling: "mean",
        normalize: true,
      });
      console.log("✓ Data URL input works");
      console.log("  Result type:", Array.isArray(urlResult) ? "Array" : typeof urlResult);
    } catch (e) {
      console.log("✗ Data URL input failed:", e.message);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
  process.exit(0);
}

test();
