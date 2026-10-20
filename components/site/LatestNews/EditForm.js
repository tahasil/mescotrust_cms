"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Row,
  Col,
  Collapse,
  Select,
  message,
  Spin,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  PDF_LINK_TARGET_OPTIONS,
  normalizePdfTarget,
} from "@/components/site/shared/PdfViewerModal";

const API_PATH = "/api/theme/LatestNews";
// Keep the persisted latestEvents1* namespace so existing CMS content remains editable.

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function validateLink(_, value) {
  const link = String(value || "").trim();
  if (!link) return Promise.resolve();
  if (link.startsWith("/") || isValidHttpUrl(link)) return Promise.resolve();

  return Promise.reject(
    new Error("Enter an internal path, external http(s) URL, or choose a file."),
  );
}

function normalizeItem(it) {
  const configuredTarget = String(it?.target || it?.buttonTarget || "")
    .trim()
    .toLowerCase();
  const legacyTarget =
    Boolean(it?.buttonOpenInNewTab ?? it?.openInNewTab) ||
    String(it?.target || it?.buttonTarget || "").toLowerCase() === "_blank";
  return {
    date: it?.date != null ? String(it.date).trim() : "",
    title: it?.title != null ? String(it.title).trim() : "",
    buttonLink:
      it?.buttonLink != null && String(it.buttonLink).trim() !== "/"
        ? String(it.buttonLink).trim()
        : "",
    target:
      configuredTarget === "modal"
        ? "modal"
        : normalizePdfTarget(configuredTarget, legacyTarget ? "_blank" : "_self"),
  };
}

/**
 * Edit form for Latest News — same pattern as HomeHero/Subscribe.
 * Loads/saves via /api/theme/LatestNews. Section titles + list of news items + theme color keys.
 */
function LatestNewsEditForm(
  { source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] },
  ref
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const items = Array.isArray(data?.latestEvents1Items)
        ? data.latestEvents1Items.map(normalizeItem)
        : [];
      form.setFieldsValue({
        latestEvents1SubTitle: data?.latestEvents1SubTitle != null ? String(data.latestEvents1SubTitle).trim() : "Latest News",
        latestEvents1MainTitle: data?.latestEvents1MainTitle != null ? String(data.latestEvents1MainTitle).trim() : "Stay Informed. Stay Ahead.",
        latestEvents1Items: items.length ? items : [normalizeItem({}), normalizeItem({})],
        latestEvents1SubTitleColorKey: data?.latestEvents1SubTitleColorKey != null ? String(data.latestEvents1SubTitleColorKey).trim() : "",
        latestEvents1MainTitleColorKey: data?.latestEvents1MainTitleColorKey != null ? String(data.latestEvents1MainTitleColorKey).trim() : "",
        latestEvents1TagColorKey: data?.latestEvents1TagColorKey != null ? String(data.latestEvents1TagColorKey).trim() : "",
        latestEvents1TagBorderColorKey: data?.latestEvents1TagBorderColorKey != null ? String(data.latestEvents1TagBorderColorKey).trim() : "",
        latestEvents1ItemTitleColorKey: data?.latestEvents1ItemTitleColorKey != null ? String(data.latestEvents1ItemTitleColorKey).trim() : "",
        latestEvents1BorderColorKey: data?.latestEvents1BorderColorKey != null ? String(data.latestEvents1BorderColorKey).trim() : "",
        latestEvents1ArrowColorKey: data?.latestEvents1ArrowColorKey != null ? String(data.latestEvents1ArrowColorKey).trim() : "",
        latestEvents1ArrowHoverColorKey: data?.latestEvents1ArrowHoverColorKey != null ? String(data.latestEvents1ArrowHoverColorKey).trim() : "",
        ...getManageSectionInitialValues("latestEvents1", data),
      });
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            const palette = theme?.themePalette || {};
            const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
            const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
            setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));

        const items = Array.isArray(data?.latestEvents1Items)
          ? data.latestEvents1Items.map(normalizeItem)
          : [];
        form.setFieldsValue({
          latestEvents1SubTitle: data?.latestEvents1SubTitle != null ? String(data.latestEvents1SubTitle).trim() : "Latest News",
          latestEvents1MainTitle: data?.latestEvents1MainTitle != null ? String(data.latestEvents1MainTitle).trim() : "Stay Informed. Stay Ahead.",
          latestEvents1Items: items.length ? items : [normalizeItem({}), normalizeItem({})],
          latestEvents1SubTitleColorKey: data?.latestEvents1SubTitleColorKey != null ? String(data.latestEvents1SubTitleColorKey).trim() : "",
          latestEvents1MainTitleColorKey: data?.latestEvents1MainTitleColorKey != null ? String(data.latestEvents1MainTitleColorKey).trim() : "",
          latestEvents1TagColorKey: data?.latestEvents1TagColorKey != null ? String(data.latestEvents1TagColorKey).trim() : "",
          latestEvents1TagBorderColorKey: data?.latestEvents1TagBorderColorKey != null ? String(data.latestEvents1TagBorderColorKey).trim() : "",
          latestEvents1ItemTitleColorKey: data?.latestEvents1ItemTitleColorKey != null ? String(data.latestEvents1ItemTitleColorKey).trim() : "",
          latestEvents1BorderColorKey: data?.latestEvents1BorderColorKey != null ? String(data.latestEvents1BorderColorKey).trim() : "",
          latestEvents1ArrowColorKey: data?.latestEvents1ArrowColorKey != null ? String(data.latestEvents1ArrowColorKey).trim() : "",
          latestEvents1ArrowHoverColorKey: data?.latestEvents1ArrowHoverColorKey != null ? String(data.latestEvents1ArrowHoverColorKey).trim() : "",
          ...getManageSectionInitialValues("latestEvents1", data),
        });
      })
      .catch(() => message.error("Failed to load Latest News"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.latestEvents1Items ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        latestEvents1SubTitle: values.latestEvents1SubTitle != null ? String(values.latestEvents1SubTitle).trim() : "Latest News",
        latestEvents1MainTitle: values.latestEvents1MainTitle != null ? String(values.latestEvents1MainTitle).trim() : "Stay Informed. Stay Ahead.",
        latestEvents1Items: items,
        latestEvents1SubTitleColorKey: values.latestEvents1SubTitleColorKey != null ? String(values.latestEvents1SubTitleColorKey).trim() : "",
        latestEvents1MainTitleColorKey: values.latestEvents1MainTitleColorKey != null ? String(values.latestEvents1MainTitleColorKey).trim() : "",
        latestEvents1TagColorKey: String(values.latestEvents1TagColorKey ?? "").trim(),
        latestEvents1TagBorderColorKey: String(values.latestEvents1TagBorderColorKey ?? "").trim(),
        latestEvents1ItemTitleColorKey: String(values.latestEvents1ItemTitleColorKey ?? "").trim(),
        latestEvents1BorderColorKey: String(values.latestEvents1BorderColorKey ?? "").trim(),
        latestEvents1ArrowColorKey: String(values.latestEvents1ArrowColorKey ?? "").trim(),
        latestEvents1ArrowHoverColorKey: String(values.latestEvents1ArrowHoverColorKey ?? "").trim(),
        ...getManageSectionPayload("latestEvents1", values),
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
          message.success("Latest News saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save Latest News"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }));

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form preserve={true} form={form} layout="vertical">
      <Collapse
        destroyInactivePanel={false}
        defaultActiveKey={[]}
        items={[
          {
            key: "section",
            label: "Manage Section",
            children: <ManageSectionFields prefix="latestEvents1" form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("LatestNews")} />,
          },
          {
            key: "items",
            label: "Manage Items",
            children: (
              <Form.List name="latestEvents1Items">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Item"
                    addButtonText="Add item"
                    defaultAddPayload={normalizeItem({})}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "date"]} label="Date">
                            <Input placeholder="e.g. 02 Feb 2026" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "title"]} label="Title">
                            <Input placeholder="News title" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "buttonLink"]}
                            label="Link"
                            extra="Enter an internal route or external URL, or choose a downloadable file."
                            rules={[{ validator: validateLink }]}
                          >
                            <MediaPickerInput
                              mediaType="document"
                              showVariants={false}
                              placeholder="/news or https://example.com/news"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "target"]}
                            label="Target"
                          >
                            <Select
                              options={PDF_LINK_TARGET_OPTIONS}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  />
                )}
              </Form.List>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(LatestNewsEditForm);
