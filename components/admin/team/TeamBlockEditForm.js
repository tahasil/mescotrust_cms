"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Collapse, Form, Select, Switch, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const PREFIX = "team";

function toText(value) {
  return value != null ? String(value).trim() : "";
}

function normalizeAlign(value) {
  const normalized = toText(value).toLowerCase();
  if (normalized === "left" || normalized === "center" || normalized === "right") {
    return normalized;
  }
  return "left";
}

function normalizeBlockValues(data = {}) {
  const source = data && typeof data === "object" ? data : {};
  const showCategoryName =
    source.teamShowCategoryName != null
      ? source.teamShowCategoryName !== false
      : source.showCategoryTabs !== false;

  return {
    ...getManageSectionInitialValues(PREFIX, source),
    teamCategoryIds: Array.isArray(source.teamCategoryIds)
      ? source.teamCategoryIds
      : [],
    teamShowAllCategories:
      source.teamShowAllCategories != null
        ? source.teamShowAllCategories !== false
        : true,
    teamShowCategoryName: showCategoryName,
    teamViewMode:
      source.teamViewMode === "slider" || source.layoutType === "slider"
        ? "slider"
        : "grid",
    mainTitle: toText(source.mainTitle || source.teamMainTitle) || "Meet The Team",
    titleAlign: normalizeAlign(
      source.titleAlign || source.mainTitleAlign || source.teamMainTitleAlign,
    ),
    teamTextColorKey: toText(
      source.teamTextColorKey || source.teamMemberNameColorKey,
    ),
    titleColorKey: toText(source.titleColorKey || source.teamTitleColorKey),
    teamButtonColorKey: toText(
      source.teamButtonColorKey || source.teamTabActiveBgColorKey,
    ),
    teamDescriptionColorKey: toText(
      source.teamDescriptionColorKey ||
        source.teamMemberDesignationColorKey ||
        source.teamMemberBioColorKey,
    ),
    teamSocialIconColorKey: toText(
      source.teamSocialIconColorKey || source.teamSocialLinkColorKey,
    ),
  };
}

function TeamBlockEditForm(
  { source, initialData, onSaveToPage, themeColorOptions: themeColorOptionsProp = [] },
  ref,
) {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  const showAllCategories = Form.useWatch("teamShowAllCategories", form);

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
    }
  }, [themeColorOptionsProp]);

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0 || themeFetchedForColorsRef.current) return;
    themeFetchedForColorsRef.current = true;
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((color) => color?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch("/api/admin/team-categories?active=1")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (ignore) return;
        setCategories(Array.isArray(data?.items) ? data.items : []);
        form.setFieldsValue(normalizeBlockValues(initialData));
      })
      .catch(() => {
        if (ignore) return;
        setCategories([]);
        form.setFieldsValue(normalizeBlockValues(initialData));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [form, initialData]);

  const categoryOptions = useMemo(
    () =>
      categories.map((item) => ({
        label: item.name,
        value: item._id,
      })),
    [categories],
  );

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const payload = {
          teamCategoryIds: Array.isArray(values.teamCategoryIds)
            ? values.teamCategoryIds
            : [],
          teamShowAllCategories: values.teamShowAllCategories !== false,
          teamShowCategoryName: values.teamShowCategoryName !== false,
          teamViewMode: values.teamViewMode === "slider" ? "slider" : "grid",
          mainTitle: toText(values.mainTitle),
          titleAlign: normalizeAlign(values.titleAlign),
          teamTextColorKey: toText(values.teamTextColorKey),
          titleColorKey: toText(values.titleColorKey),
          teamButtonColorKey: toText(values.teamButtonColorKey),
          teamDescriptionColorKey: toText(values.teamDescriptionColorKey),
          teamSocialIconColorKey: toText(values.teamSocialIconColorKey),
          ...getManageSectionPayload(PREFIX, values),
        };

        if (isPageBlock && onSaveToPage) {
          onSaveToPage(payload);
          message.success("Team block updated for this page");
        }
      })
      .catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [form]);

  if (loading) return null;

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage-section", "title-colors", "settings"]}
        items={[
          {
            key: "manage-section",
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
            key: "title-colors",
            label: "Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("Team")}
              />
            ),
          },
          {
            key: "settings",
            label: "Team Settings",
            children: (
              <>
                <Form.Item
                  name="teamShowAllCategories"
                  label="Show All Categories"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="teamCategoryIds"
                  label="Select Categories"
                  extra={
                    showAllCategories
                      ? "Disabled because Show All Categories is enabled."
                      : "Choose one or more categories."
                  }
                >
                  <Select
                    mode="multiple"
                    options={categoryOptions}
                    placeholder="Select categories"
                    disabled={showAllCategories}
                  />
                </Form.Item>

                <Form.Item
                  name="teamShowCategoryName"
                  label="Show Category Name"
                  valuePropName="checked"
                  extra="When enabled, categories will be shown as clickable tabs."
                >
                  <Switch />
                </Form.Item>

                <Form.Item name="teamViewMode" label="Layout">
                  <Select
                    options={[
                      { label: "Grid", value: "grid" },
                      { label: "Slider", value: "slider" },
                    ]}
                  />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(TeamBlockEditForm);

