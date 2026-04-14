import { generateImageEmbedding } from "@/lib/imageEmbeddings";
import { cosineSimilarity } from "@/lib/imageEmbeddings";
import { normalizeText } from "./utils";

export interface RagDocument {
  id: string;
  text: string;
  source: string;
  embedding?: number[];
}

export interface RagQueryInput {
  textQuery: string;
  imageBuffer?: Buffer;
  topK?: number;
}

export interface RagResult {
  id: string;
  score: number;
  text: string;
  source: string;
}

const memoryStore: RagDocument[] = [];

function textScore(query: string, doc: RagDocument): number {
  const queryTokens = new Set(normalizeText(query).split(" ").filter(Boolean));
  const docTokens = new Set(normalizeText(doc.text).split(" ").filter(Boolean));

  if (queryTokens.size === 0 || docTokens.size === 0) return 0;

  let overlap = 0;
  queryTokens.forEach((token) => {
    if (docTokens.has(token)) overlap += 1;
  });

  return overlap / Math.max(queryTokens.size, docTokens.size);
}

export function indexRagDocuments(documents: RagDocument[]): void {
  for (const document of documents) {
    const existingIndex = memoryStore.findIndex((item) => item.id === document.id);
    if (existingIndex >= 0) {
      memoryStore[existingIndex] = document;
    } else {
      memoryStore.push(document);
    }
  }
}

export async function multimodalRetrieve(input: RagQueryInput): Promise<RagResult[]> {
  const topK = input.topK ?? 5;
  let queryEmbedding: number[] | undefined;

  if (input.imageBuffer) {
    queryEmbedding = await generateImageEmbedding(input.imageBuffer);
  }

  const scored = memoryStore.map((document) => {
    const lexical = textScore(input.textQuery, document);
    const visual =
      queryEmbedding && document.embedding
        ? cosineSimilarity(queryEmbedding, document.embedding)
        : 0;

    const score = lexical * 0.55 + visual * 0.45;

    return {
      id: document.id,
      score,
      text: document.text,
      source: document.source,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
