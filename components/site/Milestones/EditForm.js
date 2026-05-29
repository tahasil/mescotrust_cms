"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, message, Spin, Collapse } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Milestones";
const PREFIX = "milestones";
const CARD_COUNT = 6;
const IMAGE_ENABLED_CARD_INDEXES = new Set([3, 5]); // Card 4 and Card 6

const DEFAULT_ITEMS = [
  {
    number: "80+",
    title: "Alliances",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
  {
    number: "65",
    title: "Initiatives",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
  {
    number: "4500+",
    title: "Applications so far",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
  {
    number: "Rs 700 CR+",
    title: "Community Reach",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
  {
    number: "190+",
    title: "Cities Reached",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
  {
    number: "25000+",
    title: "Professionals in TSUV ecosystem",
    description: "",
    iconUrl: "",
    imageUrl: "",
  },
];

function toText(value) {
  return value != null ? String(value).trim() : "";
}

function normalizeDimensionValue(value, min = 8, max = 240) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < min) return min;
  if (n > max) return max;
  return Math.round(n);
}

function normalizeItem(item = {}, index = 0) {
  const fallback = DEFAULT_ITEMS[index] || DEFAULT_ITEMS[DEFAULT_ITEMS.length - 1];
  const numberFromLegacy = `${toText(item?.counterPrefix)}${toText(item?.counterValue)}${toText(item?.counterSuffix)}`;
  const imageEnabled = IMAGE_ENABLED_CARD_INDEXES.has(index);
  return {
    number:
      toText(item?.number) ||
      toText(numberFromLegacy) ||
      fallback.number,
    title:
      toText(item?.title) ||
      toText(item?.label) ||
      fallback.title,
    description: toText(item?.description) || fallback.description,
    iconUrl: toText(item?.iconUrl) || fallback.iconUrl,
    iconWidth: normalizeDimensionValue(item?.iconWidth),
    iconHeight: normalizeDimensionValue(item?.iconHeight),
    imageUrl:
      imageEnabled
        ? toText(item?.imageUrl) ||
          toText(item?.decorImageDesktop) ||
          toText(item?.decorImage) ||
          fallback.imageUrl
        : "",
  };
}

function normalizeItems(items) {
  const source = Array.isArray(items) ? items : [];
  return Array.from({ length: CARD_COUNT }, (_, index) =>
    normalizeItem(source[index], index),
  );
}

function sanitizeItemsForSave(items) {
  return normalizeItems(items).map((item, index) => {
    const imageEnabled = IMAGE_ENABLED_CARD_INDEXES.has(index);
    return {
      number: toText(item.number),
      title: toText(item.title),
      description: toText(item.description),
      iconUrl: toText(item.iconUrl),
      iconWidth: normalizeDimensionValue(item.iconWidth),
      iconHeight: normalizeDimensionValue(item.iconHeight),
      imageUrl: imageEnabled ? toText(item.imageUrl) : "",
    };
  });
}

function MilestonesEditForm(
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
  const [, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(
    themeColorOptionsProp,
  );
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
            ...custom.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    const applyData = (rawData) => {
      const data = rawData && typeof rawData === "object" ? rawData : {};
      form.setFieldsValue({
        ...data,
        mainTitle: toText(data.mainTitle) || "Our Milestones",
        subTitle: toText(data.subTitle),
        titleAlign: toText(data.titleAlign) || "center",
        titleColorKey: toText(data.titleColorKey),
        milestonesSubTitleColorKey: toText(data.milestonesSubTitleColorKey),
        milestonesCardBgColorKey: toText(data.milestonesCardBgColorKey),
        milestonesItems: normalizeItems(data.milestonesItems),
        ...getManageSectionInitialValues(PREFIX, data),
      });
    };

    setLoading(true);
    if (isPageBlock) {
      applyData(initialDataProp ?? {});
      setLoading(false);
      return;
    }

    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => applyData(data))
      .catch(() => message.error("Failed to load Milestones"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const payload = {
          ...values,
          milestonesItems: sanitizeItemsForSave(values?.milestonesItems),
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
            message.success("Milestones saved");
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

  const cardItems = Array.from({ length: CARD_COUNT }, (_, index) => ({
    key: `card-${index + 1}`,
    label: `Card ${index + 1}`,
    children: (
      <div style={{ display: "grid", gap: 12 }}>
        <Form.Item
          name={["milestonesItems", index, "number"]}
          label="Number"
          rules={[{ required: true, message: "Number is required" }]}
        >
          <Input placeholder="e.g. 80+" />
        </Form.Item>

        <Form.Item
          name={["milestonesItems", index, "title"]}
          label="Title"
          rules={[{ required: true, message: "Title is required" }]}
        >
          <Input placeholder="e.g. Alliances" />
        </Form.Item>

        <Form.Item name={["milestonesItems", index, "iconUrl"]} label="Icon">
          <MediaPickerInput
            placeholder="Select icon from media library"
            uiVariant="stacked"
            showVariants={false}
            hintText="Optional icon"
          />
        </Form.Item>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <Form.Item
            name={["milestonesItems", index, "iconWidth"]}
            label="Icon width (px)"
            extra="Optional. Leave blank to use default."
          >
            <Input type="number" min={8} max={240} />
          </Form.Item>
          <Form.Item
            name={["milestonesItems", index, "iconHeight"]}
            label="Icon height (px)"
            extra="Optional. Leave blank to use default."
          >
            <Input type="number" min={8} max={240} />
          </Form.Item>
        </div>

        {IMAGE_ENABLED_CARD_INDEXES.has(index) ? (
          <Form.Item
            name={["milestonesItems", index, "imageUrl"]}
            label="Image"
          >
            <MediaPickerInput
              placeholder="Select decorative image from media library"
              uiVariant="stacked"
              showVariants={false}
              hintText="Optional decorative image"
            />
          </Form.Item>
        ) : null}
      </div>
    ),
  }));

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage-section", "title-colors", "content"]}
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
                {...getTitleAndColorsConfig("Milestones")}
              />
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Collapse
                defaultActiveKey={["card-1"]}
                items={cardItems}
              />
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(MilestonesEditForm);

