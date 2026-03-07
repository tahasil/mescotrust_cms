"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Select, Switch, Button, Row, Col, Collapse, message, Spin } from "antd";
import { DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

/**
 * Edit form for HomeHero — used in page builder drawer or component edit.
 * When source="page": data comes from block.props (pages collection); save updates layout only, not components collection.
 * When used on component edit: loads/saves via /api/theme/home-hero (components collection).
 * Exposes update() via ref for drawer header button.
 */
function HomeHeroEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const isPageBlock = source === "page";

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      // Page block: use block props from pages collection; only fetch theme for color options
      const data = initialDataProp ?? {};
      const slides = Array.isArray(data?.homeHeroSlides)
        ? data.homeHeroSlides.map((s) => ({
            bgImageUrl: s?.bgImageUrl != null ? String(s.bgImageUrl).trim() : "",
            title: s?.title != null ? String(s.title).trim() : "",
            description: s?.description != null ? String(s.description).trim() : "",
            buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
            buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
            showButton: s?.showButton !== false,
          }))
        : [];
      form.setFieldsValue({
        homeHeroSlides: slides,
        homeHeroSliderTitleColorKey: data?.homeHeroSliderTitleColorKey != null ? String(data.homeHeroSliderTitleColorKey).trim() : "",
        homeHeroSliderDescColorKey: data?.homeHeroSliderDescColorKey != null ? String(data.homeHeroSliderDescColorKey).trim() : "",
        homeHeroSliderButtonBgColorKey: data?.homeHeroSliderButtonBgColorKey != null ? String(data.homeHeroSliderButtonBgColorKey).trim() : "",
        homeHeroSliderButtonTextColorKey: data?.homeHeroSliderButtonTextColorKey != null ? String(data.homeHeroSliderButtonTextColorKey).trim() : "",
        ...getManageSectionInitialValues("homeHero", data),
      });
      fetch("/api/theme", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : {}))
        .then((theme) => {
          const palette = theme?.themePalette || {};
          const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
          const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
          setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    Promise.all([
      fetch("/api/theme/home-hero", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([hero, theme]) => {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));

        const slides = Array.isArray(hero?.homeHeroSlides)
          ? hero.homeHeroSlides.map((s) => ({
              bgImageUrl: s?.bgImageUrl != null ? String(s.bgImageUrl).trim() : "",
              title: s?.title != null ? String(s.title).trim() : "",
              description: s?.description != null ? String(s.description).trim() : "",
              buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
              buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
              showButton: s?.showButton !== false,
            }))
          : [];
        form.setFieldsValue({
          homeHeroSlides: slides,
          homeHeroSliderTitleColorKey: hero?.homeHeroSliderTitleColorKey != null ? String(hero.homeHeroSliderTitleColorKey).trim() : "",
          homeHeroSliderDescColorKey: hero?.homeHeroSliderDescColorKey != null ? String(hero.homeHeroSliderDescColorKey).trim() : "",
          homeHeroSliderButtonBgColorKey: hero?.homeHeroSliderButtonBgColorKey != null ? String(hero.homeHeroSliderButtonBgColorKey).trim() : "",
          homeHeroSliderButtonTextColorKey: hero?.homeHeroSliderButtonTextColorKey != null ? String(hero.homeHeroSliderButtonTextColorKey).trim() : "",
          ...getManageSectionInitialValues("homeHero", hero),
        });
      })
      .catch(() => message.error("Failed to load Home Hero"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawSlides = values.homeHeroSlides ?? [];
      const slides = Array.isArray(rawSlides)
        ? rawSlides.map((s) => ({
            bgImageUrl: s?.bgImageUrl != null ? String(s.bgImageUrl).trim() : "",
            title: s?.title != null ? String(s.title).trim() : "",
            description: s?.description != null ? String(s.description).trim() : "",
            buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
            buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
            showButton: s?.showButton !== false,
          }))
        : [];
      const payload = {
        homeHeroSlides: slides,
        homeHeroSliderTitleColorKey: values.homeHeroSliderTitleColorKey != null ? String(values.homeHeroSliderTitleColorKey).trim() : "",
        homeHeroSliderDescColorKey: values.homeHeroSliderDescColorKey != null ? String(values.homeHeroSliderDescColorKey).trim() : "",
        homeHeroSliderButtonBgColorKey: values.homeHeroSliderButtonBgColorKey != null ? String(values.homeHeroSliderButtonBgColorKey).trim() : "",
        homeHeroSliderButtonTextColorKey: values.homeHeroSliderButtonTextColorKey != null ? String(values.homeHeroSliderButtonTextColorKey).trim() : "",
        homeHeroBackgroundContainer: "full",
        homeHeroContentContainer: "pageContainer",
        ...getManageSectionPayload("homeHero", values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch("/api/theme/home-hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Home Hero saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save Home Hero"))
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
    <>
      <Form form={form} layout="vertical">
        <Collapse
          defaultActiveKey={[]}
          items={[
            {
              key: "section",
              label: "Manage Section",
              children: <ManageSectionFields prefix="homeHero" form={form} themeColorOptions={themeColorOptions} />,
            },
            {
              key: "title",
              label: "Title & Colors",
              children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("HomeHero")} />,
            },
            {
              key: "slider",
              label: "Manage Slides",
              children: (
                <Form.List name="homeHeroSlides">
                  {(fields, { add, remove, move }) => (
                    <SortableFormList
                      fields={fields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="Slide"
                      addButtonText="Add slide"
                      defaultAddPayload={{ bgImageUrl: "", title: "", description: "", buttonText: "Contact Us", buttonLink: "/contact", showButton: true }}
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
                            <Form.Item {...restField} name={[name, "bgImageUrl"]} label="Background image URL">
                              <Input placeholder="e.g. /images/slider.png" size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "title"]} label="Title">
                              <Input placeholder="Title" size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "description"]} label="Description">
                              <Input.TextArea rows={2} placeholder="Description" size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "buttonText"]} label="Button label">
                              <Input placeholder="e.g. Contact Us" size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "buttonLink"]} label="Button link">
                              <Input placeholder="/contact" size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "showButton"]} label="Show button" valuePropName="checked">
                              <Switch />
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
    </>
  );
}

export default forwardRef(HomeHeroEditForm);
