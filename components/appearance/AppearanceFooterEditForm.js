"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  Collapse,
  Form,
  Input,
  Row,
  Col,
  Select,
  Spin,
  message,
} from "antd";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ColorSettingsCard } from "@/components/admin/SettingsCardList";
import SortableFormList from "@/components/admin/SortableFormList";
import {
  LINK_TARGET_OPTIONS,
  normalizeLinkItems,
  normalizeSocialItems,
  normalizeTarget,
} from "./editorUtils";

const SOCIAL_OPTIONS = [
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "x",
  "website",
].map((value) => ({
  value,
  label: value === "x" ? "X / Twitter" : value[0].toUpperCase() + value.slice(1),
}));

function AppearanceFooterEditForm(
  { dataEndpoint, themeColorOptions = [], onSuccess },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(dataEndpoint, { cache: "no-store" })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("Failed to load Footer")),
      )
      .then((record) => {
        form.setFieldsValue({
          footerLogoUrl: record?.footerLogoUrl || "",
          footerLogoHref: record?.footerLogoHref || "/",
          footerLogoTarget: normalizeTarget(record?.footerLogoTarget),
          footerDescription: record?.footerDescription || "",
          footerAddress: record?.footerAddress || "",
          footerEmail: record?.footerEmail || "",
          footerEmailTarget: normalizeTarget(record?.footerEmailTarget),
          footerPhone: record?.footerPhone || "",
          footerPhoneTarget: normalizeTarget(record?.footerPhoneTarget),
          footerCol1Title: record?.footerCol1Title || "Our Works",
          footerCol1Links: normalizeLinkItems(record?.footerCol1Links),
          footerCol2Title: record?.footerCol2Title || "Media",
          footerCol2Links: normalizeLinkItems(record?.footerCol2Links),
          footerContactTitle: record?.footerContactTitle || "Contact",
          footerSocialLinks: normalizeSocialItems(record?.footerSocialLinks),
          footerCopyrightText: record?.footerCopyrightText || "",
          footerPrivacyLabel: record?.footerPrivacyLabel || "Privacy Policy",
          footerPrivacyUrl: record?.footerPrivacyUrl || "",
          footerPrivacyTarget: normalizeTarget(record?.footerPrivacyTarget),
          footerRefundLabel:
            record?.footerRefundLabel || "Refund & Cancellation Policy",
          footerRefundUrl: record?.footerRefundUrl || "",
          footerRefundTarget: normalizeTarget(record?.footerRefundTarget),
          footerBgColorKey: record?.footerBgColorKey || "dark",
          footerBackgroundImageUrl: record?.footerBackgroundImageUrl || "",
          footerTextColorKey:
            record?.footerTextColorKey || "rgba(250, 246, 239, 0.82)",
          footerCopyrightBarColorKey:
            record?.footerCopyrightBarColorKey || "dark",
        });
      })
      .catch((error) => message.error(error?.message || "Failed to load Footer"))
      .finally(() => setLoading(false));
  }, [dataEndpoint, form]);

  const save = async () => {
    await form.validateFields();
    const values = form.getFieldsValue(true);
    setSaving(true);
    try {
      const payload = {
        footerLogoUrl: String(values.footerLogoUrl || "").trim(),
        footerLogoHref: String(values.footerLogoHref || "").trim(),
        footerLogoTarget: normalizeTarget(values.footerLogoTarget),
        footerDescription: String(values.footerDescription || "").trim(),
        footerAddress: String(values.footerAddress || "").trim(),
        footerEmail: String(values.footerEmail || "").trim(),
        footerEmailTarget: normalizeTarget(values.footerEmailTarget),
        footerPhone: String(values.footerPhone || "").trim(),
        footerPhoneTarget: normalizeTarget(values.footerPhoneTarget),
        footerCol1Title: String(values.footerCol1Title || "").trim(),
        footerCol1Links: normalizeLinkItems(values.footerCol1Links),
        footerCol2Title: String(values.footerCol2Title || "").trim(),
        footerCol2Links: normalizeLinkItems(values.footerCol2Links),
        footerContactTitle: String(values.footerContactTitle || "").trim(),
        footerSocialLinks: normalizeSocialItems(values.footerSocialLinks),
        footerCopyrightText: String(values.footerCopyrightText || "").trim(),
        footerPrivacyLabel: String(values.footerPrivacyLabel || "").trim(),
        footerPrivacyUrl: String(values.footerPrivacyUrl || "").trim(),
        footerPrivacyTarget: normalizeTarget(values.footerPrivacyTarget),
        footerRefundLabel: String(values.footerRefundLabel || "").trim(),
        footerRefundUrl: String(values.footerRefundUrl || "").trim(),
        footerRefundTarget: normalizeTarget(values.footerRefundTarget),
        footerBgColorKey: String(values.footerBgColorKey || "").trim(),
        footerBackgroundImageUrl: String(
          values.footerBackgroundImageUrl || "",
        ).trim(),
        footerTextColorKey: String(values.footerTextColorKey || "").trim(),
        footerCopyrightBarColorKey: String(
          values.footerCopyrightBarColorKey || "",
        ).trim(),
      };
      const response = await fetch(dataEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultProps: payload, replaceDefaultProps: true }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save Footer");
      }
      message.success("Footer saved");
      await onSuccess?.();
    } catch (error) {
      if (error?.errorFields) throw error;
      message.error(error?.message || "Failed to save Footer");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ update: save }));

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;

  const colorOptions = [
    { label: "Light text", value: "rgba(250, 246, 239, 0.82)" },
    { label: "Dark navy", value: "#211E30" },
    ...themeColorOptions.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  ];

  const renderLinks = (name) => (
    <Form.List name={name}>
      {(fields, { add, remove, move }) => (
        <SortableFormList
          fields={fields}
          add={add}
          remove={remove}
          move={move}
          itemLabel="Link"
          addButtonText="Add link"
          defaultAddPayload={{ label: "", url: "", target: "_self" }}
          renderItemContent={(fieldName, rest) => (
            <>
              <Form.Item {...rest} name={[fieldName, "label"]} label="Label" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item {...rest} name={[fieldName, "url"]} label="URL" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item {...rest} name={[fieldName, "target"]} label="Target">
                <Select options={LINK_TARGET_OPTIONS} />
              </Form.Item>
            </>
          )}
        />
      )}
    </Form.List>
  );

  return (
    <Form form={form} layout="vertical" disabled={saving}>
      <Collapse
        defaultActiveKey={["brand"]}
        items={[
          {
            key: "brand",
            label: "Brand",
            children: (
              <>
                <Form.Item name="footerLogoUrl" label="Logo"><MediaPickerInput /></Form.Item>
                <Form.Item name="footerLogoHref" label="Logo link URL"><Input /></Form.Item>
                <Form.Item name="footerLogoTarget" label="Logo link target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item>
                <Form.Item name="footerDescription" label="Organisation description"><Input.TextArea rows={4} /></Form.Item>
              </>
            ),
          },
          {
            key: "contact",
            label: "Contact",
            children: (
              <>
                <Form.Item name="footerContactTitle" label="Column title"><Input /></Form.Item>
                <Form.Item name="footerAddress" label="Address"><Input.TextArea rows={3} /></Form.Item>
                <Form.Item name="footerEmail" label="Email"><Input /></Form.Item>
                <Form.Item name="footerEmailTarget" label="Email target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item>
                <Form.Item name="footerPhone" label="Phone"><Input /></Form.Item>
                <Form.Item name="footerPhoneTarget" label="Phone target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item>
              </>
            ),
          },
          {
            key: "column-1",
            label: "Link Column 1",
            children: <><Form.Item name="footerCol1Title" label="Title"><Input /></Form.Item>{renderLinks("footerCol1Links")}</>,
          },
          {
            key: "column-2",
            label: "Link Column 2",
            children: <><Form.Item name="footerCol2Title" label="Title"><Input /></Form.Item>{renderLinks("footerCol2Links")}</>,
          },
          {
            key: "social",
            label: "Social Links",
            children: (
              <Form.List name="footerSocialLinks">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Social link"
                    addButtonText="Add social link"
                    defaultAddPayload={{ platform: "website", url: "", target: "_self" }}
                    renderItemContent={(fieldName, rest) => (
                      <>
                        <Form.Item {...rest} name={[fieldName, "platform"]} label="Platform" rules={[{ required: true }]}><Select options={SOCIAL_OPTIONS} /></Form.Item>
                        <Form.Item {...rest} name={[fieldName, "url"]} label="URL" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item {...rest} name={[fieldName, "target"]} label="Target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item>
                      </>
                    )}
                  />
                )}
              </Form.List>
            ),
          },
          {
            key: "legal",
            label: "Copyright & Legal Links",
            children: (
              <>
                <Form.Item name="footerCopyrightText" label="Copyright text"><Input /></Form.Item>
                <Row gutter={16}>
                  <Col span={24}><Form.Item name="footerPrivacyLabel" label="Privacy label"><Input /></Form.Item></Col>
                  <Col span={24}><Form.Item name="footerPrivacyUrl" label="Privacy URL"><Input /></Form.Item></Col>
                  <Col span={24}><Form.Item name="footerPrivacyTarget" label="Privacy target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item></Col>
                  <Col span={24}><Form.Item name="footerRefundLabel" label="Refund label"><Input /></Form.Item></Col>
                  <Col span={24}><Form.Item name="footerRefundUrl" label="Refund URL"><Input /></Form.Item></Col>
                  <Col span={24}><Form.Item name="footerRefundTarget" label="Refund target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item></Col>
                </Row>
              </>
            ),
          },
          {
            key: "colors",
            label: "Background & Colors",
            children: (
              <>
                <ColorSettingsCard options={colorOptions} items={[
                  { name: "footerBgColorKey", label: "Footer background", tooltip: "Footer background color." },
                  { name: "footerTextColorKey", label: "Text color", tooltip: "Footer content text color." },
                  { name: "footerCopyrightBarColorKey", label: "Bottom bar background", tooltip: "Copyright bar background color." },
                ]} />
                <Form.Item name="footerBackgroundImageUrl" label="Optional background image"><MediaPickerInput /></Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(AppearanceFooterEditForm);
