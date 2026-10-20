"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Col, Collapse, Form, Input, Row, Select, Spin, Switch, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

/**
 * Edit form for TimelineTrack — used in the component edit drawer.
 * Everything is managed here: heading, layout/style, and the repeatable
 * timeline items (add / edit / delete / reorder) with validation.
 */

const API_PATH = "/api/theme/TimelineTrack";
const PREFIX = "timelineTrack";
const ITEM_NAME = "timelineTrackItems";
const DESCRIPTION_MAX_LENGTH = 600;

const LAYOUT_OPTIONS = [
  { label: "Alternating (left / right)", value: "alternating" },
  { label: "Single side", value: "single" },
];

const CARD_STYLE_OPTIONS = [
  { label: "Card", value: "card" },
  { label: "Plain", value: "plain" },
];

function clean(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeItem(item) {
  return {
    date: clean(item?.date),
    title: clean(item?.title),
    badge: clean(item?.badge),
    description: clean(item?.description),
    image: clean(item?.image),
    imageAlt: clean(item?.imageAlt),
    linkText: clean(item?.linkText),
    linkUrl: clean(item?.linkUrl),
  };
}

/** Accept absolute http(s) URLs, site paths (/about), anchors (#x) and mailto/tel. */
function validateLinkUrl(_, value) {
  const url = clean(value);
  if (!url) return Promise.resolve();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return Promise.resolve();
  if (/^[#/.]/.test(url)) return Promise.resolve();
  return Promise.reject(
    new Error("Enter a full URL (https://…), or a site path starting with /"),
  );
}

function TimelineTrackEditForm(
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
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  const watchedItems = Form.useWatch(ITEM_NAME, form);

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  function applyThemeColorOptions(theme) {
    const palette = theme?.themePalette || {};
    const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
    const names = [
      ...new Set([
        ...Object.keys(palette),
        ...customColors.map((c) => c?.name).filter(Boolean),
      ]),
    ].sort();
    setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
  }

  function applyFormValues(data) {
    const rawItems = data?.[ITEM_NAME];
    const items =
      Array.isArray(rawItems) && rawItems.length > 0
        ? rawItems.map(normalizeItem)
        : [normalizeItem({})];

    form.setFieldsValue({
      ...getTitleAndColorsValues(data),
      timelineTrackLayout: clean(data?.timelineTrackLayout) || "alternating",
      timelineTrackCardStyle: clean(data?.timelineTrackCardStyle) || "card",
      timelineTrackShowConnector: data?.timelineTrackShowConnector !== false,
      [ITEM_NAME]: items,
      ...getManageSectionInitialValues(PREFIX, data),
    });
  }

  function getTitleAndColorsValues(data) {
    return {
      timelineTrackSubTitle:
        data?.timelineTrackSubTitle != null
          ? clean(data.timelineTrackSubTitle)
          : "Our Journey",
      timelineTrackHeading:
        data?.timelineTrackHeading != null
          ? clean(data.timelineTrackHeading)
          : "Milestones that *shaped* us.",
      timelineTrackIntro:
        data?.timelineTrackIntro != null ? clean(data.timelineTrackIntro) : "",
      timelineTrackTitleAlign:
        clean(data?.timelineTrackTitleAlign) || "center",
      timelineTrackSubTitleColorKey: clean(data?.timelineTrackSubTitleColorKey),
      timelineTrackHeadingColorKey: clean(data?.timelineTrackHeadingColorKey),
      timelineTrackIntroColorKey: clean(data?.timelineTrackIntroColorKey),
      timelineTrackDateColorKey: clean(data?.timelineTrackDateColorKey),
      timelineTrackBadgeColorKey: clean(data?.timelineTrackBadgeColorKey),
      timelineTrackItemTitleColorKey: clean(data?.timelineTrackItemTitleColorKey),
      timelineTrackTextColorKey: clean(data?.timelineTrackTextColorKey),
      timelineTrackLinkColorKey: clean(data?.timelineTrackLinkColorKey),
      titleHighlightColorKey: clean(data?.titleHighlightColorKey),
    };
  }

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyFormValues(initialDataProp ?? {});
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then(applyThemeColorOptions)
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
        applyThemeColorOptions(theme);
        applyFormValues(data);
      })
      .catch(() => message.error("Failed to load Timeline Track"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const rawItems = values[ITEM_NAME] ?? [];
        const items = (Array.isArray(rawItems) ? rawItems : []).map(normalizeItem);
        const payload = {
          ...getTitleAndColorsValues(values),
          timelineTrackLayout:
            values.timelineTrackLayout === "single" ? "single" : "alternating",
          timelineTrackCardStyle:
            values.timelineTrackCardStyle === "plain" ? "plain" : "card",
          timelineTrackShowConnector: values.timelineTrackShowConnector !== false,
          [ITEM_NAME]: items,
          ...getManageSectionPayload(PREFIX, values),
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
            message.success("Timeline Track saved");
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
              <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />
            ),
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("TimelineTrack")}
              />
            ),
          },
          {
            key: "layout",
            label: "Layout & Style",
            children: (
              <Row gutter={[16, 0]}>
                <Col span={24} xs={24} md={12}>
                  <Form.Item
                    name="timelineTrackLayout"
                    label="Timeline layout"
                    tooltip="Alternating places entries on both sides of the rail; single side keeps every entry on the left."
                  >
                    <Select size="large" options={LAYOUT_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col span={24} xs={24} md={12}>
                  <Form.Item
                    name="timelineTrackCardStyle"
                    label="Entry style"
                    tooltip="Card adds a surface and shadow; plain keeps the text on the section background."
                  >
                    <Select size="large" options={CARD_STYLE_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="timelineTrackShowConnector"
                    label="Show connector line"
                    valuePropName="checked"
                    tooltip="Hide the vertical rail line between the timeline dots."
                  >
                    <Switch checkedChildren="On" unCheckedChildren="Off" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "items",
            label: "Timeline Items",
            children: (
              <Form.List name={ITEM_NAME}>
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Entry"
                    addButtonText="Add timeline entry"
                    defaultAddPayload={normalizeItem({})}
                    resolveItemTitle={(name) => {
                      const item = watchedItems?.[name];
                      const label = clean(item?.title) || clean(item?.date);
                      return label ? `${name + 1}. ${label}` : `Entry ${name + 1}`;
                    }}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[16, 0]}>
                        <Col span={24} xs={24} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "date"]}
                            label="Date / Year"
                            rules={[{ required: true, message: "Date or year is required" }]}
                          >
                            <Input placeholder="e.g. January 2019" size="large" maxLength={60} />
                          </Form.Item>
                        </Col>
                        <Col span={24} xs={24} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "title"]}
                            label="Title"
                            rules={[{ required: true, message: "Title is required" }]}
                          >
                            <Input placeholder="e.g. Journey Start" size="large" maxLength={120} />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "badge"]}
                            label="Badge / Location"
                            extra="Optional label shown next to the title (for example a city or category)."
                          >
                            <Input placeholder="e.g. Delhi" size="large" maxLength={60} />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "description"]}
                            label="Description"
                            rules={[
                              {
                                max: DESCRIPTION_MAX_LENGTH,
                                message: `Keep the description under ${DESCRIPTION_MAX_LENGTH} characters`,
                              },
                            ]}
                          >
                            <Input.TextArea
                              rows={4}
                              placeholder="Describe this milestone..."
                              size="large"
                              showCount
                              maxLength={DESCRIPTION_MAX_LENGTH}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "image"]}
                            label="Image"
                            extra="Optional. Shown at the top of the entry card."
                          >
                            <MediaPickerInput uiVariant="stacked" />
                          </Form.Item>
                        </Col>
                        <Col span={24} xs={24} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "imageAlt"]}
                            label="Image alt text"
                            rules={[
                              ({ getFieldValue }) => ({
                                validator: (_, value) => {
                                  const hasImage = !!clean(getFieldValue([ITEM_NAME, name, "image"]));
                                  const hasAlt = !!clean(value);
                                  if (hasImage && !hasAlt) {
                                    return Promise.reject(
                                      new Error("Alt text is required when an image is selected"),
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              }),
                            ]}
                          >
                            <Input placeholder="Describe the image" size="large" maxLength={140} />
                          </Form.Item>
                        </Col>
                        <Col span={24} xs={24} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "linkText"]}
                            label="Link text"
                            extra="Optional. Add a link URL to show the call to action."
                          >
                            <Input placeholder="e.g. Visit" size="large" maxLength={40} />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "linkUrl"]}
                            label="Link URL"
                            rules={[{ validator: validateLinkUrl }]}
                          >
                            <Input placeholder="https://… or /about" size="large" />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  />
                )}
              </Form.List>
            ),
          },
        ]}
      />
      {saving ? (
        <div style={{ textAlign: "center", paddingTop: 12 }}>
          <Spin size="small" />
        </div>
      ) : null}
    </Form>
  );
}

export default forwardRef(TimelineTrackEditForm);
