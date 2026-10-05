/**
 * End-to-end tests for the Page <-> Menu sync engine.
 *
 * Each test builds a throwaway hierarchy, performs the real mutation the
 * admin UI performs, and asserts the whole site stays link-clean. Everything
 * created here is removed in `after()`.
 *
 * Scenarios covered (the ones that used to 404):
 *   1. Page Builder  -> change "Parent Menu" for a page
 *   2. Menu editor   -> move a sub-item from one parent to another
 *   3. Menu editor   -> reorder siblings (no address change)
 *   4. Moving a parent must drag every descendant page along
 *   5. A page referenced from a second menu must stay linked
 *   6. The old URL must redirect instead of 404
 *   7. Deleting a page must remove it from every menu
 */

const path = require("path");
const Module = require("module");
const test = require("node:test");
const assert = require("node:assert/strict");

const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env"), override: true });

// Resolve the `@/` alias used throughout lib/ so this script can require it.
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveWithAlias(request, ...rest) {
  if (request.startsWith("@/")) {
    return originalResolve.call(this, path.join(projectRoot, request.slice(2)), ...rest);
  }
  return originalResolve.call(this, request, ...rest);
};

const mongoose = require("mongoose");
const sync = require("@/lib/menuPageSync");
const Page = require("@/models/Page");
const Menu = require("@/models/Menu");
const PageSlugRedirect = require("@/models/PageSlugRedirect");

const NS = "synctest";
let connected = false;

async function db() {
  if (!connected) {
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
  }
  return mongoose.connection.db;
}

const page = (slug, title) => ({
  title,
  slug,
  status: "published",
  layout: [],
  meta: {},
});

/** Build a menu tree from a compact description. */
function item(label, extra = {}) {
  return {
    label,
    url: extra.pageSlug ? `/${extra.pageSlug}` : extra.url || "#",
    order: extra.order ?? 0,
    openInNewTab: false,
    target: "_self",
    type: extra.type || (extra.pageSlug ? "page" : "custom_link"),
    pageSlug: extra.pageSlug || "",
    children: extra.children || [],
  };
}

/** Every page item in a menu, with the folder its position implies. */
function menuPageRefs(items, ancestors = []) {
  const out = [];
  for (const it of items || []) {
    if (it.type === "page" && it.pageSlug) out.push({ label: it.label, slug: it.pageSlug });
    if (it.children?.length) {
      out.push(...menuPageRefs(it.children, [...ancestors, it.label]));
    }
  }
  return out;
}

/** Assert that every menu link on the whole site resolves to a live page. */
async function assertNoBrokenLinks(context) {
  const live = new Set((await Page.find({}, { slug: 1 }).lean()).map((p) => p.slug));
  const menus = await Menu.find().lean();
  const broken = [];
  for (const menu of menus) {
    for (const ref of menuPageRefs(menu.items)) {
      if (!live.has(ref.slug)) {
        broken.push(`menu "${menu.name}" → "${ref.label}" → /${ref.slug}`);
      }
      if (!ref.slug.startsWith(`${NS}/`) && !live.has(ref.slug)) {
        broken.push(`PRE-EXISTING ${menu.name} → /${ref.slug}`);
      }
    }
  }
  assert.deepEqual(broken, [], `broken links after ${context}:\n  ${broken.join("\n  ")}`);
}

const createdMenus = [];
const createdPageIds = [];

test("Page <-> Menu sync", async (t) => {
  await db();

  const pagesCol = mongoose.connection.db.collection("pages");
  const menusCol = mongoose.connection.db.collection("menus");

  // Pre-clean in case a previous run was interrupted.
  await pagesCol.deleteMany({ slug: new RegExp(`^${NS}/`) });
  await menusCol.deleteMany({ name: new RegExp(`^${NS}-`) });
  await PageSlugRedirect.deleteMany({
    $or: [{ from: new RegExp(`^${NS}/`) }, { to: new RegExp(`^${NS}/`) }],
  });

  t.after(async () => {
    // Delete by captured id rather than by slug pattern, so a fixture bug can
    // never leave stray pages behind on a real database.
    for (const name of createdMenus) await Menu.deleteOne({ name });
    if (createdPageIds.length) {
      await pagesCol.deleteMany({ _id: { $in: createdPageIds } });
    }
    await PageSlugRedirect.deleteMany({
      $or: [{ from: new RegExp(`^${NS}/`) }, { to: new RegExp(`^${NS}/`) }],
    });
    if (connected) {
      await mongoose.disconnect();
      connected = false;
    }
  });

  /* -------------------------------------------------------------- *
   * Fixture
   *
   * A page's folder comes from the labels of its ancestors, so the whole
   * fixture lives under one top-level container labelled "SyncTest"
   * -> folder "synctest". That keeps it isolated from real site content.
   *
   *   SyncTest/
   *     Media/
   *       newsletter              (page)
   *       newsletter-archive/     (page, has its own child page)
   *     About/
   *       team                    (page)
   *       contact                 (page)
   *
   * The "newsletter" page is also linked from a second menu so we can prove
   * cross-menu references get repaired.
   * -------------------------------------------------------------- */
  const created = await Page.create([
    page(`${NS}/media/newsletter`, "Newsletter"),
    page(`${NS}/media/newsletter-archive`, "Newsletter Archive"),
    page(`${NS}/media/newsletter-archive/2024`, "Archive 2024"),
    page(`${NS}/about/team`, "Our Team"),
    page(`${NS}/about/contact`, "Contact Us"),
  ]);
  createdPageIds.push(...created.map((p) => p._id));

  const headerItems = () => [
    item("SyncTest", {
      children: [
        item("Media", {
          children: [
            item("Newsletter", { pageSlug: `${NS}/media/newsletter`, order: 0 }),
            item("Newsletter Archive", {
              pageSlug: `${NS}/media/newsletter-archive`,
              order: 1,
            }),
          ],
        }),
        item("About", {
          children: [
            item("Our Team", { pageSlug: `${NS}/about/team`, order: 0 }),
            item("Contact Us", { pageSlug: `${NS}/about/contact`, order: 1 }),
          ],
        }),
      ],
    }),
  ];

  const header = await Menu.create({ name: `${NS}-header`, items: headerItems() });
  const footer = await Menu.create({ name: `${NS}-footer`, items: headerItems() });
  createdMenus.push(header.name, footer.name);

  await assertNoBrokenLinks("fixture creation");

  /* -------------------------------------------------------------- *
   * 1 + 2. Move "Newsletter" from Media to About (menu editor)
   * -------------------------------------------------------------- */
  await t.test("moving a sub-item between parents updates page + all menus", async () => {
    const menu = await Menu.findOne({ name: `${NS}-header` }).lean();
    const items = sync.cloneMenuItems(menu.items);

    // Admin drags Newsletter onto "About" — same tree, new nesting.
    const root = items.find((i) => i.label === "SyncTest");
    const media = root.children.find((i) => i.label === "Media");
    const about = root.children.find((i) => i.label === "About");
    const newsletter = media.children.splice(0, 1)[0];
    about.children.push(newsletter);

    const result = await sync.syncAfterMenuSave({ menuName: menu.name, items });
    await Menu.updateOne({ name: menu.name }, { $set: { items: result.items } });

    // Page moved to the new address.
    const moved = await Page.findOne({ slug: `${NS}/about/newsletter` }).lean();
    assert.ok(moved, "page should now live at /about/newsletter");
    assert.equal(await Page.findOne({ slug: `${NS}/media/newsletter` }), null);

    // Stored menu is re-nested and the link follows the page.
    const saved = await Menu.findOne({ name: `${NS}-header` }).lean();
    const savedRoot = saved.items.find((i) => i.label === "SyncTest");
    const savedAbout = savedRoot.children.find((i) => i.label === "About");
    const newsletterNode = savedAbout.children.find((c) => c.label === "Newsletter");
    assert.ok(newsletterNode, "Newsletter should be nested under About");
    assert.equal(newsletterNode.pageSlug, `${NS}/about/newsletter`);
    assert.equal(newsletterNode.url, `/${NS}/about/newsletter`);

    // The second menu was repaired too — no stale footer link.
    const savedFooter = await Menu.findOne({ name: `${NS}-footer` }).lean();
    const fRoot = savedFooter.items.find((i) => i.label === "SyncTest");
    const fAbout = fRoot.children.find((i) => i.label === "About");
    const footerItem = fAbout.children.find((c) => c.label === "Newsletter");
    assert.ok(footerItem, "footer should still link to Newsletter");
    assert.equal(footerItem.pageSlug, `${NS}/about/newsletter`);
    assert.equal(footerItem.url, `/${NS}/about/newsletter`);

    await assertNoBrokenLinks("menu move");
  });

  /* -------------------------------------------------------------- *
   * 4. Descendants move with their parent
   * -------------------------------------------------------------- */
  await t.test("moving a parent drags descendant pages along", async () => {
    const menu = await Menu.findOne({ name: `${NS}-header` }).lean();
    const items = sync.cloneMenuItems(menu.items);

    const root = items.find((i) => i.label === "SyncTest");
    const media = root.children.find((i) => i.label === "Media");
    const archive = media.children.find((c) => c.label === "Newsletter Archive");

    // Detach the whole "Archive" branch and re-attach under About.
    media.children = media.children.filter((c) => c !== archive);
    root.children.find((i) => i.label === "About").children.push(archive);

    const result = await sync.syncAfterMenuSave({ menuName: menu.name, items });
    await Menu.updateOne({ name: menu.name }, { $set: { items: result.items } });

    const movedParent = await Page.findOne({ slug: `${NS}/about/newsletter-archive` }).lean();
    assert.ok(movedParent, "parent page moved to /about/newsletter-archive");

    const movedChild = await Page.findOne({ slug: `${NS}/about/newsletter-archive/2024` }).lean();
    assert.ok(
      movedChild,
      "grandchild page must move too — otherwise its old URL 404s",
    );

    await assertNoBrokenLinks("subtree move");
  });

  /* -------------------------------------------------------------- *
   * 6. Old URLs redirect
   * -------------------------------------------------------------- */
  await t.test("the previous URLs now redirect instead of 404", async () => {
    assert.equal(
      await sync.resolveRedirect(`${NS}/media/newsletter`),
      `${NS}/about/newsletter`,
    );
    assert.equal(
      await sync.resolveRedirect(`${NS}/media/newsletter-archive/2024`),
      `${NS}/about/newsletter-archive/2024`,
    );

    // And the destination really exists.
    const live = await Page.findOne({ slug: `${NS}/about/newsletter` }).lean();
    assert.ok(live);
  });

  /* -------------------------------------------------------------- *
   * 3. Reordering must not change addresses
   * -------------------------------------------------------------- */
  await t.test("reordering siblings keeps every address stable", async () => {
    const menu = await Menu.findOne({ name: `${NS}-header` }).lean();
    const items = sync.cloneMenuItems(menu.items);
    const before = (await Page.find({}, { slug: 1 }).lean()).map((p) => p.slug).sort();

    const root = items.find((i) => i.label === "SyncTest");
    const about = root.children.find((i) => i.label === "About");
    const [first, second] = about.children;
    about.children = [second, first]; // swap positions only

    const result = await sync.syncAfterMenuSave({ menuName: menu.name, items });
    await Menu.updateOne({ name: menu.name }, { $set: { items: result.items } });

    const after = (await Page.find({}, { slug: 1 }).lean()).map((p) => p.slug).sort();
    assert.deepEqual(after, before, "reorder must not rename any page");
    assert.deepEqual(result.movedPages, []);

    // `order` is re-indexed to match the new visual sequence.
    const saved = await Menu.findOne({ name: `${NS}-header` }).lean();
    const savedAbout = saved.items
      .find((i) => i.label === "SyncTest")
      .children.find((i) => i.label === "About");
    assert.equal(savedAbout.children[0].label, second.label);
    assert.equal(savedAbout.children[0].order, 0);
    assert.equal(savedAbout.children[1].label, first.label);
    assert.equal(savedAbout.children[1].order, 1);

    await assertNoBrokenLinks("reorder");
  });

  /* -------------------------------------------------------------- *
   * 1. Page Builder "Parent Menu" change
   * -------------------------------------------------------------- */
  await t.test("Page Builder Parent Menu change re-nests the menu item", async () => {
    const target = await Page.findOne({ slug: `${NS}/about/contact` }).lean();
    const oldSlug = target.slug;

    // The admin picks "media" in the Parent Menu dropdown.
    await Page.updateOne({ _id: target._id }, { $set: { slug: `${NS}/media/contact` } });

    const result = await sync.syncAfterPageChange({
      oldSlug,
      newSlug: `${NS}/media/contact`,
      title: target.title,
    });

    const headerMenu = await Menu.findOne({ name: `${NS}-header` }).lean();
    const mediaNode = headerMenu.items
      .find((i) => i.label === "SyncTest")
      .children.find((i) => i.label === "Media");
    const contactInMedia = mediaNode.children.find((c) => c.label === "Contact Us");
    assert.ok(
      contactInMedia,
      "page should have been re-nested under Media in the header menu",
    );
    assert.equal(contactInMedia.pageSlug, `${NS}/media/contact`);
    assert.equal(contactInMedia.url, `/${NS}/media/contact`);

    // The footer, which never moved this page, was repaired.
    const footerMenu = await Menu.findOne({ name: `${NS}-footer` }).lean();
    const footerContact = footerMenu.items
      .find((i) => i.label === "SyncTest")
      .children.find((i) => i.label === "Media")
      .children.find((c) => c.label === "Contact Us");
    assert.ok(footerContact, "footer link should still exist");
    assert.equal(footerContact.pageSlug, `${NS}/media/contact`);
    assert.equal(footerContact.url, `/${NS}/media/contact`);

    assert.deepEqual(result.conflicts, []);
    await assertNoBrokenLinks("parent menu change");
  });

  /* -------------------------------------------------------------- *
   * 7. Deleting a page cleans every menu
   * -------------------------------------------------------------- */
  await t.test("deleting a page removes it from every menu", async () => {
    const victim = await Page.findOne({ slug: `${NS}/about/newsletter` }).lean();
    await Page.deleteOne({ _id: victim._id });

    for (const name of createdMenus) {
      const menu = await Menu.findOne({ name }).lean();
      const items = sync.cloneMenuItems(menu.items);
      const removed = sync.removePageItems(items, victim.slug);
      if (removed) {
        await Menu.updateOne({ name }, { $set: { items: sync.normalizeMenuItems(items) } });
      }
    }

    for (const name of createdMenus) {
      const menu = await Menu.findOne({ name }).lean();
      const refs = menuPageRefs(menu.items).map((r) => r.slug);
      assert.ok(
        !refs.includes(`${NS}/about/newsletter`),
        `${name} should no longer link to the deleted page`,
      );
    }

    await assertNoBrokenLinks("page deletion");
  });
});