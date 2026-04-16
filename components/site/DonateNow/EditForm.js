"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/DonateNow";
const PREFIX = "donateNow";

const DEFAULT_PACKAGES = [
  { amount: "25,000", description: "Sponsor 1 child to complete the education after std VII for per annum. (EAS)" },
  { amount: "60,000", description: "Sponsor 1 child to complete the Higher Education for per annum. (HCES)" },
  { amount: "8,000", description: "Sponsor 1 child to complete their Education for per annum. (EAID)" },
  { amount: "9,000", description: "Sponsor 1 sewing machine to widow to become self sufficient." },
  { amount: "28,000", description: "Sponsor 1 family for dry ration for per annum." },
  { amount: "700", description: "Sponsor 1 dialysis patient for per dialysis cost" },
  { amount: "15,000", description: "Support 1 patient for monthly medicines for chronic illness. (MA)" },
];

function normalizePackage(it) {
  return {
    amount: it?.amount != null ? String(it.amount).trim() : "",
    description: it?.description != null ? String(it.description).trim() : "",
  };
}

function DonateNowEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    const setFormAndColors = (data, theme) => {
      const pkgs = Array.isArray(data?.donateNowPackages) ? data.donateNowPackages.map(normalizePackage) : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "",
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        donateNowTitleEnabled: data?.donateNowTitleEnabled !== false,
        donateNowSubTitleEnabled: data?.donateNowSubTitleEnabled !== false,
        donateNowSubTitleColorKey: data?.donateNowSubTitleColorKey != null ? String(data.donateNowSubTitleColorKey).trim() : "",
        donateNowBtnBgColorKey: data?.donateNowBtnBgColorKey != null ? String(data.donateNowBtnBgColorKey).trim() : "",
        donateNowBtnTextColorKey: data?.donateNowBtnTextColorKey != null ? String(data.donateNowBtnTextColorKey).trim() : "",
        donateNowQrBtnBorderColorKey: data?.donateNowQrBtnBorderColorKey != null ? String(data.donateNowQrBtnBorderColorKey).trim() : "",
        donateNowQrBtnTextColorKey: data?.donateNowQrBtnTextColorKey != null ? String(data.donateNowQrBtnTextColorKey).trim() : "",
        donateNowPkgActiveColorKey: data?.donateNowPkgActiveColorKey != null ? String(data.donateNowPkgActiveColorKey).trim() : "",
        donateNowFormHeadingColorKey: data?.donateNowFormHeadingColorKey != null ? String(data.donateNowFormHeadingColorKey).trim() : "",
        donateNowPurposeOptions: data?.donateNowPurposeOptions ?? "Adopted Municipal School, Clinics, Educate an Orphan, Educational Aid, General Aid, Medical Aid, Office Premises",
        donateNowQrImageUrl: data?.donateNowQrImageUrl ?? "",
        donateNowPackages: pkgs.length > 0 ? pkgs : DEFAULT_PACKAGES.map(normalizePackage),
      });
      if (theme) {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      }
    };

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      setFormAndColors(data);
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => setFormAndColors(data, theme))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else { setLoading(false); }
      return;
    }
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => setFormAndColors(data, theme))
      .catch(() => message.error("Failed to load DonateNow"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawPkgs = values.donateNowPackages ?? [];
      const pkgs = Array.isArray(rawPkgs) ? rawPkgs.map(normalizePackage) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        donateNowTitleEnabled: values.donateNowTitleEnabled !== false,
        donateNowSubTitleEnabled: values.donateNowSubTitleEnabled !== false,
        donateNowSubTitleColorKey: values.donateNowSubTitleColorKey != null ? String(values.donateNowSubTitleColorKey).trim() : "",
        donateNowBtnBgColorKey: values.donateNowBtnBgColorKey != null ? String(values.donateNowBtnBgColorKey).trim() : "",
        donateNowBtnTextColorKey: values.donateNowBtnTextColorKey != null ? String(values.donateNowBtnTextColorKey).trim() : "",
        donateNowQrBtnBorderColorKey: values.donateNowQrBtnBorderColorKey != null ? String(values.donateNowQrBtnBorderColorKey).trim() : "",
        donateNowQrBtnTextColorKey: values.donateNowQrBtnTextColorKey != null ? String(values.donateNowQrBtnTextColorKey).trim() : "",
        donateNowPkgActiveColorKey: values.donateNowPkgActiveColorKey != null ? String(values.donateNowPkgActiveColorKey).trim() : "",
        donateNowFormHeadingColorKey: values.donateNowFormHeadingColorKey != null ? String(values.donateNowFormHeadingColorKey).trim() : "",
        donateNowPurposeOptions: values.donateNowPurposeOptions != null ? String(values.donateNowPurposeOptions).trim() : "",
        donateNowQrImageUrl: values.donateNowQrImageUrl != null ? String(values.donateNowQrImageUrl).trim() : "",
        donateNowPackages: pkgs,
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch(API_PATH, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then((res) => { if (!res.ok) return res.json().then((d) => Promise.reject(d)); })
        .then(() => { message.success("Donate Now saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["packages"]}
        items={[
          { key: "manage-section", label: "Manage Section", children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} /> },
          { key: "title-colors", label: "Title & Colors", children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("DonateNow")} /> },
          {
            key: "form-settings",
            label: "Form Settings",
            children: (
              <>
                <Form.Item name="donateNowPurposeOptions" label="Purpose of Donation Options" extra="Comma-separated list">
                  <Input.TextArea rows={3} placeholder="Adopted Municipal School, Clinics, Educate an Orphan..." />
                </Form.Item>
                <Form.Item name="donateNowQrImageUrl" label="QR Code Image URL" extra="Leave empty to hide QR button">
                  <MediaPickerInput placeholder="/uploads/upi-qr-code.webp" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "packages",
            label: "Donation Packages",
            children: (
              <Form.List name="donateNowPackages">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Package"
                    addButtonText="Add package"
                    defaultAddPayload={{ amount: "", description: "" }}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "amount"]} label="Amount" rules={[{ required: true, message: "Amount is required" }]}>
                            <Input placeholder="e.g. 25,000" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "description"]} label="Description">
                            <Input.TextArea rows={2} placeholder="e.g. Sponsor 1 child education..." size="large" />
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
    </Form>
  );
}

export default forwardRef(DonateNowEditForm);
