"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, Row, Col, message, Spin, Collapse } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Volunteer";
const PREFIX = "volunteer";

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function applyFormValues(form, data) {
  form.setFieldsValue({
    ...getManageSectionInitialValues(PREFIX, data),
    mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "Why Volunteer with MESCO",
    subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "Why Choose Us?",
    titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
    volunteerTitleEnabled: data?.volunteerTitleEnabled !== false,
    volunteerSubTitleEnabled: data?.volunteerSubTitleEnabled !== false,
    volunteerSubTitleColorKey: data?.volunteerSubTitleColorKey != null ? String(data.volunteerSubTitleColorKey).trim() : "",
    volunteerDescription: data?.volunteerDescription != null ? String(data.volunteerDescription).trim() : "Make a real difference by contributing to education, medical relief and empowerment initiatives. Volunteering with MESCO offers meaningful exposure and an opportunity to impact lives.",
    volunteerDescriptionColorKey: data?.volunteerDescriptionColorKey != null ? String(data.volunteerDescriptionColorKey).trim() : "",
    volunteerPageValue: data?.volunteerPageValue != null ? String(data.volunteerPageValue).trim() : "volunteer",
    volunteerSourceValue: data?.volunteerSourceValue != null ? String(data.volunteerSourceValue).trim() : "volunteer-form",
    volunteerSubjectLine: data?.volunteerSubjectLine != null ? String(data.volunteerSubjectLine).trim() : "Volunteer Application",
    volunteerSubmitLabel: data?.volunteerSubmitLabel != null ? String(data.volunteerSubmitLabel).trim() : "Submit Application",
    volunteerAreasOptions: data?.volunteerAreasOptions != null ? String(data.volunteerAreasOptions).trim() : "Education Support,Health Awareness,Event Management,Administrative,Fundraising,Women's Empowerment",
    volunteerChecklistTitle: data?.volunteerChecklistTitle != null ? String(data.volunteerChecklistTitle).trim() : "Ready to Start?",
    volunteerChecklistDescription: data?.volunteerChecklistDescription != null ? String(data.volunteerChecklistDescription).trim() : "If you meet these criteria and are excited about making a difference, we'd love to have you on our team!",
    volunteerChecklistItems: data?.volunteerChecklistItems != null ? String(data.volunteerChecklistItems).trim() : "Quick application process\nOrientation within 2 weeks\nOngoing support & training",
    volunteerFormCardBgColorKey: data?.volunteerFormCardBgColorKey != null ? String(data.volunteerFormCardBgColorKey).trim() : "",
    volunteerFormCardBorderColorKey: data?.volunteerFormCardBorderColorKey != null ? String(data.volunteerFormCardBorderColorKey).trim() : "",
    volunteerLabelColorKey: data?.volunteerLabelColorKey != null ? String(data.volunteerLabelColorKey).trim() : "",
    volunteerInputBgColorKey: data?.volunteerInputBgColorKey != null ? String(data.volunteerInputBgColorKey).trim() : "",
    volunteerInputBorderColorKey: data?.volunteerInputBorderColorKey != null ? String(data.volunteerInputBorderColorKey).trim() : "",
    volunteerInputTextColorKey: data?.volunteerInputTextColorKey != null ? String(data.volunteerInputTextColorKey).trim() : "",
    volunteerPlaceholderColorKey: data?.volunteerPlaceholderColorKey != null ? String(data.volunteerPlaceholderColorKey).trim() : "",
    volunteerCheckboxColorKey: data?.volunteerCheckboxColorKey != null ? String(data.volunteerCheckboxColorKey).trim() : "",
    volunteerButtonBgColorKey: data?.volunteerButtonBgColorKey != null ? String(data.volunteerButtonBgColorKey).trim() : "",
    volunteerButtonTextColorKey: data?.volunteerButtonTextColorKey != null ? String(data.volunteerButtonTextColorKey).trim() : "",
    volunteerChecklistBgColorKey: data?.volunteerChecklistBgColorKey != null ? String(data.volunteerChecklistBgColorKey).trim() : "",
    volunteerChecklistTitleColorKey: data?.volunteerChecklistTitleColorKey != null ? String(data.volunteerChecklistTitleColorKey).trim() : "",
    volunteerChecklistTextColorKey: data?.volunteerChecklistTextColorKey != null ? String(data.volunteerChecklistTextColorKey).trim() : "",
    volunteerChecklistBulletColorKey: data?.volunteerChecklistBulletColorKey != null ? String(data.volunteerChecklistBulletColorKey).trim() : "",
    volunteerFormCardRadius: data?.volunteerFormCardRadius ?? 14,
    volunteerInputRadius: data?.volunteerInputRadius ?? 8,
    volunteerChecklistCardRadius: data?.volunteerChecklistCardRadius ?? 14,
  });
}

function VolunteerEditForm(
  { source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
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
      .catch(() => message.error("Failed to load Volunteer"))
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
          titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
          volunteerTitleEnabled: values.volunteerTitleEnabled !== false,
          volunteerSubTitleEnabled: values.volunteerSubTitleEnabled !== false,
          volunteerSubTitleColorKey: values.volunteerSubTitleColorKey != null ? String(values.volunteerSubTitleColorKey).trim() : "",
          volunteerDescription: values.volunteerDescription != null ? String(values.volunteerDescription).trim() : "",
          volunteerDescriptionColorKey: values.volunteerDescriptionColorKey != null ? String(values.volunteerDescriptionColorKey).trim() : "",
          volunteerPageValue: values.volunteerPageValue != null ? String(values.volunteerPageValue).trim() : "volunteer",
          volunteerSourceValue: values.volunteerSourceValue != null ? String(values.volunteerSourceValue).trim() : "volunteer-form",
          volunteerSubjectLine: values.volunteerSubjectLine != null ? String(values.volunteerSubjectLine).trim() : "Volunteer Application",
          volunteerSubmitLabel: values.volunteerSubmitLabel != null ? String(values.volunteerSubmitLabel).trim() : "Submit Application",
          volunteerAreasOptions: values.volunteerAreasOptions != null ? String(values.volunteerAreasOptions).trim() : "",
          volunteerChecklistTitle: values.volunteerChecklistTitle != null ? String(values.volunteerChecklistTitle).trim() : "",
          volunteerChecklistDescription: values.volunteerChecklistDescription != null ? String(values.volunteerChecklistDescription).trim() : "",
          volunteerChecklistItems: values.volunteerChecklistItems != null ? String(values.volunteerChecklistItems).trim() : "",
          volunteerFormCardBgColorKey: values.volunteerFormCardBgColorKey != null ? String(values.volunteerFormCardBgColorKey).trim() : "",
          volunteerFormCardBorderColorKey: values.volunteerFormCardBorderColorKey != null ? String(values.volunteerFormCardBorderColorKey).trim() : "",
          volunteerLabelColorKey: values.volunteerLabelColorKey != null ? String(values.volunteerLabelColorKey).trim() : "",
          volunteerInputBgColorKey: values.volunteerInputBgColorKey != null ? String(values.volunteerInputBgColorKey).trim() : "",
          volunteerInputBorderColorKey: values.volunteerInputBorderColorKey != null ? String(values.volunteerInputBorderColorKey).trim() : "",
          volunteerInputTextColorKey: values.volunteerInputTextColorKey != null ? String(values.volunteerInputTextColorKey).trim() : "",
          volunteerPlaceholderColorKey: values.volunteerPlaceholderColorKey != null ? String(values.volunteerPlaceholderColorKey).trim() : "",
          volunteerCheckboxColorKey: values.volunteerCheckboxColorKey != null ? String(values.volunteerCheckboxColorKey).trim() : "",
          volunteerButtonBgColorKey: values.volunteerButtonBgColorKey != null ? String(values.volunteerButtonBgColorKey).trim() : "",
          volunteerButtonTextColorKey: values.volunteerButtonTextColorKey != null ? String(values.volunteerButtonTextColorKey).trim() : "",
          volunteerChecklistBgColorKey: values.volunteerChecklistBgColorKey != null ? String(values.volunteerChecklistBgColorKey).trim() : "",
          volunteerChecklistTitleColorKey: values.volunteerChecklistTitleColorKey != null ? String(values.volunteerChecklistTitleColorKey).trim() : "",
          volunteerChecklistTextColorKey: values.volunteerChecklistTextColorKey != null ? String(values.volunteerChecklistTextColorKey).trim() : "",
          volunteerChecklistBulletColorKey: values.volunteerChecklistBulletColorKey != null ? String(values.volunteerChecklistBulletColorKey).trim() : "",
          volunteerFormCardRadius: clamp(values.volunteerFormCardRadius, 0, 48, 14),
          volunteerInputRadius: clamp(values.volunteerInputRadius, 0, 24, 8),
          volunteerChecklistCardRadius: clamp(values.volunteerChecklistCardRadius, 0, 48, 14),
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
            message.success("Volunteer saved");
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
        defaultActiveKey={["manage-section", "title-colors", "content", "right-card", "layout"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("Volunteer")}
              />
            ),
          },
          {
            key: "content",
            label: "Form Content",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="volunteerDescription" label="Description text">
                    <Input.TextArea rows={3} placeholder="Section description under heading" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerPageValue" label="Submission page value">
                    <Input placeholder="volunteer" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerSourceValue" label="Submission source value">
                    <Input placeholder="volunteer-form" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerSubjectLine" label="Submission subject">
                    <Input placeholder="Volunteer Application" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteerSubmitLabel" label="Submit button label">
                    <Input placeholder="Submit Application" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="volunteerAreasOptions" label="Areas of interest options" extra="Comma-separated list">
                    <Input.TextArea
                      rows={2}
                      placeholder="Education Support,Health Awareness,Event Management,Administrative,Fundraising,Women's Empowerment"
                    />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "right-card",
            label: "Right Card Content",
            children: (
              <>
                <Form.Item name="volunteerChecklistTitle" label="Card title">
                  <Input placeholder="Ready to Start?" />
                </Form.Item>
                <Form.Item name="volunteerChecklistDescription" label="Card description">
                  <Input.TextArea rows={3} placeholder="If you meet these criteria..." />
                </Form.Item>
                <Form.Item name="volunteerChecklistItems" label="Bullet points" extra="One line per bullet">
                  <Input.TextArea
                    rows={4}
                    placeholder={"Quick application process\nOrientation within 2 weeks\nOngoing support & training"}
                  />
                </Form.Item>
              </>
            ),
          },
          {
            key: "layout",
            label: "Form Layout",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="volunteerFormCardRadius" label="Form card radius (px)">
                    <InputNumber min={0} max={48} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="volunteerInputRadius" label="Input radius (px)">
                    <InputNumber min={0} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="volunteerChecklistCardRadius" label="Right card radius (px)">
                    <InputNumber min={0} max={48} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(VolunteerEditForm);
