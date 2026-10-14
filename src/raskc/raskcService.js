const GEOCODE_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";
const RASKC_API_URL = "https://api.kingcounty.gov/kcgisapi/v1/raskcinfobylatlon";
const RASKC_AGENCY = "Regional Animal Services of King County (RASKC)";

export function chooseAddressCandidate(candidates = []) {
  const candidate = [...candidates].sort((left, right) => (right.score ?? 0) - (left.score ?? 0))[0];
  if (!candidate?.location || (candidate.score ?? 0) < 80) {
    throw new Error("King County could not confidently locate that address. Check the street, city, state, and ZIP.");
  }
  return candidate;
}

export function normalizeProviderResponse(payload) {
  const record = Array.isArray(payload) ? payload[0] : payload;
  if (!record?.Agency) {
    return { isRaskc: false, provider: "", city: "", website: "", outsideKingCounty: true };
  }

  return {
    isRaskc: record.Agency === RASKC_AGENCY,
    provider: record.Agency,
    city: record.CityName ?? "",
    website: record.Weblink_ePet ? `https://${record.Weblink_ePet.replace(/^https?:\/\//, "")}` : "",
    outsideKingCounty: false
  };
}

export async function checkRaskcProvider(address) {
  const geocodeParameters = new URLSearchParams({
    SingleLine: address,
    f: "json",
    outFields: "Addr_type",
    forStorage: "false"
  });
  const geocodeResponse = await fetch(`${GEOCODE_URL}?${geocodeParameters}`);
  if (!geocodeResponse.ok) throw new Error("The address lookup is temporarily unavailable.");

  const geocodeData = await geocodeResponse.json();
  const candidate = chooseAddressCandidate(geocodeData.candidates);
  const providerParameters = new URLSearchParams({
    lat: String(Math.round(candidate.location.y * 10000000) / 10000000),
    lon: String(Math.round(candidate.location.x * 10000000) / 10000000)
  });
  const providerResponse = await fetch(`${RASKC_API_URL}?${providerParameters}`);
  if (!providerResponse.ok) throw new Error("King County's licensing-provider lookup is temporarily unavailable.");

  return normalizeProviderResponse(await providerResponse.json());
}
