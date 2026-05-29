import { toText } from "@/lib/portfolioUtils";

/**
 * Sliders that currently support Portfolio item mapping.
 * Keep this list explicit until each slider implements mapped item rendering.
 */
export const PORTFOLIO_ITEM_MAPPABLE_SLIDERS = Object.freeze([
  "CustomSlider",
]);

export function isPortfolioItemMappingSupported(componentId) {
  const id = toText(componentId);
  if (!id) return false;
  return PORTFOLIO_ITEM_MAPPABLE_SLIDERS.includes(id);
}

