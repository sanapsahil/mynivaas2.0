import { FraudCluster, FraudNode } from "./types";
import { normalizeText, roundTo } from "./utils";

function textSimilarity(a: string, b: string): number {
  const left = new Set(normalizeText(a).split(" ").filter(Boolean));
  const right = new Set(normalizeText(b).split(" ").filter(Boolean));

  if (left.size === 0 && right.size === 0) return 1;

  let intersection = 0;
  left.forEach((token) => {
    if (right.has(token)) intersection += 1;
  });

  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function buildEdgeReasons(a: FraudNode, b: FraudNode): string[] {
  const reasons: string[] = [];

  if (a.phone && b.phone && a.phone === b.phone) {
    reasons.push("Shared contact number");
  }

  if (a.imageHash && b.imageHash && a.imageHash === b.imageHash) {
    reasons.push("Shared image hash");
  }

  const titleSimilarity = textSimilarity(a.title, b.title);
  if (titleSimilarity >= 0.8) {
    reasons.push(`Similar listing text (${roundTo(titleSimilarity * 100, 0)}%)`);
  }

  const sameLocation = normalizeText(a.location) === normalizeText(b.location);
  const priceGapPct = Math.abs(a.price - b.price) / Math.max(a.price, b.price, 1);
  if (sameLocation && priceGapPct >= 0.12) {
    reasons.push("Same locality with significant price variance");
  }

  return reasons;
}

export function detectFraudClusters(nodes: FraudNode[]): FraudCluster[] {
  const visited = new Set<string>();
  const adjacency = new Map<string, Set<string>>();
  const reasonMap = new Map<string, string[]>();

  nodes.forEach((node) => adjacency.set(node.id, new Set<string>()));

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const reasons = buildEdgeReasons(a, b);
      if (reasons.length === 0) continue;

      const strongEvidence =
        reasons.includes("Shared contact number") ||
        reasons.includes("Shared image hash") ||
        (a.brokerId && b.brokerId && a.brokerId === b.brokerId);
      const weakEvidenceCount = reasons.filter(
        (reason) =>
          reason.startsWith("Similar listing text") ||
          reason === "Same locality with significant price variance"
      ).length;

      if (!strongEvidence && weakEvidenceCount < 2) continue;

      adjacency.get(a.id)?.add(b.id);
      adjacency.get(b.id)?.add(a.id);
      reasonMap.set(`${a.id}::${b.id}`, reasons);
      reasonMap.set(`${b.id}::${a.id}`, reasons);
    }
  }

  const clusters: FraudCluster[] = [];

  nodes.forEach((node) => {
    if (visited.has(node.id)) return;

    const stack = [node.id];
    const component: string[] = [];
    const collectedReasons: string[] = [];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      component.push(current);

      const neighbors = adjacency.get(current);
      neighbors?.forEach((neighbor) => {
        const reasons = reasonMap.get(`${current}::${neighbor}`) ?? [];
        collectedReasons.push(...reasons);
        if (!visited.has(neighbor)) stack.push(neighbor);
      });
    }

    if (component.length <= 1) return;

    const uniqueReasons = Array.from(new Set(collectedReasons));
    const strongSignals = uniqueReasons.filter(
      (reason) => reason === "Shared contact number" || reason === "Shared image hash"
    ).length;
    const weakSignals = uniqueReasons.length - strongSignals;
    const riskScore = Math.min(
      0.95,
      strongSignals * 0.38 + weakSignals * 0.12 + component.length * 0.08
    );

    clusters.push({
      clusterId: `cluster_${clusters.length + 1}`,
      listingIds: component,
      riskScore: roundTo(riskScore, 2),
      reasons: uniqueReasons,
    });
  });

  return clusters.sort((a, b) => b.riskScore - a.riskScore);
}
