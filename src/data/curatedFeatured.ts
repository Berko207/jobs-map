import type { Company } from "./types";
import curated from "./curatedFeatured.json";

/** Hand-picked Hermosillo employers — coords and metadata are authoritative. */
export const CURATED_FEATURED = curated as (Omit<Company, "source"> & {
  featured: true;
})[];
