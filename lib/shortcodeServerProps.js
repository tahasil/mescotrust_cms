/**
 * Server-side ShortCode target resolution.
 *
 * A `ShortCode` page block renders another component (e.g. `[shortcode="HomeSlider"]`).
 * Without help, the ShortCode component resolves that target in a `useEffect` and
 * fetches `/api/theme/<Component>`, so the target renders only after hydration.
 * That delays the page hero/slider and keeps that content out of the SSR HTML.
 *
 * This helper resolves the same targets on the server and hands the props to the
 * block, so ShortCode can render immediately on the server and skip the client fetch.
 * Client-side resolution stays in place as a fallback (page-builder preview, etc).
 */
import Component from "@/models/Component";
import { SITE_COMPONENT_IDS } from "./siteComponentRegistry";
import {
  findComponentIdByShortcodeValue,
  getShortcodeTargetKey,
  normalizeShortcodeText,
} from "./shortcode";

const SHORTCODE_BASE = "ShortCode";

/** Sanitizes a `/api/theme/<id>` payload the same way the client does. */
function sanitizePayload(data) {
  if (!data || typeof data !== "object") return {};
  const payload = { ...data };
  delete payload.themePalette;
  delete payload.colors;
  return payload;
}

function eachBlock(blocks, visit) {
  (Array.isArray(blocks) ? blocks : []).forEach((block) => {
    visit(block);
    const nested = block?.props?.layout;
    if (Array.isArray(nested)) eachBlock(nested, visit);
  });
}

function getBlockBaseComponent(block) {
  if (typeof block?.baseComponent === "string" && block.baseComponent) {
    return block.baseComponent;
  }
  const populated = block?.componentId;
  if (populated && typeof populated === "object" && populated.baseComponent) {
    return populated.baseComponent;
  }
  return "";
}

/** Collects every shortcode target used by the ShortCode blocks in a layout. */
export function collectShortcodeTargetKeys(blocks) {
  const keys = new Set();
  eachBlock(blocks, (block) => {
    if (getBlockBaseComponent(block) !== SHORTCODE_BASE) return;
    const targetKey = getShortcodeTargetKey(block?.props || {});
    if (!targetKey) return;
    const componentId = findComponentIdByShortcodeValue(targetKey, SITE_COMPONENT_IDS);
    if (componentId) keys.add(normalizeShortcodeText(componentId));
  });
  return [...keys];
}

/**
 * Returns the layout with `_shortcodeTargetComponentId` / `_shortcodeModuleProps`
 * added to every ShortCode block whose target is a site component.
 */
export async function attachShortcodeModuleProps(blocks) {
  const targetIds = collectShortcodeTargetKeys(blocks);
  const componentPropsById = {};

  if (targetIds.length > 0) {
    try {
      const docs = await Component.find({
        baseComponent: { $in: targetIds },
      }).lean();
      (docs || []).forEach((doc) => {
        if (!doc?.baseComponent) return;
        componentPropsById[doc.baseComponent] = sanitizePayload({
          ...(doc.defaultProps && typeof doc.defaultProps === "object" ? doc.defaultProps : {}),
        });
      });
    } catch {
      // Leave the map empty: ShortCode falls back to client-side resolution.
    }
  }

  return (Array.isArray(blocks) ? blocks : []).map((block) => {
    const nextProps = { ...(block?.props || {}) };
    const nestedLayout = Array.isArray(nextProps.layout) ? nextProps.layout : null;

    if (getBlockBaseComponent(block) === SHORTCODE_BASE) {
      const targetKey = getShortcodeTargetKey(block?.props || {});
      const componentId = findComponentIdByShortcodeValue(targetKey, SITE_COMPONENT_IDS);
      const moduleProps = componentId ? componentPropsById[componentId] : null;
      if (componentId) nextProps._shortcodeTargetComponentId = componentId;
      if (moduleProps) nextProps._shortcodeModuleProps = moduleProps;
    }

    if (nestedLayout) nextProps.layout = attachShortcodeModuleProps(nestedLayout);

    return { ...block, props: nextProps };
  });
}
