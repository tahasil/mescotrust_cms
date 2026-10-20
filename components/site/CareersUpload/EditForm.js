"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, message, Spin, Collapse, Select, Switch } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import SettingsCardList from "@/components/admin/SettingsCardList";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const COMPONENT_ID = "CareersUpload";
const PREFIX = "careersUpload";
const API_PATH = `/api/theme/${COMPONENT_ID}`;

const DEFAULT_POSITIONS_TEXT =
  "General Application\nProgramme Coordinator\nMedical Officer\nAccounts Executive\nContent & Communications Executive\nSocial Worker\nIT Support Specialist\nInternship";

function CareersUploadEditForm(
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
    const rawPositions = data?.careersUploadPositions;
    let positionsText = DEFAULT_POSITIONS_TEXT;
    if (Array.isArray(rawPositions)) {
      positionsText = rawPositions.join("\n");
    } else if (typeof rawPositions === "string" && rawPositions.trim()) {
      positionsText = rawPositions.includes("\n")
        ? rawPositions
        : rawPositions.split(",").map((s) => s.trim()).join("\n");
    }

    form.setFieldsValue({
      // Canonical Title & Colors
      mainTitle: data?.mainTitle ?? data?.careersUploadMainTitle ?? "Build a Meaningful Career With Us",
      careersUploadTitleEnabled: data?.careersUploadTitleEnabled !== false,
      subTitle: data?.subTitle ?? data?.careersUploadSubTitle ?? "WHO WE ARE",
      careersUploadSubTitleEnabled: data?.careersUploadSubTitleEnabled !== false,
      careersUploadTitleAlign: data?.careersUploadTitleAlign ?? data?.titleAlign ?? "left",
      titleColorKey: data?.titleColorKey ?? data?.careersUploadTitleColorKey ?? "",
      careersUploadSubTitleColorKey: data?.careersUploadSubTitleColorKey ?? "",
      careersUploadCardBgColorKey: data?.careersUploadCardBgColorKey ?? "white",
      careersUploadLabelColorKey: data?.careersUploadLabelColorKey ?? "black",
      careersUploadButtonBgColorKey: data?.careersUploadButtonBgColorKey ?? "",
      careersUploadButtonTextColorKey: data?.careersUploadButtonTextColorKey ?? "white",

      // Manage Section
      ...getManageSectionInitialValues(PREFIX, data),

      // Form Settings & Fields
      careersUploadIntroText:
        data?.careersUploadIntroText ??
        "Please fill in your details below to submit your application. We will reach out with the next steps.",
      careersUploadPositionsText: positionsText,
      careersUploadShowQualification: data?.careersUploadShowQualification !== false,
      careersUploadShowExperience: data?.careersUploadShowExperience !== false,
      careersUploadShowCity: data?.careersUploadShowCity !== false,
      careersUploadShowCoverLetter: data?.careersUploadShowCoverLetter !== false,
      careersUploadSubmitBtnAlign: data?.careersUploadSubmitBtnAlign ?? data?.submitBtnAlign ?? "left",
      careersUploadMaxFileSizeMB: Number(data?.careersUploadMaxFileSizeMB) || 5,
      careersUploadSubmitBtnText: data?.careersUploadSubmitBtnText ?? "Submit Application",
      careersUploadSuccessTitle: data?.careersUploadSuccessTitle ?? "Application Submitted Successfully!",
      careersUploadSuccessMessage:
        data?.careersUploadSuccessMessage ??
        "Thank you! Your application and resume have been received. We will reach out with the next steps.",

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
      .catch(() => message.error("Failed to load CareersUpload settings"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);

        const positionsList = String(values.careersUploadPositionsText || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);

        const payload = {
          ...values,
          mainTitle: values.mainTitle || "",
          subTitle: values.subTitle || "",
          careersUploadTitleAlign: values.careersUploadTitleAlign || "left",
          titleColorKey: values.titleColorKey || "",
          careersUploadPositions: positionsList,
          careersUploadSubmitBtnAlign: values.careersUploadSubmitBtnAlign || "left",
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
            message.success("Careers Upload settings saved successfully");
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
                <Form.Item name="careersUploadIntroText" label="Intro Paragraph" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    rows={2}
                    placeholder="Please fill in your details below to submit your application..."
                  />
                </Form.Item>

                <Form.Item
                  name="careersUploadPositionsText"
                  label="Available Positions (One per line)"
                  extra="Populates the position dropdown in the candidate application form"
                  style={{ marginBottom: 0 }}
                >
                  <Input.TextArea rows={5} placeholder="Enter one position title per line" />
                </Form.Item>

                <SettingsCardList
                  title="Form Fields"
                  items={[
                    {
                      type: "switch",
                      name: "careersUploadShowQualification",
                      label: "Show Qualification Field",
                      tooltip: "Display qualification input in application form",
                    },
                    {
                      type: "switch",
                      name: "careersUploadShowExperience",
                      label: "Show Experience Field",
                      tooltip: "Display total experience select dropdown in application form",
                    },
                    {
                      type: "switch",
                      name: "careersUploadShowCity",
                      label: "Show City / Location Field",
                      tooltip: "Display current city / location input in application form",
                    },
                    {
                      type: "switch",
                      name: "careersUploadShowCoverLetter",
                      label: "Show Message Field",
                      tooltip: "Display message / cover letter textarea in application form",
                    },
                    {
                      type: "select",
                      name: "careersUploadSubmitBtnAlign",
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

                <Form.Item name="careersUploadMaxFileSizeMB" label="Max Resume File Size (MB)" style={{ marginBottom: 0 }}>
                  <InputNumber min={1} max={25} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item name="careersUploadSubmitBtnText" label="Submit Button Text" style={{ marginBottom: 0 }}>
                  <Input placeholder="Submit Application" />
                </Form.Item>

                <Form.Item name="careersUploadSuccessTitle" label="Success Heading" style={{ marginBottom: 0 }}>
                  <Input placeholder="Application Submitted Successfully!" />
                </Form.Item>

                <Form.Item name="careersUploadSuccessMessage" label="Success Confirmation Message" style={{ marginBottom: 0 }}>
                  <Input.TextArea rows={3} placeholder="Message displayed to candidates after submitting" />
                </Form.Item>
              </div>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(CareersUploadEditForm);
