"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import { Form, Input, InputNumber, Row, Col, Collapse, Select, Switch, Button, message, Spin } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import SortableFormList from "@/components/admin/SortableFormList";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/PhotoGallery";
const PREFIX = "photoGallery";
const REQUIRED_COVER_IMAGE_WIDTH = 446;
const REQUIRED_COVER_IMAGE_HEIGHT = 334;
const REQUIRED_COVER_IMAGE_TEXT =
  `${REQUIRED_COVER_IMAGE_WIDTH} \u00D7 ${REQUIRED_COVER_IMAGE_HEIGHT}`;
const REQUIRED_COVER_IMAGE_ERROR_TEXT = `${REQUIRED_COVER_IMAGE_TEXT} pixels`;

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

async function validatePhotoGalleryCoverImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (
      width === REQUIRED_COVER_IMAGE_WIDTH &&
      height === REQUIRED_COVER_IMAGE_HEIGHT
    ) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Image size must be exactly ${REQUIRED_COVER_IMAGE_ERROR_TEXT}. Selected: ${width} \u00D7 ${height} pixels.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(`Image size must be exactly ${REQUIRED_COVER_IMAGE_ERROR_TEXT}.`),
    );
  }
}

function normalizeGalleryImage(img) {
  if (typeof img === "string") {
    const desktop = img.trim();
    return {
      urlDesktop: desktop,
      url: desktop,
    };
  }
  const desktop =
    img?.urlDesktop != null
      ? String(img.urlDesktop).trim()
      : img?.url != null
        ? String(img.url).trim()
        : img?.src != null
          ? String(img.src).trim()
          : img?.urlMobile != null
            ? String(img.urlMobile).trim()
          : "";
  return {
    urlDesktop: desktop,
    url: desktop,
  };
}

function normalizeItem(it) {
  const cats = Array.isArray(it?.categories) ? it.categories : (it?.category ? [String(it.category).trim()] : []);
  const images = Array.isArray(it?.images)
    ? it.images
        .map(normalizeGalleryImage)
        .filter((img) => img.urlDesktop)
    : [];
  const coverDesktop =
    it?.imageDesktop != null
      ? String(it.imageDesktop).trim()
      : it?.image != null
        ? String(it.image).trim()
        : it?.imageMobile != null
          ? String(it.imageMobile).trim()
        : images[0]?.urlDesktop || "";
  const type = it?.type === "link" ? "link" : "album";
  const linkType = it?.linkType === "external" ? "external" : "internal";
  const linkUrl = it?.linkUrl != null ? String(it.linkUrl).trim() : "";
  return {
    title: it?.title != null ? String(it.title).trim() : "",
    imageDesktop: coverDesktop,
    image: coverDesktop,
    images: images,
    categories: cats.filter((c) => c !== "All"),
    type,
    linkType,
    linkUrl,
  };
}

function applyFormValues(form, data) {
  const items = Array.isArray(data?.photoGalleryItems) && data.photoGalleryItems.length > 0
    ? data.photoGalleryItems.map(normalizeItem)
    : [normalizeItem({})];
  const tabs = Array.isArray(data?.photoGalleryTabs) && data.photoGalleryTabs.length > 0
    ? data.photoGalleryTabs
    : ["All", "Education", "Medical", "Events", "Community"];
  form.setFieldsValue({
    photoGalleryAccentColorKey: data?.photoGalleryAccentColorKey ?? "",
    photoGalleryNavButtonBgColorKey: data?.photoGalleryNavButtonBgColorKey ?? "",
    photoGalleryNavArrowColorKey: data?.photoGalleryNavArrowColorKey ?? "",
    photoGalleryTabBgColorKey: data?.photoGalleryTabBgColorKey ?? "",
    photoGalleryTabTextColorKey: data?.photoGalleryTabTextColorKey ?? "",
    photoGalleryTabBorderColorKey: data?.photoGalleryTabBorderColorKey ?? "",
    photoGalleryTabInactiveTextColorKey: data?.photoGalleryTabInactiveTextColorKey ?? "",
    photoGalleryTabHoverBorderColorKey: data?.photoGalleryTabHoverBorderColorKey ?? "",
    photoGalleryTabHoverTextColorKey: data?.photoGalleryTabHoverTextColorKey ?? "",
    photoGalleryLimitEnabled: data?.photoGalleryLimitEnabled ?? false,
    photoGalleryLimitCount: data?.photoGalleryLimitCount ?? 6,
    photoGalleryViewMoreText: data?.photoGalleryViewMoreText ?? "View More",
    photoGalleryViewMoreLink: data?.photoGalleryViewMoreLink ?? "",
    photoGalleryViewMoreButtonBgColorKey: data?.photoGalleryViewMoreButtonBgColorKey ?? "",
    photoGalleryViewMoreButtonTextColorKey: data?.photoGalleryViewMoreButtonTextColorKey ?? "",
    photoGalleryTabs: tabs,
    photoGalleryItems: items,
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function PhotoGalleryEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState(null);
  const watchedTabs = Form.useWatch("photoGalleryTabs", form);
  const categoryOptions = useMemo(() => {
    const tabs = Array.isArray(watchedTabs) ? watchedTabs : [];
    return tabs.filter((t) => t !== "All").map((t) => ({ label: t, value: t }));
  }, [watchedTabs]);

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
      .catch(() => message.error("Failed to load Photo Gallery"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        photoGalleryAccentColorKey: values.photoGalleryAccentColorKey ?? "",
        photoGalleryNavButtonBgColorKey: values.photoGalleryNavButtonBgColorKey ?? "",
        photoGalleryNavArrowColorKey: values.photoGalleryNavArrowColorKey ?? "",
        photoGalleryTabBgColorKey: values.photoGalleryTabBgColorKey ?? "",
        photoGalleryTabTextColorKey: values.photoGalleryTabTextColorKey ?? "",
        photoGalleryTabBorderColorKey: values.photoGalleryTabBorderColorKey ?? "",
        photoGalleryTabInactiveTextColorKey: values.photoGalleryTabInactiveTextColorKey ?? "",
        photoGalleryTabHoverBorderColorKey: values.photoGalleryTabHoverBorderColorKey ?? "",
        photoGalleryTabHoverTextColorKey: values.photoGalleryTabHoverTextColorKey ?? "",
        photoGalleryLimitEnabled: values.photoGalleryLimitEnabled ?? false,
        photoGalleryLimitCount: values.photoGalleryLimitCount ?? 6,
        photoGalleryViewMoreText: values.photoGalleryViewMoreText ?? "View More",
        photoGalleryViewMoreLink: values.photoGalleryViewMoreLink ?? "",
        photoGalleryViewMoreButtonBgColorKey: values.photoGalleryViewMoreButtonBgColorKey ?? "",
        photoGalleryViewMoreButtonTextColorKey: values.photoGalleryViewMoreButtonTextColorKey ?? "",
        photoGalleryTabs: values.photoGalleryTabs || [],
        photoGalleryItems: (values.photoGalleryItems || []).map(normalizeItem),
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
        .then(() => { message.success("Photo Gallery saved"); onSuccess?.(); })
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
        defaultActiveKey={["items"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("PhotoGallery")} />,
          },
          {
            key: "view-more",
            label: "View More Button",
            children: (
              <>
                <Form.Item name="photoGalleryLimitEnabled" label="Enable item limit" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item noStyle dependencies={["photoGalleryLimitEnabled"]}>
                  {() => form.getFieldValue("photoGalleryLimitEnabled") && (
                    <>
                      <Form.Item name="photoGalleryLimitCount" label="Items to show">
                        <InputNumber min={1} max={100} size="large" style={{ width: "100%" }} />
                      </Form.Item>
                      <Form.Item name="photoGalleryViewMoreText" label="Button text">
                        <Input placeholder="View More" size="large" />
                      </Form.Item>
                      <Form.Item name="photoGalleryViewMoreLink" label="Button link" rules={[{ required: true, message: "Link is required when limit is enabled" }]}>
                        <Input placeholder="/media/image-gallery" size="large" />
                      </Form.Item>
                      <Form.Item name="photoGalleryViewMoreButtonBgColorKey" label="Button background color">
                        <Select
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          placeholder="Select color"
                          size="large"
                          options={themeColorOptions}
                        />
                      </Form.Item>
                      <Form.Item name="photoGalleryViewMoreButtonTextColorKey" label="Button text color">
                        <Select
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          placeholder="Select color"
                          size="large"
                          options={themeColorOptions}
                        />
                      </Form.Item>
                    </>
                  )}
                </Form.Item>
              </>
            ),
          },
          {
            key: "tabs",
            label: "Manage Tabs",
            children: (
              <Form.Item name="photoGalleryTabs" label="Category Tabs">
                <Select
                  mode="tags"
                  placeholder="Type tab name and press Enter"
                  size="large"
                  tokenSeparators={[","]}
                />
              </Form.Item>
            ),
          },
          {
            key: "items",
            label: "Manage Albums",
            children: (
              <Form.List name="photoGalleryItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Album"
                    addButtonText="Add album"
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
                          <Form.Item {...restField} name={[name, "type"]} label="Type" initialValue="album">
                            <Select
                              size="large"
                              options={[
                                { label: "Album", value: "album" },
                                { label: "Link", value: "link" },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "title"]} label="Album Title">
                            <Input placeholder="e.g. Annual Function 2024" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "imageDesktop"]}
                            label="Desktop Cover Image"
                            validateTrigger={["onChange", "onBlur"]}
                            rules={[
                              { required: true, message: "Cover image is required" },
                              { validator: validatePhotoGalleryCoverImageDimensions },
                            ]}
                          >
                            <MediaPickerInput
                              placeholder="/uploads/album-cover.webp"
                              uiVariant="stacked"
                              hintText={`Required size: ${REQUIRED_COVER_IMAGE_TEXT} px`}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "categories"]} label="Categories">
                            <Select mode="multiple" placeholder="Select categories" size="large" options={categoryOptions} />
                          </Form.Item>
                        </Col>
                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev?.photoGalleryItems?.[name]?.type !== curr?.photoGalleryItems?.[name]?.type}>
                          {({ getFieldValue }) =>
                            getFieldValue(["photoGalleryItems", name, "type"]) === "link" ? (
                              <>
                                <Col span={24}>
                                  <Form.Item {...restField} name={[name, "linkType"]} label="Link Type" initialValue="internal">
                                    <Select
                                      size="large"
                                      options={[
                                        { label: "Internal", value: "internal" },
                                        { label: "External", value: "external" },
                                      ]}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col span={24}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "linkUrl"]}
                                    label="URL / Route"
                                    rules={[{ required: true, message: "Please provide a URL or route" }]}
                                  >
                                    <Input placeholder="/about or https://example.com" size="large" />
                                  </Form.Item>
                                </Col>
                              </>
                            ) : (
                              <Col span={24}>
                                <Form.Item label="Album Images" extra="Add all images for this album. First image is used if no cover is set.">
                                  <Form.List name={[name, "images"]}>
                                    {(imgFields, { add: addImg, remove: removeImg }) => (
                                      <>
                                        {imgFields.map(({ key, name: imgName, ...imgRest }) => (
                                          <div key={key} style={{ marginBottom: 12, padding: 12, border: "1px solid #f0f0f0", borderRadius: 10 }}>
                                            <Form.Item
                                              {...imgRest}
                                              name={[imgName, "urlDesktop"]}
                                              label={`Image ${Number(imgName) + 1}`}
                                              style={{ marginBottom: 0 }}
                                              rules={[{ required: true, message: "Desktop image is required" }]}
                                            >
                                              <MediaPickerInput
                                                placeholder="/uploads/photo.webp"
                                                uiVariant="stacked"
                                              />
                                            </Form.Item>
                                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                                              <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeImg(imgName)}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                                          <Button
                                            type="primary"
                                            shape="circle"
                                            icon={<PlusOutlined />}
                                            onClick={() => addImg({ urlDesktop: "", url: "" })}
                                          />
                                        </div>
                                      </>
                                    )}
                                  </Form.List>
                                </Form.Item>
                              </Col>
                            )
                          }
                        </Form.Item>
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

export default forwardRef(PhotoGalleryEditForm);
