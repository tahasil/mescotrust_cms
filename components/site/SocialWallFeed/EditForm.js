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
  Form,
  InputNumber,
  Select,
  Switch,
  message,
  Spin,
  Row,
  Col,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

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
  };
}

function toPayload(values = {}) {
  return {
    ...getManageSectionPayload(PREFIX, values),
    mainTitle: toSafeString(values?.mainTitle || "Social Wall"),
    subTitle: toSafeString(values?.subTitle),
    titleColorKey: toSafeString(values?.titleColorKey),
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
        <Col xs={24} md={8}>
          <Form.Item
            name="socialWallFeedFiltersEnabled"
            label="Enable filters"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="socialWallFeedShowPlatformIcon"
            label="Show platform icon"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="socialWallFeedShowEngagement"
            label="Show engagement"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="socialWallFeedShowDate" label="Show date" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="socialWallFeedInfiniteScroll"
            label="Enable infinite scroll"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>
    ),
    [],
  );

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage-section", "title-colors", "feed-config", "display-config"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: (
              <>
                <Form.Item
                  name="socialWallFeedEnabled"
                  label="Enable component"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
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
        ]}
      />
    </Form>
  );
}

export default forwardRef(SocialWallFeedEditForm);
