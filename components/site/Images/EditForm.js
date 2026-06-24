"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, message, Spin, Collapse } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  IMAGES_DESKTOP_ALLOWED_COMPACT_TEXT,
  IMAGES_DESKTOP_REQUIRED_TEXT,
  isAllowedImagesDesktopSize,
} from "@/lib/imagesImageConfig";

const API_PATH = "/api/theme/Images";
const PREFIX = "images";

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

function buildDesktopImageValidationError(width, height) {
  const selectedWidth = Number(width) || 0;
  const selectedHeight = Number(height) || 0;
  return `Supports Only ${IMAGES_DESKTOP_ALLOWED_COMPACT_TEXT} px. Selected image is ${selectedWidth}X${selectedHeight} px.`;
}

async function validateDesktopImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (isAllowedImagesDesktopSize(width, height)) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(buildDesktopImageValidationError(width, height)),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate desktop image size. Supports Only ${IMAGES_DESKTOP_ALLOWED_COMPACT_TEXT} px.`,
      ),
    );
  }
}

/**
 * Edit form for Images — used in component edit drawer.
 * Includes Manage Section (background/padding) and Title & Colors by default.
 * Loads/saves via API_PATH (Component defaultProps).
 */
function ImagesEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      .then((theme) => {
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      form.setFieldsValue({
        mainTitle: data.mainTitle ?? "Section Title",
        subTitle: data.subTitle ?? "Subtitle",
        titleColorKey: data.titleColorKey ?? "",
        imagesTitleEnabled: data.imagesTitleEnabled !== false,
        imagesSubTitleEnabled: data.imagesSubTitleEnabled !== false,
        imagesSubTitleColorKey: data.imagesSubTitleColorKey ?? "",
        imageUrlDesktop:
          data.imageUrlDesktop ?? data.imageUrl ?? "/images/clinics-dispensaries.png",
        imageUrlMobile: data.imageUrlMobile ?? "",
        imageUrl:
          data.imageUrlDesktop ?? data.imageUrl ?? "/images/clinics-dispensaries.png",
        imageAlt: data.imageAlt ?? "Clinics And Dispensaries",
        ...getManageSectionInitialValues(PREFIX, data),
        ...data,
      });
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        form.setFieldsValue({
          mainTitle: (data && data.mainTitle) ?? "Section Title",
          subTitle: (data && data.subTitle) ?? "Subtitle",
          titleColorKey: (data && data.titleColorKey) ?? "",
          imagesTitleEnabled: data?.imagesTitleEnabled !== false,
          imagesSubTitleEnabled: data?.imagesSubTitleEnabled !== false,
          imagesSubTitleColorKey: data?.imagesSubTitleColorKey ?? "",
          imageUrlDesktop:
            (data && (data.imageUrlDesktop ?? data.imageUrl)) ??
            "/images/clinics-dispensaries.png",
          imageUrlMobile: (data && data.imageUrlMobile) ?? "",
          imageUrl:
            (data && (data.imageUrlDesktop ?? data.imageUrl)) ??
            "/images/clinics-dispensaries.png",
          imageAlt: (data && data.imageAlt) ?? "Clinics And Dispensaries",
          ...getManageSectionInitialValues(PREFIX, data),
          ...(data && typeof data === "object" ? data : {}),
        });
      })
      .catch(() => message.error("Failed to load Images"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...values,
        imageUrl:
          values.imageUrlDesktop != null
            ? String(values.imageUrlDesktop).trim()
            : values.imageUrl != null
              ? String(values.imageUrl).trim()
              : "",
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
          message.success("Images saved");
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
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Images")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item
                  name="imageUrlDesktop"
                  label="Desktop Image"
                  validateTrigger={["onChange", "onBlur"]}
                  rules={[{ validator: validateDesktopImageDimensions }]}
                >
                  <MediaPickerInput
                    placeholder="e.g. /images/clinics-dispensaries.png"
                    uiVariant="stacked"
                    hintText={`Required size: ${IMAGES_DESKTOP_REQUIRED_TEXT}`}
                  />
                </Form.Item>
                <Form.Item name="imageUrlMobile" label="Mobile Image">
                  <MediaPickerInput
                    placeholder="e.g. /images/clinics-dispensaries-mobile.png"
                    uiVariant="stacked"
                    hintText="Optional. Desktop image will be used if empty."
                  />
                </Form.Item>
                <Form.Item name="imageAlt" label="Image Alt Text">
                  <Input placeholder="e.g. Clinics And Dispensaries" />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(ImagesEditForm);
