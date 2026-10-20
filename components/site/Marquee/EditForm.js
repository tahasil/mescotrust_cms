"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Button, Row, Col, Collapse, message, Spin } from "antd";
import { DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const REQUIRED_MARQUEE_IMAGE_WIDTH = 400;
const REQUIRED_MARQUEE_IMAGE_HEIGHT = 400;
const REQUIRED_MARQUEE_IMAGE_DIMENSIONS_TEXT =
  `${REQUIRED_MARQUEE_IMAGE_WIDTH} \u00D7 ${REQUIRED_MARQUEE_IMAGE_HEIGHT} px`;

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

async function validateMarqueeImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (
      width === REQUIRED_MARQUEE_IMAGE_WIDTH &&
      height === REQUIRED_MARQUEE_IMAGE_HEIGHT
    ) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Image must be ${REQUIRED_MARQUEE_IMAGE_DIMENSIONS_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate image size. Please select an image of ${REQUIRED_MARQUEE_IMAGE_DIMENSIONS_TEXT}.`,
      ),
    );
  }
}

/**
 * Edit form for Marquee — used in page builder drawer or component edit.
 * When source="page": data from block.props (pages collection); save updates layout only, not components collection.
 * Exposes update() via ref for drawer header button.
 */
function normalizeItem(it) {
  const desktopUrl =
    it?.urlDesktop != null
      ? String(it.urlDesktop).trim()
      : it?.url != null
        ? String(it.url).trim()
        : "";
  const mobileUrl = it?.urlMobile != null ? String(it.urlMobile).trim() : "";
  return {
    urlDesktop: desktopUrl,
    urlMobile: mobileUrl,
    url: desktopUrl,
    alt: it?.alt != null ? String(it.alt).trim() : "",
  };
}

function getHeadingValues(data, fallbackToDefaults = false) {
  const legacyTitle =
    data?.marqueeTitle != null ? String(data.marqueeTitle).trim() : "";
  const legacyParts = legacyTitle.split("|").map((part) => part.trim());
  return {
    marqueePartnersTitle:
      data?.marqueePartnersTitle != null
        ? String(data.marqueePartnersTitle).trim()
        : legacyParts[0] || (fallbackToDefaults ? "Our CSR Partners" : ""),
    marqueeAwardsTitle:
      data?.marqueeAwardsTitle != null
        ? String(data.marqueeAwardsTitle).trim()
        : legacyParts.slice(1).join(" | ") ||
          (fallbackToDefaults ? "Awards & Recognition" : ""),
    marqueePartnersTitleColorKey:
      data?.marqueePartnersTitleColorKey != null
        ? String(data.marqueePartnersTitleColorKey).trim()
        : data?.marqueeTitleColorKey != null
          ? String(data.marqueeTitleColorKey).trim()
          : "",
    marqueeAwardsTitleColorKey:
      data?.marqueeAwardsTitleColorKey != null
        ? String(data.marqueeAwardsTitleColorKey).trim()
        : "",
  };
}

function MarqueeEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const title = data.marqueeTitle != null ? String(data.marqueeTitle).trim() : "";
      const items = Array.isArray(data.marqueeItems)
        ? data.marqueeItems.map(normalizeItem)
        : [];
      setInitialData({
        marqueeTitle: title,
        marqueeItems: items,
        marqueeImageMaxWidth:
          data?.marqueeImageMaxWidth != null
            ? String(data.marqueeImageMaxWidth).trim()
            : data?.imageMaxWidth != null
              ? String(data.imageMaxWidth).trim()
              : "190px",
        marqueeImageMaxHeight:
          data?.marqueeImageMaxHeight != null
            ? String(data.marqueeImageMaxHeight).trim()
            : data?.imageMaxHeight != null
              ? String(data.imageMaxHeight).trim()
              : "84px",
        marqueeTitleColorKey: data?.marqueeTitleColorKey != null ? String(data.marqueeTitleColorKey).trim() : "",
        ...getHeadingValues(data),
        ...getManageSectionInitialValues("marquee", data),
      });
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
    setInitialData(null);
    Promise.all([
      fetch("/api/theme/marquee", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        const title = data.marqueeTitle != null ? String(data.marqueeTitle).trim() : "Our CSR Partners | Awards & Recognition";
        const items = Array.isArray(data.marqueeItems)
          ? data.marqueeItems.map(normalizeItem)
          : [];
        setInitialData({
          marqueeTitle: title,
          marqueeItems: items,
          marqueeImageMaxWidth:
            data?.marqueeImageMaxWidth != null
              ? String(data.marqueeImageMaxWidth).trim()
              : data?.imageMaxWidth != null
                ? String(data.imageMaxWidth).trim()
                : "190px",
          marqueeImageMaxHeight:
            data?.marqueeImageMaxHeight != null
              ? String(data.marqueeImageMaxHeight).trim()
              : data?.imageMaxHeight != null
                ? String(data.imageMaxHeight).trim()
                : "84px",
          marqueeTitleColorKey: data?.marqueeTitleColorKey != null ? String(data.marqueeTitleColorKey).trim() : "",
          ...getHeadingValues(data, true),
          ...getManageSectionInitialValues("marquee", data),
        });
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => message.error("Failed to load Marquee"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const title = values.marqueeTitle != null ? String(values.marqueeTitle).trim() : "";
      const rawItems = values.marqueeItems ?? [];
      const items = Array.isArray(rawItems)
        ? rawItems.map(normalizeItem)
        : [];
      const partnersTitle =
        values.marqueePartnersTitle != null
          ? String(values.marqueePartnersTitle).trim()
          : "";
      const awardsTitle =
        values.marqueeAwardsTitle != null
          ? String(values.marqueeAwardsTitle).trim()
          : "";
      const payload = {
        marqueeTitle:
          [partnersTitle, awardsTitle].filter(Boolean).join(" | ") || title,
        marqueePartnersTitle: partnersTitle,
        marqueeAwardsTitle: awardsTitle,
        marqueeItems: items,
        marqueeImageMaxWidth:
          values.marqueeImageMaxWidth != null
            ? String(values.marqueeImageMaxWidth).trim()
            : "190px",
        marqueeImageMaxHeight:
          values.marqueeImageMaxHeight != null
            ? String(values.marqueeImageMaxHeight).trim()
            : "84px",
        marqueeTitleColorKey:
          values.marqueePartnersTitleColorKey != null
            ? String(values.marqueePartnersTitleColorKey).trim()
            : "",
        marqueePartnersTitleColorKey:
          values.marqueePartnersTitleColorKey != null
            ? String(values.marqueePartnersTitleColorKey).trim()
            : "",
        marqueeAwardsTitleColorKey:
          values.marqueeAwardsTitleColorKey != null
            ? String(values.marqueeAwardsTitleColorKey).trim()
            : "",
        ...getManageSectionPayload("marquee", values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch("/api/theme/marquee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Marquee saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save Marquee"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading || initialData === null) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <>
      <Form
        preserve={true}
        form={form}
        layout="vertical"
        initialValues={initialData}
        key="marquee-edit-form"
      >
        <Collapse destroyInactivePanel={false} defaultActiveKey={[]} style={{ marginBottom: 16 }} items={[
          { key: "manage-section", label: "Manage Section", children: <ManageSectionFields prefix="marquee" form={form} themeColorOptions={themeColorOptions} /> },
          { key: "title", label: "Title & Colors", children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Marquee")} /> },
          {
            key: "items",
            label: "Manage Items",
            children: (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={24}>
                    <Form.Item
                      name="marqueeImageMaxHeight"
                      label="Image Max Height"
                      tooltip="Define maximum height for logo images in px, % or rem (e.g. 84px, 100px, 120px). Automatically scales responsively on mobile."
                    >
                      <Input placeholder="e.g. 84px" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.List name="marqueeItems">
                  {(fields, { add, remove, move }) => (
                    <SortableFormList
                      fields={fields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="Item"
                      addButtonText="Add item"
                      defaultAddPayload={{ urlDesktop: "", url: "", alt: "" }}
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
                              name={[name, "urlDesktop"]}
                              label="Image"
                              validateTrigger={["onChange", "onBlur"]}
                              rules={[
                                { required: true, message: "Required" },
                                { validator: validateMarqueeImageDimensions },
                              ]}
                            >
                              <MediaPickerInput
                                placeholder="/images/partner-1.png"
                                uiVariant="stacked"
                                cropWidth={REQUIRED_MARQUEE_IMAGE_WIDTH}
                                cropHeight={REQUIRED_MARQUEE_IMAGE_HEIGHT}
                                hintText={`Required size: ${REQUIRED_MARQUEE_IMAGE_DIMENSIONS_TEXT}`}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "alt"]} label="Alt text">
                              <Input placeholder="Partner" size="large" />
                            </Form.Item>
                          </Col>
                        </Row>
                      )}
                    />
                  )}
                </Form.List>
              </>
            ),
          },
        ]} />
      </Form>
    </>
  );
}

export default forwardRef(MarqueeEditForm);
