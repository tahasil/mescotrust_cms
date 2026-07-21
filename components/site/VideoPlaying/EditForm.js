"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Collapse, Col, Form, Input, InputNumber, message, Row, Select, Spin, Switch } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { LINK_TARGET_OPTIONS, normalizeTarget } from "@/components/appearance/editorUtils";

const API_PATH = "/api/theme/VideoPlaying";
const PREFIX = "videoPlaying";
const REQUIRED_COVER_IMAGE_WIDTH = 2164;
const REQUIRED_COVER_IMAGE_HEIGHT = 1200;
const text = (value) => (value == null ? "" : String(value).trim());
const previousSubTitleToken = ["Eye", "brow"].join("");
const previousSubTitleField = (data, suffix = "") =>
  data?.[`videoPlaying${previousSubTitleToken}${suffix}`];

function getImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = url;
  });
}
async function validateCover(_, value) {
  if (!text(value)) return;
  try {
    const size = await getImageDimensions(text(value));
    if (size.width === REQUIRED_COVER_IMAGE_WIDTH && size.height === REQUIRED_COVER_IMAGE_HEIGHT) return;
    throw new Error(`Image size must be exactly ${REQUIRED_COVER_IMAGE_WIDTH} × ${REQUIRED_COVER_IMAGE_HEIGHT} pixels. Selected: ${size.width} × ${size.height} pixels.`);
  } catch (error) {
    return Promise.reject(error?.message ? error : new Error(`Image size must be exactly ${REQUIRED_COVER_IMAGE_WIDTH} × ${REQUIRED_COVER_IMAGE_HEIGHT} pixels.`));
  }
}

function VideoPlayingEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, themeColorOptions: providedColors = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [colors, setColors] = useState(providedColors);
  const isPageBlock = source === "page";
  useEffect(() => { if (providedColors.length) setColors(providedColors); }, [providedColors]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = isPageBlock ? initialDataProp || {} : await fetch(API_PATH, { cache: "no-store" }).then((r) => r.ok ? r.json() : {});
      const theme = providedColors.length ? {} : await fetch("/api/theme", { cache: "no-store" }).then((r) => r.ok ? r.json() : {}).catch(() => ({}));
      if (cancelled) return;
      if (!providedColors.length) {
        const names = [...new Set([...Object.keys(theme?.themePalette || {}), ...(Array.isArray(theme?.colors) ? theme.colors.map((item) => item?.name).filter(Boolean) : [])])].sort();
        setColors(names.map((name) => ({ label: name, value: name })));
      }
      form.setFieldsValue({
        ...data,
        ...getManageSectionInitialValues(PREFIX, data),
        youtubeVideoId: text(data.youtubeVideoId),
        coverImageDesktop: text(data.coverImageDesktop ?? data.coverImage),
        coverAlt: text(data.coverAlt),
        videoPlayingSubTitle: text(data.videoPlayingSubTitle ?? previousSubTitleField(data)), videoPlayingTitle: text(data.videoPlayingTitle), videoPlayingTitleAccent: text(data.videoPlayingTitleAccent), videoPlayingVideoTitle: text(data.videoPlayingVideoTitle), videoPlayingPlayAriaLabel: text(data.videoPlayingPlayAriaLabel), videoPlayingQuote: text(data.videoPlayingQuote), videoPlayingAuthorName: text(data.videoPlayingAuthorName), videoPlayingAuthorRole: text(data.videoPlayingAuthorRole), videoPlayingLinkText: text(data.videoPlayingLinkText), videoPlayingLinkUrl: text(data.videoPlayingLinkUrl), videoPlayingLinkTarget: normalizeTarget(data.videoPlayingLinkTarget ?? (data.videoPlayingLinkNewTab ? "_blank" : "_self")),
        videoPlayingScaleAnimationEnabled: data.videoPlayingScaleAnimationEnabled !== false, videoPlayingQuoteAnimationEnabled: data.videoPlayingQuoteAnimationEnabled !== false,
        videoPlayingChapterRadius: data.videoPlayingChapterRadius ?? 56, videoPlayingChapterPaddingTop: data.videoPlayingChapterPaddingTop ?? 96, videoPlayingChapterPaddingBottom: data.videoPlayingChapterPaddingBottom ?? 110, videoPlayingChapterPaddingX: data.videoPlayingChapterPaddingX ?? 48, videoPlayingHeadGap: data.videoPlayingHeadGap ?? 56, videoPlayingVideoRadius: data.videoPlayingVideoRadius ?? 20, videoPlayingPlayButtonSize: data.videoPlayingPlayButtonSize ?? 96, videoPlayingQuoteMarginTop: data.videoPlayingQuoteMarginTop ?? 88, videoPlayingQuoteMaxWidth: data.videoPlayingQuoteMaxWidth ?? 26, videoPlayingTitleMaxWidth: data.videoPlayingTitleMaxWidth ?? 20,
        videoPlayingTitleMinSize: data.videoPlayingTitleMinSize ?? 36, videoPlayingTitleFluidSize: data.videoPlayingTitleFluidSize ?? 4.6, videoPlayingTitleMaxSize: data.videoPlayingTitleMaxSize ?? 64, videoPlayingTitleFontWeight: data.videoPlayingTitleFontWeight ?? 620, videoPlayingTitleLetterSpacing: data.videoPlayingTitleLetterSpacing ?? -0.02, videoPlayingTitleLineHeight: data.videoPlayingTitleLineHeight ?? 1.08,
        videoPlayingQuoteMinSize: data.videoPlayingQuoteMinSize ?? 26, videoPlayingQuoteFluidSize: data.videoPlayingQuoteFluidSize ?? 3.4, videoPlayingQuoteMaxSize: data.videoPlayingQuoteMaxSize ?? 48, videoPlayingQuoteFontWeight: data.videoPlayingQuoteFontWeight ?? 460, videoPlayingQuoteLineHeight: data.videoPlayingQuoteLineHeight ?? 1.28, videoPlayingSubTitleFontSize: data.videoPlayingSubTitleFontSize ?? previousSubTitleField(data, "FontSize") ?? 13, videoPlayingSubTitleFontWeight: data.videoPlayingSubTitleFontWeight ?? previousSubTitleField(data, "FontWeight") ?? 650, videoPlayingSubTitleLetterSpacing: data.videoPlayingSubTitleLetterSpacing ?? previousSubTitleField(data, "LetterSpacing") ?? 0.16, videoPlayingSubTitleColorKey: text(data.videoPlayingSubTitleColorKey ?? previousSubTitleField(data, "ColorKey")), videoPlayingAuthorFontSize: data.videoPlayingAuthorFontSize ?? 17, videoPlayingRoleFontSize: data.videoPlayingRoleFontSize ?? 15, videoPlayingLinkFontSize: data.videoPlayingLinkFontSize ?? 15,
        videoPlayingScaleFrom: data.videoPlayingScaleFrom ?? 0.9, videoPlayingScaleStart: text(data.videoPlayingScaleStart) || "top 92%", videoPlayingScaleEnd: text(data.videoPlayingScaleEnd) || "top 35%", videoPlayingQuoteStagger: data.videoPlayingQuoteStagger ?? 0.05, videoPlayingQuoteStart: text(data.videoPlayingQuoteStart) || "top 80%", videoPlayingQuoteEnd: text(data.videoPlayingQuoteEnd) || "bottom 48%",
      });
    })().catch(() => message.error("Failed to load Video Playing")).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [form, initialDataProp, isPageBlock, providedColors.length]);

  const update = async () => {
    const values = await form.validateFields();
    const payload = { ...values, ...getManageSectionPayload(PREFIX, values), youtubeVideoId: text(values.youtubeVideoId), coverImageDesktop: text(values.coverImageDesktop), coverImage: text(values.coverImageDesktop), coverAlt: text(values.coverAlt), videoPlayingLinkTarget: normalizeTarget(values.videoPlayingLinkTarget) };
    if (isPageBlock && onSaveToPage) { onSaveToPage(payload); message.success("Changes will be saved with the page"); onSuccess?.(); return; }
    setSaving(true);
    try { const response = await fetch(API_PATH, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (!response.ok) throw await response.json(); message.success("Video Playing saved"); onSuccess?.(); }
    catch (error) { message.error(error?.error || "Failed to save Video Playing"); }
    finally { setSaving(false); }
  };
  useImperativeHandle(ref, () => ({ update }), [form, isPageBlock, onSaveToPage, onSuccess]);
  if (loading || saving) return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  const colorField = (name, label) => <Form.Item name={name} label={label}><Select allowClear options={colors} placeholder="From theme" /></Form.Item>;
  const num = (name, label, options = {}) => <Col span={12}><Form.Item name={name} label={label}><InputNumber style={{ width: "100%" }} {...options} /></Form.Item></Col>;
  return <Form form={form} layout="vertical"><Collapse defaultActiveKey={["content"]} items={[
    { key: "section", label: "Manage Section", children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={colors} /> },
    { key: "content", label: "Chapter Content", children: <>
      <Form.Item name="videoPlayingSubTitle" label="Sub Title"><Input /></Form.Item><Form.Item name="videoPlayingTitle" label="Heading"><Input /></Form.Item><Form.Item name="videoPlayingTitleAccent" label="Heading accent"><Input /></Form.Item><Form.Item name="videoPlayingQuote" label="Story quote"><Input.TextArea rows={4} /></Form.Item><Form.Item name="videoPlayingAuthorName" label="Author name"><Input /></Form.Item><Form.Item name="videoPlayingAuthorRole" label="Author role"><Input /></Form.Item><Form.Item name="videoPlayingLinkText" label="Link label"><Input /></Form.Item><Form.Item name="videoPlayingLinkUrl" label="Link URL"><Input /></Form.Item><Form.Item name="videoPlayingLinkTarget" label="Target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item>
    </> },
    { key: "video", label: "Video Settings", children: <><Form.Item name="youtubeVideoId" label="YouTube Video ID" rules={[{ required: true, message: "YouTube Video ID is required" }]}><Input /></Form.Item><Form.Item name="coverImageDesktop" label="Cover Image" rules={[{ validator: validateCover }]}><MediaPickerInput mediaType="image" uiVariant="stacked" hintText={`Required size: ${REQUIRED_COVER_IMAGE_WIDTH} × ${REQUIRED_COVER_IMAGE_HEIGHT}`} /></Form.Item><Form.Item name="coverAlt" label="Cover alt text"><Input /></Form.Item><Form.Item name="videoPlayingVideoTitle" label="Embedded video title"><Input /></Form.Item><Form.Item name="videoPlayingPlayAriaLabel" label="Play button accessible label"><Input /></Form.Item></> },
    { key: "colors", label: "Colors", children: <>{colorField("videoPlayingChapterBgColorKey", "Chapter background")}{colorField("videoPlayingTextColorKey", "Base text")}{colorField("videoPlayingSubTitleColorKey", "Sub Title")}{colorField("videoPlayingTitleColorKey", "Heading")}{colorField("videoPlayingTitleAccentColorKey", "Heading accent")}{colorField("videoPlayingPlayBgColorKey", "Play button")}{colorField("videoPlayingPlayIconColorKey", "Play icon")}{colorField("videoPlayingQuoteColorKey", "Quote")}{colorField("videoPlayingAuthorColorKey", "Author")}{colorField("videoPlayingRoleColorKey", "Author role")}{colorField("videoPlayingLinkColorKey", "Story link")}</> },
    { key: "layout", label: "Typography & Layout", children: <><Form.Item name="videoPlayingDisplayFontFamily" label="Display font family"><Input /></Form.Item><Form.Item name="videoPlayingBodyFontFamily" label="Body font family"><Input /></Form.Item><Row gutter={16}>{num("videoPlayingChapterRadius", "Chapter radius px", { min: 0 })}{num("videoPlayingChapterPaddingTop", "Top padding px", { min: 0 })}{num("videoPlayingChapterPaddingBottom", "Bottom padding px", { min: 0 })}{num("videoPlayingChapterPaddingX", "Horizontal padding px", { min: 0 })}{num("videoPlayingHeadGap", "Heading gap px", { min: 0 })}{num("videoPlayingVideoRadius", "Video radius px", { min: 0 })}{num("videoPlayingPlayButtonSize", "Play button px", { min: 32 })}{num("videoPlayingQuoteMarginTop", "Quote top px", { min: 0 })}{num("videoPlayingQuoteMaxWidth", "Quote width ch", { min: 10 })}{num("videoPlayingTitleMaxWidth", "Title width ch", { min: 8 })}{num("videoPlayingTitleMinSize", "Title min px", { min: 12 })}{num("videoPlayingTitleFluidSize", "Title fluid vw", { min: 1, step: 0.1 })}{num("videoPlayingTitleMaxSize", "Title max px", { min: 12 })}{num("videoPlayingTitleFontWeight", "Title weight", { min: 100, max: 900 })}{num("videoPlayingTitleLetterSpacing", "Title spacing em", { step: 0.01 })}{num("videoPlayingTitleLineHeight", "Title line height", { min: 0.7, step: 0.01 })}{num("videoPlayingQuoteMinSize", "Quote min px", { min: 12 })}{num("videoPlayingQuoteFluidSize", "Quote fluid vw", { min: 1, step: 0.1 })}{num("videoPlayingQuoteMaxSize", "Quote max px", { min: 12 })}{num("videoPlayingQuoteFontWeight", "Quote weight", { min: 100, max: 900 })}{num("videoPlayingQuoteLineHeight", "Quote line height", { min: 0.7, step: 0.01 })}{num("videoPlayingSubTitleFontSize", "Sub Title px", { min: 8 })}{num("videoPlayingSubTitleFontWeight", "Sub Title weight", { min: 100, max: 900 })}{num("videoPlayingSubTitleLetterSpacing", "Sub Title spacing em", { step: 0.01 })}{num("videoPlayingAuthorFontSize", "Author px", { min: 8 })}{num("videoPlayingRoleFontSize", "Role px", { min: 8 })}{num("videoPlayingLinkFontSize", "Link px", { min: 8 })}</Row></> },
    { key: "animation", label: "Animations", children: <><Form.Item name="videoPlayingScaleAnimationEnabled" label="Video scale scrub" valuePropName="checked"><Switch /></Form.Item><Form.Item name="videoPlayingQuoteAnimationEnabled" label="Quote word scrub" valuePropName="checked"><Switch /></Form.Item><Row gutter={16}>{num("videoPlayingScaleFrom", "Initial scale", { min: 0.1, max: 1, step: 0.01 })}{num("videoPlayingQuoteStagger", "Word stagger", { min: 0, step: 0.01 })}</Row><Form.Item name="videoPlayingScaleStart" label="Scale trigger start"><Input /></Form.Item><Form.Item name="videoPlayingScaleEnd" label="Scale trigger end"><Input /></Form.Item><Form.Item name="videoPlayingQuoteStart" label="Quote trigger start"><Input /></Form.Item><Form.Item name="videoPlayingQuoteEnd" label="Quote trigger end"><Input /></Form.Item></> },
  ]} /></Form>;
}

export default forwardRef(VideoPlayingEditForm);
