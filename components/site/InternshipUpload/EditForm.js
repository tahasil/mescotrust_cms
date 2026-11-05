"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, message, Spin, Collapse, Select, Switch } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import SettingsCardList from "@/components/admin/SettingsCardList";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const COMPONENT_ID = "InternshipUpload";
const PREFIX = "internshipUpload";
const API_PATH = `/api/theme/${COMPONENT_ID}`;

const DEFAULT_ROLES_TEXT = [
  "Social Media and Digital Marketing",
  "Graphic Design and Video Editing",
  "Content Writing and Communications",
  "Website Development and IT Support",
  "Research and Data Management",
  "Programme Coordination",
  "Fundraising and CSR Support",
].join("\n");

function InternshipUploadEditForm(
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
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
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
          ...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  const setFormData = (data) => {
    const rawRoles = data?.internshipUploadRoles ?? data?.roles;
    let rolesText = DEFAULT_ROLES_TEXT;
    if (Array.isArray(rawRoles) && rawRoles.length > 0) {
      rolesText = rawRoles.join("\n");
    } else if (typeof rawRoles === "string" && rawRoles.trim()) {
      rolesText = rawRoles.includes("\n")
        ? rawRoles
        : rawRoles.split(",").map((s) => s.trim()).join("\n");
    }

    form.setFieldsValue({
      // Canonical Title & Colors
      mainTitle: data?.mainTitle ?? data?.internshipUploadMainTitle ?? "Current Openings",
      internshipUploadTitleEnabled: data?.internshipUploadTitleEnabled !== false,
      subTitle: data?.subTitle ?? data?.internshipUploadSubTitle ?? "WE'RE HIRING",
      internshipUploadSubTitleEnabled: data?.internshipUploadSubTitleEnabled !== false,
      internshipUploadTitleAlign: data?.internshipUploadTitleAlign ?? data?.titleAlign ?? "center",
      titleColorKey: data?.titleColorKey ?? data?.internshipUploadTitleColorKey ?? "",
      internshipUploadSubTitleColorKey: data?.internshipUploadSubTitleColorKey ?? "",
      internshipUploadCardBgColorKey: data?.internshipUploadCardBgColorKey ?? "white",
      internshipUploadLabelColorKey: data?.internshipUploadLabelColorKey ?? "black",
      internshipUploadButtonBgColorKey: data?.internshipUploadButtonBgColorKey ?? "",
      internshipUploadButtonTextColorKey: data?.internshipUploadButtonTextColorKey ?? "white",

      // Manage Section
      ...getManageSectionInitialValues(PREFIX, data),

      // Form Settings & Fields
      internshipUploadIntroText:
        data?.internshipUploadIntroText ??
        "MESCO Trust works across education, healthcare, poverty relief and community development. Individuals interested in contributing their skills and gaining experience may apply below.",
      internshipUploadRolesText: rolesText,
      internshipUploadShowSkills: data?.internshipUploadShowSkills !== false,
      internshipUploadShowWorkMode: data?.internshipUploadShowWorkMode !== false,
      internshipUploadShowDuration: data?.internshipUploadShowDuration !== false,
      internshipUploadShowStartDate: data?.internshipUploadShowStartDate !== false,
      internshipUploadShowCity: data?.internshipUploadShowCity !== false,
      internshipUploadShowDescription: data?.internshipUploadShowDescription !== false,
      internshipUploadSubmitBtnAlign: data?.internshipUploadSubmitBtnAlign ?? data?.submitBtnAlign ?? "left",
      internshipUploadMaxFileSizeMB: Number(data?.internshipUploadMaxFileSizeMB) || 5,
      internshipUploadSubmitBtnText: data?.internshipUploadSubmitBtnText ?? "Submit Application",
      internshipUploadSuccessTitle: data?.internshipUploadSuccessTitle ?? "Application Submitted Successfully!",
      internshipUploadSuccessMessage:
        data?.internshipUploadSuccessMessage ??
        "Thank you! Your internship application and resume have been received. We will reach out with the next steps.",

      // Preserve existing props
      ...(data && typeof data === "object" ? data : {}),
    });
  };

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      setFormData(initialDataProp ?? {});
      setLoading(false);
      return;
    }

    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        setFormData(data || {});
      })
      .catch(() => message.error("Failed to load Internship Upload settings"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);

        const rolesList = String(values.internshipUploadRolesText || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);

        const payload = {
          ...values,
          mainTitle: values.mainTitle || "",
          subTitle: values.subTitle || "",
          internshipUploadTitleAlign: values.internshipUploadTitleAlign || "center",
          titleColorKey: values.titleColorKey || "",
          internshipUploadRoles: rolesList,
          internshipUploadSubmitBtnAlign: values.internshipUploadSubmitBtnAlign || "left",
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
            message.success("Internship Upload settings saved successfully");
            onSuccess?.();
          })
          .catch((err) => message.error(err?.error || "Failed to save settings"))
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
                {...getTitleAndColorsConfig(COMPONENT_ID)}
              />
            ),
          },
          {
            key: "form-config",
            label: "Form Fields & Upload Settings",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Form.Item name="internshipUploadIntroText" label="Intro Paragraph" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    rows={2}
                    placeholder="MESCO Trust works across education, healthcare, poverty relief..."
                  />
                </Form.Item>

                <Form.Item
                  name="internshipUploadRolesText"
                  label="Available Internship Roles / Departments (One per line)"
                  extra="Populates the role / department dropdown in the internship application form. 'Other' will automatically be appended as an option for applicants."
                  style={{ marginBottom: 0 }}
                >
                  <Input.TextArea rows={5} placeholder="Enter one role / department title per line" />
                </Form.Item>

                <SettingsCardList
                  title="Form Fields"
                  items={[
                    {
                      type: "switch",
                      name: "internshipUploadShowSkills",
                      label: "Show Eligibility & Skills Field",
                      tooltip: "Display academic degree and skills input in application form",
                    },
                    {
                      type: "switch",
                      name: "internshipUploadShowWorkMode",
                      label: "Show Location & Work Mode Field",
                      tooltip: "Display work mode select (Office / Hybrid / Remote) in application form",
                    },
                    {
                      type: "switch",
                      name: "internshipUploadShowDuration",
                      label: "Show Duration & Stipend Field",
                      tooltip: "Display internship duration dropdown in application form",
                    },
                    {
                      type: "switch",
                      name: "internshipUploadShowStartDate",
                      label: "Show Start Date / Availability Field",
                      tooltip: "Display start date / earliest availability input in application form",
                    },
                    {
                      type: "switch",
                      name: "internshipUploadShowCity",
                      label: "Show Current City / Location Field",
                      tooltip: "Display current city / location input in application form",
                    },
                    {
                      type: "switch",
                      name: "internshipUploadShowDescription",
                      label: "Show Description & Responsibilities Field",
                      tooltip: "Display statement of interest / preferred responsibilities textarea in application form",
                    },
                    {
                      type: "select",
                      name: "internshipUploadSubmitBtnAlign",
                      label: "Submit Button Align",
                      tooltip: "Alignment of the submit application button",
                      options: [
                        { label: "Left", value: "left" },
                        { label: "Center", value: "center" },
                        { label: "Right", value: "right" },
                        { label: "Full Width", value: "full" },
                      ],
                    },
                  ]}
                  renderAction={(item) => {
                    if (item.type === "select") {
                      return (
                        <Form.Item key={item.name} name={item.name} noStyle>
                          <Select
                            size="small"
                            style={{ width: 120 }}
                            options={item.options}
                          />
                        </Form.Item>
                      );
                    }
                    return (
                      <Form.Item
                        key={`switch-${String(item.name)}`}
                        name={item.name}
                        valuePropName="checked"
                        noStyle
                      >
                        <Switch />
                      </Form.Item>
                    );
                  }}
                />

                <Form.Item
                  name="internshipUploadMaxFileSizeMB"
                  label="Max Resume File Size (MB)"
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber min={1} max={25} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  name="internshipUploadSubmitBtnText"
                  label="Submit Button Text"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="Submit Application" />
                </Form.Item>

                <Form.Item
                  name="internshipUploadSuccessTitle"
                  label="Success Heading"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="Application Submitted Successfully!" />
                </Form.Item>

                <Form.Item
                  name="internshipUploadSuccessMessage"
                  label="Success Confirmation Message"
                  style={{ marginBottom: 0 }}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Message displayed to applicants after submitting"
                  />
                </Form.Item>
              </div>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(InternshipUploadEditForm);

