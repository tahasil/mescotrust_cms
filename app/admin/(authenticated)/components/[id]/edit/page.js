"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Form,
  Input,
  Select,
  Switch,
  Button,
  Card,
  message,
  Spin,
  Row,
  Col,
  Divider,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import Link from "next/link";
import dynamic from "next/dynamic";

const HeaderPreview = dynamic(() => import("@/components/site/Header"), {
  ssr: false,
});

const POSITION_OPTIONS = [
  { value: "before", label: "Above content (e.g. header)" },
  { value: "after", label: "Below content (e.g. footer)" },
];

const LOGO_TYPE_OPTIONS = [
  { value: "text", label: "Text (site title)" },
  { value: "image", label: "Image" },
];

export default function AdminComponentEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState(null);
  const [themeLoading, setThemeLoading] = useState(false);
  const [form] = Form.useForm();

  const isHeader = record?.componentId === "Header";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch("/api/admin/site-components")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const found = list.find((c) => c.componentId === id);
        if (!found) {
          message.error("Component not found");
          router.push("/admin/components");
          return;
        }
        setRecord(found);
        form.setFieldsValue({
          displayName: found.displayName || found.componentId,
          global: found.global === true,
          position: found.position || "before",
        });
      })
      .catch(() => {
        message.error("Failed to load component");
        router.push("/admin/components");
      })
      .finally(() => setLoading(false));
  }, [id, form, router]);

  useEffect(() => {
    if (!isHeader) return;
    setThemeLoading(true);
    fetch("/api/theme")
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        form.setFieldsValue({
          siteTitle: theme.siteTitle ?? "Mesco Trust",
          logoType: theme.logoType ?? "text",
          logoLightUrl: theme.logoLightUrl || theme.logoImageUrl || "",
          headerVolunteerLabel: theme.headerVolunteerLabel ?? "Volunteer",
          headerVolunteerHref: theme.headerVolunteerHref ?? "/volunteer",
          headerVolunteerIconUrl: theme.headerVolunteerIconUrl ?? "",
          headerDonateLabel: theme.headerDonateLabel ?? "Donate Now",
          headerDonateHref: theme.headerDonateHref ?? "/donate",
          headerDonateIconUrl: theme.headerDonateIconUrl ?? "",
        });
      })
      .catch(() => message.error("Failed to load theme"))
      .finally(() => setThemeLoading(false));
  }, [isHeader, form]);

  const handleSubmit = async () => {
    if (!record?.componentId) return;
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (isHeader) {
        const themeRes = await fetch("/api/theme", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteTitle: values.siteTitle?.trim() || "Mesco Trust",
            logoType: values.logoType || "text",
            logoLightUrl: values.logoLightUrl?.trim() || "",
            logoImageUrl: values.logoLightUrl?.trim() || "",
            headerVolunteerLabel:
              values.headerVolunteerLabel?.trim() || "Volunteer",
            headerVolunteerHref:
              values.headerVolunteerHref?.trim() || "/volunteer",
            headerVolunteerIconUrl: values.headerVolunteerIconUrl?.trim() || "",
            headerDonateLabel: values.headerDonateLabel?.trim() || "Donate Now",
            headerDonateHref: values.headerDonateHref?.trim() || "/donate",
            headerDonateIconUrl: values.headerDonateIconUrl?.trim() || "",
          }),
        });
        if (!themeRes.ok) {
          const err = await themeRes.json().catch(() => ({}));
          message.error(err.error || "Failed to save header content");
          setSaving(false);
          return;
        }
      }

      const res = await fetch(
        `/api/admin/site-components/${record.componentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: values.displayName?.trim() || record.componentId,
            global: values.global,
            position: values.position,
            order: record.order ?? 0,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Update failed");
        setSaving(false);
        return;
      }
      message.success("Component updated");
      router.push("/admin/components");
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!record) return null;

  return (
    <>
      <Form form={form} layout="vertical">
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/admin/components">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                aria-label="Back to components"
              />
            </Link>
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              Edit {record.displayName || record.componentId}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, color: "#666" }}>
              Show on all pages
            </span>
            <Form.Item name="global" noStyle valuePropName="checked">
              <Switch />
            </Form.Item>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={saving}
            >
              Save
            </Button>
          </div>
        </div>
        <Card className="mb-4">
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item name="displayName" label="Display name">
                <Input placeholder="e.g. Header" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="position"
                label="Position (when shown on all pages)"
              >
                <Select options={POSITION_OPTIONS} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {isHeader && (
          <Card title="Header visual editor">
            <p style={{ marginBottom: 16, color: "#666", fontSize: 13 }}>
              Edit logo and buttons below; changes update in the live preview
              above.
            </p>
            {themeLoading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#666",
                      marginBottom: 8,
                    }}
                  >
                    Live preview
                  </div>
                  <HeaderPreviewBlock form={form} />
                </div>
                <Divider />
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#666",
                    marginBottom: 12,
                  }}
                >
                  Logo
                </div>
                <Row gutter={24}>
                  <Col xs={24} md={8}>
                    <Form.Item name="logoType" label="Logo type">
                      <Select options={LOGO_TYPE_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="siteTitle" label="Site title (text logo)">
                      <Input placeholder="Mesco Trust" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="logoLightUrl" label="Logo image URL">
                      <Input placeholder="/images/logo.svg" />
                    </Form.Item>
                  </Col>
                </Row>
                <Divider />
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#666",
                    marginBottom: 12,
                  }}
                >
                  Volunteer button
                </div>
                <Row gutter={24}>
                  <Col xs={24} md={8}>
                    <Form.Item name="headerVolunteerLabel" label="Label">
                      <Input placeholder="Volunteer" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="headerVolunteerHref" label="Link">
                      <Input placeholder="/volunteer" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="headerVolunteerIconUrl"
                      label="Icon image URL"
                    >
                      <Input placeholder="/images/volunteer-icon.svg" />
                    </Form.Item>
                  </Col>
                </Row>
                <Divider />
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#666",
                    marginBottom: 12,
                  }}
                >
                  Donate button
                </div>
                <Row gutter={24}>
                  <Col xs={24} md={8}>
                    <Form.Item name="headerDonateLabel" label="Label">
                      <Input placeholder="Donate Now" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="headerDonateHref" label="Link">
                      <Input placeholder="/donate" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="headerDonateIconUrl"
                      label="Icon image URL"
                    >
                      <Input placeholder="/images/donate-now-icon.svg" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </Card>
        )}
      </Form>
    </>
  );
}

function HeaderPreviewBlock({ form }) {
  const siteTitle = Form.useWatch("siteTitle", form) ?? "Mesco Trust";
  const logoType = Form.useWatch("logoType", form) ?? "text";
  const logoLightUrl = Form.useWatch("logoLightUrl", form) ?? "";
  const volunteerLabel =
    Form.useWatch("headerVolunteerLabel", form) ?? "Volunteer";
  const volunteerHref =
    Form.useWatch("headerVolunteerHref", form) ?? "/volunteer";
  const volunteerIconUrl = Form.useWatch("headerVolunteerIconUrl", form) ?? "";
  const donateLabel = Form.useWatch("headerDonateLabel", form) ?? "Donate Now";
  const donateHref = Form.useWatch("headerDonateHref", form) ?? "/donate";
  const donateIconUrl = Form.useWatch("headerDonateIconUrl", form) ?? "";

  return (
    <div
      style={{
        position: "relative",
        border: "1px solid #e8e8e8",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fafafa",
        minHeight: 64,
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <HeaderPreview
        preview
        menuItems={[]}
        siteTitle={siteTitle}
        logoType={logoType}
        logoLightUrl={logoLightUrl}
        logoImageUrl={logoLightUrl}
        logoDarkUrl=""
        volunteerLabel={volunteerLabel}
        volunteerHref={volunteerHref}
        volunteerIconUrl={volunteerIconUrl || undefined}
        donateLabel={donateLabel}
        donateHref={donateHref}
        donateIconUrl={donateIconUrl || undefined}
      />
    </div>
  );
}
