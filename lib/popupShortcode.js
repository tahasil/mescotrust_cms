import { normalizeShortcodeText, parseShortcodeInput } from "@/lib/shortcode";

export function resolvePopupFormShortcode(rawShortcode) {
  const raw = String(rawShortcode || "").trim();
  if (!raw) {
    return {
      hasValue: false,
      isValid: false,
      shortcode: "",
    };
  }

  const parsed = parseShortcodeInput(raw);
  const normalizedValue =
    parsed?.isValidFormat && parsed?.targetKey
      ? normalizeShortcodeText(parsed.targetKey).toLowerCase()
      : "";

  return {
    hasValue: true,
    isValid: Boolean(normalizedValue),
    shortcode: normalizedValue,
  };
}
