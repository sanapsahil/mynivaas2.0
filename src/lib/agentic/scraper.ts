import { load } from "cheerio";

export interface AgenticScrapeResult {
  url: string;
  title?: string;
  extractedFields: Record<string, string>;
  method: "behavioral-fetch" | "llm-assisted";
}

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
];

function pickUserAgent(seed: string): string {
  const index = Math.abs(seed.length) % USER_AGENTS.length;
  return USER_AGENTS[index];
}

function parseHtmlHeuristics(html: string): Record<string, string> {
  const $ = load(html);
  const text = $("body").text().replace(/\s+/g, " ");

  const priceMatch = text.match(/(?:₹|Rs\.?|INR)\s*[\d,]+(?:\s*(?:Lac|Lakh|Cr|Crore))?/i);
  const areaMatch = text.match(/[\d,]+\s*(?:sq\.?\s*ft|sqft|sft)/i);
  const bhkMatch = text.match(/\b[1-6]\s*BHK\b/i);
  const phoneMatch = text.match(/(?:\+91[-\s]?)?[6-9]\d{9}/);

  return {
    price: priceMatch?.[0] ?? "",
    area: areaMatch?.[0] ?? "",
    bhk: bhkMatch?.[0] ?? "",
    phone: phoneMatch?.[0] ?? "",
  };
}

async function llmExtract(html: string): Promise<Record<string, string> | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = `Extract property fields from HTML text. Return JSON with keys: price, area, bhk, phone. HTML snippet: ${html.slice(0, 6000)}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: prompt,
      temperature: 0,
      max_output_tokens: 200,
    }),
  });

  if (!response.ok) return null;

  const body = (await response.json()) as {
    output_text?: string;
  };

  try {
    return JSON.parse(body.output_text ?? "{}");
  } catch {
    return null;
  }
}

export async function agenticScrape(url: string): Promise<AgenticScrapeResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": pickUserAgent(url),
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-IN,en;q=0.9",
    },
    cache: "no-store",
  });

  const html = await response.text();
  const heuristics = parseHtmlHeuristics(html);
  const llmFields = await llmExtract(html);

  return {
    url,
    title: /<title>(.*?)<\/title>/i.exec(html)?.[1],
    extractedFields: llmFields ?? heuristics,
    method: llmFields ? "llm-assisted" : "behavioral-fetch",
  };
}
