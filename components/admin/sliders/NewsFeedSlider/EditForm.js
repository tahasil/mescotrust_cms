"use client";

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Collapse,
  Select,
  Switch,
  List,
  Tooltip,
  message,
  Spin,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import { ensureMailto, normalizeLinkTarget } from "@/lib/linkUtils";

const API_PATH = "/api/theme/NewsFeedSlider";
const PREFIX = "newsFeedSlider";

const COLOR_KEYS = [
  "newsFeedSliderItemTitleColorKey",
  "newsFeedSliderItemDescColorKey",
  "newsFeedSliderDateColorKey",
  "newsFeedSliderSourceBgColorKey",
  "newsFeedSliderSourceTextColorKey",
  "newsFeedSliderArrowButtonColorKey",
  "newsFeedSliderArrowButtonBgColorKey",
];

const LINK_TARGET_OPTIONS = [
  { label: "Same tab (_self)", value: "_self" },
  { label: "New tab (_blank)", value: "_blank" },
];

const COMPACT_ITEM_STYLE = { marginBottom: 12 };

function toText(value) {
  return value == null ? "" : String(value).trim();
}

function toDayjsValue(value) {
  if (value == null || value === "") return null;
  if (dayjs.isDayjs(value)) return value.isValid() ? value : null;
  const parsed = dayjs(String(value));
  return parsed.isValid() ? parsed : null;
}

function toDateString(value) {
  if (value == null || value === "") return "";
  if (dayjs.isDayjs(value)) {
    return value.isValid() ? value.format("DD MMM, YYYY") : "";
  }
  const raw = toText(value);
  if (!raw) return "";
  const parsed = dayjs(raw);
  return parsed.isValid() ? parsed.format("DD MMM, YYYY") : raw;
}

function normalizeItem(item) {
  const sourceTarget = normalizeLinkTarget(
    item?.sourceTarget ?? item?.openInNewTab,
    "_self",
  );
  return {
    image: toText(item?.image),
    title: toText(item?.title),
    excerpt: toText(item?.excerpt),
    date: toDateString(item?.date),
    source: toText(item?.source),
    sourceUrl: ensureMailto(item?.sourceUrl || ""),
    articleUrl: toText(item?.articleUrl),
    sourceTarget,
    openInNewTab: sourceTarget === "_blank",
  };
}

function clampCards(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(4, Math.round(n)));
}

function toNonNegative(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function NewsFeedSliderEditForm(
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
  const [themeColorOptions, setThemeColorOptions] = useState(
    themeColorOptionsProp,
  );
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
    const applyFormValues = (data, theme) => {
      const items = Array.isArray(data?.newsFeedSliderItems)
        ? data.newsFeedSliderItems.map((item) => {
            const normalized = normalizeItem(item);
            return {
              ...normalized,
              date: toDayjsValue(normalized.date),
            };
          })
        : [];

      const nextValues = {
        ...getManageSectionInitialValues(PREFIX, data),
        newsFeedSliderCardsDesktop: clampCards(
          data?.newsFeedSliderCardsDesktop,
          3,
        ),
        newsFeedSliderCardsTablet: clampCards(
          data?.newsFeedSliderCardsTablet,
          2,
        ),
        newsFeedSliderCardsMobile: clampCards(
          data?.newsFeedSliderCardsMobile,
          1,
        ),
        newsFeedSliderCardGap: toNonNegative(data?.newsFeedSliderCardGap, 20),
        newsFeedSliderArrowSize: toNonNegative(data?.newsFeedSliderArrowSize, 70),
        newsFeedSliderShowArrows: data?.newsFeedSliderShowArrows !== false,
        newsFeedSliderLoop: data?.newsFeedSliderLoop === true,
        newsFeedSliderItems: items,
      };

      COLOR_KEYS.forEach((key) => {
        nextValues[key] = toText(data?.[key]);
      });
      nextValues.newsFeedSliderArrowButtonColorKey =
        toText(data?.newsFeedSliderArrowButtonColorKey) ||
        toText(data?.newsFeedSliderArrowNextColorKey) ||
        toText(data?.newsFeedSliderArrowPrevColorKey);
      nextValues.newsFeedSliderArrowButtonBgColorKey =
        toText(data?.newsFeedSliderArrowButtonBgColorKey) ||
        toText(data?.newsFeedSliderArrowNextBgColorKey) ||
        toText(data?.newsFeedSliderArrowPrevBgColorKey);

      form.setFieldsValue(nextValues);

      if (theme) {
        const palette = theme?.themePalette || {};
        const names = Object.keys(palette).sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      }
    };

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      applyFormValues(data);

      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => applyFormValues(data, theme))
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
      .then(([data, theme]) => applyFormValues(data, theme))
      .catch(() => message.error("Failed to load News Feed Slider"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const items = Array.isArray(values.newsFeedSliderItems)
          ? values.newsFeedSliderItems.map(normalizeItem)
          : [];

        const payload = {
          ...getManageSectionPayload(PREFIX, values),
          newsFeedSliderCardsDesktop: clampCards(
            values.newsFeedSliderCardsDesktop,
            3,
          ),
          newsFeedSliderCardsTablet: clampCards(
            values.newsFeedSliderCardsTablet,
            2,
          ),
          newsFeedSliderCardsMobile: clampCards(
            values.newsFeedSliderCardsMobile,
            1,
          ),
          newsFeedSliderCardGap: toNonNegative(values.newsFeedSliderCardGap, 20),
          newsFeedSliderArrowSize: toNonNegative(values.newsFeedSliderArrowSize, 70),
          newsFeedSliderShowArrows: values.newsFeedSliderShowArrows !== false,
          newsFeedSliderLoop: values.newsFeedSliderLoop === true,
          newsFeedSliderItems: items,
        };

        COLOR_KEYS.forEach((key) => {
          payload[key] = toText(values[key]);
        });

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
            return null;
          })
          .then(() => {
            message.success("News Feed Slider saved");
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
        defaultActiveKey={["items"]}
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
                {...getTitleAndColorsConfig("NewsFeedSlider")}
              />
            ),
          },
          {
            key: "slider-settings",
            label: "Slider Settings",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="newsFeedSliderCardsDesktop"
                      label="Cards (desktop)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} max={4} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="newsFeedSliderCardsTablet"
                      label="Cards (tablet)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} max={4} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="newsFeedSliderCardsMobile"
                      label="Cards (mobile)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} max={2} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="newsFeedSliderCardGap" label="Card gap (px)">
                      <InputNumber min={0} max={60} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="newsFeedSliderArrowSize" label="Arrow size (px)">
                      <InputNumber min={36} max={96} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

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
                      key: "showArrows",
                      name: "newsFeedSliderShowArrows",
                      label: "Show arrows",
                      tooltip: "Show next/previous navigation controls",
                    },
                    {
                      key: "loop",
                      name: "newsFeedSliderLoop",
                      label: "Loop slides",
                      tooltip: "After the last slide, continue from first slide",
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
              </div>
            ),
          },
          {
            key: "items",
            label: "Content",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Form.List name="newsFeedSliderItems">
                  {(fields, { add, remove, move }) => (
                    <SortableFormList
                      fields={fields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="News Item"
                    addButtonText="Add news item"
                    defaultAddPayload={{
                      image: "",
                      title: "",
                      excerpt: "",
                      date: null,
                      source: "",
                      sourceUrl: "",
                      sourceTarget: "_self",
                    }}
                      reorderMovedIndex={reorderMovedIndex}
                      reorderDirection={reorderDirection}
                      onMoveWithTransition={(from, to) => {
                        setReorderDirection(to < from ? "up" : "down");
                        setReorderMovedIndex(to);
                        setTimeout(() => setReorderMovedIndex(-1), 400);
                      }}
                      renderItemContent={(name, restField) => (
                        <Row gutter={[12, 12]}>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "image"]}
                            label="Image"
                            style={COMPACT_ITEM_STYLE}
                          >
                            <MediaPickerInput
                              placeholder="/uploads/news-feed-image.webp"
                              uiVariant="stacked"
                              hintText="Recommended: 340 x 200"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "title"]}
                            label="News title"
                            style={COMPACT_ITEM_STYLE}
                            rules={[
                              { required: true, message: "Title is required" },
                            ]}
                          >
                            <Input
                              placeholder="e.g. Uttarakhand Essence: My Pahadi Dukan"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "excerpt"]}
                            label="Description"
                            style={COMPACT_ITEM_STYLE}
                            rules={[
                              {
                                required: true,
                                message: "Description is required",
                              },
                            ]}
                          >
                            <Input.TextArea
                              rows={3}
                              placeholder="Short summary shown on card"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Row gutter={[12, 12]}>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...restField}
                                name={[name, "date"]}
                                label="Date"
                                style={COMPACT_ITEM_STYLE}
                                rules={[
                                  {
                                    required: true,
                                    message: "Date is required",
                                  },
                                ]}
                              >
                                <DatePicker
                                  format="DD MMM, YYYY"
                                  placeholder="Select date"
                                  size="large"
                                  style={{ width: "100%" }}
                                  allowClear
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...restField}
                                name={[name, "source"]}
                                label="Source"
                                style={COMPACT_ITEM_STYLE}
                              >
                                <Input
                                  placeholder="e.g. Indian Times Express"
                                  size="large"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Col>
                        <Col span={24}>
                          <Row gutter={[12, 12]}>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...restField}
                                name={[name, "sourceUrl"]}
                                label="Link"
                                style={COMPACT_ITEM_STYLE}
                              >
                                <Input
                                  placeholder="https://example.com"
                                  size="large"
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...restField}
                                name={[name, "sourceTarget"]}
                                label="Target"
                                style={COMPACT_ITEM_STYLE}
                              >
                                <Select
                                  size="large"
                                  options={LINK_TARGET_OPTIONS}
                                  placeholder="Target"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Col>
                        </Row>
                      )}
                    />
                  )}
                </Form.List>
              </div>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(NewsFeedSliderEditForm);
