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
  Collapse,
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
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const [themePaletteData, setThemePaletteData] = useState({
    themePalette: {},
    colors: [],
  });
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
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme.themePalette || {};
        const customColors = Array.isArray(theme.colors) ? theme.colors : [];
        setThemePaletteData({ themePalette: palette, colors: customColors });
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(
          names.map((name) => ({ label: name, value: name })),
        );
        form.setFieldsValue({
          siteTitle: theme.siteTitle ?? "Mesco Trust",
          logoType: theme.logoType ?? "text",
          logoLightUrl: theme.logoLightUrl || theme.logoImageUrl || "",
          logoMobileUrl: theme.logoMobileUrl ?? "",
          headerVolunteerLabel: theme.headerVolunteerLabel ?? "Volunteer",
          headerVolunteerHref: theme.headerVolunteerHref ?? "/volunteer",
          headerVolunteerIconUrl: theme.headerVolunteerIconUrl ?? "",
          headerVolunteerIconUrlMobile:
            theme.headerVolunteerIconUrlMobile ?? "",
          headerDonateLabel: theme.headerDonateLabel ?? "Donate Now",
          headerDonateHref: theme.headerDonateHref ?? "/donate",
          headerDonateIconUrl: theme.headerDonateIconUrl ?? "",
          headerDonateIconUrlMobile: theme.headerDonateIconUrlMobile ?? "",
          headerBgColorKey: theme.headerBgColorKey ?? "headerBg",
          headerCtaBgColorKey: theme.headerCtaBgColorKey ?? "headerCta",
          headerCtaTextColorKey: theme.headerCtaTextColorKey ?? "primary",
          headerDonateBgColorKey: theme.headerDonateBgColorKey ?? "gradient",
          headerDonateTextColorKey: theme.headerDonateTextColorKey ?? "white",
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
            logoMobileUrl: values.logoMobileUrl?.trim() || "",
            logoImageUrl: values.logoLightUrl?.trim() || "",
            headerVolunteerLabel:
              values.headerVolunteerLabel?.trim() || "Volunteer",
            headerVolunteerHref:
              values.headerVolunteerHref?.trim() || "/volunteer",
            headerVolunteerIconUrl: values.headerVolunteerIconUrl?.trim() || "",
            headerVolunteerIconUrlMobile:
              values.headerVolunteerIconUrlMobile?.trim() || "",
            headerDonateLabel: values.headerDonateLabel?.trim() || "Donate Now",
            headerDonateHref: values.headerDonateHref?.trim() || "/donate",
            headerDonateIconUrl: values.headerDonateIconUrl?.trim() || "",
            headerDonateIconUrlMobile:
              values.headerDonateIconUrlMobile?.trim() || "",
            headerBgColorKey: values.headerBgColorKey ?? "headerBg",
            headerCtaBgColorKey: values.headerCtaBgColorKey ?? "headerCta",
            headerCtaTextColorKey: values.headerCtaTextColorKey ?? "primary",
            headerDonateBgColorKey: values.headerDonateBgColorKey ?? "gradient",
            headerDonateTextColorKey:
              values.headerDonateTextColorKey ?? "white",
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

        {isHeader && (
          <>
            {themeLoading ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <>
                <Divider />
                <div className="mt-5">
                  <HeaderPreviewBlock
                    form={form}
                    themePaletteData={themePaletteData}
                  />
                </div>

                <Collapse
                  className="mt-4"
                  defaultActiveKey={[]}
                  items={[
                    {
                      key: "logo",
                      label: "Logo",
                      children: (
                        <Row gutter={24}>
                          <Col xs={24} md={8}>
                            <Form.Item name="logoType" label="Logo type">
                              <Select options={LOGO_TYPE_OPTIONS} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="siteTitle"
                              label="Site title (when logo type is Text)"
                            >
                              <Input placeholder="Mesco Trust" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="logoLightUrl"
                              label="Desktop logo image URL"
                            >
                              <Input placeholder="/images/logo.svg" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="logoMobileUrl"
                              label="Mobile logo image URL (optional)"
                            >
                              <Input placeholder="/images/logo-mobile.svg" />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "volunteer",
                      label: "Volunteer button",
                      children: (
                        <Row gutter={24}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerVolunteerLabel"
                              label="Label (text)"
                            >
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
                              label="Desktop icon image URL"
                            >
                              <Input placeholder="/images/volunteer-icon.svg" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerVolunteerIconUrlMobile"
                              label="Mobile icon image URL (optional)"
                            >
                              <Input placeholder="/images/volunteer-icon-mobile.svg" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerCtaBgColorKey"
                              label="Button background color"
                            >
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerCtaTextColorKey"
                              label="Button text color"
                            >
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "donate",
                      label: "Donate button",
                      children: (
                        <Row gutter={24}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerDonateLabel"
                              label="Label (text)"
                            >
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
                              label="Desktop icon image URL"
                            >
                              <Input placeholder="/images/donate-now-icon.svg" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerDonateIconUrlMobile"
                              label="Mobile icon image URL (optional)"
                            >
                              <Input placeholder="/images/donate-now-icon-mobile.svg" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerDonateBgColorKey"
                              label="Button background color"
                            >
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="headerDonateTextColorKey"
                              label="Button text color"
                            >
                              <Select
                                options={themeColorOptions}
                                placeholder="Select from Theme"
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "colors",
                      label: "Header colors (mobile menu)",
                      children: (
                        <>
                          <Button
                            type="default"
                            size="small"
                            style={{ marginBottom: 12 }}
                            onClick={() => {
                              setThemeLoading(true);
                              fetch("/api/theme", { cache: "no-store" })
                                .then((res) => (res.ok ? res.json() : {}))
                                .then((theme) => {
                                  const palette = theme.themePalette || {};
                                  const customColors = Array.isArray(
                                    theme.colors,
                                  )
                                    ? theme.colors
                                    : [];
                                  setThemePaletteData({
                                    themePalette: palette,
                                    colors: customColors,
                                  });
                                  const names = [
                                    ...new Set([
                                      ...Object.keys(palette),
                                      ...customColors
                                        .map((c) => c?.name)
                                        .filter(Boolean),
                                    ]),
                                  ].sort();
                                  setThemeColorOptions(
                                    names.map((name) => ({
                                      label: name,
                                      value: name,
                                    })),
                                  );
                                  message.success(
                                    "Colors list updated from Theme",
                                  );
                                })
                                .catch(() =>
                                  message.error("Failed to refresh colors"),
                                )
                                .finally(() => setThemeLoading(false));
                            }}
                            loading={themeLoading}
                          >
                            Refresh colors from Theme
                          </Button>
                          <Row gutter={24}>
                            <Col xs={24} md={8}>
                              <Form.Item
                                name="headerBgColorKey"
                                label="Mobile menu / bar background"
                              >
                                <Select
                                  options={themeColorOptions}
                                  placeholder="Select from Theme"
                                  style={{ width: "100%" }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      ),
                    },
                  ]}
                />
              </>
            )}
          </>
        )}

        <Card className="mt-4">
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="displayName" label="Display name">
                <Input placeholder="e.g. Header" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="position"
                label="Position (when shown on all pages)"
              >
                <Select options={POSITION_OPTIONS} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </>
  );
}

function resolveThemeColorFromPalette(paletteData, key) {
  if (!key) return "";
  const palette = paletteData?.themePalette || {};
  if (palette[key] != null && String(palette[key]).trim() !== "")
    return String(palette[key]).trim();
  const custom = paletteData?.colors || [];
  const found = custom.find(
    (c) => c && String(c.name).trim() === String(key).trim(),
  );
  return found && found.value != null ? String(found.value).trim() : "";
}

function HeaderPreviewBlock({ form, themePaletteData }) {
  const siteTitle = Form.useWatch("siteTitle", form) ?? "Mesco Trust";
  const logoType = Form.useWatch("logoType", form) ?? "text";
  const logoLightUrl = Form.useWatch("logoLightUrl", form) ?? "";
  const logoMobileUrl = Form.useWatch("logoMobileUrl", form) ?? "";
  const volunteerLabel =
    Form.useWatch("headerVolunteerLabel", form) ?? "Volunteer";
  const volunteerHref =
    Form.useWatch("headerVolunteerHref", form) ?? "/volunteer";
  const volunteerIconUrl = Form.useWatch("headerVolunteerIconUrl", form) ?? "";
  const volunteerIconUrlMobile =
    Form.useWatch("headerVolunteerIconUrlMobile", form) ?? "";
  const donateLabel = Form.useWatch("headerDonateLabel", form) ?? "Donate Now";
  const donateHref = Form.useWatch("headerDonateHref", form) ?? "/donate";
  const donateIconUrl = Form.useWatch("headerDonateIconUrl", form) ?? "";
  const donateIconUrlMobile =
    Form.useWatch("headerDonateIconUrlMobile", form) ?? "";
  const headerBgColorKey =
    Form.useWatch("headerBgColorKey", form) ?? "headerBg";
  const headerCtaBgColorKey =
    Form.useWatch("headerCtaBgColorKey", form) ?? "headerCta";
  const headerCtaTextColorKey =
    Form.useWatch("headerCtaTextColorKey", form) ?? "primary";
  const headerDonateBgColorKey =
    Form.useWatch("headerDonateBgColorKey", form) ?? "gradient";
  const headerDonateTextColorKey =
    Form.useWatch("headerDonateTextColorKey", form) ?? "white";

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
        logoMobileUrl={logoMobileUrl || undefined}
        logoImageUrl={logoLightUrl}
        logoDarkUrl=""
        volunteerLabel={volunteerLabel}
        volunteerHref={volunteerHref}
        volunteerIconUrl={volunteerIconUrl || undefined}
        volunteerIconUrlMobile={volunteerIconUrlMobile || undefined}
        donateLabel={donateLabel}
        donateHref={donateHref}
        donateIconUrl={donateIconUrl || undefined}
        donateIconUrlMobile={donateIconUrlMobile || undefined}
        headerBgValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerBgColorKey,
        )}
        headerCtaBgValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerCtaBgColorKey,
        )}
        headerCtaTextValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerCtaTextColorKey,
        )}
        headerDonateBgValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerDonateBgColorKey,
        )}
        headerDonateTextValue={resolveThemeColorFromPalette(
          themePaletteData,
          headerDonateTextColorKey,
        )}
      />
    </div>
  );
}
