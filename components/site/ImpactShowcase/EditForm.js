"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/ImpactShowcase";
const PREFIX = "impactShowcase";
const REQUIRED_LEFT_DESKTOP_IMAGE_WIDTH = 763;
const REQUIRED_LEFT_DESKTOP_IMAGE_HEIGHT = 476;
const REQUIRED_RIGHT_DESKTOP_IMAGE_WIDTH = 457;
const REQUIRED_RIGHT_DESKTOP_IMAGE_HEIGHT = 338;
const REQUIRED_LEFT_DESKTOP_IMAGE_TEXT =
  `${REQUIRED_LEFT_DESKTOP_IMAGE_WIDTH} \u00D7 ${REQUIRED_LEFT_DESKTOP_IMAGE_HEIGHT} px`;
const REQUIRED_RIGHT_DESKTOP_IMAGE_TEXT =
  `${REQUIRED_RIGHT_DESKTOP_IMAGE_WIDTH} \u00D7 ${REQUIRED_RIGHT_DESKTOP_IMAGE_HEIGHT} px`;

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

function createDesktopImageValidator({
  requiredWidth,
  requiredHeight,
  requiredText,
  fieldLabel,
}) {
  return async (_, value) => {
    const imageUrl = String(value || "").trim();
    if (!imageUrl) return Promise.resolve();

    try {
      const { width, height } = await getImageDimensions(imageUrl);
      if (width === requiredWidth && height === requiredHeight) {
        return Promise.resolve();
      }
      return Promise.reject(
        new Error(
          `${fieldLabel} must be exactly ${requiredText}. Selected image is ${width} \u00D7 ${height} px.`,
        ),
      );
    } catch {
      return Promise.reject(
        new Error(
          `Unable to validate ${fieldLabel.toLowerCase()} size. Please select an image of ${requiredText}.`,
        ),
      );
    }
  };
}

const validateLeftDesktopImageDimensions = createDesktopImageValidator({
  requiredWidth: REQUIRED_LEFT_DESKTOP_IMAGE_WIDTH,
  requiredHeight: REQUIRED_LEFT_DESKTOP_IMAGE_HEIGHT,
  requiredText: REQUIRED_LEFT_DESKTOP_IMAGE_TEXT,
  fieldLabel: "Left Desktop Image",
});

const validateRightDesktopImageDimensions = createDesktopImageValidator({
  requiredWidth: REQUIRED_RIGHT_DESKTOP_IMAGE_WIDTH,
  requiredHeight: REQUIRED_RIGHT_DESKTOP_IMAGE_HEIGHT,
  requiredText: REQUIRED_RIGHT_DESKTOP_IMAGE_TEXT,
  fieldLabel: "Right Desktop Image",
});

/**
 * Edit form for ImpactShowcase — used in component edit drawer.
 * Title & Colors: button text/links + button colors (bg + text for both buttons).
 * Content: only images (left + right).
 */
function ImpactShowcaseEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      impactShowcaseLeftImageDesktop:
        data?.impactShowcaseLeftImageDesktop != null
          ? String(data.impactShowcaseLeftImageDesktop).trim()
          : data?.impactShowcaseLeftImage != null
            ? String(data.impactShowcaseLeftImage).trim()
            : "/images/about-mesco-1.png",
      impactShowcaseLeftImageMobile:
        data?.impactShowcaseLeftImageMobile != null
          ? String(data.impactShowcaseLeftImageMobile).trim()
          : "",
      impactShowcaseLeftImage:
        data?.impactShowcaseLeftImageDesktop != null
          ? String(data.impactShowcaseLeftImageDesktop).trim()
          : data?.impactShowcaseLeftImage != null
            ? String(data.impactShowcaseLeftImage).trim()
            : "/images/about-mesco-1.png",
      impactShowcaseRightImageDesktop:
        data?.impactShowcaseRightImageDesktop != null
          ? String(data.impactShowcaseRightImageDesktop).trim()
          : data?.impactShowcaseRightImage != null
            ? String(data.impactShowcaseRightImage).trim()
            : "/images/about-mesco-2.png",
      impactShowcaseRightImageMobile:
        data?.impactShowcaseRightImageMobile != null
          ? String(data.impactShowcaseRightImageMobile).trim()
          : "",
      impactShowcaseRightImage:
        data?.impactShowcaseRightImageDesktop != null
          ? String(data.impactShowcaseRightImageDesktop).trim()
          : data?.impactShowcaseRightImage != null
            ? String(data.impactShowcaseRightImage).trim()
            : "/images/about-mesco-2.png",
      impactShowcaseButton1Text: data?.impactShowcaseButton1Text != null ? String(data.impactShowcaseButton1Text).trim() : "Contact Us",
      impactShowcaseButton1Link: data?.impactShowcaseButton1Link != null ? String(data.impactShowcaseButton1Link).trim() : "/",
      impactShowcaseButton2Text: data?.impactShowcaseButton2Text != null ? String(data.impactShowcaseButton2Text).trim() : "Volunteer",
      impactShowcaseButton2Link: data?.impactShowcaseButton2Link != null ? String(data.impactShowcaseButton2Link).trim() : "/",
      impactShowcaseButton1BgColorKey: data?.impactShowcaseButton1BgColorKey != null ? String(data.impactShowcaseButton1BgColorKey).trim() : "",
      impactShowcaseButton1TextColorKey: data?.impactShowcaseButton1TextColorKey != null ? String(data.impactShowcaseButton1TextColorKey).trim() : "",
      impactShowcaseButton1HoverBgColorKey: data?.impactShowcaseButton1HoverBgColorKey != null ? String(data.impactShowcaseButton1HoverBgColorKey).trim() : "",
      impactShowcaseButton1HoverTextColorKey: data?.impactShowcaseButton1HoverTextColorKey != null ? String(data.impactShowcaseButton1HoverTextColorKey).trim() : "",
      impactShowcaseButton2BgColorKey: data?.impactShowcaseButton2BgColorKey != null ? String(data.impactShowcaseButton2BgColorKey).trim() : "",
      impactShowcaseButton2TextColorKey: data?.impactShowcaseButton2TextColorKey != null ? String(data.impactShowcaseButton2TextColorKey).trim() : "",
      impactShowcaseButton2HoverBgColorKey: data?.impactShowcaseButton2HoverBgColorKey != null ? String(data.impactShowcaseButton2HoverBgColorKey).trim() : "",
      impactShowcaseButton2HoverTextColorKey: data?.impactShowcaseButton2HoverTextColorKey != null ? String(data.impactShowcaseButton2HoverTextColorKey).trim() : "",
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
      .catch(() => message.error("Failed to load ImpactShowcase"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const buildPayloadFromValues = (values = {}) => ({
    impactShowcaseLeftImageDesktop:
      values.impactShowcaseLeftImageDesktop != null
        ? String(values.impactShowcaseLeftImageDesktop).trim()
        : values.impactShowcaseLeftImage != null
          ? String(values.impactShowcaseLeftImage).trim()
          : "",
    impactShowcaseLeftImageMobile:
      values.impactShowcaseLeftImageMobile != null
        ? String(values.impactShowcaseLeftImageMobile).trim()
        : "",
    impactShowcaseLeftImage:
      values.impactShowcaseLeftImageDesktop != null
        ? String(values.impactShowcaseLeftImageDesktop).trim()
        : values.impactShowcaseLeftImage != null
          ? String(values.impactShowcaseLeftImage).trim()
          : "",
    impactShowcaseRightImageDesktop:
      values.impactShowcaseRightImageDesktop != null
        ? String(values.impactShowcaseRightImageDesktop).trim()
        : values.impactShowcaseRightImage != null
          ? String(values.impactShowcaseRightImage).trim()
          : "",
    impactShowcaseRightImageMobile:
      values.impactShowcaseRightImageMobile != null
        ? String(values.impactShowcaseRightImageMobile).trim()
        : "",
    impactShowcaseRightImage:
      values.impactShowcaseRightImageDesktop != null
        ? String(values.impactShowcaseRightImageDesktop).trim()
        : values.impactShowcaseRightImage != null
          ? String(values.impactShowcaseRightImage).trim()
          : "",
    impactShowcaseButton1Text:
      values.impactShowcaseButton1Text != null
        ? String(values.impactShowcaseButton1Text).trim()
        : "",
    impactShowcaseButton1Link:
      values.impactShowcaseButton1Link != null
        ? String(values.impactShowcaseButton1Link).trim()
        : "/",
    impactShowcaseButton2Text:
      values.impactShowcaseButton2Text != null
        ? String(values.impactShowcaseButton2Text).trim()
        : "",
    impactShowcaseButton2Link:
      values.impactShowcaseButton2Link != null
        ? String(values.impactShowcaseButton2Link).trim()
        : "/",
    impactShowcaseButton1BgColorKey:
      values.impactShowcaseButton1BgColorKey != null
        ? String(values.impactShowcaseButton1BgColorKey).trim()
        : "",
    impactShowcaseButton1TextColorKey:
      values.impactShowcaseButton1TextColorKey != null
        ? String(values.impactShowcaseButton1TextColorKey).trim()
        : "",
    impactShowcaseButton1HoverBgColorKey:
      values.impactShowcaseButton1HoverBgColorKey != null
        ? String(values.impactShowcaseButton1HoverBgColorKey).trim()
        : "",
    impactShowcaseButton1HoverTextColorKey:
      values.impactShowcaseButton1HoverTextColorKey != null
        ? String(values.impactShowcaseButton1HoverTextColorKey).trim()
        : "",
    impactShowcaseButton2BgColorKey:
      values.impactShowcaseButton2BgColorKey != null
        ? String(values.impactShowcaseButton2BgColorKey).trim()
        : "",
    impactShowcaseButton2TextColorKey:
      values.impactShowcaseButton2TextColorKey != null
        ? String(values.impactShowcaseButton2TextColorKey).trim()
        : "",
    impactShowcaseButton2HoverBgColorKey:
      values.impactShowcaseButton2HoverBgColorKey != null
        ? String(values.impactShowcaseButton2HoverBgColorKey).trim()
        : "",
    impactShowcaseButton2HoverTextColorKey:
      values.impactShowcaseButton2HoverTextColorKey != null
        ? String(values.impactShowcaseButton2HoverTextColorKey).trim()
        : "",
    ...getManageSectionPayload(PREFIX, values),
  });

  const handleFormValuesChange = (_, allValues) => {
    if (!isPageBlock || !onSaveToPage) return;
    onSaveToPage(buildPayloadFromValues(allValues));
  };

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = buildPayloadFromValues(values);
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
          message.success("Impact Showcase saved");
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
    <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
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
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("ImpactShowcase")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item
                  name="impactShowcaseLeftImageDesktop"
                  label="Left Desktop Image"
                  validateTrigger={["onChange", "onBlur"]}
                  rules={[{ validator: validateLeftDesktopImageDimensions }]}
                >
                  <MediaPickerInput
                    placeholder="/images/about-mesco-1.png"
                    uiVariant="stacked"
                    hintText={`Required size: ${REQUIRED_LEFT_DESKTOP_IMAGE_TEXT}`}
                  />
                </Form.Item>
                <Form.Item name="impactShowcaseLeftImageMobile" label="Left Mobile Image">
                  <MediaPickerInput
                    placeholder="/images/about-mesco-1-mobile.png"
                    uiVariant="stacked"
                    hintText="Optional. Desktop image will be used if empty."
                  />
                </Form.Item>
                <Form.Item
                  name="impactShowcaseRightImageDesktop"
                  label="Right Desktop Image"
                  validateTrigger={["onChange", "onBlur"]}
                  rules={[{ validator: validateRightDesktopImageDimensions }]}
                >
                  <MediaPickerInput
                    placeholder="/images/about-mesco-2.png"
                    uiVariant="stacked"
                    hintText={`Required size: ${REQUIRED_RIGHT_DESKTOP_IMAGE_TEXT}`}
                  />
                </Form.Item>
                <Form.Item name="impactShowcaseRightImageMobile" label="Right Mobile Image">
                  <MediaPickerInput
                    placeholder="/images/about-mesco-2-mobile.png"
                    uiVariant="stacked"
                    hintText="Optional. Desktop image will be used if empty."
                  />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(ImpactShowcaseEditForm);
