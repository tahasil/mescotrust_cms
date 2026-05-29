"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Select, Switch, Button, Row, Col, Collapse, List, InputNumber, Tooltip, message, Spin, Card } from "antd";
import { DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import PortfolioImagePickerInput from "@/components/admin/Portfolio/PortfolioImagePickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import { normalizeMapSliderConfig } from "@/lib/mapSliderAnimations";

function normalizeButtonTarget(value) {
  return value === "_blank" ? "_blank" : "_self";
}

function normalizeSlideMediaType(value) {
  if (value === "video") return "video";
  if (value === "lottie") return "lottie";
  if (value === "mapSlider") return "mapSlider";
  return "image";
}

function normalizeSlideForForm(s) {
  return {
    bgImageUrlDesktop:
      s?.bgImageUrlDesktop != null
        ? String(s.bgImageUrlDesktop).trim()
        : s?.bgImageUrl != null
          ? String(s.bgImageUrl).trim()
          : "",
    bgImageUrlMobile:
      s?.bgImageUrlMobile != null ? String(s.bgImageUrlMobile).trim() : "",
    mediaType: normalizeSlideMediaType(s?.mediaType),
    youtubeUrl:
      s?.youtubeUrl != null
        ? String(s.youtubeUrl).trim()
        : s?.videoUrl != null
          ? String(s.videoUrl).trim()
          : "",
    lottieJsonUrl: s?.lottieJsonUrl != null ? String(s.lottieJsonUrl).trim() : "",
    mapSliderConfig: normalizeMapSliderConfig(s?.mapSliderConfig, {
      defaultItemCount: 10,
    }),
    title: s?.title != null ? String(s.title).trim() : "",
    description: s?.description != null ? String(s.description).trim() : "",
    buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
    buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
    buttonTarget: normalizeButtonTarget(s?.buttonTarget),
    showButton: s?.showButton !== false,
  };
}

/**
 * Edit form for HomeHero — used in page builder drawer or component edit.
 * When source="page": data comes from block.props (pages collection); save updates layout only, not collection defaults.
 * When used on component edit: loads/saves via /api/theme/home-hero (sliders collection).
 * Exposes update() via ref for drawer header button.
 */
function HomeHeroEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
    if (isPageBlock) {
      // Page block: use block props from pages collection; only fetch theme for color options
      const data = initialDataProp ?? {};
      const slides = Array.isArray(data?.homeHeroSlides)
        ? data.homeHeroSlides.map(normalizeSlideForForm)
        : [];
      form.setFieldsValue({
        homeHeroSlides: slides,
        homeHeroSliderTitleColorKey: data?.homeHeroSliderTitleColorKey != null ? String(data.homeHeroSliderTitleColorKey).trim() : "",
        homeHeroSliderDescColorKey: data?.homeHeroSliderDescColorKey != null ? String(data.homeHeroSliderDescColorKey).trim() : "",
        homeHeroSliderButtonBgColorKey: data?.homeHeroSliderButtonBgColorKey != null ? String(data.homeHeroSliderButtonBgColorKey).trim() : "",
        homeHeroSliderButtonTextColorKey: data?.homeHeroSliderButtonTextColorKey != null ? String(data.homeHeroSliderButtonTextColorKey).trim() : "",
        homeHeroAutoplay: data?.homeHeroAutoplay ?? true,
        homeHeroShowArrows: data?.homeHeroShowArrows ?? true,
        homeHeroShowDots: data?.homeHeroShowDots ?? true,
        homeHeroAutoplaySpeed: data?.homeHeroAutoplaySpeed != null ? Number(data.homeHeroAutoplaySpeed) : 5000,
        homeHeroSpeed: data?.homeHeroSpeed != null ? Number(data.homeHeroSpeed) : 500,
        ...getManageSectionInitialValues("homeHero", data),
      });
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
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
      } else {
        setLoading(false);
      }
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
          ? hero.homeHeroSlides.map(normalizeSlideForForm)
          : [];
        form.setFieldsValue({
          homeHeroSlides: slides,
          homeHeroSliderTitleColorKey: hero?.homeHeroSliderTitleColorKey != null ? String(hero.homeHeroSliderTitleColorKey).trim() : "",
          homeHeroSliderDescColorKey: hero?.homeHeroSliderDescColorKey != null ? String(hero.homeHeroSliderDescColorKey).trim() : "",
          homeHeroSliderButtonBgColorKey: hero?.homeHeroSliderButtonBgColorKey != null ? String(hero.homeHeroSliderButtonBgColorKey).trim() : "",
          homeHeroSliderButtonTextColorKey: hero?.homeHeroSliderButtonTextColorKey != null ? String(hero.homeHeroSliderButtonTextColorKey).trim() : "",
          homeHeroAutoplay: hero?.homeHeroAutoplay ?? true,
          homeHeroShowArrows: hero?.homeHeroShowArrows ?? true,
          homeHeroShowDots: hero?.homeHeroShowDots ?? true,
          homeHeroAutoplaySpeed: hero?.homeHeroAutoplaySpeed != null ? Number(hero.homeHeroAutoplaySpeed) : 5000,
          homeHeroSpeed: hero?.homeHeroSpeed != null ? Number(hero.homeHeroSpeed) : 500,
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
        ? rawSlides.map((s) => {
            const mediaType = normalizeSlideMediaType(s?.mediaType);
            const desktopImage =
              s?.bgImageUrlDesktop != null
                ? String(s.bgImageUrlDesktop).trim()
                : s?.bgImageUrl != null
                  ? String(s.bgImageUrl).trim()
                  : "";
            const mobileImage =
              s?.bgImageUrlMobile != null
                ? String(s.bgImageUrlMobile).trim()
                : "";
            const mapSliderConfig = normalizeMapSliderConfig(s?.mapSliderConfig, {
              defaultItemCount: 10,
            });
            return {
              bgImageUrlDesktop:
                mediaType === "lottie" || mediaType === "mapSlider"
                  ? ""
                  : desktopImage,
              bgImageUrlMobile:
                mediaType === "lottie" || mediaType === "mapSlider"
                  ? ""
                  : mobileImage,
              bgImageUrl:
                mediaType === "lottie" || mediaType === "mapSlider"
                  ? ""
                  : desktopImage,
              mediaType,
              youtubeUrl:
                mediaType === "video" && s?.youtubeUrl != null
                  ? String(s.youtubeUrl).trim()
                  : "",
              lottieJsonUrl:
                mediaType === "lottie" && s?.lottieJsonUrl != null
                  ? String(s.lottieJsonUrl).trim()
                  : "",
              mapSliderConfig:
                mediaType === "mapSlider" ? mapSliderConfig : undefined,
              title: s?.title != null ? String(s.title).trim() : "",
              description: s?.description != null ? String(s.description).trim() : "",
              buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
              buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
              buttonTarget: normalizeButtonTarget(s?.buttonTarget),
              showButton: s?.showButton !== false,
            };
          })
        : [];
      const payload = {
        homeHeroSlides: slides,
        homeHeroSliderTitleColorKey: values.homeHeroSliderTitleColorKey != null ? String(values.homeHeroSliderTitleColorKey).trim() : "",
        homeHeroSliderDescColorKey: values.homeHeroSliderDescColorKey != null ? String(values.homeHeroSliderDescColorKey).trim() : "",
        homeHeroSliderButtonBgColorKey: values.homeHeroSliderButtonBgColorKey != null ? String(values.homeHeroSliderButtonBgColorKey).trim() : "",
        homeHeroSliderButtonTextColorKey: values.homeHeroSliderButtonTextColorKey != null ? String(values.homeHeroSliderButtonTextColorKey).trim() : "",
        homeHeroBackgroundContainer: "full",
        homeHeroContentContainer: "pageContainer",
        homeHeroAutoplay: values.homeHeroAutoplay !== false,
        homeHeroShowArrows: values.homeHeroShowArrows !== false,
        homeHeroShowDots: values.homeHeroShowDots !== false,
        homeHeroAutoplaySpeed: values.homeHeroAutoplaySpeed != null ? Math.max(1000, Number(values.homeHeroAutoplaySpeed)) : 5000,
        homeHeroSpeed: values.homeHeroSpeed != null ? Math.max(200, Number(values.homeHeroSpeed)) : 500,
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
          defaultActiveKey={["setting"]}
          items={[
            {
              key: "section",
              label: "Manage Section",
              children: <ManageSectionFields prefix="homeHero" form={form} themeColorOptions={themeColorOptions} />,
            },
            {
              key: "title",
              label: "Colors",
              children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("HomeHero")} />,
            },
            {
              key: "setting",
              label: "Slide Setting",
              children: (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {/* Behaviour: List with header like Ant Design - same format as Testimonials */}
                  <List
                    header={<span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>Behaviour</span>}
                    size="small"
                    bordered
                    split
                    dataSource={[
                      { key: "autoplay", name: "homeHeroAutoplay", label: "Autoplay", tooltip: "Scroll to next slide automatically" },
                      { key: "arrows", name: "homeHeroShowArrows", label: "Show arrows", tooltip: "Show prev/next navigation arrows" },
                      { key: "dots", name: "homeHeroShowDots", label: "Show dots", tooltip: "Show dot indicators for current slide" },
                    ]}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Form.Item key="switch" name={item.name} valuePropName="checked" noStyle style={{ marginBottom: 0 }}>
                            <Switch />
                          </Form.Item>,
                        ]}
                      >
                        <Tooltip title={item.tooltip}>
                          <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(0,0,0,0.65)" }}>
                            {item.label} <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                          </span>
                        </Tooltip>
                      </List.Item>
                    )}
                  />
                  {/* Speed: List with header like Ant Design - same format as Testimonials */}
                  <List
                    header={<span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>Speed</span>}
                    size="small"
                    bordered
                    split
                    dataSource={[
                      {
                        key: "autoplaySpeed",
                        name: "homeHeroAutoplaySpeed",
                        label: "Autoplay delay (ms)",
                        tooltip: "Delay between each auto scroll (milliseconds)",
                        min: 1000,
                        max: 30000,
                        step: 1000,
                      },
                      {
                        key: "transition",
                        name: "homeHeroSpeed",
                        label: "Transition (ms)",
                        tooltip: "Animation duration in milliseconds",
                        min: 200,
                        max: 2000,
                        step: 100,
                      },
                    ]}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Form.Item key="input" name={item.name} noStyle style={{ marginBottom: 0 }}>
                            <InputNumber
                              size="small"
                              min={item.min}
                              max={item.max}
                              step={item.step}
                              style={{ width: 100 }}
                            />
                          </Form.Item>,
                        ]}
                      >
                        <Tooltip title={item.tooltip}>
                          <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(0,0,0,0.65)" }}>
                            {item.label} <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                          </span>
                        </Tooltip>
                      </List.Item>
                    )}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "rgba(0,0,0,0.65)",
                    }}
                  >
                    Slides
                  </div>
                  <Form.List name="homeHeroSlides">
                    {(fields, { add, remove, move }) => (
                      <SortableFormList
                        fields={fields}
                        add={add}
                        remove={remove}
                        move={move}
                        itemLabel="Slide"
                        addButtonText="Add slide"
                        defaultAddPayload={{
                          bgImageUrlDesktop: "",
                          bgImageUrlMobile: "",
                          bgImageUrl: "",
                          mediaType: "image",
                          youtubeUrl: "",
                          lottieJsonUrl: "",
                          mapSliderConfig: normalizeMapSliderConfig(null, {
                            defaultItemCount: 10,
                          }),
                          title: "",
                          description: "",
                          buttonText: "Contact Us",
                          buttonLink: "/contact",
                          buttonTarget: "_self",
                          showButton: true,
                        }}
                        reorderMovedIndex={reorderMovedIndex}
                        reorderDirection={reorderDirection}
                        onMoveWithTransition={(from, to) => {
                          setReorderDirection(to < from ? "up" : "down");
                          setReorderMovedIndex(to);
                          setTimeout(() => setReorderMovedIndex(-1), 400);
                        }}
                        renderItemContent={(name, restField) => (
                          <Form.Item
                            noStyle
                            shouldUpdate={(prev, curr) =>
                              prev?.homeHeroSlides?.[name]?.mediaType !==
                              curr?.homeHeroSlides?.[name]?.mediaType
                            }
                          >
                            {({ getFieldValue }) => {
                              const mediaType =
                                getFieldValue([
                                  "homeHeroSlides",
                                  name,
                                  "mediaType",
                                ]) || "image";
                              const isLottie = mediaType === "lottie";
                              const isMapSlider = mediaType === "mapSlider";
                              return (
                                <Row gutter={[16, 16]}>
                                  <Col span={24}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, "mediaType"]}
                                      label="Slide type"
                                      initialValue="image"
                                    >
                                      <Select
                                        size="large"
                                        options={[
                                          { label: "Image", value: "image" },
                                          {
                                            label: "Video thumbnail",
                                            value: "video",
                                          },
                                          {
                                            label: "Lottie Json",
                                            value: "lottie",
                                          },
                                          {
                                            label: "Map Slider Animations",
                                            value: "mapSlider",
                                          },
                                        ]}
                                      />
                                    </Form.Item>
                                  </Col>
                                  {isLottie ? (
                                    <Col span={24}>
                                      <Card size="small" title="Lottie Json">
                                        <Form.Item
                                          {...restField}
                                          name={[name, "lottieJsonUrl"]}
                                          style={{ marginBottom: 0 }}
                                        >
                                          <MediaPickerInput
                                            placeholder="e.g. /media/... or /uploads/animation.json"
                                            uiVariant="stacked"
                                            showVariants={false}
                                            mediaLibraryType="document"
                                            allowedMimeTypes={[
                                              "application/json",
                                              "text/json",
                                            ]}
                                            uploadAccept=".json,application/json,text/json"
                                            uploadButtonLabel="Upload JSON"
                                            libraryTitle="JSON Media Library"
                                            emptyLibraryText="No JSON files found"
                                            emptySelectionText="No JSON file selected"
                                            hintText="Only JSON animation file"
                                          />
                                        </Form.Item>
                                      </Card>
                                    </Col>
                                  ) : isMapSlider ? (
                                    <Col span={24}>
                                      <Card
                                        size="small"
                                        title="Map Slider Animations"
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 12,
                                          }}
                                        >
                                          <List
                                            header={
                                              <span
                                                style={{
                                                  fontSize: 13,
                                                  fontWeight: 600,
                                                  color: "rgba(0,0,0,0.65)",
                                                }}
                                              >
                                                Behaviour
                                              </span>
                                            }
                                            size="small"
                                            bordered
                                            split
                                            dataSource={[
                                              {
                                                key: "rotation",
                                                label: "Rotation duration (seconds)",
                                                path: [
                                                  name,
                                                  "mapSliderConfig",
                                                  "rotationDuration",
                                                ],
                                                type: "number",
                                                min: 12,
                                                max: 240,
                                                step: 1,
                                              },
                                              {
                                                key: "direction",
                                                label: "Direction",
                                                path: [
                                                  name,
                                                  "mapSliderConfig",
                                                  "direction",
                                                ],
                                                type: "select",
                                              },
                                              {
                                                key: "pause",
                                                label: "Pause on hover",
                                                path: [
                                                  name,
                                                  "mapSliderConfig",
                                                  "pauseOnHover",
                                                ],
                                                type: "switch",
                                              },
                                            ]}
                                            renderItem={(item) => (
                                              <List.Item
                                                actions={[
                                                  item.type === "number" ? (
                                                    <Form.Item
                                                      key="input"
                                                      name={item.path}
                                                      noStyle
                                                    >
                                                      <InputNumber
                                                        min={item.min}
                                                        max={item.max}
                                                        step={item.step}
                                                        style={{ width: 120 }}
                                                      />
                                                    </Form.Item>
                                                  ) : item.type === "select" ? (
                                                    <Form.Item
                                                      key="select"
                                                      name={item.path}
                                                      noStyle
                                                    >
                                                      <Select
                                                        style={{ width: 180 }}
                                                        options={[
                                                          {
                                                            label: "Clockwise",
                                                            value: "clockwise",
                                                          },
                                                          {
                                                            label:
                                                              "Counterclockwise",
                                                            value:
                                                              "counterclockwise",
                                                          },
                                                        ]}
                                                      />
                                                    </Form.Item>
                                                  ) : (
                                                    <Form.Item
                                                      key="switch"
                                                      name={item.path}
                                                      valuePropName="checked"
                                                      noStyle
                                                    >
                                                      <Switch />
                                                    </Form.Item>
                                                  ),
                                                ]}
                                              >
                                                <span
                                                  style={{
                                                    fontSize: 14,
                                                    color: "rgba(0,0,0,0.65)",
                                                  }}
                                                >
                                                  {item.label}
                                                </span>
                                              </List.Item>
                                            )}
                                          />

                                          <List
                                            header={
                                              <span
                                                style={{
                                                  fontSize: 13,
                                                  fontWeight: 600,
                                                  color: "rgba(0,0,0,0.65)",
                                                }}
                                              >
                                                Icon Circle Width (Responsive)
                                              </span>
                                            }
                                            size="small"
                                            bordered
                                            split
                                            dataSource={[
                                              {
                                                key: "desktop",
                                                label: "Desktop (px)",
                                                path: [
                                                  name,
                                                  "mapSliderConfig",
                                                  "nodeSizeDesktop",
                                                ],
                                                min: 24,
                                                max: 220,
                                              },
                                              {
                                                key: "tablet",
                                                label: "Tablet (px)",
                                                path: [
                                                  name,
                                                  "mapSliderConfig",
                                                  "nodeSizeTablet",
                                                ],
                                                min: 20,
                                                max: 200,
                                              },
                                              {
                                                key: "mobile",
                                                label: "Mobile (px)",
                                                path: [
                                                  name,
                                                  "mapSliderConfig",
                                                  "nodeSizeMobile",
                                                ],
                                                min: 18,
                                                max: 180,
                                              },
                                            ]}
                                            renderItem={(item) => (
                                              <List.Item
                                                actions={[
                                                  <Form.Item
                                                    key="input"
                                                    name={item.path}
                                                    noStyle
                                                  >
                                                    <InputNumber
                                                      min={item.min}
                                                      max={item.max}
                                                      step={1}
                                                      style={{ width: 120 }}
                                                    />
                                                  </Form.Item>,
                                                ]}
                                              >
                                                <span
                                                  style={{
                                                    fontSize: 14,
                                                    color: "rgba(0,0,0,0.65)",
                                                  }}
                                                >
                                                  {item.label}
                                                </span>
                                              </List.Item>
                                            )}
                                          />

                                          <Form.List
                                            name={[
                                              name,
                                              "mapSliderConfig",
                                              "orbitItems",
                                            ]}
                                          >
                                            {(
                                              orbitFields,
                                              {
                                                add: addOrbit,
                                                remove: removeOrbit,
                                                move: moveOrbit,
                                              },
                                            ) => (
                                              <div
                                                style={{
                                                  display: "flex",
                                                  flexDirection: "column",
                                                  gap: 12,
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: "rgba(0,0,0,0.65)",
                                                  }}
                                                >
                                                  Orbit avatars
                                                </div>
                                                {orbitFields.map(
                                                  (orbitField, orbitIndex) => (
                                                    <Card
                                                      key={orbitField.key}
                                                      size="small"
                                                      title={`Avatar ${orbitIndex + 1}`}
                                                      extra={
                                                        <div
                                                          style={{
                                                            display: "flex",
                                                            gap: 4,
                                                          }}
                                                        >
                                                          <Button
                                                            type="text"
                                                            size="small"
                                                            icon={
                                                              <ArrowUpOutlined />
                                                            }
                                                            disabled={
                                                              orbitIndex === 0
                                                            }
                                                            onClick={() =>
                                                              moveOrbit(
                                                                orbitIndex,
                                                                orbitIndex - 1,
                                                              )
                                                            }
                                                          />
                                                          <Button
                                                            type="text"
                                                            size="small"
                                                            icon={
                                                              <ArrowDownOutlined />
                                                            }
                                                            disabled={
                                                              orbitIndex ===
                                                              orbitFields.length -
                                                                1
                                                            }
                                                            onClick={() =>
                                                              moveOrbit(
                                                                orbitIndex,
                                                                orbitIndex + 1,
                                                              )
                                                            }
                                                          />
                                                          <Button
                                                            type="text"
                                                            size="small"
                                                            danger
                                                            icon={
                                                              <DeleteOutlined />
                                                            }
                                                            disabled={
                                                              orbitFields.length <=
                                                              1
                                                            }
                                                            onClick={() =>
                                                              removeOrbit(
                                                                orbitField.name,
                                                              )
                                                            }
                                                          />
                                                        </div>
                                                      }
                                                    >
                                                      <Row gutter={[12, 12]}>
                                                        <Col span={24}>
                                                          <Form.Item
                                                            {...orbitField}
                                                            name={[
                                                              orbitField.name,
                                                              "imageUrl",
                                                            ]}
                                                            label="Avatar image"
                                                          >
                                                            <MediaPickerInput
                                                              placeholder="Select avatar from media library"
                                                              uiVariant="stacked"
                                                              hintText="Use media module only."
                                                            />
                                                          </Form.Item>
                                                        </Col>
                                                        <Col span={24}>
                                                          <Form.Item
                                                            {...orbitField}
                                                            name={[
                                                              orbitField.name,
                                                              "altText",
                                                            ]}
                                                            label="Alt text"
                                                          >
                                                            <Input
                                                              placeholder="Avatar alt text"
                                                              size="large"
                                                            />
                                                          </Form.Item>
                                                        </Col>
                                                        <Col span={24}>
                                                          <Form.Item
                                                            {...orbitField}
                                                            name={[
                                                              orbitField.name,
                                                              "href",
                                                            ]}
                                                            label="Link (optional)"
                                                          >
                                                            <Input
                                                              placeholder="/team/member or https://..."
                                                              size="large"
                                                            />
                                                          </Form.Item>
                                                        </Col>
                                                        <Col span={24}>
                                                          <Form.Item
                                                            {...orbitField}
                                                            name={[
                                                              orbitField.name,
                                                              "target",
                                                            ]}
                                                            label="Link target"
                                                            initialValue="_self"
                                                          >
                                                            <Select
                                                              size="large"
                                                              placeholder="Select target"
                                                              options={[
                                                                {
                                                                  label:
                                                                    "Same tab (_self)",
                                                                  value: "_self",
                                                                },
                                                                {
                                                                  label:
                                                                    "New tab (_blank)",
                                                                  value: "_blank",
                                                                },
                                                              ]}
                                                            />
                                                          </Form.Item>
                                                        </Col>
                                                      </Row>
                                                    </Card>
                                                  ),
                                                )}
                                                <Button
                                                  type="dashed"
                                                  icon={<PlusOutlined />}
                                                  onClick={() =>
                                                    addOrbit({
                                                      imageUrl: "",
                                                      altText: "",
                                                      href: "",
                                                      target: "_self",
                                                    })
                                                  }
                                                >
                                                  Add avatar
                                                </Button>
                                              </div>
                                            )}
                                          </Form.List>
                                        </div>
                                      </Card>
                                    </Col>
                                  ) : (
                                    <Col span={24}>
                                      <Row gutter={[12, 12]}>
                                        <Col span={24}>
                                          <Card
                                            size="small"
                                            title="Desktop Image"
                                          >
                                            <Form.Item
                                              {...restField}
                                              name={[name, "bgImageUrlDesktop"]}
                                              style={{ marginBottom: 0 }}
                                            >
                                              <PortfolioImagePickerInput
                                                placeholder="e.g. /images/slider-desktop.png"
                                                uiVariant="stacked"
                                                showVariants={true}
                                                requiredResolution={{
                                                  width: 1200,
                                                  height: 870,
                                                }}
                                                libraryTitle="Home Hero Desktop Image Library"
                                              />
                                            </Form.Item>
                                          </Card>
                                        </Col>
                                        <Col span={24}>
                                          <Card size="small" title="Mobile Image">
                                            <Form.Item
                                              {...restField}
                                              name={[name, "bgImageUrlMobile"]}
                                              style={{ marginBottom: 0 }}
                                            >
                                              <PortfolioImagePickerInput
                                                placeholder="e.g. /images/slider-mobile.png"
                                                uiVariant="stacked"
                                                showVariants={true}
                                                requiredResolution={{
                                                  width: 1200,
                                                  height: 600,
                                                }}
                                                libraryTitle="Home Hero Mobile Image Library"
                                              />
                                            </Form.Item>
                                          </Card>
                                        </Col>
                                      </Row>
                                    </Col>
                                  )}
                                  {mediaType === "video" ? (
                                    <Col span={24}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, "youtubeUrl"]}
                                        label="YouTube URL"
                                        rules={[
                                          {
                                            type: "url",
                                            warningOnly: true,
                                            message: "Please enter a valid URL",
                                          },
                                        ]}
                                      >
                                        <Input
                                          placeholder="https://www.youtube.com/watch?v=..."
                                          size="large"
                                        />
                                      </Form.Item>
                                    </Col>
                                  ) : null}
                                  <Col span={24}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, "title"]}
                                      label="Title"
                                    >
                                      <Input placeholder="Title" size="large" />
                                    </Form.Item>
                                  </Col>
                                  <Col span={24}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, "description"]}
                                      label="Description"
                                    >
                                      <Input.TextArea
                                        rows={2}
                                        placeholder="Description"
                                        size="large"
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={24}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, "buttonText"]}
                                      label="Button label"
                                    >
                                      <Input
                                        placeholder="e.g. Contact Us"
                                        size="large"
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={24}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, "buttonLink"]}
                                      label="Button link"
                                    >
                                      <Input
                                        placeholder="/contact"
                                        size="large"
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={24}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, "buttonTarget"]}
                                      label="Target"
                                      initialValue="_self"
                                    >
                                      <Select
                                        size="large"
                                        options={[
                                          { label: "Same tab (_self)", value: "_self" },
                                          { label: "New tab (_blank)", value: "_blank" },
                                        ]}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={24}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, "showButton"]}
                                      label="Show button"
                                      valuePropName="checked"
                                    >
                                      <Switch />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              );
                            }}
                          </Form.Item>
                        )}
                      />
                    )}
                  </Form.List>
                </div>
              ),
            },
          ]}
        />
      </Form>
    </>
  );
}

export default forwardRef(HomeHeroEditForm);

