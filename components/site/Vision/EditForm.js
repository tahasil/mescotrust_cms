"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Vision";
const PREFIX = "vision";
const REQUIRED_DESKTOP_IMAGE_WIDTH = 550;
const REQUIRED_DESKTOP_IMAGE_HEIGHT = 450;
const REQUIRED_DESKTOP_IMAGE_TEXT =
  `${REQUIRED_DESKTOP_IMAGE_WIDTH} \u00D7 ${REQUIRED_DESKTOP_IMAGE_HEIGHT} px`;

const CONTENT_FIELDS = [
  "visionSubTitle", "visionTitle", "visionImageDesktop", "visionImageMobile", "visionImage",
  "visionCardRadius", "visionCardPadding",
  "visionSubTitleColorKey", "visionMainTitleColorKey",
];

function getImageDimensions(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({
        width: Number(image.naturalWidth) || 0,
        height: Number(image.naturalHeight) || 0,
      });
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageUrl;
  });
}

async function validateDesktopImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (width === REQUIRED_DESKTOP_IMAGE_WIDTH && height === REQUIRED_DESKTOP_IMAGE_HEIGHT) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Desktop Image must be exactly ${REQUIRED_DESKTOP_IMAGE_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate desktop image size. Please select an image of ${REQUIRED_DESKTOP_IMAGE_TEXT}.`,
      ),
    );
  }
}

function applyFormValues(form, data) {
  form.setFieldsValue({
    visionSubTitle: data?.visionSubTitle ?? "Vision",
    visionTitle: data?.visionTitle ?? "To help the underprivileged and marginalized live a better tomorrow through various interventions.",
    visionImageDesktop: data?.visionImageDesktop ?? data?.visionImage ?? "/images/vision.png",
    visionImageMobile: data?.visionImageMobile ?? "",
    visionImage: data?.visionImageDesktop ?? data?.visionImage ?? "/images/vision.png",
    visionCardRadius: data?.visionCardRadius ?? 40,
    visionCardPadding: data?.visionCardPadding ?? 40,
    visionSubTitleColorKey: data?.visionSubTitleColorKey ?? "",
    visionMainTitleColorKey: data?.visionMainTitleColorKey ?? "",
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function VisionEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      applyFormValues(form, initialDataProp ?? {});
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
        applyFormValues(form, data);
      })
      .catch(() => message.error("Failed to load Vision"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {};
      CONTENT_FIELDS.forEach((k) => {
        payload[k] = values[k] != null ? String(values[k]).trim() : "";
      });
      payload.visionImage =
        values.visionImageDesktop != null
          ? String(values.visionImageDesktop).trim()
          : values.visionImage != null
            ? String(values.visionImage).trim()
            : "";
      Object.assign(payload, getManageSectionPayload(PREFIX, values));

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
        .then(() => { message.success("Vision saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  return (
    <Form preserve={true} form={form} layout="vertical">
      <Collapse
        destroyInactivePanel={false}
        defaultActiveKey={[]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Vision")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item
                  name="visionImageDesktop"
                  label="Desktop Image"
                  validateTrigger={["onChange", "onBlur"]}
                  rules={[{ validator: validateDesktopImageDimensions }]}
                >
                  <MediaPickerInput
                    placeholder="/images/vision.png"
                    uiVariant="stacked"
                    cropWidth={REQUIRED_DESKTOP_IMAGE_WIDTH}
                    cropHeight={REQUIRED_DESKTOP_IMAGE_HEIGHT}
                    hintText={`Required size: ${REQUIRED_DESKTOP_IMAGE_TEXT}`}
                  />
                </Form.Item>
                <Form.Item name="visionImageMobile" label="Mobile Image">
                  <MediaPickerInput
                    placeholder="/images/vision-mobile.png"
                    uiVariant="stacked"
                    hintText="Optional. Desktop image will be used if empty."
                  />
                </Form.Item>
              </>
            ),
          },
          {
            key: "card-settings",
            label: "Card Settings",
            children: (
              <>
                <Form.Item name="visionCardRadius" label="Border radius (px)">
                  <InputNumber placeholder="40" min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="visionCardPadding" label="Padding (px)">
                  <InputNumber placeholder="40" min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(VisionEditForm);
