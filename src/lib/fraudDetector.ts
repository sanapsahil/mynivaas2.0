// Fraud detection module - checks for duplicate titles, suspicious keywords, and price anomalies

export interface FraudAnalysis {
  trustScore: number; // 0-100
  riskLevel: "low" | "medium" | "high";
  flags: string[];
  details: {
    titleDuplicate: boolean;
    suspiciousKeywords: string[];
    priceAnomaly: boolean;
  };
}

const SUSPICIOUS_KEYWORDS = [
  "urgent sale",
  "cheap deal",
  "no broker",
  "limited offer",
  "must sell",
  "immediate possession",
  "too good to be true",
  "below market",
  "fire sale",
];

function checkTitleDuplicate(title: string, otherTitles: string[] = []): boolean {
  if (otherTitles.length === 0) return false;

  const normalizeStr = (s: string) => s.toLowerCase().trim();
  const normalizedTitle = normalizeStr(title);

  for (const other of otherTitles) {
    const normalizedOther = normalizeStr(other);

    // Exact match
    if (normalizedTitle === normalizedOther) return true;

    // High similarity (>80%)
    const similarity = calculateSimilarity(normalizedTitle, normalizedOther);
    if (similarity > 0.8) return true;
  }

  return false;
}

function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;

  let matches = 0;
  for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
    if (str1[i] === str2[i]) matches++;
  }

  return matches / maxLen;
}

function detectSuspiciousKeywords(title: string, description: string = ""): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const found: string[] = [];

  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (text.includes(keyword)) {
      found.push(keyword);
    }
  }

  return found;
}

function detectPriceAnomaly(
  price: number,
  marketAverage: number | undefined,
  threshold = 0.4
): boolean {
  if (!marketAverage || marketAverage <= 0) return false;

  // Flag if price is significantly below market average
  const percentageDiff = (marketAverage - price) / marketAverage;
  return percentageDiff > threshold; // More than 40% below average
}

export function detectFraud(
  property: {
    id?: string;
    title: string;
    listedPrice: number;
    description?: string;
    location?: string;
  },
  options: {
    otherTitles?: string[];
    marketAverage?: number;
    priceAnomalyThreshold?: number;
  } = {}
): FraudAnalysis {
  let trustScore = 100;
  const flags: string[] = [];
  const details = {
    titleDuplicate: false,
    suspiciousKeywords: [] as string[],
    priceAnomaly: false,
  };

  // Check 1: Duplicate title detection
  const isDuplicate = checkTitleDuplicate(property.title, options.otherTitles);
  if (isDuplicate) {
    trustScore -= 25;
    flags.push("Duplicate or highly similar title found");
    details.titleDuplicate = true;
  }

  // Check 2: Suspicious keywords
  const suspiciousKeywords = detectSuspiciousKeywords(
    property.title,
    property.description || ""
  );
  if (suspiciousKeywords.length > 0) {
    trustScore -= 15 * Math.min(suspiciousKeywords.length, 3);
    flags.push(`Suspicious keywords detected: ${suspiciousKeywords.join(", ")}`);
    details.suspiciousKeywords = suspiciousKeywords;
  }

  // Check 3: Price anomaly
  const isPriceAnomaly = detectPriceAnomaly(
    property.listedPrice,
    options.marketAverage,
    options.priceAnomalyThreshold
  );
  if (isPriceAnomaly) {
    const priceDiff = Math.round(
      ((options.marketAverage! - property.listedPrice) / options.marketAverage!) * 100
    );
    trustScore -= 20;
    flags.push(`Price is ${priceDiff}% below market average`);
    details.priceAnomaly = true;
  }

  // Clamp trust score to 0-100
  trustScore = Math.max(0, Math.min(100, trustScore));

  // Determine risk level based on trust score
  let riskLevel: "low" | "medium" | "high";
  if (trustScore >= 80) {
    riskLevel = "low";
  } else if (trustScore >= 50) {
    riskLevel = "medium";
  } else {
    riskLevel = "high";
  }

  return {
    trustScore,
    riskLevel,
    flags,
    details,
  };
}
