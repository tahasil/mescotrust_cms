function calculateSavingsPercentage(originalSize, optimizedSize) {
  const orig = Number(originalSize) || 0;
  const opt = Number(optimizedSize) || 0;
  if (orig <= 0) return 0;
  if (opt <= 0) return 0;
  const saved = ((orig - opt) / orig) * 100;
  return Math.max(0, Number(saved.toFixed(2)));
}

module.exports = {
  calculateSavingsPercentage,
};

