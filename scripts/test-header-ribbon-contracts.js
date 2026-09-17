const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("AppearanceHeaderRibbonEditForm implements SortableFormList, Direction Setting, Speed Setting, and multi-item normalization", () => {
  const source = readFile("components/appearance/AppearanceHeaderRibbonEditForm.js");
  assert.match(source, /SortableFormList/);
  assert.match(source, /name="ribbonItems"/);
  assert.match(source, /name="ribbonDirection"/);
  assert.match(source, /name="ribbonSpeed"/);
  assert.match(source, /Marquee Speed/);
  assert.match(source, /DIRECTION_OPTIONS/);
  assert.match(source, /Left to Right/);
  assert.match(source, /Right to Left/);
  assert.match(source, /normalizeRibbonItems/);
  assert.match(source, /onValuesChange/);
});

test("AppearanceHeaderRibbon renders single items statically and multiple items via react-fast-marquee", () => {
  const source = readFile("components/appearance/AppearanceHeaderRibbon.js");
  assert.match(source, /import ReactMarquee from "react-fast-marquee"/);
  assert.match(source, /normalizeRibbonItems/);
  assert.match(source, /isMultiItem \? \(/);
  assert.match(source, /<ReactMarquee/);
  assert.match(source, /direction=\{marqueeDirection\}/);
  assert.match(source, /pauseOnHover=\{true\}/);
  assert.match(source, /autoFill=\{true\}/);
  assert.match(source, /appearance-header-ribbon__inner/);
  assert.match(source, /appearance-header-ribbon__marquee-item/);
});

test("lib/appearance.js sets default ribbonDirection and ribbonItems", () => {
  const source = readFile("lib/appearance.js");
  assert.match(source, /ribbonDirection:\s*"rtl"/);
  assert.match(source, /ribbonItems:\s*\[/);
  assert.match(source, /ensureAppearanceDocuments/);
});

test("AppearanceEditor.js wires onValuesChange and preview updates for header-ribbon", () => {
  const source = readFile("components/admin/AppearanceEditor.js");
  assert.match(source, /<AppearanceHeaderRibbon \{\.\.\.previewProps\} preview \/>/);
  assert.match(source, /onValuesChange=\{setDrawerPreviewOverrides\}/);
});
