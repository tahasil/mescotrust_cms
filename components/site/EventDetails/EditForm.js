"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Card, Collapse, Form, Input, InputNumber, Spin, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import {
  ColorSettingsCard,
  SwitchSettingsCard,
} from "@/components/admin/SettingsCardList";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";

const API_PATH = "/api/theme/EventDetails";
const PREFIX = "eventDetails";

const DEFAULT_VALUES = {
  eventDetailsHomeLabel: "Home",
  eventDetailsEventsLabel: "Events",
  eventDetailsInformationTitle: "Event Information",
  eventDetailsDateLabel: "Date",
  eventDetailsTimeLabel: "Time",
  eventDetailsModeLabel: "Mode",
  eventDetailsVenueLabel: "Venue",
  eventDetailsDescriptionTitle: "About this event",
  eventDetailsGalleryTitle: "Event Gallery",
  eventDetailsDownloadsTitle: "Downloads",
  eventDetailsRegistrationButtonLabel: "Register for this event",
  eventDetailsShareLabel: "Share",
  eventDetailsRelatedTitle: "Related Events",
  eventDetailsAllEventsLabel: "All events",
  eventDetailsUnavailableLabel: "To be announced",
  eventDetailsNoDescriptionLabel: "Description will be updated soon.",
  eventDetailsShowBreadcrumb: true,
  eventDetailsShowImage: true,
  eventDetailsShowInformation: true,
  eventDetailsShowDescription: true,
  eventDetailsShowRegistration: true,
  eventDetailsShowShare: true,
  eventDetailsShowTags: true,
  eventDetailsShowGallery: true,
  eventDetailsShowAttachments: true,
  eventDetailsShowRelated: true,
  eventDetailsRelatedLimit: 4,
  eventDetailsCardRadius: 18,
  eventDetailsTextColorKey: "Black",
  eventDetailsMutedTextColorKey: "Black Light",
  eventDetailsAccentColorKey: "Primary",
  eventDetailsCardBgColorKey: "White",
  eventDetailsSurfaceColorKey: "Surface",
  eventDetailsBorderColorKey: "Border",
  eventDetailsButtonBgColorKey: "Black",
  eventDetailsButtonTextColorKey: "White",
  eventDetailsButtonHoverBgColorKey: "Primary",
  eventDetailsButtonHoverTextColorKey: "White",
};

const COLOR_FIELDS = [
  { name: "eventDetailsTextColorKey", label: "Headings & titles", tooltip: "Primary event text" },
  { name: "eventDetailsMutedTextColorKey", label: "Body & metadata", tooltip: "Description and supporting text" },
  { name: "eventDetailsAccentColorKey", label: "Accent", tooltip: "Links, section labels and hover states" },
  { name: "eventDetailsCardBgColorKey", label: "Card background", tooltip: "Information and related-event cards" },
  { name: "eventDetailsSurfaceColorKey", label: "Secondary surface", tooltip: "Tags, loading state and image placeholders" },
  { name: "eventDetailsBorderColorKey", label: "Borders", tooltip: "Cards, metadata pills and dividers" },
  { name: "eventDetailsButtonBgColorKey", label: "Button background", tooltip: "Registration button background" },
  { name: "eventDetailsButtonTextColorKey", label: "Button text", tooltip: "Registration button text" },
  { name: "eventDetailsButtonHoverBgColorKey", label: "Button hover background", tooltip: "Registration button hover background" },
  { name: "eventDetailsButtonHoverTextColorKey", label: "Button hover text", tooltip: "Registration button hover text" },
];

function colorOptionsFromTheme(theme) {
  const palette = theme?.themePalette || {};
  const colors = Array.isArray(theme?.colors) ? theme.colors : [];
  return [...new Set([
    ...Object.keys(palette),
    ...colors.map((color) => color?.name).filter(Boolean),
  ])]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ label: name, value: name }));
}

function EventDetailsEditForm(
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
      ...Object.fromEntries(
        [
          "Breadcrumb",
          "Image",
          "Information",
          "Description",
          "Registration",
          "Share",
          "Tags",
          "Gallery",
          "Attachments",
          "Related",
        ].map((key) => [
          `eventDetailsShow${key}`,
          data[`eventDetailsShow${key}`] !== false,
        ]),
      ),
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
          .then((response) => response.ok ? response.json() : {})
          .then((theme) => setThemeColorOptions(colorOptionsFromTheme(theme)))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((response) => response.ok ? response.json() : {}),
      fetch("/api/theme", { cache: "no-store" }).then((response) => response.ok ? response.json() : {}),
    ])
      .then(([data, theme]) => {
        applyValues(data);
        setThemeColorOptions(colorOptionsFromTheme(theme));
      })
      .catch(() => message.error("Failed to load Event Details settings"))
      .finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock, themeColorOptionsProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...DEFAULT_VALUES,
        ...values,
        eventDetailsRelatedLimit: Math.max(1, Number(values.eventDetailsRelatedLimit) || 4),
        eventDetailsCardRadius: Math.max(0, Number(values.eventDetailsCardRadius) || 0),
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
          message.success("Event Details saved");
          onSuccess?.();
        })
        .catch((error) => message.error(error?.message || "Failed to save"))
        .finally(() => setSaving(false));
    });
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate, saving }));

  if (loading) return <Spin />;

  const input = (name, label) => (
    <Form.Item
      name={name}
      label={label}
      rules={[{ required: true, whitespace: true, message: `${label} is required` }]}
    >
      <Input />
    </Form.Item>
  );

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage-section", "labels"]}
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
            key: "labels",
            label: "Labels",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card size="small" title="Navigation & sections">
                  {input("eventDetailsHomeLabel", "Home breadcrumb")}
                  {input("eventDetailsEventsLabel", "Events breadcrumb")}
                  {input("eventDetailsInformationTitle", "Information title")}
                  {input("eventDetailsDescriptionTitle", "Description title")}
                  {input("eventDetailsGalleryTitle", "Gallery title")}
                  {input("eventDetailsDownloadsTitle", "Downloads title")}
                  {input("eventDetailsRelatedTitle", "Related events title")}
                  {input("eventDetailsAllEventsLabel", "Back link")}
                </Card>
                <Card size="small" title="Event information">
                  {input("eventDetailsDateLabel", "Date label")}
                  {input("eventDetailsTimeLabel", "Time label")}
                  {input("eventDetailsModeLabel", "Mode label")}
                  {input("eventDetailsVenueLabel", "Venue label")}
                  {input("eventDetailsUnavailableLabel", "Unavailable value")}
                </Card>
                <Card size="small" title="Actions & messages">
                  {input("eventDetailsRegistrationButtonLabel", "Registration button")}
                  {input("eventDetailsShareLabel", "Share button")}
                  {input("eventDetailsNoDescriptionLabel", "Missing description")}
                </Card>
              </div>
            ),
          },
          {
            key: "visibility",
            label: "Visibility",
            children: (
              <SwitchSettingsCard items={[
                { name: "eventDetailsShowBreadcrumb", label: "Show breadcrumb", tooltip: "Display the dynamic event breadcrumb" },
                { name: "eventDetailsShowImage", label: "Show featured image", tooltip: "Display the event image" },
                { name: "eventDetailsShowInformation", label: "Show information card", tooltip: "Display date, time, mode and venue" },
                { name: "eventDetailsShowDescription", label: "Show description", tooltip: "Display event content from the Events module" },
                { name: "eventDetailsShowRegistration", label: "Show registration", tooltip: "Display registration status and button when available" },
                { name: "eventDetailsShowShare", label: "Show share button", tooltip: "Display social share actions" },
                { name: "eventDetailsShowTags", label: "Show tags", tooltip: "Display event tags" },
                { name: "eventDetailsShowGallery", label: "Show gallery", tooltip: "Display gallery data when available on an event" },
                { name: "eventDetailsShowAttachments", label: "Show downloads", tooltip: "Display attachment data when available on an event" },
                { name: "eventDetailsShowRelated", label: "Show related events", tooltip: "Display other published events" },
              ]} />
            ),
          },
          {
            key: "colors",
            label: "Colors",
            children: <ColorSettingsCard items={COLOR_FIELDS} options={themeColorOptions} />,
          },
          {
            key: "layout",
            label: "Layout",
            children: (
              <Card size="small" title="Cards">
                <Form.Item name="eventDetailsRelatedLimit" label="Related events limit">
                  <InputNumber min={1} max={8} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="eventDetailsCardRadius" label="Card radius (px)" style={{ marginBottom: 0 }}>
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

export default forwardRef(EventDetailsEditForm);
