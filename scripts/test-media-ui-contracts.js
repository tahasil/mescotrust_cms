const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("AdminMediaLibrary keeps raster crop-before-upload and replace contracts", () => {
  const source = readFile("components/admin/media/AdminMediaLibrary.js");
  assert.match(source, /import RasterCropConfirmModal from "\.\/RasterCropConfirmModal";/);
  assert.match(source, /requestRasterCrop\(file,\s*"Crop image before upload"\)/);
  assert.match(source, /requestRasterCrop\(file,\s*"Crop replacement image"\)/);
  assert.match(source, /Crop confirmation is required for JPG, PNG, WEBP, and AVIF uploads\./);
  assert.match(source, /<RasterCropConfirmModal/);
});

test("MediaPickerInput enforces raster crop-before-upload with modal flow", () => {
  const source = readFile("components/admin/media/MediaPickerInput.js");
  assert.match(source, /import RasterCropConfirmModal from "\.\/RasterCropConfirmModal";/);
  assert.match(source, /requestRasterCrop\(file,\s*"Crop image before upload"\)/);
  assert.match(source, /<RasterCropConfirmModal/);
});

test("RasterCropConfirmModal exposes final dimensions and blocks invalid confirm", () => {
  const source = readFile("components/admin/media/RasterCropConfirmModal.js");
  assert.match(source, /Output/);
  assert.match(source, /Rotation/);
  assert.match(source, /rotationDegrees/);
  assert.match(source, /disabled=\{Boolean\(validationError\)\}/);
  assert.match(source, /Preview will appear after crop selection\./);
  assert.match(source, /resolvedInitialWidth/);
  assert.match(source, /resolvedInitialHeight/);
});

test("MediaPickerInput supports dynamic crop dimensions and hintText parser", () => {
  const source = readFile("components/admin/media/MediaPickerInput.js");
  assert.match(source, /extractDimensionsFromHintText/);
  assert.match(source, /cropWidth/);
  assert.match(source, /cropHeight/);
  assert.match(source, /targetWidth=\{cropRequest\?\.targetWidth\}/);
  assert.match(source, /targetHeight=\{cropRequest\?\.targetHeight\}/);
});
