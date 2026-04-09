import axios from "axios";

export interface SatelliteImageOptions {
  lat: number;
  lng: number;
  zoom?: number; // Default 17 (street level detail)
  width?: number; // Default 640
  height?: number; // Default 640
}

/**
 * Fetches satellite imagery from free tile servers.
 * Uses ESRI World Imagery (free, no API key required).
 */
export async function fetchSatelliteImage(
  options: SatelliteImageOptions
): Promise<Buffer | null> {
  try {
    const { lat, lng, zoom = 17, width = 640, height = 640 } = options;

    // Convert lat/lng to tile coordinates
    const tileCoords = latLngToTile(lat, lng, zoom);

    // ESRI World Imagery - free satellite tiles
    const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${tileCoords.y}/${tileCoords.x}`;

    const response = await axios.get(tileUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (response.status === 200 && response.data) {
      return Buffer.from(response.data);
    }

    return null;
  } catch (error) {
    console.error("Error fetching satellite image:", error);
    return null;
  }
}

/**
 * Fetches OpenStreetMap tiles (for road/traffic analysis).
 */
export async function fetchRoadmapImage(
  lat: number,
  lng: number,
  zoom: number = 17
): Promise<Buffer | null> {
  try {
    const tileCoords = latLngToTile(lat, lng, zoom);

    // OpenStreetMap standard tiles
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${tileCoords.x}/${tileCoords.y}.png`;

    const response = await axios.get(tileUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers: {
        "User-Agent": "PropertyCompare/1.0 (Real Estate App)",
      },
    });

    if (response.status === 200 && response.data) {
      return Buffer.from(response.data);
    }

    return null;
  } catch (error) {
    console.error("Error fetching roadmap image:", error);
    return null;
  }
}

/**
 * Converts lat/lng coordinates to tile coordinates for a given zoom level.
 */
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

/**
 * Fetches satellite images at different zoom levels for multi-scale analysis.
 */
export async function fetchMultiScaleSatelliteImages(
  lat: number,
  lng: number
): Promise<{ street: Buffer | null; neighborhood: Buffer | null }> {
  // Add small delays to respect rate limits
  const street = await fetchSatelliteImage({ lat, lng, zoom: 18 });
  await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
  const neighborhood = await fetchSatelliteImage({ lat, lng, zoom: 15 });

  return { street, neighborhood };
}
