import { NegotiationInput, NegotiationOutput } from "./types";
import { clamp, roundTo } from "./utils";

function buildDefectBullets(input: NegotiationInput): string {
  if (input.defects.length === 0) {
    return "- Comparable inventory indicates room for a fair-price adjustment.";
  }

  return input.defects
    .map((defect) => `- ${defect.label}: ${defect.evidence}`)
    .join("\n");
}

export function draftCounterOffer(input: NegotiationInput): NegotiationOutput {
  const overpricedPct = clamp(
    ((input.listedPrice - input.fairPrice) / Math.max(input.listedPrice, 1)) * 100,
    0,
    25
  );

  const defectPenalty = input.defects.reduce((total, defect) => {
    if (defect.severity === "high") return total + 2.5;
    if (defect.severity === "medium") return total + 1.2;
    return total + 0.5;
  }, 0);

  const discountPct = clamp(roundTo(overpricedPct + defectPenalty, 2), 2, 28);
  const counterOfferPrice = Math.round(input.listedPrice * (1 - discountPct / 100));

  const buyerName = input.buyerName?.trim() || "Prospective Buyer";
  const emailSubject = `Counter-offer for ${input.propertyTitle}`;
  const emailBody = [
    `Hello,`,
    "",
    `Thank you for sharing details for ${input.propertyTitle}. After reviewing market comparables and property condition signals, I would like to submit a revised offer.`,
    "",
    "Key observations:",
    buildDefectBullets(input),
    "",
    `Listed price: ₹${input.listedPrice.toLocaleString("en-IN")}`,
    `Proposed counter-offer: ₹${counterOfferPrice.toLocaleString("en-IN")} (${discountPct}% below listed)`,
    "",
    "I am ready to proceed quickly if we can align near this value.",
    "",
    `Regards,`,
    buyerName,
  ].join("\n");

  return {
    counterOfferPrice,
    discountPct,
    emailSubject,
    emailBody,
  };
}
