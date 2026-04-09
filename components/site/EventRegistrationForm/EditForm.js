"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, Switch, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";

const COMPONENT_ID = "EventRegistrationForm";
const PREFIX = "eventRegistrationForm";
const API_PATH = `/api/theme/${COMPONENT_ID}`;

/** Title & Colors panel config — overrides the default getTitleAndColorsConfig
 *  so the form-specific colour pickers live alongside the Title color, in the
 *  same canonical "Colors" list every other component uses. */
const TITLE_LIST_ITEMS = [
  {
    key: "mainTitle",
    type: "input",
    name: "mainTitle",
    label: "Main title",
    tooltip: "The main heading shown above the form card.",
    placeholder: "Event Registration",
  },
  {
    key: "subTitle",
    type: "input",
    name: "subTitle",
    label: "Subtitle",
    tooltip: "Optional small line shown above the main title.",
    placeholder: "Subtitle",
  },
];

const COLOR_LIST_ITEMS = [
  { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title." },
  {
    name: "eventRegistrationFormSubTitleColorKey",
    label: "Subtitle color",
    tooltip: "Theme color for the subtitle line.",
  },
  {
    name: "eventRegistrationFormCardBgColorKey",
    label: "Form card background",
    tooltip: "Background colour of the form card.",
  },
  {
    name: "eventRegistrationFormLabelColorKey",
    label: "Field label color",
    tooltip: "Colour of the field labels (Name, Email, etc.).",
  },
  {
    name: "eventRegistrationFormInputBorderColorKey",
    label: "Input border color",
    tooltip: "Border colour of input boxes.",
  },
  {
    name: "eventRegistrationFormButtonBgColorKey",
    label: "Submit button background",
    tooltip: "Background colour of the submit button.",
  },
  {
    name: "eventRegistrationFormButtonTextColorKey",
    label: "Submit button text",
    tooltip: "Text colour of the submit button.",
  },
  {
    name: "eventRegistrationFormIntroColorKey",
    label: "Intro paragraph color",
    tooltip: "Colour of the intro paragraph above the form.",
  },
  {
    name: "eventRegistrationFormEventLineColorKey",
    label: "“Registering for…” line color",
    tooltip: "Colour of the line that shows the event title and date.",
  },
];

/**
 * Edit form for EventRegistrationForm — used in component edit page or page builder drawer.
 *
 * Page-block mode: data from block.props (pages collection); save updates layout only.
 * Global/singleton mode: GET/PUT /api/theme/EventRegistrationForm.
 *
 * Sections in the drawer:
 *   - Manage Section (background, padding, margins) — like every other component
 *   - Title & Colors — main title, subtitle, and ALL form colour pickers
 *     (card bg, label, input border, button bg/text, intro, event line)
 *   - Form Setting — intro, button text, success message, student-fields toggle
 *   - Default event (used when URL has no ?event= param)
 */
function EventRegistrationFormEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    onCancel,
    onDataLoad,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [initialData, setInitialData] = useState(null);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    const normalize = (data) => ({
      // Title fields (mainTitle/subTitle/titleColorKey come from TitleAndColorsSection)
      mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "",
      subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
      titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
      eventRegistrationFormTitleEnabled: data?.eventRegistrationFormTitleEnabled !== false,
      eventRegistrationFormSubTitleEnabled: data?.eventRegistrationFormSubTitleEnabled !== false,
      eventRegistrationFormSubTitleColorKey:
        data?.eventRegistrationFormSubTitleColorKey != null
          ? String(data.eventRegistrationFormSubTitleColorKey).trim()
          : "",

      // Form copy
      intro:
        data?.intro != null
          ? String(data.intro).trim()
          : "Please fill in your details below to register for this event. We will reach out with the next steps.",
      buttonText: data?.buttonText != null ? String(data.buttonText).trim() : "Register",
      successMessage:
        data?.successMessage != null
          ? String(data.successMessage).trim()
          : "Thank you! Your registration has been received. We will contact you with the next steps.",

      // Field options
      studentFieldsEnabled: data?.studentFieldsEnabled !== false,

      // Defaults
      defaultEventTitle: data?.defaultEventTitle != null ? String(data.defaultEventTitle).trim() : "",
      defaultEventDate: data?.defaultEventDate != null ? String(data.defaultEventDate).trim() : "",

      // Form colours
      eventRegistrationFormCardBgColorKey:
        data?.eventRegistrationFormCardBgColorKey != null
          ? String(data.eventRegistrationFormCardBgColorKey).trim()
          : "",
      eventRegistrationFormLabelColorKey:
        data?.eventRegistrationFormLabelColorKey != null
          ? String(data.eventRegistrationFormLabelColorKey).trim()
          : "",
      eventRegistrationFormInputBorderColorKey:
        data?.eventRegistrationFormInputBorderColorKey != null
          ? String(data.eventRegistrationFormInputBorderColorKey).trim()
          : "",
      eventRegistrationFormButtonBgColorKey:
        data?.eventRegistrationFormButtonBgColorKey != null
          ? String(data.eventRegistrationFormButtonBgColorKey).trim()
          : "",
      eventRegistrationFormButtonTextColorKey:
        data?.eventRegistrationFormButtonTextColorKey != null
          ? String(data.eventRegistrationFormButtonTextColorKey).trim()
          : "",
      eventRegistrationFormIntroColorKey:
        data?.eventRegistrationFormIntroColorKey != null
          ? String(data.eventRegistrationFormIntroColorKey).trim()
          : "",
      eventRegistrationFormEventLineColorKey:
        data?.eventRegistrationFormEventLineColorKey != null
          ? String(data.eventRegistrationFormEventLineColorKey).trim()
          : "",

      // Manage Section (background / padding / margins) — same helper every other component uses
      ...getManageSectionInitialValues(PREFIX, data),
    });

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const normalized = normalize(data);
      setInitialData(normalized);
      onDataLoad?.(normalized);
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            const palette = theme?.themePalette || {};
            const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
            const names = [
              ...new Set([
                ...Object.keys(palette),
                ...customColors.map((c) => c?.name).filter(Boolean),
              ]),
            ].sort();
            setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    setInitialData(null);
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        const normalized = normalize(data);
        setInitialData(normalized);
        onDataLoad?.(normalized);
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => message.error("Failed to load Event Registration Form"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp]);

  useEffect(() => {
    if (initialData) form.setFieldsValue(initialData);
  }, [initialData, form]);

  const handleUpdate = () => {
    return form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        // Title
        mainTitle: String(values.mainTitle ?? "").trim(),
        subTitle: String(values.subTitle ?? "").trim(),
        titleColorKey: String(values.titleColorKey ?? "").trim(),
        eventRegistrationFormTitleEnabled: values.eventRegistrationFormTitleEnabled !== false,
        eventRegistrationFormSubTitleEnabled: values.eventRegistrationFormSubTitleEnabled !== false,
        eventRegistrationFormSubTitleColorKey: String(
          values.eventRegistrationFormSubTitleColorKey ?? "",
        ).trim(),

        // Form copy
        intro: String(values.intro ?? "").trim(),
        buttonText: String(values.buttonText ?? "").trim(),
        successMessage: String(values.successMessage ?? "").trim(),

        // Field options
        studentFieldsEnabled: values.studentFieldsEnabled !== false,

        // Defaults
        defaultEventTitle: String(values.defaultEventTitle ?? "").trim(),
        defaultEventDate: String(values.defaultEventDate ?? "").trim(),

        // Form colours
        eventRegistrationFormCardBgColorKey: String(
          values.eventRegistrationFormCardBgColorKey ?? "",
        ).trim(),
        eventRegistrationFormLabelColorKey: String(
          values.eventRegistrationFormLabelColorKey ?? "",
        ).trim(),
        eventRegistrationFormInputBorderColorKey: String(
          values.eventRegistrationFormInputBorderColorKey ?? "",
        ).trim(),
        eventRegistrationFormButtonBgColorKey: String(
          values.eventRegistrationFormButtonBgColorKey ?? "",
        ).trim(),
        eventRegistrationFormButtonTextColorKey: String(
          values.eventRegistrationFormButtonTextColorKey ?? "",
        ).trim(),
        eventRegistrationFormIntroColorKey: String(
          values.eventRegistrationFormIntroColorKey ?? "",
        ).trim(),
        eventRegistrationFormEventLineColorKey: String(
          values.eventRegistrationFormEventLineColorKey ?? "",
        ).trim(),

        // Manage Section
        ...getManageSectionPayload(PREFIX, values),
      };

      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.(payload);
        return;
      }
      setSaving(true);
      return fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d?.error || d));
          return res.json();
        })
        .then((saved) => {
          message.success("Event Registration Form saved");
          onSuccess?.(saved || payload);
        })
        .catch((err) => {
          message.error(err?.error || "Failed to save");
          throw err;
        })
        .finally(() => setSaving(false));
    });
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading || initialData === null) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialData}
      key="event-registration-form-edit"
    >
      <Collapse
        defaultActiveKey={["section", "title", "content"]}
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
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                titleListItems={TITLE_LIST_ITEMS}
                colorListItems={COLOR_LIST_ITEMS}
              />
            ),
          },
          {
            key: "content",
            label: "Form Setting",
            children: (
              <Row gutter={[16, 12]}>
                <Col span={24}>
                  <Form.Item name="intro" label="Intro paragraph">
                    <Input.TextArea
                      rows={3}
                      placeholder="Short instruction shown above the form fields."
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="buttonText" label="Submit button text">
                    <Input placeholder="e.g. Register" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="successMessage"
                    label="Success message (shown after submission)"
                  >
                    <Input.TextArea rows={2} placeholder="Thank you message…" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="studentFieldsEnabled"
                    label="Show optional student fields (school + class/year)"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "defaults",
            label: "Default event (used when URL has no ?event= param)",
            children: (
              <Row gutter={[16, 12]}>
                <Col span={24}>
                  <Form.Item
                    name="defaultEventTitle"
                    label="Default event title"
                    extra="If empty AND the URL has no ?event=… query param, visitors will be asked to type the event name themselves."
                  >
                    <Input placeholder="e.g. Eid Drive 2025" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="defaultEventDate" label="Default event date">
                    <Input placeholder="e.g. 15 July 2025" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(EventRegistrationFormEditForm);
