/**
 * Server-only: read current SITE_COMPONENT_IDS from disk (includes newly created components without restart).
 * Import only from API routes and getLayoutData – do not import from client components.
 */
import { readFileSync } from "fs";
import path from "path";

const DEFAULT_IDS = ["Header", "Footer", "HomeHero", "Marquee", "Subscribe"];

export function getRegistryIdsFromDisk() {
  try {
    const registryPath = path.join(process.cwd(), "lib", "siteComponentRegistry.js");
    const content = readFileSync(registryPath, "utf8");
    const arrayMatch = content.match(/SITE_COMPONENT_IDS\s*=\s*\[([^\]]*)\]/);
    if (!arrayMatch) return [...DEFAULT_IDS];
    return arrayMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  } catch {
    return [...DEFAULT_IDS];
  }
}
