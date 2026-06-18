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
  });
});

test("normalizeCropForSource rounds coordinates and validates bounds", () => {
  const normalized = normalizeCropForSource({
    crop: { x: 11.4, y: 9.7, width: 100.2, height: 80.9 },
    sourceWidth: 500,
    sourceHeight: 400,
  });
  assert.deepEqual(normalized, {
    left: 11,
    top: 10,
    width: 100,
    height: 81,
  });
});

test("normalizeCropForSource rejects out-of-bound crop rectangles", () => {
  expectCropError(
    () =>
      normalizeCropForSource({
        crop: { x: 450, y: 350, width: 100, height: 80 },
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
