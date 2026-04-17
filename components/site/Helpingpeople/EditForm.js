"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Collapse, message, Spin } from "antd";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Helpingpeople";
const PREFIX = "helpingpeople";

/**
 * Edit form for Helpingpeople — used in component edit drawer.
 * Title & Colors: main title, title color, text color.
 * Content: paragraph text + image URL.
 */
function HelpingpeopleEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  function applyFormValues(data) {
    form.setFieldsValue({
      helpingpeopleMainTitle: data?.helpingpeopleMainTitle != null ? String(data.helpingpeopleMainTitle).trim() : "Helping people live better tomorrow",
      helpingpeopleParagraph: data?.helpingpeopleParagraph != null ? String(data.helpingpeopleParagraph).trim() : "",
      helpingpeopleImageDesktop:
        data?.helpingpeopleImageDesktop != null
          ? String(data.helpingpeopleImageDesktop).trim()
          : data?.helpingpeopleImageUrl != null
            ? String(data.helpingpeopleImageUrl).trim()
            : "/images/about-mesco-3.png",
      helpingpeopleImageMobile:
        data?.helpingpeopleImageMobile != null
          ? String(data.helpingpeopleImageMobile).trim()
          : "",
      helpingpeopleImageUrl:
        data?.helpingpeopleImageDesktop != null
          ? String(data.helpingpeopleImageDesktop).trim()
          : data?.helpingpeopleImageUrl != null
            ? String(data.helpingpeopleImageUrl).trim()
            : "/images/about-mesco-3.png",
      helpingpeopleImageAlt: data?.helpingpeopleImageAlt != null ? String(data.helpingpeopleImageAlt).trim() : "Helping people",
      helpingpeopleTitleColorKey: data?.helpingpeopleTitleColorKey != null ? String(data.helpingpeopleTitleColorKey).trim() : "",
      helpingpeopleTextColorKey: data?.helpingpeopleTextColorKey != null ? String(data.helpingpeopleTextColorKey).trim() : "",
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
      .catch(() => message.error("Failed to load Helping People"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        helpingpeopleMainTitle: values.helpingpeopleMainTitle != null ? String(values.helpingpeopleMainTitle).trim() : "",
        helpingpeopleParagraph: values.helpingpeopleParagraph != null ? String(values.helpingpeopleParagraph).trim() : "",
        helpingpeopleImageDesktop:
          values.helpingpeopleImageDesktop != null
            ? String(values.helpingpeopleImageDesktop).trim()
            : values.helpingpeopleImageUrl != null
              ? String(values.helpingpeopleImageUrl).trim()
              : "",
        helpingpeopleImageMobile:
          values.helpingpeopleImageMobile != null
            ? String(values.helpingpeopleImageMobile).trim()
            : "",
        helpingpeopleImageUrl:
          values.helpingpeopleImageDesktop != null
            ? String(values.helpingpeopleImageDesktop).trim()
            : values.helpingpeopleImageUrl != null
              ? String(values.helpingpeopleImageUrl).trim()
              : "",
        helpingpeopleImageAlt: values.helpingpeopleImageAlt != null ? String(values.helpingpeopleImageAlt).trim() : "",
        helpingpeopleTitleColorKey: values.helpingpeopleTitleColorKey != null ? String(values.helpingpeopleTitleColorKey).trim() : "",
        helpingpeopleTextColorKey: values.helpingpeopleTextColorKey != null ? String(values.helpingpeopleTextColorKey).trim() : "",
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
          message.success("Helping People saved");
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
        defaultActiveKey={["manage-section", "title-colors", "content"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Helpingpeople")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item name="helpingpeopleParagraph" label="Paragraph">
                  <RichTextEditor placeholder="Enter paragraph text..." />
                </Form.Item>
                <Form.Item name="helpingpeopleImageDesktop" label="Desktop Image">
                  <MediaPickerInput
                    placeholder="/images/about-mesco-3.png"
                    uiVariant="stacked"
                    hintText="Recommended for desktop/tablet"
                  />
                </Form.Item>
                <Form.Item name="helpingpeopleImageMobile" label="Mobile Image">
                  <MediaPickerInput
                    placeholder="/images/about-mesco-3-mobile.png"
                    uiVariant="stacked"
                    hintText="Optional. Desktop image will be used if empty."
                  />
                </Form.Item>
                <Form.Item name="helpingpeopleImageAlt" label="Image Alt Text">
                  <Input placeholder="Helping people" size="large" />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(HelpingpeopleEditForm);
