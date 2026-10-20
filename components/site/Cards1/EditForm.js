"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Collapse,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Spin,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import { SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import { LINK_TARGET_OPTIONS, normalizeTarget } from "@/components/appearance/editorUtils";

const API_PATH = "/api/theme/Cards1";
const PREFIX = "cards1";
const CARD_VARIANT_OPTIONS = [
  { label: "Style 1", value: "style1" },
  { label: "Style 2", value: "style2" },
  { label: "Style 3", value: "style3" },
];

function cleanText(value) {
  return value != null ? String(value).trim() : "";
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeVariant(value) {
  const normalized = cleanText(value).toLowerCase();
  return CARD_VARIANT_OPTIONS.some((item) => item.value === normalized)
    ? normalized
    : "style1";
}

function normalizeHoverEnabledByVariant(mapLike, fallbackEnabled = true) {
  const base =
    mapLike && typeof mapLike === "object" && !Array.isArray(mapLike) ? mapLike : {};
  const fallback = fallbackEnabled !== false;
  const normalized = {};
  CARD_VARIANT_OPTIONS.forEach(({ value }) => {
    normalized[value] =
      typeof base[value] === "boolean" ? base[value] : fallback;
  });
  return normalized;
}

function hoverEnabledForVariant(mapLike, variant) {
  const normalizedVariant = normalizeVariant(variant);
  const normalizedMap = normalizeHoverEnabledByVariant(mapLike, true);
  return normalizedMap[normalizedVariant] !== false;
}

function normalizeItem(item, index) {
  const iconDesktop = cleanText(
    item?.iconDesktop ?? item?.imageDesktop ?? item?.image ?? item?.icon,
  );
  const iconMobile = cleanText(item?.iconMobile ?? item?.imageMobile);
  const sortOrderRaw = Number(item?.sortOrder);
  return {
    iconDesktop,
    iconMobile,
    icon: iconDesktop,
    title: cleanText(item?.title),
    description: cleanText(item?.description ?? item?.text),
    buttonText: cleanText(item?.buttonText ?? item?.linkText),
    buttonLink: cleanText(item?.buttonLink ?? item?.link ?? item?.url),
    buttonTarget: normalizeTarget(item?.buttonTarget ?? item?.target ?? (/^https?:\/\//i.test(item?.buttonLink ?? item?.link ?? item?.url ?? "") ? "_blank" : "_self")),
    hoverTitle: cleanText(item?.hoverTitle),
    hoverDescription: cleanText(item?.hoverDescription),
    hoverButtonText: cleanText(item?.hoverButtonText),
    hoverButtonLink: cleanText(item?.hoverButtonLink),
    hoverButtonTarget: normalizeTarget(item?.hoverButtonTarget ?? item?.buttonTarget ?? item?.target ?? (/^https?:\/\//i.test(item?.hoverButtonLink ?? "") ? "_blank" : "_self")),
    bgColorKey: cleanText(item?.bgColorKey ?? item?.cardBgColorKey),
    hoverBgColorKey: cleanText(item?.hoverBgColorKey ?? item?.cardHoverBgColorKey),
    visible: item?.visible !== false && item?.isVisible !== false,
    sortOrder: Number.isFinite(sortOrderRaw) ? sortOrderRaw : index,
  };
}

function sortAndNormalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => ({ ...normalizeItem(item, index), _originalIndex: index }))
    .sort((a, b) => {
      if (a.sortOrder === b.sortOrder) return a._originalIndex - b._originalIndex;
      return a.sortOrder - b.sortOrder;
    })
    .map((item, index) => {
      const { _originalIndex, ...rest } = item;
      return { ...rest, sortOrder: index };
    });
}

function toThemeColorOptions(theme) {
  const palette = theme?.themePalette || {};
  const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
  const names = [
    ...new Set([
      ...Object.keys(palette),
      ...customColors.map((entry) => entry?.name).filter(Boolean),
    ]),
  ].sort();
  return names.map((name) => ({ label: name, value: name }));
}

function applyFormValues(form, data) {
  const cards = sortAndNormalizeItems(data?.cards1Items);
  const variant = normalizeVariant(data?.cards1Variant);
  const hoverEnabledByVariant = normalizeHoverEnabledByVariant(
    data?.cards1HoverEnabledByVariant,
    data?.cards1EnableHoverEffect,
  );
  form.setFieldsValue({
    mainTitle: cleanText(data?.mainTitle),
    subTitle: cleanText(data?.subTitle),
    cards1Variant: variant,
    cards1EnableHoverEffect: hoverEnabledForVariant(hoverEnabledByVariant, variant),
    cards1HoverEnabledByVariant: hoverEnabledByVariant,
    cards1TitleEnabled: data?.cards1TitleEnabled !== false,
    cards1SubTitleEnabled: data?.cards1SubTitleEnabled !== false,
    cards1SubTitleColorKey: cleanText(data?.cards1SubTitleColorKey),
    cards1MainTitleColorKey: cleanText(data?.cards1MainTitleColorKey),
    cards1CardBgColorKey: cleanText(data?.cards1CardBgColorKey),
    cards1CardBorderColorKey: cleanText(data?.cards1CardBorderColorKey),
    cards1CardTitleColorKey: cleanText(data?.cards1CardTitleColorKey),
    cards1CardDescriptionColorKey: cleanText(data?.cards1CardDescriptionColorKey),
    cards1CardHoverBgColorKey: cleanText(data?.cards1CardHoverBgColorKey),
    cards1CardHoverTitleColorKey: cleanText(data?.cards1CardHoverTitleColorKey),
    cards1CardHoverDescriptionColorKey: cleanText(
      data?.cards1CardHoverDescriptionColorKey,
    ),
    cards1CardIconBgColorKey: cleanText(data?.cards1CardIconBgColorKey),
    cards1CardButtonBgColorKey: cleanText(data?.cards1CardButtonBgColorKey),
    cards1CardButtonTextColorKey: cleanText(data?.cards1CardButtonTextColorKey),
    cards1CardHoverButtonBgColorKey: cleanText(data?.cards1CardHoverButtonBgColorKey),
    cards1CardHoverButtonTextColorKey: cleanText(
      data?.cards1CardHoverButtonTextColorKey,
    ),
    cards1ColumnsDesktop: data?.cards1ColumnsDesktop ?? 5,
    cards1ColumnsLaptop: data?.cards1ColumnsLaptop ?? 4,
    cards1ColumnsTablet: data?.cards1ColumnsTablet ?? 3,
    cards1ColumnsMobileLandscape: data?.cards1ColumnsMobileLandscape ?? 2,
    cards1ColumnsMobile: data?.cards1ColumnsMobile ?? 1,
    cards1ColumnGap: data?.cards1ColumnGap ?? 18,
    cards1RowGap: data?.cards1RowGap ?? 22,
    cards1CardRadius: data?.cards1CardRadius ?? 14,
    cards1CardBorderWidth: data?.cards1CardBorderWidth ?? 1,
    cards1CardMinHeight: data?.cards1CardMinHeight ?? 182,
    cards1CardPaddingTop: data?.cards1CardPaddingTop ?? 18,
    cards1CardPaddingBottom: data?.cards1CardPaddingBottom ?? 18,
    cards1CardPaddingX: data?.cards1CardPaddingX ?? 20,
    cards1CardIconWrapSize: data?.cards1CardIconWrapSize ?? 56,
    cards1CardIconSize: data?.cards1CardIconSize ?? 24,
    cards1CardTitleFontSize: data?.cards1CardTitleFontSize ?? 34,
    cards1CardTitleLineHeight: data?.cards1CardTitleLineHeight ?? 1.3,
    cards1CardDescriptionFontSize: data?.cards1CardDescriptionFontSize ?? 14,
    cards1CardDescriptionLineHeight: data?.cards1CardDescriptionLineHeight ?? 1.5,
    cards1CardButtonFontSize: data?.cards1CardButtonFontSize ?? 13,
    cards1CardButtonRadius: data?.cards1CardButtonRadius ?? 8,
    cards1CardHoverLift: data?.cards1CardHoverLift ?? 3,
    cards1CardHoverTransitionMs: data?.cards1CardHoverTransitionMs ?? 260,
    cards1Items: cards,
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function Cards1EditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(
    themeColorOptionsProp,
  );
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  const selectedVariant = Form.useWatch("cards1Variant", form);
  const hoverEnabledByVariant = Form.useWatch("cards1HoverEnabledByVariant", form);

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
          .then((theme) => setThemeColorOptions(toThemeColorOptions(theme)))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) =>
        res.ok ? res.json() : {},
      ),
      fetch("/api/theme", { cache: "no-store" }).then((res) =>
        res.ok ? res.json() : {},
      ),
    ])
      .then(([data, theme]) => {
        applyFormValues(form, data ?? {});
        setThemeColorOptions(toThemeColorOptions(theme));
      })
      .catch(() => message.error("Failed to load Cards1"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  useEffect(() => {
    const variant = normalizeVariant(selectedVariant);
    const rawMap = form.getFieldValue("cards1HoverEnabledByVariant");
    const currentMap = normalizeHoverEnabledByVariant(
      rawMap ?? hoverEnabledByVariant,
      true,
    );
    const hasAllVariantKeys =
      rawMap &&
      typeof rawMap === "object" &&
      !Array.isArray(rawMap) &&
      CARD_VARIANT_OPTIONS.every(
        ({ value }) => typeof rawMap[value] === "boolean",
      );
    if (!hasAllVariantKeys) {
      form.setFieldValue("cards1HoverEnabledByVariant", currentMap);
    }
    const enabled = hoverEnabledForVariant(currentMap, variant);
    if (form.getFieldValue("cards1EnableHoverEffect") !== enabled) {
      form.setFieldValue("cards1EnableHoverEffect", enabled);
    }
  }, [selectedVariant, hoverEnabledByVariant, form]);

  const syncSortOrderFromCurrentList = () => {
    const current = form.getFieldValue("cards1Items");
    if (!Array.isArray(current)) return;
    form.setFieldValue(
      "cards1Items",
      current.map((entry, index) => ({ ...entry, sortOrder: index })),
    );
  };

  const handleHoverEffectToggle = (checked) => {
    const variant = normalizeVariant(form.getFieldValue("cards1Variant"));
    const currentMap = normalizeHoverEnabledByVariant(
      form.getFieldValue("cards1HoverEnabledByVariant"),
      true,
    );
    form.setFieldsValue({
      cards1EnableHoverEffect: checked !== false,
      cards1HoverEnabledByVariant: {
        ...currentMap,
        [variant]: checked !== false,
      },
    });
  };

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const variant = normalizeVariant(values.cards1Variant);
        const hoverMap = normalizeHoverEnabledByVariant(
          form.getFieldValue("cards1HoverEnabledByVariant"),
          true,
        );
        hoverMap[variant] = values.cards1EnableHoverEffect !== false;
        const cardsRaw = Array.isArray(values.cards1Items) ? values.cards1Items : [];
        const cards = cardsRaw
          .map((item, index) => ({ ...normalizeItem(item, index), _sourceIndex: index }))
          .sort((a, b) => {
            if (a.sortOrder === b.sortOrder) return a._sourceIndex - b._sourceIndex;
            return a.sortOrder - b.sortOrder;
          })
          .map((item, index) => {
            const { _sourceIndex, ...rest } = item;
            return { ...rest, sortOrder: index };
          });

        const payload = {
          ...getManageSectionPayload(PREFIX, values),
          mainTitle: cleanText(values.mainTitle),
          subTitle: cleanText(values.subTitle),
          cards1Variant: variant,
          cards1EnableHoverEffect: values.cards1EnableHoverEffect !== false,
          cards1HoverEnabledByVariant: hoverMap,
          cards1TitleEnabled: values.cards1TitleEnabled !== false,
          cards1SubTitleEnabled: values.cards1SubTitleEnabled !== false,
          cards1SubTitleColorKey: cleanText(values.cards1SubTitleColorKey),
          cards1MainTitleColorKey: cleanText(values.cards1MainTitleColorKey),
          cards1CardBgColorKey: cleanText(values.cards1CardBgColorKey),
          cards1CardBorderColorKey: cleanText(values.cards1CardBorderColorKey),
          cards1CardTitleColorKey: cleanText(values.cards1CardTitleColorKey),
          cards1CardDescriptionColorKey: cleanText(values.cards1CardDescriptionColorKey),
          cards1CardHoverBgColorKey: cleanText(values.cards1CardHoverBgColorKey),
          cards1CardHoverTitleColorKey: cleanText(values.cards1CardHoverTitleColorKey),
          cards1CardHoverDescriptionColorKey: cleanText(
            values.cards1CardHoverDescriptionColorKey,
          ),
          cards1CardIconBgColorKey: cleanText(values.cards1CardIconBgColorKey),
          cards1CardButtonBgColorKey: cleanText(values.cards1CardButtonBgColorKey),
          cards1CardButtonTextColorKey: cleanText(values.cards1CardButtonTextColorKey),
          cards1CardHoverButtonBgColorKey: cleanText(
            values.cards1CardHoverButtonBgColorKey,
          ),
          cards1CardHoverButtonTextColorKey: cleanText(
            values.cards1CardHoverButtonTextColorKey,
          ),
          cards1ColumnsDesktop: clamp(values.cards1ColumnsDesktop, 1, 6, 5),
          cards1ColumnsLaptop: clamp(values.cards1ColumnsLaptop, 1, 6, 4),
          cards1ColumnsTablet: clamp(values.cards1ColumnsTablet, 1, 4, 3),
          cards1ColumnsMobileLandscape: clamp(
            values.cards1ColumnsMobileLandscape,
            1,
            3,
            2,
          ),
          cards1ColumnsMobile: clamp(values.cards1ColumnsMobile, 1, 2, 1),
          cards1ColumnGap: clamp(values.cards1ColumnGap, 0, 80, 18),
          cards1RowGap: clamp(values.cards1RowGap, 0, 80, 22),
          cards1CardRadius: clamp(values.cards1CardRadius, 0, 48, 14),
          cards1CardBorderWidth: clamp(values.cards1CardBorderWidth, 0, 8, 1),
          cards1CardMinHeight: clamp(values.cards1CardMinHeight, 120, 500, 182),
          cards1CardPaddingTop: clamp(values.cards1CardPaddingTop, 0, 120, 18),
          cards1CardPaddingBottom: clamp(values.cards1CardPaddingBottom, 0, 120, 18),
          cards1CardPaddingX: clamp(values.cards1CardPaddingX, 0, 120, 20),
          cards1CardIconWrapSize: clamp(values.cards1CardIconWrapSize, 16, 120, 56),
          cards1CardIconSize: clamp(values.cards1CardIconSize, 10, 80, 24),
          cards1CardTitleFontSize: clamp(values.cards1CardTitleFontSize, 10, 48, 34),
          cards1CardTitleLineHeight: clamp(values.cards1CardTitleLineHeight, 1, 2.4, 1.3),
          cards1CardDescriptionFontSize: clamp(
            values.cards1CardDescriptionFontSize,
            10,
            32,
            14,
          ),
          cards1CardDescriptionLineHeight: clamp(
            values.cards1CardDescriptionLineHeight,
            1,
            2.6,
            1.5,
          ),
          cards1CardButtonFontSize: clamp(values.cards1CardButtonFontSize, 10, 24, 13),
          cards1CardButtonRadius: clamp(values.cards1CardButtonRadius, 0, 48, 8),
          cards1CardHoverLift: clamp(values.cards1CardHoverLift, 0, 24, 3),
          cards1CardHoverTransitionMs: clamp(
            values.cards1CardHoverTransitionMs,
            100,
            900,
            260,
          ),
          cards1Items: cards,
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
            if (!res.ok) return res.json().then((data) => Promise.reject(data));
            return null;
          })
          .then(() => {
            message.success("Cards1 saved");
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
    <Form preserve={true} form={form} layout="vertical">
      <Collapse
        destroyInactivePanel={false}
        defaultActiveKey={[]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: (
              <ManageSectionFields
                prefix={PREFIX}
                form={form}
                themeColorOptions={themeColorOptions}
              />
            ),
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("Cards1")}
              />
            ),
          },
          {
            key: "cards-items",
            label: "Manage Cards",
            children: (
              <>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) =>
                    prev.cards1Variant !== curr.cards1Variant ||
                    prev.cards1EnableHoverEffect !== curr.cards1EnableHoverEffect
                  }
                >
                  {() => {
                    const variant = normalizeVariant(form.getFieldValue("cards1Variant"));
                    const variantLabel =
                      CARD_VARIANT_OPTIONS.find((item) => item.value === variant)
                        ?.label || "Style";
                    return <SwitchSettingsCard items={[{
                      name: "cards1EnableHoverEffect",
                      label: `Enable Hover Effect (${variantLabel})`,
                      tooltip: "Enable the configured card hover design.",
                      checkedChildren: "On",
                      unCheckedChildren: "Off",
                      onChange: handleHoverEffectToggle,
                    }]} />;
                  }}
                </Form.Item>
                <Form.List name="cards1Items">
                  {(fields, { add, remove, move }) => (
                    <SortableFormList
                      fields={fields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="Card"
                      addButtonText="Add card"
                      defaultAddPayload={{
                        iconDesktop: "",
                        iconMobile: "",
                        icon: "",
                        title: "",
                        description: "",
                        buttonText: "",
                        buttonLink: "",
                        buttonTarget: "_self",
                        hoverTitle: "",
                        hoverDescription: "",
                        hoverButtonText: "",
                        hoverButtonLink: "",
                        hoverButtonTarget: "_self",
                        bgColorKey: "",
                        hoverBgColorKey: "",
                        visible: true,
                        sortOrder: fields.length,
                      }}
                      reorderMovedIndex={reorderMovedIndex}
                      reorderDirection={reorderDirection}
                      onMoveWithTransition={(from, to) => {
                        setReorderDirection(to < from ? "up" : "down");
                        setReorderMovedIndex(to);
                        syncSortOrderFromCurrentList();
                        setTimeout(() => setReorderMovedIndex(-1), 400);
                      }}
                      renderItemContent={(name, restField) => (
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12}>
                            <SwitchSettingsCard items={[{
                              name: [name, "visible"],
                              label: "Visible",
                              tooltip: "Show or hide this card.",
                              checkedChildren: "Show",
                              unCheckedChildren: "Hide",
                            }]} />
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "sortOrder"]}
                              label="Sort order"
                              tooltip="Lower value appears first."
                            >
                              <InputNumber min={0} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>

                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "iconDesktop"]}
                              label="Card icon (desktop/tablet)"
                              rules={[{ required: true, message: "Card icon is required" }]}
                            >
                              <MediaPickerInput
                                placeholder="/images/icon.svg"
                                uiVariant="stacked"
                                hintText="Required icon/image for default card state."
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "iconMobile"]}
                              label="Card icon (mobile)"
                            >
                              <MediaPickerInput
                                placeholder="/images/icon-mobile.svg"
                                uiVariant="stacked"
                                hintText="Optional. Desktop icon is used if empty."
                              />
                            </Form.Item>
                          </Col>

                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "title"]}
                              label="Title"
                              rules={[{ required: true, message: "Title is required" }]}
                            >
                              <Input placeholder="e.g. Education" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "description"]} label="Description">
                              <Input.TextArea
                                rows={3}
                                placeholder="e.g. Support schools, students and educational programs"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item {...restField} name={[name, "buttonText"]} label="Button text">
                              <Input placeholder="e.g. Learn More" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item {...restField} name={[name, "buttonLink"]} label="Button link">
                              <Input placeholder="/page-or-url" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item {...restField} name={[name, "buttonTarget"]} label="Button target">
                              <Select options={LINK_TARGET_OPTIONS} />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item {...restField} name={[name, "bgColorKey"]} label="Card background color">
                              <Select
                                allowClear
                                options={themeColorOptions}
                                placeholder="Default/global card background"
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "hoverBgColorKey"]}
                              label="Hover background color"
                            >
                              <Select
                                allowClear
                                options={themeColorOptions}
                                placeholder="Default/global hover background"
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item {...restField} name={[name, "hoverTitle"]} label="Hover title">
                              <Input placeholder="Optional alternate title on hover" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item {...restField} name={[name, "hoverDescription"]} label="Hover description">
                              <Input.TextArea
                                rows={2}
                                placeholder="Optional alternate description on hover"
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "hoverButtonText"]}
                              label="Hover button text"
                            >
                              <Input placeholder="Optional hover button text" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "hoverButtonLink"]}
                              label="Hover button link"
                            >
                              <Input placeholder="Optional hover button link" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item {...restField} name={[name, "hoverButtonTarget"]} label="Hover button target">
                              <Select options={LINK_TARGET_OPTIONS} />
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
          {
            key: "card-layout",
            label: "Card Layout & Responsive",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    name="cards1Variant"
                    label="Card style / variant"
                  >
                    <Select options={CARD_VARIANT_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1ColumnsDesktop" label="Desktop columns">
                    <InputNumber min={1} max={6} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1ColumnsLaptop" label="Laptop columns">
                    <InputNumber min={1} max={6} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1ColumnsTablet" label="Tablet columns">
                    <InputNumber min={1} max={4} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="cards1ColumnsMobileLandscape"
                    label="Mobile landscape columns"
                  >
                    <InputNumber min={1} max={3} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1ColumnsMobile" label="Mobile columns">
                    <InputNumber min={1} max={2} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1ColumnGap" label="Column gap (px)">
                    <InputNumber min={0} max={80} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1RowGap" label="Row gap (px)">
                    <InputNumber min={0} max={80} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardMinHeight" label="Card min height (px)">
                    <InputNumber min={120} max={500} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardRadius" label="Card radius (px)">
                    <InputNumber min={0} max={48} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardBorderWidth" label="Card border width (px)">
                    <InputNumber min={0} max={8} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardPaddingX" label="Card side padding (px)">
                    <InputNumber min={0} max={120} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardPaddingTop" label="Card top padding (px)">
                    <InputNumber min={0} max={120} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardPaddingBottom" label="Card bottom padding (px)">
                    <InputNumber min={0} max={120} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardIconWrapSize" label="Icon wrap size (px)">
                    <InputNumber min={16} max={120} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardIconSize" label="Icon size (px)">
                    <InputNumber min={10} max={80} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "card-typography",
            label: "Card Typography & Hover",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardTitleFontSize" label="Title size (px)">
                    <InputNumber min={10} max={48} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardTitleLineHeight" label="Title line-height">
                    <InputNumber min={1} max={2.4} step={0.05} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardDescriptionFontSize" label="Description size (px)">
                    <InputNumber min={10} max={32} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="cards1CardDescriptionLineHeight"
                    label="Description line-height"
                  >
                    <InputNumber min={1} max={2.6} step={0.05} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardButtonFontSize" label="Button text size (px)">
                    <InputNumber min={10} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardButtonRadius" label="Button radius (px)">
                    <InputNumber min={0} max={48} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="cards1CardHoverLift" label="Hover lift (px)">
                    <InputNumber min={0} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="cards1CardHoverTransitionMs"
                    label="Hover transition (ms)"
                  >
                    <InputNumber min={100} max={900} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      {saving ? (
        <div style={{ marginTop: 12 }}>
          <Spin size="small" />
        </div>
      ) : null}
    </Form>
  );
}

export default forwardRef(Cards1EditForm);
