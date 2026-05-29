import {
  CORE_SLIDER_COMPONENT_IDS,
  CORE_SLIDER_LABELS,
} from "@/lib/sliderComponentRegistry";

export const SYSTEM_SLIDER_COMPONENT_IDS = CORE_SLIDER_COMPONENT_IDS;
export const SYSTEM_SLIDER_LABELS = CORE_SLIDER_LABELS;

export function deriveComponentId(displayName) {
  if (!displayName || typeof displayName !== "string") return "";
  let base = displayName.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
  if (!/^[a-zA-Z]/.test(base) && base.length) base = "C" + base;
  return base;
}
