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
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";

const API_PATH = "/api/theme/VideoPlaying";
const PREFIX = "videoPlaying";

const FALLBACK_THEME_COLOR_KEYS = [
  "primary",
  "secondary",
  "white",
  "black",
  "headingColor",
  "paragraphColor",
  "linkColor",
  "mutedTextColor",
  "borderColor",
  "gradient",
];

/**
 * Edit form for VideoPlaying. Editable fields:
 * YouTube video ID, cover image URL, cover alt text.
 */
function VideoPlayingEditForm(
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
        youtubeVideoId:
          data?.youtubeVideoId != null ? String(data.youtubeVideoId).trim() : "dQw4w9WgXcQ",
        coverImage:
          data?.coverImage != null ? String(data.coverImage).trim() : "/images/player-cover.png",
        coverAlt:
          data?.coverAlt != null ? String(data.coverAlt).trim() : "Video cover",
      });
      const palette = theme?.themePalette || {};
      const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
      const names = [
        ...new Set([
          ...Object.keys(palette),
          ...customColors.map((c) => c?.name).filter(Boolean),
        ]),
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
      .then(([data, theme]) => {
        setFormAndColors(data, theme);
      })
      .catch(() => message.error("Failed to load Video Playing"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        youtubeVideoId:
          values.youtubeVideoId != null ? String(values.youtubeVideoId).trim() : "dQw4w9WgXcQ",
        coverImage:
          values.coverImage != null ? String(values.coverImage).trim() : "/images/player-cover.png",
        coverAlt:
          values.coverAlt != null ? String(values.coverAlt).trim() : "Video cover",
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
          message.success("Video Playing saved");
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
            key: "content",
            label: "Video Settings",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    name="youtubeVideoId"
                    label="YouTube Video ID"
                    rules={[{ required: true, message: "YouTube Video ID is required" }]}
                    extra="The ID from the YouTube URL (e.g. dQw4w9WgXcQ from youtube.com/watch?v=dQw4w9WgXcQ)"
                  >
                    <Input placeholder="e.g. dQw4w9WgXcQ" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="coverImage"
                    label="Cover Image URL"
                  >
                    <MediaPickerInput placeholder="e.g. /images/player-cover.png" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="coverAlt"
                    label="Cover Image Alt Text"
                  >
                    <Input placeholder="e.g. Video cover" size="large" />
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

export default forwardRef(VideoPlayingEditForm);
