const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseCropContractFromFormData,
  normalizeCropForSource,
  validateTargetDimensionsAgainstSource,
} = require("../lib/media/cropContract");

function makeFormData(entries = {}) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

function expectCropError(fn, expectedCode) {
  assert.throws(
    fn,
    (error) => {
      assert.equal(error?.name, "CropContractError");
      assert.equal(error?.code, expectedCode);
      return true;
    },
  );
}

test("non-raster MIME bypasses crop contract", () => {
  const formData = makeFormData();
  const contract = parseCropContractFromFormData(formData, { mimeType: "application/pdf" });
  assert.deepEqual(contract, {
    crop: null,
    targetWidth: null,
    targetHeight: null,
    rotationDegrees: 0,
  });
});

test("raster upload requires crop confirmation", () => {
  const formData = makeFormData();
  expectCropError(
    () => parseCropContractFromFormData(formData, { mimeType: "image/png" }),
    "CROP_CONFIRMATION_REQUIRED",
  );
});

test("width/height must be provided together", () => {
  const formData = makeFormData({
    crop: JSON.stringify({ x: 0, y: 0, width: 100, height: 100 }),
    width: "320",
  });
  expectCropError(
    () => parseCropContractFromFormData(formData, { mimeType: "image/jpeg" }),
    "WIDTH_HEIGHT_BOTH_REQUIRED",
  );
});

test("invalid dimension values are rejected", () => {
  const formData = makeFormData({
    crop: JSON.stringify({ x: 0, y: 0, width: 100, height: 100 }),
    width: "abc",
    height: "250",
  });
  expectCropError(
    () => parseCropContractFromFormData(formData, { mimeType: "image/webp" }),
    "INVALID_DIMENSIONS",
  );
});

test("valid raster crop contract is parsed", () => {
  const formData = makeFormData({
    crop: JSON.stringify({ x: 10.1, y: 20.9, width: 300.4, height: 200.6 }),
    width: "300",
    height: "200",
  });
  const contract = parseCropContractFromFormData(formData, { mimeType: "image/avif" });
  assert.deepEqual(contract, {
    crop: { x: 10.1, y: 20.9, width: 300.4, height: 200.6 },
    targetWidth: 300,
    targetHeight: 200,
    rotationDegrees: 0,
  });
});

test("rotation defaults to 0 and normalizes to 0-359 range", () => {
  const formData = makeFormData({
    crop: JSON.stringify({ x: 10, y: 10, width: 100, height: 80 }),
    rotation: "450.5",
  });
  const contract = parseCropContractFromFormData(formData, { mimeType: "image/png" });
  assert.equal(contract.rotationDegrees, 90.5);
});

test("non-numeric rotation values are rejected", () => {
  const formData = makeFormData({
    crop: JSON.stringify({ x: 10, y: 10, width: 100, height: 80 }),
    rotation: "not-a-number",
  });
  expectCropError(
    () => parseCropContractFromFormData(formData, { mimeType: "image/png" }),
    "INVALID_ROTATION",
  );
});

test("normalizeCropForSource stabilizes coordinates and validates bounds", () => {
  const normalized = normalizeCropForSource({
    crop: { x: 11.4, y: 9.7, width: 100.2, height: 80.9 },
    sourceWidth: 500,
    sourceHeight: 400,
  });
  assert.deepEqual(normalized, {
    left: 11,
    top: 9,
    width: 101,
    height: 82,
  });
});

test("normalizeCropForSource clamps partially out-of-bound crop rectangles", () => {
  const normalized = normalizeCropForSource({
    crop: { x: 450, y: 350, width: 100, height: 80 },
    sourceWidth: 500,
    sourceHeight: 400,
  });
  assert.deepEqual(normalized, {
    left: 450,
    top: 350,
    width: 50,
    height: 50,
  });
});

test("normalizeCropForSource clamps negative crop offsets into source bounds", () => {
  const normalized = normalizeCropForSource({
    crop: { x: -20, y: -10, width: 80, height: 70 },
    sourceWidth: 500,
    sourceHeight: 400,
  });
  assert.deepEqual(normalized, {
    left: 0,
    top: 0,
    width: 60,
    height: 60,
  });
});

test("normalizeCropForSource rejects crops fully outside source", () => {
  expectCropError(
    () =>
      normalizeCropForSource({
        crop: { x: 550, y: 350, width: 100, height: 80 },
        sourceWidth: 500,
        sourceHeight: 400,
      }),
    "INVALID_CROP_PAYLOAD",
  );
});

test("target dimensions must be <= source dimensions", () => {
  expectCropError(
    () =>
      validateTargetDimensionsAgainstSource({
        targetWidth: 2000,
        targetHeight: 1500,
        sourceWidth: 1000,
        sourceHeight: 900,
      }),
    "DIMENSIONS_EXCEED_SOURCE",
  );
});

test("target dimensions must be <= selected crop dimensions when provided", () => {
  expectCropError(
    () =>
      validateTargetDimensionsAgainstSource({
        targetWidth: 700,
        targetHeight: 500,
        sourceWidth: 1600,
        sourceHeight: 1200,
        cropWidth: 600,
        cropHeight: 480,
      }),
    "DIMENSIONS_EXCEED_SOURCE",
  );
});
