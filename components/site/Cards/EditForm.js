"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, Row, Col, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Cards";
const PREFIX = "cards";
const MIN_IMAGE_WIDTH = 210;
const MIN_IMAGE_HEIGHT = 170;
const MIN_IMAGE_HINT_TEXT =
  `Min Width ${MIN_IMAGE_WIDTH} and Min Height ${MIN_IMAGE_HEIGHT} px`;

const DEFAULT_ITEMS = [
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
  {
    image: "/images/logo.svg",
    title: "Accredited For Desirable Norms Credibility Alliance",
  },
];

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
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

async function validateCardImageMinimumDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (width >= MIN_IMAGE_WIDTH && height >= MIN_IMAGE_HEIGHT) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Image must be minimum ${MIN_IMAGE_WIDTH} \u00D7 ${MIN_IMAGE_HEIGHT} px. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate image size. Please use ${MIN_IMAGE_HINT_TEXT}.`,
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
    imageDesktop: desktopImage,
    imageMobile: mobileImage,
    image: desktopImage,
    title: it?.title != null ? String(it.title).trim() : "",
  };
}

function applyFormValues(form, data) {
  const items = Array.isArray(data?.cardsItems) && data.cardsItems.length > 0
    ? data.cardsItems.map(normalizeItem)
    : DEFAULT_ITEMS.map(normalizeItem);

  form.setFieldsValue({
    mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "Section Title",
    subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "Subtitle",
    cardsTitleEnabled: data?.cardsTitleEnabled !== false,
    cardsSubTitleEnabled: data?.cardsSubTitleEnabled !== false,
    cardsSubTitleColorKey: data?.cardsSubTitleColorKey != null ? String(data.cardsSubTitleColorKey).trim() : "",
    cardsMainTitleColorKey: data?.cardsMainTitleColorKey != null ? String(data.cardsMainTitleColorKey).trim() : "",
    cardsCardBgColorKey: data?.cardsCardBgColorKey != null ? String(data.cardsCardBgColorKey).trim() : "",
    cardsCardTitleColorKey: data?.cardsCardTitleColorKey != null ? String(data.cardsCardTitleColorKey).trim() : "",
    cardsCardBorderColorKey: data?.cardsCardBorderColorKey != null ? String(data.cardsCardBorderColorKey).trim() : "",
    cardsColumnsDesktop: data?.cardsColumnsDesktop ?? 3,
    cardsColumnsTablet: data?.cardsColumnsTablet ?? 2,
    cardsColumnsMobile: data?.cardsColumnsMobile ?? 1,
    cardsColumnGap: data?.cardsColumnGap ?? 16,
    cardsRowGap: data?.cardsRowGap ?? 16,
    cardsCardRadius: data?.cardsCardRadius ?? 14,
    cardsCardBorderWidth: data?.cardsCardBorderWidth ?? 1,
    cardsCardImageAreaHeight: data?.cardsCardImageAreaHeight ?? 160,
    cardsCardImageMaxHeight: data?.cardsCardImageMaxHeight ?? 110,
    cardsCardContentPaddingY: data?.cardsCardContentPaddingY ?? 14,
    cardsCardTitleFontSize: data?.cardsCardTitleFontSize ?? 14,
    cardsCardTitleLineHeight: data?.cardsCardTitleLineHeight ?? 1.35,
    cardsItems: items,
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function CardsEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    onCancel,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
    }
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      applyFormValues(form, data);

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
        applyFormValues(form, data);
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => message.error("Failed to load Cards"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const payload = {
          ...getManageSectionPayload(PREFIX, values),
          mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "",
          subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
          cardsTitleEnabled: values.cardsTitleEnabled !== false,
          cardsSubTitleEnabled: values.cardsSubTitleEnabled !== false,
          cardsSubTitleColorKey: values.cardsSubTitleColorKey ?? "",
          cardsMainTitleColorKey: values.cardsMainTitleColorKey ?? "",
          cardsCardBgColorKey: values.cardsCardBgColorKey ?? "",
          cardsCardTitleColorKey: values.cardsCardTitleColorKey ?? "",
          cardsCardBorderColorKey: values.cardsCardBorderColorKey ?? "",
          cardsColumnsDesktop: clamp(values.cardsColumnsDesktop, 1, 6, 3),
          cardsColumnsTablet: clamp(values.cardsColumnsTablet, 1, 4, 2),
          cardsColumnsMobile: clamp(values.cardsColumnsMobile, 1, 2, 1),
          cardsColumnGap: clamp(values.cardsColumnGap, 0, 64, 16),
          cardsRowGap: clamp(values.cardsRowGap, 0, 64, 16),
          cardsCardRadius: clamp(values.cardsCardRadius, 0, 40, 14),
          cardsCardBorderWidth: clamp(values.cardsCardBorderWidth, 0, 8, 1),
          cardsCardImageAreaHeight: clamp(values.cardsCardImageAreaHeight, 80, 320, 160),
          cardsCardImageMaxHeight: clamp(values.cardsCardImageMaxHeight, 40, 280, 110),
          cardsCardContentPaddingY: clamp(values.cardsCardContentPaddingY, 0, 48, 14),
          cardsCardTitleFontSize: clamp(values.cardsCardTitleFontSize, 10, 32, 14),
          cardsCardTitleLineHeight: clamp(values.cardsCardTitleLineHeight, 1, 2.4, 1.35),
          cardsItems: (values.cardsItems || []).map(normalizeItem),
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
            message.success("Cards saved");
            onSuccess?.();
          })
          .catch((err) => message.error(err?.error || "Failed to save"))
          .finally(() => setSaving(false));
      })
      .catch(() => {});
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
        defaultActiveKey={["manage-section", "title-colors", "cards-items", "card-layout"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("Cards")}
              />
            ),
          },
          {
            key: "cards-items",
            label: "Manage Cards",
            children: (
              <Form.List name="cardsItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Card"
                    addButtonText="Add card"
                    defaultAddPayload={{ imageDesktop: "", imageMobile: "", image: "", title: "" }}
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
                          <Form.Item
                            {...restField}
                            name={[name, "imageDesktop"]}
                            label="Desktop Image"
                            validateTrigger={["onChange", "onBlur"]}
                            rules={[
                              { required: true, message: "Image URL is required" },
                              { validator: validateCardImageMinimumDimensions },
                            ]}
                          >
                            <MediaPickerInput
                              placeholder="/images/logo.svg"
                              uiVariant="stacked"
                              hintText={`Required size: ${MIN_IMAGE_HINT_TEXT}`}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "imageMobile"]}
                            label="Mobile Image"
                          >
                            <MediaPickerInput
                              placeholder="/images/logo-mobile.svg"
                              uiVariant="stacked"
                              hintText="Optional. Desktop image will be used if empty."
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "title"]}
                            label="Card text"
                            rules={[{ required: true, message: "Card text is required" }]}
                          >
                            <Input.TextArea rows={2} placeholder="Card text" size="large" />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  />
                )}
              </Form.List>
            ),
          },
          {
            key: "card-layout",
            label: "Card Layout",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsColumnsDesktop" label="Desktop columns">
                    <InputNumber min={1} max={6} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsColumnsTablet" label="Tablet columns">
                    <InputNumber min={1} max={4} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsColumnsMobile" label="Mobile columns">
                    <InputNumber min={1} max={2} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsColumnGap" label="Column gap (px)">
                    <InputNumber min={0} max={64} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsRowGap" label="Row gap (px)">
                    <InputNumber min={0} max={64} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsCardRadius" label="Card radius (px)">
                    <InputNumber min={0} max={40} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsCardBorderWidth" label="Border width (px)">
                    <InputNumber min={0} max={8} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsCardImageAreaHeight" label="Image area height (px)">
                    <InputNumber min={80} max={320} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsCardImageMaxHeight" label="Image max height (px)">
                    <InputNumber min={40} max={280} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsCardContentPaddingY" label="Content padding Y (px)">
                    <InputNumber min={0} max={48} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsCardTitleFontSize" label="Card text size (px)">
                    <InputNumber min={10} max={32} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Form.Item name="cardsCardTitleLineHeight" label="Card text line-height">
                    <InputNumber min={1} max={2.4} step={0.05} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(CardsEditForm);
