"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Select, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import { buildThemeColorOptionsSafe } from "@/lib/themeColors";

/**
 * Edit form for Footer — used in page builder drawer or component edit.
 * When source="page": data from block.props (pages collection); save updates layout only.
 * Otherwise: load/save via /api/theme/footer (components collection).
 */
function FooterEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [initialData, setInitialData] = useState(null);
  const currentYear = new Date().getFullYear();
  const themeFetchedForColorsRef = useRef(false);
  const componentDataLoadedRef = useRef(false);
  const isPageBlock = source === "page";
  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const col1 = Array.isArray(data.footerCol1Links) ? data.footerCol1Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
      const col2 = Array.isArray(data.footerCol2Links) ? data.footerCol2Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
      const social = Array.isArray(data.footerSocialLinks) ? data.footerSocialLinks.map((it) => ({ platform: it?.platform ?? "facebook", url: it?.url ?? "" })) : [];
      setInitialData({
        footerLogoUrl: data.footerLogoUrl != null ? String(data.footerLogoUrl).trim() : "",
        footerAddress: data.footerAddress != null ? String(data.footerAddress).trim() : "",
        footerEmail: data.footerEmail != null ? String(data.footerEmail).trim() : "",
        footerPhone: data.footerPhone != null ? String(data.footerPhone).trim() : "",
        footerCol1Links: col1,
        footerCol2Links: col2,
        footerSocialLinks: social,
        footerCopyrightText: data.footerCopyrightText != null ? String(data.footerCopyrightText).trim() : "",
        footerBgColorKey: data.footerBgColorKey != null ? String(data.footerBgColorKey).trim() : "",
        footerBackgroundImageUrl: data.footerBackgroundImageUrl != null ? String(data.footerBackgroundImageUrl).trim() : "",
        footerTextColorKey: data.footerTextColorKey != null ? String(data.footerTextColorKey).trim() : "",
        footerCopyrightBarColorKey: data.footerCopyrightBarColorKey != null ? String(data.footerCopyrightBarColorKey).trim() : "",
        ...getManageSectionInitialValues("footer", data),
      });
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            setThemeColorOptions(buildThemeColorOptionsSafe(theme));
          })
          .catch(() => setThemeColorOptions(buildThemeColorOptionsSafe({})))
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
    setInitialData(null);
    Promise.all([
      fetch("/api/theme/footer", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([footer, theme]) => {
        const col1 = Array.isArray(footer?.footerCol1Links) ? footer.footerCol1Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
        const col2 = Array.isArray(footer?.footerCol2Links) ? footer.footerCol2Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
        const social = Array.isArray(footer?.footerSocialLinks) ? footer.footerSocialLinks.map((it) => ({ platform: it?.platform ?? "facebook", url: it?.url ?? "" })) : [];
        setInitialData({
          footerLogoUrl: footer?.footerLogoUrl != null ? String(footer.footerLogoUrl).trim() : "",
          footerAddress: footer?.footerAddress != null ? String(footer.footerAddress).trim() : "",
          footerEmail: footer?.footerEmail != null ? String(footer.footerEmail).trim() : "",
          footerPhone: footer?.footerPhone != null ? String(footer.footerPhone).trim() : "",
          footerCol1Links: col1,
          footerCol2Links: col2,
          footerSocialLinks: social,
          footerCopyrightText: footer?.footerCopyrightText != null ? String(footer.footerCopyrightText).trim() : "",
          footerBgColorKey: footer?.footerBgColorKey != null ? String(footer.footerBgColorKey).trim() : "",
          footerBackgroundImageUrl: footer?.footerBackgroundImageUrl != null ? String(footer.footerBackgroundImageUrl).trim() : "",
          footerTextColorKey: footer?.footerTextColorKey != null ? String(footer.footerTextColorKey).trim() : "",
          footerCopyrightBarColorKey: footer?.footerCopyrightBarColorKey != null ? String(footer.footerCopyrightBarColorKey).trim() : "",
          ...getManageSectionInitialValues("footer", footer),
        });
        setThemeColorOptions(buildThemeColorOptionsSafe(theme));
      })
      .catch(() => {
        setThemeColorOptions(buildThemeColorOptionsSafe({}));
        message.error("Failed to load Footer");
      })
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp]);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        footerBgType: initialData.footerBackgroundImageUrl ? "image" : "color",
      });
    }
  }, [initialData, form]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const col1 = Array.isArray(values.footerCol1Links) ? values.footerCol1Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
      const col2 = Array.isArray(values.footerCol2Links) ? values.footerCol2Links.map((it) => ({ label: it?.label ?? "", url: it?.url ?? "" })) : [];
      const social = Array.isArray(values.footerSocialLinks) ? values.footerSocialLinks.map((it) => ({ platform: String(it?.platform ?? "facebook").trim(), url: String(it?.url ?? "").trim() })) : [];
      const bgType = values.footerBgType || "color";
      const payload = {
        footerLogoUrl: String(values.footerLogoUrl ?? "").trim(),
        footerAddress: String(values.footerAddress ?? "").trim(),
        footerEmail: String(values.footerEmail ?? "").trim(),
        footerPhone: String(values.footerPhone ?? "").trim(),
        footerCol1Links: col1,
        footerCol2Links: col2,
        footerSocialLinks: social,
        footerCopyrightText: String(values.footerCopyrightText ?? "").trim(),
        ...getManageSectionPayload("footer", values),
        footerBgColorKey: bgType === "color" ? String(values.footerBgColorKey ?? "").trim() : "",
        footerBackgroundImageUrl: bgType === "image" ? String(values.footerBackgroundImageUrl ?? "").trim() : "",
        footerTextColorKey: String(values.footerTextColorKey ?? "").trim(),
        footerCopyrightBarColorKey: String(values.footerCopyrightBarColorKey ?? "").trim(),
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

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

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
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Footer")} />,
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
                      <Input placeholder="email@example.org" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="footerPhone" label="Phone">
                      <Input placeholder="Phone numbers" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="footerBgType" label="Footer background" initialValue="color">
                  <Select
                    options={[
                      { value: "color", label: "Color" },
                      { value: "image", label: "Image" },
                    ]}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.footerBgType !== curr.footerBgType}>
                  {({ getFieldValue }) =>
                    getFieldValue("footerBgType") === "image" ? (
                      <Form.Item name="footerBackgroundImageUrl" label="Background image URL">
                        <MediaPickerInput placeholder="/uploads/footer-bg.svg" />
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>
                <Form.Item name="footerCopyrightText" label="Copyright text">
                  <Input placeholder={`Copyright © ${currentYear} All Rights Reserved.`} />
                </Form.Item>
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
                    defaultAddPayload={{ label: "", url: "" }}
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
                    defaultAddPayload={{ label: "", url: "" }}
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
                    defaultAddPayload={{ platform: "facebook", url: "" }}
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
