"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Collapse,
  Select,
  Switch,
  message,
  Spin,
} from "antd";
import { DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/LatestEvents1";
const REQUIRED_IMAGE_WIDTH = 600;
const REQUIRED_IMAGE_HEIGHT = 455;
const REQUIRED_IMAGE_DIMENSIONS_TEXT =
  `${REQUIRED_IMAGE_WIDTH} \u00D7 ${REQUIRED_IMAGE_HEIGHT} px`;
const ALLOWED_BUTTON_LINK_EXTENSIONS_RE = /\.pdf(?:[?#].*)?$/i;
const MEDIA_ROUTE_LINK_RE = /^\/media\/([0-9a-fA-F]{24})(?:\?.*)?$/i;
const mediaMimeTypeCache = new Map();

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseMediaIdFromLink(value) {
  const match = String(value || "").trim().match(MEDIA_ROUTE_LINK_RE);
  return match ? String(match[1] || "").trim() : "";
}

async function validateButtonLink(_, value) {
  const link = String(value || "").trim();
  if (!link) return Promise.resolve();

  const mediaId = parseMediaIdFromLink(link);
  if (mediaId) {
    let mimeType = mediaMimeTypeCache.get(mediaId);
    if (!mimeType) {
      try {
        const res = await fetch(`/api/admin/media/${mediaId}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          return Promise.reject(
            new Error(data?.error || "Unable to validate selected document."),
          );
        }
        mimeType = String(data?.mimeType || "").toLowerCase().trim();
        mediaMimeTypeCache.set(mediaId, mimeType);
      } catch {
        return Promise.reject(new Error("Unable to validate selected document."));
      }
    }
    if (!mimeType || mimeType.startsWith("image/")) {
      return Promise.reject(
        new Error("Button link must be a document. Select a PDF from Media Library."),
      );
    }
    return Promise.resolve();
  }

  if (link.startsWith("/")) {
    if (ALLOWED_BUTTON_LINK_EXTENSIONS_RE.test(link)) return Promise.resolve();
    return Promise.reject(
      new Error("Use a PDF document path (e.g. /uploads/file.pdf) or /media/<id>."),
    );
  }

  if (isValidHttpUrl(link) && ALLOWED_BUTTON_LINK_EXTENSIONS_RE.test(link)) {
    return Promise.resolve();
  }

  return Promise.reject(
    new Error("Enter a valid document link. Use /media/<id> or a .pdf URL/path."),
  );
}

function normalizeItem(it) {
  const imageUrlCandidates = [it?.imageUrlDesktop, it?.imageUrl, it?.imageUrlMobile];
  const imageUrl =
    imageUrlCandidates
      .map((candidate) => (candidate != null ? String(candidate).trim() : ""))
      .find(Boolean) || "";
  return {
    imageUrlDesktop: imageUrl,
    imageUrlMobile: "",
    imageUrl,
    date: it?.date != null ? String(it.date).trim() : "",
    title: it?.title != null ? String(it.title).trim() : "",
    description: it?.description != null ? String(it.description).trim() : "",
    buttonText: it?.buttonText != null ? String(it.buttonText).trim() : "Read Post",
    buttonLink:
      it?.buttonLink != null && String(it.buttonLink).trim() !== "/"
        ? String(it.buttonLink).trim()
        : "",
    buttonOpenInNewTab:
      Boolean(it?.buttonOpenInNewTab ?? it?.openInNewTab) ||
      String(it?.target || it?.buttonTarget || "").toLowerCase() === "_blank",
  };
}

function getImageDimensions(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({
        width: Number(image.naturalWidth) || 0,
        height: Number(image.naturalHeight) || 0,
      });
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageUrl;
  });
}

async function validateLatestEventsImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (width === REQUIRED_IMAGE_WIDTH && height === REQUIRED_IMAGE_HEIGHT) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Image must be exactly ${REQUIRED_IMAGE_DIMENSIONS_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate image size. Please select an image of ${REQUIRED_IMAGE_DIMENSIONS_TEXT}.`,
      ),
    );
  }
}

/**
 * Edit form for LatestEvents1 — same pattern as HomeHero/Subscribe.
 * Loads/saves via /api/theme/LatestEvents1. Section titles + list of news items + theme color keys.
 */
function LatestEvents1EditForm(
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
        latestEvents1ButtonColorKey: data?.latestEvents1ButtonColorKey != null ? String(data.latestEvents1ButtonColorKey).trim() : "",
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
          latestEvents1ButtonColorKey: data?.latestEvents1ButtonColorKey != null ? String(data.latestEvents1ButtonColorKey).trim() : "",
          ...getManageSectionInitialValues("latestEvents1", data),
        });
      })
      .catch(() => message.error("Failed to load Latest Events"))
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
        latestEvents1ButtonColorKey: values.latestEvents1ButtonColorKey != null ? String(values.latestEvents1ButtonColorKey).trim() : "",
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
          message.success("Latest Events saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save Latest Events"))
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
        defaultActiveKey={["items"]}
        items={[
          {
            key: "section",
            label: "Manage Section",
            children: <ManageSectionFields prefix="latestEvents1" form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("LatestEvents1")} />,
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
                          <Form.Item
                            {...restField}
                            name={[name, "imageUrlDesktop"]}
                            label="Image"
                            className="latest-events1-image-field"
                            validateTrigger={["onChange", "onBlur"]}
                            rules={[{ validator: validateLatestEventsImageDimensions }]}
                          >
                            <MediaPickerInput
                              placeholder="/images/news-1.png"
                              uiVariant="stacked"
                              showVariants={false}
                              hintText={`Required size: ${REQUIRED_IMAGE_DIMENSIONS_TEXT}`}
                            />
                          </Form.Item>
                        </Col>
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
                          <Form.Item {...restField} name={[name, "description"]} label="Description">
                            <Input.TextArea rows={2} placeholder="Short description" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "buttonText"]} label="Button label">
                            <Input placeholder="Read Post" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "buttonLink"]}
                            label="Button document link"
                            rules={[{ validator: validateButtonLink }]}
                          >
                            <MediaPickerInput
                              placeholder="/media/<id> or /uploads/file.pdf or https://...pdf"
                              showVariants={false}
                              mediaType="document"
                              hintText="Supports documents only (PDF)."
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "buttonOpenInNewTab"]}
                            label="Open link in new tab"
                            valuePropName="checked"
                            tooltip="ON = _blank, OFF = _self"
                          >
                            <Switch checkedChildren="ON" unCheckedChildren="OFF" />
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
      <style jsx global>{`
        .latest-events1-image-field .ant-form-item-explain-error {
          font-size: 12px;
          line-height: 1.35;
        }
      `}</style>
    </Form>
  );
}

export default forwardRef(LatestEvents1EditForm);
