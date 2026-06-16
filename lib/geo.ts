type IpInfoCoreResponse = {
  ip?: string;
  geo?: {
    city?: string;
    region?: string;
    region_code?: string;
    country?: string;
    country_code?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    postal_code?: string;
  };
  as?: {
    asn?: string;
    name?: string;
    domain?: string;
    type?: string;
  };
  is_anonymous?: boolean;
  is_anycast?: boolean;
  is_hosting?: boolean;
  is_mobile?: boolean;
  is_satellite?: boolean;
  error?: {
    title?: string;
    message?: string;
  };
};

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

function createFallbackGeo(fallback: {
  country?: string;
  region?: string;
  city?: string;
}): GeoLookupResult {
  return {
    country: fallback.country || "Unknown",
    region: fallback.region || "Unknown",
    city: fallback.city || "Unknown",
    latitude: null,
    longitude: null,
    timezone: "Unknown",
  };
}

async function lookupWithIpInfo(
  ip: string,
  fallbackGeo: GeoLookupResult
): Promise<GeoLookupResult | null> {
  const token = process.env.IPINFO_TOKEN;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.ipinfo.io/lookup/${ip}?token=${token}`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: IpInfoCoreResponse = await response.json();

    if (data.error) {
      return null;
    }

    const geo = data.geo;

    if (!geo) {
      return null;
    }

    return {
      country: geo.country || geo.country_code || fallbackGeo.country,
      region: geo.region || geo.region_code || fallbackGeo.region,
      city: geo.city || fallbackGeo.city,
      latitude:
        typeof geo.latitude === "number" ? geo.latitude : fallbackGeo.latitude,
      longitude:
        typeof geo.longitude === "number"
          ? geo.longitude
          : fallbackGeo.longitude,
      timezone: geo.timezone || fallbackGeo.timezone,
    };
  } catch {
    return null;
  }
}

async function lookupWithIpApi(
  ip: string,
  fallbackGeo: GeoLookupResult
): Promise<GeoLookupResult | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data: IpApiResponse = await response.json();

    if (data.error) {
      return null;
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
    return null;
  }
}

export async function lookupGeoByIp(
  ip: string,
  fallback: {
    country?: string;
    region?: string;
    city?: string;
  }
): Promise<GeoLookupResult> {
  const fallbackGeo = createFallbackGeo(fallback);

  if (isPrivateIp(ip)) {
    return fallbackGeo;
  }

  const ipInfoGeo = await lookupWithIpInfo(ip, fallbackGeo);

  if (ipInfoGeo) {
    return ipInfoGeo;
  }

  const ipApiGeo = await lookupWithIpApi(ip, fallbackGeo);

  if (ipApiGeo) {
    return ipApiGeo;
  }

  return fallbackGeo;
}