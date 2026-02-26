"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, message, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import HeaderEditorForm from "@/components/admin/HeaderEditorForm";

const DEFAULT_HEADER_PROPS = {
  sectionsOrder: "logo,nav,buttons",
  logoTitle: "MESCO",
  logoTagline: "A TRUST SINCE 1960",
  logoUrl: "/",
  logoImageWidth: 120,
  logoImageHeight: 48,
  logoImageWidthDesktop: undefined,
  logoImageHeightDesktop: undefined,
  logoImageWidthTablet: undefined,
  logoImageHeightTablet: undefined,
  logoImageWidthMobile: undefined,
  logoImageHeightMobile: undefined,
  headerBackground: "",
  headerBorderBottom: "1px solid #dee2e6",
  headerShadow: "",
  paddingY: 16,
  paddingX: 0,
  menuPosition: "left",
  menuName: "",
  navColor: "#333",
  navFontSize: 16,
  navFontWeight: "500",
  navHoverColor: "#0d6efd",
  navItemBackground: "",
  navItemHoverBackground: "",
  primaryButtonBg: "#a52a2a",
  primaryButtonText: "#fff",
  secondaryButtonBg: "#f4c4c4",
  secondaryButtonText: "#8b0000",
  navbarExpand: "lg",
  navbarFixed: "",
  navbarSticky: "",
  collapseOnSelect: false,
  navbarMobileMenu: "offcanvas",
  navbarOffcanvasPlacement: "end",
  navItems: [],
  actionButtons: [{ label: "Volunteer", url: "#", image: "" }, { label: "Donate Now", url: "#", image: "" }],
  _containerType: "container-fluid",
  _sectionBg: "",
  _sectionPadding: "",
  _sectionBorderSize: "0px 0px 0px 0px",
  _sectionBorderStyle: "solid",
  _sectionBorderColor: "",
  _sectionShadow: "",
};

export default function AdminHeaderComponentPage() {
  const router = useRouter();
  const [component, setComponent] = useState(null);
  const [headerProps, setHeaderProps] = useState(DEFAULT_HEADER_PROPS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/components/ensure/Header");
        if (cancelled) return;
        if (!res.ok) {
          router.replace("/admin/components");
          return;
        }
        const data = await res.json();
        setComponent(data);
        const layout = Array.isArray(data.layout) ? data.layout : [];
        const headerBlock = layout.find((b) => b?.baseComponent === "Header");
        const props = headerBlock?.props && typeof headerBlock.props === "object"
          ? { ...DEFAULT_HEADER_PROPS, ...headerBlock.props }
          : { ...DEFAULT_HEADER_PROPS, ...(data.defaultProps || {}) };
        setHeaderProps(props);
      } catch {
        if (!cancelled) router.replace("/admin/components");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleSave = (values) => {
    if (!component?._id) return;
    setSaving(true);
    const layout = [{ baseComponent: "Header", props: values }];
    const container = values._containerType === "container" ? "container" : "container-fluid";
    fetch(`/api/admin/components/${component._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout, container }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || "Save failed"); });
        return res.json();
      })
      .then((updated) => {
        setComponent(updated);
        const headerBlock = (updated.layout || []).find((b) => b?.baseComponent === "Header");
        if (headerBlock?.props) setHeaderProps((p) => ({ ...p, ...headerBlock.props }));
        message.success("Header saved");
      })
      .catch((e) => message.error(e.message || "Save failed"))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 280 }}>
        <Spin size="large" tip="Loading Header…" />
      </div>
    );
  }
  if (!component) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Link href="/admin/components" style={{ display: "inline-block" }}>
          <Button type="default" icon={<ArrowLeftOutlined />}>
            Back to Components
          </Button>
        </Link>
        <h1 style={{ margin: 0, fontSize: 22 }}>Header / Navbar</h1>
      </div>
      <HeaderEditorForm
        initialValues={headerProps}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
