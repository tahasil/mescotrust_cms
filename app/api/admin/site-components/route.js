import { NextResponse } from "next/server";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import path from "path";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import Component from "@/models/Component";
import { getRegistryIdsFromDisk } from "@/lib/getRegistryIdsFromDisk";

/** GET: list all site components (registry + custom from DB) with metadata */
export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const allMetas = await SiteComponentMeta.find({}).lean();
    const metaById = {};
    allMetas.forEach((m) => {
      metaById[m.componentId] = m;
    });

    const idsFromRegistry = getRegistryIdsFromDisk();
    const customIds = allMetas.map((m) => m.componentId).filter((id) => !idsFromRegistry.includes(id));
    const allIds = [...new Set([...idsFromRegistry, ...customIds])];

    const list = allIds.map((id, index) => {
      const m = metaById[id];
      const defaultPosition = id === "Header" ? "before" : "after";
      return {
        componentId: id,
        displayName: m?.displayName ?? id,
        global: m?.global ?? false,
        order: m?.order ?? index,
        position: m?.position ?? defaultPosition,
        enabled: m?.enabled !== false,
      };
    });

    list.sort((a, b) => (a.order !== b.order ? a.order - b.order : a.componentId.localeCompare(b.componentId)));

    const filtered = list.filter((item) => item.componentId !== "LatestEvents");
    return NextResponse.json(filtered);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: create new site component — creates 3-file folder, registry, index, Component doc.
 * New components must follow same pattern as LatestEvents1: add to EDITABLE_SITE_EDIT_FORMS
 * and add edit-page snapshot/preview/refetch in components/[id]/edit/page.js.
 * See docs/NEW_SITE_COMPONENT_CHECKLIST.md.
 */
export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const displayName = (body.displayName || "").trim();
    if (!displayName) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }

    // System-generated component ID from display name: no spaces, alphanumeric, unique
    let baseName = displayName.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    if (!baseName) {
      return NextResponse.json({ error: "Display name must contain at least one letter or number" }, { status: 400 });
    }
    if (!/^[a-zA-Z]/.test(baseName)) baseName = "C" + baseName;

    await connectDB();
    let componentId = baseName;
    let suffix = 0;
    while (await SiteComponentMeta.findOne({ componentId })) {
      suffix += 1;
      componentId = `${baseName}${suffix}`;
    }
    const global = Boolean(body.global);
    const order = Number(body.order) ?? 0;
    const position = body.position === "after" ? "after" : "before";

    const root = process.cwd();
    const siteDir = path.join(root, "components", "site");
    const componentFolder = path.join(siteDir, componentId);
    mkdirSync(componentFolder, { recursive: true });

    const mainComponentPath = path.join(componentFolder, `${componentId}.js`);
    const mainComponentTemplate = `"use client";

/**
 * Site component: ${componentId} (${displayName}).
 * Add your UI code below. Props come from theme/Component defaultProps.
 */
export default function ${componentId}(props) {
  return (
    <section className="site-component-${componentId.toLowerCase()}" data-component="${componentId}">

    </section>
  );
}
`;
    writeFileSync(mainComponentPath, mainComponentTemplate, "utf8");

    const editFormPath = path.join(componentFolder, "EditForm.js");
    const editFormTemplate = `"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, message, Spin } from "antd";

const API_PATH = "/api/theme/${componentId}";

/**
 * Edit form for ${componentId} — used in component edit drawer (same pattern as HomeHero/Marquee).
 * Loads/saves via \${API_PATH} (components collection).
 */
function ${componentId}EditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      form.setFieldsValue(data);
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        form.setFieldsValue(data && typeof data === "object" ? data : {});
      })
      .catch(() => message.error("Failed to load ${componentId}"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(values);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("${displayName} saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <p style={{ color: "#666" }}>Add configuration fields in EditForm.js. Save uses \${API_PATH}.</p>
    </Form>
  );
}

export default forwardRef(${componentId}EditForm);
`;
    writeFileSync(editFormPath, editFormTemplate, "utf8");

    const folderIndexPath = path.join(componentFolder, "index.js");
    const folderIndexTemplate = `export { default } from "./${componentId}";
export { default as ${componentId}EditForm } from "./EditForm";
`;
    writeFileSync(folderIndexPath, folderIndexTemplate, "utf8");

    const registryPath = path.join(root, "lib", "siteComponentRegistry.js");
    let registryContent = readFileSync(registryPath, "utf8");
    const arrayMatch = registryContent.match(/SITE_COMPONENT_IDS\s*=\s*\[([^\]]*)\]/);
    if (arrayMatch) {
      const ids = arrayMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      if (!ids.includes(componentId)) {
        ids.push(componentId);
        registryContent = registryContent.replace(
          /(SITE_COMPONENT_IDS\s*=\s*\[)[^\]]*(\])/,
          `$1${ids.map((id) => `"${id}"`).join(", ")}$2`
        );
        writeFileSync(registryPath, registryContent, "utf8");
      }
    }

    const siteIndexPath = path.join(root, "components", "site", "index.js");
    let siteIndexContent = readFileSync(siteIndexPath, "utf8");
    const exportLine = `export { default as ${componentId}, ${componentId}EditForm } from "./${componentId}/index";`;
    if (!siteIndexContent.includes(`"./${componentId}/"`)) {
      if (!siteIndexContent.includes(exportLine)) {
        siteIndexContent = siteIndexContent.replace(
          /(export \{ default as Subscribe, SubscribeEditForm \} from "\.\/Subscribe\/index";)/,
          `$1\n${exportLine}`
        );
      }
      const importEditForm = `import ${componentId}EditForm from "./${componentId}/EditForm";`;
      if (!siteIndexContent.includes(importEditForm)) {
        siteIndexContent = siteIndexContent.replace(
          /(import SubscribeEditForm from "\.\/Subscribe\/EditForm";)/,
          `$1\nimport ${componentId}EditForm from "./${componentId}/EditForm";`
        );
      }
      siteIndexContent = siteIndexContent.replace(
        "  Subscribe: SubscribeEditForm,\n};",
        `  Subscribe: SubscribeEditForm,\n  ${componentId}: ${componentId}EditForm,\n};`
      );
      writeFileSync(siteIndexPath, siteIndexContent, "utf8");
    }

    const metaDoc = await SiteComponentMeta.create({
      componentId,
      displayName,
      global,
      order,
      position,
      enabled: true,
    });

    const existingComp = await Component.findOne({ baseComponent: componentId });
    if (!existingComp) {
      await Component.create({
        name: componentId,
        displayName,
        type: "custom",
        baseComponent: componentId,
        defaultProps: {},
        layout: [],
        active: true,
      });
    }

    return NextResponse.json(metaDoc.toObject ? metaDoc.toObject() : metaDoc);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
