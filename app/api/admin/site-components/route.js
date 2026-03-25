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
      let displayName = m?.displayName ?? id;
      if (id === "OverviewOfOurWork" && (!displayName || displayName === "Awards Recognition")) {
        displayName = "Overview of Our Work";
      }
      if (id === "ImageSlider" && (!displayName || displayName === "ImageSlider")) {
        displayName = "Circular Slider";
      }
      return {
        componentId: id,
        displayName,
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

    const prefix = componentId.charAt(0).toLowerCase() + componentId.slice(1);
    const mainComponentPath = path.join(componentFolder, `${componentId}.js`);
    const mainComponentTemplate = `"use client";

import { Row, Col } from "antd";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

/**
 * Site component: ${componentId} (${displayName}).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 */
export default function ${componentId}(props) {
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");

  const sectionBgType = (props?.${prefix}SectionBgType ?? "default").toString();
  const sectionBgImage = (props?.${prefix}SectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.${prefix}SectionBgColorKey ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: \`url(\${sectionBgImage})\`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? {
            backgroundColor: getColor(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const sectionPaddingTop = props?.${prefix}SectionPaddingTop != null ? Number(props.${prefix}SectionPaddingTop) : null;
  const sectionPaddingBottom = props?.${prefix}SectionPaddingBottom != null ? Number(props.${prefix}SectionPaddingBottom) : null;
  const sectionMarginTop = props?.${prefix}SectionMarginTop != null ? Number(props.${prefix}SectionMarginTop) : null;
  const sectionMarginBottom = props?.${prefix}SectionMarginBottom != null ? Number(props.${prefix}SectionMarginBottom) : null;
  const sectionBgStyle =
    sectionBgStyleBase || sectionPaddingTop != null || sectionPaddingBottom != null || sectionMarginTop != null || sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0 ? { paddingTop: \`\${sectionPaddingTop}px\` } : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0 ? { paddingBottom: \`\${sectionPaddingBottom}px\` } : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0 ? { marginTop: \`\${sectionMarginTop}px\` } : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0 ? { marginBottom: \`\${sectionMarginBottom}px\` } : {}),
        }
      : undefined;

  const pageContainerBgType = (props?.${prefix}PageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.${prefix}PageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.${prefix}PageContainerBgColorKey ?? "").toString().trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: \`url(\${pageContainerBgImage})\`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const containerPaddingTop = props?.${prefix}PageContainerPaddingTop != null ? Number(props.${prefix}PageContainerPaddingTop) : null;
  const containerPaddingRight = props?.${prefix}PageContainerPaddingRight != null ? Number(props.${prefix}PageContainerPaddingRight) : null;
  const containerPaddingBottom = props?.${prefix}PageContainerPaddingBottom != null ? Number(props.${prefix}PageContainerPaddingBottom) : null;
  const containerPaddingLeft = props?.${prefix}PageContainerPaddingLeft != null ? Number(props.${prefix}PageContainerPaddingLeft) : null;
  const containerMarginTop = props?.${prefix}PageContainerMarginTop != null ? Number(props.${prefix}PageContainerMarginTop) : null;
  const containerMarginBottom = props?.${prefix}PageContainerMarginBottom != null ? Number(props.${prefix}PageContainerMarginBottom) : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase || containerPaddingTop != null || containerPaddingRight != null || containerPaddingBottom != null || containerPaddingLeft != null || containerMarginTop != null || containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0 ? { paddingTop: \`\${containerPaddingTop}px\` } : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0 ? { paddingRight: \`\${containerPaddingRight}px\` } : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0 ? { paddingBottom: \`\${containerPaddingBottom}px\` } : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0 ? { paddingLeft: \`\${containerPaddingLeft}px\` } : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0 ? { marginTop: \`\${containerMarginTop}px\` } : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0 ? { marginBottom: \`\${containerMarginBottom}px\` } : {}),
        }
      : undefined;

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <Row gutter={[16, 16]}>
          <Col span={24} className="mb-4">
            <SubTitle>{subTitle}</SubTitle>
            <MainTitle color={titleColor}>{mainTitle}</MainTitle>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            {/* Add your content here */}
          </Col>
        </Row>
      </PageContainer>
    </FullWidthBackground>
  );
}
`;
    writeFileSync(mainComponentPath, mainComponentTemplate, "utf8");

    const editFormPath = path.join(componentFolder, "EditForm.js");
    const editFormTemplate = `"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, message, Spin, Collapse } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/${componentId}";
const PREFIX = "${prefix}";

/**
 * Edit form for ${componentId} — used in component edit drawer.
 * Includes Manage Section (background/padding) and Title & Colors by default.
 * Loads/saves via API_PATH (Component defaultProps).
 */
function ${componentId}EditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
      return;
    }
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      form.setFieldsValue({
        mainTitle: data.mainTitle ?? "Section Title",
        subTitle: data.subTitle ?? "Subtitle",
        titleColorKey: data.titleColorKey ?? "",
        ...getManageSectionInitialValues(PREFIX, data),
        ...data,
      });
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        form.setFieldsValue({
          mainTitle: (data && data.mainTitle) ?? "Section Title",
          subTitle: (data && data.subTitle) ?? "Subtitle",
          titleColorKey: (data && data.titleColorKey) ?? "",
          ...getManageSectionInitialValues(PREFIX, data),
          ...(data && typeof data === "object" ? data : {}),
        });
      })
      .catch(() => message.error("Failed to load ${componentId}"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...values,
        ...getManageSectionPayload(PREFIX, values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <Collapse
        defaultActiveKey={["manage-section", "title-colors", "content"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("${componentId}")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item name="subTitle" label="Subtitle">
                  <Input placeholder="Subtitle" />
                </Form.Item>
                <Form.Item name="mainTitle" label="Main title">
                  <Input placeholder="Section Title" />
                </Form.Item>
                <p style={{ color: "#666", marginTop: 16 }}>Add more fields in EditForm.js as needed.</p>
              </>
            ),
          },
        ]}
      />
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
      // Add to EDITABLE_SITE_EDIT_FORMS (last entry before "};") so Page Builder drawer uses same EditForm
      const editFormsMatch = siteIndexContent.match(
        /(EDITABLE_SITE_EDIT_FORMS\s*=\s*\{[\s\S]*)(  \w+: \w+EditForm,)(\n\s*)\};/
      );
      if (editFormsMatch && !siteIndexContent.includes(`${componentId}: ${componentId}EditForm`)) {
        siteIndexContent = siteIndexContent.replace(
          editFormsMatch[0],
          editFormsMatch[1] +
            editFormsMatch[2] +
            editFormsMatch[3] +
            `  ${componentId}: ${componentId}EditForm,\n};`
        );
      }
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
