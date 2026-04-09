export interface Coordinates {
  lat: number;
  lng: number;
}

// Geocode a location string using OpenStreetMap Nominatim (free, no API key)
export async function geocodeLocation(location: string): Promise<Coordinates | null> {
  try {
    const q = encodeURIComponent(location + ", India");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "User-Agent": "PropertyCompare/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// Scatter property coordinates around a center point so markers don't overlap.
// Uses a deterministic seed based on property index + price for consistency.
export function scatterCoordinates(
  center: Coordinates,
  count: number,
  radiusKm: number = 3
): Coordinates[] {
  const coords: Coordinates[] = [];
  // ~0.009 degrees latitude ≈ 1 km
  const radiusDeg = radiusKm * 0.009;

  for (let i = 0; i < count; i++) {
    // Golden angle spiral for even distribution
    const angle = i * 2.399963; // golden angle in radians
    const r = radiusDeg * Math.sqrt((i + 1) / count);
    coords.push({
      lat: center.lat + r * Math.cos(angle),
      lng: center.lng + r * Math.sin(angle) / Math.cos(center.lat * Math.PI / 180),
    });
  }

  return coords;
}
