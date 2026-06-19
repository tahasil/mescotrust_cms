const { IMAGE_UPLOAD_MIME_TYPES } = require("./constants");

const CROP_CONTRACT_ERROR_MESSAGES = {
  INVALID_CROP_PAYLOAD: "Invalid crop payload",
  INVALID_DIMENSIONS: "Invalid dimensions",
  DIMENSIONS_EXCEED_SOURCE: "Dimensions exceed allowed image bounds",
  INVALID_ROTATION: "Invalid rotation",
  WIDTH_HEIGHT_BOTH_REQUIRED: "Width and height must be provided together",
  CROP_CONFIRMATION_REQUIRED: "Crop confirmation is required for raster images",
};

class CropContractError extends Error {
  constructor(code, message = "") {
    super(message || CROP_CONTRACT_ERROR_MESSAGES[code] || "Invalid crop contract");
    this.name = "CropContractError";
    this.code = String(code || "INVALID_CROP_PAYLOAD");
    this.status = 400;
  }
}

function isCropContractError(error) {
  return Boolean(error?.name === "CropContractError" && error?.code);
}

function isRasterMimeType(mimeType) {
  return IMAGE_UPLOAD_MIME_TYPES.includes(String(mimeType || "").toLowerCase());
}

function parseIntegerOrNull(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}

function parseTargetDimensions(widthInput, heightInput) {
  const parsedWidth = parseIntegerOrNull(widthInput);
  const parsedHeight = parseIntegerOrNull(heightInput);

  const hasWidth = parsedWidth !== null;
  const hasHeight = parsedHeight !== null;
  if (hasWidth !== hasHeight) {
    throw new CropContractError("WIDTH_HEIGHT_BOTH_REQUIRED");
  }
  if (!hasWidth && !hasHeight) {
    return { targetWidth: null, targetHeight: null };
  }
  if (
    !Number.isInteger(parsedWidth) ||
    !Number.isInteger(parsedHeight) ||
    parsedWidth <= 0 ||
    parsedHeight <= 0
  ) {
    throw new CropContractError("INVALID_DIMENSIONS");
  }
  return {
    targetWidth: parsedWidth,
    targetHeight: parsedHeight,
  };
}

function parseCropPayload(rawCrop, { required = false } = {}) {
  const normalized = String(rawCrop || "").trim();
  if (!normalized) {
    if (required) throw new CropContractError("CROP_CONFIRMATION_REQUIRED");
    return null;
  }

  let payload = null;
  try {
    payload = JSON.parse(normalized);
  } catch {
    throw new CropContractError("INVALID_CROP_PAYLOAD");
  }

  if (!payload || typeof payload !== "object") {
    throw new CropContractError("INVALID_CROP_PAYLOAD");
  }

  const x = Number(payload.x);
  const y = Number(payload.y);
  const width = Number(payload.width);
  const height = Number(payload.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0
  ) {
    throw new CropContractError("INVALID_CROP_PAYLOAD");
  }

  return { x, y, width, height };
}

function parseRotationDegrees(rawRotation) {
  if (rawRotation === null || rawRotation === undefined) return 0;
  const normalized = String(rawRotation).trim();
  if (!normalized) return 0;
  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    throw new CropContractError("INVALID_ROTATION");
  }
  const wrapped = ((value % 360) + 360) % 360;
  return Number(wrapped.toFixed(3));
}

function parseCropContractFromFormData(formData, { mimeType } = {}) {
  if (!isRasterMimeType(mimeType)) {
    return {
      crop: null,
      targetWidth: null,
      targetHeight: null,
      rotationDegrees: 0,
    };
  }

  const rawCrop = formData.get("crop");
  const rawWidth = formData.get("width");
  const rawHeight = formData.get("height");
  const rawRotation = formData.get("rotation");
  const { targetWidth, targetHeight } = parseTargetDimensions(rawWidth, rawHeight);
  const crop = parseCropPayload(rawCrop, { required: true });
  const rotationDegrees = parseRotationDegrees(rawRotation);
  return {
    crop,
    targetWidth,
    targetHeight,
    rotationDegrees,
  };
}

function normalizeCropForSource({ crop, sourceWidth, sourceHeight }) {
  if (!crop) return null;
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new CropContractError("INVALID_CROP_PAYLOAD");
  }

  const x = Number(crop.x);
  const y = Number(crop.y);
  const widthInput = Number(crop.width);
  const heightInput = Number(crop.height);
  const left = Math.floor(x);
  const top = Math.floor(y);
  const right = Math.ceil(x + widthInput);
  const bottom = Math.ceil(y + heightInput);
  const width = right - left;
  const height = bottom - top;

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(widthInput) ||
    !Number.isFinite(heightInput) ||
    left < 0 ||
    top < 0 ||
    widthInput <= 0 ||
    heightInput <= 0
  ) {
    throw new CropContractError("INVALID_CROP_PAYLOAD");
  }

  const clampedRight = Math.min(sourceWidth, right);
  const clampedBottom = Math.min(sourceHeight, bottom);
  const clampedWidth = clampedRight - left;
  const clampedHeight = clampedBottom - top;
  if (
    clampedWidth <= 0 ||
    clampedHeight <= 0 ||
    clampedRight > sourceWidth ||
    clampedBottom > sourceHeight
  ) {
    throw new CropContractError("INVALID_CROP_PAYLOAD");
  }

  return {
    left,
    top,
    width: clampedWidth,
    height: clampedHeight,
  };
}

function validateTargetDimensionsAgainstSource({
  targetWidth,
  targetHeight,
  sourceWidth,
  sourceHeight,
  cropWidth = null,
  cropHeight = null,
}) {
  const tolerance = 1;
  if (targetWidth === null && targetHeight === null) return;

  if (!Number.isInteger(targetWidth) || !Number.isInteger(targetHeight)) {
    throw new CropContractError("INVALID_DIMENSIONS");
  }
  if (targetWidth <= 0 || targetHeight <= 0) {
    throw new CropContractError("INVALID_DIMENSIONS");
  }
  const maxWidth =
    Number.isInteger(cropWidth) && cropWidth > 0 ? cropWidth : sourceWidth;
  const maxHeight =
    Number.isInteger(cropHeight) && cropHeight > 0 ? cropHeight : sourceHeight;
  if (targetWidth > maxWidth + tolerance || targetHeight > maxHeight + tolerance) {
    throw new CropContractError("DIMENSIONS_EXCEED_SOURCE");
  }
}

module.exports = {
  CROP_CONTRACT_ERROR_MESSAGES,
  CropContractError,
  isCropContractError,
  isRasterMimeType,
  parseCropContractFromFormData,
  normalizeCropForSource,
  validateTargetDimensionsAgainstSource,
};
