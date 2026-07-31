"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Row,
  Col,
  message,
  Spin,
  Collapse,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  INTERNSHIP_LIFECYCLE_DEFAULTS,
  normalizeInternshipLifecycleItem,
  normalizeInternshipLifecycleItems,
  getInternshipLifecycleDefaults,
} from "./constants";

const API_PATH = "/api/theme/Internshiplifecycle";
const PREFIX = "internshiplifecycle";

function InternshiplifecycleEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    onCancel,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const themeFetchedForColorsRef = useRef(false);
  const componentDataLoadedRef = useRef(false);
  const isPageBlock = source === "page";

  const fetchThemeColorOptions = useCallback((theme) => {
    const palette = theme?.themePalette || {};
    const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
    const names = [
      ...new Set([
        ...Object.keys(palette),
        ...customColors.map((c) => c?.name).filter(Boolean),
      ]),
    ].sort();
    setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
  }, []);

  const setFormAndColors = useCallback((data, theme) => {
    const normalized = getInternshipLifecycleDefaults(data || {});
    form.setFieldsValue({
      ...getManageSectionInitialValues(PREFIX, data || {}),
      mainTitle: normalized.mainTitle,
      internshiplifecycleAccentColorKey:
        normalized.internshiplifecycleAccentColorKey,
      internshiplifecycleDescriptionColorKey:
        normalized.internshiplifecycleDescriptionColorKey,
      internshiplifecycleCircleBgColorKey:
        normalized.internshiplifecycleCircleBgColorKey,
      internshiplifecycleCircleHoverBgColorKey:
        normalized.internshiplifecycleCircleHoverBgColorKey,
      internshiplifecycleIconColorKey:
        normalized.internshiplifecycleIconColorKey,
      internshiplifecycleIconHoverColorKey:
        normalized.internshiplifecycleIconHoverColorKey,
      internshiplifecycleConnectorColorKey:
        normalized.internshiplifecycleConnectorColorKey,
      internshiplifecycleTitleFontFamily:
        normalized.internshiplifecycleTitleFontFamily,
      internshiplifecycleTitleFontSize:
        normalized.internshiplifecycleTitleFontSize,
      internshiplifecycleTitleFontWeight:
        normalized.internshiplifecycleTitleFontWeight,
      internshiplifecycleTitleLineHeight:
        normalized.internshiplifecycleTitleLineHeight,
      internshiplifecycleTitleLetterSpacing:
        normalized.internshiplifecycleTitleLetterSpacing,
      internshiplifecycleTitleTextTransform:
        normalized.internshiplifecycleTitleTextTransform,
      internshiplifecycleCircleSize: normalized.internshiplifecycleCircleSize,
      internshiplifecycleIconSize: normalized.internshiplifecycleIconSize,
      internshiplifecycleStepGap: normalized.internshiplifecycleStepGap,
      internshiplifecycleItems: normalizeInternshipLifecycleItems(
        normalized.internshiplifecycleItems,
      ),
    });

    if (theme) fetchThemeColorOptions(theme);
  }, [fetchThemeColorOptions, form]);

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
      return;
    }
    if (themeFetchedForColorsRef.current) return;
    themeFetchedForColorsRef.current = true;
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => fetchThemeColorOptions(theme))
      .catch(() => {});
  }, [themeColorOptionsProp, fetchThemeColorOptions]);

  useEffect(() => {
    setLoading(true);

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      setFormAndColors(data);
      if (!themeColorOptionsProp?.length) {
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => fetchThemeColorOptions(theme))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    if (componentDataLoadedRef.current) {
      setLoading(false);
      return;
    }
    componentDataLoadedRef.current = true;

    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => setFormAndColors(data || {}, theme))
      .catch(() => message.error("Failed to load Internship Lifecycle"))
      .finally(() => setLoading(false));
  }, [
    fetchThemeColorOptions,
    initialDataProp,
    isPageBlock,
    setFormAndColors,
    themeColorOptionsProp,
  ]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const items = Array.isArray(values.internshiplifecycleItems)
          ? values.internshiplifecycleItems.map((item, index) =>
              normalizeInternshipLifecycleItem(
                item,
                INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleItems[index] ||
                  INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleItems[0],
              ),
            )
          : normalizeInternshipLifecycleItems([]);

        const payload = {
          ...getManageSectionPayload(PREFIX, values),
          mainTitle:
            values.mainTitle != null
              ? String(values.mainTitle).trim()
              : INTERNSHIP_LIFECYCLE_DEFAULTS.mainTitle,
          internshiplifecycleAccentColorKey:
            values.internshiplifecycleAccentColorKey != null
              ? String(values.internshiplifecycleAccentColorKey).trim()
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleAccentColorKey,
          internshiplifecycleDescriptionColorKey:
            values.internshiplifecycleDescriptionColorKey != null
              ? String(values.internshiplifecycleDescriptionColorKey).trim()
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleDescriptionColorKey,
          internshiplifecycleCircleBgColorKey:
            values.internshiplifecycleCircleBgColorKey != null
              ? String(values.internshiplifecycleCircleBgColorKey).trim()
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleCircleBgColorKey,
          internshiplifecycleCircleHoverBgColorKey:
            values.internshiplifecycleCircleHoverBgColorKey != null
              ? String(values.internshiplifecycleCircleHoverBgColorKey).trim()
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleCircleHoverBgColorKey,
          internshiplifecycleIconColorKey:
            values.internshiplifecycleIconColorKey != null
              ? String(values.internshiplifecycleIconColorKey).trim()
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleIconColorKey,
          internshiplifecycleIconHoverColorKey:
            values.internshiplifecycleIconHoverColorKey != null
              ? String(values.internshiplifecycleIconHoverColorKey).trim()
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleIconHoverColorKey,
          internshiplifecycleConnectorColorKey:
            values.internshiplifecycleConnectorColorKey != null
              ? String(values.internshiplifecycleConnectorColorKey).trim()
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleConnectorColorKey,
          internshiplifecycleTitleFontFamily:
            values.internshiplifecycleTitleFontFamily != null
              ? String(values.internshiplifecycleTitleFontFamily).trim()
              : "",
          internshiplifecycleTitleFontSize:
            values.internshiplifecycleTitleFontSize != null
              ? Number(values.internshiplifecycleTitleFontSize)
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleTitleFontSize,
          internshiplifecycleTitleFontWeight:
            values.internshiplifecycleTitleFontWeight != null
              ? Number(values.internshiplifecycleTitleFontWeight)
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleTitleFontWeight,
          internshiplifecycleTitleLineHeight:
            values.internshiplifecycleTitleLineHeight != null
              ? Number(values.internshiplifecycleTitleLineHeight)
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleTitleLineHeight,
          internshiplifecycleTitleLetterSpacing:
            values.internshiplifecycleTitleLetterSpacing != null
              ? Number(values.internshiplifecycleTitleLetterSpacing)
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleTitleLetterSpacing,
          internshiplifecycleTitleTextTransform:
            values.internshiplifecycleTitleTextTransform != null
              ? String(values.internshiplifecycleTitleTextTransform).trim() || "none"
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleTitleTextTransform,
          internshiplifecycleCircleSize:
            values.internshiplifecycleCircleSize != null
              ? Number(values.internshiplifecycleCircleSize)
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleCircleSize,
          internshiplifecycleIconSize:
            values.internshiplifecycleIconSize != null
              ? Number(values.internshiplifecycleIconSize)
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleIconSize,
          internshiplifecycleStepGap:
            values.internshiplifecycleStepGap != null
              ? Number(values.internshiplifecycleStepGap)
              : INTERNSHIP_LIFECYCLE_DEFAULTS.internshiplifecycleStepGap,
          internshiplifecycleItems: items,
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
            return null;
          })
          .then(() => {
            message.success("Internship Lifecycle saved");
            onSuccess?.();
          })
          .catch((err) => message.error(err?.error || "Failed to save"))
          .finally(() => setSaving(false));
      })
      .catch(() => {});
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
                {...getTitleAndColorsConfig("Internshiplifecycle")}
              />
            ),
          },
          {
            key: "content",
            label: "Lifecycle Steps",
            children: (
              <Form.List name="internshiplifecycleItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Step"
                    addButtonText="Add step"
                    defaultAddPayload={normalizeInternshipLifecycleItem({})}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[12, 12]}>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "title"]}
                            label="Step title"
                            rules={[{ required: true, message: "Step title is required" }]}
                          >
                            <Input placeholder="e.g. Application Submission" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "description"]}
                            label="Step description"
                          >
                            <Input.TextArea
                              rows={2}
                              placeholder="Optional supporting text"
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

export default forwardRef(InternshiplifecycleEditForm);

