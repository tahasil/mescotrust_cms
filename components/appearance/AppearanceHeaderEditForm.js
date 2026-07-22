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
  Select,
  Spin,
  message,
} from "antd";
import { ColorSettingsCard, SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  LINK_TARGET_OPTIONS,
  menuItemsToNavItems,
  normalizeTarget,
} from "./editorUtils";

function AppearanceHeaderEditForm(
  { dataEndpoint, themeColorOptions = [], onSuccess },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(dataEndpoint, { cache: "no-store" }).then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("Failed to load Header")),
      ),
      fetch("/api/admin/menus", { cache: "no-store" }).then((response) =>
        response.ok ? response.json() : [],
      ),
    ])
      .then(([record, menuList]) => {
        setMenus(Array.isArray(menuList) ? menuList : []);
        form.setFieldsValue({
          logoType: record?.logoType === "text" ? "text" : "image",
          logoLightUrl: record?.logoLightUrl || "",
          logoMobileUrl: record?.logoMobileUrl || "",
          logoUrl: record?.logoUrl || "/",
          logoTarget: normalizeTarget(record?.logoTarget),
          menuName: record?.menuName || "Primary Menu",
          headerSearchEnabled: record?.headerSearchEnabled !== false,
          headerSearchLabel: record?.headerSearchLabel || "Search",
          headerSearchOpenAriaLabel:
            record?.headerSearchOpenAriaLabel || "Open search",
          headerSearchPlaceholder:
            record?.headerSearchPlaceholder || "Search the website",
          headerSearchDialogLabel:
            record?.headerSearchDialogLabel || "Site search",
          headerSearchInputAriaLabel:
            record?.headerSearchInputAriaLabel || "Search",
          headerSearchCloseAriaLabel:
            record?.headerSearchCloseAriaLabel || "Close search",
          headerSearchMinCharsMessage:
            record?.headerSearchMinCharsMessage || "Enter at least 2 characters",
          headerSearchLoadingMessage:
            record?.headerSearchLoadingMessage || "Searching...",
          headerSearchNoResultsMessage:
            record?.headerSearchNoResultsMessage || "No results found for {query}",
          headerSearchErrorMessage:
            record?.headerSearchErrorMessage || "Search is temporarily unavailable",
          headerSearchResultTypePageLabel:
            record?.headerSearchResultTypePageLabel || "Page",
          headerSearchResultTypeBlogLabel:
            record?.headerSearchResultTypeBlogLabel || "Blog",
          headerSearchResultTypeEventLabel:
            record?.headerSearchResultTypeEventLabel || "Event",
          headerSearchFallbackTitle:
            record?.headerSearchFallbackTitle || "Untitled",
          headerSearchFallbackMeta: record?.headerSearchFallbackMeta || "",
          headerVolunteerLabel: record?.headerVolunteerLabel || "Volunteer",
          headerVolunteerHref: record?.headerVolunteerHref || "",
          headerVolunteerHrefTarget: normalizeTarget(
            record?.headerVolunteerHrefTarget,
          ),
          headerDonateLabel: record?.headerDonateLabel || "Donate Now",
          headerDonateHref: record?.headerDonateHref || "",
          headerDonateHrefTarget: normalizeTarget(
            record?.headerDonateHrefTarget,
          ),
          headerBgColorKey:
            record?.headerBgColorKey || "rgba(27, 24, 38, 0.72)",
          headerCtaBgColorKey: record?.headerCtaBgColorKey || "Primary Light",
          headerCtaTextColorKey: record?.headerCtaTextColorKey || "Black",
          headerDonateBgColorKey:
            record?.headerDonateBgColorKey || "#E03C33",
          headerDonateTextColorKey:
            record?.headerDonateTextColorKey || "white",
        });
      })
      .catch((error) => message.error(error?.message || "Failed to load Header"))
      .finally(() => setLoading(false));
  }, [dataEndpoint, form]);

  const save = async () => {
    await form.validateFields();
    const values = form.getFieldsValue(true);
    setSaving(true);
    try {
      let navItems = [];
      const selectedMenu = menus.find((menu) => menu?.name === values.menuName);
      if (selectedMenu?._id || selectedMenu?.name) {
        const response = await fetch(
          `/api/admin/menus/${encodeURIComponent(selectedMenu.name)}`,
          { cache: "no-store" },
        );
        if (response.ok) {
          const menu = await response.json();
          navItems = menuItemsToNavItems(menu?.items);
        }
      }

      const payload = {
        logoType: values.logoType,
        logoLightUrl: String(values.logoLightUrl || "").trim(),
        logoMobileUrl: String(values.logoMobileUrl || "").trim(),
        logoUrl: String(values.logoUrl || "").trim(),
        logoTarget: normalizeTarget(values.logoTarget),
        menuName: String(values.menuName || "").trim(),
        navItems,
        headerSearchEnabled: values.headerSearchEnabled === true,
        headerSearchLabel: String(values.headerSearchLabel || "").trim(),
        headerSearchOpenAriaLabel: String(
          values.headerSearchOpenAriaLabel || "",
        ).trim(),
        headerSearchPlaceholder: String(
          values.headerSearchPlaceholder || "",
        ).trim(),
        headerSearchDialogLabel: String(
          values.headerSearchDialogLabel || "",
        ).trim(),
        headerSearchInputAriaLabel: String(
          values.headerSearchInputAriaLabel || "",
        ).trim(),
        headerSearchCloseAriaLabel: String(
          values.headerSearchCloseAriaLabel || "",
        ).trim(),
        headerSearchMinCharsMessage: String(
          values.headerSearchMinCharsMessage || "",
        ).trim(),
        headerSearchLoadingMessage: String(
          values.headerSearchLoadingMessage || "",
        ).trim(),
        headerSearchNoResultsMessage: String(
          values.headerSearchNoResultsMessage || "",
        ).trim(),
        headerSearchErrorMessage: String(
          values.headerSearchErrorMessage || "",
        ).trim(),
        headerSearchResultTypePageLabel: String(
          values.headerSearchResultTypePageLabel || "",
        ).trim(),
        headerSearchResultTypeBlogLabel: String(
          values.headerSearchResultTypeBlogLabel || "",
        ).trim(),
        headerSearchResultTypeEventLabel: String(
          values.headerSearchResultTypeEventLabel || "",
        ).trim(),
        headerSearchFallbackTitle: String(
          values.headerSearchFallbackTitle || "",
        ).trim(),
        headerSearchFallbackMeta: String(
          values.headerSearchFallbackMeta || "",
        ).trim(),
        headerVolunteerLabel: String(values.headerVolunteerLabel || "").trim(),
        headerVolunteerHref: String(values.headerVolunteerHref || "").trim(),
        headerVolunteerHrefTarget: normalizeTarget(
          values.headerVolunteerHrefTarget,
        ),
        headerDonateLabel: String(values.headerDonateLabel || "").trim(),
        headerDonateHref: String(values.headerDonateHref || "").trim(),
        headerDonateHrefTarget: normalizeTarget(values.headerDonateHrefTarget),
        headerBgColorKey: String(values.headerBgColorKey || "").trim(),
        headerCtaBgColorKey: String(values.headerCtaBgColorKey || "").trim(),
        headerCtaTextColorKey: String(values.headerCtaTextColorKey || "").trim(),
        headerDonateBgColorKey: String(
          values.headerDonateBgColorKey || "",
        ).trim(),
        headerDonateTextColorKey: String(
          values.headerDonateTextColorKey || "",
        ).trim(),
      };
      const response = await fetch(dataEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultProps: payload, replaceDefaultProps: true }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save Header");
      }
      message.success("Header saved");
      await onSuccess?.();
    } catch (error) {
      if (error?.errorFields) throw error;
      message.error(error?.message || "Failed to save Header");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ update: save }));

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;

  const colorOptions = [
    { label: "Translucent navy", value: "rgba(27, 24, 38, 0.72)" },
    { label: "Brand red", value: "#E03C33" },
    ...themeColorOptions.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  ];

  return (
    <Form form={form} layout="vertical" disabled={saving}>
      <Collapse
        defaultActiveKey={["brand"]}
        items={[
          {
            key: "brand",
            label: "Logo",
            children: (
              <>
                <Form.Item name="logoType" label="Logo type">
                  <Select options={[{ value: "image", label: "Image" }, { value: "text", label: "Site title" }]} />
                </Form.Item>
                <Form.Item name="logoLightUrl" label="Desktop logo">
                  <MediaPickerInput />
                </Form.Item>
                <Form.Item name="logoMobileUrl" label="Tablet/mobile logo">
                  <MediaPickerInput />
                </Form.Item>
                <Form.Item name="logoUrl" label="Logo link URL">
                  <Input placeholder="/" />
                </Form.Item>
                <Form.Item name="logoTarget" label="Logo link target">
                  <Select options={LINK_TARGET_OPTIONS} />
                </Form.Item>
              </>
            ),
          },
          {
            key: "navigation",
            label: "Navigation",
            children: (
              <Form.Item
                name="menuName"
                label="Menu"
                rules={[{ required: true, message: "Select a menu" }]}
              >
                <Select options={menus.map((menu) => ({ value: menu.name, label: menu.name }))} />
              </Form.Item>
            ),
          },
          {
            key: "search",
            label: "Search",
            children: (
              <>
                <SwitchSettingsCard items={[{ name: "headerSearchEnabled", label: "Show Search button", tooltip: "Display the search control in the Header." }]} />
                <Form.Item name="headerSearchLabel" label="Button label"><Input /></Form.Item>
                <Form.Item name="headerSearchPlaceholder" label="Input placeholder"><Input /></Form.Item>
                <Collapse
                  size="small"
                  items={[{
                    key: "search-copy",
                    label: "Accessibility and result messages",
                    children: (
                      <>
                        <Form.Item name="headerSearchOpenAriaLabel" label="Open button aria-label"><Input /></Form.Item>
                        <Form.Item name="headerSearchDialogLabel" label="Dialog aria-label"><Input /></Form.Item>
                        <Form.Item name="headerSearchInputAriaLabel" label="Input aria-label"><Input /></Form.Item>
                        <Form.Item name="headerSearchCloseAriaLabel" label="Close button aria-label"><Input /></Form.Item>
                        <Form.Item name="headerSearchMinCharsMessage" label="Minimum characters message"><Input /></Form.Item>
                        <Form.Item name="headerSearchLoadingMessage" label="Loading message"><Input /></Form.Item>
                        <Form.Item name="headerSearchNoResultsMessage" label="No results message"><Input /></Form.Item>
                        <Form.Item name="headerSearchErrorMessage" label="Error message"><Input /></Form.Item>
                        <Form.Item name="headerSearchResultTypePageLabel" label="Page result label"><Input /></Form.Item>
                        <Form.Item name="headerSearchResultTypeBlogLabel" label="Blog result label"><Input /></Form.Item>
                        <Form.Item name="headerSearchResultTypeEventLabel" label="Event result label"><Input /></Form.Item>
                        <Form.Item name="headerSearchFallbackTitle" label="Fallback title"><Input /></Form.Item>
                        <Form.Item name="headerSearchFallbackMeta" label="Fallback description"><Input /></Form.Item>
                      </>
                    ),
                  }]}
                />
              </>
            ),
          },
          {
            key: "volunteer-button",
            label: "Volunteer Button",
            children: (
              <>
                <Form.Item name="headerVolunteerLabel" label="Volunteer label"><Input /></Form.Item>
                <Form.Item name="headerVolunteerHref" label="Volunteer URL"><Input /></Form.Item>
                <Form.Item name="headerVolunteerHrefTarget" label="Volunteer target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item>
                <Form.Item name="headerCtaBgColorKey" label="Tablet/mobile background">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerCtaTextColorKey" label="Tablet/mobile text">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "donate-button",
            label: "Donate Button",
            children: (
              <>
                <Form.Item name="headerDonateLabel" label="Donate label"><Input /></Form.Item>
                <Form.Item name="headerDonateHref" label="Donate URL"><Input /></Form.Item>
                <Form.Item name="headerDonateHrefTarget" label="Donate target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item>
                <Form.Item name="headerDonateBgColorKey" label="Background">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerDonateTextColorKey" label="Text">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "colors",
            label: "Colors",
            children: (
              <ColorSettingsCard
                options={colorOptions}
                items={[{ name: "headerBgColorKey", label: "Navigation background", tooltip: "Header navigation background color." }]}
              />
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(AppearanceHeaderEditForm);
