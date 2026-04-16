const { DEFAULT_MEDIA_WIDTHS } = require("./constants");

function calculateSavingsPercentage(originalSize, optimizedSize) {
  const orig = Number(originalSize) || 0;
  const opt = Number(optimizedSize) || 0;
  if (orig <= 0) return 0;
  if (opt <= 0) return 0;
  const saved = ((orig - opt) / orig) * 100;
  return Math.max(0, Number(saved.toFixed(2)));
}

function buildVariantEntries(widths = DEFAULT_MEDIA_WIDTHS) {
  const w = { ...DEFAULT_MEDIA_WIDTHS, ...(widths || {}) };
  return [
    ["thumbnail", Number(w.thumbnail) || DEFAULT_MEDIA_WIDTHS.thumbnail],
    ["medium", Number(w.medium) || DEFAULT_MEDIA_WIDTHS.medium],
    ["large", Number(w.large) || DEFAULT_MEDIA_WIDTHS.large],
    ["mobile", Number(w.mobile) || DEFAULT_MEDIA_WIDTHS.mobile],
    ["desktop", Number(w.desktop) || DEFAULT_MEDIA_WIDTHS.desktop],
  ];
}

module.exports = {
  calculateSavingsPercentage,
  buildVariantEntries,
};
