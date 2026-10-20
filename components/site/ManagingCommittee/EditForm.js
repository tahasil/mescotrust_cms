"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Select, Collapse, message, Spin } from "antd";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  MANAGING_COMMITTEE_DESKTOP_ALLOWED_COMPACT_TEXT,
  MANAGING_COMMITTEE_DESKTOP_REQUIRED_TEXT,
  isAllowedManagingCommitteeDesktopSize,
} from "@/lib/managingCommitteeImageConfig";

const API_PATH = "/api/theme/ManagingCommittee";
const PREFIX = "managingCommittee";

function buildDesktopImageValidationError(width, height) {
  const selectedWidth = Number(width) || 0;
  const selectedHeight = Number(height) || 0;
  return `Supports Only ${MANAGING_COMMITTEE_DESKTOP_ALLOWED_COMPACT_TEXT} px. Selected image is ${selectedWidth}X${selectedHeight} px.`;
}

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

function getImageDimensionsFromFile(file) {
  if (!(file instanceof File)) {
    return Promise.reject(new Error("Invalid upload file"));
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      resolve({
        width: Number(image.naturalWidth) || 0,
        height: Number(image.naturalHeight) || 0,
      });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    image.src = objectUrl;
  });
}

async function validateDesktopImageSelection(selection = {}) {
  try {
    if (selection?.source === "upload" && selection?.file) {
      const { width, height } = await getImageDimensionsFromFile(selection.file);
      if (isAllowedManagingCommitteeDesktopSize(width, height)) return "";
      return buildDesktopImageValidationError(width, height);
    }

    const imageUrl = String(selection?.imageUrl || "").trim();
    if (!imageUrl) return "";

    const { width, height } = await getImageDimensions(imageUrl);
    if (isAllowedManagingCommitteeDesktopSize(width, height)) return "";
    return buildDesktopImageValidationError(width, height);
  } catch {
    return `Unable to validate desktop image size. Supports Only ${MANAGING_COMMITTEE_DESKTOP_ALLOWED_COMPACT_TEXT} px.`;
  }
}

async function validateDesktopImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (isAllowedManagingCommitteeDesktopSize(width, height)) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(buildDesktopImageValidationError(width, height)),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate desktop image size. Supports Only ${MANAGING_COMMITTEE_DESKTOP_ALLOWED_COMPACT_TEXT} px.`,
      ),
    );
  }
}

function applyFormValues(form, data) {
  form.setFieldsValue({
    managingCommitteeSubTitle: data?.managingCommitteeSubTitle ?? "",
    managingCommitteeMainTitle: data?.managingCommitteeMainTitle ?? "Managing Committee",
    managingCommitteeTitleAlign: data?.managingCommitteeTitleAlign || data?.titleAlign || "center",
    titleAlign: data?.managingCommitteeTitleAlign || data?.titleAlign || "center",
    titleHighlightColorKey: data?.titleHighlightColorKey || "",
    managingCommitteeParagraph: data?.managingCommitteeParagraph ?? "",
    managingCommitteeParagraphAlign: data?.managingCommitteeParagraphAlign || data?.paragraphAlign || "left",
    paragraphAlign: data?.managingCommitteeParagraphAlign || data?.paragraphAlign || "left",
    managingCommitteeImageDesktop:
      data?.managingCommitteeImageDesktop ??
      data?.managingCommitteeImageUrl ??
      "/images/good-governance-2.png",
    managingCommitteeImageMobile: data?.managingCommitteeImageMobile ?? "",
    managingCommitteeImageUrl:
      data?.managingCommitteeImageDesktop ??
      data?.managingCommitteeImageUrl ??
      "/images/good-governance-2.png",
    managingCommitteeImageAlt: data?.managingCommitteeImageAlt ?? "Managing Committee",
    managingCommitteeTitleColorKey: data?.managingCommitteeTitleColorKey ?? "",
    managingCommitteeSubTitleColorKey: data?.managingCommitteeSubTitleColorKey ?? "",
    managingCommitteeTextColorKey: data?.managingCommitteeTextColorKey ?? "",
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function ManagingCommitteeEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      .catch(() => message.error("Failed to load Managing Committee"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        managingCommitteeSubTitle: values.managingCommitteeSubTitle ?? "",
        managingCommitteeMainTitle: values.managingCommitteeMainTitle ?? "",
        managingCommitteeTitleAlign: values.managingCommitteeTitleAlign || values.titleAlign || "center",
        titleAlign: values.managingCommitteeTitleAlign || values.titleAlign || "center",
        titleHighlightColorKey: values.titleHighlightColorKey || "",
        managingCommitteeParagraph: values.managingCommitteeParagraph ?? "",
        managingCommitteeParagraphAlign: values.managingCommitteeParagraphAlign || values.paragraphAlign || "left",
        paragraphAlign: values.managingCommitteeParagraphAlign || values.paragraphAlign || "left",
        managingCommitteeImageDesktop:
          values.managingCommitteeImageDesktop ?? values.managingCommitteeImageUrl ?? "",
        managingCommitteeImageMobile: values.managingCommitteeImageMobile ?? "",
        managingCommitteeImageUrl:
          values.managingCommitteeImageDesktop ?? values.managingCommitteeImageUrl ?? "",
        managingCommitteeImageAlt: values.managingCommitteeImageAlt ?? "",
        managingCommitteeTitleColorKey: values.managingCommitteeTitleColorKey ?? "",
        managingCommitteeSubTitleColorKey: values.managingCommitteeSubTitleColorKey ?? "",
        managingCommitteeTextColorKey: values.managingCommitteeTextColorKey ?? "",
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
        .then((res) => { if (!res.ok) return res.json().then((d) => Promise.reject(d)); })
        .then(() => { message.success("Managing Committee saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
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
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("ManagingCommittee")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item name="managingCommitteeParagraph" label="Paragraph">
                  <RichTextEditor placeholder="Enter paragraph text..." />
                </Form.Item>
                <Form.Item
                  name="managingCommitteeImageDesktop"
                  label="Desktop Image"
                  validateTrigger={["onChange", "onBlur"]}
                  rules={[{ validator: validateDesktopImageDimensions }]}
                >
                  <MediaPickerInput
                    placeholder="/images/good-governance-2.png"
                    uiVariant="stacked"
                    cropWidth={600}
                    cropHeight={400}
                    allowedSizes={[
                      { width: 600, height: 400 },
                      { width: 600, height: 650 },
                    ]}
                    hintText={`Required size: ${MANAGING_COMMITTEE_DESKTOP_REQUIRED_TEXT}`}
                    validateSelection={validateDesktopImageSelection}
                  />
                </Form.Item>
                <Form.Item name="managingCommitteeImageMobile" label="Mobile Image">
                  <MediaPickerInput
                    placeholder="/images/good-governance-2-mobile.png"
                    uiVariant="stacked"
                    hintText="Optional. Desktop image will be used if empty."
                  />
                </Form.Item>
                <Form.Item name="managingCommitteeImageAlt" label="Image Alt Text">
                  <Input placeholder="Managing Committee" size="large" />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(ManagingCommitteeEditForm);
