"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Form, Input, Row, Col, Select, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/appearance/local/ManageSectionFormFields";
import SortableFormList from "@/components/admin/appearance/local/SortableFormList";
import TitleAndColorsSection from "@/components/admin/appearance/local/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/appearance/local/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/components/admin/appearance/local/manageSectionData";
import { getTitleAndColorsConfigFromMap } from "@/components/admin/appearance/local/titleAndColorsConfig";
import { buildThemeColorOptions } from "@/lib/themeColors";
import { ensureMailto, normalizeLinkTarget } from "@/lib/linkUtils";

function pickEditableValues(values, editableKeys) {
  const src = values && typeof values === "object" ? values : {};
  const out = {};
  for (const key of editableKeys) {
    if (Object.prototype.hasOwnProperty.call(src, key)) out[key] = src[key];
  }
  return out;
}

function normalizeFooterCopyrightInput(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Copyright © {{year}} All Rights Reserved.";

  return raw.replace(
    /(\b(?:copyright\s*(?:©|\(c\))?|©)\s*)\d{4}\b/i,
    (_, prefix) => `${prefix}{{year}}`,
  );
}

function normalizeFooterLinkInput(value) {
  const url = ensureMailto(value?.url);
  const target = normalizeLinkTarget(
    value?.target ?? value?.openInNewTab,
    "_self",
  );
  return {
    label: value?.label != null ? String(value.label) : "",
    url,
    target,
  };
}

function normalizeFooterSocialLinkInput(value) {
  return {
    platform: value?.platform != null ? String(value.platform).trim() : "facebook",
    url: ensureMailto(value?.url),
    target: normalizeLinkTarget(
      value?.target ?? value?.openInNewTab,
      "_self",
    ),
  };
}

/**
 * Edit form for Footer � used in page builder drawer or component edit.
 * When source="page": data from block.props (pages collection); save updates layout only.
 * Otherwise: load/save via /api/theme/footer (components collection).
 */
function FooterEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [], titleAndColorsConfigMap = null }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [initialData, setInitialData] = useState(null);
  const themeFetchedForColorsRef = useRef(false);
  const componentDataLoadedRef = useRef(false);
  const lastLoadedValuesRef = useRef(null);
  const isPageBlock = source === "page";
  const titleAndColorsConfig = useMemo(
    () => getTitleAndColorsConfigFromMap("Footer", titleAndColorsConfigMap),
    [titleAndColorsConfigMap],
  );
  const titleAndColorKeys = useMemo(
    () =>
      Array.isArray(titleAndColorsConfig?.colorListItems)
        ? titleAndColorsConfig.colorListItems.map((item) => item?.name).filter(Boolean)
        : [],
    [titleAndColorsConfig],
  );
  const EDITABLE_KEYS = useMemo(
    () =>
      new Set([
        "footerLogoUrl",
        "footerAddress",
        "footerEmail",
        "footerPhone",
        "footerCol1Links",
        "footerCol2Links",
        "footerCol1Title",
        "footerCol2Title",
        "footerSocialLinks",
        "footerLatestTitle",
        "footerLatestPlaceholder",
        "footerCopyrightText",
        ...titleAndColorKeys,
        "footerSectionBgType",
        "footerSectionBgImage",
        "footerSectionBgColorKey",
        "footerSectionPadding",
        "footerSectionMargin",
        "footerPageContainerBgType",
        "footerPageContainerBgImage",
        "footerPageContainerBgColorKey",
        "footerPageContainerPadding",
        "footerPageContainerMargin",
        "_disableFadeAnimation",
      ]),
    [titleAndColorKeys],
  );
  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const titleAndColorValues = {};
      titleAndColorKeys.forEach((key) => {
        titleAndColorValues[key] =
          data?.[key] != null ? String(data[key]).trim() : "";
      });
      const col1 = Array.isArray(data.footerCol1Links)
        ? data.footerCol1Links.map(normalizeFooterLinkInput)
        : [];
      const col2 = Array.isArray(data.footerCol2Links)
        ? data.footerCol2Links.map(normalizeFooterLinkInput)
        : [];
      const social = Array.isArray(data.footerSocialLinks)
        ? data.footerSocialLinks.map(normalizeFooterSocialLinkInput)
        : [];
      setInitialData({
        footerLogoUrl: data.footerLogoUrl != null ? String(data.footerLogoUrl).trim() : "",
        footerAddress: data.footerAddress != null ? String(data.footerAddress).trim() : "",
        footerEmail: data.footerEmail != null ? String(data.footerEmail).trim() : "",
        footerPhone: data.footerPhone != null ? String(data.footerPhone).trim() : "",
        footerCol1Links: col1,
        footerCol2Links: col2,
        footerCol1Title: data.footerCol1Title != null ? String(data.footerCol1Title).trim() : "",
        footerCol2Title: data.footerCol2Title != null ? String(data.footerCol2Title).trim() : "",
        footerSocialLinks: social,
        footerLatestTitle: data.footerLatestTitle != null ? String(data.footerLatestTitle).trim() : "",
        footerLatestPlaceholder: data.footerLatestPlaceholder != null ? String(data.footerLatestPlaceholder).trim() : "",
        footerCopyrightText: normalizeFooterCopyrightInput(
          data.footerCopyrightText,
        ),
        ...titleAndColorValues,
        ...getManageSectionInitialValues("footer", data),
      });
      lastLoadedValuesRef.current = {
        ...(lastLoadedValuesRef.current || {}),
        ...(data && typeof data === "object" ? data : {}),
      };
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            setThemeColorOptions(buildThemeColorOptions(theme));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }
    if (componentDataLoadedRef.current) {
      const scoped = pickEditableValues(
        lastLoadedValuesRef.current || form.getFieldsValue(true),
        EDITABLE_KEYS,
      );
      form.setFieldsValue(scoped);
      setLoading(false);
      return;
    }
    componentDataLoadedRef.current = true;
    setInitialData(null);
    Promise.all([
      fetch("/api/theme/footer", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([footer, theme]) => {
        const titleAndColorValues = {};
        titleAndColorKeys.forEach((key) => {
          titleAndColorValues[key] =
            footer?.[key] != null ? String(footer[key]).trim() : "";
        });
        const col1 = Array.isArray(footer?.footerCol1Links)
          ? footer.footerCol1Links.map(normalizeFooterLinkInput)
          : [];
        const col2 = Array.isArray(footer?.footerCol2Links)
          ? footer.footerCol2Links.map(normalizeFooterLinkInput)
          : [];
        const social = Array.isArray(footer?.footerSocialLinks)
          ? footer.footerSocialLinks.map(normalizeFooterSocialLinkInput)
          : [];
        setInitialData({
          footerLogoUrl: footer?.footerLogoUrl != null ? String(footer.footerLogoUrl).trim() : "",
          footerAddress: footer?.footerAddress != null ? String(footer.footerAddress).trim() : "",
          footerEmail: footer?.footerEmail != null ? String(footer.footerEmail).trim() : "",
          footerPhone: footer?.footerPhone != null ? String(footer.footerPhone).trim() : "",
          footerCol1Links: col1,
          footerCol2Links: col2,
          footerCol1Title: footer?.footerCol1Title != null ? String(footer.footerCol1Title).trim() : "",
          footerCol2Title: footer?.footerCol2Title != null ? String(footer.footerCol2Title).trim() : "",
          footerSocialLinks: social,
          footerLatestTitle: footer?.footerLatestTitle != null ? String(footer.footerLatestTitle).trim() : "",
          footerLatestPlaceholder: footer?.footerLatestPlaceholder != null ? String(footer.footerLatestPlaceholder).trim() : "",
          footerCopyrightText: normalizeFooterCopyrightInput(
            footer?.footerCopyrightText,
          ),
          ...titleAndColorValues,
          ...getManageSectionInitialValues("footer", footer),
        });
        lastLoadedValuesRef.current = {
          ...(lastLoadedValuesRef.current || {}),
          ...(footer && typeof footer === "object" ? footer : {}),
        };
        setThemeColorOptions(buildThemeColorOptions(theme));
      })
      .catch(() => message.error("Failed to load Footer"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp, titleAndColorKeys, form, EDITABLE_KEYS]);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...pickEditableValues(initialData, EDITABLE_KEYS),
      });
    }
  }, [initialData, form, EDITABLE_KEYS]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(Array.from(EDITABLE_KEYS));
      const titleAndColorPayload = {};
      titleAndColorKeys.forEach((key) => {
        titleAndColorPayload[key] = String(values?.[key] ?? "").trim();
      });
      const col1 = Array.isArray(values.footerCol1Links)
        ? values.footerCol1Links.map((it) => ({
            label: it?.label ?? "",
            url: ensureMailto(it?.url),
            target: normalizeLinkTarget(it?.target, "_self"),
            openInNewTab: normalizeLinkTarget(it?.target, "_self") === "_blank",
          }))
        : [];
      const col2 = Array.isArray(values.footerCol2Links)
        ? values.footerCol2Links.map((it) => ({
            label: it?.label ?? "",
            url: ensureMailto(it?.url),
            target: normalizeLinkTarget(it?.target, "_self"),
            openInNewTab: normalizeLinkTarget(it?.target, "_self") === "_blank",
          }))
        : [];
      const social = Array.isArray(values.footerSocialLinks)
        ? values.footerSocialLinks.map((it) => ({
            ...normalizeFooterSocialLinkInput(it),
            openInNewTab:
              normalizeLinkTarget(it?.target ?? it?.openInNewTab, "_self") ===
              "_blank",
          }))
        : [];
      const payload = {
        footerLogoUrl: String(values.footerLogoUrl ?? "").trim(),
        footerAddress: String(values.footerAddress ?? "").trim(),
        footerEmail: String(values.footerEmail ?? "").trim(),
        footerPhone: String(values.footerPhone ?? "").trim(),
        footerCol1Links: col1,
        footerCol2Links: col2,
        footerCol1Title: String(values.footerCol1Title ?? "").trim(),
        footerCol2Title: String(values.footerCol2Title ?? "").trim(),
        footerSocialLinks: social,
        footerLatestTitle: String(values.footerLatestTitle ?? "").trim(),
        footerLatestPlaceholder: String(values.footerLatestPlaceholder ?? "").trim(),
        footerCopyrightText: normalizeFooterCopyrightInput(
          values.footerCopyrightText,
        ),
        ...titleAndColorPayload,
        ...getManageSectionPayload("footer", values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch("/api/theme/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Footer saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save Footer"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [handleUpdate]);

  if (loading || initialData === null) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage-section", "title", "content", "col1", "col2", "social"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix="footer" form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title",
            label: "Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...titleAndColorsConfig} />,
          },
          {
            key: "content",
            label: "Footer Content",
            children: (
              <>
                <Form.Item name="footerLogoUrl" label="Footer logo image URL">
                  <MediaPickerInput placeholder="/images/footer-logo.svg" />
                </Form.Item>
                <Form.Item name="footerAddress" label="Address">
                  <Input.TextArea rows={2} placeholder="Full address" />
                </Form.Item>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="footerEmail" label="Email">
                      <Input placeholder="Email address" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="footerPhone" label="Phone">
                      <Input placeholder="Phone number(s)" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="footerCol1Title" label="Column 1 Title">
                      <Input placeholder="Our Pages" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="footerCol2Title" label="Column 2 Title">
                      <Input placeholder="Quick Links" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="footerLatestTitle" label="Latest Section Title">
                      <Input placeholder="Get the latest from TSV" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="footerLatestPlaceholder" label="Latest Email Placeholder">
                      <Input placeholder="Enter email address" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="footerCopyrightText" label="Copyright text">
                  <Input placeholder="Copyright © {{year}} All Rights Reserved." />
                </Form.Item>
                <div
                  style={{
                    marginTop: -8,
                    marginBottom: 12,
                    fontSize: 12,
                    opacity: 0.75,
                  }}
                >
                  Use <code>{"{{year}}"}</code> for dynamic current year.
                </div>
              </>
            ),
          },
          {
            key: "col1",
            label: "Column 1 Links",
            children: (
              <Form.List name="footerCol1Links">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Link"
                    addButtonText="Add link"
                    defaultAddPayload={{ label: "", url: "", target: "_self" }}
                    renderItemContent={(name, rest) => (
                      <Row gutter={[16, 16]}>
                        <Col xs={24}>
                          <Form.Item {...rest} name={[name, "label"]} label="Link text" rules={[{ required: true }]}>
                            <Input size="large" placeholder="Link text" />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item {...rest} name={[name, "url"]} label="URL" rules={[{ required: true }]}>
                            <Input size="large" placeholder="/path" />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item
                            {...rest}
                            name={[name, "target"]}
                            label="Target"
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
                    )}
                  />
                )}
              </Form.List>
            ),
          },
          {
            key: "col2",
            label: "Column 2 Links",
            children: (
              <Form.List name="footerCol2Links">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Link"
                    addButtonText="Add link"
                    defaultAddPayload={{ label: "", url: "", target: "_self" }}
                    renderItemContent={(name, rest) => (
                      <Row gutter={[16, 16]}>
                        <Col xs={24}>
                          <Form.Item {...rest} name={[name, "label"]} label="Link text" rules={[{ required: true }]}>
                            <Input size="large" placeholder="Link text" />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item {...rest} name={[name, "url"]} label="URL" rules={[{ required: true }]}>
                            <Input size="large" placeholder="/path" />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item
                            {...rest}
                            name={[name, "target"]}
                            label="Target"
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
                    )}
                  />
                )}
              </Form.List>
            ),
          },
          {
            key: "social",
            label: "Social Links",
            children: (
              <Form.List name="footerSocialLinks">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Social link"
                    addButtonText="Add social link"
                    defaultAddPayload={{
                      platform: "facebook",
                      url: "",
                      target: "_self",
                    }}
                    renderItemContent={(name, rest) => (
                      <Row gutter={[16, 16]}>
                        <Col xs={24}>
                          <Form.Item {...rest} name={[name, "platform"]} label="Platform" rules={[{ required: true }]}>
                            <Select
                              options={[
                                { value: "facebook", label: "Facebook" },
                                { value: "instagram", label: "Instagram" },
                                { value: "x", label: "X / Twitter" },
                                { value: "linkedin", label: "LinkedIn" },
                                { value: "youtube", label: "YouTube" },
                                { value: "website", label: "Website" },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item {...rest} name={[name, "url"]} label="URL" rules={[{ required: true }]}>
                            <Input size="large" placeholder="https://..." />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Form.Item {...rest} name={[name, "target"]} label="Target">
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

export default forwardRef(FooterEditForm);


