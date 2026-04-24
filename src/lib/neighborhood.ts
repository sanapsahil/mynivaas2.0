// Neighborhood analysis module - livability scoring and facilities detection

export interface Facility {
  name: string;
  type: string;
  distance: string;
  category: string;
}

export interface NeighborhoodReport {
  location: string;
  livabilityScore: number; // 0-100
  safetyRating: number; // 0-100
  summary: string;
  highlights: string[];
  facilities: Facility[];
  amenityScore: number; // 0-100
  infrastructureScore: number; // 0-100
}

// Mock facility data for common locations
const MOCK_FACILITIES = {
  schools: [
    { name: "St. Xavier's School", type: "Senior Secondary", distance: "0.5 km" },
    {
      name: "Happy Kids Montessori",
      type: "Nursery & Primary",
      distance: "0.8 km",
    },
    { name: "Delhi Public School", type: "CBSE", distance: "1.2 km" },
  ],
  hospitals: [
    { name: "Apollo Hospital", type: "Multi-specialty", distance: "0.3 km" },
    { name: "Max Healthcare", type: "Multi-specialty", distance: "1.0 km" },
    { name: "City Clinic", type: "General Practice", distance: "0.7 km" },
  ],
  shopping: [
    { name: "Central Market", type: "Shopping Complex", distance: "0.4 km" },
    { name: "Local Bazaar", type: "Street Market", distance: "0.2 km" },
    { name: "Mall of India", type: "Shopping Mall", distance: "2.5 km" },
  ],
  transport: [
    { name: "Metro Station (Blue Line)", type: "Metro", distance: "1.2 km" },
    { name: "Bus Stand", type: "Public Transport", distance: "0.5 km" },
    { name: "Taxi/Auto Service", type: "Local Transport", distance: "0.1 km" },
  ],
  recreation: [
    { name: "Central Park", type: "Public Park", distance: "0.6 km" },
    { name: "Gym & Fitness Club", type: "Health & Wellness", distance: "0.8 km" },
    { name: "Community Sports Complex", type: "Sports", distance: "1.5 km" },
  ],
  dining: [
    { name: "Fine Dining Restaurant", type: "Restaurant", distance: "0.5 km" },
    { name: "Cafe Street", type: "Cafes", distance: "0.3 km" },
    { name: "Food Court", type: "Quick Bites", distance: "0.4 km" },
  ],
};

function calculateLivabilityScore(location: string, data: any = {}): number {
  let score = 60; // Base score

  // Location-based heuristics
  const lowerLocation = location.toLowerCase();

  const premiumAreas = ["bandra", "delhivery", "south delhi", "pune"];
  const goodAreas = ["bangalore", "hyderabad", "gurgaon", "noida"];

  if (premiumAreas.some((area) => lowerLocation.includes(area))) {
    score += 20;
  } else if (goodAreas.some((area) => lowerLocation.includes(area))) {
    score += 10;
  }

  // Greenery impact
  if (data.greeneryIndex && data.greeneryIndex > 50) {
    score += 10;
  }

  // Traffic impact
  if (data.trafficCongestionIndex && data.trafficCongestionIndex < 50) {
    score += 5;
  } else if (data.trafficCongestionIndex && data.trafficCongestionIndex > 70) {
    score -= 10;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateSafetyRating(location: string): number {
  let score = 70; // Default moderate rating

  const lowerLocation = location.toLowerCase();

  // Location-based safety heuristics
  const safeAreas = [
    "residential",
    "gated community",
    "planned",
    "upscale",
  ];
  const riskyKeywords = ["slum", "congested", "unplanned"];

  if (safeAreas.some((area) => lowerLocation.includes(area))) {
    score += 15;
  }

  if (riskyKeywords.some((keyword) => lowerLocation.includes(keyword))) {
    score -= 20;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateAmenityScore(facilities: Facility[]): number {
  // Score based on facility diversity and proximity
  const categories = new Set(facilities.map((f) => f.category));
  const baseScore = 50 + categories.size * 5;

  // Proximity bonus: count facilities within 1 km
  const nearbyCount = facilities.filter((f) => {
    const distanceMatch = f.distance.match(/[\d.]+/);
    if (!distanceMatch) return false;
    const distanceNum = parseFloat(distanceMatch[0]);
    return distanceNum <= 1;
  }).length;

  return Math.min(100, baseScore + nearbyCount * 3);
}

function calculateInfrastructureScore(facilities: Facility[]): number {
  // Score based on transport and utility facilities
  const transportFacilities = facilities.filter(
    (f) => f.category === "transport"
  );
  const utilities = facilities.filter(
    (f) => f.category === "shopping" || f.category === "hospitals"
  );

  const score = 50 + transportFacilities.length * 10 + utilities.length * 5;
  return Math.min(100, score);
}

export function generateNeighborhoodReport(
  location: string,
  additionalData: any = {}
): NeighborhoodReport {
  // Aggregate mock facilities from all categories
  const allFacilities: Facility[] = [];

  for (const [category, facilities] of Object.entries(MOCK_FACILITIES)) {
    for (const facility of facilities as any[]) {
      allFacilities.push({
        ...facility,
        category,
      });
    }
  }

  const livabilityScore = calculateLivabilityScore(location, additionalData);
  const safetyRating = calculateSafetyRating(location);
  const amenityScore = calculateAmenityScore(allFacilities);
  const infrastructureScore = calculateInfrastructureScore(allFacilities);

  // Generate highlights based on scores
  const highlights: string[] = [];

  if (safetyRating >= 75) {
    highlights.push("Safe and secure neighborhood");
  }
  if (amenityScore >= 75) {
    highlights.push("Well-equipped with amenities");
  }
  if (
    allFacilities.filter((f) => f.category === "transport").length >= 2
  ) {
    highlights.push("Excellent public transport connectivity");
  }
  if (livabilityScore >= 75) {
    highlights.push("High livability quotient");
  }

  // Generate summary
  const summary = `${location} is a ${
    livabilityScore >= 75 ? "highly livable" : "moderately developed"
  } neighborhood with good access to schools, hospitals, and shopping centers. The area has a safety rating of ${safetyRating}/100 and scores ${livabilityScore}/100 on livability. Public transport options and recreational facilities are ${
    infrastructureScore >= 70 ? "well-developed" : "adequate"
  }.`;

  return {
    location,
    livabilityScore,
    safetyRating,
    summary,
    highlights,
    facilities: allFacilities,
    amenityScore,
    infrastructureScore,
  };
}
