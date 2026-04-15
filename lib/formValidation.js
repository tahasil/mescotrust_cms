export function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function isValidEmail(value) {
  const v = normalizeText(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function toDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function isValidPhone(value, min = 10, max = 15) {
  const digits = toDigits(value);
  return digits.length >= min && digits.length <= max;
}

export function isValidName(value) {
  const v = normalizeText(value);
  return /^[A-Za-z]+(?:[A-Za-z .'-]*[A-Za-z])?$/.test(v);
}

export function isValidAge(value, min = 15, max = 100) {
  const v = normalizeText(value);
  if (!/^\d{1,3}$/.test(v)) return false;
  const n = Number(v);
  return n >= min && n <= max;
}

export function isValidPan(value) {
  const v = normalizeText(value).toUpperCase();
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v);
}

export function hasMinText(value, min = 2) {
  return normalizeText(value).length >= min;
}

