"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Col, Collapse, Form, InputNumber, Row, Select, Switch, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";

const PREFIX = "portfolio";
const PORTFOLIO_TITLE_COLORS_CONFIG = {
  titleListHeader: "Main Title",
  titleListItems: [],
  colorListItems: [
    {
      name: "portfolioCardTitleColorKey",
      label: "Card Title Color",
      tooltip: "Theme color for portfolio item title",
    },
    {
      name: "portfolioDescriptionColorKey",
      label: "Description Color",
      tooltip: "Theme color for description text",
    },
    {
      name: "portfolioLinkColorKey",
      label: "Know More Color",
      tooltip: "Theme color for Know More link text",
    },
    {
      name: "portfolioDropdownTextColorKey",
      label: "Dropdown Text Color",
      tooltip: "Theme color for category dropdown text",
    },
  ],
};

function toText(value) {
  return value != null ? String(value).trim() : "";
}

function toOptionalNumber(value, min, max) {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;
  if (Number.isFinite(min) && num < min) return min;
  if (Number.isFinite(max) && num > max) return max;
  return num;
}

function toCardsCount(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(12, Math.max(1, Math.round(num)));
}

function normalizeBlockValues(data = {}) {
  const source = data && typeof data === "object" ? data : {};

  return {
    ...getManageSectionInitialValues(PREFIX, source),
    portfolioCategoryIds: Array.isArray(source.portfolioCategoryIds)
      ? source.portfolioCategoryIds
      : [],
    portfolioShowAllCategories:
      source.portfolioShowAllCategories != null
        ? source.portfolioShowAllCategories !== false
        : true,
    portfolioShowCategoryName: false,
    cardsDesktop: toCardsCount(source.cardsDesktop, 3),
    cardsTablet: toCardsCount(source.cardsTablet, 2),
    cardsMobile: toCardsCount(source.cardsMobile, 1),
    portfolioCardTitleColorKey: toText(
      source.portfolioCardTitleColorKey ||
        source.portfolioTextColorKey ||
        source.portfolioItemNameColorKey,
    ),
    portfolioButtonColorKey: toText(
      source.portfolioButtonColorKey || source.portfolioTabActiveBgColorKey,
    ),
    portfolioDescriptionColorKey: toText(
      source.portfolioDescriptionColorKey ||
        source.portfolioItemDesignationColorKey ||
        source.portfolioItemBioColorKey,
    ),
    portfolioSocialIconColorKey: toText(
      source.portfolioSocialIconColorKey || source.portfolioSocialLinkColorKey,
    ),
    portfolioLinkColorKey: toText(source.portfolioLinkColorKey),
    portfolioCountTextColorKey: toText(source.portfolioCountTextColorKey),
    portfolioCardBgColorKey: toText(source.portfolioCardBgColorKey),
    portfolioCardBorderColorKey: toText(source.portfolioCardBorderColorKey),
    portfolioCardHoverBgColorKey: toText(source.portfolioCardHoverBgColorKey),
    portfolioDropdownBgColorKey: toText(source.portfolioDropdownBgColorKey),
    portfolioDropdownTextColorKey: toText(source.portfolioDropdownTextColorKey),
    portfolioDropdownBorderColorKey: toText(source.portfolioDropdownBorderColorKey),
    portfolioDropdownHoverBgColorKey: toText(source.portfolioDropdownHoverBgColorKey),
    portfolioDropdownActiveTextColorKey: toText(
      source.portfolioDropdownActiveTextColorKey,
    ),

    portfolioCardTitleFontSizeDesktop: source?.portfolioCardTitleFontSizeDesktop,
    portfolioCardTitleFontSizeMobile: source?.portfolioCardTitleFontSizeMobile,
    portfolioCardTitleFontWeight: source?.portfolioCardTitleFontWeight,

    portfolioDescriptionFontSizeDesktop: source?.portfolioDescriptionFontSizeDesktop,
    portfolioDescriptionFontSizeMobile: source?.portfolioDescriptionFontSizeMobile,
    portfolioDescriptionFontWeight: source?.portfolioDescriptionFontWeight,

    portfolioKnowMoreFontSizeDesktop: source?.portfolioKnowMoreFontSizeDesktop,
    portfolioKnowMoreFontSizeMobile: source?.portfolioKnowMoreFontSizeMobile,
    portfolioKnowMoreFontWeight: source?.portfolioKnowMoreFontWeight,

    portfolioDropdownTextFontSizeDesktop:
      source?.portfolioDropdownTextFontSizeDesktop ?? source?.portfolioDropdownFontSizeDesktop,
    portfolioDropdownTextFontSizeMobile:
      source?.portfolioDropdownTextFontSizeMobile ?? source?.portfolioDropdownFontSizeMobile,
    portfolioDropdownTextFontWeight:
      source?.portfolioDropdownTextFontWeight ?? source?.portfolioDropdownFontWeight,
  };
}

function PortfolioBlockEditForm(
  { source, initialData, onSaveToPage, themeColorOptions: themeColorOptionsProp = [] },
  ref,
) {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  const showAllCategories = Form.useWatch("portfolioShowAllCategories", form);

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
    }
  }, [themeColorOptionsProp]);

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0 || themeFetchedForColorsRef.current) return;
    themeFetchedForColorsRef.current = true;
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((color) => color?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch("/api/admin/portfolio-categories?active=1")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (ignore) return;
        setCategories(Array.isArray(data?.items) ? data.items : []);
        form.setFieldsValue(normalizeBlockValues(initialData));
      })
      .catch(() => {
        if (ignore) return;
        setCategories([]);
        form.setFieldsValue(normalizeBlockValues(initialData));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [form, initialData]);

  const categoryOptions = useMemo(
    () =>
      categories.map((item) => ({
        label: item.name,
        value: item._id,
      })),
    [categories],
  );

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const payload = {
          portfolioCategoryIds: Array.isArray(values.portfolioCategoryIds)
            ? values.portfolioCategoryIds
            : [],
          portfolioShowAllCategories: values.portfolioShowAllCategories !== false,
          portfolioShowCategoryName: false,
          cardsDesktop: toCardsCount(values.cardsDesktop, 3),
          cardsTablet: toCardsCount(values.cardsTablet, 2),
          cardsMobile: toCardsCount(values.cardsMobile, 1),
          portfolioCardTitleColorKey: toText(values.portfolioCardTitleColorKey),
          portfolioButtonColorKey: toText(values.portfolioButtonColorKey),
          portfolioDescriptionColorKey: toText(values.portfolioDescriptionColorKey),
          portfolioSocialIconColorKey: toText(values.portfolioSocialIconColorKey),
          portfolioLinkColorKey: toText(values.portfolioLinkColorKey),
          portfolioCountTextColorKey: toText(values.portfolioCountTextColorKey),
          portfolioCardBgColorKey: toText(values.portfolioCardBgColorKey),
          portfolioCardBorderColorKey: toText(values.portfolioCardBorderColorKey),
          portfolioCardHoverBgColorKey: toText(values.portfolioCardHoverBgColorKey),
          portfolioDropdownBgColorKey: toText(values.portfolioDropdownBgColorKey),
          portfolioDropdownTextColorKey: toText(values.portfolioDropdownTextColorKey),
          portfolioDropdownBorderColorKey: toText(values.portfolioDropdownBorderColorKey),
          portfolioDropdownHoverBgColorKey: toText(
            values.portfolioDropdownHoverBgColorKey,
          ),
          portfolioDropdownActiveTextColorKey: toText(
            values.portfolioDropdownActiveTextColorKey,
          ),

          portfolioCardTitleFontSizeDesktop: toOptionalNumber(
            values.portfolioCardTitleFontSizeDesktop,
            10,
            120,
          ),
          portfolioCardTitleFontSizeMobile: toOptionalNumber(
            values.portfolioCardTitleFontSizeMobile,
            10,
            120,
          ),
          portfolioCardTitleFontWeight: toOptionalNumber(
            values.portfolioCardTitleFontWeight,
            100,
            900,
          ),

          portfolioDescriptionFontSizeDesktop: toOptionalNumber(
            values.portfolioDescriptionFontSizeDesktop,
            10,
            96,
          ),
          portfolioDescriptionFontSizeMobile: toOptionalNumber(
            values.portfolioDescriptionFontSizeMobile,
            10,
            96,
          ),
          portfolioDescriptionFontWeight: toOptionalNumber(
            values.portfolioDescriptionFontWeight,
            100,
            900,
          ),

          portfolioKnowMoreFontSizeDesktop: toOptionalNumber(
            values.portfolioKnowMoreFontSizeDesktop,
            10,
            96,
          ),
          portfolioKnowMoreFontSizeMobile: toOptionalNumber(
            values.portfolioKnowMoreFontSizeMobile,
            10,
            96,
          ),
          portfolioKnowMoreFontWeight: toOptionalNumber(
            values.portfolioKnowMoreFontWeight,
            100,
            900,
          ),

          portfolioDropdownTextFontSizeDesktop: toOptionalNumber(
            values.portfolioDropdownTextFontSizeDesktop,
            10,
            80,
          ),
          portfolioDropdownTextFontSizeMobile: toOptionalNumber(
            values.portfolioDropdownTextFontSizeMobile,
            10,
            80,
          ),
          portfolioDropdownTextFontWeight: toOptionalNumber(
            values.portfolioDropdownTextFontWeight,
            100,
            900,
          ),

          ...getManageSectionPayload(PREFIX, values),
        };

        if (isPageBlock && onSaveToPage) {
          onSaveToPage(payload);
          message.success("Portfolio block updated for this page");
        }
      })
      .catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [form]);

  if (loading) return null;

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={[
          "manage-section",
          "title-colors",
          "font-settings",
          "settings",
        ]}
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
            label: "Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...PORTFOLIO_TITLE_COLORS_CONFIG}
              />
            ),
          },
          {
            key: "font-settings",
            label: "Font Settings",
            children: (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  Card Title
                </div>
                <Row gutter={[16, 8]} style={{ marginBottom: 14 }}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="portfolioCardTitleFontSizeDesktop"
                      label="Font Size (Desktop px)"
                    >
                      <InputNumber style={{ width: "100%" }} min={10} max={120} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="portfolioCardTitleFontSizeMobile"
                      label="Font Size (Mobile px)"
                    >
                      <InputNumber style={{ width: "100%" }} min={10} max={120} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="portfolioCardTitleFontWeight" label="Font Weight">
                      <InputNumber style={{ width: "100%" }} min={100} max={900} step={100} />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  Description Text
                </div>
                <Row gutter={[16, 8]} style={{ marginBottom: 14 }}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="portfolioDescriptionFontSizeDesktop"
                      label="Font Size (Desktop px)"
                    >
                      <InputNumber style={{ width: "100%" }} min={10} max={96} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="portfolioDescriptionFontSizeMobile"
                      label="Font Size (Mobile px)"
                    >
                      <InputNumber style={{ width: "100%" }} min={10} max={96} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="portfolioDescriptionFontWeight" label="Font Weight">
                      <InputNumber style={{ width: "100%" }} min={100} max={900} step={100} />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  Know More Link
                </div>
                <Row gutter={[16, 8]} style={{ marginBottom: 14 }}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="portfolioKnowMoreFontSizeDesktop"
                      label="Font Size (Desktop px)"
                    >
                      <InputNumber style={{ width: "100%" }} min={10} max={96} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="portfolioKnowMoreFontSizeMobile"
                      label="Font Size (Mobile px)"
                    >
                      <InputNumber style={{ width: "100%" }} min={10} max={96} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="portfolioKnowMoreFontWeight" label="Font Weight">
                      <InputNumber style={{ width: "100%" }} min={100} max={900} step={100} />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  Dropdown Text
                </div>
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="portfolioDropdownTextFontSizeDesktop"
                      label="Font Size (Desktop px)"
                    >
                      <InputNumber style={{ width: "100%" }} min={10} max={80} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="portfolioDropdownTextFontSizeMobile"
                      label="Font Size (Mobile px)"
                    >
                      <InputNumber style={{ width: "100%" }} min={10} max={80} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="portfolioDropdownTextFontWeight" label="Font Weight">
                      <InputNumber style={{ width: "100%" }} min={100} max={900} step={100} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: "settings",
            label: "Portfolio Settings",
            children: (
              <>
                <Form.Item
                  name="portfolioShowAllCategories"
                  label="Show All Categories"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="portfolioCategoryIds"
                  label="Select Categories"
                  extra={
                    showAllCategories
                      ? "Disabled because Show All Categories is enabled."
                      : "Choose one or more categories."
                  }
                >
                  <Select
                    mode="multiple"
                    options={categoryOptions}
                    placeholder="Select categories"
                    disabled={showAllCategories}
                  />
                </Form.Item>

                <Row gutter={[12, 8]}>
                  <Col xs={24} sm={8}>
                    <Form.Item name="cardsDesktop" label="Cards (Desktop)">
                      <InputNumber min={1} max={12} precision={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="cardsTablet" label="Cards (Tablet)">
                      <InputNumber min={1} max={12} precision={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="cardsMobile" label="Cards (Mobile)">
                      <InputNumber min={1} max={12} precision={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(PortfolioBlockEditForm);


