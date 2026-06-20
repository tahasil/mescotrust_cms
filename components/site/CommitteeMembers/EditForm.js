"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, Row, Col, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/CommitteeMembers";
const PREFIX = "committeeMembers";
const REQUIRED_DESKTOP_IMAGE_WIDTH = 290;
const REQUIRED_DESKTOP_IMAGE_HEIGHT = 400;
const REQUIRED_DESKTOP_IMAGE_TEXT =
  `${REQUIRED_DESKTOP_IMAGE_WIDTH} \u00D7 ${REQUIRED_DESKTOP_IMAGE_HEIGHT} px`;

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

function normalizeItem(it) {
  const desktopImage =
    it?.imageDesktop != null
      ? String(it.imageDesktop).trim()
      : it?.image != null
        ? String(it.image).trim()
        : "";
  const mobileImage =
    it?.imageMobile != null ? String(it.imageMobile).trim() : "";
  return {
    name: it?.name != null ? String(it.name).trim() : "",
    qualification: it?.qualification != null ? String(it.qualification).trim() : "",
    title: it?.title != null ? String(it.title).trim() : "",
    imageDesktop: desktopImage,
    imageMobile: mobileImage,
    image: desktopImage,
    bio: it?.bio != null ? String(it.bio).trim() : "",
  };
}

function applyFormValues(form, data) {
  const items = Array.isArray(data?.committeeMembersItems) && data.committeeMembersItems.length > 0
    ? data.committeeMembersItems.map(normalizeItem)
    : [normalizeItem({})];
  form.setFieldsValue({
    committeeMembersMainTitle: data?.committeeMembersMainTitle ?? "Committee Members",
    committeeMembersTitleColorKey: data?.committeeMembersTitleColorKey ?? "",
    committeeMembersTitleFontSize: data?.committeeMembersTitleFontSize ?? 24,
    committeeMembersTitleFontWeight: data?.committeeMembersTitleFontWeight ?? 600,
    committeeMembersItems: items,
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function CommitteeMembersEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState(null);

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
      .catch(() => message.error("Failed to load Committee Members"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        committeeMembersMainTitle: values.committeeMembersMainTitle ?? "",
        committeeMembersTitleColorKey: values.committeeMembersTitleColorKey ?? "",
        committeeMembersTitleFontSize: values.committeeMembersTitleFontSize ?? 24,
        committeeMembersTitleFontWeight: values.committeeMembersTitleFontWeight ?? 600,
        committeeMembersItems: (values.committeeMembersItems || []).map(normalizeItem),
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
        .then(() => { message.success("Committee Members saved"); onSuccess?.(); })
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
        defaultActiveKey={["manage-section", "title-colors", "members"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("CommitteeMembers")} />,
          },
          {
            key: "members",
            label: "Manage Members",
            children: (
              <Form.List name="committeeMembersItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Member"
                    addButtonText="Add member"
                    defaultAddPayload={normalizeItem({})}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "name"]} label="Name" rules={[{ required: true, message: "Name is required" }]}>
                            <Input placeholder="e.g. Prof. M. Farhaan Makba" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "qualification"]} label="Qualification">
                            <Input placeholder="e.g. M.Sc., PGDME" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "title"]} label="Title / Role">
                            <Input placeholder="e.g. President" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "imageDesktop"]}
                            label="Desktop Image"
                            validateTrigger={["onChange", "onBlur"]}
                            rules={[{ validator: validateDesktopImageDimensions }]}
                          >
                            <MediaPickerInput
                              placeholder="/images/members-1.png"
                              uiVariant="stacked"
                              hintText={`Required size: ${REQUIRED_DESKTOP_IMAGE_TEXT}`}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "imageMobile"]} label="Mobile Image">
                            <MediaPickerInput
                              placeholder="/images/members-1-mobile.png"
                              uiVariant="stacked"
                              hintText="Optional. Desktop image will be used if empty."
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "bio"]} label="Bio">
                            <Input.TextArea placeholder="Short biography..." rows={3} />
                          </Form.Item>
                        </Col>
                      </Row>
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

export default forwardRef(CommitteeMembersEditForm);
