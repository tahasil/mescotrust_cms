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
  { dataEndpoint, themeColorOptions = [], onSuccess, onValuesChange },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menus, setMenus] = useState([]);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(dataEndpoint, { cache: "no-store" }).then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("Failed to load Header")),
      ),
      fetch("/api/admin/menus", { cache: "no-store" }).then((response) =>
        response.ok ? response.json() : [],
      ),
      fetch("/api/admin/pages?limit=200&fields=title,slug,status&includeTotal=0", {
        cache: "no-store",
      }).then((response) => (response.ok ? response.json() : { items: [] })),
    ])
      .then(([record, menuList, pagesData]) => {
        setMenus(Array.isArray(menuList) ? menuList : []);
        setPages(Array.isArray(pagesData?.items) ? pagesData.items : []);
        form.setFieldsValue({
          logoType: record?.logoType === "text" ? "text" : "image",
          logoLightUrl: record?.logoLightUrl || "",
          logoMobileUrl: record?.logoMobileUrl || "",
          logoUrl: record?.logoUrl || "/",
          logoTarget: normalizeTarget(record?.logoTarget),
          menuName: record?.menuName || "Primary Menu",
          headerMembershipEnabled: record?.headerMembershipEnabled !== false,
          headerMembershipLabel: record?.headerMembershipLabel || "Membership",
          headerMembershipHref: record?.headerMembershipHref || "/membership",
          headerMembershipHrefTarget: normalizeTarget(
            record?.headerMembershipHrefTarget,
          ),
          headerMembershipBgColorKey:
            record?.headerMembershipBgColorKey || "#ffffff",
          headerMembershipTextColorKey:
            record?.headerMembershipTextColorKey || "#A82D2D",
          headerMembershipHoverBgColorKey:
            record?.headerMembershipHoverBgColorKey || "#FDF1F1",
          headerMembershipHoverTextColorKey:
            record?.headerMembershipHoverTextColorKey || "#A82D2D",
          headerMembershipBorderColorKey:
            record?.headerMembershipBorderColorKey || "#A82D2D",
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
          headerSearchBgColorKey:
            record?.headerSearchBgColorKey || "transparent",
          headerSearchTextColorKey:
            record?.headerSearchTextColorKey || "#1a1a1a",
          headerSearchHoverBgColorKey:
            record?.headerSearchHoverBgColorKey || "#ffffff",
          headerSearchHoverTextColorKey:
            record?.headerSearchHoverTextColorKey || "#1a1a1a",
          headerVolunteerLabel: record?.headerVolunteerLabel || "Volunteer",
          headerVolunteerHref: record?.headerVolunteerHref || "",
          headerVolunteerHrefTarget: normalizeTarget(
            record?.headerVolunteerHrefTarget,
          ),
          headerVolunteerIconUrl: record?.headerVolunteerIconUrl || "/images/volunteer-icon.svg",
          headerDonateLabel: record?.headerDonateLabel || "Donate Now",
          headerDonateHref: record?.headerDonateHref || "",
          headerDonateHrefTarget: normalizeTarget(
            record?.headerDonateHrefTarget,
          ),
          headerDonateIconUrl: record?.headerDonateIconUrl || "/images/donate-now-icon.svg",
          headerBgColorKey:
            record?.headerBgColorKey || "#ffffff",
          headerNavTextColorKey:
            record?.headerNavTextColorKey || "#1a1a1a",
          headerCtaBgColorKey: record?.headerCtaBgColorKey || "#FDF1F1",
          headerCtaTextColorKey: record?.headerCtaTextColorKey || "#A82D2D",
          headerCtaHoverBgColorKey:
            record?.headerCtaHoverBgColorKey || "#FDF1F1",
          headerCtaHoverTextColorKey:
            record?.headerCtaHoverTextColorKey || "#A82D2D",
          headerDonateBgColorKey:
            record?.headerDonateBgColorKey || "#A82D2D",
          headerDonateTextColorKey:
            record?.headerDonateTextColorKey || "#ffffff",
          headerDonateHoverBgColorKey:
            record?.headerDonateHoverBgColorKey || "#8C1C13",
          headerDonateHoverTextColorKey:
            record?.headerDonateHoverTextColorKey || "#ffffff",
          headerResponsiveButtonBorderColorKey:
            record?.headerResponsiveButtonBorderColorKey || "#A82D2D",
          headerDesktopSearchBorderColorKey:
            record?.headerDesktopSearchBorderColorKey || "rgba(0,0,0,.12)",
          headerResponsiveVolunteerIconColorKey:
            record?.headerResponsiveVolunteerIconColorKey || "#A82D2D",
          headerResponsiveVolunteerCircleBgColorKey:
            record?.headerResponsiveVolunteerCircleBgColorKey || "#ffffff",
          headerResponsiveDonateIconColorKey:
            record?.headerResponsiveDonateIconColorKey || "#ffffff",
          headerResponsiveDonateCircleBgColorKey:
            record?.headerResponsiveDonateCircleBgColorKey || "#A82D2D",
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
        headerSearchBgColorKey: String(
          values.headerSearchBgColorKey || "",
        ).trim(),
        headerSearchTextColorKey: String(
          values.headerSearchTextColorKey || "",
        ).trim(),
        headerSearchHoverBgColorKey: String(
          values.headerSearchHoverBgColorKey || "",
        ).trim(),
        headerSearchHoverTextColorKey: String(
          values.headerSearchHoverTextColorKey || "",
        ).trim(),
        headerMembershipEnabled: values.headerMembershipEnabled !== false,
        headerMembershipLabel: String(values.headerMembershipLabel || "").trim(),
        headerMembershipHref: String(values.headerMembershipHref || "").trim(),
        headerMembershipHrefTarget: normalizeTarget(
          values.headerMembershipHrefTarget,
        ),
        headerMembershipBgColorKey: String(
          values.headerMembershipBgColorKey || "",
        ).trim(),
        headerMembershipTextColorKey: String(
          values.headerMembershipTextColorKey || "",
        ).trim(),
        headerMembershipHoverBgColorKey: String(
          values.headerMembershipHoverBgColorKey || "",
        ).trim(),
        headerMembershipHoverTextColorKey: String(
          values.headerMembershipHoverTextColorKey || "",
        ).trim(),
        headerMembershipBorderColorKey: String(
          values.headerMembershipBorderColorKey || "",
        ).trim(),
        headerVolunteerLabel: String(values.headerVolunteerLabel || "").trim(),
        headerVolunteerHref: String(values.headerVolunteerHref || "").trim(),
        headerVolunteerHrefTarget: normalizeTarget(
          values.headerVolunteerHrefTarget,
        ),
        headerVolunteerIconUrl: String(values.headerVolunteerIconUrl || "").trim(),
        headerDonateLabel: String(values.headerDonateLabel || "").trim(),
        headerDonateHref: String(values.headerDonateHref || "").trim(),
        headerDonateHrefTarget: normalizeTarget(values.headerDonateHrefTarget),
        headerDonateIconUrl: String(values.headerDonateIconUrl || "").trim(),
        headerBgColorKey: String(values.headerBgColorKey || "").trim(),
        headerNavTextColorKey: String(values.headerNavTextColorKey || "").trim(),
        headerCtaBgColorKey: String(values.headerCtaBgColorKey || "").trim(),
        headerCtaTextColorKey: String(values.headerCtaTextColorKey || "").trim(),
        headerCtaHoverBgColorKey: String(
          values.headerCtaHoverBgColorKey || "",
        ).trim(),
        headerCtaHoverTextColorKey: String(
          values.headerCtaHoverTextColorKey || "",
        ).trim(),
        headerDonateBgColorKey: String(
          values.headerDonateBgColorKey || "",
        ).trim(),
        headerDonateTextColorKey: String(
          values.headerDonateTextColorKey || "",
        ).trim(),
        headerDonateHoverBgColorKey: String(
          values.headerDonateHoverBgColorKey || "",
        ).trim(),
        headerDonateHoverTextColorKey: String(
          values.headerDonateHoverTextColorKey || "",
        ).trim(),
        headerResponsiveButtonBorderColorKey: String(
          values.headerResponsiveButtonBorderColorKey || "",
        ).trim(),
        headerDesktopSearchBorderColorKey: String(
          values.headerDesktopSearchBorderColorKey || "",
        ).trim(),
        headerResponsiveVolunteerIconColorKey: String(
          values.headerResponsiveVolunteerIconColorKey || "",
        ).trim(),
        headerResponsiveVolunteerCircleBgColorKey: String(
          values.headerResponsiveVolunteerCircleBgColorKey || "",
        ).trim(),
        headerResponsiveDonateIconColorKey: String(
          values.headerResponsiveDonateIconColorKey || "",
        ).trim(),
        headerResponsiveDonateCircleBgColorKey: String(
          values.headerResponsiveDonateCircleBgColorKey || "",
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
    { label: "Transparent", value: "transparent" },
    { label: "White", value: "#ffffff" },
    { label: "Dark text", value: "#1a1a1a" },
    { label: "Volunteer pink", value: "#FDF1F1" },
    { label: "Brand red", value: "#A82D2D" },
    { label: "Hover red", value: "#8C1C13" },
    { label: "Light border", value: "rgba(0,0,0,.12)" },
    { label: "Translucent navy", value: "rgba(27, 24, 38, 0.72)" },
    { label: "Header cream", value: "#faf6ef" },
    ...themeColorOptions.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  ];

  return (
    <Form
      preserve={true}
      form={form}
      layout="vertical"
      disabled={saving}
      onValuesChange={(_, allValues) => onValuesChange?.(allValues)}
    >
      <Collapse
        destroyInactivePanel={false}
        defaultActiveKey={[]}
        items={[
          {
            key: "brand",
            forceRender: true,
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
            forceRender: true,
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
            forceRender: true,
            label: "Search",
            children: (
              <>
                <SwitchSettingsCard items={[{ name: "headerSearchEnabled", label: "Show Search button", tooltip: "Display the search control in the Header." }]} />
                <Form.Item name="headerSearchLabel" label="Button label"><Input /></Form.Item>
                <Form.Item name="headerSearchPlaceholder" label="Input placeholder"><Input /></Form.Item>
                <Form.Item name="headerSearchBgColorKey" label="Background color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerSearchTextColorKey" label="Text/icon color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerSearchHoverBgColorKey" label="Hover background color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerSearchHoverTextColorKey" label="Hover text/icon color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Collapse
                  destroyInactivePanel={false}
                  defaultActiveKey={[]}
                  size="small"
                  items={[{
                    forceRender: true,
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
            key: "membership-button",
            forceRender: true,
            label: "Membership Button",
            children: (
              <>
                <SwitchSettingsCard
                  items={[
                    {
                      name: "headerMembershipEnabled",
                      label: "Show Membership button",
                      tooltip: "Display the Membership action button in the Header and mobile drawer.",
                    },
                  ]}
                />
                <Form.Item
                  name="headerMembershipLabel"
                  label="Membership label"
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!getFieldValue("headerMembershipEnabled")) return Promise.resolve();
                        if (!String(value || "").trim()) {
                          return Promise.reject(new Error("Membership label is required when enabled"));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input placeholder="Membership" />
                </Form.Item>
                <Form.Item
                  label="Select internal page"
                  tooltip="Optionally select a CMS page to populate the destination URL."
                >
                  <Select
                    allowClear
                    showSearch
                    placeholder="Choose an internal page"
                    optionFilterProp="label"
                    options={pages.map((p) => {
                      const slugVal = String(p?.slug || "").replace(/^\/+|\/+$/g, "");
                      const url = !slugVal || slugVal === "home" ? "/" : `/${slugVal}`;
                      return {
                        value: url,
                        label: `${p.title || "Untitled"} (${url})`,
                      };
                    })}
                    onChange={(val) => {
                      if (val) {
                        form.setFieldsValue({ headerMembershipHref: val });
                        onValuesChange?.(form.getFieldsValue(true));
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item
                  name="headerMembershipHref"
                  label="Membership URL"
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!getFieldValue("headerMembershipEnabled")) return Promise.resolve();
                        const link = String(value || "").trim();
                        if (!link) {
                          return Promise.reject(new Error("Destination URL is required when enabled"));
                        }
                        if (
                          link.startsWith("/") ||
                          link.startsWith("#") ||
                          /^(https?:|mailto:|tel:)/i.test(link)
                        ) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Enter a valid relative path (e.g. /membership) or URL (https://...)"),
                        );
                      },
                    }),
                  ]}
                >
                  <Input placeholder="/membership" />
                </Form.Item>
                <Form.Item name="headerMembershipHrefTarget" label="Link target">
                  <Select options={LINK_TARGET_OPTIONS} />
                </Form.Item>
                <Form.Item name="headerMembershipBgColorKey" label="Background color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerMembershipTextColorKey" label="Text color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerMembershipHoverBgColorKey" label="Hover background color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerMembershipHoverTextColorKey" label="Hover text color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerMembershipBorderColorKey" label="Border color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "volunteer-button",
            forceRender: true,
            label: "Volunteer Button",
            children: (
              <>
                <Form.Item name="headerVolunteerLabel" label="Volunteer label"><Input /></Form.Item>
                <Form.Item name="headerVolunteerHref" label="Volunteer URL"><Input /></Form.Item>
                <Form.Item name="headerVolunteerHrefTarget" label="Volunteer target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item>
                <Form.Item
                  name="headerVolunteerIconUrl"
                  label="Volunteer icon"
                  tooltip="Used in the desktop pill button and the mobile header circle button."
                >
                  <MediaPickerInput />
                </Form.Item>
                <Form.Item name="headerCtaBgColorKey" label="Background color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerCtaTextColorKey" label="Text/icon color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerCtaHoverBgColorKey" label="Hover background color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerCtaHoverTextColorKey" label="Hover text/icon color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "donate-button",
            forceRender: true,
            label: "Donate Button",
            children: (
              <>
                <Form.Item name="headerDonateLabel" label="Donate label"><Input /></Form.Item>
                <Form.Item name="headerDonateHref" label="Donate URL"><Input /></Form.Item>
                <Form.Item name="headerDonateHrefTarget" label="Donate target"><Select options={LINK_TARGET_OPTIONS} /></Form.Item>
                <Form.Item
                  name="headerDonateIconUrl"
                  label="Donate icon"
                  tooltip="Used in the desktop pill button and the mobile header circle button."
                >
                  <MediaPickerInput />
                </Form.Item>
                <Form.Item name="headerDonateBgColorKey" label="Background color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerDonateTextColorKey" label="Text/icon color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerDonateHoverBgColorKey" label="Hover background color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
                <Form.Item name="headerDonateHoverTextColorKey" label="Hover text/icon color">
                  <Select showSearch allowClear options={colorOptions} optionFilterProp="label" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "colors",
            forceRender: true,
            label: "Colors",
            children: (
              <ColorSettingsCard
                options={colorOptions}
                items={[
                  {
                    name: "headerBgColorKey",
                    label: "Navigation background",
                    tooltip: "Header navigation background color.",
                  },
                  {
                    name: "headerNavTextColorKey",
                    label: "Menu text color",
                    tooltip: "Primary navigation menu link text color.",
                  },
                  {
                    name: "headerResponsiveButtonBorderColorKey",
                    label: "Responsive button border",
                    tooltip:
                      "Border color for circular Volunteer and Donate icon buttons on mobile and tablet.",
                  },
                  {
                    name: "headerDesktopSearchBorderColorKey",
                    label: "Search Button Border",
                    tooltip: "Border color for the Search button in the desktop header.",
                  },
                ]}
              />
            ),
          },
          {
            key: "responsive-buttons",
            forceRender: true,
            label: "Responsive Buttons",
            children: (
              <ColorSettingsCard
                options={colorOptions}
                title="Volunteer & Donate (mobile/tablet)"
                items={[
                  {
                    name: "headerResponsiveVolunteerIconColorKey",
                    label: "Volunteer Icon Color",
                    tooltip:
                      "Icon color for the circular Volunteer button on mobile and tablet.",
                  },
                  {
                    name: "headerResponsiveVolunteerCircleBgColorKey",
                    label: "Volunteer Circle Background",
                    tooltip:
                      "Background color for the circular Volunteer button on mobile and tablet.",
                  },
                  {
                    name: "headerResponsiveDonateIconColorKey",
                    label: "Donate Now Icon Color",
                    tooltip:
                      "Icon color for the circular Donate Now button on mobile and tablet.",
                  },
                  {
                    name: "headerResponsiveDonateCircleBgColorKey",
                    label: "Donate Now Circle Background",
                    tooltip:
                      "Background color for the circular Donate Now button on mobile and tablet.",
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(AppearanceHeaderEditForm);
