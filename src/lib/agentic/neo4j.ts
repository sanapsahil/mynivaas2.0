export interface ListingGraphNode {
  id: string;
  label: "Listing" | "Broker" | "Location";
  properties: Record<string, unknown>;
}

export interface ListingGraphEdge {
  from: string;
  to: string;
  type: string;
  properties?: Record<string, unknown>;
}

export async function upsertGraphData(
  nodes: ListingGraphNode[],
  edges: ListingGraphEdge[]
): Promise<{ status: "connected" | "skipped"; message: string }> {
  const baseUrl = process.env.NEO4J_HTTP_URL;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!baseUrl || !username || !password) {
    return {
      status: "skipped",
      message: "Neo4j credentials not configured; graph sync skipped.",
    };
  }

  const statements = [
    ...nodes.map((node) => ({
      statement: `MERGE (n:${node.label} {id: $id}) SET n += $properties`,
      parameters: {
        id: node.id,
        properties: node.properties,
      },
    })),
    ...edges.map((edge) => ({
      statement: `MATCH (a {id: $from}), (b {id: $to}) MERGE (a)-[r:${edge.type}]->(b) SET r += $properties`,
      parameters: {
        from: edge.from,
        to: edge.to,
        properties: edge.properties ?? {},
      },
    })),
  ];

  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  const response = await fetch(`${baseUrl}/db/neo4j/tx/commit`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ statements }),
  });

  if (!response.ok) {
    return {
      status: "connected",
      message: `Neo4j responded with ${response.status}.`,
    };
  }

  return {
    status: "connected",
    message: "Graph data synchronized with Neo4j.",
  };
}
