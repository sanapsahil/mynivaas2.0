export interface VectorRecord {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorQueryResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface VectorDbAdapter {
  upsert(records: VectorRecord[]): Promise<void>;
  query(vector: number[], topK: number): Promise<VectorQueryResult[]>;
}

class NoopVectorDbAdapter implements VectorDbAdapter {
  async upsert(records: VectorRecord[]): Promise<void> {
    void records;
    return;
  }

  async query(vector: number[], topK: number): Promise<VectorQueryResult[]> {
    void vector;
    void topK;
    return [];
  }
}

class PineconeAdapter implements VectorDbAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly indexUrl: string
  ) {}

  async upsert(records: VectorRecord[]): Promise<void> {
    await fetch(`${this.indexUrl}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vectors: records }),
    });
  }

  async query(vector: number[], topK: number): Promise<VectorQueryResult[]> {
    const response = await fetch(`${this.indexUrl}/query`, {
      method: "POST",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vector,
        topK,
        includeMetadata: true,
      }),
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as {
      matches?: Array<{ id: string; score?: number; metadata?: Record<string, unknown> }>;
    };

    return (payload.matches ?? []).map((match) => ({
      id: match.id,
      score: match.score ?? 0,
      metadata: match.metadata,
    }));
  }
}

export function getVectorDbAdapter(): VectorDbAdapter {
  const provider = process.env.VECTOR_DB_PROVIDER;

  if (provider === "pinecone") {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexUrl = process.env.PINECONE_INDEX_URL;

    if (apiKey && indexUrl) {
      return new PineconeAdapter(apiKey, indexUrl);
    }
  }

  return new NoopVectorDbAdapter();
}
