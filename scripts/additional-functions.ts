// allows us to use $ as shorthand for document.getElementById
export const $ = (id: string) => document.getElementById(id);

export function normalize(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Extract year from release date string
 */
export function extractYear(releaseDate?: string): string {
  if (!releaseDate) return "Unknown";
  return new Date(releaseDate).getFullYear().toString();
}