"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Row,
  Col,
  Collapse,
  message,
  Spin,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/HelpingEvents";
const PREFIX = "helpingEvents";

const FALLBACK_THEME_COLOR_KEYS = [
  "primary", "secondary", "white", "black", "headingColor",
  "paragraphColor", "linkColor", "mutedTextColor", "borderColor", "gradient",
];

/**
 * Edit form for HelpingEvents. Editable fields:
 * subtitle, main title, event title, description, image, button text/link.
 */
function HelpingEventsEditForm(
  { source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] },
  ref
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
    const setFormAndColors = (data, theme) => {
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "Events",
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "Helping people live a better tomorrow!",
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        eventTitle: data?.eventTitle != null ? String(data.eventTitle).trim() : "",
        eventDescription: data?.eventDescription != null ? String(data.eventDescription).trim() : "",
        eventImage: data?.eventImage != null ? String(data.eventImage).trim() : "/images/event-img.png",
        eventImageAlt: data?.eventImageAlt != null ? String(data.eventImageAlt).trim() : "Event",
        buttonText: data?.buttonText != null ? String(data.buttonText).trim() : "Donate Now",
        buttonLink: data?.buttonLink != null ? String(data.buttonLink).trim() : "/",
        helpingEventsButtonBgColorKey: data?.helpingEventsButtonBgColorKey != null ? String(data.helpingEventsButtonBgColorKey).trim() : "",
        helpingEventsButtonTextColorKey: data?.helpingEventsButtonTextColorKey != null ? String(data.helpingEventsButtonTextColorKey).trim() : "",
      });
      const palette = theme?.themePalette || {};
      const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
      const names = [
        ...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)]),
      ].sort();
      const keys = names.length > 0 ? names : FALLBACK_THEME_COLOR_KEYS;
      setThemeColorOptions(keys.map((name) => ({ label: name, value: name })));
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
      .catch(() => message.error("Failed to load Helping Events"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "Events",
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "Helping people live a better tomorrow!",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        eventTitle: values.eventTitle != null ? String(values.eventTitle).trim() : "",
        eventDescription: values.eventDescription != null ? String(values.eventDescription).trim() : "",
        eventImage: values.eventImage != null ? String(values.eventImage).trim() : "/images/event-img.png",
        eventImageAlt: values.eventImageAlt != null ? String(values.eventImageAlt).trim() : "Event",
        buttonText: values.buttonText != null ? String(values.buttonText).trim() : "Donate Now",
        buttonLink: values.buttonLink != null ? String(values.buttonLink).trim() : "/",
        helpingEventsButtonBgColorKey: values.helpingEventsButtonBgColorKey != null ? String(values.helpingEventsButtonBgColorKey).trim() : "",
        helpingEventsButtonTextColorKey: values.helpingEventsButtonTextColorKey != null ? String(values.helpingEventsButtonTextColorKey).trim() : "",
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
          message.success("Helping Events saved");
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
        defaultActiveKey={["content"]}
        items={[
          {
            key: "section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("HelpingEvents")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="subTitle" label="Subtitle">
                    <Input placeholder="e.g. Events" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mainTitle"
                    label="Main Title"
                    rules={[{ required: true, message: "Main title is required" }]}
                  >
                    <Input placeholder="e.g. Helping people live a better tomorrow!" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="eventTitle" label="Event Title">
                    <Input placeholder="Event heading text" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="eventDescription" label="Event Description">
                    <Input.TextArea rows={5} placeholder="Event description text" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "image",
            label: "Image",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="eventImage" label="Event Image URL">
                    <MediaPickerInput placeholder="e.g. /images/event-img.png" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="eventImageAlt" label="Image Alt Text">
                    <Input placeholder="e.g. Event" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "button",
            label: "Button",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="buttonText" label="Button Text">
                    <Input placeholder="e.g. Donate Now" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="buttonLink" label="Button Link (URL)">
                    <Input placeholder="e.g. /donate" size="large" />
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

export default forwardRef(HelpingEventsEditForm);
