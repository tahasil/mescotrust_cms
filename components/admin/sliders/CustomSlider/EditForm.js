"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Collapse,
  Form,
  InputNumber,
  List,
  Row,
  Spin,
  Switch,
  Tooltip,
  message,
} from "antd";
import { DownOutlined, QuestionCircleOutlined, UpOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/CustomSlider";
const PREFIX = "customSlider";

function toText(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeOrderIds(list) {
  return Array.isArray(list) ? list.map((id) => toText(id)).filter(Boolean) : [];
}

function applySavedOrder(items, orderedIds) {
  const safeItems = Array.isArray(items) ? items : [];
  const order = normalizeOrderIds(orderedIds);
  if (safeItems.length === 0 || order.length === 0) return safeItems;
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...safeItems].sort((a, b) => {
    const aRank = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.name.localeCompare(b.name);
  });
}

function CustomSliderEditForm(
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
  const [featuredItemsLoading, setFeaturedItemsLoading] = useState(true);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [themeColorOptions, setThemeColorOptions] = useState(
    themeColorOptionsProp,
  );
  const portfolioOrderRef = useRef([]);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
    }
  }, [themeColorOptionsProp]);

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0 || themeFetchedForColorsRef.current) {
      return;
    }
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
        setThemeColorOptions(
          names.map((name) => ({ label: name, value: name })),
        );
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const savedOrder = normalizeOrderIds(data?.customSliderPortfolioOrder);
      portfolioOrderRef.current = savedOrder;
      form.setFieldsValue({
        ...(data && typeof data === "object" ? data : {}),
        mainTitle: data?.mainTitle ?? "Featured Portfolio",
        subTitle: data?.subTitle ?? "",
        customSliderPortfolioOrder: savedOrder,
        customSliderAutoplay: data?.customSliderAutoplay !== false,
        customSliderAutoplaySpeed:
          data?.customSliderAutoplaySpeed != null
            ? Number(data.customSliderAutoplaySpeed)
            : 4500,
        customSliderShowArrows: data?.customSliderShowArrows !== false,
        customSliderShowDots: data?.customSliderShowDots !== false,
        customSliderSpeed:
          data?.customSliderSpeed != null ? Number(data.customSliderSpeed) : 500,
        ...getManageSectionInitialValues(PREFIX, data),
      });
      setLoading(false);
      return;
    }

    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const savedOrder = normalizeOrderIds(data?.customSliderPortfolioOrder);
        portfolioOrderRef.current = savedOrder;
        form.setFieldsValue({
          mainTitle: data?.mainTitle ?? "Featured Portfolio",
          subTitle: data?.subTitle ?? "",
          customSliderPortfolioOrder: savedOrder,
          customSliderAutoplay: data?.customSliderAutoplay !== false,
          customSliderAutoplaySpeed:
            data?.customSliderAutoplaySpeed != null
              ? Number(data.customSliderAutoplaySpeed)
              : 4500,
          customSliderShowArrows: data?.customSliderShowArrows !== false,
          customSliderShowDots: data?.customSliderShowDots !== false,
          customSliderSpeed:
            data?.customSliderSpeed != null ? Number(data.customSliderSpeed) : 500,
          ...getManageSectionInitialValues(PREFIX, data),
          ...(data && typeof data === "object" ? data : {}),
        });
      })
      .catch(() => message.error("Failed to load Custom Slider"))
      .finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock]);

  useEffect(() => {
    let ignore = false;
    setFeaturedItemsLoading(true);

    fetch("/api/portfolio?featured=1&allCategories=1", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (ignore) return;
        const rawItems = Array.isArray(data?.items)
          ? data.items.map((item) => ({
              id: toText(item?._id),
              name: toText(item?.name || item?.title) || "Untitled",
            }))
          : [];
        const items = applySavedOrder(rawItems, portfolioOrderRef.current);
        setFeaturedItems(items);
        const orderIds = items.map((item) => item.id);
        portfolioOrderRef.current = orderIds;
        form.setFieldValue("customSliderPortfolioOrder", orderIds);
      })
      .catch(() => {
        if (ignore) return;
        setFeaturedItems([]);
      })
      .finally(() => {
        if (!ignore) setFeaturedItemsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const moveFeaturedItem = (index, direction) => {
    setFeaturedItems((prev) => {
      if (!Array.isArray(prev) || prev.length <= 1) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      const orderIds = next.map((item) => item.id);
      portfolioOrderRef.current = orderIds;
      form.setFieldValue("customSliderPortfolioOrder", orderIds);
      return next;
    });
  };

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const safeValues =
          values && typeof values === "object"
            ? Object.fromEntries(
                Object.entries(values).filter(([key]) => key !== "customSliderItems"),
              )
            : {};
        const payload = {
          ...safeValues,
          mainTitle:
            safeValues?.mainTitle != null ? String(safeValues.mainTitle).trim() : "",
          subTitle:
            safeValues?.subTitle != null ? String(safeValues.subTitle).trim() : "",
          customSliderAutoplay: safeValues?.customSliderAutoplay !== false,
          customSliderAutoplaySpeed:
            safeValues?.customSliderAutoplaySpeed != null
              ? Math.max(1000, Number(safeValues.customSliderAutoplaySpeed))
              : 4500,
          customSliderShowArrows: safeValues?.customSliderShowArrows !== false,
          customSliderShowDots: safeValues?.customSliderShowDots !== false,
          customSliderSpeed:
            safeValues?.customSliderSpeed != null
              ? Math.max(200, Number(safeValues.customSliderSpeed))
              : 500,
          ...getManageSectionPayload(PREFIX, safeValues),
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
            if (!res.ok) {
              return res.json().then((data) => Promise.reject(data));
            }
            return null;
          })
          .then(() => {
            message.success("Custom Slider saved");
            onSuccess?.();
          })
          .catch((err) =>
            message.error(err?.error || "Failed to save Custom Slider"),
          );
      })
      .catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [form, isPageBlock]);

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
        defaultActiveKey={["section", "title", "setting", "items"]}
        items={[
          {
            key: "section",
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
            key: "title",
            label: "Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("CustomSlider")}
              />
            ),
          },
          {
            key: "setting",
            label: "Slider Settings",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <List
                  header={
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "rgba(0,0,0,0.65)",
                      }}
                    >
                      Behaviour
                    </span>
                  }
                  size="small"
                  bordered
                  split
                  dataSource={[
                    {
                      key: "autoplay",
                      name: "customSliderAutoplay",
                      label: "Autoplay",
                      tooltip: "Scroll to next set automatically",
                    },
                    {
                      key: "arrows",
                      name: "customSliderShowArrows",
                      label: "Show arrows",
                      tooltip: "Show previous and next arrows",
                    },
                    {
                      key: "dots",
                      name: "customSliderShowDots",
                      label: "Show dots",
                      tooltip: "Show pagination dots below slider",
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item
                          key="switch"
                          name={item.name}
                          valuePropName="checked"
                          noStyle
                        >
                          <Switch />
                        </Form.Item>,
                      ]}
                    >
                      <Tooltip title={item.tooltip}>
                        <span
                          style={{
                            fontSize: 14,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "rgba(0,0,0,0.65)",
                          }}
                        >
                          {item.label}
                          <QuestionCircleOutlined
                            style={{ fontSize: 12, color: "#999" }}
                          />
                        </span>
                      </Tooltip>
                    </List.Item>
                  )}
                />
                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="customSliderAutoplaySpeed"
                      label="Autoplay delay (ms)"
                    >
                      <InputNumber min={1000} max={30000} step={500} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="customSliderSpeed" label="Transition speed (ms)">
                      <InputNumber min={200} max={3000} step={100} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: "items",
            label: "Manage Items",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Alert
                  type="info"
                  showIcon
                  message="Items are auto-managed"
                  description="This slider pulls from featured Portfolio items. You can only reorder the fetched items here."
                />
                {featuredItemsLoading ? (
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <Spin size="small" />
                  </div>
                ) : featuredItems.length > 0 ? (
                  <List
                    size="small"
                    bordered
                    dataSource={featuredItems}
                    rowKey={(item) => item.id || item.name}
                    renderItem={(item, index) => (
                      <List.Item
                        actions={[
                          <Button
                            key="up"
                            type="text"
                            size="small"
                            icon={<UpOutlined />}
                            onClick={() => moveFeaturedItem(index, "up")}
                            disabled={index === 0}
                            aria-label={`Move ${item.name} up`}
                          />,
                          <Button
                            key="down"
                            type="text"
                            size="small"
                            icon={<DownOutlined />}
                            onClick={() => moveFeaturedItem(index, "down")}
                            disabled={index === featuredItems.length - 1}
                            aria-label={`Move ${item.name} down`}
                          />,
                        ]}
                      >
                        {`${index + 1}. ${item.name}`}
                      </List.Item>
                    )}
                  />
                ) : (
                  <Alert
                    type="warning"
                    showIcon
                    message="No featured portfolio items found"
                    description='Enable "Feature" on Portfolio entries to show them in this slider.'
                  />
                )}
              </div>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(CustomSliderEditForm);
