"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Card,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  message,
} from "antd";
import { ColorSettingsCard, SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import SortableFormList from "@/components/admin/SortableFormList";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import {
  HOME_SLIDER_DEFAULT_PROPS,
  HOME_SLIDER_DEFAULT_SLIDES,
  HOME_SLIDER_TYPE_OPTIONS,
} from "./defaults";

const API_PATH = "/api/theme/HomeSlider";
const PREFIX = "homeSlider";

const TARGET_OPTIONS = [
  { value: "_self", label: "Same Tab (_self)" },
  { value: "_blank", label: "New Tab (_blank)" },
];

const ALIGNMENT_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const POSITION_OPTIONS = [
  "center center",
  "center top",
  "center bottom",
  "left center",
  "right center",
].map((value) => ({ value, label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()) }));

const clean = (value) => String(value ?? "").trim();
const target = (value) => (value === "_blank" ? "_blank" : "_self");

function normalizeMediaInputUrl(val) {
  const s = clean(val);
  if (!s) return "";
  if (typeof window !== "undefined" && (s.startsWith("http://") || s.startsWith("https://"))) {
    try {
      const u = new URL(s);
      if (u.origin === window.location.origin && u.pathname.startsWith("/media/")) {
        return `${u.pathname}${u.search || ""}`;
      }
    } catch {}
  }
  return s;
}

function normalizeSlide(item = {}, index = 0) {
  const fallback = HOME_SLIDER_DEFAULT_SLIDES[index % HOME_SLIDER_DEFAULT_SLIDES.length] || HOME_SLIDER_DEFAULT_SLIDES[0];
  return {
    ...fallback,
    ...item,
    active: item?.active !== false,
    mediaType: item?.mediaType === "video" ? "video" : "image",
    videoStyle: ["style1", "style2", "style3"].includes(item?.videoStyle)
      ? item.videoStyle
      : (fallback?.videoStyle || "style3"),
    image: normalizeMediaInputUrl(item?.image ?? fallback.image),
    mobileImage: normalizeMediaInputUrl(item?.mobileImage),
    videoUrl: normalizeMediaInputUrl(item?.videoUrl),
    videoPoster: normalizeMediaInputUrl(item?.videoPoster),
    videoFit: item?.videoFit === "cover" ? "cover" : "contain",
    alt: clean(item?.alt ?? fallback.alt),
    backgroundPosition: clean(item?.backgroundPosition || "center center"),
    smallTitle: clean(item?.smallTitle ?? fallback.smallTitle),
    smallTitleUrl: clean(item?.smallTitleUrl ?? fallback.smallTitleUrl),
    smallTitleTarget: target(item?.smallTitleTarget),
    headingLine1: clean(item?.headingLine1 ?? fallback.headingLine1),
    headingLine2: clean(item?.headingLine2 ?? fallback.headingLine2),
    headingHighlight: clean(item?.headingHighlight ?? fallback.headingHighlight),
    description: clean(item?.description ?? fallback.description),
    primaryButtonLabel: clean(item?.primaryButtonLabel ?? fallback.primaryButtonLabel),
    primaryButtonUrl: clean(item?.primaryButtonUrl ?? fallback.primaryButtonUrl),
    primaryButtonTarget: target(item?.primaryButtonTarget),
    secondaryButtonLabel: clean(item?.secondaryButtonLabel ?? fallback.secondaryButtonLabel),
    secondaryButtonUrl: clean(item?.secondaryButtonUrl ?? fallback.secondaryButtonUrl),
    secondaryButtonTarget: target(item?.secondaryButtonTarget),
    captionTitle: clean(item?.captionTitle ?? fallback.captionTitle),
    captionButtonLabel: clean(item?.captionButtonLabel ?? fallback.captionButtonLabel),
    captionButtonUrl: clean(item?.captionButtonUrl ?? fallback.captionButtonUrl),
    captionButtonTarget: target(item?.captionButtonTarget),
    textAlignment: ["center", "right"].includes(item?.textAlignment) ? item.textAlignment : "left",
    overlayOpacity: Number.isFinite(Number(item?.overlayOpacity)) ? Number(item.overlayOpacity) : 100,
    headingColorKey: clean(item?.headingColorKey || "warmWhite"),
    highlightColorKey: clean(item?.highlightColorKey || "primarySoft"),
    descriptionColorKey: clean(item?.descriptionColorKey || "white"),
    primaryButtonBgColorKey: clean(item?.primaryButtonBgColorKey || "primary"),
    primaryButtonTextColorKey: clean(item?.primaryButtonTextColorKey || "white"),
    secondaryButtonTextColorKey: clean(item?.secondaryButtonTextColorKey || "white"),
  };
}

function normalizeSettings(data = {}) {
  const source = { ...HOME_SLIDER_DEFAULT_PROPS, ...(data || {}) };
  const slides = Array.isArray(source.homeSliderSlides) && source.homeSliderSlides.length
    ? source.homeSliderSlides
    : HOME_SLIDER_DEFAULT_SLIDES;
  const legacyStyle = slides.find((s) => ["style1", "style2", "style3"].includes(s?.videoStyle))?.videoStyle;
  const homeSliderType = ["style1", "style2", "style3"].includes(source.homeSliderType)
    ? source.homeSliderType
    : (legacyStyle || "style2");
  return {
    homeSliderType,
    homeSliderSlides: slides.map(normalizeSlide),
    homeSliderAutoplay: source.homeSliderAutoplay !== false,
    homeSliderAutoplaySpeed: Number(source.homeSliderAutoplaySpeed) || 6000,
    homeSliderTransitionSpeed: Number(source.homeSliderTransitionSpeed) || 1100,
    homeSliderShowRail: source.homeSliderShowRail !== false,
    homeSliderPauseOnHover: source.homeSliderPauseOnHover !== false,
    homeSliderSwipeEnabled: source.homeSliderSwipeEnabled !== false,
    homeSliderMinHeight: Number.isFinite(Number(source.homeSliderMinHeight)) ? Number(source.homeSliderMinHeight) : 0,
    homeSliderBackgroundColorKey: clean(source.homeSliderBackgroundColorKey || "dark"),
    homeSliderRailColorKey: clean(source.homeSliderRailColorKey || "primary"),
    homeSliderBadgeEnabled: source.homeSliderBadgeEnabled !== false,
    homeSliderBadgeText: clean(source.homeSliderBadgeText),
    homeSliderBadgeUrl: clean(source.homeSliderBadgeUrl),
    homeSliderBadgeTarget: target(source.homeSliderBadgeTarget),
    homeSliderBadgeAriaLabel: clean(source.homeSliderBadgeAriaLabel),
  };
}

function HomeSliderEditForm(
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
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const fetchedThemeRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp.length) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const apply = (data, theme) => {
      if (cancelled) return;
      form.setFieldsValue({
        ...normalizeSettings(data),
        ...getManageSectionInitialValues(PREFIX, data),
      });
      if (theme) {
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((entry) => entry?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      }
    };

    if (isPageBlock) {
      const data = initialDataProp || HOME_SLIDER_DEFAULT_PROPS;
      apply(data);
      if (!fetchedThemeRef.current) {
        fetchedThemeRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((response) => (response.ok ? response.json() : {}))
          .then((theme) => apply(data, theme))
          .catch(() => {})
          .finally(() => !cancelled && setLoading(false));
      } else {
        setLoading(false);
      }
      return () => { cancelled = true; };
    }

    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((response) => (response.ok ? response.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((response) => (response.ok ? response.json() : {})),
    ])
      .then(([data, theme]) => apply(data, theme))
      .catch(() => message.error("Failed to load Home Slider"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [form, initialDataProp, isPageBlock]);

  const handleUpdate = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      const payload = {
        ...normalizeSettings(values),
        ...getManageSectionPayload(PREFIX, values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      const response = await fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Failed to save Home Slider");
      message.success("Home Slider saved");
      onSuccess?.();
    } catch (error) {
      if (!error?.errorFields) message.error(error?.message || "Failed to save Home Slider");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }));

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;

  const colorOptions = themeColorOptions.length
    ? themeColorOptions
    : ["dark", "warmWhite", "white", "primary", "primarySoft"].map((value) => ({ label: value, value }));

  return (
    <Form form={form} layout="vertical" disabled={saving}>
      <Collapse
        defaultActiveKey={["slides"]}
        items={[
          {
            key: "section",
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
            key: "settings",
            label: "Slider Settings",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="homeSliderType" label="Slider Type">
                      <Select options={HOME_SLIDER_TYPE_OPTIONS} />
                    </Form.Item>
                  </Col>
                </Row>
                <SwitchSettingsCard items={[
                  { name: "homeSliderAutoplay", label: "Autoplay", tooltip: "Advance slides automatically" },
                  { name: "homeSliderShowRail", label: "Progress rail", tooltip: "Show the vertical slide progress controls" },
                  { name: "homeSliderPauseOnHover", label: "Pause on hover", tooltip: "Pause autoplay while the pointer is over the slider" },
                  { name: "homeSliderSwipeEnabled", label: "Swipe navigation", tooltip: "Allow horizontal pointer and touch swipes" },
                ]} />
                <Row gutter={16}>
                  <Col span={12}><Form.Item name="homeSliderAutoplaySpeed" label="Autoplay delay (ms)"><InputNumber min={1500} max={60000} step={500} style={{ width: "100%" }} /></Form.Item></Col>
                  <Col span={12}><Form.Item name="homeSliderTransitionSpeed" label="Transition (ms)"><InputNumber min={200} max={2500} step={100} style={{ width: "100%" }} /></Form.Item></Col>
                  <Col span={12}><Form.Item name="homeSliderMinHeight" label="Additional minimum height (px)" extra="0 keeps the exact viewport-height design"><InputNumber min={0} max={1400} step={20} style={{ width: "100%" }} /></Form.Item></Col>
                </Row>
                <ColorSettingsCard options={colorOptions} items={[
                  { name: "homeSliderBackgroundColorKey", label: "Background", tooltip: "Slider background color." },
                  { name: "homeSliderRailColorKey", label: "Progress", tooltip: "Progress rail color." },
                ]} />
              </div>
            ),
          },
          {
            key: "badge",
            label: "Rotating Badge",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <SwitchSettingsCard items={[{ name: "homeSliderBadgeEnabled", label: "Show badge", tooltip: "Display the rotating badge." }]} />
                <Row gutter={16}>
                <Col span={24}><Form.Item name="homeSliderBadgeText" label="Circular text"><Input /></Form.Item></Col>
                <Col span={24}><Form.Item name="homeSliderBadgeUrl" label="Link"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="homeSliderBadgeTarget" label="Target"><Select options={TARGET_OPTIONS} /></Form.Item></Col>
                <Col span={12}><Form.Item name="homeSliderBadgeAriaLabel" label="Accessible label"><Input /></Form.Item></Col>
                </Row>
              </div>
            ),
          },
          {
            key: "slides",
            label: "Manage Slides",
            children: (
              <Form.List name="homeSliderSlides">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Slide"
                    addButtonText="Add slide"
                    defaultAddPayload={normalizeSlide({ image: "", captionTitle: "New Slide" }, 0)}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      window.setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    resolveItemTitle={(name) => form.getFieldValue(["homeSliderSlides", name, "captionTitle"]) || `Slide ${name + 1}`}
                    renderItemContent={(name, restField) => (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <Card size="small" title="Status & Background">
                          <Row gutter={16}>
                            <Col span={24}><SwitchSettingsCard items={[{ name: [name, "active"], label: "Active", tooltip: "Enable this slide." }]} /></Col>
                            <Col span={24}><Form.Item {...restField} name={[name, "mediaType"]} label="Media type"><Select options={[{ value: "image", label: "Image" }, { value: "video", label: "Video" }]} /></Form.Item></Col>
                            <Form.Item
                              noStyle
                              shouldUpdate={(prev, curr) =>
                                prev?.homeSliderSlides?.[name]?.mediaType !== curr?.homeSliderSlides?.[name]?.mediaType
                              }
                            >
                              {({ getFieldValue }) => {
                                const currentMediaType = getFieldValue(["homeSliderSlides", name, "mediaType"]) || "image";
                                const isVideo = currentMediaType === "video";
                                if (isVideo) {
                                  return (
                                    <>
                                      <Col span={24}>
                                        <Form.Item
                                          {...restField}
                                          name={[name, "videoUrl"]}
                                          label="Background video"
                                          extra="Choose/upload MP4 or WebM. The video plays muted and loops."
                                          rules={[{ required: true, message: "Background video is required for a video slide" }]}
                                        >
                                          <MediaPickerInput
                                            mediaType="video"
                                            showVariants={false}
                                            uiVariant="stacked"
                                            placeholder="/uploads/home-slide.mp4"
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col span={24}>
                                        <Form.Item {...restField} name={[name, "videoPoster"]} label="Video poster">
                                          <MediaPickerInput uiVariant="stacked" />
                                        </Form.Item>
                                      </Col>
                                    </>
                                  );
                                }
                                return (
                                  <>
                                    <Col span={24}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, "image"]}
                                        label="Desktop image"
                                        rules={[{ required: true, message: "Desktop image is required for an image slide" }]}
                                      >
                                        <MediaPickerInput uiVariant="stacked" hintText="Required size min: 1440X900" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                      <Form.Item {...restField} name={[name, "mobileImage"]} label="Mobile image">
                                        <MediaPickerInput uiVariant="stacked" hintText="Optional portrait crop for screens below 768px" />
                                      </Form.Item>
                                    </Col>
                                  </>
                                );
                              }}
                            </Form.Item>
                            <Col span={16}><Form.Item {...restField} name={[name, "alt"]} label="Alternative text"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item {...restField} name={[name, "backgroundPosition"]} label="Position"><Select options={POSITION_OPTIONS} /></Form.Item></Col>
                            <Col span={12}><Form.Item {...restField} name={[name, "overlayOpacity"]} label="Overlay strength (%)"><InputNumber min={0} max={100} style={{ width: "100%" }} /></Form.Item></Col>
                            <Col span={12}><Form.Item {...restField} name={[name, "textAlignment"]} label="Text alignment"><Select options={ALIGNMENT_OPTIONS} /></Form.Item></Col>
                          </Row>
                        </Card>

                        <Card size="small" title="Hero Content">
                          <Row gutter={16}>
                            <Col span={24}><Form.Item {...restField} name={[name, "smallTitle"]} label="Small title / notice"><Input /></Form.Item></Col>
                            <Col span={16}><Form.Item {...restField} name={[name, "smallTitleUrl"]} label="Small title link"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item {...restField} name={[name, "smallTitleTarget"]} label="Target"><Select options={TARGET_OPTIONS} /></Form.Item></Col>
                            <Col span={24}><Form.Item {...restField} name={[name, "headingLine1"]} label="Main heading — line 1"><Input /></Form.Item></Col>
                            <Col span={12}><Form.Item {...restField} name={[name, "headingLine2"]} label="Main heading — line 2"><Input /></Form.Item></Col>
                            <Col span={12}><Form.Item {...restField} name={[name, "headingHighlight"]} label="Highlighted heading text"><Input /></Form.Item></Col>
                            <Col span={24}><Form.Item {...restField} name={[name, "description"]} label="Description"><Input.TextArea rows={3} /></Form.Item></Col>
                          </Row>
                        </Card>

                        <Card size="small" title="Primary Button">
                          <Row gutter={16}>
                            <Col span={24}><Form.Item {...restField} name={[name, "primaryButtonLabel"]} label="Label"><Input /></Form.Item></Col>
                            <Col span={16}><Form.Item {...restField} name={[name, "primaryButtonUrl"]} label="Link"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item {...restField} name={[name, "primaryButtonTarget"]} label="Target"><Select options={TARGET_OPTIONS} /></Form.Item></Col>
                          </Row>
                        </Card>

                        <Card size="small" title="Secondary Button">
                          <Row gutter={16}>
                            <Col span={24}><Form.Item {...restField} name={[name, "secondaryButtonLabel"]} label="Label"><Input /></Form.Item></Col>
                            <Col span={16}><Form.Item {...restField} name={[name, "secondaryButtonUrl"]} label="Link"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item {...restField} name={[name, "secondaryButtonTarget"]} label="Target"><Select options={TARGET_OPTIONS} /></Form.Item></Col>
                          </Row>
                        </Card>

                        <Card size="small" title="Chapter Caption">
                          <Row gutter={16}>
                            <Col span={24}><Form.Item {...restField} name={[name, "captionTitle"]} label="Title"><Input /></Form.Item></Col>
                            <Col span={24}><Form.Item {...restField} name={[name, "captionButtonLabel"]} label="Link label"><Input /></Form.Item></Col>
                            <Col span={16}><Form.Item {...restField} name={[name, "captionButtonUrl"]} label="Link"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item {...restField} name={[name, "captionButtonTarget"]} label="Target"><Select options={TARGET_OPTIONS} /></Form.Item></Col>
                          </Row>
                        </Card>

                        <Card size="small" title="Colors">
                          <Row gutter={16}>
                            {[
                              ["headingColorKey", "Heading"],
                              ["highlightColorKey", "Highlight"],
                              ["descriptionColorKey", "Description"],
                              ["primaryButtonBgColorKey", "Primary background"],
                              ["primaryButtonTextColorKey", "Primary text"],
                              ["secondaryButtonTextColorKey", "Secondary text"],
                            ].map(([field, label]) => (
                              <Col span={12} key={field}><Form.Item {...restField} name={[name, field]} label={label}><Select showSearch options={colorOptions} optionFilterProp="label" /></Form.Item></Col>
                            ))}
                          </Row>
                        </Card>
                      </div>
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

export default forwardRef(HomeSliderEditForm);
