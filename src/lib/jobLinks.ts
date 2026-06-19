export const jobLinks = (name: string, city = "Hermosillo") => ({
  indeed: `https://mx.indeed.com/jobs?q=${encodeURIComponent(name)}&l=${encodeURIComponent(city)}`,
  computrabajo: `https://mx.computrabajo.com/empleos/?q=${encodeURIComponent(name)}&p=${encodeURIComponent(city)}`,
  google: `https://www.google.com/search?q=${encodeURIComponent(`${name} ${city} empleo`)}`,
});
