"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/DonorTestimonials";
const PREFIX = "donorTestimonials";

const DEFAULT_ITEMS = [
  {
    quote: "Would like to take this as an opportunity to thank MESCO for having accepted myself into its family and feel honoured to be associated now as a donor, proud to have been onboard with such a great organization since long back, and hope myself to carry and continue the same throughout.",
    name: "Mr. Mohsin Izhar Ahmed Shaikh",
    role: "Education Sponsor",
  },
  {
    quote: "MESCO is one such catalyst from the cluster of organizations working in development sector in Mumbai for last 50 years with an objective of working for the social upliftment of the backward section of the society.",
    name: "Ravinder S. Lohia",
    role: "PMO Manager, Nokia",
  },
  {
    quote: "It's almost 3 decades that I came to know about the good work MESCO was doing. I was impressed about their sincerity, transparency and passion.",
    name: "Mr. Kader Sopariwala",
    role: "Chairman Sopariwala Exports",
  },
];

function normalizeItem(it) {
  return {
    quote: it?.quote != null ? String(it.quote).trim() : "",
    name: it?.name != null ? String(it.name).trim() : "",
    role: it?.role != null ? String(it.role).trim() : "",
  };
}

function DonorTestimonialsEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      const items = Array.isArray(data?.donorTestimonialsItems)
        ? data.donorTestimonialsItems.map(normalizeItem)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "",
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        donorTestimonialsTitleEnabled: data?.donorTestimonialsTitleEnabled !== false,
        donorTestimonialsSubTitleEnabled: data?.donorTestimonialsSubTitleEnabled !== false,
        donorTestimonialsSubTitleColorKey: data?.donorTestimonialsSubTitleColorKey != null ? String(data.donorTestimonialsSubTitleColorKey).trim() : "",
        donorTestimonialsQuoteIconColorKey: data?.donorTestimonialsQuoteIconColorKey != null ? String(data.donorTestimonialsQuoteIconColorKey).trim() : "",
        donorTestimonialsNameColorKey: data?.donorTestimonialsNameColorKey != null ? String(data.donorTestimonialsNameColorKey).trim() : "",
        donorTestimonialsQuoteTextColorKey: data?.donorTestimonialsQuoteTextColorKey != null ? String(data.donorTestimonialsQuoteTextColorKey).trim() : "",
        donorTestimonialsRoleColorKey: data?.donorTestimonialsRoleColorKey != null ? String(data.donorTestimonialsRoleColorKey).trim() : "",
        donorTestimonialsItems: items.length > 0 ? items : DEFAULT_ITEMS.map(normalizeItem),
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
      } else {
        setLoading(false);
      }
      return;
    }
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => setFormAndColors(data, theme))
      .catch(() => message.error("Failed to load Donor Testimonials"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.donorTestimonialsItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        donorTestimonialsTitleEnabled: values.donorTestimonialsTitleEnabled !== false,
        donorTestimonialsSubTitleEnabled: values.donorTestimonialsSubTitleEnabled !== false,
        donorTestimonialsSubTitleColorKey: values.donorTestimonialsSubTitleColorKey != null ? String(values.donorTestimonialsSubTitleColorKey).trim() : "",
        donorTestimonialsQuoteIconColorKey: values.donorTestimonialsQuoteIconColorKey != null ? String(values.donorTestimonialsQuoteIconColorKey).trim() : "",
        donorTestimonialsNameColorKey: values.donorTestimonialsNameColorKey != null ? String(values.donorTestimonialsNameColorKey).trim() : "",
        donorTestimonialsQuoteTextColorKey: values.donorTestimonialsQuoteTextColorKey != null ? String(values.donorTestimonialsQuoteTextColorKey).trim() : "",
        donorTestimonialsRoleColorKey: values.donorTestimonialsRoleColorKey != null ? String(values.donorTestimonialsRoleColorKey).trim() : "",
        donorTestimonialsItems: items,
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
        .then((res) => { if (!res.ok) return res.json().then((d) => Promise.reject(d)); })
        .then(() => { message.success("Donor Testimonials saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["items"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("DonorTestimonials")} />,
          },
          {
            key: "items",
            label: "Manage Testimonials",
            children: (
              <Form.List name="donorTestimonialsItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Testimonial"
                    addButtonText="Add testimonial"
                    defaultAddPayload={{
                      quote: "",
                      name: "",
                      role: "",
                    }}
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
                          <Form.Item
                            {...restField}
                            name={[name, "quote"]}
                            label="Quote"
                            rules={[{ required: true, message: "Quote is required" }]}
                          >
                            <Input.TextArea rows={4} placeholder="Donor testimonial text..." size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "name"]}
                            label="Name"
                            rules={[{ required: true, message: "Name is required" }]}
                          >
                            <Input placeholder="e.g. Mr. Mohsin Shaikh" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "role"]} label="Role / Title">
                            <Input placeholder="e.g. Education Sponsor" size="large" />
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

export default forwardRef(DonorTestimonialsEditForm);
