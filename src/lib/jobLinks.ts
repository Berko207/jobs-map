export const jobLinks = (name: string) => ({
  indeed: `https://mx.indeed.com/jobs?q=${encodeURIComponent(name)}&l=Hermosillo`,
  computrabajo: `https://mx.computrabajo.com/empleos/?q=${encodeURIComponent(name)}&p=Hermosillo`,
  google: `https://www.google.com/search?q=${encodeURIComponent(name + " Hermosillo empleo")}`,
});
