export interface PropertyScore {
  modernity: number; // 1-10
  wearAndTear: number; // 1-10 (10 = pristine, 1 = poor condition)
  lighting: number; // 1-10
  overall: number; // 1-10 average
}

export interface LocationIndices {
  greeneryIndex: number; // 0-100 (% of green coverage)
  trafficCongestionIndex: number; // 0-100 (0 = no traffic, 100 = heavy congestion)
}

export interface Property {
  id: string;
  title: string;
  price: number;
  priceFormatted: string;
  location: string;
  address?: string;
  type: string;
  bedrooms?: string;
  bathrooms?: string;
  area?: string;
  furnishing?: string;
  source: string;
  sourceIcon?: string;
  link: string;
  description?: string;
  imageUrl?: string;
  postedDate?: string;
  lat?: number;
  lng?: number;
  conditionScore?: PropertyScore; // CNN-based condition scoring
  locationIndices?: LocationIndices; // ViT-based satellite analysis
  // Indicates this is aggregated data from search results - actual prices may vary
  isAggregated?: boolean;
}

export interface SearchParams {
  location: string;
  propertyType: string;
  listingType: string;
  bhk?: string;
}

// ─── Price helpers ───

function normalizePrice(priceStr: string): number {
  if (!priceStr) return Infinity;
  let cleaned = priceStr.replace(/[₹$]/g, "").replace(/Rs\.?/i, "").replace(/INR/i, "").trim();

  const crMatch = cleaned.match(/([\d,.]+)\s*(?:Cr|Crore)/i);
  if (crMatch) return parseFloat(crMatch[1].replace(/,/g, "")) * 10000000;

  const lacMatch = cleaned.match(/([\d,.]+)\s*(?:Lac|Lakh|L)(?!\w)/i);
  if (lacMatch) return parseFloat(lacMatch[1].replace(/,/g, "")) * 100000;

  const kMatch = cleaned.match(/([\d,.]+)\s*K(?!\w)/i);
  if (kMatch) return parseFloat(kMatch[1].replace(/,/g, "")) * 1000;

  cleaned = cleaned.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? Infinity : num;
}

function formatPrice(value: number): string {
  if (value >= 10000000) {
    const cr = value / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    const lac = value / 100000;
    return `₹${lac % 1 === 0 ? lac.toFixed(0) : lac.toFixed(2)} Lac`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

function isRealisticPrice(value: number, listingType: string): boolean {
  if (value <= 0 || value === Infinity) return false;
  if (listingType === "rent" || listingType === "pg") return value >= 2000 && value <= 5000000;
  return value >= 100000 && value <= 5000000000;
}

// ─── Source helpers ───

const SOURCE_MAP: Record<string, { name: string; color: string }> = {
  "99acres.com": { name: "99acres", color: "#d63031" },
  "magicbricks.com": { name: "MagicBricks", color: "#e74c3c" },
  "housing.com": { name: "Housing.com", color: "#ff6b35" },
  "nobroker.com": { name: "NoBroker", color: "#e53935" },
  "nobroker.in": { name: "NoBroker", color: "#e53935" },
  "commonfloor.com": { name: "CommonFloor", color: "#3498db" },
  "makaan.com": { name: "Makaan", color: "#8e44ad" },
  "squareyards.com": { name: "Square Yards", color: "#27ae60" },
  "nestaway.com": { name: "Nestaway", color: "#f39c12" },
  "proptiger.com": { name: "PropTiger", color: "#1abc9c" },
  "quikr.com": { name: "Quikr Homes", color: "#2c3e50" },
  "olx.in": { name: "OLX", color: "#009688" },
};

function getSource(url: string): { name: string; color: string } {
  try {
    const h = new URL(url).hostname.replace("www.", "");
    return SOURCE_MAP[h] || { name: h, color: "#64748b" };
  } catch {
    return { name: "Unknown", color: "#64748b" };
  }
}

// ─── Extract property name from title/snippet ───

function extractPropertyName(text: string, location: string): string | null {
  // Look for building/society names - typically capitalized words with common suffixes
  const patterns = [
    // Heights, Towers, Apartments, Society, etc.
    /([A-Z][a-zA-Z\s]+(?:Heights|Tower|Towers|Apartment|Apartments|Society|Residency|Enclave|Complex|Park|Villa|Villas|Garden|Gardens|Plaza|Court|House|Nagar|Colony|Layout|Phase))/,
    // Names in quotes
    /"([^"]+)"/,
    // Names after "in" or "at"
    /(?:in|at)\s+([A-Z][a-zA-Z\s]{3,30}?)(?:,|\.|$|\s+for|\s+near)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Skip if it's just the location name
      if (name.toLowerCase() !== location.toLowerCase() && name.length > 3) {
        return name;
      }
    }
  }
  return null;
}

// ─── Extract area/locality from text ───

function extractLocality(text: string, mainLocation: string): string {
  // Look for sector, locality patterns
  const sectorMatch = text.match(/Sector[\s-]*(\d+[A-Z]?)/i);
  if (sectorMatch) return `Sector ${sectorMatch[1]}, ${mainLocation}`;

  // Look for locality names
  const localityPatterns = [
    /(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*(?:,|$)/,
    /,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*,/,
  ];

  for (const pattern of localityPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 3) {
      return `${match[1]}, ${mainLocation}`;
    }
  }

  return mainLocation;
}

// ─── Build search queries - multiple variations for better coverage ───

const SITES = [
  "99acres.com",
  "magicbricks.com",
  "housing.com",
  "nobroker.in",
  "makaan.com",
  "squareyards.com",
];

function buildQueries(p: SearchParams): string[] {
  const bhk = p.bhk && p.bhk !== "any" ? `${p.bhk} BHK` : "";
  const type = p.propertyType === "plot" ? "plot" : p.propertyType === "house" ? "house" : p.propertyType;

  // Define action and exclusion terms based on listing type
  let action: string;
  let exclude: string;

  if (p.listingType === "buy") {
    action = "for sale";
    exclude = '-"for rent" -"rental" -"per month" -"/month"';
  } else if (p.listingType === "rent") {
    action = "for rent";
    exclude = '-"for sale" -"resale" -"new launch"';
  } else {
    action = "PG paying guest";
    exclude = '-"for sale"';
  }

  const queries: string[] = [];

  // Query 1: Site-specific searches for each platform with listing type filter
  for (const site of SITES) {
    queries.push(`site:${site} ${bhk} ${type} ${action} ${p.location} ${exclude}`);
  }

  // Query 2: General search with listing type and price indicators
  if (p.listingType === "buy") {
    queries.push(`${bhk} ${type} for sale ${p.location} "Lac" OR "Cr" ${exclude}`);
  } else {
    queries.push(`${bhk} ${type} for rent ${p.location} "per month" OR "₹" ${exclude}`);
  }

  // Query 3: Search targeting individual listing URLs with proper action
  queries.push(`intitle:"${bhk}" intitle:"${p.location}" ${action} price site:99acres.com OR site:housing.com OR site:magicbricks.com ${exclude}`);

  return queries;
}

// ─── Parse individual listings from search results ───

interface RawResult {
  title: string;
  link: string;
  snippet?: string;
  rich_snippet?: {
    top?: { detected_extensions?: Record<string, string> };
    bottom?: { detected_extensions?: Record<string, string> };
  };
  favicon?: string;
  thumbnail?: string;
  date?: string;
  position?: number;
}

function isAggregateResult(title: string, snippet: string): boolean {
  const combined = `${title} ${snippet}`.toLowerCase();
  // Skip results that are clearly aggregate/listing pages, not individual properties
  const aggregatePatterns = [
    /\d{2,}\+?\s*(?:properties|flats|apartments|results|listings)/i,
    /(?:search|find|browse)\s+(?:properties|flats|apartments)/i,
    /(?:property|flat|apartment)\s+(?:search|finder|listing)/i,
    /top\s+\d+\s+(?:properties|flats)/i,
  ];
  return aggregatePatterns.some(p => p.test(combined));
}

// ─── Check if result matches the requested listing type ───

function matchesListingType(text: string, listingType: string): boolean {
  const lower = text.toLowerCase();

  if (listingType === "buy") {
    // For "buy", exclude results that are clearly for rent or PG
    const isRentListing = /\bfor\s+rent\b|\brent(al|ed|ing)?\b|\bto\s+let\b|\bpg\b|\bpaying\s*guest\b|\bper\s*month\b|\/\s*month\b|p\.?m\.?\b/i.test(lower);
    const isSaleListing = /\bfor\s+sale\b|\bsale\b|\bbuy\b|\bpurchase\b|\bresale\b|\bnew\s+launch\b|\bunder\s+construction\b|\bready\s+to\s+move\b/i.test(lower);

    // If it's clearly a rent listing, reject it
    if (isRentListing && !isSaleListing) return false;
    // If it mentions sale or doesn't mention rent, accept it
    return true;
  }

  if (listingType === "rent") {
    // For "rent", exclude results that are clearly for sale
    const isSaleListing = /\bfor\s+sale\b|\bbuy\b|\bpurchase\b|\bresale\b|\bnew\s+launch\b|\bunder\s+construction\b/i.test(lower);
    const isRentListing = /\bfor\s+rent\b|\brental?\b|\bto\s+let\b|\bper\s*month\b|\/\s*month\b|p\.?m\.?\b|\blease\b/i.test(lower);

    // If it's clearly a sale listing, reject it
    if (isSaleListing && !isRentListing) return false;
    return true;
  }

  if (listingType === "pg") {
    // For PG, look for PG-specific terms
    const isPGListing = /\bpg\b|\bpaying\s*guest\b|\bhostel\b|\bshared\s+room\b|\bco-?living\b/i.test(lower);
    const isSaleListing = /\bfor\s+sale\b|\bbuy\b|\bpurchase\b/i.test(lower);

    // Reject sale listings for PG search
    if (isSaleListing) return false;
    return true;
  }

  return true;
}

function parseResultToProperties(
  result: RawResult,
  params: SearchParams,
  seenKeys: Set<string>
): Property[] {
  const properties: Property[] = [];
  const { title, link, snippet = "", rich_snippet, favicon, thumbnail, date } = result;
  const combined = `${title} ${snippet}`;
  const source = getSource(link);

  // Skip aggregate/search result pages
  if (isAggregateResult(title, snippet)) {
    return [];
  }

  // Skip if result doesn't match the requested listing type (buy/rent/pg)
  if (!matchesListingType(combined, params.listingType)) {
    return [];
  }

  // Skip if not from a real estate site
  const isRealEstateSite = SITES.some(s => link.includes(s.replace("www.", "")));
  if (!isRealEstateSite) {
    // Allow if it contains clear price info
    if (!combined.match(/₹\s*[\d,]+|Rs\.?\s*[\d,]+/i)) {
      return [];
    }
  }

  // Extract all prices from the combined text
  const priceRegex = /(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*(?:Lac|Lakh|L|Cr|Crore|K)?(?:\s*(?:\/\s*month|per\s*month|p\.m\.?|PM))?/gi;
  const prices: { value: number; raw: string; index: number }[] = [];
  let match;

  while ((match = priceRegex.exec(combined)) !== null) {
    const value = normalizePrice(match[0]);
    // Skip if it looks like a count (810+ apartments)
    const afterIdx = match.index + match[0].length;
    if (afterIdx < combined.length && combined[afterIdx] === "+") continue;
    // Skip deposit mentions
    const before = combined.slice(Math.max(0, match.index - 15), match.index);
    if (/deposit|security|maintenance/i.test(before)) continue;

    if (isRealisticPrice(value, params.listingType)) {
      prices.push({ value, raw: match[0], index: match.index });
    }
  }

  if (prices.length === 0) return [];

  // Use only the first (typically primary) price for this listing
  const price = prices[0].value;

  // Create unique key - use link URL as primary dedup key
  const urlKey = link.replace(/[?#].*$/, "").toLowerCase();
  if (seenKeys.has(urlKey)) return [];
  seenKeys.add(urlKey);

  // USE ACTUAL TITLE FROM SEARCH RESULT - just clean up the source suffix
  // This ensures the title matches what the user will see when they click
  let propertyTitle = title
    .replace(/\s*[-|–]\s*(99acres|MagicBricks|Housing\.com|NoBroker|Makaan|Square\s*Yards|CommonFloor|Quikr|Property|Properties).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // If title is too short after cleaning, keep the original
  if (propertyTitle.length < 10) {
    propertyTitle = title.replace(/\s*[-|–].*$/, "").trim();
  }

  // Truncate if too long
  if (propertyTitle.length > 100) {
    propertyTitle = propertyTitle.slice(0, 97) + "...";
  }

  // Extract metadata from combined text
  const bhkMatch = combined.match(/(\d)\s*BHK/i);
  const areaMatch = combined.match(/([\d,]+)\s*(?:sq\.?\s*ft|sqft|sft)/i);
  const bathMatch = combined.match(/(\d)\s*(?:bath(?:room)?s?|toilet)/i);
  const furnishMatch = combined.match(/((?:un|semi[\s-]?)?furnished)/i);

  // Extract locality for location field
  const locality = extractLocality(combined, params.location);

  const property: Property = {
    id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: propertyTitle,
    price,
    priceFormatted: formatPrice(price),
    location: locality,
    address: snippet.length > 20 ? snippet.match(/(?:at|in|near)\s+([^,\n.]+)/i)?.[1] : undefined,
    type: params.propertyType,
    bedrooms: bhkMatch ? `${bhkMatch[1]} BHK` : (params.bhk !== "any" ? `${params.bhk} BHK` : undefined),
    bathrooms: bathMatch ? `${bathMatch[1]} Bath` : undefined,
    area: areaMatch ? areaMatch[0].replace(/\s+/g, " ") : undefined,
    furnishing: furnishMatch ? furnishMatch[1] : undefined,
    source: source.name,
    sourceIcon: favicon,
    link,
    description: snippet.length > 20 ? snippet.slice(0, 200) + (snippet.length > 200 ? "..." : "") : undefined,
    imageUrl: thumbnail,
    postedDate: date,
    // Mark as aggregated - prices are from search snippets and may not match actual listing
    isAggregated: true,
  };

  properties.push(property);
  return properties;
}

// ─── Main search function ───

export async function searchProperties(params: SearchParams): Promise<Property[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY environment variable not set");

  const queries = buildQueries(params);
  const all: Property[] = [];
  const seenKeys = new Set<string>();

  // Fetch all queries in parallel
  const responses = await Promise.all(
    queries.map(async (q) => {
      try {
        const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&api_key=${apiKey}&num=20&gl=in&hl=en`;
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    })
  );

  for (const data of responses) {
    if (!data?.organic_results) continue;

    for (const result of data.organic_results) {
      const properties = parseResultToProperties(result, params, seenKeys);
      all.push(...properties);
    }
  }

  // Sort by price (lowest first)
  all.sort((a, b) => a.price - b.price);

  return all;
}
