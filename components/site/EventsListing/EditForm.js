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
  Select,
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
  { name: "eventsListingControlBgColorKey", label: "Control background", tooltip: "Search input and sort background" },
  { name: "eventsListingControlTextColorKey", label: "Control text", tooltip: "Search and sort text" },
  { name: "eventsListingButtonBgColorKey", label: "Button background", tooltip: "Buttons and active filter background" },
  { name: "eventsListingButtonTextColorKey", label: "Button text", tooltip: "Default button text" },
  { name: "eventsListingButtonHoverBgColorKey", label: "Button hover background", tooltip: "Button hover background" },
  { name: "eventsListingButtonHoverTextColorKey", label: "Button hover text", tooltip: "Button hover text" },
];

const DEFAULT_VALUES = {
  eventsListingSearchLabel: "Search events",
  eventsListingSearchPlaceholder: "Search by title or keyword...",
  eventsListingSortLabel: "Sort events",
  eventsListingAllLabel: "All",
  eventsListingUpcomingFilterLabel: "Upcoming",
  eventsListingPastFilterLabel: "Past",
  eventsListingUpcomingEyebrow: "Upcoming Events",
  eventsListingUpcomingTitle: "Coming up next.",
  eventsListingRecentTitle: "Recently Updated",
  eventsListingPastEyebrow: "Past Events",
  eventsListingPastTitle: "Recently *celebrated.*",
  eventsListingButtonLabel: "View Details",
  eventsListingEmptyLabel: "No events found.",
  eventsListingPreviousLabel: "Previous",
  eventsListingNextLabel: "Next",
  eventsListingUpdatedLabel: "Updated",
  eventsListingShowSearch: true,
  eventsListingShowFilters: true,
  eventsListingShowRecentlyUpdated: true,
  eventsListingShowPast: true,
  eventsListingShowDescriptions: true,
  eventsListingDefaultSort: "upcoming",
  eventsListingActivePageSize: 7,
  eventsListingPastPageSize: 6,
  eventsListingActiveColumns: 2,
  eventsListingPastColumns: 3,
  eventsListingCardGap: 22,
  eventsListingCardRadius: 18,
  eventsListingTextColorKey: "Black",
  eventsListingMutedTextColorKey: "Black Light",
  eventsListingAccentColorKey: "Primary",
  eventsListingCardBgColorKey: "White",
  eventsListingSurfaceColorKey: "Surface",
  eventsListingBorderColorKey: "Border",
  eventsListingControlBgColorKey: "White",
  eventsListingControlTextColorKey: "Black",
  eventsListingButtonBgColorKey: "Black",
  eventsListingButtonTextColorKey: "White",
  eventsListingButtonHoverBgColorKey: "Primary",
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
      eventsListingShowRecentlyUpdated: data.eventsListingShowRecentlyUpdated !== false,
      eventsListingShowPast: data.eventsListingShowPast !== false,
      eventsListingShowDescriptions: data.eventsListingShowDescriptions !== false,
      eventsListingDefaultSort: data.eventsListingDefaultSort === "recent" ? "recent" : "upcoming",
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
        eventsListingActivePageSize: Math.max(1, Number(values.eventsListingActivePageSize) || 7),
        eventsListingPastPageSize: Math.max(1, Number(values.eventsListingPastPageSize) || 6),
        eventsListingActiveColumns: Math.max(1, Number(values.eventsListingActiveColumns) || 2),
        eventsListingPastColumns: Math.max(1, Number(values.eventsListingPastColumns) || 3),
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
                  {textField("eventsListingSortLabel", "Sort label")}
                  {textField("eventsListingAllLabel", "All filter label")}
                  {textField("eventsListingUpcomingFilterLabel", "Upcoming filter label")}
                  {textField("eventsListingPastFilterLabel", "Past filter label")}
                </Card>
                <Card size="small" title="Section titles">
                  {textField("eventsListingUpcomingEyebrow", "Upcoming eyebrow")}
                  {textField("eventsListingUpcomingTitle", "Upcoming title")}
                  {textField("eventsListingRecentTitle", "Recently updated title")}
                  {textField("eventsListingPastEyebrow", "Past eyebrow")}
                  {textField("eventsListingPastTitle", "Past title")}
                  <div style={{ marginTop: -12, marginBottom: 16, color: "rgba(0,0,0,0.45)", fontSize: 12 }}>
                    Wrap one title segment in *asterisks* to use the accent color.
                  </div>
                </Card>
                <Card size="small" title="Buttons & messages">
                  {textField("eventsListingButtonLabel", "Card button label")}
                  {textField("eventsListingEmptyLabel", "Empty state")}
                  {textField("eventsListingPreviousLabel", "Previous button")}
                  {textField("eventsListingNextLabel", "Next button")}
                  {textField("eventsListingUpdatedLabel", "Updated prefix")}
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
                  { name: "eventsListingShowFilters", label: "Show filters", tooltip: "Display All, Upcoming and Past filters" },
                  { name: "eventsListingShowRecentlyUpdated", label: "Show event highlights", tooltip: "Display Upcoming and Recently Updated side lists" },
                  { name: "eventsListingShowPast", label: "Show past events", tooltip: "Display the Past Events section" },
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
                <Form.Item name="eventsListingDefaultSort" label="Default order">
                  <Select options={[
                    { value: "upcoming", label: "Soonest first" },
                    { value: "recent", label: "Recently updated" },
                  ]} />
                </Form.Item>
                <Form.Item name="eventsListingActivePageSize" label="Upcoming events per page">
                  <InputNumber min={1} max={18} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="eventsListingPastPageSize" label="Past events per page">
                  <InputNumber min={1} max={18} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="eventsListingActiveColumns" label="Upcoming columns (desktop)">
                  <InputNumber min={1} max={3} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="eventsListingPastColumns" label="Past columns (desktop)">
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
