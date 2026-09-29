"use client";

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Card,
  List,
  Tooltip,
  message,
  Spin,
  Collapse,
} from "antd";
import {
  QuestionCircleOutlined,
} from "@ant-design/icons";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/HomeHero2";
const PREFIX = "homeHero2";
const MIN_SECTION_BACKGROUND_WIDTH = 1440;
const MIN_SECTION_BACKGROUND_HEIGHT = 620;
const MIN_SECTION_BACKGROUND_TEXT =
  `${MIN_SECTION_BACKGROUND_WIDTH} \u00D7 ${MIN_SECTION_BACKGROUND_HEIGHT} px`;
const REQUIRED_SLIDER_DESKTOP_WIDTH = 350;
const REQUIRED_SLIDER_DESKTOP_HEIGHT = 450;
const REQUIRED_SLIDER_DESKTOP_TEXT =
  `${REQUIRED_SLIDER_DESKTOP_WIDTH} \u00D7 ${REQUIRED_SLIDER_DESKTOP_HEIGHT} px`;

const DEFAULT_SUBTITLE =
  "A community-powered initiative that brings donors, mentors, and resources together to help learners overcome barriers and continue their education—turning collective support into real opportunities.";

function getImageDimensions(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({
        width: Number(image.naturalWidth) || 0,
        height: Number(image.naturalHeight) || 0,
      });
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageUrl;
  });
}

async function validateHomeHero2DesktopSliderImage(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (
      width === REQUIRED_SLIDER_DESKTOP_WIDTH &&
      height === REQUIRED_SLIDER_DESKTOP_HEIGHT
    ) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Supports Only ${REQUIRED_SLIDER_DESKTOP_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate desktop image size. Supports Only ${REQUIRED_SLIDER_DESKTOP_TEXT}.`,
      ),
    );
  }
}

async function validateHomeHero2SectionBackgroundImage(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (width >= MIN_SECTION_BACKGROUND_WIDTH && height >= MIN_SECTION_BACKGROUND_HEIGHT) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Background must be at least ${MIN_SECTION_BACKGROUND_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate background size. Please use minimum ${MIN_SECTION_BACKGROUND_TEXT}.`,
      ),
    );
  }
}

function buildInitialData(data) {
  const sliderItems = Array.isArray(data?.homeHero2SliderImages)
    ? data.homeHero2SliderImages
    : [];
  const normalizedSliderItems =
    sliderItems.length > 0
      ? sliderItems.map((s) => {
          const desktopSrc =
            s?.desktopSrc != null
              ? String(s.desktopSrc).trim()
              : s?.src != null
                ? String(s.src).trim()
                : s?.url != null
                  ? String(s.url).trim()
                  : "";
          const mobileSrc =
            s?.mobileSrc != null ? String(s.mobileSrc).trim() : "";
          return {
            src: desktopSrc,
            desktopSrc,
            mobileSrc,
            alt: s?.alt != null ? String(s.alt).trim() : "",
          };
        })
      : [{ src: "", desktopSrc: "", mobileSrc: "", alt: "" }];
  return {
    mainTitle: data?.mainTitle ?? "Because Every Learner",
    mainTitleHighlight: data?.mainTitleHighlight ?? "Deserves Support",
    subTitle: data?.subTitle ?? DEFAULT_SUBTITLE,
    titleColorKey: data?.titleColorKey ?? "",
    homeHero2ButtonBgColorKey: data?.homeHero2ButtonBgColorKey ?? "",
    homeHero2ButtonTextColorKey: data?.homeHero2ButtonTextColorKey ?? "",
    buttonText:
      data?.buttonText != null ? String(data.buttonText).trim() : "",
    buttonHref:
      data?.buttonHref != null ? String(data.buttonHref).trim() : "",
    heroIconUrl: data?.heroIconUrl ?? "/images/hero-icon.svg",
    homeHero2SliderImages: normalizedSliderItems,
    homeHero2SlideCount:
      data?.homeHero2SlideCount != null ? Number(data.homeHero2SlideCount) : 37,
    homeHero2AutoInterval:
      data?.homeHero2AutoInterval != null
        ? Number(data.homeHero2AutoInterval)
        : 4000,
    homeHero2StepDeg:
      data?.homeHero2StepDeg != null ? Number(data.homeHero2StepDeg) : 10,
    homeHero2Duration:
      data?.homeHero2Duration != null ? Number(data.homeHero2Duration) : 0.6,
    homeHero2Autoplay: data?.homeHero2Autoplay !== false,
    homeHero2Draggable: data?.homeHero2Draggable !== false,
    ...getManageSectionInitialValues(PREFIX, data || {}),
  };
}

/**
 * Edit form for HomeHero2 — used in component edit drawer and page builder.
 * When source="page": data from block.props (pages collection); save updates layout only, not components collection.
 * Exposes update() via ref for drawer header button.
 */
function HomeHero2EditForm(
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
  const [initialData, setInitialData] = useState(null);
  const [themeColorOptions, setThemeColorOptions] = useState(
    themeColorOptionsProp,
  );
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const themeFetchedRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0)
      setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      setInitialData(buildInitialData(data));
      if (!themeFetchedRef.current) {
        themeFetchedRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            const palette = theme?.themePalette || {};
            const customColors = Array.isArray(theme?.colors)
              ? theme.colors
              : [];
            const names = [
              ...new Set([
                ...Object.keys(palette),
                ...customColors.map((c) => c?.name).filter(Boolean),
              ]),
            ].sort();
            setThemeColorOptions(
              names.map((name) => ({ label: name, value: name })),
            );
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }
    setInitialData(null);
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const palette =
          data?.themePalette && typeof data.themePalette === "object"
            ? data.themePalette
            : {};
        const custom = Array.isArray(data?.colors) ? data.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...custom.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(
          names.map((name) => ({ label: name, value: name })),
        );
        const { themePalette: _p, colors: _c, ...formData } = data || {};
        setInitialData(buildInitialData(formData));
      })
      .catch(() => message.error("Failed to load HomeHero2"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const sliderRaw = values.homeHero2SliderImages;
        const homeHero2SliderImages = Array.isArray(sliderRaw)
          ? sliderRaw
              .filter((s) => s && (s.desktopSrc || s.src || s.url || s.mobileSrc))
              .map((s) => ({
                src: (s.desktopSrc || s.src || s.url || "").trim(),
                desktopSrc: (s.desktopSrc || s.src || s.url || "").trim(),
                mobileSrc: (s.mobileSrc || "").trim(),
                alt: (s.alt != null ? String(s.alt) : "").trim(),
              }))
          : [];
        const payload = {
          ...values,
          mainTitle:
            values.mainTitle != null ? String(values.mainTitle).trim() : "",
          mainTitleHighlight:
            values.mainTitleHighlight != null
              ? String(values.mainTitleHighlight).trim()
              : "",
          subTitle:
            values.subTitle != null ? String(values.subTitle).trim() : "",
          titleColorKey:
            values.titleColorKey != null
              ? String(values.titleColorKey).trim()
              : "",
          homeHero2ButtonBgColorKey:
            values.homeHero2ButtonBgColorKey != null
              ? String(values.homeHero2ButtonBgColorKey).trim()
              : "",
          homeHero2ButtonTextColorKey:
            values.homeHero2ButtonTextColorKey != null
              ? String(values.homeHero2ButtonTextColorKey).trim()
              : "",
          buttonText:
            values.buttonText != null ? String(values.buttonText).trim() : "",
          buttonHref:
            values.buttonHref != null ? String(values.buttonHref).trim() : "",
          homeHero2SliderImages,
          homeHero2SlideCount:
            values.homeHero2SlideCount != null
              ? Math.max(1, Math.min(72, Number(values.homeHero2SlideCount)))
              : 37,
          homeHero2AutoInterval:
            values.homeHero2AutoInterval != null
              ? Math.max(1000, Number(values.homeHero2AutoInterval))
              : 4000,
          homeHero2StepDeg:
            values.homeHero2StepDeg != null
              ? Math.max(1, Math.min(45, Number(values.homeHero2StepDeg)))
              : 10,
          homeHero2Duration:
            values.homeHero2Duration != null
              ? Math.max(0.1, Number(values.homeHero2Duration))
              : 0.6,
          homeHero2Autoplay: values.homeHero2Autoplay !== false,
          homeHero2Draggable: values.homeHero2Draggable !== false,
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
            message.success("Home Hero 2 saved");
            onSuccess?.();
          })
          .catch((err) => message.error(err?.error || "Failed to save"))
          .finally(() => setSaving(false));
      })
      .catch(() => {});
  };

  const handleUpdateRef = useRef(handleUpdate);
  handleUpdateRef.current = handleUpdate;
  useImperativeHandle(
    ref,
    () => ({ update: () => handleUpdateRef.current() }),
    [],
  );

  if (loading || initialData === null) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialData}
      key="homehero2-edit-form"
    >
      <Collapse
        defaultActiveKey={[
          "manage-section",
          "title-colors",
          "content",
          "slider",
          "slider-setting",
        ]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: (
              <ManageSectionFields
                prefix={PREFIX}
                form={form}
                themeColorOptions={themeColorOptions}
                sectionBgImageCropWidth={MIN_SECTION_BACKGROUND_WIDTH}
                sectionBgImageCropHeight={MIN_SECTION_BACKGROUND_HEIGHT}
                sectionBgImageHintText={`Required size: minimum ${MIN_SECTION_BACKGROUND_TEXT}`}
                sectionBgImageRules={[
                  { validator: validateHomeHero2SectionBackgroundImage },
                ]}
                sectionBgImageValidateTrigger={["onChange", "onBlur"]}
              />
            ),
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("HomeHero2")}
              />
            ),
          },
          {
            key: "content",
            label: "Hero & Button",
            children: (
              <>
                <Form.Item name="heroIconUrl" label="Hero icon image URL">
                  <MediaPickerInput placeholder="/images/hero-icon.svg" />
                </Form.Item>
                <Form.Item name="buttonText" label="Button text">
                  <Input placeholder="Contact Us" />
                </Form.Item>
                <Form.Item name="buttonHref" label="Button link (URL or path)">
                  <Input placeholder="/ or /contact" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "slider",
            label: "Circular Slider Images",
            children: (
              <Form.List name="homeHero2SliderImages">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Item"
                    addButtonText="Add slider image"
                    defaultAddPayload={{
                      src: "",
                      desktopSrc: "",
                      mobileSrc: "",
                      alt: "",
                    }}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[12, 12]}>
                        <Col span={24}>
                          <Card size="small" title="Desktop Image">
                            <Form.Item
                              {...restField}
                              name={[name, "desktopSrc"]}
                              validateTrigger={["onChange", "onBlur"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Desktop image is required",
                                },
                                { validator: validateHomeHero2DesktopSliderImage },
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <MediaPickerInput
                                placeholder="/images/slider-desktop.png"
                                uiVariant="stacked"
                                cropWidth={REQUIRED_SLIDER_DESKTOP_WIDTH}
                                cropHeight={REQUIRED_SLIDER_DESKTOP_HEIGHT}
                                hintText={`Required size: ${REQUIRED_SLIDER_DESKTOP_TEXT}`}
                              />
                            </Form.Item>
                          </Card>
                        </Col>
                        <Col span={24}>
                          <Card size="small" title="Mobile Image">
                            <Form.Item
                              {...restField}
                              name={[name, "mobileSrc"]}
                              style={{ marginBottom: 0 }}
                            >
                              <MediaPickerInput
                                placeholder="/images/slider-mobile.png"
                                uiVariant="stacked"
                                hintText="Optional for mobile (fallback desktop)"
                              />
                            </Form.Item>
                          </Card>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "alt"]}
                            label="Alt"
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="Alt text" size="large" />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  />
                )}
              </Form.List>
            ),
          },
          {
            key: "slider-setting",
            label: "Slider Settings",
            children: (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
                <SwitchSettingsCard items={[
                  { name: "homeHero2Autoplay", label: "Autoplay", tooltip: "Rotate slider automatically" },
                  { name: "homeHero2Draggable", label: "Draggable", tooltip: "Allow drag to rotate" },
                ]} />

                <List
                  header={
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "rgba(0,0,0,0.65)",
                      }}
                    >
                      Speed
                    </span>
                  }
                  size="small"
                  bordered
                  split
                  dataSource={[
                    {
                      key: "autoInterval",
                      name: "homeHero2AutoInterval",
                      label: "Auto-rotate interval (ms)",
                      tooltip:
                        "Delay between each auto rotation step (milliseconds)",
                      min: 1000,
                      max: 30000,
                      step: 500,
                    },
                    {
                      key: "duration",
                      name: "homeHero2Duration",
                      label: "Transition duration (s)",
                      tooltip:
                        "Animation duration for each rotation step in seconds",
                      min: 0.1,
                      max: 3,
                      step: 0.1,
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item
                          key="input"
                          name={item.name}
                          noStyle
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            size="small"
                            min={item.min}
                            max={item.max}
                            step={item.step}
                            style={{ width: 90 }}
                          />
                        </Form.Item>,
                      ]}
                    >
                      <Tooltip title={item.tooltip}>
                        <span
                          style={{
                            fontSize: 14,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "rgba(0,0,0,0.65)",
                          }}
                        >
                          {item.label}{" "}
                          <QuestionCircleOutlined
                            style={{ fontSize: 12, color: "#999" }}
                          />
                        </span>
                      </Tooltip>
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
                      Layout
                    </span>
                  }
                  size="small"
                  bordered
                  split
                  dataSource={[
                    {
                      key: "slideCount",
                      name: "homeHero2SlideCount",
                      label: "Total slide slots",
                      tooltip:
                        "Total number of card slots around the circle (images repeat to fill). Higher = denser ring.",
                      min: 4,
                      max: 72,
                      step: 1,
                    },
                    {
                      key: "stepDeg",
                      name: "homeHero2StepDeg",
                      label: "Step angle (degrees)",
                      tooltip:
                        "Degrees to rotate per step. Lower = smoother, higher = faster jumps.",
                      min: 1,
                      max: 45,
                      step: 1,
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item
                          key="input"
                          name={item.name}
                          noStyle
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            size="small"
                            min={item.min}
                            max={item.max}
                            step={item.step}
                            style={{ width: 90 }}
                          />
                        </Form.Item>,
                      ]}
                    >
                      <Tooltip title={item.tooltip}>
                        <span
                          style={{
                            fontSize: 14,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "rgba(0,0,0,0.65)",
                          }}
                        >
                          {item.label}{" "}
                          <QuestionCircleOutlined
                            style={{ fontSize: 12, color: "#999" }}
                          />
                        </span>
                      </Tooltip>
                    </List.Item>
                  )}
                />
              </div>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(HomeHero2EditForm);
