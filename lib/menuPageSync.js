/**
 * Single source of truth for keeping Pages and Menus in sync.
 *
 * WHY THIS EXISTS
 * ---------------
 * In this CMS a page's URL is derived from where it sits in the menu tree:
 *
 *   About Us (custom link, container)
 *     └── MESCO At Glance (page)   ->  /about-us/mesco-at-glance
 *
 * Two admin surfaces mutate that structure:
 *   1. Page Builder  -> "Parent Menu" select changes a page's slug folder.
 *   2. Menu editor   -> dragging / indenting / promoting a sub-item moves it
 *                       from one parent to another.
 *
 * The previous implementation kept two ad-hoc, duplicated walkers in the
 * route handlers. They each rewrote slugs in isolation, which caused 404s:
 *
 *   - Only the edited page was renamed; its descendant pages were orphaned.
 *   - Only the menu being saved was repaired; sibling menus kept stale URLs.
 *   - Menu items were matched by exact pageSlug, so stale items never synced.
 *   - Parent folders were derived from labels, so renaming a label rewrote
 *     every descendant slug.
 *   - `order` was never re-indexed after a move.
 *   - Old URLs were never remembered, so every move was a permanent 404.
 *
 * THE RULES ENFORCED HERE
 * -----------------------
 *   R1  Menu position is authoritative for a page's *folder*.
 *   R2  A page's *basename* only changes when it is explicitly renamed.
 *   R3  Moves are SUBTREE moves: moving `a/b` to `c/b` also moves `a/b/...`.
 *   R4  After any change, EVERY menu is repaired so cross-menu references
 *       (footer/header/other menus) never point at a dead slug.
 *   R5  Every rename writes a redirect so old URLs never 404.
 *   R6  Ordering is re-indexed per sibling group after every mutation.
 *   R7  Moves are atomic: a slug conflict aborts the whole batch rather than
 *       leaving the site half-migrated.
 *
 * Written as CommonJS (like `lib/slug.js`) so operational scripts can require
 * it directly; Next.js route handlers still use named ESM imports.
 */

const mongoose = require("mongoose");
const Page = require("@/models/Page");
const Menu = require("@/models/Menu");
const PageSlugRedirect = require("@/models/PageSlugRedirect");

/** Prefix used for the two-phase rename that avoids unique-index collisions. */
const TEMP_PREFIX = "__mvtmp";
const MAX_REDIRECT_HOPS = 6;

/* ------------------------------------------------------------------ *
 * Pure path helpers (no DB access)
 * ------------------------------------------------------------------ */

/** Turn a menu label into the URL folder segment it represents. */
function slugifyMenuLabel(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** "a/b/c" -> "a/b" ; "c" -> "" */
function folderOf(slug) {
  const s = String(slug || "");
  const i = s.lastIndexOf("/");
  return i > 0 ? s.slice(0, i) : "";
}

/** "a/b/c" -> "c" ; "c" -> "c" */
function basenameOf(slug) {
  const s = String(slug || "");
  const i = s.lastIndexOf("/");
  return i >= 0 ? s.slice(i + 1) : s;
}

/** Build the URL path a page item should have given its ancestor folders. */
function expectedSlugFor(folder, baseSlug) {
  const base = basenameOf(baseSlug);
  return folder ? `${folder}/${base}` : base;
}

/* ------------------------------------------------------------------ *
 * Menu tree helpers (plain JSON objects — not Mongoose subdocs)
 * ------------------------------------------------------------------ */

/** Deep-clone menu items into plain, mutable objects. */
function cloneMenuItems(items) {
  return JSON.parse(JSON.stringify(Array.isArray(items) ? items : []));
}

/**
 * Re-index `order` for every sibling group and normalise the derived fields
 * of page items (url is always derived from pageSlug, never stored stale).
 */
function normalizeMenuItems(items) {
  if (!Array.isArray(items)) return items;
  items.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    item.order = index;
    if (item.type === "page" && item.pageSlug) {
      item.url = `/${item.pageSlug}`;
    }
    if (Array.isArray(item.children) && item.children.length > 0) {
      normalizeMenuItems(item.children);
    } else if (Array.isArray(item.children)) {
      item.children = [];
    }
  });
  return items;
}

/** Does this tree contain a page item pointing at any of `slugs`? */
function containsAnyPageItem(items, slugs) {
  const list = Array.isArray(slugs) ? slugs : [slugs];
  if (!Array.isArray(items)) return false;
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    if (item.type === "page" && list.includes(item.pageSlug)) return true;
    if (Array.isArray(item.children) && containsAnyPageItem(item.children, list)) {
      return true;
    }
  }
  return false;
}

/**
 * Walk the tree and report every `page` item together with the URL folder
 * implied by its ancestors. This is what implements R1 + R2.
 */
function collectDesiredPageSlugs(items) {
  const desired = [];

  const walk = (list, ancestors) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      if (item.type === "page" && item.pageSlug) {
        const folder = ancestors.filter(Boolean).join("/");
        desired.push({
          node: item,
          currentSlug: item.pageSlug,
          desiredSlug: expectedSlugFor(folder, item.pageSlug),
          folder,
        });
      }
      const children = Array.isArray(item.children) ? item.children : [];
      if (children.length > 0) {
        walk(children, [...ancestors, slugifyMenuLabel(item.label)]);
      }
    }
  };

  walk(items, []);
  return desired;
}

/**
 * Detach a page item from the tree and return it. `slugs` may list several
 * candidates (e.g. both the old and new address of a page that just moved),
 * because a menu can still hold the stale value when we get here.
 * Mutates `items` in place.
 */
function detachPageItem(items, slugs) {
  const list = Array.isArray(slugs) ? slugs : [slugs];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== "object") continue;
    if (item.type === "page" && list.includes(item.pageSlug)) {
      return items.splice(i, 1)[0];
    }
    if (Array.isArray(item.children) && item.children.length > 0) {
      const found = detachPageItem(item.children, list);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Locate the container item whose ancestor path equals `folder`
 * (e.g. "about-us/media"), searching every menu level. Returns null when the
 * folder has no container in this menu.
 */
function findContainerByPath(items, segments) {
  if (!Array.isArray(items) || !segments.length) return null;
  const [head, ...rest] = segments;

  let match = null;
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    if (slugifyMenuLabel(item.label) === head) {
      // Prefer a node that already has children — a childless node is much
      // more likely to be a coincidence than a real container.
      if (Array.isArray(item.children) && item.children.length > 0) {
        match = item;
        break;
      }
      if (!match) match = item;
    }
  }
  if (!match) return null;
  if (!rest.length) return match;
  if (!Array.isArray(match.children)) match.children = [];
  return findContainerByPath(match.children, rest);
}

/**
 * Remove every menu item that pointed at `pageSlug` so a deleted page can
 * never leave a 404 behind in the header or footer. Parent containers left
 * empty are dropped too, so the nav never shows blank rows.
 */
function removePageItems(items, pageSlug) {
  let removed = 0;

  const prune = (list) => {
    if (!Array.isArray(list)) return;
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const item = list[i];
      if (!item || typeof item !== "object") continue;
      if (Array.isArray(item.children) && item.children.length > 0) {
        prune(item.children);
        if (item.children.length === 0) {
          list.splice(i, 1);
          removed += 1;
          continue;
        }
      }
      if (item.type === "page" && item.pageSlug === pageSlug) {
        list.splice(i, 1);
        removed += 1;
      }
    }
  };

  prune(items);
  if (removed) normalizeMenuItems(items);
  return removed;
}

/**
 * Re-nest a page item under the container implied by `folder`.
 *
 * @param {string|string[]} slugs     current address(es) of the menu item
 * @param {string} folder             target folder, e.g. "about-us/media"
 * @param {string} [newSlug]          address to stamp onto the item
 */
function placePageItemInFolder(items, slugs, folder, newSlug) {
  const node = detachPageItem(items, slugs);
  if (!node) return { placed: false, found: false };

  if (newSlug) {
    node.pageSlug = newSlug;
    node.url = `/${newSlug}`;
  }

  const segments = String(folder || "").split("/").filter(Boolean);
  if (!segments.length) {
    items.push(node);
    normalizeMenuItems(items);
    return { placed: true, found: true, atRoot: true };
  }

  const container = findContainerByPath(items, segments);
  if (!container) {
    // No matching parent in this menu — keep it at the root rather than
    // dropping it, and let the caller surface a warning.
    items.push(node);
    normalizeMenuItems(items);
    return { placed: true, found: true, atRoot: true, missingParent: segments.join("/") };
  }

  if (!Array.isArray(container.children)) container.children = [];
  container.children.push(node);
  normalizeMenuItems(items);
  return { placed: true, found: true, missingParent: null };
}

/* ------------------------------------------------------------------ *
 * Move planning + atomic application (R3, R5, R7)
 * ------------------------------------------------------------------ */

/**
 * Resolve the final slug for `currentSlug` given a map of explicit moves.
 * Walks up the folder chain so that a moved parent drags its whole subtree
 * along (R3).
 */
function resolveNewSlug(currentSlug, moveMap) {
  if (moveMap.has(currentSlug)) return moveMap.get(currentSlug);

  let folder = folderOf(currentSlug);
  let guard = 0;
  while (folder && guard < 20) {
    guard += 1;
    const mapped = moveMap.get(folder);
    if (mapped) return `${mapped}/${basenameOf(currentSlug)}`;
    const next = folderOf(folder);
    if (next === folder) break;
    folder = next;
  }
  return currentSlug;
}

/**
 * Expand the explicit moves into a full move list covering descendants.
 * Returns `[{ from, to }]`.
 */
function planPageMoves(baseMoves, allSlugs) {
  const moveMap = new Map();
  for (const move of baseMoves || []) {
    const from = String(move?.from || "").trim();
    const to = String(move?.to || "").trim();
    if (!from || !to || from === to) continue;
    if (from.startsWith(TEMP_PREFIX) || to.startsWith(TEMP_PREFIX)) continue;
    moveMap.set(from, to);
  }
  if (!moveMap.size) return [];

  const planned = [];
  for (const slug of allSlugs || []) {
    const next = resolveNewSlug(slug, moveMap);
    if (next !== slug) planned.push({ from: slug, to: next });
  }
  return planned;
}

/**
 * Apply planned moves atomically (R7) and record redirects (R5).
 *
 * Renames happen in two passes through a unique temporary prefix so a subtree
 * move can never collide with the Page `slug` unique index.
 *
 * On any conflict nothing is written and the conflicts are returned so the
 * admin UI can explain what happened.
 */
async function applyPageMoves(planned, reason = "page_move") {
  const conflicts = [];
  if (!Array.isArray(planned) || !planned.length) {
    return { moved: [], conflicts, applied: false };
  }

  const froms = planned.map((m) => m.from);
  const tos = planned.map((m) => m.to);

  const movingDocs = await Page.find({ slug: { $in: froms } }).lean();
  const movingIds = new Set(movingDocs.map((d) => String(d._id)));

  // A target slug is only a conflict when it is held by a page that is NOT
  // itself being moved away.
  const occupied = await Page.find({ slug: { $in: tos } }).lean();
  for (const doc of occupied) {
    if (movingIds.has(String(doc._id))) continue;
    conflicts.push(doc.slug);
  }
  if (conflicts.length) {
    return { moved: [], conflicts: [...new Set(conflicts)], applied: false };
  }

  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  const tempFor = (slug) => `${TEMP_PREFIX}${stamp}/${slug.replace(/\//g, "_")}`;

  const temps = new Map();
  try {
    // Pass 1 — park every moving page on a temporary, collision-free slug.
    for (const move of planned) {
      const temp = tempFor(move.from);
      temps.set(move.from, temp);
      await Page.updateOne({ slug: move.from }, { $set: { slug: temp } });
    }
    // Pass 2 — settle on the final slugs.
    for (const move of planned) {
      await Page.updateOne({ slug: temps.get(move.from) }, { $set: { slug: move.to } });
    }
  } catch (err) {
    // Best-effort rollback: put everything back where it came from.
    for (const move of planned) {
      const temp = temps.get(move.from);
      if (!temp) continue;
      await Page.updateOne({ slug: temp }, { $set: { slug: move.from } }).catch(() => {});
      await Page.updateOne({ slug: move.to }, { $set: { slug: temp } }).catch(() => {});
    }
    throw err;
  }

  // Pass 3 — remember the old URLs so they redirect instead of 404.
  for (const move of planned) {
    await recordRedirect(move.from, move.to, reason);
  }

  return { moved: planned, conflicts: [], applied: true };
}

/** Upsert a redirect, refusing self-referential or circular entries. */
async function recordRedirect(from, to, reason = "page_move") {
  const source = String(from || "").trim().toLowerCase();
  const target = String(to || "").trim().toLowerCase();
  if (!source || !target || source === target) return;
  if (source.startsWith(TEMP_PREFIX)) return;
  await PageSlugRedirect.updateOne(
    { from: source },
    { $set: { from: source, to: target, reason } },
    { upsert: true }
  ).catch((err) => console.error("[menuPageSync] redirect write failed:", err));
}

/**
 * Follow a redirect chain to the final live slug.
 * Returns the resolved slug when it differs from the input, otherwise null.
 */
async function resolveRedirect(slug) {
  const start = String(slug || "").trim().toLowerCase();
  if (!start || start.startsWith(TEMP_PREFIX)) return null;

  let current = start;
  const seen = new Set([current]);

  for (let hop = 0; hop < MAX_REDIRECT_HOPS; hop += 1) {
    const doc = await PageSlugRedirect.findOne({ from: current }).lean();
    if (!doc || !doc.to || doc.to === current) break;
    if (seen.has(doc.to)) break;
    seen.add(doc.to);
    current = doc.to;
  }
  return current === start ? null : current;
}

/**
 * Drop redirects that point at a slug which is live again (a page was
 * re-created at the old address), so it stops redirecting away.
 */
async function clearRedirectsTargeting(slug) {
  const target = String(slug || "").trim().toLowerCase();
  if (!target) return;
  await PageSlugRedirect.deleteMany({ to: target }).catch(() => {});
}

/* ------------------------------------------------------------------ *
 * Cross-menu repair (R4)
 * ------------------------------------------------------------------ */

/**
 * Re-point every page item in every menu at the page that actually exists.
 *
 * This removes stale cross-menu links: if a page moved, the footer (or any
 * other menu) that referenced the old slug is healed through the redirect map
 * instead of 404-ing.
 */
async function repairAllMenus(moveMap = new Map()) {
  const changed = [];
  const warnings = [];

  const [menus, pages] = await Promise.all([
    Menu.find().lean(),
    Page.find({}, { slug: 1, title: 1 }).lean(),
  ]);

  const liveSlugs = new Set(pages.map((p) => p.slug));
  const titleBySlug = new Map(pages.map((p) => [p.slug, p.title]));

  const heal = async (storedSlug) => {
    if (moveMap && moveMap.has(storedSlug)) return moveMap.get(storedSlug);
    if (liveSlugs.has(storedSlug)) return storedSlug;
    const target = await resolveRedirect(storedSlug);
    if (target && liveSlugs.has(target)) return target;
    return null;
  };

  for (const menu of menus) {
    const items = cloneMenuItems(menu.items);
    const before = JSON.stringify(items);
    let dirty = false;
    const renests = [];

    // Pass 1 — heal every page item's address.
    for (const desired of collectDesiredPageSlugs(items)) {
      const node = desired.node;
      const storedSlug = node.pageSlug;
      const storedTitle = titleBySlug.get(storedSlug);
      const healed = await heal(storedSlug);

      if (healed) {
        if (healed !== storedSlug) {
          node.pageSlug = healed;
          dirty = true;
          renests.push({ from: storedSlug, to: healed });
        }
        // Keep the link pointing at the page's REAL slug even when its menu
        // position no longer matches — a working link beats a "correct" but
        // dead one.
        if (node.url !== `/${healed}`) {
          node.url = `/${healed}`;
          dirty = true;
        }
        // Only refresh the label when it was auto-derived from the page title,
        // so custom navigation labels are never clobbered.
        const liveTitle = titleBySlug.get(healed);
        if (liveTitle && storedTitle && node.label === storedTitle && node.label !== liveTitle) {
          node.label = liveTitle;
          dirty = true;
        }
      } else {
        warnings.push(
          `Menu "${menu.name}": "${node.label || storedSlug}" points to /${storedSlug}, which no longer exists.`,
        );
      }
    }

    // Pass 2 — re-nest healed items under the parent they now belong to.
    // Without this a footer would keep the item under the old parent and then
    // pull the page back the next time that menu is saved (flip-flop).
    //
    // Pass 1 already stamped the new slug onto the node, so detach by THAT.
    for (const renest of renests) {
      const placement = placePageItemInFolder(items, renest.to, folderOf(renest.to));
      if (placement.placed) dirty = true;
      if (placement.missingParent) {
        warnings.push(
          `Menu "${menu.name}": "${renest.to}" has no parent matching "/${placement.missingParent}" — the link was updated but the item stays where it is.`,
        );
      }
    }

    normalizeMenuItems(items);

    if (dirty || JSON.stringify(items) !== before) {
      await Menu.updateOne({ _id: menu._id }, { $set: { items } });
      changed.push(menu.name);
    }
  }

  return { changed, warnings };
}

/* ------------------------------------------------------------------ *
 * Entry points used by the API routes
 * ------------------------------------------------------------------ */

/**
 * Called after the Page Builder saves a page whose slug changed
 * (including a "Parent Menu" change).
 *
 * @param {{ oldSlug: string, newSlug: string, title?: string }} params
 */
async function syncAfterPageChange({ oldSlug, newSlug, title = "" } = {}) {
  const warnings = [];
  const movedPages = [];

  if (!oldSlug || !newSlug || oldSlug === newSlug) {
    return { changedMenus: [], movedPages, conflicts: [], warnings };
  }

  // The page itself is already saved under newSlug — move its descendants.
  const remaining = await Page.find({}, { slug: 1 }).lean();
  const planned = planPageMoves(
    [{ from: oldSlug, to: newSlug }],
    remaining.map((p) => p.slug),
  );

  const applied = await applyPageMoves(planned, "page_move");
  if (applied.conflicts.length) {
    warnings.push(
      `Could not move ${applied.conflicts.length} nested page(s) to /${newSlug} — those addresses are already in use.`,
    );
  } else {
    movedPages.push(...applied.moved);
  }

  // Re-nest this page's menu item under the new parent folder (R1).
  //
  // The menus still hold the OLD address at this point, so search for both
  // the old and the new slug — otherwise a Parent Menu change would save the
  // page but leave the menu item sitting under the previous parent.
  const folder = folderOf(newSlug);
  const candidates = [oldSlug, newSlug];
  const menus = await Menu.find().lean();
  for (const menu of menus) {
    const items = cloneMenuItems(menu.items);
    if (!containsAnyPageItem(items, candidates)) continue;

    const placement = placePageItemInFolder(items, candidates, folder, newSlug);
    if (placement.missingParent) {
      warnings.push(
        `Menu "${menu.name}" has no parent matching "/${placement.missingParent}" — "${newSlug}" was placed at the top level instead.`,
      );
    }
    normalizeMenuItems(items);
    await Menu.updateOne({ _id: menu._id }, { $set: { items } });
  }

  // Finally make every other menu consistent (R4).
  const repaired = await repairAllMenus(new Map(movedPages.map((m) => [m.from, m.to])));
  warnings.push(...repaired.warnings);

  await clearRedirectsTargeting(newSlug);

  return {
    changedMenus: repaired.changed,
    movedPages,
    conflicts: applied.conflicts,
    warnings,
  };
}

/**
 * Called after the Menu editor saves a menu structure.
 *
 * @param {{ menuName: string, items: Array }} params
 */
async function syncAfterMenuSave({ menuName, items } = {}) {
  const conflicts = [];
  const warnings = [];
  const movedPages = [];

  const tree = Array.isArray(items) ? items : [];
  const desired = collectDesiredPageSlugs(tree);

  // R2: only the folder is authoritative — the basename is preserved.
  const baseMoves = desired
    .filter((d) => d.currentSlug !== d.desiredSlug)
    .map((d) => ({ from: d.currentSlug, to: d.desiredSlug }));

  if (baseMoves.length) {
    const allSlugs = await Page.find({}, { slug: 1 }).lean();
    const planned = planPageMoves(
      baseMoves,
      allSlugs.map((p) => p.slug),
    );
    const applied = await applyPageMoves(planned, "menu_move");

    if (applied.conflicts.length) {
      conflicts.push(...applied.conflicts);
      warnings.push(
        `${applied.conflicts.length} item(s) could not change address because the target slug is already used. Their menu links were kept pointing at the existing page, so no link is broken.`,
      );
    } else {
      movedPages.push(...applied.moved);
    }
  }

  // Re-point the saved items at whatever slug actually ended up live, so the
  // stored menu never renders a 404.
  const liveSlugs = new Set(
    (await Page.find({}, { slug: 1 }).lean()).map((p) => p.slug),
  );
  const moveMap = new Map(movedPages.map((m) => [m.from, m.to]));
  for (const entry of collectDesiredPageSlugs(tree)) {
    const viaMove = moveMap.get(entry.node.pageSlug);
    if (viaMove) {
      entry.node.pageSlug = viaMove;
    } else if (!liveSlugs.has(entry.node.pageSlug)) {
      const target = await resolveRedirect(entry.node.pageSlug);
      if (target && liveSlugs.has(target)) entry.node.pageSlug = target;
    }
    if (!liveSlugs.has(entry.node.pageSlug)) {
      warnings.push(
        `"${entry.node.label || entry.node.pageSlug}" points to /${entry.node.pageSlug}, which no longer exists.`,
      );
    }
  }

  normalizeMenuItems(tree);

  // R4 — repair every other menu (footer, other headers, ...).
  const repaired = await repairAllMenus(moveMap);
  warnings.push(...repaired.warnings);

  return {
    items: tree,
    movedPages,
    conflicts,
    warnings,
    changedMenus: [menuName, ...repaired.changed].filter(Boolean),
  };
}

/* ------------------------------------------------------------------ *
 * Misc helpers used by the public site
 * ------------------------------------------------------------------ */

/** Look up a page by slug, transparently following slug redirects. */
async function findPageWithRedirect(slug) {
  const clean = String(slug || "").trim().toLowerCase();
  if (!clean) return { page: null, redirected: false };

  const direct = await Page.findOne({ slug: clean, status: "published" })
    .populate("layout.componentId")
    .lean();
  if (direct) return { page: direct, redirected: false };

  const target = await resolveRedirect(clean);
  if (target) {
    const page = await Page.findOne({ slug: target, status: "published" })
      .populate("layout.componentId")
      .lean();
    if (page) return { page, redirected: true, redirectTo: target };
  }

  return { page: null, redirected: false };
}

/** Safe ObjectId cast used when re-saving cloned menu items. */
function castMenuItemsForSave(items) {
  const walk = (list) => {
    if (!Array.isArray(list)) return list;
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      if (
        item._id &&
        typeof item._id === "string" &&
        mongoose.Types.ObjectId.isValid(item._id)
      ) {
        item._id = new mongoose.Types.ObjectId(item._id);
      }
      if (Array.isArray(item.children)) walk(item.children);
    }
    return list;
  };
  return walk(items);
}

module.exports = {
  // path helpers
  slugifyMenuLabel,
  folderOf,
  basenameOf,
  expectedSlugFor,
  // tree helpers
  cloneMenuItems,
  normalizeMenuItems,
  collectDesiredPageSlugs,
  containsAnyPageItem,
  detachPageItem,
  findContainerByPath,
  removePageItems,
  placePageItemInFolder,
  // moves
  planPageMoves,
  applyPageMoves,
  recordRedirect,
  resolveRedirect,
  clearRedirectsTargeting,
  // cross-menu
  repairAllMenus,
  // entry points
  syncAfterPageChange,
  syncAfterMenuSave,
  // misc
  findPageWithRedirect,
  castMenuItemsForSave,
};