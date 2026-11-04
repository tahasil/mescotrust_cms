"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Collapse, Form, Select, Switch, Spin, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import { DEFAULT_FAQ_CATEGORIES } from "@/lib/faqDefaults";

const PREFIX = "faqs";

function normalizeInitialValues(data = {}) {
  const input = data && typeof data === "object" ? data : {};
  const isTitleEn = !(input.faqsTitleEnabled === false || input.titleEnabled === false || input.faqsTitleEnabled === "false" || input.titleEnabled === "false");
  const isSubTitleEn = !(input.faqsSubTitleEnabled === false || input.subTitleEnabled === false || input.faqsSubTitleEnabled === "false" || input.subTitleEnabled === "false");

  return {
    mainTitle: input.mainTitle ?? "Frequently Asked Questions",
    subTitle: input.subTitle ?? "Got Questions? We Have Answers",
    faqsTitleEnabled: isTitleEn,
    titleEnabled: isTitleEn,
    faqsSubTitleEnabled: isSubTitleEn,
    subTitleEnabled: isSubTitleEn,
    faqsSubTitleColorKey: input.faqsSubTitleColorKey ?? "",
    faqsMainTitleColorKey: input.faqsMainTitleColorKey ?? "",
    faqsCategoryBtnBgColorKey: input.faqsCategoryBtnBgColorKey ?? "",
    faqsCategoryBtnTextColorKey: input.faqsCategoryBtnTextColorKey ?? "",
    faqsCategoryActiveBtnBgColorKey: input.faqsCategoryActiveBtnBgColorKey ?? "",
    faqsCategoryActiveBtnTextColorKey: input.faqsCategoryActiveBtnTextColorKey ?? "",
    faqsQuestionTextColorKey: input.faqsQuestionTextColorKey ?? "",
    faqsAnswerTextColorKey: input.faqsAnswerTextColorKey ?? "",
    faqsCardBgColorKey: input.faqsCardBgColorKey ?? "",
    faqsCardBorderColorKey: input.faqsCardBorderColorKey ?? "",
    faqsCardHoverBorderColorKey: input.faqsCardHoverBorderColorKey ?? "",
    faqsActiveQuestionTextColorKey: input.faqsActiveQuestionTextColorKey ?? "",
    faqsActiveIconBgColorKey: input.faqsActiveIconBgColorKey ?? "",
    faqsActiveIconTextColorKey: input.faqsActiveIconTextColorKey ?? "",
    faqsDefaultCategory: input.faqsDefaultCategory ?? "all",
    faqsShowSearch: input.faqsShowSearch !== false,
    faqsShowTabs: input.faqsShowTabs !== false,
    ...getManageSectionInitialValues(PREFIX, input),
  };
}

function FaqsEditForm(
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
  const [loading, setLoading] = useState(false);
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
          ...new Set([
            ...Object.keys(palette),
            ...custom.map((entry) => entry?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    form.setFieldsValue(normalizeInitialValues(initialDataProp ?? {}));
  }, [form, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const isTitleEn = !(values.faqsTitleEnabled === false || values.titleEnabled === false || values.faqsTitleEnabled === "false" || values.titleEnabled === "false");
        const isSubTitleEn = !(values.faqsSubTitleEnabled === false || values.subTitleEnabled === false || values.faqsSubTitleEnabled === "false" || values.subTitleEnabled === "false");

        const payload = {
          ...values,
          mainTitle: String(values.mainTitle || "Frequently Asked Questions").trim(),
          subTitle: String(values.subTitle || "Got Questions? We Have Answers").trim(),
          faqsTitleEnabled: isTitleEn,
          titleEnabled: isTitleEn,
          faqsSubTitleEnabled: isSubTitleEn,
          subTitleEnabled: isSubTitleEn,
          faqsSubTitleColorKey: values.faqsSubTitleColorKey || "",
          faqsMainTitleColorKey: values.faqsMainTitleColorKey || "",
          faqsCategoryBtnBgColorKey: values.faqsCategoryBtnBgColorKey || "",
          faqsCategoryBtnTextColorKey: values.faqsCategoryBtnTextColorKey || "",
          faqsCategoryActiveBtnBgColorKey: values.faqsCategoryActiveBtnBgColorKey || "",
          faqsCategoryActiveBtnTextColorKey: values.faqsCategoryActiveBtnTextColorKey || "",
          faqsQuestionTextColorKey: values.faqsQuestionTextColorKey || "",
          faqsAnswerTextColorKey: values.faqsAnswerTextColorKey || "",
          faqsCardBgColorKey: values.faqsCardBgColorKey || "",
          faqsCardBorderColorKey: values.faqsCardBorderColorKey || "",
          faqsCardHoverBorderColorKey: values.faqsCardHoverBorderColorKey || "",
          faqsActiveQuestionTextColorKey: values.faqsActiveQuestionTextColorKey || "",
          faqsActiveIconBgColorKey: values.faqsActiveIconBgColorKey || "",
          faqsActiveIconTextColorKey: values.faqsActiveIconTextColorKey || "",
          faqsDefaultCategory: values.faqsDefaultCategory || "all",
          faqsShowSearch: values.faqsShowSearch !== false,
          faqsShowTabs: values.faqsShowTabs !== false,
          ...getManageSectionPayload(PREFIX, values),
        };

        if (isPageBlock && onSaveToPage) {
          onSaveToPage(payload);
          message.success("Changes will be saved with the page");
          onSuccess?.();
          return;
        }

        // Global component save
        setSaving(true);
        fetch(`/api/admin/site-components/Faqs`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((res) => {
            if (!res.ok) return res.json().then((d) => Promise.reject(d));
            return null;
          })
          .then(() => {
            message.success("FAQs component settings saved");
            onSuccess?.();
          })
          .catch((err) => message.error(err?.error || "Failed to save"))
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

  const categoryOptions = [
    { label: "All Categories (Interactive Tabs)", value: "all" },
    ...DEFAULT_FAQ_CATEGORIES.map((c) => ({ label: c, value: c })),
  ];

  return (
    <Form preserve={true} form={form} layout="vertical" disabled={saving}>
      <Collapse
        destroyInactivePanel={false}
        defaultActiveKey={["title-colors", "content"]}
        items={[
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("Faqs")}
              />
            ),
          },
          {
            key: "content",
            label: "Content Settings",
            children: (
              <>
                <Form.Item
                  name="faqsDefaultCategory"
                  label="Category Focus"
                  extra="Choose 'All Categories' for full FAQ page, or a specific category for a programme page."
                >
                  <Select options={categoryOptions} />
                </Form.Item>
                <Form.Item
                  name="faqsShowSearch"
                  label="Show Search Bar"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  name="faqsShowTabs"
                  label="Show Category Tabs (when All Categories selected)"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </>
            ),
          },
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
        ]}
      />
    </Form>
  );
}

export default forwardRef(FaqsEditForm);
