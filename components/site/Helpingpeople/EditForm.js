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
const REQUIRED_CONTENT_IMAGE_WIDTH = 600;
const REQUIRED_CONTENT_IMAGE_HEIGHT = 400;
const REQUIRED_CONTENT_IMAGE_TEXT =
  `${REQUIRED_CONTENT_IMAGE_WIDTH} \u00D7 ${REQUIRED_CONTENT_IMAGE_HEIGHT} px`;
const REQUIRED_BACKGROUND_IMAGE_WIDTH = 1440;
const REQUIRED_BACKGROUND_IMAGE_HEIGHT = 620;
const REQUIRED_BACKGROUND_IMAGE_TEXT =
  `${REQUIRED_BACKGROUND_IMAGE_WIDTH} \u00D7 ${REQUIRED_BACKGROUND_IMAGE_HEIGHT} px`;

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

function createImageDimensionValidator({
  fieldLabel,
  requiredWidth,
  requiredHeight,
  requiredText,
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

const validateDesktopImageDimensions = createImageDimensionValidator({
  fieldLabel: "Desktop Image",
  requiredWidth: REQUIRED_CONTENT_IMAGE_WIDTH,
  requiredHeight: REQUIRED_CONTENT_IMAGE_HEIGHT,
  requiredText: REQUIRED_CONTENT_IMAGE_TEXT,
});
const validateSectionBackgroundImageDimensions = createImageDimensionValidator({
  fieldLabel: "Background",
  requiredWidth: REQUIRED_BACKGROUND_IMAGE_WIDTH,
  requiredHeight: REQUIRED_BACKGROUND_IMAGE_HEIGHT,
  requiredText: REQUIRED_BACKGROUND_IMAGE_TEXT,
});

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
            children: (
              <ManageSectionFields
                prefix={PREFIX}
                form={form}
                themeColorOptions={themeColorOptions}
                sectionBgImageFieldLabel="Background"
                sectionBgImageHintText={`Required size: ${REQUIRED_BACKGROUND_IMAGE_TEXT}`}
                sectionBgImageValidateTrigger={["onChange", "onBlur"]}
                sectionBgImageRules={[
                  { validator: validateSectionBackgroundImageDimensions },
                ]}
              />
            ),
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
                <Form.Item
                  name="helpingpeopleImageDesktop"
                  label="Desktop Image"
                  validateTrigger={["onChange", "onBlur"]}
                  rules={[{ validator: validateDesktopImageDimensions }]}
                >
                  <MediaPickerInput
                    placeholder="/images/about-mesco-3.png"
                    uiVariant="stacked"
                    hintText={`Required size: ${REQUIRED_CONTENT_IMAGE_TEXT}`}
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
