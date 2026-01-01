// services/maps.ts
// Geocoding + routing helpers (Nominatim + OSRM)
// IMPORTANT: Nominatim requires a meaningful User-Agent (or Referer) header for client requests.
// In production you should proxy these requests through your own server and add caching/rate-limit handling.

export type Coords = { lat: number; lng: number; displayName?: string };

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const OSRM_BASE = "https://router.project-osrm.org";

/**
 * Helper: small delay
 */
function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Geocode an address using Nominatim.
 * - Adds a proper User-Agent and Accept header to avoid 403.
 * - Retries once on 429 (rate-limited) with a short backoff.
 */
export async function geocodeAddress(address: string): Promise<Coords> {
  if (!address || !address.trim()) {
    throw new Error("GEOCODE_INVALID_ADDRESS");
  }

  const encoded = encodeURIComponent(address);
  const url = `${NOMINATIM_BASE}/search?q=${encoded}&format=json&addressdetails=1&limit=1`;

  // Try up to 2 attempts (handle transient 429)
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      headers: {
        // REQUIRED: identify your app. Replace with a real contact in production per Nominatim policy.
        "User-Agent": "MOVE-App/1.0 (your-contact@example.com)",
        // Optionally include a Referer header in web contexts. Mobile apps should still set User-Agent.
        Accept: "application/json",
      },
    });

    if (res.status === 429) {
      // Rate limited — back off and retry once
      if (attempt === 0) {
        await wait(1000 + Math.random() * 500);
        continue;
      } else {
        throw new Error("GEOCODE_RATE_LIMITED");
      }
    }

    if (!res.ok) {
      throw new Error(`GEOCODE_NETWORK_ERROR: ${res.status}`);
    }

    const data = (await res.json()) as any[];
    if (!data || data.length === 0) {
      throw new Error("GEOCODE_NO_RESULTS");
    }

    const first = data[0];
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      displayName: first.display_name,
    };
  }

  throw new Error("GEOCODE_FAILED");
}

/**
 * Get a driving route between two coordinates using OSRM public demo server.
 * Returns distance in kilometers, duration in minutes, and an array of coordinates for the polyline.
 *
 * Note: OSRM demo server is public and may be rate-limited. For production consider self-hosting or using a paid routing provider.
 */
export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<{
  distanceKm: number;
  durationMin: number;
  coordinates: { latitude: number; longitude: number }[];
}> {
  if (!from || !to) throw new Error("ROUTE_INVALID_COORDS");

  const url = `${OSRM_BASE}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ROUTE_NETWORK_ERROR: ${res.status}`);
  }

  const data = await res.json();
  if (!data || !data.routes || data.routes.length === 0) {
    throw new Error("ROUTE_NO_RESULTS");
  }

  const route = data.routes[0];
  const distanceKm = typeof route.distance === "number" ? route.distance / 1000 : 0;
  const durationMin = typeof route.duration === "number" ? route.duration / 60 : 0;

  const coords = (route.geometry?.coordinates || []).map((pair: number[]) => ({
    latitude: pair[1],
    longitude: pair[0],
  }));

  return {
    distanceKm,
    durationMin,
    coordinates: coords,
  };
}