export const jobLinks = (name: string, city = "Hermosillo") => ({
  indeed: `https://mx.indeed.com/jobs?q=${encodeURIComponent(name)}&l=${encodeURIComponent(city)}`,
  computrabajo: `https://mx.computrabajo.com/empleos/?q=${encodeURIComponent(name)}&p=${encodeURIComponent(city)}`,
  linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(name)}&location=${encodeURIComponent(`${city}, Mexico`)}`,
  google: `https://www.google.com/search?q=${encodeURIComponent(`${name} ${city} empleo`)}`,
});

/** Pin at exact employer coordinates — satellite & Street View available in Google Maps. */
export function googleMapsUrl(lat: number, lng: number, label?: string): string {
  const coords = `${lat},${lng}`;
  const q = label ? `${label}@${coords}` : coords;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=18`;
}
