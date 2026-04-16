const { connectDB } = require("../db");
const MediaSettings = require("../../models/MediaSettings");
const {
  DEFAULT_MEDIA_WIDTHS,
  QUALITY_PRESETS,
} = require("./constants");

const DEFAULT_MEDIA_SETTINGS = {
  settingsKey: "default",
  compressionMode: "glossy",
  quality: 75,
  enableWebP: true,
  enableAVIF: true,
  enableLazyLoad: true,
  cropMode: "none",
  widths: { ...DEFAULT_MEDIA_WIDTHS },
  avifEffort: 4,
  webpEffort: 4,
  maxUploadMB: 20,
};

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function normalizeMediaSettingsInput(input = {}, previous = DEFAULT_MEDIA_SETTINGS) {
  const base = {
    ...DEFAULT_MEDIA_SETTINGS,
    ...previous,
    ...input,
  };
  const widthsInput = input.widths || {};
  const widthsPrev = previous.widths || DEFAULT_MEDIA_WIDTHS;
  const widths = {
    thumbnail: clampNumber(
      widthsInput.thumbnail,
      64,
      2048,
      widthsPrev.thumbnail || DEFAULT_MEDIA_WIDTHS.thumbnail,
    ),
    medium: clampNumber(
      widthsInput.medium,
      128,
      2560,
      widthsPrev.medium || DEFAULT_MEDIA_WIDTHS.medium,
    ),
    large: clampNumber(
      widthsInput.large,
      256,
      3840,
      widthsPrev.large || DEFAULT_MEDIA_WIDTHS.large,
    ),
    mobile: clampNumber(
      widthsInput.mobile,
      320,
      2048,
      widthsPrev.mobile || DEFAULT_MEDIA_WIDTHS.mobile,
    ),
    desktop: clampNumber(
      widthsInput.desktop,
      640,
      5120,
      widthsPrev.desktop || DEFAULT_MEDIA_WIDTHS.desktop,
    ),
  };

  const compressionMode = ["lossless", "glossy", "lossy"].includes(
    String(base.compressionMode || "").toLowerCase(),
  )
    ? String(base.compressionMode).toLowerCase()
    : DEFAULT_MEDIA_SETTINGS.compressionMode;

  return {
    settingsKey: "default",
    compressionMode,
    quality: clampNumber(base.quality, 40, 100, DEFAULT_MEDIA_SETTINGS.quality),
    enableWebP: Boolean(base.enableWebP),
    enableAVIF: Boolean(base.enableAVIF),
    enableLazyLoad: Boolean(base.enableLazyLoad),
    cropMode: ["none", "cover", "contain"].includes(String(base.cropMode))
      ? String(base.cropMode)
      : DEFAULT_MEDIA_SETTINGS.cropMode,
    widths,
    avifEffort: clampNumber(base.avifEffort, 0, 9, DEFAULT_MEDIA_SETTINGS.avifEffort),
    webpEffort: clampNumber(base.webpEffort, 0, 6, DEFAULT_MEDIA_SETTINGS.webpEffort),
    maxUploadMB: clampNumber(base.maxUploadMB, 1, 100, DEFAULT_MEDIA_SETTINGS.maxUploadMB),
  };
}

function getEffectiveQuality(settings) {
  const mode = String(settings?.compressionMode || DEFAULT_MEDIA_SETTINGS.compressionMode);
  const modeQuality = QUALITY_PRESETS[mode] || DEFAULT_MEDIA_SETTINGS.quality;
  return clampNumber(
    settings?.quality,
    40,
    100,
    modeQuality,
  );
}

async function getMediaSettings() {
  await connectDB();
  const existing = await MediaSettings.findOne({ settingsKey: "default" }).lean();
  if (!existing) return { ...DEFAULT_MEDIA_SETTINGS };
  return normalizeMediaSettingsInput(existing, DEFAULT_MEDIA_SETTINGS);
}

async function upsertMediaSettings(input, actor = "") {
  await connectDB();
  const current = await MediaSettings.findOne({ settingsKey: "default" }).lean();
  const normalized = normalizeMediaSettingsInput(input, current || DEFAULT_MEDIA_SETTINGS);
  const saved = await MediaSettings.findOneAndUpdate(
    { settingsKey: "default" },
    { $set: normalized, $setOnInsert: { settingsKey: "default" } },
    { upsert: true, new: true },
  ).lean();
  return saved || normalized;
}

module.exports = {
  DEFAULT_MEDIA_SETTINGS,
  normalizeMediaSettingsInput,
  getEffectiveQuality,
  getMediaSettings,
  upsertMediaSettings,
};
