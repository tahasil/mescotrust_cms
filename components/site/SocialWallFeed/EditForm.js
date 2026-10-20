"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Collapse,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Spin,
  Row,
  Col,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import { SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  SOCIAL_WALL_FEED_DEFAULTS as DEFAULTS,
  SOCIAL_WALL_SHADOW_OPTIONS,
  SOCIAL_WALL_TARGET_OPTIONS,
} from "./constants";

const API_PATH = "/api/theme/SocialWallFeed";
const PREFIX = "socialWallFeed";

const LAYOUT_OPTIONS = [
  { label: "Grid", value: "grid" },
];
const SORT_OPTIONS = [
  { label: "Latest", value: "latest" },
  { label: "Platform Priority", value: "platform-priority" },
  { label: "Engagement", value: "engagement" },
];
const SORT_ORDER_OPTIONS = [
  { label: "Descending", value: "desc" },
  { label: "Ascending", value: "asc" },
];
const CARD_STYLE_OPTIONS = [
  { label: "Clean", value: "clean" },
  { label: "Outlined", value: "outlined" },
  { label: "Elevated", value: "elevated" },
];

function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.floor(num);
  return rounded > 0 ? rounded : fallback;
}

function toNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeLayout(value) {
  const layout = toSafeString(value).toLowerCase();
  if (layout === "grid") return "grid";
  return "grid";
}

function normalizeSort(value) {
  const sort = toSafeString(value).toLowerCase();
  if (["latest", "platform-priority", "engagement"].includes(sort)) return sort;
  return "latest";
}

function normalizeSortOrder(value) {
  const order = toSafeString(value).toLowerCase();
  if (order === "asc" || order === "desc") return order;
  return "desc";
}

function normalizeCardStyle(value) {
  const style = toSafeString(value).toLowerCase();
  if (["clean", "outlined", "elevated"].includes(style)) return style;
  return "clean";
}

function normalizePlatforms(input) {
  if (!Array.isArray(input)) return [];
  return input.map((item) => toSafeString(item).toLowerCase()).filter(Boolean);
}

function toFormValues(data = {}) {
  return {
    ...getManageSectionInitialValues(PREFIX, data),
    mainTitle: toSafeString(data?.mainTitle || "Social Wall"),
    subTitle: toSafeString(data?.subTitle),
    titleColorKey: toSafeString(data?.titleColorKey),
    socialWallFeedTitleEnabled: data?.socialWallFeedTitleEnabled !== false,
    socialWallFeedSubTitleEnabled: data?.socialWallFeedSubTitleEnabled !== false,
    socialWallFeedSubTitleColorKey: toSafeString(data?.socialWallFeedSubTitleColorKey || "Primary"),
    socialWallFeedCardBgColorKey: toSafeString(data?.socialWallFeedCardBgColorKey || DEFAULTS.cardBackground),
    socialWallFeedCardBorderColorKey: toSafeString(data?.socialWallFeedCardBorderColorKey || DEFAULTS.cardBorder),
    socialWallFeedUserNameColorKey: toSafeString(data?.socialWallFeedUserNameColorKey || DEFAULTS.userNameColor),
    socialWallFeedHandleColorKey: toSafeString(data?.socialWallFeedHandleColorKey || DEFAULTS.handleColor),
    socialWallFeedPostTextColorKey: toSafeString(data?.socialWallFeedPostTextColorKey || DEFAULTS.postTextColor),
    socialWallFeedDateColorKey: toSafeString(data?.socialWallFeedDateColorKey || DEFAULTS.dateColor),
    socialWallFeedPlatformIconColorKey: toSafeString(data?.socialWallFeedPlatformIconColorKey || DEFAULTS.platformIconColor),
    socialWallFeedButtonBgColorKey: toSafeString(data?.socialWallFeedButtonBgColorKey || DEFAULTS.buttonBackground),
    socialWallFeedButtonTextColorKey: toSafeString(data?.socialWallFeedButtonTextColorKey || DEFAULTS.buttonTextColor),
    socialWallFeedButtonHoverBgColorKey: toSafeString(data?.socialWallFeedButtonHoverBgColorKey || DEFAULTS.buttonHoverBackground),
    socialWallFeedButtonHoverTextColorKey: toSafeString(data?.socialWallFeedButtonHoverTextColorKey || DEFAULTS.buttonHoverTextColor),
    socialWallFeedEnabled: data?.socialWallFeedEnabled !== false,
    socialWallFeedPlatforms: normalizePlatforms(data?.socialWallFeedPlatforms),
    socialWallFeedLayoutMode: normalizeLayout(data?.socialWallFeedLayoutMode),
    socialWallFeedPostLimit: toPositiveInt(data?.socialWallFeedPostLimit, 12),
    socialWallFeedFiltersEnabled: data?.socialWallFeedFiltersEnabled !== false,
    socialWallFeedCardStylePreset: normalizeCardStyle(data?.socialWallFeedCardStylePreset),
    socialWallFeedSortBy: normalizeSort(data?.socialWallFeedSortBy),
    socialWallFeedSortOrder: normalizeSortOrder(data?.socialWallFeedSortOrder),
    socialWallFeedShowPlatformIcon: data?.socialWallFeedShowPlatformIcon !== false,
    socialWallFeedShowEngagement: data?.socialWallFeedShowEngagement !== false,
    socialWallFeedShowDate: data?.socialWallFeedShowDate !== false,
    socialWallFeedInfiniteScroll: data?.socialWallFeedInfiniteScroll === true,
    socialWallFeedAvatarVisible: data?.socialWallFeedAvatarVisible !== false,
    socialWallFeedCardRadius: toNumber(data?.socialWallFeedCardRadius, DEFAULTS.cardRadius, 0, 60),
    socialWallFeedCardShadow: toSafeString(data?.socialWallFeedCardShadow || DEFAULTS.cardShadow),
    socialWallFeedCardSpacing: toNumber(data?.socialWallFeedCardSpacing, DEFAULTS.cardSpacing, 0, 64),
    socialWallFeedAvatarSize: toNumber(data?.socialWallFeedAvatarSize, DEFAULTS.avatarSize, 24, 96),
    socialWallFeedAvatarRadius: toNumber(data?.socialWallFeedAvatarRadius, DEFAULTS.avatarRadius, 0, 999),
    socialWallFeedButtonText: toSafeString(data?.socialWallFeedButtonText || DEFAULTS.buttonText),
    socialWallFeedButtonRadius: toNumber(data?.socialWallFeedButtonRadius, DEFAULTS.buttonRadius, 0, 999),
    socialWallFeedButtonTarget: data?.socialWallFeedButtonTarget === "_self" ? "_self" : "_blank",
    socialWallFeedTitleFontSize: toNumber(data?.socialWallFeedTitleFontSize, DEFAULTS.titleFontSize, 24, 96),
    socialWallFeedTitleFontWeight: toNumber(data?.socialWallFeedTitleFontWeight, DEFAULTS.titleFontWeight, 300, 900),
    socialWallFeedTitleLineHeight: toNumber(data?.socialWallFeedTitleLineHeight, DEFAULTS.titleLineHeight, 0.8, 2),
    socialWallFeedSubTitleFontSize: toNumber(data?.socialWallFeedSubTitleFontSize, DEFAULTS.subTitleFontSize, 10, 32),
    socialWallFeedSubTitleFontWeight: toNumber(data?.socialWallFeedSubTitleFontWeight, DEFAULTS.subTitleFontWeight, 300, 900),
    socialWallFeedPostFontSize: toNumber(data?.socialWallFeedPostFontSize, DEFAULTS.postFontSize, 11, 24),
    socialWallFeedPostLineHeight: toNumber(data?.socialWallFeedPostLineHeight, DEFAULTS.postLineHeight, 1, 2.4),
  };
}

function toPayload(values = {}) {
  return {
    ...getManageSectionPayload(PREFIX, values),
    mainTitle: toSafeString(values?.mainTitle || "Social Wall"),
    subTitle: toSafeString(values?.subTitle),
    titleColorKey: toSafeString(values?.titleColorKey),
    socialWallFeedTitleEnabled: values?.socialWallFeedTitleEnabled !== false,
    socialWallFeedSubTitleEnabled: values?.socialWallFeedSubTitleEnabled !== false,
    socialWallFeedSubTitleColorKey: toSafeString(values?.socialWallFeedSubTitleColorKey),
    socialWallFeedCardBgColorKey: toSafeString(values?.socialWallFeedCardBgColorKey),
    socialWallFeedCardBorderColorKey: toSafeString(values?.socialWallFeedCardBorderColorKey),
    socialWallFeedUserNameColorKey: toSafeString(values?.socialWallFeedUserNameColorKey),
    socialWallFeedHandleColorKey: toSafeString(values?.socialWallFeedHandleColorKey),
    socialWallFeedPostTextColorKey: toSafeString(values?.socialWallFeedPostTextColorKey),
    socialWallFeedDateColorKey: toSafeString(values?.socialWallFeedDateColorKey),
    socialWallFeedPlatformIconColorKey: toSafeString(values?.socialWallFeedPlatformIconColorKey),
    socialWallFeedButtonBgColorKey: toSafeString(values?.socialWallFeedButtonBgColorKey),
    socialWallFeedButtonTextColorKey: toSafeString(values?.socialWallFeedButtonTextColorKey),
    socialWallFeedButtonHoverBgColorKey: toSafeString(values?.socialWallFeedButtonHoverBgColorKey),
    socialWallFeedButtonHoverTextColorKey: toSafeString(values?.socialWallFeedButtonHoverTextColorKey),
    socialWallFeedEnabled: values?.socialWallFeedEnabled !== false,
    socialWallFeedPlatforms: normalizePlatforms(values?.socialWallFeedPlatforms),
    socialWallFeedLayoutMode: normalizeLayout(values?.socialWallFeedLayoutMode),
    socialWallFeedPostLimit: Math.min(60, toPositiveInt(values?.socialWallFeedPostLimit, 12)),
    socialWallFeedFiltersEnabled: values?.socialWallFeedFiltersEnabled !== false,
    socialWallFeedCardStylePreset: normalizeCardStyle(values?.socialWallFeedCardStylePreset),
    socialWallFeedSortBy: normalizeSort(values?.socialWallFeedSortBy),
    socialWallFeedSortOrder: normalizeSortOrder(values?.socialWallFeedSortOrder),
    socialWallFeedShowPlatformIcon: values?.socialWallFeedShowPlatformIcon !== false,
    socialWallFeedShowEngagement: values?.socialWallFeedShowEngagement !== false,
    socialWallFeedShowDate: values?.socialWallFeedShowDate !== false,
    socialWallFeedInfiniteScroll: values?.socialWallFeedInfiniteScroll === true,
    socialWallFeedAvatarVisible: values?.socialWallFeedAvatarVisible !== false,
    socialWallFeedCardRadius: toNumber(values?.socialWallFeedCardRadius, DEFAULTS.cardRadius, 0, 60),
    socialWallFeedCardShadow: toSafeString(values?.socialWallFeedCardShadow || DEFAULTS.cardShadow),
    socialWallFeedCardSpacing: toNumber(values?.socialWallFeedCardSpacing, DEFAULTS.cardSpacing, 0, 64),
    socialWallFeedAvatarSize: toNumber(values?.socialWallFeedAvatarSize, DEFAULTS.avatarSize, 24, 96),
    socialWallFeedAvatarRadius: toNumber(values?.socialWallFeedAvatarRadius, DEFAULTS.avatarRadius, 0, 999),
    socialWallFeedButtonText: toSafeString(values?.socialWallFeedButtonText || DEFAULTS.buttonText),
    socialWallFeedButtonRadius: toNumber(values?.socialWallFeedButtonRadius, DEFAULTS.buttonRadius, 0, 999),
    socialWallFeedButtonTarget: values?.socialWallFeedButtonTarget === "_self" ? "_self" : "_blank",
    socialWallFeedTitleFontSize: toNumber(values?.socialWallFeedTitleFontSize, DEFAULTS.titleFontSize, 24, 96),
    socialWallFeedTitleFontWeight: toNumber(values?.socialWallFeedTitleFontWeight, DEFAULTS.titleFontWeight, 300, 900),
    socialWallFeedTitleLineHeight: toNumber(values?.socialWallFeedTitleLineHeight, DEFAULTS.titleLineHeight, 0.8, 2),
    socialWallFeedSubTitleFontSize: toNumber(values?.socialWallFeedSubTitleFontSize, DEFAULTS.subTitleFontSize, 10, 32),
    socialWallFeedSubTitleFontWeight: toNumber(values?.socialWallFeedSubTitleFontWeight, DEFAULTS.subTitleFontWeight, 300, 900),
    socialWallFeedPostFontSize: toNumber(values?.socialWallFeedPostFontSize, DEFAULTS.postFontSize, 11, 24),
    socialWallFeedPostLineHeight: toNumber(values?.socialWallFeedPostLineHeight, DEFAULTS.postLineHeight, 1, 2.4),
  };
}

function SocialWallFeedEditForm(
  { source, initialData: initialDataProp, onSaveToPage, onSuccess, themeColorOptions: themeColorOptionsProp = [] },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [platformOptions, setPlatformOptions] = useState([]);
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
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...custom.map((item) => item?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    fetch("/api/public/social-wall/platforms", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const rows = Array.isArray(data?.items) ? data.items : [];
        setPlatformOptions(
          rows.map((row) => ({
            label: row?.label || row?.platform || "",
            value: row?.platform || "",
          })),
        );
      })
      .catch(() => {
        setPlatformOptions([]);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      form.setFieldsValue(toFormValues(initialDataProp || {}));
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => form.setFieldsValue(toFormValues(data || {})))
      .catch(() => message.error("Failed to load Social Wall Feed config"))
      .finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock]);

  const handleUpdate = useCallback(async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      const payload = toPayload(values);

      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }

      const res = await fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save Social Wall Feed config");
      message.success("Social Wall Feed saved");
      onSuccess?.();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || "Failed to save");
    }
  }, [form, isPageBlock, onSaveToPage, onSuccess]);

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [handleUpdate]);

  const blockDisplayOptions = useMemo(
    () => (
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item name="socialWallFeedLayoutMode" label="Layout mode">
            <Select options={LAYOUT_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="socialWallFeedPostLimit" label="Post limit">
            <InputNumber min={1} max={60} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="socialWallFeedCardStylePreset" label="Card style">
            <Select options={CARD_STYLE_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="socialWallFeedSortBy" label="Sort by">
            <Select options={SORT_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="socialWallFeedSortOrder" label="Sort order">
            <Select options={SORT_ORDER_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <SwitchSettingsCard items={[
            { name: "socialWallFeedFiltersEnabled", label: "Enable filters", tooltip: "Allow visitors to filter posts." },
            { name: "socialWallFeedShowPlatformIcon", label: "Show platform icon", tooltip: "Display the source platform icon." },
            { name: "socialWallFeedShowEngagement", label: "Show engagement", tooltip: "Display engagement information." },
            { name: "socialWallFeedShowDate", label: "Show date", tooltip: "Display the post date." },
            { name: "socialWallFeedAvatarVisible", label: "Show avatar", tooltip: "Display the author avatar." },
            { name: "socialWallFeedInfiniteScroll", label: "Enable infinite scroll", tooltip: "Load more posts while scrolling." },
          ]} />
        </Col>
      </Row>
    ),
    [],
  );

  const designOptions = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card size="small" title="Card layout">
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}><Form.Item name="socialWallFeedCardRadius" label="Border radius"><InputNumber min={0} max={60} addonAfter="px" style={{ width: "100%" }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="socialWallFeedCardShadow" label="Card shadow"><Select options={SOCIAL_WALL_SHADOW_OPTIONS} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="socialWallFeedCardSpacing" label="Card spacing"><InputNumber min={0} max={64} addonAfter="px" style={{ width: "100%" }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="socialWallFeedAvatarSize" label="Avatar size"><InputNumber min={24} max={96} addonAfter="px" style={{ width: "100%" }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="socialWallFeedAvatarRadius" label="Avatar border radius"><InputNumber min={0} max={999} addonAfter="px" style={{ width: "100%" }} /></Form.Item></Col>
        </Row>
      </Card>
      <Card size="small" title="Button">
        <Row gutter={[16, 0]}>
          <Col span={24}><Form.Item name="socialWallFeedButtonText" label="Button text"><Input placeholder="View Original Post" /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="socialWallFeedButtonRadius" label="Border radius"><InputNumber min={0} max={999} addonAfter="px" style={{ width: "100%" }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="socialWallFeedButtonTarget" label="Button target"><Select options={SOCIAL_WALL_TARGET_OPTIONS} /></Form.Item></Col>
        </Row>
      </Card>
    </div>
  );

  const typographyOptions = (
    <Card size="small" title="Typography">
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}><Form.Item name="socialWallFeedTitleFontSize" label="Title size"><InputNumber min={24} max={96} addonAfter="px" style={{ width: "100%" }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="socialWallFeedTitleFontWeight" label="Title weight"><InputNumber min={300} max={900} step={50} style={{ width: "100%" }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="socialWallFeedTitleLineHeight" label="Title line height"><InputNumber min={0.8} max={2} step={0.05} style={{ width: "100%" }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="socialWallFeedSubTitleFontSize" label="Sub title size"><InputNumber min={10} max={32} addonAfter="px" style={{ width: "100%" }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="socialWallFeedSubTitleFontWeight" label="Sub title weight"><InputNumber min={300} max={900} step={50} style={{ width: "100%" }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="socialWallFeedPostFontSize" label="Post text size"><InputNumber min={11} max={24} addonAfter="px" style={{ width: "100%" }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="socialWallFeedPostLineHeight" label="Post line height"><InputNumber min={1} max={2.4} step={0.05} style={{ width: "100%" }} /></Form.Item></Col>
      </Row>
    </Card>
  );

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
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
              <>
                <SwitchSettingsCard items={[{ name: "socialWallFeedEnabled", label: "Enable component", tooltip: "Show or hide this component." }]} />
                <ManageSectionFields
                  prefix={PREFIX}
                  form={form}
                  themeColorOptions={themeColorOptions}
                />
              </>
            ),
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("SocialWallFeed")}
              />
            ),
          },
          {
            key: "feed-config",
            label: "Feed Configuration",
            children: (
              <Form.Item name="socialWallFeedPlatforms" label="Platforms to display">
                <Select mode="multiple" options={platformOptions} placeholder="All active platforms" />
              </Form.Item>
            ),
          },
          {
            key: "display-config",
            label: "Display Settings",
            children: blockDisplayOptions,
          },
          {
            key: "card-design",
            label: "Card & Button Design",
            children: designOptions,
          },
          {
            key: "typography",
            label: "Typography",
            children: typographyOptions,
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(SocialWallFeedEditForm);
