"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/AimsObjectives";
const PREFIX = "aimsObjectives";
const REQUIRED_SECTION_IMAGE_WIDTH = 1440;
const REQUIRED_SECTION_IMAGE_HEIGHT = 620;
const REQUIRED_SECTION_IMAGE_TEXT =
  `${REQUIRED_SECTION_IMAGE_WIDTH} \u00D7 ${REQUIRED_SECTION_IMAGE_HEIGHT} px`;

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

async function validateSectionImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (
      width === REQUIRED_SECTION_IMAGE_WIDTH &&
      height === REQUIRED_SECTION_IMAGE_HEIGHT
    ) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Section background image must be exactly ${REQUIRED_SECTION_IMAGE_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate section background image size. Please select an image of ${REQUIRED_SECTION_IMAGE_TEXT}.`,
      ),
    );
  }
}

function normalizeItem(it) {
  return { text: it?.text != null ? String(it.text).trim() : "" };
}

/**
 * Edit form for AimsObjectives — used in component edit drawer.
 * Title & Colors: main title + title color.
 * Content: repeater list of aims/objective text items.
 */
function AimsObjectivesEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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

  function applyFormValues(data) {
    const rawItems = data?.aimsObjectivesItems;
    const items =
      Array.isArray(rawItems) && rawItems.length > 0
        ? rawItems.map(normalizeItem)
        : [normalizeItem({})];
    form.setFieldsValue({
      aimsObjectivesSubTitle: data?.aimsObjectivesSubTitle != null ? String(data.aimsObjectivesSubTitle).trim() : data?.aimsObjectivesMainTitle != null ? String(data.aimsObjectivesMainTitle).trim() : "Aims & Objectives",
      aimsObjectivesHeading: data?.aimsObjectivesHeading != null ? String(data.aimsObjectivesHeading).trim() : "What we *work toward.*",
      aimsObjectivesMainTitle: data?.aimsObjectivesMainTitle != null ? String(data.aimsObjectivesMainTitle).trim() : "Aims & Objectives",
      aimsObjectivesSubTitleColorKey: data?.aimsObjectivesSubTitleColorKey != null ? String(data.aimsObjectivesSubTitleColorKey).trim() : "",
      aimsObjectivesHeadingColorKey: data?.aimsObjectivesHeadingColorKey != null ? String(data.aimsObjectivesHeadingColorKey).trim() : data?.aimsObjectivesTitleColorKey != null ? String(data.aimsObjectivesTitleColorKey).trim() : "",
      aimsObjectivesTitleColorKey: data?.aimsObjectivesTitleColorKey != null ? String(data.aimsObjectivesTitleColorKey).trim() : "",
      aimsObjectivesTextColorKey: data?.aimsObjectivesTextColorKey != null ? String(data.aimsObjectivesTextColorKey).trim() : "",
      aimsObjectivesNumberColorKey: data?.aimsObjectivesNumberColorKey != null ? String(data.aimsObjectivesNumberColorKey).trim() : "",
      aimsObjectivesBorderColorKey: data?.aimsObjectivesBorderColorKey != null ? String(data.aimsObjectivesBorderColorKey).trim() : "",
      aimsObjectivesItems: items,
      ...getManageSectionInitialValues(PREFIX, data),
    });
  }

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      applyFormValues(data);
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
        applyFormValues(data);
      })
      .catch(() => message.error("Failed to load Aims & Objectives"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.aimsObjectivesItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        aimsObjectivesSubTitle: values.aimsObjectivesSubTitle != null ? String(values.aimsObjectivesSubTitle).trim() : "",
        aimsObjectivesHeading: values.aimsObjectivesHeading != null ? String(values.aimsObjectivesHeading).trim() : "",
        aimsObjectivesMainTitle: values.aimsObjectivesSubTitle != null ? String(values.aimsObjectivesSubTitle).trim() : "",
        aimsObjectivesSubTitleColorKey: values.aimsObjectivesSubTitleColorKey != null ? String(values.aimsObjectivesSubTitleColorKey).trim() : "",
        aimsObjectivesHeadingColorKey: values.aimsObjectivesHeadingColorKey != null ? String(values.aimsObjectivesHeadingColorKey).trim() : "",
        aimsObjectivesTitleColorKey: values.aimsObjectivesTitleColorKey != null ? String(values.aimsObjectivesTitleColorKey).trim() : "",
        aimsObjectivesTextColorKey: values.aimsObjectivesTextColorKey != null ? String(values.aimsObjectivesTextColorKey).trim() : "",
        aimsObjectivesNumberColorKey: values.aimsObjectivesNumberColorKey != null ? String(values.aimsObjectivesNumberColorKey).trim() : "",
        aimsObjectivesBorderColorKey: values.aimsObjectivesBorderColorKey != null ? String(values.aimsObjectivesBorderColorKey).trim() : "",
        aimsObjectivesItems: items,
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
          message.success("Aims & Objectives saved");
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
        defaultActiveKey={["items"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: (
              <ManageSectionFields
                prefix={PREFIX}
                form={form}
                themeColorOptions={themeColorOptions}
                sectionBgImageFieldLabel="Background"
                sectionBgImageHintText={`Required size: ${REQUIRED_SECTION_IMAGE_TEXT}`}
                sectionBgImageValidateTrigger={["onChange", "onBlur"]}
                sectionBgImageRules={[{ validator: validateSectionImageDimensions }]}
              />
            ),
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("AimsObjectives")} />,
          },
          {
            key: "items",
            label: "Manage Items",
            children: (
              <Form.List name="aimsObjectivesItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Item"
                    addButtonText="Add objective"
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
                            name={[name, "text"]}
                            label="Text"
                            rules={[{ required: true, message: "Text is required" }]}
                          >
                            <Input.TextArea rows={3} placeholder="Enter objective text..." size="large" />
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

export default forwardRef(AimsObjectivesEditForm);
