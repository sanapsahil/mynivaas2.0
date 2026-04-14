import { SentimentOutput } from "./types";
import { clamp, roundTo } from "./utils";

const POSITIVE_TERMS = [
  "good",
  "great",
  "green",
  "safe",
  "premium",
  "upcoming metro",
  "investment",
  "growth",
  "clean",
];

const NEGATIVE_TERMS = [
  "traffic",
  "flood",
  "waterlogging",
  "noise",
  "delay",
  "fraud",
  "overpriced",
  "pollution",
  "crime",
];

async function fetchRedditSnippets(query: string): Promise<string[]> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=20&sort=relevance`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "EstateCompare/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as {
      data?: { children?: Array<{ data?: { title?: string; selftext?: string } }> };
    };

    return (payload.data?.children ?? [])
      .map((item) => `${item.data?.title ?? ""} ${item.data?.selftext ?? ""}`.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function scoreFromTexts(texts: string[]): number {
  if (texts.length === 0) return 0;

  let score = 0;
  for (const text of texts) {
    const lower = text.toLowerCase();
    for (const term of POSITIVE_TERMS) {
      if (lower.includes(term)) score += 1;
    }
    for (const term of NEGATIVE_TERMS) {
      if (lower.includes(term)) score -= 1;
    }
  }

  return score / texts.length;
}

export async function analyzeExternalSentiment(query: string): Promise<SentimentOutput> {
  const snippets = await fetchRedditSnippets(query);
  const rawScore = scoreFromTexts(snippets);
  const normalizedScore = clamp(rawScore / 5, -1, 1);

  const highlights = snippets.slice(0, 5);
  const confidence = clamp(snippets.length / 25, 0.2, 0.9);

  return {
    query,
    score: roundTo(normalizedScore, 2),
    confidence: roundTo(confidence, 2),
    highlights,
    sources: snippets.length > 0 ? ["reddit"] : [],
  };
}
