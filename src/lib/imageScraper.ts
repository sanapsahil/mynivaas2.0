import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Scrapes property images from a listing URL.
 * Returns array of image URLs found on the page.
 */
export async function scrapePropertyImages(
  url: string,
  maxImages: number = 5
): Promise<string[]> {
  try {
    // Set a reasonable timeout and headers to avoid blocks
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      validateStatus: (status) => status < 500, // Accept 4xx responses
    });

    if (response.status !== 200) {
      return [];
    }

    const $ = cheerio.load(response.data);
    const imageUrls: string[] = [];

    // Common selectors for property images across different sites
    const selectors = [
      'img[class*="property"]',
      'img[class*="gallery"]',
      'img[class*="slider"]',
      'img[class*="photo"]',
      'img[alt*="property"]',
      'img[alt*="apartment"]',
      'img[alt*="house"]',
      'div[class*="gallery"] img',
      'div[class*="slider"] img',
      'div[class*="image"] img',
      ".image-gallery img",
      '[data-testid*="image"] img',
      '[data-testid*="photo"] img',
    ];

    // Try each selector
    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src && isValidImageUrl(src)) {
          const fullUrl = src.startsWith("http") ? src : new URL(src, url).href;
          if (!imageUrls.includes(fullUrl)) {
            imageUrls.push(fullUrl);
          }
        }
        if (imageUrls.length >= maxImages) return false; // Break
      });
      if (imageUrls.length >= maxImages) break;
    }

    // Fallback: try all images if we didn't find enough
    if (imageUrls.length < 3) {
      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src && isValidImageUrl(src)) {
          const fullUrl = src.startsWith("http") ? src : new URL(src, url).href;
          if (!imageUrls.includes(fullUrl) && !isIconOrLogo(src)) {
            imageUrls.push(fullUrl);
          }
        }
        if (imageUrls.length >= maxImages) return false;
      });
    }

    return imageUrls.slice(0, maxImages);
  } catch (error) {
    console.error(`Error scraping images from ${url}:`, error);
    return [];
  }
}

/**
 * Downloads an image from a URL and returns the buffer.
 */
export async function downloadImage(imageUrl: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      maxContentLength: 10 * 1024 * 1024, // 10MB max
    });

    if (response.status === 200 && response.data) {
      return Buffer.from(response.data);
    }
    return null;
  } catch (error) {
    console.error(`Error downloading image ${imageUrl}:`, error);
    return null;
  }
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    (lowerUrl.includes(".jpg") ||
      lowerUrl.includes(".jpeg") ||
      lowerUrl.includes(".png") ||
      lowerUrl.includes(".webp")) &&
    !lowerUrl.includes("sprite") &&
    !lowerUrl.includes("placeholder") &&
    !lowerUrl.includes("avatar") &&
    !lowerUrl.includes("icon") &&
    !lowerUrl.includes("logo")
  );
}

function isIconOrLogo(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes("logo") ||
    lowerUrl.includes("icon") ||
    lowerUrl.includes("avatar") ||
    lowerUrl.includes("sprite") ||
    url.length < 30 // Too short URLs are usually icons
  );
}
