"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin, Select, Switch, InputNumber } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/SocialMediaWall";
const PREFIX = "socialMediaWall";

const PLATFORM_OPTIONS = [
  { label: "X (Twitter)", value: "twitter" },
  { label: "Facebook", value: "facebook" },
  { label: "Instagram", value: "instagram" },
  { label: "YouTube", value: "youtube" },
];

const LAYOUT_OPTIONS = [
  { label: "Grid", value: "grid" },
  { label: "Masonry", value: "masonry" },
  { label: "Carousel", value: "carousel" },
];

const DEFAULT_PLATFORMS = [
  { platform: "twitter", profileUrl: "", active: true, order: 1 },
  { platform: "facebook", profileUrl: "", active: true, order: 2 },
  { platform: "instagram", profileUrl: "", active: true, order: 3 },
  { platform: "youtube", profileUrl: "", active: true, order: 4 },
];

function safeString(value) {
  return value == null ? "" : String(value).trim();
}

function normalizePlatform(item, index = 0) {
  const platform = safeString(item?.platform || "twitter").toLowerCase();
  const orderValue = Number(item?.order);
  return {
    platform: PLATFORM_OPTIONS.some((option) => option.value === platform)
      ? platform
      : "twitter",
    profileUrl: safeString(item?.profileUrl),
    active: item?.active !== false,
    order:
      Number.isFinite(orderValue) && orderValue > 0
        ? Math.floor(orderValue)
        : index + 1,
  };
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

    const setFormAndColors = (data, theme) => {
      const spacingValue = Number(data?.socialMediaWallSectionSpacing);
      const normalizedForSection = {
        ...(data || {}),
        ...((
          data?.socialMediaWallSectionBgType !== "image" &&
          data?.socialMediaWallSectionBgType !== "color" &&
          safeString(data?.socialMediaWallSectionBgColorKey)
        )
          ? { socialMediaWallSectionBgType: "color" }
          : {}),
        ...(
          data?.socialMediaWallSectionPaddingTop == null &&
          data?.socialMediaWallSectionPaddingBottom == null &&
          Number.isFinite(spacingValue) &&
          spacingValue >= 0
            ? {
                socialMediaWallSectionPaddingTop: Math.floor(spacingValue),
                socialMediaWallSectionPaddingBottom: Math.floor(spacingValue),
              }
            : {}
        ),
      };

      const platforms = Array.isArray(data?.socialMediaWallPlatforms)
        ? data.socialMediaWallPlatforms.map((item, index) => normalizePlatform(item, index))
        : [];

      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, normalizedForSection),
        socialMediaWallEnabled: data?.socialMediaWallEnabled !== false,
        mainTitle: safeString(data?.mainTitle || "Social Media Wall") || "Social Media Wall",
        subTitle: safeString(data?.subTitle),
        titleColorKey: safeString(data?.titleColorKey),
        socialMediaWallTitleEnabled: data?.socialMediaWallTitleEnabled !== false,
        socialMediaWallSubTitleEnabled: data?.socialMediaWallSubTitleEnabled !== false,
        socialMediaWallSubTitleColorKey: safeString(data?.socialMediaWallSubTitleColorKey),
        socialMediaWallPlatforms:
          platforms.length > 0
            ? platforms
            : DEFAULT_PLATFORMS.map((item, index) => normalizePlatform(item, index)),
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
      setFormAndColors(data);
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => setFormAndColors(data, theme))
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
      .then(([data, theme]) => setFormAndColors(data, theme))
      .catch(() => message.error("Failed to load Social Media Wall settings"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const platforms = Array.isArray(values?.socialMediaWallPlatforms)
          ? values.socialMediaWallPlatforms
              .map((item, index) => normalizePlatform(item, index))
              .sort((first, second) => first.order - second.order)
          : [];

        const payload = {
          ...getManageSectionPayload(PREFIX, values),
          socialMediaWallEnabled: values?.socialMediaWallEnabled !== false,
          mainTitle: safeString(values?.mainTitle || "Social Media Wall") || "Social Media Wall",
          subTitle: safeString(values?.subTitle),
          titleColorKey: safeString(values?.titleColorKey),
          socialMediaWallTitleEnabled: values?.socialMediaWallTitleEnabled !== false,
          socialMediaWallSubTitleEnabled: values?.socialMediaWallSubTitleEnabled !== false,
          socialMediaWallSubTitleColorKey: safeString(values?.socialMediaWallSubTitleColorKey),

          socialMediaWallPlatforms: platforms,
          socialMediaWallPostLimit: normalizePostLimit(values?.socialMediaWallPostLimit),
          socialMediaWallLayoutMode: normalizeLayoutMode(values?.socialMediaWallLayoutMode),
          socialMediaWallShowPlatformIcon: values?.socialMediaWallShowPlatformIcon !== false,
          // Disable legacy spacing override so Manage Section spacing is the single source.
          socialMediaWallSectionSpacing: -1,

          // Internal defaults retained to keep frontend behavior stable.
          socialMediaWallEnableLivePosts: true,
          socialMediaWallOrderMode: "platform-priority",
        };

        if (isPageBlock && onSaveToPage) {
          onSaveToPage(payload);
          message.success("Changes will be saved with the page");
          onSuccess?.();
          return;
        }

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
            message.success("Social Media Wall saved");
            onSuccess?.();
          })
          .catch((err) => message.error(err?.error || "Failed to save"));
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
        defaultActiveKey={["platforms"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Form.Item
                    name="socialMediaWallEnabled"
                    label="Enable component"
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch />
                  </Form.Item>
                </div>
                <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />
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
            key: "platforms",
            label: "Manage Platforms",
            children: (
              <>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Form.Item name="socialMediaWallPostLimit" label="Posts to show">
                      <InputNumber min={1} max={60} style={{ width: "100%" }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="socialMediaWallLayoutMode" label="Layout style">
                      <Select options={LAYOUT_OPTIONS} size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="socialMediaWallShowPlatformIcon"
                      label="Show platform icon"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.List name="socialMediaWallPlatforms">
                  {(fields, { add, remove, move }) => (
                    <SortableFormList
                      fields={fields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="Platform"
                      addButtonText="Add platform"
                      defaultAddPayload={{
                        platform: "twitter",
                        profileUrl: "",
                        active: true,
                        order: 1,
                      }}
                      reorderMovedIndex={reorderMovedIndex}
                      reorderDirection={reorderDirection}
                      onMoveWithTransition={(from, to) => {
                        setReorderDirection(to < from ? "up" : "down");
                        setReorderMovedIndex(to);
                        setTimeout(() => setReorderMovedIndex(-1), 400);
                      }}
                      renderItemContent={(name, restField) => (
                        <Row gutter={[16, 16]}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "platform"]}
                              label="Platform"
                              rules={[{ required: true, message: "Platform is required" }]}
                            >
                              <Select options={PLATFORM_OPTIONS} size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "profileUrl"]}
                              label="Profile URL"
                            >
                              <Input placeholder="https://..." size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "active"]}
                              label="Active"
                              valuePropName="checked"
                            >
                              <Switch />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "order"]}
                              label="Display order"
                            >
                              <InputNumber min={1} max={99} style={{ width: "100%" }} size="large" />
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
        ]}
      />
    </Form>
  );
}

export default forwardRef(SocialMediaWallEditForm);
