"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Card,
  Collapse,
  Form,
  Input,
  InputNumber,
  Spin,
  message,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import {
  ColorSettingsCard,
  SwitchSettingsCard,
} from "@/components/admin/SettingsCardList";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";

const API_PATH = "/api/theme/EventsListing";
const PREFIX = "eventsListing";

const COLOR_FIELDS = [
  { name: "eventsListingTextColorKey", label: "Headings & card titles", tooltip: "Primary text color" },
  { name: "eventsListingMutedTextColorKey", label: "Body & metadata", tooltip: "Descriptions, dates, locations and counts" },
  { name: "eventsListingAccentColorKey", label: "Accent", tooltip: "Eyebrows, focus ring and hover border" },
  { name: "eventsListingCardBgColorKey", label: "Card background", tooltip: "Event card and search panel background" },
  { name: "eventsListingSurfaceColorKey", label: "Secondary surface", tooltip: "Empty states, filters and image placeholders" },
  { name: "eventsListingBorderColorKey", label: "Borders", tooltip: "Cards, controls and dividers" },
  { name: "eventsListingControlBgColorKey", label: "Control background", tooltip: "Search input background" },
  { name: "eventsListingControlTextColorKey", label: "Control text", tooltip: "Search input text" },
  { name: "eventsListingButtonBgColorKey", label: "Button background", tooltip: "Buttons and active filter background" },
  { name: "eventsListingButtonTextColorKey", label: "Button text", tooltip: "Default button text" },
  { name: "eventsListingButtonHoverBgColorKey", label: "Button hover background", tooltip: "Button hover background" },
  { name: "eventsListingButtonHoverTextColorKey", label: "Button hover text", tooltip: "Button hover text" },
];

const DEFAULT_VALUES = {
  eventsListingSearchLabel: "Search events",
  eventsListingSearchPlaceholder: "Search by title or keyword...",
  eventsListingAllLabel: "All",
  eventsListingUpcomingFilterLabel: "Live",
  eventsListingPastFilterLabel: "Past",
  eventsListingUpcomingEyebrow: "Events",
  eventsListingUpcomingTitle: "Explore our *events.*",
  eventsListingPastEyebrow: "Past Events",
  eventsListingPastTitle: "Recently *celebrated.*",
  eventsListingButtonLabel: "View Details",
  eventsListingEmptyLabel: "No events found.",
  eventsListingPreviousLabel: "Previous",
  eventsListingNextLabel: "Next",
  eventsListingShowSearch: true,
  eventsListingShowFilters: true,
  eventsListingShowDescriptions: true,
  eventsListingActivePageSize: 9,
  eventsListingActiveColumns: 4,
  eventsListingCardGap: 22,
  eventsListingCardRadius: 14,
  eventsListingTextColorKey: "Black",
  eventsListingMutedTextColorKey: "Black Light",
  eventsListingAccentColorKey: "Primary",
  eventsListingCardBgColorKey: "White",
  eventsListingSurfaceColorKey: "Surface",
  eventsListingBorderColorKey: "Border",
  eventsListingControlBgColorKey: "White",
  eventsListingControlTextColorKey: "Black",
  eventsListingButtonBgColorKey: "Primary",
  eventsListingButtonTextColorKey: "White",
  eventsListingButtonHoverBgColorKey: "Primary Dark",
  eventsListingButtonHoverTextColorKey: "White",
};

function colorOptionsFromTheme(theme) {
  const palette = theme?.themePalette || {};
  const colors = Array.isArray(theme?.colors) ? theme.colors : [];
  const names = [
    ...Object.keys(palette),
    ...colors.map((color) => color?.name).filter(Boolean),
  ];
  return [...new Set(names)]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ label: name, value: name }));
}

function EventsListingEditForm(
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
  const themeFetchedRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  const applyValues = (data = {}) => {
    form.setFieldsValue({
      ...DEFAULT_VALUES,
      ...data,
      eventsListingShowSearch: data.eventsListingShowSearch !== false,
      eventsListingShowFilters: data.eventsListingShowFilters !== false,
      eventsListingShowDescriptions: data.eventsListingShowDescriptions !== false,
      ...getManageSectionInitialValues(PREFIX, data),
    });
  };

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyValues(initialDataProp || {});
      if (!themeFetchedRef.current && !themeColorOptionsProp?.length) {
        themeFetchedRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((response) => (response.ok ? response.json() : {}))
          .then((theme) => setThemeColorOptions(colorOptionsFromTheme(theme)))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((response) =>
        response.ok ? response.json() : {},
      ),
      fetch("/api/theme", { cache: "no-store" }).then((response) =>
        response.ok ? response.json() : {},
      ),
    ])
      .then(([data, theme]) => {
        applyValues(data);
        setThemeColorOptions(colorOptionsFromTheme(theme));
      })
      .catch(() => message.error("Failed to load Events Listing settings"))
      .finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock, themeColorOptionsProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...DEFAULT_VALUES,
        ...values,
        eventsListingActivePageSize: Math.max(1, Number(values.eventsListingActivePageSize) || 9),
        eventsListingActiveColumns: Math.max(1, Number(values.eventsListingActiveColumns) || 4),
        eventsListingCardGap: Math.max(8, Number(values.eventsListingCardGap) || 22),
        eventsListingCardRadius: Math.max(0, Number(values.eventsListingCardRadius) || 0),
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
        .then(async (response) => {
          if (!response.ok) throw new Error((await response.json())?.error || "Failed to save");
        })
        .then(() => {
          message.success("Events Listing saved");
          onSuccess?.();
        })
        .catch((error) => message.error(error?.message || "Failed to save"))
        .finally(() => setSaving(false));
    });
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate, saving }));

  if (loading) return <Spin />;

  const textField = (name, label, required = true) => (
    <Form.Item
      name={name}
      label={label}
      rules={required ? [{ required: true, whitespace: true, message: `${label} is required` }] : []}
    >
      <Input />
    </Form.Item>
  );

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage-section", "content"]}
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
            key: "content",
            label: "Content",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card size="small" title="Search & filters">
                  {textField("eventsListingSearchLabel", "Search label")}
                  {textField("eventsListingSearchPlaceholder", "Search placeholder")}
                  {textField("eventsListingAllLabel", "All filter label")}
                  {textField("eventsListingUpcomingFilterLabel", "Live filter label")}
                  {textField("eventsListingPastFilterLabel", "Past filter label")}
                </Card>
                <Card size="small" title="Section titles">
                  {textField("eventsListingUpcomingEyebrow", "Sub Title")}
                  {textField("eventsListingUpcomingTitle", "Title")}
                  {textField("eventsListingPastEyebrow", "Past Sub Title")}
                  {textField("eventsListingPastTitle", "Past Title")}
                  <div style={{ marginTop: -12, marginBottom: 16, color: "rgba(0,0,0,0.45)", fontSize: 12 }}>
                    Wrap one title segment in *asterisks* to use the accent color.
                  </div>
                </Card>
                <Card size="small" title="Buttons & messages">
                  {textField("eventsListingButtonLabel", "Card button label")}
                  {textField("eventsListingEmptyLabel", "Empty state")}
                  {textField("eventsListingPreviousLabel", "Previous button")}
                  {textField("eventsListingNextLabel", "Next button")}
                </Card>
              </div>
            ),
          },
          {
            key: "display",
            label: "Display Options",
            children: (
              <SwitchSettingsCard
                items={[
                  { name: "eventsListingShowSearch", label: "Show search", tooltip: "Display the event search field" },
                  { name: "eventsListingShowFilters", label: "Show filters", tooltip: "Display All, Live and Past filters" },
                  { name: "eventsListingShowDescriptions", label: "Show descriptions", tooltip: "Display event excerpts on cards" },
                ]}
              />
            ),
          },
          {
            key: "colors",
            label: "Colors",
            children: (
              <ColorSettingsCard items={COLOR_FIELDS} options={themeColorOptions} />
            ),
          },
          {
            key: "layout",
            label: "Layout",
            children: (
              <Card size="small" title="Cards & pagination">
                <Form.Item name="eventsListingActivePageSize" label="Events per page">
                  <InputNumber min={1} max={24} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="eventsListingActiveColumns" label="Columns (desktop)">
                  <InputNumber min={1} max={4} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="eventsListingCardGap" label="Card gap (px)">
                  <InputNumber min={8} max={64} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="eventsListingCardRadius" label="Card radius (px)" style={{ marginBottom: 0 }}>
                  <InputNumber min={0} max={40} style={{ width: "100%" }} />
                </Form.Item>
              </Card>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(EventsListingEditForm);
