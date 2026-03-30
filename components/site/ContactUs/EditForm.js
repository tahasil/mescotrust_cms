"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/ContactUs";
const PREFIX = "contactUs";

function ContactUsEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
    const setFormAndColors = (data, theme) => {
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "",
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        contactUsTitleEnabled: data?.contactUsTitleEnabled !== false,
        contactUsSubTitleEnabled: data?.contactUsSubTitleEnabled !== false,
        contactUsSubTitleColorKey: data?.contactUsSubTitleColorKey != null ? String(data.contactUsSubTitleColorKey).trim() : "",
        contactUsBtnBgColorKey: data?.contactUsBtnBgColorKey != null ? String(data.contactUsBtnBgColorKey).trim() : "",
        contactUsBtnTextColorKey: data?.contactUsBtnTextColorKey != null ? String(data.contactUsBtnTextColorKey).trim() : "",
        contactUsFormHeadingColorKey: data?.contactUsFormHeadingColorKey != null ? String(data.contactUsFormHeadingColorKey).trim() : "",
        contactUsFormDescColorKey: data?.contactUsFormDescColorKey != null ? String(data.contactUsFormDescColorKey).trim() : "",
        contactUsIconColorKey: data?.contactUsIconColorKey != null ? String(data.contactUsIconColorKey).trim() : "",
        contactUsRegdOffice: data?.contactUsRegdOffice ?? "110, Natalwala Building, V. S. Road, Mahim(W), Mumbai - 400 016.",
        contactUsAdminOffice: data?.contactUsAdminOffice ?? "1 & 2, Plot No 423, Landmark Building, Next to Johnson & Johnson, Near Saraswati Mandir School, Senapati Bapat Marg, Mahim(W), Mumbai - 400016.",
        contactUsEmail: data?.contactUsEmail ?? "mescotrust@mescotrust.org",
        contactUsPhone: data?.contactUsPhone ?? "(+9122) 24441442, (+9122) 24448637",
        contactUsSubjects: data?.contactUsSubjects ?? "General Inquiry, Volunteering, Donation, Partnership, Other",
        contactUsMapEmbedUrl: data?.contactUsMapEmbedUrl ?? "",
      });
      if (theme) {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      }
    };

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      setFormAndColors(data);
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => setFormAndColors(data, theme))
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
      .then(([data, theme]) => setFormAndColors(data, theme))
      .catch(() => message.error("Failed to load Contact Us"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        contactUsTitleEnabled: values.contactUsTitleEnabled !== false,
        contactUsSubTitleEnabled: values.contactUsSubTitleEnabled !== false,
        contactUsSubTitleColorKey: values.contactUsSubTitleColorKey != null ? String(values.contactUsSubTitleColorKey).trim() : "",
        contactUsBtnBgColorKey: values.contactUsBtnBgColorKey != null ? String(values.contactUsBtnBgColorKey).trim() : "",
        contactUsBtnTextColorKey: values.contactUsBtnTextColorKey != null ? String(values.contactUsBtnTextColorKey).trim() : "",
        contactUsFormHeadingColorKey: values.contactUsFormHeadingColorKey != null ? String(values.contactUsFormHeadingColorKey).trim() : "",
        contactUsFormDescColorKey: values.contactUsFormDescColorKey != null ? String(values.contactUsFormDescColorKey).trim() : "",
        contactUsIconColorKey: values.contactUsIconColorKey != null ? String(values.contactUsIconColorKey).trim() : "",
        contactUsRegdOffice: values.contactUsRegdOffice != null ? String(values.contactUsRegdOffice).trim() : "",
        contactUsAdminOffice: values.contactUsAdminOffice != null ? String(values.contactUsAdminOffice).trim() : "",
        contactUsEmail: values.contactUsEmail != null ? String(values.contactUsEmail).trim() : "",
        contactUsPhone: values.contactUsPhone != null ? String(values.contactUsPhone).trim() : "",
        contactUsSubjects: values.contactUsSubjects != null ? String(values.contactUsSubjects).trim() : "",
        contactUsMapEmbedUrl: values.contactUsMapEmbedUrl != null ? String(values.contactUsMapEmbedUrl).trim() : "",
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
        .then((res) => { if (!res.ok) return res.json().then((d) => Promise.reject(d)); })
        .then(() => { message.success("Contact Us saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["contact-info"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("ContactUs")} />,
          },
          {
            key: "contact-info",
            label: "Contact Information",
            children: (
              <>
                <Form.Item name="contactUsRegdOffice" label="Regd. Office Address">
                  <Input.TextArea rows={2} placeholder="Registered office address" />
                </Form.Item>
                <Form.Item name="contactUsAdminOffice" label="Admin Office Address">
                  <Input.TextArea rows={3} placeholder="Admin office address" />
                </Form.Item>
                <Form.Item name="contactUsEmail" label="Email">
                  <Input placeholder="e.g. mescotrust@mescotrust.org" />
                </Form.Item>
                <Form.Item name="contactUsPhone" label="Phone">
                  <Input placeholder="e.g. (+9122) 24441442, (+9122) 24448637" />
                </Form.Item>
                <Form.Item name="contactUsSubjects" label="Subject Options" extra="Comma-separated list of subjects for the dropdown">
                  <Input placeholder="General Inquiry, Volunteering, Donation, Partnership, Other" />
                </Form.Item>
                <Form.Item name="contactUsMapEmbedUrl" label="Google Map Embed URL" extra="Go to Google Maps → Share → Embed a map → copy the src URL">
                  <Input.TextArea rows={2} placeholder="https://www.google.com/maps/embed?pb=..." />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(ContactUsEditForm);
