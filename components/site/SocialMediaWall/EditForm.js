"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Row,
  Col,
  Collapse,
  message,
  Spin,
  Select,
  InputNumber,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import { SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/SocialMediaWall";
const SECURE_CONFIG_API_PATH = "/api/admin/social-wall-config";
const PREFIX = "socialMediaWall";

const PLATFORM_OPTIONS = [
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
  { label: "YouTube", value: "youtube" },
  { label: "Twitter/X", value: "twitter" },
];

const DEFAULT_PLATFORMS = [
  { platform: "instagram", accessToken: "", accountId: "", apiKey: "", active: true, order: 1 },
  { platform: "facebook", accessToken: "", accountId: "", apiKey: "", active: true, order: 2 },
  { platform: "youtube", accessToken: "", accountId: "", apiKey: "", active: true, order: 3 },
  { platform: "twitter", accessToken: "", accountId: "", apiKey: "", active: true, order: 4 },
];

const LAYOUT_OPTIONS = [
  { label: "Grid", value: "grid" },
  { label: "Masonry", value: "masonry" },
  { label: "Carousel", value: "carousel" },
];

function safeString(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeOrder(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

function normalizePostLimit(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 12;
  return Math.min(60, Math.floor(num));
}

function normalizeLayoutMode(value) {
  const mode = safeString(value).toLowerCase();
  return ["grid", "masonry", "carousel"].includes(mode) ? mode : "masonry";
}

function normalizePlatform(item, index = 0) {
  const platform = safeString(item?.platform).toLowerCase();
  const isKnownPlatform = PLATFORM_OPTIONS.some((option) => option.value === platform);
  return {
    platform: isKnownPlatform ? platform : "instagram",
    accessToken: safeString(item?.accessToken),
    accountId: safeString(item?.accountId),
    apiKey: safeString(item?.apiKey),
    active: item?.active !== false,
    order: normalizeOrder(item?.order ?? item?.displayOrder, index + 1),
    hasAccessToken: item?.hasAccessToken === true,
    hasAccountId: item?.hasAccountId === true,
    hasApiKey: item?.hasApiKey === true,
    accessTokenMasked: safeString(item?.accessTokenMasked),
    accountIdMasked: safeString(item?.accountIdMasked),
    apiKeyMasked: safeString(item?.apiKeyMasked),
  };
}

function dedupeAndSortPlatforms(rows) {
  const map = new Map();
  rows.forEach((row) => {
    if (row?.platform) map.set(row.platform, row);
  });
  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}

function mergePlatformRows(componentRowsRaw, secureRowsRaw) {
  const merged = new Map(
    DEFAULT_PLATFORMS.map((item, index) => [
      item.platform,
      normalizePlatform(item, index),
    ]),
  );

  const componentRows = Array.isArray(componentRowsRaw)
    ? componentRowsRaw.map((item, index) => normalizePlatform(item, index))
    : [];
  const secureRows = Array.isArray(secureRowsRaw)
    ? secureRowsRaw.map((item, index) => normalizePlatform(item, index))
    : [];

  componentRows.forEach((row) => {
    const previous = merged.get(row.platform) || {};
    merged.set(row.platform, {
      ...previous,
      platform: row.platform,
      active: row.active,
      order: row.order,
    });
  });

  secureRows.forEach((row) => {
    const previous = merged.get(row.platform) || {};
    merged.set(row.platform, {
      ...previous,
      ...row,
      platform: row.platform,
      active: row.active,
      order: row.order,
      accessToken: safeString(row.accessToken),
      accountId: safeString(row.accountId),
      apiKey: safeString(row.apiKey),
    });
  });

  return dedupeAndSortPlatforms(Array.from(merged.values()));
}

function fetchJson(url) {
  return fetch(url, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {}));
}

function SocialMediaWallEditForm(
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

    const setFormAndColors = (data, theme, secureData) => {
      const spacingValue = Number(data?.socialMediaWallSectionSpacing);
      const normalizedForSection = {
        ...(data || {}),
        ...(data?.socialMediaWallSectionBgType !== "image" &&
        data?.socialMediaWallSectionBgType !== "color" &&
        safeString(data?.socialMediaWallSectionBgColorKey)
          ? { socialMediaWallSectionBgType: "color" }
          : {}),
        ...(data?.socialMediaWallSectionPaddingTop == null &&
        data?.socialMediaWallSectionPaddingBottom == null &&
        Number.isFinite(spacingValue) &&
        spacingValue >= 0
          ? {
              socialMediaWallSectionPaddingTop: Math.floor(spacingValue),
              socialMediaWallSectionPaddingBottom: Math.floor(spacingValue),
            }
          : {}),
      };

      const platforms = mergePlatformRows(
        data?.socialMediaWallPlatforms,
        secureData?.items,
      );

      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, normalizedForSection),
        socialMediaWallEnabled: data?.socialMediaWallEnabled !== false,
        mainTitle: safeString(data?.mainTitle || "Social Media Wall") || "Social Media Wall",
        subTitle: safeString(data?.subTitle),
        titleColorKey: safeString(data?.titleColorKey),
        socialMediaWallTitleEnabled: data?.socialMediaWallTitleEnabled !== false,
        socialMediaWallSubTitleEnabled: data?.socialMediaWallSubTitleEnabled !== false,
        socialMediaWallSubTitleColorKey: safeString(data?.socialMediaWallSubTitleColorKey),
        socialMediaWallPlatforms: platforms,
        socialMediaWallPostLimit: normalizePostLimit(data?.socialMediaWallPostLimit),
        socialMediaWallLayoutMode: normalizeLayoutMode(data?.socialMediaWallLayoutMode),
        socialMediaWallShowPlatformIcon: data?.socialMediaWallShowPlatformIcon !== false,
      });

      if (theme) {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((color) => color?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      }
    };

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      setFormAndColors(data, null, null);

      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetchJson("/api/theme")
          .then((theme) => setFormAndColors(data, theme, null))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    Promise.all([
      fetchJson(API_PATH),
      fetchJson("/api/theme"),
      fetchJson(SECURE_CONFIG_API_PATH),
    ])
      .then(([data, theme, secureData]) => setFormAndColors(data, theme, secureData))
      .catch(() => message.error("Failed to load Social Media Wall settings"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      const platforms = dedupeAndSortPlatforms(
        (Array.isArray(values?.socialMediaWallPlatforms)
          ? values.socialMediaWallPlatforms
          : []
        )
          .map((item, index) => normalizePlatform(item, index))
          .filter(Boolean),
      );

      if (platforms.length === 0) {
        message.error("At least one platform configuration is required");
        return;
      }

      const platformComponentPayload = platforms.map((item) => ({
        platform: item.platform,
        active: item.active !== false,
        order: normalizeOrder(item.order, 1),
        feedMode: "both",
        visibility: "all",
        postLimit: normalizePostLimit(values?.socialMediaWallPostLimit),
      }));

      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        socialMediaWallEnabled: values?.socialMediaWallEnabled !== false,
        mainTitle: safeString(values?.mainTitle || "Social Media Wall") || "Social Media Wall",
        subTitle: safeString(values?.subTitle),
        titleColorKey: safeString(values?.titleColorKey),
        socialMediaWallTitleEnabled: values?.socialMediaWallTitleEnabled !== false,
        socialMediaWallSubTitleEnabled: values?.socialMediaWallSubTitleEnabled !== false,
        socialMediaWallSubTitleColorKey: safeString(values?.socialMediaWallSubTitleColorKey),
        socialMediaWallPlatforms: platformComponentPayload,
        socialMediaWallPostLimit: normalizePostLimit(values?.socialMediaWallPostLimit),
        socialMediaWallLayoutMode: normalizeLayoutMode(values?.socialMediaWallLayoutMode),
        socialMediaWallShowPlatformIcon: values?.socialMediaWallShowPlatformIcon !== false,
        socialMediaWallSectionSpacing: -1,
        socialMediaWallEnableLivePosts: true,
        socialMediaWallOrderMode: "platform-priority",
      };

      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }

      const credentialRows = platforms.map((item) => ({
        platform: item.platform,
        accessToken: safeString(item.accessToken),
        accountId: safeString(item.accountId),
        apiKey: safeString(item.apiKey),
        active: item.active !== false,
        displayOrder: normalizeOrder(item.order, 1),
      }));

      const secureRes = await fetch(SECURE_CONFIG_API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: credentialRows }),
      });
      if (!secureRes.ok) {
        const errorPayload = await secureRes.json().catch(() => ({}));
        throw new Error(errorPayload?.error || "Failed to save platform credentials");
      }

      const themeRes = await fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!themeRes.ok) {
        const errorPayload = await themeRes.json().catch(() => ({}));
        throw new Error(errorPayload?.error || "Failed to save Social Media Wall settings");
      }

      message.success("Social Media Wall saved");
      onSuccess?.();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || "Failed to save");
    }
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [handleUpdate]);

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
              <>
                <div style={{ marginBottom: 16 }}>
                  <SwitchSettingsCard items={[{ name: "socialMediaWallEnabled", label: "Enable component", tooltip: "Show or hide this component." }]} />
                </div>
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
                {...getTitleAndColorsConfig("SocialMediaWall")}
              />
            ),
          },
          {
            key: "display-settings",
            label: "Display Settings",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item name="socialMediaWallPostLimit" label="Posts to show">
                    <InputNumber min={1} max={60} style={{ width: "100%" }} size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="socialMediaWallLayoutMode" label="Layout style">
                    <Select options={LAYOUT_OPTIONS} size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <SwitchSettingsCard items={[{ name: "socialMediaWallShowPlatformIcon", label: "Show platform icon", tooltip: "Display each post's source platform icon." }]} />
                </Col>
              </Row>
            ),
          },
          {
            key: "platform-configurations",
            label: "SocialMediaWall Configuration",
            children: (
              <>
                <Form.List name="socialMediaWallPlatforms">
                  {(fields, { add, remove, move }) => (
                    <SortableFormList
                      fields={fields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="Platform"
                      addButtonText="Add platform configuration"
                      defaultAddPayload={{
                        platform: "instagram",
                        accessToken: "",
                        accountId: "",
                        apiKey: "",
                        active: true,
                        order: fields.length + 1,
                      }}
                      reorderMovedIndex={reorderMovedIndex}
                      reorderDirection={reorderDirection}
                      hideRemove
                      resolveItemTitle={(name) => `Platform ${name + 1}`}
                      onMoveWithTransition={(from, to) => {
                        setReorderDirection(to < from ? "up" : "down");
                        setReorderMovedIndex(to);
                        setTimeout(() => setReorderMovedIndex(-1), 400);
                      }}
                      renderItemContent={(name, restField) => {
                        return (
                          <Row gutter={[0, 0]}>
                            <Col xs={24}>
                              <div style={{ marginBottom: 12 }}>
                                <SwitchSettingsCard items={[{
                                  name: [name, "active"],
                                  label: "Active Status",
                                  tooltip: "Enable this platform configuration.",
                                }]} />
                              </div>
                            </Col>

                            <Col xs={24}>
                              <Form.Item
                                {...restField}
                                name={[name, "platform"]}
                                label="Platform"
                                rules={[{ required: true, message: "Platform is required" }]}
                                style={{ marginBottom: 12 }}
                              >
                                <Select options={PLATFORM_OPTIONS} size="large" />
                              </Form.Item>
                            </Col>

                            <Col xs={24}>
                              <Form.Item
                                {...restField}
                                name={[name, "order"]}
                                label="Display Order"
                                rules={[{ required: true, message: "Display order is required" }]}
                                style={{ marginBottom: 12 }}
                              >
                                <InputNumber min={1} max={99} size="large" style={{ width: "100%" }} />
                              </Form.Item>
                            </Col>

                            {!isPageBlock ? (
                              <Col xs={24}>
                                <Form.Item
                                  {...restField}
                                  name={[name, "accessToken"]}
                                  label="ACCESS_TOKEN"
                                  style={{ marginBottom: 12 }}
                                >
                                  <Input.Password
                                    size="large"
                                    placeholder="Enter ACCESS_TOKEN (leave blank to keep existing)"
                                  />
                                </Form.Item>
                              </Col>
                            ) : null}

                            {!isPageBlock ? (
                              <Col xs={24}>
                                <Form.Item
                                  {...restField}
                                  name={[name, "accountId"]}
                                  label="USER_ID / CHANNEL_ID / PAGE_ID"
                                  style={{ marginBottom: 12 }}
                                >
                                  <Input
                                    size="large"
                                    placeholder="Enter USER_ID / CHANNEL_ID / PAGE_ID"
                                  />
                                </Form.Item>
                              </Col>
                            ) : null}

                            {!isPageBlock ? (
                              <Col xs={24}>
                                <Form.Item
                                  {...restField}
                                  name={[name, "apiKey"]}
                                  label="API_KEY"
                                  style={{ marginBottom: 12 }}
                                >
                                  <Input.Password
                                    size="large"
                                    placeholder="Enter API_KEY (leave blank to keep existing)"
                                  />
                                </Form.Item>
                              </Col>
                            ) : null}
                          </Row>
                        );
                      }}
                    />
                  )}
                </Form.List>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(SocialMediaWallEditForm);
