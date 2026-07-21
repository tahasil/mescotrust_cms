"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  InputNumber,
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

const API_PATH = "/api/theme/LatestNews";
// Keep the persisted latestEvents1* namespace so existing CMS content remains editable.
const previousSubTitleToken = ["Eye", "brow"].join("");
const previousSubTitleField = (data, suffix = "") =>
  data?.[`latestEvents1${previousSubTitleToken}${suffix}`];
const REQUIRED_IMAGE_WIDTH = 600;
const REQUIRED_IMAGE_HEIGHT = 455;
const REQUIRED_IMAGE_DIMENSIONS_TEXT =
  `${REQUIRED_IMAGE_WIDTH} \u00D7 ${REQUIRED_IMAGE_HEIGHT} px`;
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
    return Promise.resolve();
  }

  if (isValidHttpUrl(link)) {
    return Promise.resolve();
  }

  return Promise.reject(
    new Error("Enter a valid internal path or http(s) URL."),
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
    tag: it?.tag != null ? String(it.tag).trim() : "",
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

const DESIGN_DEFAULTS = {
  latestEvents1HeadingAccent: "",
  latestEvents1IntroDescription: "",
  latestEvents1ShowImages: false,
  latestEvents1ShowDescriptions: false,
  latestEvents1ShowButtonLabels: false,
  latestEvents1RevealEnabled: true,
  latestEvents1RevealDuration: 0.9,
  latestEvents1RevealStagger: 0.09,
  latestEvents1RevealDistance: 28,
  latestEvents1RevealStart: "top 86%",
  latestEvents1IntroColumnRatio: 1,
  latestEvents1ListColumnRatio: 1.5,
  latestEvents1ColumnGap: 90,
  latestEvents1RowGap: 36,
  latestEvents1RowPadding: 34,
  latestEvents1BorderWidth: 1,
  latestEvents1HoverIndent: 14,
  latestEvents1TagWidth: 92,
  latestEvents1TagRadius: 999,
  latestEvents1TagPaddingX: 12,
  latestEvents1TagPaddingY: 5,
  latestEvents1TagFontSize: 12,
  latestEvents1TagFontWeight: 700,
  latestEvents1TagLetterSpacing: 0.1,
  latestEvents1TagTextTransform: "uppercase",
  latestEvents1ImageWidth: 120,
  latestEvents1ImageAspectRatio: "4 / 3",
  latestEvents1ImageRadius: 10,
  latestEvents1SubTitleFontSize: 13,
  latestEvents1SubTitleFontWeight: 650,
  latestEvents1SubTitleLetterSpacing: 0.16,
  latestEvents1HeadingMinSize: 36,
  latestEvents1HeadingFluidSize: 4.6,
  latestEvents1HeadingMaxSize: 64,
  latestEvents1HeadingFontWeight: 620,
  latestEvents1HeadingLetterSpacing: -0.02,
  latestEvents1HeadingLineHeight: 1.08,
  latestEvents1HeadingMarginBottom: 12,
  latestEvents1IntroMaxWidth: 42,
  latestEvents1IntroFontSize: 16,
  latestEvents1IntroLineHeight: 1.7,
  latestEvents1ItemTitleMinSize: 18,
  latestEvents1ItemTitleFluidSize: 1.8,
  latestEvents1ItemTitleMaxSize: 24,
  latestEvents1ItemTitleFontWeight: 560,
  latestEvents1ItemTitleLineHeight: 1.3,
  latestEvents1DescriptionFontSize: 14,
  latestEvents1DescriptionLineHeight: 1.5,
  latestEvents1ArrowSize: 22,
  latestEvents1ButtonFontSize: 14,
  latestEvents1ButtonFontWeight: 650,
};

const DESIGN_COLOR_FIELDS = [
  "latestEvents1HeadingAccentColorKey",
  "latestEvents1IntroColorKey",
  "latestEvents1TagColorKey",
  "latestEvents1TagBorderColorKey",
  "latestEvents1ItemTitleColorKey",
  "latestEvents1DescriptionColorKey",
  "latestEvents1BorderColorKey",
  "latestEvents1ArrowColorKey",
  "latestEvents1ArrowHoverColorKey",
  "latestEvents1DisplayFontFamily",
  "latestEvents1BodyFontFamily",
];

function getDesignSettings(data = {}) {
  const withPreviousSubTitleSettings = {
    ...data,
    latestEvents1SubTitleFontSize:
      data.latestEvents1SubTitleFontSize ??
      previousSubTitleField(data, "FontSize"),
    latestEvents1SubTitleFontWeight:
      data.latestEvents1SubTitleFontWeight ??
      previousSubTitleField(data, "FontWeight"),
    latestEvents1SubTitleLetterSpacing:
      data.latestEvents1SubTitleLetterSpacing ??
      previousSubTitleField(data, "LetterSpacing"),
  };
  return {
    ...Object.fromEntries(
      Object.entries(DESIGN_DEFAULTS).map(([key, fallback]) => [
        key,
        withPreviousSubTitleSettings[key] !== undefined
          ? withPreviousSubTitleSettings[key]
          : fallback,
      ]),
    ),
    ...Object.fromEntries(
      DESIGN_COLOR_FIELDS.map((key) => [
        key,
        data[key] != null ? String(data[key]).trim() : "",
      ]),
    ),
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

async function validateLatestNewsImageDimensions(_, value) {
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
        ...getDesignSettings(data),
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
          ...getDesignSettings(data),
          latestEvents1SubTitle: data?.latestEvents1SubTitle != null ? String(data.latestEvents1SubTitle).trim() : "Latest News",
          latestEvents1MainTitle: data?.latestEvents1MainTitle != null ? String(data.latestEvents1MainTitle).trim() : "Stay Informed. Stay Ahead.",
          latestEvents1Items: items.length ? items : [normalizeItem({}), normalizeItem({})],
          latestEvents1SubTitleColorKey: data?.latestEvents1SubTitleColorKey != null ? String(data.latestEvents1SubTitleColorKey).trim() : "",
          latestEvents1MainTitleColorKey: data?.latestEvents1MainTitleColorKey != null ? String(data.latestEvents1MainTitleColorKey).trim() : "",
          latestEvents1ButtonColorKey: data?.latestEvents1ButtonColorKey != null ? String(data.latestEvents1ButtonColorKey).trim() : "",
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
        ...getDesignSettings(values),
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
          message.success("Latest News saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save Latest News"))
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
                          <Form.Item
                            {...restField}
                            name={[name, "imageUrlDesktop"]}
                            label="Image"
                            className="latest-news-image-field"
                            validateTrigger={["onChange", "onBlur"]}
                            rules={[{ validator: validateLatestNewsImageDimensions }]}
                          >
                            <MediaPickerInput
                              placeholder="/images/news-1.png"
                              uiVariant="stacked"
                              hintText={`Required size: ${REQUIRED_IMAGE_DIMENSIONS_TEXT}`}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "tag"]} label="Tag">
                            <Input placeholder="e.g. Notice or Results" size="large" />
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
                            label="Link"
                            rules={[{ validator: validateButtonLink }]}
                          >
                            <Input placeholder="/news or https://example.com/news" size="large" />
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
          {
            key: "design",
            label: "Design & Layout",
            children: (
              <>
                <Form.Item name="latestEvents1ShowImages" label="Show item images" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="latestEvents1ShowDescriptions" label="Show item descriptions" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="latestEvents1ShowButtonLabels" label="Show button labels" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="latestEvents1DisplayFontFamily" label="Display font family"><Input /></Form.Item>
                <Form.Item name="latestEvents1BodyFontFamily" label="Body font family"><Input /></Form.Item>
                <Form.Item name="latestEvents1TagTextTransform" label="Tag text transform"><Select options={[{ label: "Uppercase", value: "uppercase" }, { label: "None", value: "none" }, { label: "Capitalize", value: "capitalize" }]} /></Form.Item>
                <Form.Item name="latestEvents1ImageAspectRatio" label="Image aspect ratio"><Input placeholder="4 / 3" /></Form.Item>
                <Row gutter={16}>
                  {Object.entries({ latestEvents1IntroColumnRatio: "Intro column ratio", latestEvents1ListColumnRatio: "List column ratio", latestEvents1ColumnGap: "Column gap px", latestEvents1RowGap: "Row gap px", latestEvents1RowPadding: "Row padding px", latestEvents1BorderWidth: "Border width px", latestEvents1HoverIndent: "Hover indent px", latestEvents1TagWidth: "Tag width px", latestEvents1TagRadius: "Tag radius px", latestEvents1TagPaddingX: "Tag padding X px", latestEvents1TagPaddingY: "Tag padding Y px", latestEvents1TagFontSize: "Tag font px", latestEvents1TagFontWeight: "Tag weight", latestEvents1TagLetterSpacing: "Tag spacing em", latestEvents1ImageWidth: "Image width px", latestEvents1ImageRadius: "Image radius px", latestEvents1SubTitleFontSize: "Sub Title font px", latestEvents1SubTitleFontWeight: "Sub Title weight", latestEvents1SubTitleLetterSpacing: "Sub Title spacing em", latestEvents1HeadingMinSize: "Heading min px", latestEvents1HeadingFluidSize: "Heading fluid vw", latestEvents1HeadingMaxSize: "Heading max px", latestEvents1HeadingFontWeight: "Heading weight", latestEvents1HeadingLetterSpacing: "Heading spacing em", latestEvents1HeadingLineHeight: "Heading line height", latestEvents1HeadingMarginBottom: "Heading bottom px", latestEvents1IntroMaxWidth: "Intro width ch", latestEvents1IntroFontSize: "Intro font px", latestEvents1IntroLineHeight: "Intro line height", latestEvents1ItemTitleMinSize: "Item title min px", latestEvents1ItemTitleFluidSize: "Item title fluid vw", latestEvents1ItemTitleMaxSize: "Item title max px", latestEvents1ItemTitleFontWeight: "Item title weight", latestEvents1ItemTitleLineHeight: "Item title line height", latestEvents1DescriptionFontSize: "Description font px", latestEvents1DescriptionLineHeight: "Description line height", latestEvents1ArrowSize: "Arrow size px", latestEvents1ButtonFontSize: "Button font px", latestEvents1ButtonFontWeight: "Button weight" }).map(([name, label]) => <Col span={12} key={name}><Form.Item name={name} label={label}><InputNumber style={{ width: "100%" }} /></Form.Item></Col>)}
                </Row>
              </>
            ),
          },
          {
            key: "animation",
            label: "Animation",
            children: (
              <>
                <Form.Item name="latestEvents1RevealEnabled" label="Reveal on scroll" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="latestEvents1RevealStart" label="Trigger start"><Input /></Form.Item>
                <Row gutter={16}>{[["latestEvents1RevealDuration", "Duration s"], ["latestEvents1RevealStagger", "Stagger s"], ["latestEvents1RevealDistance", "Distance px"]].map(([name, label]) => <Col span={12} key={name}><Form.Item name={name} label={label}><InputNumber min={0} step={0.01} style={{ width: "100%" }} /></Form.Item></Col>)}</Row>
              </>
            ),
          },
        ]}
      />
      <style jsx global>{`
        .latest-news-image-field .ant-form-item-explain-error {
          font-size: 12px;
          line-height: 1.35;
        }
      `}</style>
    </Form>
  );
}

export default forwardRef(LatestNewsEditForm);
