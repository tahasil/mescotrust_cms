import { toText } from "@/lib/teamUtils";

/**
 * Sliders that currently support Team member mapping.
 * Keep this list explicit until each slider implements mapped member rendering.
 */
export const TEAM_MEMBER_MAPPABLE_SLIDERS = Object.freeze([
  "CustomSlider",
]);

export function isTeamMemberMappingSupported(componentId) {
  const id = toText(componentId);
  if (!id) return false;
  return TEAM_MEMBER_MAPPABLE_SLIDERS.includes(id);
}
