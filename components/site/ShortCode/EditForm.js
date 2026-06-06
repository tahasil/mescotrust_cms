"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Alert,
  Collapse,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  SHORTCODE_MODULE_COMPONENTS,
  SHORTCODE_SLIDER_COMPONENTS,
  SHORTCODE_SOURCE_OPTIONS,
  buildShortcodeFromSelection,
  inferShortcodeSelection,
  normalizeShortcodeText,
} from "@/lib/shortcode";

const API_PATH = "/api/theme/ShortCode";
const PREFIX = "shortCode";

/**
 * Edit form for ShortCode - used in component edit drawer.
 * Includes Manage Section (background/padding) and Title & Colors by default.
 * Loads/saves via API_PATH (Component defaultProps).
 */
function ShortCodeEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    onCancel,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [formsList, setFormsList] = useState([]);
  const [popupList, setPopupList] = useState([]);
  const [shortcodeLookupsError, setShortcodeLookupsError] = useState("");
  const isPageBlock = source === "page";
  const shortcodeSourceType = Form.useWatch("shortCodeSourceType", form) || "manual";

  function titleCaseFromId(value) {
    return String(value || "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim();
  }

  function getSelectedShortcodeValue(values, sourceType) {
    if (sourceType === "form") return normalizeShortcodeText(values.shortCodeSelectedForm).toLowerCase();
    if (sourceType === "slider") return normalizeShortcodeText(values.shortCodeSelectedSlider);
    if (sourceType === "popup") return normalizeShortcodeText(values.shortCodeSelectedPopup);
    if (sourceType === "component") return normalizeShortcodeText(values.shortCodeSelectedComponent);
    return "";
  }

  function normalizeInitialValues(data) {
    const input = data && typeof data === "object" ? data : {};
    const inferred = inferShortcodeSelection(input.shortcode || input.shortCode || "");
    const sourceType = normalizeShortcodeText(input.shortCodeSourceType || inferred.sourceType || "manual") || "manual";
    const selectedForm = normalizeShortcodeText(input.shortCodeSelectedForm || inferred.formShortcode).toLowerCase();
    const selectedSlider = normalizeShortcodeText(input.shortCodeSelectedSlider || inferred.sliderComponentId);
    const selectedPopup = normalizeShortcodeText(input.shortCodeSelectedPopup || inferred.popupComponentId);
    const selectedComponent = normalizeShortcodeText(input.shortCodeSelectedComponent || inferred.moduleComponentId);
    const selectedValue =
      sourceType === "form"
        ? selectedForm
        : sourceType === "slider"
          ? selectedSlider
          : sourceType === "popup"
            ? selectedPopup
            : sourceType === "component"
              ? selectedComponent
              : "";
    const configuredShortcode = normalizeShortcodeText(
      input.shortcode || input.shortCode || buildShortcodeFromSelection(sourceType, selectedValue),
    );

    return {
      mainTitle: input.mainTitle ?? "Section Title",
      subTitle: input.subTitle ?? "Subtitle",
      shortCodeTitleEnabled: input.shortCodeTitleEnabled !== false,
      shortCodeSubTitleEnabled: input.shortCodeSubTitleEnabled !== false,
      shortCodeSubTitleColorKey: input.shortCodeSubTitleColorKey ?? "",
      shortCodeMainTitleColorKey: input.shortCodeMainTitleColorKey ?? "",
      shortCodeCardBgColorKey: input.shortCodeCardBgColorKey ?? "",
      shortCodeCardTextColorKey: input.shortCodeCardTextColorKey ?? "",
      shortCodeCardBorderColorKey: input.shortCodeCardBorderColorKey ?? "",
      shortCodeSourceType: sourceType,
      shortCodeSelectedForm: selectedForm,
      shortCodeSelectedSlider: selectedSlider,
      shortCodeSelectedPopup: selectedPopup,
      shortCodeSelectedComponent: selectedComponent,
      shortcode: configuredShortcode,
      ...getManageSectionInitialValues(PREFIX, input),
      ...input,
    };
  }

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
        const names = [...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    let cancelled = false;

    async function loadShortcodeLookups() {
      const errors = [];

      try {
        const formsRes = await fetch("/api/admin/forms?page=1&limit=100", {
          cache: "no-store",
        });
        const formsData = await formsRes.json().catch(() => ({}));
        if (!formsRes.ok) {
          throw new Error(formsData?.error || "Failed to load forms");
        }
        if (!cancelled) {
          setFormsList(Array.isArray(formsData?.items) ? formsData.items : []);
        }
      } catch (err) {
        errors.push(err?.message || "Failed to load forms");
        if (!cancelled) setFormsList([]);
      }

      try {
        const popupsRes = await fetch("/api/admin/popups?page=1&limit=100", {
          cache: "no-store",
        });
        const popupsData = await popupsRes.json().catch(() => ({}));
        if (!popupsRes.ok) {
          throw new Error(popupsData?.error || "Failed to load popups");
        }
        if (!cancelled) {
          setPopupList(Array.isArray(popupsData?.items) ? popupsData.items : []);
        }
      } catch (err) {
        errors.push(err?.message || "Failed to load popups");
        if (!cancelled) setPopupList([]);
      }

      if (!cancelled) {
        setShortcodeLookupsError(errors.join(" | "));
      }
    }

    loadShortcodeLookups();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      form.setFieldsValue(normalizeInitialValues(initialDataProp ?? {}));
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        form.setFieldsValue(normalizeInitialValues(data));
      })
      .catch(() => message.error("Failed to load ShortCode"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const setShortcodeTemplateValue = (sourceType, value) => {
    const nextShortcode = buildShortcodeFromSelection(sourceType, value);
    if (nextShortcode) {
      form.setFieldValue("shortcode", nextShortcode);
    }
  };

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const sourceType = normalizeShortcodeText(values.shortCodeSourceType || "manual") || "manual";
      const selectedValue = getSelectedShortcodeValue(values, sourceType);
      const shortcode =
        normalizeShortcodeText(values.shortcode) ||
        buildShortcodeFromSelection(sourceType, selectedValue);
      const payload = {
        ...values,
        mainTitle: normalizeShortcodeText(values.mainTitle || "Section Title"),
        subTitle: normalizeShortcodeText(values.subTitle || "Subtitle"),
        shortCodeSourceType: sourceType,
        shortCodeSelectedForm: normalizeShortcodeText(values.shortCodeSelectedForm).toLowerCase(),
        shortCodeSelectedSlider: normalizeShortcodeText(values.shortCodeSelectedSlider),
        shortCodeSelectedPopup: normalizeShortcodeText(values.shortCodeSelectedPopup),
        shortCodeSelectedComponent: normalizeShortcodeText(values.shortCodeSelectedComponent),
        shortcode,
        shortCodeTitleEnabled: values.shortCodeTitleEnabled !== false,
        shortCodeSubTitleEnabled: values.shortCodeSubTitleEnabled !== false,
        shortCodeSubTitleColorKey: normalizeShortcodeText(values.shortCodeSubTitleColorKey),
        shortCodeMainTitleColorKey: normalizeShortcodeText(values.shortCodeMainTitleColorKey),
        shortCodeCardBgColorKey: normalizeShortcodeText(values.shortCodeCardBgColorKey),
        shortCodeCardTextColorKey: normalizeShortcodeText(values.shortCodeCardTextColorKey),
        shortCodeCardBorderColorKey: normalizeShortcodeText(values.shortCodeCardBorderColorKey),
        ...getManageSectionPayload(PREFIX, values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Short Code saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage-section", "title-colors", "content"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("ShortCode")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                {shortcodeLookupsError ? (
                  <Alert
                    type="warning"
                    showIcon
                    message={shortcodeLookupsError}
                    style={{ marginBottom: 16 }}
                  />
                ) : null}

                <Form.Item name="shortCodeSourceType" label="Shortcode Source">
                  <Select
                    options={SHORTCODE_SOURCE_OPTIONS}
                    placeholder="Select source type"
                  />
                </Form.Item>

                {shortcodeSourceType === "form" ? (
                  <Form.Item name="shortCodeSelectedForm" label="Select Form">
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Choose a form shortcode"
                      options={(formsList || [])
                        .map((item) => {
                          const shortcode = normalizeShortcodeText(item?.shortcode).toLowerCase();
                          if (!shortcode) return null;
                          const name = normalizeShortcodeText(item?.name || "Untitled Form");
                          const status = normalizeShortcodeText(item?.status || "draft");
                          return {
                            value: shortcode,
                            label: `${name} (${shortcode}) [${status}]`,
                            name,
                            shortcode,
                            status,
                          };
                        })
                        .filter(Boolean)}
                      optionRender={(option) => {
                        const data = option?.data || {};
                        return (
                          <Space size={8}>
                            <Typography.Text>{data.name}</Typography.Text>
                            <Typography.Text code>{data.shortcode}</Typography.Text>
                            <Tag color={data.status === "published" ? "green" : "default"}>
                              {data.status || "draft"}
                            </Tag>
                          </Space>
                        );
                      }}
                      onChange={(value) => setShortcodeTemplateValue("form", value)}
                    />
                  </Form.Item>
                ) : null}

                {shortcodeSourceType === "slider" ? (
                  <Form.Item name="shortCodeSelectedSlider" label="Select Slider Module">
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Choose a slider"
                      options={SHORTCODE_SLIDER_COMPONENTS.map((item) => ({
                        value: item,
                        label: titleCaseFromId(item),
                      }))}
                      onChange={(value) => setShortcodeTemplateValue("slider", value)}
                    />
                  </Form.Item>
                ) : null}

                {shortcodeSourceType === "popup" ? (
                  <Form.Item name="shortCodeSelectedPopup" label="Select Popup">
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Choose a popup"
                      options={(popupList || [])
                        .map((item) => {
                          const componentId = normalizeShortcodeText(item?.componentId);
                          if (!componentId) return null;
                          const displayName = normalizeShortcodeText(
                            item?.displayName || item?.componentId || "Popup",
                          );
                          const status = normalizeShortcodeText(item?.status || "draft");
                          return {
                            value: componentId,
                            label: `${displayName} (${componentId}) [${status}]`,
                            displayName,
                            componentId,
                            status,
                          };
                        })
                        .filter(Boolean)}
                      optionRender={(option) => {
                        const data = option?.data || {};
                        return (
                          <Space size={8}>
                            <Typography.Text>{data.displayName}</Typography.Text>
                            <Typography.Text code>{data.componentId}</Typography.Text>
                            <Tag color={data.status === "published" ? "green" : "default"}>
                              {data.status || "draft"}
                            </Tag>
                          </Space>
                        );
                      }}
                      onChange={(value) => setShortcodeTemplateValue("popup", value)}
                    />
                  </Form.Item>
                ) : null}

                {shortcodeSourceType === "component" ? (
                  <Form.Item name="shortCodeSelectedComponent" label="Select Module">
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Choose a module"
                      options={SHORTCODE_MODULE_COMPONENTS.map((item) => ({
                        value: item,
                        label: titleCaseFromId(item),
                      }))}
                      onChange={(value) => setShortcodeTemplateValue("component", value)}
                    />
                  </Form.Item>
                ) : null}

                <Form.Item
                  name="shortcode"
                  label="Shortcode"
                  extra={(
                    <span style={{ fontSize: 12 }}>
                      Examples: [form shortcode="volunteer-form"]
                    </span>
                  )}
                >
                  <Input placeholder='Enter shortcode, e.g. [form shortcode="volunteer-form"]' />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(ShortCodeEditForm);
