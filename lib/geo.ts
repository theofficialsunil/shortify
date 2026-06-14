type IpApiResponse = {
  ip?: string;
  city?: string;
  region?: string;
  country_name?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  error?: boolean;
  reason?: string;
};

export type GeoLookupResult = {
  country: string;
  region: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
};

function isPrivateIp(ip: string) {
  return (
    ip === "unknown" ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

export async function lookupGeoByIp(
  ip: string,
  fallback: {
    country?: string;
    region?: string;
    city?: string;
  }
): Promise<GeoLookupResult> {
  const fallbackGeo: GeoLookupResult = {
    country: fallback.country || "Unknown",
    region: fallback.region || "Unknown",
    city: fallback.city || "Unknown",
    latitude: null,
    longitude: null,
    timezone: "Unknown",
  };

  if (isPrivateIp(ip)) {
    return fallbackGeo;
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return fallbackGeo;
    }

    const data: IpApiResponse = await response.json();

    if (data.error) {
      return fallbackGeo;
    }

    return {
      country: data.country_name || data.country_code || fallbackGeo.country,
      region: data.region || fallbackGeo.region,
      city: data.city || fallbackGeo.city,
      latitude:
        typeof data.latitude === "number" ? data.latitude : fallbackGeo.latitude,
      longitude:
        typeof data.longitude === "number"
          ? data.longitude
          : fallbackGeo.longitude,
      timezone: data.timezone || fallbackGeo.timezone,
    };
  } catch {
    return fallbackGeo;
  }
}