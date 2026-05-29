"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  message,
  Spin,
  Collapse,
  Select,
  Row,
  Col,
  InputNumber,
  Switch,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/MediaControl";
const PREFIX = "mediaControl";

const DEFAULTS = Object.freeze({
  mainTitle: "",
  subTitle: "",
  titleAlign: "left",
  mediaType: "video",
  youtubeUrl: "",
  externalMediaUrl: "",
  uploadedMediaUrl: "",
  posterImageUrl: "",
  playIconUrl: "",
  placeholderTitle: "Video Content Coming Soon",
  placeholderSubTitle:
    "Events, programme highlights, and community stories.",
  unsupportedTitle: "Unsupported Media Source",
  unsupportedSubTitle: "Please provide a supported media URL or upload a media file.",
  autoplay: false,
  loop: false,
  muted: false,
  showControls: true,
  enableFullscreen: true,
  enableDownload: true,
  startTime: 0,
  endTime: 0,
  volume: 80,
  preload: "metadata",
  playerHeightDesktop: 340,
  playerHeightMobile: 230,
  playerRadius: 18,
  playButtonSize: 54,
  playIconSize: 18,
});

const MEDIA_TYPE_OPTIONS = [
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
];

const PRELOAD_OPTIONS = [
  { value: "none", label: "None" },
  { value: "metadata", label: "Metadata" },
  { value: "auto", label: "Auto" },
];

const ALLOWED_MEDIA_MIME_TYPES = Object.freeze([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/flac",
  "audio/mp4",
  "audio/ogg",
  "audio/opus",
]);

function getTitleColorsConfig() {
  return {
    ...getTitleAndColorsConfig("MediaControl"),
    titleListItems: [],
  };
}

function getMediaControlColorItems() {
  return getTitleAndColorsConfig("MediaControl")?.colorListItems || [];
}

function trimValue(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function normalizeAlign(value, fallback = "left") {
  const next = String(value ?? fallback).trim().toLowerCase();
  if (next === "left" || next === "center" || next === "right") return next;
  return fallback;
}

function normalizeMediaType(value, fallback = "video") {
  const next = String(value ?? fallback).trim().toLowerCase();
  return next === "audio" ? "audio" : "video";
}

function normalizePreload(value, fallback = "metadata") {
  const next = String(value ?? fallback).trim().toLowerCase();
  if (next === "none" || next === "metadata" || next === "auto") return next;
  return fallback;
}

function toOptionalNumber(value, min, max) {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;
  if (Number.isFinite(min) && num < min) return min;
  if (Number.isFinite(max) && num > max) return max;
  return num;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const next = value.trim().toLowerCase();
    if (next === "true") return true;
    if (next === "false") return false;
  }
  return fallback;
}

function buildThemeColorOptions(theme = {}) {
  const palette =
    theme?.frontendUiColors && typeof theme.frontendUiColors === "object"
      ? theme.frontendUiColors
      : theme?.themePalette && typeof theme.themePalette === "object"
        ? theme.themePalette
        : {};
  const names = Object.keys(palette).sort();
  return names.map((name) => ({ label: name, value: name }));
}

function applyFormValues(form, data = {}) {
  const colorFieldValues = {};
  getMediaControlColorItems().forEach((item) => {
    const fieldName = item?.name;
    if (!fieldName) return;
    colorFieldValues[fieldName] = trimValue(data[fieldName], "");
  });

  const incomingMediaType = normalizeMediaType(
    data.mediaControlMediaType ?? data.mediaType,
    DEFAULTS.mediaType,
  );

  form.setFieldsValue({
    mainTitle: trimValue(data.mainTitle, DEFAULTS.mainTitle),
    subTitle: trimValue(data.subTitle, DEFAULTS.subTitle),
    titleAlign: normalizeAlign(data.titleAlign, DEFAULTS.titleAlign),
    mediaControlMediaType: incomingMediaType,
    mediaControlYouTubeUrl: trimValue(
      data.mediaControlYouTubeUrl ?? data.youtubeUrl,
      DEFAULTS.youtubeUrl,
    ),
    mediaControlExternalMediaUrl: trimValue(
      data.mediaControlExternalMediaUrl ?? data.mediaControlMediaUrl ?? data.mediaUrl,
      DEFAULTS.externalMediaUrl,
    ),
    mediaControlUploadedMediaUrl: trimValue(
      data.mediaControlUploadedMediaUrl,
      DEFAULTS.uploadedMediaUrl,
    ),
    mediaControlPosterImageUrl: trimValue(
      data.mediaControlPosterImageUrl,
      DEFAULTS.posterImageUrl,
    ),
    mediaControlPlayIconUrl: trimValue(data.mediaControlPlayIconUrl, DEFAULTS.playIconUrl),
    mediaControlPlaceholderTitle: trimValue(
      data.mediaControlPlaceholderTitle,
      incomingMediaType === "audio"
        ? "Audio Content Coming Soon"
        : DEFAULTS.placeholderTitle,
    ),
    mediaControlPlaceholderSubTitle: trimValue(
      data.mediaControlPlaceholderSubTitle,
      incomingMediaType === "audio"
        ? "Conversations with the executive team, coaches, and successful founders."
        : DEFAULTS.placeholderSubTitle,
    ),
    mediaControlUnsupportedTitle: trimValue(
      data.mediaControlUnsupportedTitle,
      DEFAULTS.unsupportedTitle,
    ),
    mediaControlUnsupportedSubTitle: trimValue(
      data.mediaControlUnsupportedSubTitle,
      DEFAULTS.unsupportedSubTitle,
    ),
    mediaControlAutoplay:
      toBoolean(data.mediaControlAutoplay ?? data.autoplay, DEFAULTS.autoplay) === true,
    mediaControlLoop:
      toBoolean(data.mediaControlLoop ?? data.loop, DEFAULTS.loop) === true,
    mediaControlMuted:
      toBoolean(data.mediaControlMuted ?? data.muted, DEFAULTS.muted) === true,
    mediaControlShowControls:
      toBoolean(
        data.mediaControlShowControls ?? data.showControls,
        DEFAULTS.showControls,
      ) === true,
    mediaControlEnableFullscreen:
      toBoolean(
        data.mediaControlEnableFullscreen ?? data.enableFullscreen,
        DEFAULTS.enableFullscreen,
      ) === true,
    mediaControlEnableDownload:
      toBoolean(
        data.mediaControlEnableDownload ?? data.enableDownload,
        DEFAULTS.enableDownload,
      ) === true,
    mediaControlStartTime:
      toOptionalNumber(data.mediaControlStartTime ?? data.startTime, 0, 86400) ??
      DEFAULTS.startTime,
    mediaControlEndTime:
      toOptionalNumber(data.mediaControlEndTime ?? data.endTime, 0, 86400) ??
      DEFAULTS.endTime,
    mediaControlVolume:
      toOptionalNumber(data.mediaControlVolume ?? data.volume, 0, 100) ?? DEFAULTS.volume,
    mediaControlPreload: normalizePreload(
      data.mediaControlPreload ?? data.preload,
      DEFAULTS.preload,
    ),
    mediaControlPlayerHeightDesktop:
      toOptionalNumber(
        data.mediaControlPlayerHeightDesktop ?? data.playerHeightDesktop,
        180,
        1200,
      ) ?? DEFAULTS.playerHeightDesktop,
    mediaControlPlayerHeightMobile:
      toOptionalNumber(
        data.mediaControlPlayerHeightMobile ?? data.playerHeightMobile,
        140,
        800,
      ) ?? DEFAULTS.playerHeightMobile,
    mediaControlPlayerRadius:
      toOptionalNumber(data.mediaControlPlayerRadius ?? data.playerRadius, 0, 60) ??
      DEFAULTS.playerRadius,
    mediaControlPlayButtonSize:
      toOptionalNumber(data.mediaControlPlayButtonSize ?? data.playButtonSize, 28, 180) ??
      DEFAULTS.playButtonSize,
    mediaControlPlayIconSize:
      toOptionalNumber(data.mediaControlPlayIconSize ?? data.playIconSize, 10, 100) ??
      DEFAULTS.playIconSize,
    ...getManageSectionInitialValues(PREFIX, data),
    ...colorFieldValues,
  });
}

function buildPayload(values = {}) {
  const payload = {
    ...values,
    ...getManageSectionPayload(PREFIX, values),
    mainTitle: trimValue(values.mainTitle, ""),
    subTitle: trimValue(values.subTitle, ""),
    titleAlign: normalizeAlign(values.titleAlign, DEFAULTS.titleAlign),
    mediaControlMediaType: normalizeMediaType(
      values.mediaControlMediaType,
      DEFAULTS.mediaType,
    ),
    mediaControlYouTubeUrl: trimValue(values.mediaControlYouTubeUrl, ""),
    mediaControlExternalMediaUrl: trimValue(values.mediaControlExternalMediaUrl, ""),
    mediaControlUploadedMediaUrl: trimValue(values.mediaControlUploadedMediaUrl, ""),
    mediaControlPosterImageUrl: trimValue(values.mediaControlPosterImageUrl, ""),
    mediaControlPlayIconUrl: trimValue(values.mediaControlPlayIconUrl, ""),
    mediaControlPlaceholderTitle: trimValue(values.mediaControlPlaceholderTitle, ""),
    mediaControlPlaceholderSubTitle: trimValue(values.mediaControlPlaceholderSubTitle, ""),
    mediaControlUnsupportedTitle: trimValue(values.mediaControlUnsupportedTitle, ""),
    mediaControlUnsupportedSubTitle: trimValue(values.mediaControlUnsupportedSubTitle, ""),
    mediaControlAutoplay:
      toBoolean(values.mediaControlAutoplay, DEFAULTS.autoplay) === true,
    mediaControlLoop: toBoolean(values.mediaControlLoop, DEFAULTS.loop) === true,
    mediaControlMuted: toBoolean(values.mediaControlMuted, DEFAULTS.muted) === true,
    mediaControlShowControls:
      toBoolean(values.mediaControlShowControls, DEFAULTS.showControls) === true,
    mediaControlEnableFullscreen:
      toBoolean(values.mediaControlEnableFullscreen, DEFAULTS.enableFullscreen) === true,
    mediaControlEnableDownload:
      toBoolean(values.mediaControlEnableDownload, DEFAULTS.enableDownload) === true,
    mediaControlStartTime: toOptionalNumber(values.mediaControlStartTime, 0, 86400),
    mediaControlEndTime: toOptionalNumber(values.mediaControlEndTime, 0, 86400),
    mediaControlVolume: toOptionalNumber(values.mediaControlVolume, 0, 100),
    mediaControlPreload: normalizePreload(values.mediaControlPreload, DEFAULTS.preload),
    mediaControlPlayerHeightDesktop: toOptionalNumber(
      values.mediaControlPlayerHeightDesktop,
      180,
      1200,
    ),
    mediaControlPlayerHeightMobile: toOptionalNumber(
      values.mediaControlPlayerHeightMobile,
      140,
      800,
    ),
    mediaControlPlayerRadius: toOptionalNumber(values.mediaControlPlayerRadius, 0, 60),
    mediaControlPlayButtonSize: toOptionalNumber(
      values.mediaControlPlayButtonSize,
      28,
      180,
    ),
    mediaControlPlayIconSize: toOptionalNumber(values.mediaControlPlayIconSize, 10, 100),
  };

  getMediaControlColorItems().forEach((item) => {
    const fieldName = item?.name;
    if (!fieldName) return;
    payload[fieldName] = trimValue(values[fieldName], "");
  });

  return payload;
}

/**
 * Edit form for MediaControl used by component drawer and page blocks.
 */
function MediaControlEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
      return;
    }
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => setThemeColorOptions(buildThemeColorOptions(theme)))
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyFormValues(form, initialDataProp ?? {});
      setLoading(false);
      return;
    }

    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => applyFormValues(form, data))
      .catch(() => message.error("Failed to load Media Control"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const payload = buildPayload(form.getFieldsValue(true));
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
            message.success("Media Control saved");
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
    <Form form={form} layout="vertical" disabled={saving}>
      <Collapse
        defaultActiveKey={[
          "manage-section",
          "title-colors",
          "content",
          "source",
          "controls",
          "layout",
        ]}
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
                  <Form.Item name="subTitle" label="Subtitle">
                    <Input
                      placeholder="Programme recordings, community showcase events..."
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="mainTitle" label="Main title">
                    <Input placeholder="Media" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="titleAlign"
                    label="Title align"
                    rules={[{ required: true, message: "Align is required" }]}
                  >
                    <Select
                      options={[
                        { label: "Left", value: "left" },
                        { label: "Center", value: "center" },
                        { label: "Right", value: "right" },
                      ]}
                      placeholder="Select align"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mediaControlPlaceholderTitle"
                    label="Placeholder title"
                    rules={[{ required: true, message: "Placeholder title is required" }]}
                  >
                    <Input placeholder="Video Content Coming Soon" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mediaControlPlaceholderSubTitle"
                    label="Placeholder subtitle"
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Events, programme highlights, community stories..."
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mediaControlUnsupportedTitle"
                    label="Unsupported source title"
                    rules={[{ required: true, message: "Fallback title is required" }]}
                  >
                    <Input placeholder="Unsupported Media Source" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mediaControlUnsupportedSubTitle"
                    label="Unsupported source subtitle"
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Please provide a supported media URL or upload a media file."
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "source",
            label: "Source",
            children: (
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Form.Item
                    name="mediaControlMediaType"
                    label="Media type"
                    rules={[{ required: true, message: "Media type is required" }]}
                  >
                    <Select
                      options={MEDIA_TYPE_OPTIONS}
                      placeholder="Select media type"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mediaControlYouTubeUrl"
                    label="YouTube URL"
                  >
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mediaControlExternalMediaUrl"
                    label="External media URL"
                    extra="Use direct MP4/WEBM/MP3/WAV etc URLs. Prefer https:// links."
                  >
                    <Input placeholder="https://cdn.example.com/media.mp4" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mediaControlUploadedMediaUrl"
                    label="Uploaded media file"
                    extra="Optional. Uploaded file takes priority over external URL."
                  >
                    <MediaPickerInput
                      placeholder="/media/..."
                      uiVariant="stacked"
                      mediaLibraryType="document"
                      allowedMimeTypes={ALLOWED_MEDIA_MIME_TYPES}
                      uploadAccept="video/*,audio/*"
                      uploadButtonLabel="Upload media"
                      libraryTitle="Media Library"
                      emptyLibraryText="No media files found"
                      emptySelectionText="No media file selected"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mediaControlPosterImageUrl"
                    label="Thumbnail / Poster image"
                    extra="Shown before playback and used as preview cover."
                  >
                    <MediaPickerInput placeholder="/media/poster.jpg" uiVariant="stacked" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mediaControlPlayIconUrl"
                    label="Custom play icon"
                    extra="Optional icon image for play button."
                  >
                    <MediaPickerInput placeholder="/media/icons/play.svg" uiVariant="stacked" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "controls",
            label: "Player Controls",
            children: (
              <Row gutter={[16, 8]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="mediaControlAutoplay"
                    label="Autoplay"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="mediaControlLoop" label="Loop" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="mediaControlMuted" label="Muted" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="mediaControlShowControls"
                    label="Show controls"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="mediaControlEnableFullscreen"
                    label="Enable fullscreen"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="mediaControlEnableDownload"
                    label="Enable download"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="mediaControlStartTime" label="Start time (sec)">
                    <InputNumber style={{ width: "100%" }} min={0} max={86400} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="mediaControlEndTime" label="End time (sec)">
                    <InputNumber style={{ width: "100%" }} min={0} max={86400} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="mediaControlVolume" label="Volume (0-100)">
                    <InputNumber style={{ width: "100%" }} min={0} max={100} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="mediaControlPreload" label="Preload mode">
                    <Select options={PRELOAD_OPTIONS} size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "layout",
            label: "Layout",
            children: (
              <Row gutter={[16, 8]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="mediaControlPlayerHeightDesktop"
                    label="Player height desktop (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={180} max={1200} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="mediaControlPlayerHeightMobile"
                    label="Player height mobile (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={140} max={800} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="mediaControlPlayerRadius" label="Player radius (px)">
                    <InputNumber style={{ width: "100%" }} min={0} max={60} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="mediaControlPlayButtonSize" label="Play button size (px)">
                    <InputNumber style={{ width: "100%" }} min={28} max={180} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="mediaControlPlayIconSize" label="Play icon size (px)">
                    <InputNumber style={{ width: "100%" }} min={10} max={100} />
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

export default forwardRef(MediaControlEditForm);
