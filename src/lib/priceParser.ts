/**
 * Robust Indian price parsing and formatting utilities
 * Handles: ₹2.5 Cr, ₹250 Lac, ₹45,00,000, ₹2.3 Cr - ₹3.1 Cr, etc.
 */

/**
 * Parse Indian currency price string to numeric value
 *
 * Handles formats:
 * - ₹2.5 Cr / Crore
 * - ₹250 Lac / Lakh
 * - ₹45,00,000 (Indian numbering system)
 * - ₹4500000 (plain numbers)
 * - ₹2.3 Cr - ₹3.1 Cr (ranges - takes lower bound)
 *
 * @param priceStr - Raw price string
 * @returns Numeric price in INR, or Infinity if unparseable
 */
export function parseIndianPrice(priceStr: string): number {
  if (!priceStr || typeof priceStr !== "string") {
    console.warn("Invalid price string:", priceStr);
    return Infinity;
  }

  // Trim and normalize
  let cleaned = priceStr.trim();

  // Handle range prices - extract first (lower) value
  // "₹2.8 Cr - ₹3.2 Cr" → "₹2.8 Cr"
  const rangeMatch = cleaned.match(/(₹?[^-]*)/);
  if (rangeMatch) {
    cleaned = rangeMatch[1].trim();
  }

  // Remove currency symbols and abbreviations
  cleaned = cleaned
    .replace(/[₹$]/g, "")
    .replace(/Rs\.?/gi, "")
    .replace(/INR/gi, "")
    .trim();

  // Handle Crore/Cr
  const crMatch = cleaned.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:crore|cr)(?!\w)/i);
  if (crMatch) {
    const num = parseFloat(crMatch[1].replace(/,/g, ""));
    if (!isNaN(num)) {
      const result = num * 10000000; // 1 Cr = 1,00,00,000
      console.log(`[Price Parse] "${priceStr}" → ${crMatch[1]} Cr → ₹${result.toLocaleString("en-IN")}`);
      return result;
    }
  }

  // Handle Lakh/Lac
  const lakhMatch = cleaned.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:lakh|lac)(?!\w)/i);
  if (lakhMatch) {
    const num = parseFloat(lakhMatch[1].replace(/,/g, ""));
    if (!isNaN(num)) {
      const result = num * 100000; // 1 Lac = 1,00,000
      console.log(`[Price Parse] "${priceStr}" → ${lakhMatch[1]} Lac → ₹${result.toLocaleString("en-IN")}`);
      return result;
    }
  }

  // Handle K (thousands)
  const kMatch = cleaned.match(/([\d,]+(?:\.\d{1,2})?)\s*K(?!\w)/i);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(/,/g, ""));
    if (!isNaN(num)) {
      const result = num * 1000;
      console.log(`[Price Parse] "${priceStr}" → ${kMatch[1]} K → ₹${result.toLocaleString("en-IN")}`);
      return result;
    }
  }

  // Handle plain numbers (remove all non-numeric chars except decimal point)
  const plainMatch = cleaned.replace(/[^0-9.]/g, "");
  const num = parseFloat(plainMatch);

  if (!isNaN(num) && num > 0) {
    console.log(`[Price Parse] "${priceStr}" → ₹${num.toLocaleString("en-IN")}`);
    return num;
  }

  console.warn(`[Price Parse] Failed to parse: "${priceStr}"`);
  return Infinity;
}

/**
 * Format numeric price to human-readable Indian currency
 *
 * Examples:
 * - 28900000 → ₹2.89 Cr
 * - 350000 → ₹3.5 Lac
 * - 45000 → ₹45,000
 *
 * @param value - Numeric price in INR
 * @returns Formatted price string
 */
export function formatIndianPrice(value: number): string {
  if (!isFinite(value) || value <= 0) {
    return "₹0";
  }

  // >= 1 Crore
  if (value >= 10000000) {
    const cr = value / 10000000;
    // Show 2 decimals for values < 10, 1 decimal for >= 10
    const formatted = cr < 10 ? cr.toFixed(2) : cr < 100 ? cr.toFixed(1) : cr.toFixed(0);
    return `₹${formatted.replace(/\.?0+$/, "")} Cr`;
  }

  // >= 1 Lakh
  if (value >= 100000) {
    const lac = value / 100000;
    // Show 2 decimals for values < 10, 1 decimal for >= 10
    const formatted = lac < 10 ? lac.toFixed(2) : lac < 100 ? lac.toFixed(1) : lac.toFixed(0);
    return `₹${formatted.replace(/\.?0+$/, "")} Lac`;
  }

  // Plain number with Indian formatting
  return `₹${value.toLocaleString("en-IN")}`;
}

/**
 * Validate if price seems realistic for the listing type
 *
 * @param value - Numeric price in INR
 * @param listingType - "buy" | "rent" | "pg"
 * @returns true if price is realistic
 */
export function isRealisticPrice(value: number, listingType: string): boolean {
  if (!isFinite(value) || value <= 0) return false;

  switch (listingType) {
    case "rent":
    case "pg":
      // Rent: ₹2,000 to ₹50,00,000 per month
      return value >= 2000 && value <= 5000000;

    case "buy":
    default:
      // Buy: ₹1,00,000 to ₹500 Crores
      return value >= 100000 && value <= 5000000000;
  }
}

/**
 * Validate price and log warnings for suspicious values
 *
 * @param value - Numeric price in INR
 * @param priceString - Original price string (for logging)
 * @param listingType - Listing type for context
 */
export function validatePrice(
  value: number,
  priceString: string,
  listingType: string = "buy"
): void {
  if (value < 100000 && listingType === "buy") {
    console.warn(
      `[Price Validation] Suspiciously low price detected for "${listingType}": "${priceString}" → ₹${value.toLocaleString("en-IN")}`
    );
  }

  if (!isRealisticPrice(value, listingType)) {
    console.warn(
      `[Price Validation] Price out of range for "${listingType}": "${priceString}" → ₹${value.toLocaleString("en-IN")}`
    );
  }
}
