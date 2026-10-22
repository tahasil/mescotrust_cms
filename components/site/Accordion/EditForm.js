"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Row,
  Spin,
  message,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import RichTextEditor from "@/components/admin/RichTextEditor";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Accordion";
const PREFIX = "accordion";
const PANEL_IMAGE_WIDTH = 600;
const PANEL_IMAGE_HEIGHT = 400;
const PANEL_IMAGE_SIZE = `${PANEL_IMAGE_WIDTH} \u00D7 ${PANEL_IMAGE_HEIGHT} px`;
const IMAGE_HINT = `Required dimensions: ${PANEL_IMAGE_SIZE}.`;
const COLOR_FIELDS = [
  "accordionSubTitleColorKey",
  "accordionTitleColorKey",
  "accordionTitleAccentColorKey",
  "accordionHeaderColorKey",
  "accordionContentColorKey",
  "accordionContentStrongColorKey",
  "accordionLinkColorKey",
  "accordionLinkHoverColorKey",
  "accordionBgColorKey",
  "accordionBorderColorKey",
  "accordionIconColorKey",
  "accordionOpenIconColorKey",
  "accordionFocusColorKey",
  "accordionImageBgColorKey",
  "accordionImageBorderColorKey",
];

function text(value) {
  return value == null ? "" : String(value).trim();
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

async function validatePanelImageDimensions(_, value) {
  const imageUrl = text(value);
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (width === PANEL_IMAGE_WIDTH && height === PANEL_IMAGE_HEIGHT) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Panel image must be exactly ${PANEL_IMAGE_SIZE}. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate panel image size. Please select a ${PANEL_IMAGE_SIZE} image.`,
      ),
    );
  }
}

function normalizeItem(item) {
  const imageDesktop = text(
    item?.imageDesktop ?? item?.image ?? item?.imageUrl,
  );
  return {
    label: text(item?.label),
    content: text(item?.content ?? item?.children),
    imageDesktop,
    imageMobile: text(item?.imageMobile),
    imageAlt: text(item?.imageAlt),
  };
}

function applyFormValues(form, data) {
  const items =
    Array.isArray(data?.accordionItems) && data.accordionItems.length > 0
      ? data.accordionItems.map(normalizeItem)
      : [normalizeItem({})];
  const values = {
    accordionSubTitle: data?.accordionSubTitle ?? "",
    accordionMainTitle: data?.accordionMainTitle ?? "",
    accordionDefaultOpenIndex:
      data?.accordionDefaultOpenIndex != null
        ? String(data.accordionDefaultOpenIndex)
        : "0",
    accordionExpandIconUrl: data?.accordionExpandIconUrl ?? "",
    accordionItems: items,
    ...getManageSectionInitialValues(PREFIX, data),
  };
  COLOR_FIELDS.forEach((field) => {
    values[field] = data?.[field] ?? "";
  });
  form.setFieldsValue(values);
}

function AccordionEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(
    themeColorOptionsProp,
  );
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState(null);

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
    }
  }, [themeColorOptionsProp]);

  useEffect(() => {
    function applyThemeColors(theme) {
      const palette = theme?.themePalette || {};
      const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
      const names = [
        ...new Set([
          ...Object.keys(palette),
          ...customColors.map((color) => color?.name).filter(Boolean),
        ]),
      ].sort();
      setThemeColorOptions(
        names.map((name) => ({ label: name, value: name })),
      );
    }

    setLoading(true);
    if (isPageBlock) {
      applyFormValues(form, initialDataProp ?? {});
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then(applyThemeColors)
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) =>
        res.ok ? res.json() : {},
      ),
      fetch("/api/theme", { cache: "no-store" }).then((res) =>
        res.ok ? res.json() : {},
      ),
    ])
      .then(([data, theme]) => {
        applyThemeColors(theme);
        applyFormValues(form, data);
      })
      .catch(() => message.error("Failed to load Accordion"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const payload = {
          accordionSubTitle: text(values.accordionSubTitle),
          accordionMainTitle: text(values.accordionMainTitle),
          accordionDefaultOpenIndex:
            text(values.accordionDefaultOpenIndex) || "0",
          accordionExpandIconUrl: text(values.accordionExpandIconUrl),
          accordionItems: (values.accordionItems || []).map(normalizeItem),
          ...getManageSectionPayload(PREFIX, values),
        };
        COLOR_FIELDS.forEach((field) => {
          payload[field] = values[field] ?? "";
        });

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
            if (!res.ok) {
              return res.json().then((data) => Promise.reject(data));
            }
            return null;
          })
          .then(() => {
            message.success("Accordion saved");
            onSuccess?.();
          })
          .catch((error) =>
            message.error(error?.error || "Failed to save"),
          )
          .finally(() => setSaving(false));
      })
      .catch(() => {});
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
    <Form preserve={true} form={form} layout="vertical" disabled={saving}>
      <Collapse
        destroyInactivePanel={false}
        defaultActiveKey={[]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: (
              <ManageSectionFields
                prefix={PREFIX}
                form={form}
                themeColorOptions={themeColorOptions}
              />
            ),
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("Accordion")}
              />
            ),
          },
          {
            key: "settings",
            label: "Settings",
            children: (
              <>
                <Form.Item
                  name="accordionDefaultOpenIndex"
                  label="Initially open panel index"
                  tooltip="0 = all closed. Enter 1 for first panel, 2 for second, or comma-separated numbers like 1, 5, 7 to open multiple panels by default."
                >
                  <Input placeholder="e.g. 0 (all closed), 1, 2 or 1, 5, 7" />
                </Form.Item>
                <Form.Item
                  name="accordionExpandIconUrl"
                  label="Custom expand icon (optional)"
                  tooltip="Leave empty to use the plus icon from the reference design."
                >
                  <MediaPickerInput
                    mediaType="image"
                    uiVariant="stacked"
                    placeholder="Select an optional SVG or image icon"
                    hintText="Uses the standard media library rules and optimization flow. Leave empty for the default plus icon."
                  />
                </Form.Item>
              </>
            ),
          },
          {
            key: "items",
            label: "Manage Panels",
            children: (
              <Form.List name="accordionItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Panel"
                    addButtonText="Add panel"
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
                            name={[name, "label"]}
                            label="Title"
                            rules={[
                              { required: true, message: "Title is required" },
                            ]}
                          >
                            <Input
                              placeholder="e.g. Board of Trustees"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "content"]}
                            label="Content"
                          >
                            <RichTextEditor placeholder="Panel content..." />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "imageDesktop"]}
                            label="Desktop / tablet image"
                            rules={[
                              { validator: validatePanelImageDimensions },
                            ]}
                            validateTrigger={["onChange", "onBlur"]}
                          >
                            <MediaPickerInput
                              mediaType="image"
                              uiVariant="stacked"
                              placeholder="Optional panel image"
                              cropWidth={PANEL_IMAGE_WIDTH}
                              cropHeight={PANEL_IMAGE_HEIGHT}
                              hintText={IMAGE_HINT}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "imageMobile"]}
                            label="Mobile image (optional)"
                            rules={[
                              { validator: validatePanelImageDimensions },
                            ]}
                            validateTrigger={["onChange", "onBlur"]}
                          >
                            <MediaPickerInput
                              mediaType="image"
                              uiVariant="stacked"
                              placeholder="Uses desktop image when empty"
                              cropWidth={PANEL_IMAGE_WIDTH}
                              cropHeight={PANEL_IMAGE_HEIGHT}
                              hintText={IMAGE_HINT}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "imageAlt"]}
                            label="Image alternative text"
                            tooltip="The panel title is used as fallback when this field is empty."
                          >
                            <Input placeholder="Describe the image" size="large" />
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

export default forwardRef(AccordionEditForm);
