import {
  CORE_POPUP_COMPONENT_IDS,
  CORE_POPUP_LABELS,
} from "@/lib/sliderComponentRegistry";

export const SYSTEM_POPUP_COMPONENT_IDS = CORE_POPUP_COMPONENT_IDS;
export const SYSTEM_POPUP_LABELS = CORE_POPUP_LABELS;

export function deriveComponentId(displayName) {
  if (!displayName || typeof displayName !== "string") return "";
  let base = displayName.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
  if (!/^[a-zA-Z]/.test(base) && base.length) base = "C" + base;
  return base;
}
