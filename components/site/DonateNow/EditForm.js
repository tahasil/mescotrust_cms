"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  message,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  DONATE_NOW_BASE_FIELDS,
  normalizeDonateNowConfig,
} from "@/lib/donateNowConfig";

const API_PATH = "/api/theme/DonateNow";
const PREFIX = "donateNow";

const VALIDATION_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Lookup (email/mobile)", value: "lookup" },
  { label: "Email", value: "email" },
  { label: "Mobile", value: "phone" },
  { label: "PAN", value: "pan" },
  { label: "Name", value: "name" },
  { label: "Number", value: "number" },
  { label: "Amount", value: "amount" },
];

function toTrimmedString(value) {
  return String(value ?? "").trim();
}

function slugify(value) {
  return toTrimmedString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function resolvePurposeId(purpose = {}, index = 0) {
  const explicitId = toTrimmedString(purpose.id);
  if (explicitId) return explicitId;
  const nameSlug = slugify(purpose.name);
  if (nameSlug) return nameSlug;
  return `purpose-${index + 1}`;
}

function ensureUniquePurposeIds(purposes = []) {
  const seen = new Map();
  return purposes.map((purpose) => {
    const baseId = toTrimmedString(purpose.id) || "purpose";
    const nextCount = (seen.get(baseId) || 0) + 1;
    seen.set(baseId, nextCount);
    if (nextCount === 1) return purpose;
    return { ...purpose, id: `${baseId}-${nextCount}` };
  });
}

function getPurposeSelectOptions(values = []) {
  const seen = new Map();
  return values.map((purpose, index) => {
    const baseId = resolvePurposeId(purpose, index);
    const count = (seen.get(baseId) || 0) + 1;
    seen.set(baseId, count);
    const value = count === 1 ? baseId : `${baseId}-${count}`;
    return {
      label: toTrimmedString(purpose?.name) || value,
      value,
    };
  });
}

function normalizeFieldConfigForForm(fieldConfigMap) {
  const normalized = {};
  DONATE_NOW_BASE_FIELDS.forEach((baseField) => {
    normalized[baseField.key] = {
      ...baseField,
      ...(fieldConfigMap?.[baseField.key] || {}),
      label: toTrimmedString(fieldConfigMap?.[baseField.key]?.label || baseField.label),
      placeholder: toTrimmedString(
        fieldConfigMap?.[baseField.key]?.placeholder || baseField.placeholder || "",
      ),
    };
  });
  return normalized;
}

function normalizePurposeForSave(purpose = {}, index = 0) {
  const amount =
    Number.isFinite(Number(purpose.amount)) && Number(purpose.amount) >= 0
      ? Number(purpose.amount)
      : Number.isFinite(Number(purpose.defaultAmount)) && Number(purpose.defaultAmount) >= 0
        ? Number(purpose.defaultAmount)
        : Number.isFinite(Number(purpose.fixedAmount)) && Number(purpose.fixedAmount) >= 0
          ? Number(purpose.fixedAmount)
          : 0;
  const showStudentsCount = Boolean(purpose.showStudentsCount);
  const defaultStudentsCount =
    Number.isFinite(Number(purpose.defaultStudentsCount)) &&
    Number(purpose.defaultStudentsCount) >= 1
      ? Math.round(Number(purpose.defaultStudentsCount))
      : 1;
  const name = toTrimmedString(purpose.name);
  const id = resolvePurposeId(purpose, index);
  const generatedAmountText =
    amount > 0
      ? `Rs. ${amount.toLocaleString("en-IN")}${
          showStudentsCount ? "/- per student" : "/-"
        }`
      : "";

  return {
    id,
    name,
    cardTitle: name,
    cardIcon: toTrimmedString(purpose.cardIcon),
    cardAmountText: toTrimmedString(purpose.cardAmountText) || generatedAmountText,
    cardDescription: toTrimmedString(purpose.cardDescription),
    amount,
    defaultAmount: amount,
    fixedAmount: amount,
    amountMode: "fixed",
    calculationMode: showStudentsCount ? "multiply_by_students" : "none",
    quantityFieldKey: "studentsCount",
    minQuantity: defaultStudentsCount,
    defaultStudentsCount,
    hiddenFields: showStudentsCount ? [] : ["studentsCount"],
    disabledFields: [],
    requiredFields: showStudentsCount ? ["studentsCount"] : [],
    additionalFields: [],
    displayOrder:
      Number.isFinite(Number(purpose.displayOrder)) && Number(purpose.displayOrder) > 0
        ? Number(purpose.displayOrder)
        : index + 1,
    active: purpose.active !== false,
    showOnCard: true,
    showStudentsCount,
    highlight: false,
    badgeText: "",
  };
}

function DonateNowEditForm(
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

  useEffect(() => {
    if (Array.isArray(themeColorOptionsProp) && themeColorOptionsProp.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
    }
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);

    const setFormValues = (data, theme) => {
      const normalized = normalizeDonateNowConfig(data || {});
      const normalizedFieldConfig = normalizeFieldConfigForForm(normalized.fieldConfig);
      const reusableFields = Object.entries(normalizedFieldConfig)
        .filter(([, config]) => config.reusable)
        .map(([fieldKey]) => fieldKey);

      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data || {}),
        mainTitle: toTrimmedString(data?.mainTitle),
        subTitle: toTrimmedString(data?.subTitle),
        titleColorKey: toTrimmedString(data?.titleColorKey),
        donateNowTitleEnabled: data?.donateNowTitleEnabled !== false,
        donateNowSubTitleEnabled: data?.donateNowSubTitleEnabled !== false,
        donateNowSubTitleColorKey: toTrimmedString(data?.donateNowSubTitleColorKey),
        donateNowBtnBgColorKey: toTrimmedString(data?.donateNowBtnBgColorKey),
        donateNowBtnTextColorKey: toTrimmedString(data?.donateNowBtnTextColorKey),
        donateNowQrBtnBorderColorKey: toTrimmedString(data?.donateNowQrBtnBorderColorKey),
        donateNowQrBtnTextColorKey: toTrimmedString(data?.donateNowQrBtnTextColorKey),
        donateNowPkgActiveColorKey: toTrimmedString(data?.donateNowPkgActiveColorKey),
        donateNowFormHeadingColorKey: toTrimmedString(data?.donateNowFormHeadingColorKey),
        donateNowQrImageDesktop: toTrimmedString(
          data?.donateNowQrImageDesktop || data?.donateNowQrImageUrl,
        ),
        donateNowQrImageMobile: toTrimmedString(data?.donateNowQrImageMobile),
        donateNowCopy: normalized.copy,
        donateNowFieldConfig: normalizedFieldConfig,
        donateNowLookupSettings: {
          ...normalized.lookupSettings,
          reusableFields:
            normalized.lookupSettings.reusableFields?.length > 0
              ? normalized.lookupSettings.reusableFields
              : reusableFields,
        },
        donateNowPaymentSettings: normalized.paymentSettings,
        donateNowPurposes: normalized.purposes,
        donateNowDefaultPurposeId: normalized.defaultPurposeId,
      });

      if (theme) {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((color) => color?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      }
    };

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      setFormValues(data);
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => setFormValues(data, theme))
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
      .then(([data, theme]) => setFormValues(data, theme))
      .catch(() => message.error("Failed to load DonateNow"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    return form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const rawFieldConfig = values?.donateNowFieldConfig || {};
        const fieldConfig = {};
        DONATE_NOW_BASE_FIELDS.forEach((baseField) => {
          const item = rawFieldConfig[baseField.key] || {};
          fieldConfig[baseField.key] = {
            ...baseField,
            label: toTrimmedString(item.label || baseField.label),
            placeholder: toTrimmedString(
              item.placeholder !== undefined ? item.placeholder : baseField.placeholder,
            ),
            required: Boolean(item.required),
            active: item.active !== false,
            disabled: Boolean(item.disabled),
            width: item.width === "full" ? "full" : "half",
            reusable: Boolean(item.reusable),
            sensitive: Boolean(item.sensitive || baseField.sensitive),
            validation: toTrimmedString(item.validation || baseField.validation || "none"),
            defaultValue: toTrimmedString(item.defaultValue || ""),
            options: Array.isArray(item.options) ? item.options : baseField.options || [],
            inputType: toTrimmedString(item.inputType || baseField.inputType || ""),
          };
        });

        const purposes = ensureUniquePurposeIds(
          Array.isArray(values.donateNowPurposes)
            ? values.donateNowPurposes.map((purpose, index) =>
                normalizePurposeForSave(purpose, index),
              )
            : [],
        );

        const lookupSettings = values?.donateNowLookupSettings || {};
        const defaultReusable = Object.entries(fieldConfig)
          .filter(([, config]) => config.reusable)
          .map(([fieldKey]) => fieldKey);

        const payload = {
          ...getManageSectionPayload(PREFIX, values),
          mainTitle: toTrimmedString(values.mainTitle),
          subTitle: toTrimmedString(values.subTitle),
          titleColorKey: toTrimmedString(values.titleColorKey),
          donateNowTitleEnabled: values.donateNowTitleEnabled !== false,
          donateNowSubTitleEnabled: values.donateNowSubTitleEnabled !== false,
          donateNowSubTitleColorKey: toTrimmedString(values.donateNowSubTitleColorKey),
          donateNowBtnBgColorKey: toTrimmedString(values.donateNowBtnBgColorKey),
          donateNowBtnTextColorKey: toTrimmedString(values.donateNowBtnTextColorKey),
          donateNowQrBtnBorderColorKey: toTrimmedString(values.donateNowQrBtnBorderColorKey),
          donateNowQrBtnTextColorKey: toTrimmedString(values.donateNowQrBtnTextColorKey),
          donateNowPkgActiveColorKey: toTrimmedString(values.donateNowPkgActiveColorKey),
          donateNowFormHeadingColorKey: toTrimmedString(values.donateNowFormHeadingColorKey),
          donateNowQrImageDesktop: toTrimmedString(values.donateNowQrImageDesktop),
          donateNowQrImageMobile: toTrimmedString(values.donateNowQrImageMobile),
          donateNowQrImageUrl: toTrimmedString(values.donateNowQrImageDesktop),
          donateNowCopy: {
            formTitle: toTrimmedString(values?.donateNowCopy?.formTitle),
            formSubtitle: toTrimmedString(values?.donateNowCopy?.formSubtitle),
            sectionDescription: "",
            sectionBadge: "",
            donateButtonText: toTrimmedString(values?.donateNowCopy?.donateButtonText),
            donateButtonProcessingText: toTrimmedString(
              values?.donateNowCopy?.donateButtonProcessingText,
            ),
            qrButtonText: toTrimmedString(values?.donateNowCopy?.qrButtonText),
            purposePanelTitle: "",
            successMessage: toTrimmedString(values?.donateNowCopy?.successMessage),
            errorMessage: toTrimmedString(values?.donateNowCopy?.errorMessage),
            donorFoundMessage: toTrimmedString(values?.donateNowCopy?.donorFoundMessage),
            donorNotFoundMessage: toTrimmedString(values?.donateNowCopy?.donorNotFoundMessage),
            termsText: "",
            termsRequired: false,
            termsLabel: "",
            footerBannerText: toTrimmedString(values?.donateNowCopy?.footerBannerText),
            footerBannerImage: toTrimmedString(values?.donateNowCopy?.footerBannerImage),
            footerBannerBgColor: toTrimmedString(values?.donateNowCopy?.footerBannerBgColor),
          },
          donateNowFieldConfig: fieldConfig,
          donateNowLookupSettings: {
            enabled: values?.donateNowLookupSettings?.enabled !== false,
            minimumCharacters: Number(values?.donateNowLookupSettings?.minimumCharacters) || 5,
            lookupByEmail: values?.donateNowLookupSettings?.lookupByEmail !== false,
            lookupByMobile: values?.donateNowLookupSettings?.lookupByMobile !== false,
            autoFillEnabled: values?.donateNowLookupSettings?.autoFillEnabled !== false,
            reusableFields:
              Array.isArray(lookupSettings.reusableFields) &&
              lookupSettings.reusableFields.length > 0
                ? lookupSettings.reusableFields
                : defaultReusable,
            showMaskedPreview: values?.donateNowLookupSettings?.showMaskedPreview !== false,
          },
          donateNowPaymentSettings: {
            currency: toTrimmedString(values?.donateNowPaymentSettings?.currency || "INR"),
            enableQrButton: values?.donateNowPaymentSettings?.enableQrButton !== false,
            requirePaymentGateway:
              values?.donateNowPaymentSettings?.requirePaymentGateway !== false,
          },
          donateNowPurposes: purposes,
          donateNowDefaultPurposeId: toTrimmedString(values?.donateNowDefaultPurposeId),
          donateNowPurposeOptions: purposes.map((purpose) => purpose.name).join(", "),
          donateNowPackages: purposes.map((purpose) => ({
            amount:
              purpose.defaultAmount > 0
                ? String(purpose.defaultAmount)
                : toTrimmedString(purpose.cardAmountText),
            description: toTrimmedString(purpose.cardDescription),
          })),
        };

        if (isPageBlock && onSaveToPage) {
          onSaveToPage(payload);
          message.success("Changes will be saved with the page");
          onSuccess?.();
          return;
        }

        setSaving(true);
        return fetch(API_PATH, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((res) => {
            if (!res.ok) return res.json().then((d) => Promise.reject(d));
            return res.json();
          })
          .then(() => {
            message.success("DonateNow saved");
            onSuccess?.();
          })
          .catch((err) => message.error(err?.error || "Failed to save"))
          .finally(() => setSaving(false));
      })
      .catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [handleUpdate]);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  const fieldOptions = DONATE_NOW_BASE_FIELDS.map((field) => ({
    label: field.label,
    value: field.key,
  }));

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage", "title", "copy", "fields", "lookup", "purposes"]}
        items={[
          {
            key: "manage",
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
                {...getTitleAndColorsConfig("DonateNow")}
              />
            ),
          },
          {
            key: "copy",
            label: "Content, Messages & Media",
            children: (
              <Row gutter={[16, 12]}>
                <Col xs={24} md={12}>
                  <Form.Item name={["donateNowCopy", "formTitle"]} label="Form Title">
                    <Input placeholder="Details" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name={["donateNowCopy", "formSubtitle"]} label="Form Subtitle">
                    <Input.TextArea
                      rows={2}
                      placeholder="If you have already donated before..."
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={["donateNowCopy", "donateButtonText"]} label="Donate Button Text">
                    <Input placeholder="Donate Now" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={["donateNowCopy", "donateButtonProcessingText"]}
                    label="Processing Button Text"
                  >
                    <Input placeholder="Processing..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={["donateNowCopy", "qrButtonText"]} label="QR Button Text">
                    <Input placeholder="Donate Now with QR" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={["donateNowCopy", "successMessage"]} label="Success Message">
                    <Input placeholder="Redirecting to payment gateway..." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={["donateNowCopy", "errorMessage"]} label="Error Message">
                    <Input placeholder="Failed to initiate payment" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={["donateNowCopy", "donorFoundMessage"]} label="Returning Donor Message">
                    <Input placeholder="Previous details found and filled." />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name={["donateNowCopy", "footerBannerText"]} label="Footer Banner Text">
                    <Input.TextArea
                      rows={2}
                      placeholder="Your Donation to MESCO Exempt Under Section..."
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={["donateNowCopy", "footerBannerImage"]} label="Footer Banner Image">
                    <MediaPickerInput placeholder="/uploads/donate-footer-banner.webp" uiVariant="stacked" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={["donateNowCopy", "footerBannerBgColor"]} label="Footer Banner Fallback Background">
                    <Input placeholder="#111111" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="donateNowQrImageDesktop" label="Desktop QR Image">
                    <MediaPickerInput placeholder="/uploads/upi-qr-code.webp" uiVariant="stacked" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="donateNowQrImageMobile" label="Mobile QR Image">
                    <MediaPickerInput placeholder="/uploads/upi-qr-mobile.webp" uiVariant="stacked" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "fields",
            label: "Form Field Labels, Placeholders & Validation",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                {DONATE_NOW_BASE_FIELDS.map((field) => (
                  <div
                    key={field.key}
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 10,
                      padding: 12,
                      background: "#fff",
                    }}
                  >
                    <Row gutter={[12, 12]}>
                      <Col span={24}>
                        <strong>{field.label}</strong> <span style={{ color: "#888" }}>({field.key})</span>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name={["donateNowFieldConfig", field.key, "label"]} label="Label">
                          <Input placeholder={field.label} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name={["donateNowFieldConfig", field.key, "placeholder"]}
                          label="Placeholder"
                        >
                          <Input placeholder={field.placeholder || "Enter value"} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={["donateNowFieldConfig", field.key, "validation"]}
                          label="Validation"
                        >
                          <Select options={VALIDATION_OPTIONS} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name={["donateNowFieldConfig", field.key, "width"]} label="Width">
                          <Select
                            options={[
                              { label: "Half", value: "half" },
                              { label: "Full", value: "full" },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={["donateNowFieldConfig", field.key, "defaultValue"]}
                          label="Default Value"
                        >
                          <Input placeholder="Optional default value" />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Item
                          name={["donateNowFieldConfig", field.key, "active"]}
                          label="Visible"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Item
                          name={["donateNowFieldConfig", field.key, "required"]}
                          label="Required"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Item
                          name={["donateNowFieldConfig", field.key, "disabled"]}
                          label="Disabled"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Item
                          name={["donateNowFieldConfig", field.key, "reusable"]}
                          label="Reusable"
                          valuePropName="checked"
                          extra="Used for returning donor autofill"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Space>
            ),
          },
          {
            key: "lookup",
            label: "Returning Donor Lookup",
            children: (
              <Row gutter={[16, 12]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={["donateNowLookupSettings", "enabled"]}
                    label="Enable Lookup"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={["donateNowLookupSettings", "lookupByEmail"]}
                    label="Lookup by Email"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={["donateNowLookupSettings", "lookupByMobile"]}
                    label="Lookup by Mobile"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={["donateNowLookupSettings", "autoFillEnabled"]}
                    label="Enable Auto-fill"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={["donateNowLookupSettings", "showMaskedPreview"]}
                    label="Show Masked Preview"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={["donateNowLookupSettings", "minimumCharacters"]}
                    label="Minimum Characters"
                  >
                    <InputNumber min={3} max={15} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name={["donateNowLookupSettings", "reusableFields"]}
                    label="Auto-fill Reusable Fields"
                  >
                    <Select
                      mode="multiple"
                      options={fieldOptions.filter((item) => item.value !== "lookup")}
                      placeholder="Select fields to auto-fill for returning donors"
                    />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "payment",
            label: "Payment Settings",
            children: (
              <Row gutter={[16, 12]}>
                <Col xs={24} md={8}>
                  <Form.Item name={["donateNowPaymentSettings", "currency"]} label="Currency">
                    <Input placeholder="INR" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={["donateNowPaymentSettings", "enableQrButton"]}
                    label="Enable QR Button"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={["donateNowPaymentSettings", "requirePaymentGateway"]}
                    label="Require Gateway"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "purposes",
            label: "Donation Purposes",
            children: (
              <>
                <Form.Item
                  shouldUpdate={(prev, next) =>
                    prev.donateNowPurposes !== next.donateNowPurposes ||
                    prev.donateNowDefaultPurposeId !== next.donateNowDefaultPurposeId
                  }
                  noStyle
                >
                  {() => {
                    const values = form.getFieldValue("donateNowPurposes") || [];
                    return (
                      <Form.Item name="donateNowDefaultPurposeId" label="Default Selected Purpose">
                        <Select
                          allowClear
                          placeholder="Select default purpose"
                          options={getPurposeSelectOptions(values)}
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>

                <Form.List name="donateNowPurposes">
                  {(fields, { add, remove, move }) => (
                    <SortableFormList
                      fields={fields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="Purpose"
                      addButtonText="Add Purpose"
                      defaultAddPayload={{
                        name: "",
                        cardIcon: "",
                        amount: 0,
                        cardDescription: "",
                        showStudentsCount: false,
                        defaultStudentsCount: 1,
                        displayOrder: fields.length + 1,
                        active: true,
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
                          <Col xs={24} md={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "name"]}
                              label="Purpose Name"
                              rules={[{ required: true, message: "Name is required" }]}
                            >
                              <Input placeholder="Educational Aid (School/College)" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item {...restField} name={[name, "cardIcon"]} label="Card Icon/Image">
                              <MediaPickerInput placeholder="/uploads/donate-purpose-icon.webp" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "amount"]}
                              label="Amount"
                              rules={[{ required: true, message: "Amount is required" }]}
                            >
                              <InputNumber min={0} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "cardDescription"]} label="Card Description">
                              <Input.TextArea rows={2} placeholder="Sponsor description shown on card" />
                            </Form.Item>
                          </Col>
                          <Col xs={12} md={8}>
                            <Form.Item
                              {...restField}
                              name={[name, "showStudentsCount"]}
                              label="Enable Select Student"
                              valuePropName="checked"
                            >
                              <Switch />
                            </Form.Item>
                          </Col>
                          <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) =>
                              getFieldValue(["donateNowPurposes", name, "showStudentsCount"]) ? (
                                <Col xs={12} md={8}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, "defaultStudentsCount"]}
                                    label="Default Student Count"
                                  >
                                    <InputNumber min={1} style={{ width: "100%" }} />
                                  </Form.Item>
                                </Col>
                              ) : null
                            }
                          </Form.Item>
                          <Col xs={24} md={8}>
                            <Form.Item {...restField} name={[name, "displayOrder"]} label="Display Order">
                              <InputNumber min={1} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col xs={12} md={8}>
                            <Form.Item {...restField} name={[name, "active"]} label="Active" valuePropName="checked">
                              <Switch />
                            </Form.Item>
                          </Col>
                        </Row>
                      )}
                    />
                  )}
                </Form.List>
              </>
            ),
          },
        ]}
      />
      {saving ? (
        <div style={{ marginTop: 12, color: "#888", fontSize: 12 }}>Saving...</div>
      ) : null}
    </Form>
  );
}

export default forwardRef(DonateNowEditForm);

