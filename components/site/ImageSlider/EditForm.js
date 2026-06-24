"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, Row, Col, Collapse, Switch, message, Spin, Card } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";

const API_PATH = "/api/theme/ImageSlider";
const PREFIX = "imageSlider";
const REQUIRED_DESKTOP_IMAGE_WIDTH = 350;
const REQUIRED_DESKTOP_IMAGE_HEIGHT = 450;
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

async function validateImageSliderDesktopImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (
      width === REQUIRED_DESKTOP_IMAGE_WIDTH &&
      height === REQUIRED_DESKTOP_IMAGE_HEIGHT
    ) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Supports Only ${REQUIRED_DESKTOP_IMAGE_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate desktop image size. Supports Only ${REQUIRED_DESKTOP_IMAGE_TEXT}.`,
      ),
    );
  }
}

function normalizeImage(it) {
  const desktopSrc = it?.desktopSrc != null ? String(it.desktopSrc).trim() : (it?.src != null ? String(it.src).trim() : (it?.url != null ? String(it.url).trim() : ""));
  const mobileSrc = it?.mobileSrc != null ? String(it.mobileSrc).trim() : "";
  return {
    src: desktopSrc,
    desktopSrc,
    mobileSrc,
    alt: it?.alt != null ? String(it.alt).trim() : "",
  };
}

function applyFormValues(form, data) {
  const images = Array.isArray(data?.imageSliderImages) && data.imageSliderImages.length > 0
    ? data.imageSliderImages.map(normalizeImage)
    : [normalizeImage({})];
  form.setFieldsValue({
    imageSliderImages: images,
    imageSliderSlideCount: data?.imageSliderSlideCount ?? 37,
    imageSliderAutoInterval: data?.imageSliderAutoInterval ?? 4000,
    imageSliderStepDeg: data?.imageSliderStepDeg ?? 10,
    imageSliderDuration: data?.imageSliderDuration ?? 0.6,
    imageSliderAutoplay: data?.imageSliderAutoplay !== false,
    imageSliderDraggable: data?.imageSliderDraggable !== false,
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function ImageSliderEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      .catch(() => message.error("Failed to load Image Slider"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        imageSliderImages: (values.imageSliderImages || []).map(normalizeImage),
        imageSliderSlideCount: values.imageSliderSlideCount ?? 37,
        imageSliderAutoInterval: values.imageSliderAutoInterval ?? 4000,
        imageSliderStepDeg: values.imageSliderStepDeg ?? 10,
        imageSliderDuration: values.imageSliderDuration ?? 0.6,
        imageSliderAutoplay: values.imageSliderAutoplay ?? true,
        imageSliderDraggable: values.imageSliderDraggable ?? true,
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
        .then(() => { message.success("Image Slider saved"); onSuccess?.(); })
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
        defaultActiveKey={["manage-section", "settings", "images"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "settings",
            label: "Slider Settings",
            children: (
              <>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item name="imageSliderAutoplay" label="Autoplay" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="imageSliderDraggable" label="Draggable" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="imageSliderSlideCount" label="Visible slides">
                      <InputNumber min={1} max={100} size="large" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="imageSliderAutoInterval" label="Auto interval (ms)">
                      <InputNumber min={500} max={30000} step={500} size="large" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="imageSliderStepDeg" label="Step degrees">
                      <InputNumber min={1} max={90} size="large" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="imageSliderDuration" label="Animation duration (s)">
                      <InputNumber min={0.1} max={5} step={0.1} size="large" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: "images",
            label: "Manage Images",
            children: (
              <Form.List name="imageSliderImages">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Slide"
                    addButtonText="Add slide"
                    defaultAddPayload={normalizeImage({})}
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
                          <Card size="small" title="Desktop Image">
                            <Form.Item
                              {...restField}
                              name={[name, "desktopSrc"]}
                              validateTrigger={["onChange", "onBlur"]}
                              rules={[
                                { required: true, message: "Desktop image is required" },
                                { validator: validateImageSliderDesktopImageDimensions },
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <MediaPickerInput
                                placeholder="/images/slider-desktop.png"
                                uiVariant="stacked"
                                hintText={`Required size: ${REQUIRED_DESKTOP_IMAGE_TEXT}`}
                              />
                            </Form.Item>
                          </Card>
                        </Col>
                        <Col span={24}>
                          <Card size="small" title="Mobile Image">
                            <Form.Item
                              {...restField}
                              name={[name, "mobileSrc"]}
                              style={{ marginBottom: 0 }}
                            >
                              <MediaPickerInput
                                placeholder="/images/slider-mobile.png"
                                uiVariant="stacked"
                                hintText="Optional for mobile (fallback desktop)"
                              />
                            </Form.Item>
                          </Card>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "alt"]} label="Alt text">
                            <Input placeholder="Slide description" size="large" />
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

export default forwardRef(ImageSliderEditForm);
