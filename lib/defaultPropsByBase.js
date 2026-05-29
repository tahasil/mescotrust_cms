import { cache } from "react";
import Component from "@/models/Component";
import Slider from "@/models/Slider";
import { getRegistryIdsFromDisk } from "@/lib/getRegistryIdsFromDisk";

function normalizeIds(baseComponents) {
  if (!Array.isArray(baseComponents)) return [];
  return [...new Set(baseComponents.map((id) => String(id || "").trim()).filter(Boolean))];
}

// All site Components + Sliders in the on-disk registry — fetched once per
// request, then both layoutData and defaultPropsByBase filter from the in-memory
// list instead of issuing duplicate queries. (Slider query restored in Phase 6.)
async function _getAllSiteComponentsAndSliders() {
  const ids = getRegistryIdsFromDisk();
  if (!Array.isArray(ids) || ids.length === 0) {
    return { components: [], sliders: [] };
  }
  const [components, sliders] = await Promise.all([
    Component.find({ baseComponent: { $in: ids } }).lean(),
    Slider.find({ componentId: { $in: ids } }).lean(),
  ]);
  return { components: components || [], sliders: sliders || [] };
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
