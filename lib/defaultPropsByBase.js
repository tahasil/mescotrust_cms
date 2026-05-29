import { cache } from "react";
import Component from "@/models/Component";
import { getRegistryIdsFromDisk } from "@/lib/getRegistryIdsFromDisk";

function normalizeIds(baseComponents) {
  if (!Array.isArray(baseComponents)) return [];
  return [...new Set(baseComponents.map((id) => String(id || "").trim()).filter(Boolean))];
}

// All site Components in the on-disk registry — fetched once per request,
// then both layoutData and defaultPropsByBase filter from the in-memory list
// instead of issuing duplicate queries.
//
// NOTE (TSUV→MESCO port): TSUV also queries the `Slider` collection here. The
// Slider model lands in Phase 6, so the slider branch is intentionally stubbed
// (empty) until then. Restore the `Slider.find({ componentId: { $in: ids } })`
// query + the slider loop in getDefaultPropsByBase when Phase 6 ships.
async function _getAllSiteComponentsAndSliders() {
  const ids = getRegistryIdsFromDisk();
  if (!Array.isArray(ids) || ids.length === 0) {
    return { components: [], sliders: [] };
  }
  const components = await Component.find({ baseComponent: { $in: ids } }).lean();
  return { components: components || [], sliders: [] };
}

export const getAllSiteComponentsAndSliders = cache(_getAllSiteComponentsAndSliders);

export async function getDefaultPropsByBase(baseComponents) {
  const wanted = new Set(normalizeIds(baseComponents));
  if (wanted.size === 0) return {};

  const { components, sliders } = await getAllSiteComponentsAndSliders();

  const defaults = {};
  for (const doc of components) {
    if (!doc?.baseComponent || !wanted.has(doc.baseComponent)) continue;
    if (doc.defaultProps && typeof doc.defaultProps === "object") {
      defaults[doc.baseComponent] = doc.defaultProps;
    }
  }
  // Slider defaults wired in Phase 6 (Slider model not present yet).
  for (const doc of sliders) {
    if (!doc?.componentId || !wanted.has(doc.componentId)) continue;
    if (doc.defaultProps && typeof doc.defaultProps === "object") {
      defaults[doc.componentId] = doc.defaultProps;
    }
  }

  return defaults;
}
