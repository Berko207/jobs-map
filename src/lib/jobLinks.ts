const CITY_WHERE: Record<string, string> = {
  Hermosillo: "Hermosillo, Sonora",
  Monterrey: "Monterrey, Nuevo León",
  Guadalajara: "Guadalajara, Jalisco",
  Tijuana: "Tijuana, Baja California",
  "Ciudad de México": "Ciudad de México",
  Querétaro: "Querétaro",
};

/** Drop zone notes and pick one name from "Short / Longer name". */
export function employerSearchName(name: string): string {
  let cleaned = name.replace(/\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.includes(" / ")) {
    const parts = cleaned
      .split(" / ")
      .map((part) => part.trim())
      .filter(Boolean);
    cleaned = parts.sort((a, b) => b.length - a.length)[0] ?? cleaned;
  }
  return cleaned;
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const jobLinks = (name: string, city = "Hermosillo") => {
  const employer = employerSearchName(name);
  const where = CITY_WHERE[city] ?? `${city}, Mexico`;
  // Homepage search, not /jobs. The jobs search is location-gated and
  // returns a thin list. Logged-out visitors sign in, then land here.
  const linkedin = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${employer} ${city}`)}&origin=GLOBAL_SEARCH_HEADER`;
  const employerSlug = slug(employer);
  const citySlug = slug(city);
  const computrabajo =
    employerSlug && citySlug
      ? `https://mx.computrabajo.com/trabajo-de-${employerSlug}-en-${citySlug}`
      : `https://mx.computrabajo.com/empleos-en-${citySlug || "hermosillo"}`;

  return {
    indeed: `https://mx.indeed.com/jobs?q=${encodeURIComponent(employer)}&l=${encodeURIComponent(where)}`,
    computrabajo,
    linkedin,
    google: `https://www.google.com/search?q=${encodeURIComponent(`${employer} ${city} empleo`)}`,
  };
};

/** Pin at exact employer coordinates — satellite & Street View available in Google Maps. */
export function googleMapsUrl(lat: number, lng: number, label?: string): string {
  const coords = `${lat},${lng}`;
  const q = label ? `${label}@${coords}` : coords;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=18`;
}
