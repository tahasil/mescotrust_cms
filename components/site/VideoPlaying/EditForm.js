"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Collapse, Form, Input, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { normalizeTarget } from "@/components/appearance/editorUtils";

const API_PATH = "/api/theme/VideoPlaying";
const PREFIX = "videoPlaying";
const REQUIRED_COVER_IMAGE_WIDTH = 2164;
const REQUIRED_COVER_IMAGE_HEIGHT = 1200;
const text = (value) => (value == null ? "" : String(value).trim());
const withoutUndefined = (value) => Object.fromEntries(
  Object.entries(value || {}).filter(([, item]) => item !== undefined),
);
const previousSubTitleToken = ["Eye", "brow"].join("");
const previousSubTitleField = (data, suffix = "") =>
  data?.[`videoPlaying${previousSubTitleToken}${suffix}`];
const COLOR_ITEMS = [
  ["videoPlayingChapterBgColorKey", "Chapter background"],
  ["videoPlayingPlayBgColorKey", "Play button"],
  ["videoPlayingPlayIconColorKey", "Play icon"],
].map(([name, label]) => ({ name, label, tooltip: `${label} color.` }));

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
  const loadedDataRef = useRef({});
  const isPageBlock = source === "page";
  useEffect(() => { if (providedColors.length) setColors(providedColors); }, [providedColors]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = isPageBlock ? initialDataProp || {} : await fetch(API_PATH, { cache: "no-store" }).then((r) => r.ok ? r.json() : {});
      const theme = providedColors.length ? {} : await fetch("/api/theme", { cache: "no-store" }).then((r) => r.ok ? r.json() : {}).catch(() => ({}));
      if (cancelled) return;
      const { themePalette: _themePalette, colors: _themeColors, ...componentData } = data;
      loadedDataRef.current = componentData;
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
        videoPlayingChapterRadius: data.videoPlayingChapterRadius ?? 56, videoPlayingChapterPaddingTop: data.videoPlayingChapterPaddingTop ?? 64, videoPlayingChapterPaddingBottom: data.videoPlayingChapterPaddingBottom ?? 72, videoPlayingChapterPaddingX: data.videoPlayingChapterPaddingX ?? 48, videoPlayingHeadGap: data.videoPlayingHeadGap ?? 56, videoPlayingVideoRadius: data.videoPlayingVideoRadius ?? 20, videoPlayingPlayButtonSize: data.videoPlayingPlayButtonSize ?? 96, videoPlayingQuoteMarginTop: data.videoPlayingQuoteMarginTop ?? 88, videoPlayingQuoteMaxWidth: data.videoPlayingQuoteMaxWidth ?? 26, videoPlayingTitleMaxWidth: data.videoPlayingTitleMaxWidth ?? 20,
        videoPlayingTitleMinSize: data.videoPlayingTitleMinSize ?? 36, videoPlayingTitleFluidSize: data.videoPlayingTitleFluidSize ?? 4.6, videoPlayingTitleMaxSize: data.videoPlayingTitleMaxSize ?? 64, videoPlayingTitleFontWeight: data.videoPlayingTitleFontWeight ?? 620, videoPlayingTitleLetterSpacing: data.videoPlayingTitleLetterSpacing ?? -0.02, videoPlayingTitleLineHeight: data.videoPlayingTitleLineHeight ?? 1.08,
        videoPlayingQuoteMinSize: data.videoPlayingQuoteMinSize ?? 26, videoPlayingQuoteFluidSize: data.videoPlayingQuoteFluidSize ?? 3.4, videoPlayingQuoteMaxSize: data.videoPlayingQuoteMaxSize ?? 48, videoPlayingQuoteFontWeight: data.videoPlayingQuoteFontWeight ?? 460, videoPlayingQuoteLineHeight: data.videoPlayingQuoteLineHeight ?? 1.28, videoPlayingSubTitleFontSize: data.videoPlayingSubTitleFontSize ?? previousSubTitleField(data, "FontSize") ?? 13, videoPlayingSubTitleFontWeight: data.videoPlayingSubTitleFontWeight ?? previousSubTitleField(data, "FontWeight") ?? 650, videoPlayingSubTitleLetterSpacing: data.videoPlayingSubTitleLetterSpacing ?? previousSubTitleField(data, "LetterSpacing") ?? 0.16, videoPlayingSubTitleColorKey: text(data.videoPlayingSubTitleColorKey ?? previousSubTitleField(data, "ColorKey")), videoPlayingAuthorFontSize: data.videoPlayingAuthorFontSize ?? 17, videoPlayingRoleFontSize: data.videoPlayingRoleFontSize ?? 15, videoPlayingLinkFontSize: data.videoPlayingLinkFontSize ?? 15,
        videoPlayingScaleFrom: data.videoPlayingScaleFrom ?? 0.9, videoPlayingScaleStart: text(data.videoPlayingScaleStart) || "top 92%", videoPlayingScaleEnd: text(data.videoPlayingScaleEnd) || "top 35%", videoPlayingQuoteStagger: data.videoPlayingQuoteStagger ?? 0.05, videoPlayingQuoteStart: text(data.videoPlayingQuoteStart) || "top 80%", videoPlayingQuoteEnd: text(data.videoPlayingQuoteEnd) || "bottom 48%",
      });
    })().catch(() => message.error("Failed to load Video Playing")).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [form, initialDataProp, isPageBlock, providedColors.length]);

  const update = useCallback(async () => {
    const values = await form.validateFields();
    const payload = withoutUndefined({ ...loadedDataRef.current, ...values, ...getManageSectionPayload(PREFIX, values), youtubeVideoId: text(values.youtubeVideoId), coverImageDesktop: text(values.coverImageDesktop), coverImage: text(values.coverImageDesktop), coverAlt: text(values.coverAlt) });
    if (isPageBlock && onSaveToPage) { onSaveToPage(payload); message.success("Changes will be saved with the page"); onSuccess?.(); return; }
    setSaving(true);
    try { const response = await fetch(API_PATH, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (!response.ok) throw await response.json(); const saved = await response.json().catch(() => payload); loadedDataRef.current = withoutUndefined({ ...loadedDataRef.current, ...saved }); message.success("Video Playing saved"); onSuccess?.(); }
    catch (error) { message.error(error?.error || "Failed to save Video Playing"); }
    finally { setSaving(false); }
  }, [form, isPageBlock, onSaveToPage, onSuccess]);
  useImperativeHandle(ref, () => ({ update }), [update]);
  if (loading) return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  return <Form form={form} layout="vertical" disabled={saving}><Collapse defaultActiveKey={["video"]} items={[
    { key: "section", label: "Manage Section", children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={colors} /> },
    { key: "video", label: "Video Settings", children: <><Form.Item name="youtubeVideoId" label="YouTube Video ID" rules={[{ required: true, message: "YouTube Video ID is required" }]}><Input /></Form.Item><Form.Item name="coverImageDesktop" label="Cover Image" rules={[{ validator: validateCover }]}><MediaPickerInput mediaType="image" uiVariant="stacked" cropWidth={REQUIRED_COVER_IMAGE_WIDTH} cropHeight={REQUIRED_COVER_IMAGE_HEIGHT} hintText={`Required size: ${REQUIRED_COVER_IMAGE_WIDTH} × ${REQUIRED_COVER_IMAGE_HEIGHT}`} /></Form.Item><Form.Item name="coverAlt" label="Cover alt text"><Input /></Form.Item><Form.Item name="videoPlayingVideoTitle" label="Embedded video title"><Input /></Form.Item><Form.Item name="videoPlayingPlayAriaLabel" label="Play button accessible label"><Input /></Form.Item></> },
    { key: "colors", label: "Colors", children: <TitleAndColorsSection form={form} themeColorOptions={colors} colorListItems={COLOR_ITEMS} /> },
    { key: "animation", label: "Animations", children: <SwitchSettingsCard items={[{ name: "videoPlayingScaleAnimationEnabled", label: "Video scale scrub", tooltip: "Animate video scale during scroll." }, { name: "videoPlayingQuoteAnimationEnabled", label: "Quote word scrub", tooltip: "Animate quote words during scroll." }]} /> },
  ].map((item) => ({ ...item, forceRender: true }))} /></Form>;
}

export default forwardRef(VideoPlayingEditForm);
