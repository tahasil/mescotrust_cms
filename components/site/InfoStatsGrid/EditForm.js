"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin, Select } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import { normalizeLinkTarget } from "@/lib/linkUtils";

const API_PATH = "/api/theme/InfoStatsGrid";
const PREFIX = "infoStatsGrid";
function getTitleColorsConfig() {
  return {
    ...getTitleAndColorsConfig("InfoStatsGrid"),
    titleListItems: [],
  };
}

function isLikelyUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("/") ||
    raw.startsWith("mailto:") ||
    raw.startsWith("tel:")
  );
}

function normalizeItem(it = {}) {
  const description =
    it?.description != null
      ? String(it.description).trim()
      : it?.leftData != null
        ? String(it.leftData).trim()
        : it?.title != null
          ? String(it.title).trim()
          : "";
  const legacyLink =
    it?.link != null ? String(it.link).trim() : "";
  const bottomText =
    it?.bottomText != null
      ? String(it.bottomText).trim()
      : it?.rightData != null
        ? String(it.rightData).trim()
        : it?.linkText != null
          ? String(it.linkText).trim()
          : legacyLink && !isLikelyUrl(legacyLink)
            ? legacyLink
            : "";
  return {
    description,
    bottomText,
  };
}

function normalizeInfoStatsButtonTarget(value) {
  return normalizeLinkTarget(value, "_self");
}

function applyFormValues(form, data) {
  const items = Array.isArray(data?.infoStatsGridItems)
    ? data.infoStatsGridItems.map(normalizeItem)
    : [];

  form.setFieldsValue({
    mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "Section Title",
    subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "Subtitle",
    titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
    subTitleColorKey: data?.subTitleColorKey != null ? String(data.subTitleColorKey).trim() : "",
    infoStatsGridTitleButtonBgColorKey: data?.infoStatsGridTitleButtonBgColorKey != null ? String(data.infoStatsGridTitleButtonBgColorKey).trim() : "",
    infoStatsGridTitleButtonTextColorKey: data?.infoStatsGridTitleButtonTextColorKey != null ? String(data.infoStatsGridTitleButtonTextColorKey).trim() : "",
    infoStatsGridTitleButtonHoverBgColorKey: data?.infoStatsGridTitleButtonHoverBgColorKey != null ? String(data.infoStatsGridTitleButtonHoverBgColorKey).trim() : "",
    infoStatsGridTitleButtonHoverTextColorKey: data?.infoStatsGridTitleButtonHoverTextColorKey != null ? String(data.infoStatsGridTitleButtonHoverTextColorKey).trim() : "",
    infoStatsGridCardBgColorKey: data?.infoStatsGridCardBgColorKey != null ? String(data.infoStatsGridCardBgColorKey).trim() : "",
    infoStatsGridCardTextColorKey: data?.infoStatsGridCardTextColorKey != null ? String(data.infoStatsGridCardTextColorKey).trim() : "",
    infoStatsGridCardFooterColorKey: data?.infoStatsGridCardFooterColorKey != null ? String(data.infoStatsGridCardFooterColorKey).trim() : "",
    infoStatsGridCardBorderColorKey: data?.infoStatsGridCardBorderColorKey != null ? String(data.infoStatsGridCardBorderColorKey).trim() : "",
    infoStatsGridTitleButtonText: data?.infoStatsGridTitleButtonText != null ? String(data.infoStatsGridTitleButtonText).trim() : "",
    infoStatsGridTitleButtonLink: data?.infoStatsGridTitleButtonLink != null ? String(data.infoStatsGridTitleButtonLink).trim() : "",
    infoStatsGridTitleButtonTarget: normalizeInfoStatsButtonTarget(
      data?.infoStatsGridTitleButtonTarget ?? data?.infoStatsGridTitleButtonNewTab,
    ),
    infoStatsGridTitleButtonNewTab: data?.infoStatsGridTitleButtonNewTab === true,
    infoStatsGridItems: items,
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

/**
 * Edit form for InfoStatsGrid.
 * Same text editing flow as Cards: Content + Manage Cards + Title Button.
 */
function InfoStatsGridEditForm(
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
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
    }
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      applyFormValues(form, data);

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
        applyFormValues(form, data);
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => message.error("Failed to load InfoStatsGrid"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const payload = {
          ...getManageSectionPayload(PREFIX, values),
          mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "",
          subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
          titleColorKey: values.titleColorKey ?? "",
          subTitleColorKey: values.subTitleColorKey ?? "",
          infoStatsGridTitleButtonBgColorKey: values.infoStatsGridTitleButtonBgColorKey ?? "",
          infoStatsGridTitleButtonTextColorKey: values.infoStatsGridTitleButtonTextColorKey ?? "",
          infoStatsGridTitleButtonHoverBgColorKey: values.infoStatsGridTitleButtonHoverBgColorKey ?? "",
          infoStatsGridTitleButtonHoverTextColorKey: values.infoStatsGridTitleButtonHoverTextColorKey ?? "",
          infoStatsGridCardBgColorKey: values.infoStatsGridCardBgColorKey ?? "",
          infoStatsGridCardTextColorKey: values.infoStatsGridCardTextColorKey ?? "",
          infoStatsGridCardFooterColorKey: values.infoStatsGridCardFooterColorKey ?? "",
          infoStatsGridCardBorderColorKey: values.infoStatsGridCardBorderColorKey ?? "",
          infoStatsGridTitleButtonText: values.infoStatsGridTitleButtonText != null ? String(values.infoStatsGridTitleButtonText).trim() : "",
          infoStatsGridTitleButtonLink: values.infoStatsGridTitleButtonLink != null ? String(values.infoStatsGridTitleButtonLink).trim() : "",
          infoStatsGridTitleButtonTarget: normalizeInfoStatsButtonTarget(
            values.infoStatsGridTitleButtonTarget,
          ),
          infoStatsGridTitleButtonNewTab:
            normalizeInfoStatsButtonTarget(values.infoStatsGridTitleButtonTarget) ===
            "_blank",
          infoStatsGridItems: (values.infoStatsGridItems || []).map(normalizeItem),
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
            message.success("Info Stats Grid saved");
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
        defaultActiveKey={["manage-section", "title-colors", "content", "button", "cards-items"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleColorsConfig()}
              />
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Form.Item
                    name="subTitle"
                    label="Subtitle"
                  >
                    <Input placeholder="e.g. Recognitions" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mainTitle"
                    label="Main title"
                  >
                    <Input placeholder="e.g. Certifications" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "button",
            label: "Title Button",
            children: (
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Form.Item name="infoStatsGridTitleButtonText" label="Button text">
                    <Input placeholder="View Full Portfolio" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="infoStatsGridTitleButtonLink" label="Button link">
                    <Input placeholder="/portfolio" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="infoStatsGridTitleButtonTarget"
                    label="Target"
                    initialValue="_self"
                  >
                    <Select
                      size="large"
                      options={[
                        { label: "Same tab (_self)", value: "_self" },
                        { label: "New tab (_blank)", value: "_blank" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "cards-items",
            label: "Manage Cards",
            children: (
              <Form.List name="infoStatsGridItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Card"
                    addButtonText="Add card"
                    defaultAddPayload={{
                      description: "",
                      bottomText: "",
                    }}
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
                            name={[name, "description"]}
                            label="Description"
                            rules={[{ required: true, message: "Description is required" }]}
                          >
                            <Input.TextArea rows={4} placeholder="Card description" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "bottomText"]}
                            label="Card Footer"
                            rules={[{ required: true, message: "Card footer is required" }]}
                          >
                            <Input placeholder="15 - August 2025" size="large" />
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

export default forwardRef(InfoStatsGridEditForm);
