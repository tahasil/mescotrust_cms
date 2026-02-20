import slugifyLib from "slugify";

export const RESERVED_SLUGS = [
  "admin",
  "blog",
  "contact",
  "search",
  "api",
  "preview",
  "_next",
  "login",
  "auth",
  "sitemap.xml",
  "robots.txt",
];

export function toSlug(value: string): string {
  return slugifyLib(value, { lower: true, strict: true });
}

export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length === 0) return false;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false;
  if (RESERVED_SLUGS.includes(slug.toLowerCase())) return false;
  return true;
}
