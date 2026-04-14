"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Switch,
  Tooltip,
  Collapse,
  Empty,
  Badge,
  Tag,
  Popover,
  Modal as AntModal,
  Segmented,
  ColorPicker,
  Divider,
  message,
  Row,
  Col,
  Spin,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  EditOutlined,
  SearchOutlined,
  AppstoreOutlined,
  FontSizeOutlined,
  PictureOutlined,
  LayoutOutlined,
  InteractionOutlined,
  UnorderedListOutlined,
  HolderOutlined,
  EyeOutlined,
  StarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  TableOutlined,
  ShareAltOutlined,
  LineOutlined,
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined,
  CloseOutlined,
  CheckOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Select } from "antd";

import RichTextEditor from "@/components/admin/RichTextEditor";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import * as SiteComponents from "@/components/site";
import { EDITABLE_SITE_EDIT_FORMS } from "@/components/site";
import { SITE_COMPONENT_IDS } from "@/lib/siteComponentRegistry";
import {
  getDefaultManageSectionProps,
  MANAGE_SECTION_PREFIX_BY_COMPONENT_ID,
} from "@/lib/manageSectionFields";
import { getDefaultTitleAndColorsProps } from "@/lib/titleAndColorsConfig";

/** Site components that have full edit flow in page builder. Header/Footer excluded. */
const EDITABLE_SITE_COMPONENTS = SITE_COMPONENT_IDS.filter(
  (id) => id !== "Header" && id !== "Footer",
);

/** Default props for new Testimonials block; all settings/items stored in page (pages collection). */
const TESTIMONIALS_DEFAULT_PROPS = {
  testimonialsTitle: "Testimonials",
  testimonialsTitleColorKey: "",
  testimonialsAutoplay: false,
  testimonialsSectionBgType: "default",
  testimonialsSectionBgImage: "",
  testimonialsSectionBgColorKey: "",
  testimonialsPageContainerBgType: "default",
  testimonialsPageContainerBgImage: "",
  testimonialsPageContainerBgColorKey: "",
  testimonialsSectionPaddingTop: undefined,
  testimonialsSectionPaddingRight: undefined,
  testimonialsSectionPaddingBottom: undefined,
  testimonialsSectionPaddingLeft: undefined,
  testimonialsPageContainerPaddingTop: undefined,
  testimonialsPageContainerPaddingRight: undefined,
  testimonialsPageContainerPaddingBottom: undefined,
  testimonialsPageContainerPaddingLeft: undefined,
  testimonialsSectionMarginTop: undefined,
  testimonialsSectionMarginBottom: undefined,
  testimonialsPageContainerMarginTop: undefined,
  testimonialsPageContainerMarginBottom: undefined,
  testimonialsAutoplaySpeed: 5000,
  testimonialsShowArrows: true,
  testimonialsShowDots: true,
  testimonialsSpeed: 400,
  testimonialsDraggable: false,
  testimonialsInfinite: true,
  testimonialsSlidesDesktop: 3,
  testimonialsSlidesTablet: 2,
  testimonialsSlidesMobile: 1,
  testimonialsItems: [
    { quote: "", imageUrl: "", name: "", title: "", rating: 5 },
    { quote: "", imageUrl: "", name: "", title: "", rating: 5 },
  ],
};

/** Default props for new Cards block in page builder (same behavior as mature site components). */
const CARDS_DEFAULT_PROPS = {
  mainTitle: "Section Title",
  subTitle: "Subtitle",
  cardsTitleEnabled: true,
  cardsSubTitleEnabled: true,
  cardsSubTitleColorKey: "",
  cardsMainTitleColorKey: "",
  cardsCardBgColorKey: "",
  cardsCardTitleColorKey: "",
  cardsCardBorderColorKey: "",
  cardsColumnsDesktop: 3,
  cardsColumnsTablet: 2,
  cardsColumnsMobile: 1,
  cardsColumnGap: 16,
  cardsRowGap: 16,
  cardsCardRadius: 14,
  cardsCardBorderWidth: 1,
  cardsCardImageAreaHeight: 160,
  cardsCardImageMaxHeight: 110,
  cardsCardContentPaddingY: 14,
  cardsCardTitleFontSize: 14,
  cardsCardTitleLineHeight: 1.35,
  cardsItems: [
    { image: "/images/logo.svg", title: "Accredited For Desirable Norms Credibility Alliance" },
    { image: "/images/logo.svg", title: "Accredited For Desirable Norms Credibility Alliance" },
    { image: "/images/logo.svg", title: "Accredited For Desirable Norms Credibility Alliance" },
    { image: "/images/logo.svg", title: "Accredited For Desirable Norms Credibility Alliance" },
    { image: "/images/logo.svg", title: "Accredited For Desirable Norms Credibility Alliance" },
    { image: "/images/logo.svg", title: "Accredited For Desirable Norms Credibility Alliance" },
  ],
};

function getDefaultPropsForNewSiteComponentBlock(componentId) {
  const base = getDefaultPropsForNewSiteComponent(componentId);
  if (componentId === "Testimonials") return { ...TESTIMONIALS_DEFAULT_PROPS };
  if (componentId === "Cards") return { ...base, ...CARDS_DEFAULT_PROPS };
  return base;
}

/** Full default props when creating a new site component block (Manage Section, Title & Colors, Manage Items, Slide Setting). */
function getDefaultPropsForNewSiteComponent(componentId) {
  const prefix =
    MANAGE_SECTION_PREFIX_BY_COMPONENT_ID[componentId] ??
    (componentId
      ? componentId.charAt(0).toLowerCase() + componentId.slice(1)
      : null);
  const base = prefix
    ? {
        ...getDefaultManageSectionProps(prefix),
        ...getDefaultTitleAndColorsProps(componentId),
      }
    : {};
  switch (componentId) {
    case "HomeHero":
      return {
        ...base,
        homeHeroSlides: [],
        homeHeroAutoplay: true,
        homeHeroShowArrows: true,
        homeHeroShowDots: true,
        homeHeroAutoplaySpeed: 5000,
        homeHeroSpeed: 500,
      };
    case "Marquee":
      return { ...base, marqueeItems: [], marqueeTitle: "" };
    case "LatestEvents1":
      return { ...base, latestEvents1Items: [] };
    case "EventsSlider":
      return {
        ...base,
        eventsSliderSubTitle: "Upcoming",
        eventsSliderMainTitle: "Events",
        eventsSliderTitleEnabled: true,
        eventsSliderSubTitleEnabled: true,
        eventsSliderLimit: 8,
        eventsSliderSort: "upcoming",
        eventsSliderAutoplay: false,
        eventsSliderShowArrows: true,
        eventsSliderShowDots: true,
        eventsSliderInfinite: true,
        eventsSliderAutoplaySpeed: 5000,
        eventsSliderSpeed: 450,
        eventsSliderButtonRadius: 999,
        eventsSliderButtonSize: "md",
      };
    case "OverviewOfOurWork":
      return { ...base, overviewOfOurWorkItems: [] };
    case "HomeHero2":
      return {
        ...base,
        mainTitle: "Because Every Learner",
        mainTitleHighlight: "Deserves Support",
        subTitle:
          "A community-powered initiative that brings donors, mentors, and resources together to help learners overcome barriers and continue their education—turning collective support into real opportunities.",
        titleColorKey: "",
        homeHero2ButtonBgColorKey: "",
        homeHero2ButtonTextColorKey: "",
        buttonText: "Contact Us",
        buttonHref: "/",
        heroIconUrl: "/images/hero-icon.svg",
        homeHero2SliderImages: [
          { src: "/images/slider-1.png", alt: "Slider Image 1" },
          { src: "/images/slider-2.png", alt: "Slider Image 2" },
          { src: "/images/slider-3.png", alt: "Slider Image 3" },
          { src: "/images/slider-4.png", alt: "Slider Image 4" },
        ],
        homeHero2SlideCount: 37,
        homeHero2AutoInterval: 4000,
        homeHero2StepDeg: 10,
        homeHero2Duration: 0.6,
        homeHero2Autoplay: true,
        homeHero2Draggable: true,
      };
    default:
      return base;
  }
}

function generateId() {
  return "block_" + Math.random().toString(36).slice(2, 11);
}

/** Legacy: normalize AwardsRecognition block props so OverviewOfOurWork EditForm can read them. */
const AWARDS_TO_OVERVIEW_KEYS = {
  awardsRecognitionItems: "overviewOfOurWorkItems",
  awardsRecognitionSectionBgType: "overviewOfOurWorkSectionBgType",
  awardsRecognitionSectionBgImage: "overviewOfOurWorkSectionBgImage",
  awardsRecognitionSectionBgColorKey: "overviewOfOurWorkSectionBgColorKey",
  awardsRecognitionSectionPaddingTop: "overviewOfOurWorkSectionPaddingTop",
  awardsRecognitionSectionPaddingBottom:
    "overviewOfOurWorkSectionPaddingBottom",
  awardsRecognitionSectionMarginTop: "overviewOfOurWorkSectionMarginTop",
  awardsRecognitionSectionMarginBottom: "overviewOfOurWorkSectionMarginBottom",
  awardsRecognitionPageContainerBgType: "overviewOfOurWorkPageContainerBgType",
  awardsRecognitionPageContainerBgImage:
    "overviewOfOurWorkPageContainerBgImage",
  awardsRecognitionPageContainerBgColorKey:
    "overviewOfOurWorkPageContainerBgColorKey",
  awardsRecognitionPageContainerPaddingTop:
    "overviewOfOurWorkPageContainerPaddingTop",
  awardsRecognitionPageContainerPaddingRight:
    "overviewOfOurWorkPageContainerPaddingRight",
  awardsRecognitionPageContainerPaddingBottom:
    "overviewOfOurWorkPageContainerPaddingBottom",
  awardsRecognitionPageContainerPaddingLeft:
    "overviewOfOurWorkPageContainerPaddingLeft",
  awardsRecognitionPageContainerMarginTop:
    "overviewOfOurWorkPageContainerMarginTop",
  awardsRecognitionPageContainerMarginBottom:
    "overviewOfOurWorkPageContainerMarginBottom",
  awardsRecognitionCardTitleColorKey: "overviewOfOurWorkCardTitleColorKey",
  awardsRecognitionCardBorderColorKey: "overviewOfOurWorkCardBorderColorKey",
  awardsRecognitionButtonColorKey: "overviewOfOurWorkButtonColorKey",
  awardsRecognitionHoverColorKey: "overviewOfOurWorkHoverColorKey",
};
function normalizeAwardsBlockPropsToOverview(props) {
  if (!props || typeof props !== "object") return props;
  const out = { ...props };
  for (const [oldK, newK] of Object.entries(AWARDS_TO_OVERVIEW_KEYS)) {
    if (oldK in out && !(newK in out)) out[newK] = out[oldK];
  }
  return out;
}

// ─── Component Categories ───────────────────────────────────

const CATEGORY_META = {
  text: { label: "Text", icon: <FontSizeOutlined />, color: "#1890ff" },
  media: { label: "Media", icon: <PictureOutlined />, color: "#52c41a" },
  layout: { label: "Layout", icon: <LayoutOutlined />, color: "#722ed1" },
  content: { label: "Content", icon: <AppstoreOutlined />, color: "#fa8c16" },
  interactive: {
    label: "Interactive",
    icon: <InteractionOutlined />,
    color: "#eb2f96",
  },
  data: { label: "Data Display", icon: <TableOutlined />, color: "#13c2c2" },
  navigation: {
    label: "Navigation",
    icon: <ShareAltOutlined />,
    color: "#597ef7",
  },
  antd: { label: "Ant Design", icon: <AppstoreOutlined />, color: "#0170fe" },
};

/** Palette + schema from API (GET /api/admin/components). Seed system components via npm run seed. */
const BLOCK_ICON_MAP = {
  Paragraph: <FontSizeOutlined />,
  Heading: <FontSizeOutlined />,
  List: <UnorderedListOutlined />,
  Quote: <FontSizeOutlined />,
  CodeSnippet: <FontSizeOutlined />,
  Image: <PictureOutlined />,
  Gallery: <PictureOutlined />,
  Video: <PictureOutlined />,
  FileDownload: <PictureOutlined />,
  Cover: <LayoutOutlined />,
  Hero: <StarOutlined />,
  Buttons: <LayoutOutlined />,
  Spacer: <LineOutlined />,
  Columns: <LayoutOutlined />,
  Divider: <LineOutlined />,
  CallToAction: <StarOutlined />,
  Card: <AppstoreOutlined />,
  CardGrid: <AppstoreOutlined />,
  FeatureGrid: <AppstoreOutlined />,
  IconBox: <StarOutlined />,
  Testimonial: <TeamOutlined />,
  Team: <TeamOutlined />,
  Embed: <PictureOutlined />,
  Accordion: <UnorderedListOutlined />,
  Tabs: <AppstoreOutlined />,
  Modal: <InteractionOutlined />,
  Stats: <StarOutlined />,
  Pricing: <TableOutlined />,
  Table: <TableOutlined />,
  Timeline: <ClockCircleOutlined />,
  Breadcrumbs: <ShareAltOutlined />,
  Alert: <AlertOutlined />,
  SocialLinks: <ShareAltOutlined />,
  Slider: <PictureOutlined />,
  Header: <LayoutOutlined />,
  Footer: <LayoutOutlined />,
  Section: <LayoutOutlined />,
  AntButton: <InteractionOutlined />,
  AntCard: <AppstoreOutlined />,
  AntInput: <EditOutlined />,
  AntDivider: <LineOutlined />,
  AntAlert: <AlertOutlined />,
  AntTypography: <FontSizeOutlined />,
  AntSpace: <LayoutOutlined />,
};

/** Ant Design UI blocks – shown in Add Block when editing a component (includeAntdBlocks=true). */
const ANT_DESIGN_BLOCKS = [
  {
    _id: "antd-AntButton",
    name: "AntButton",
    displayName: "Button",
    category: "antd",
    baseComponent: "AntButton",
    description: "Ant Design Button",
    propsSchema: [
      { key: "text", type: "text", label: "Text" },
      {
        key: "type",
        type: "select",
        label: "Type",
        options: ["primary", "default", "dashed", "link", "text"],
      },
      {
        key: "size",
        type: "select",
        label: "Size",
        options: ["large", "middle", "small"],
      },
      { key: "danger", type: "boolean", label: "Danger" },
      { key: "disabled", type: "boolean", label: "Disabled" },
    ],
    defaultProps: {
      text: "Button",
      type: "primary",
      size: "middle",
      danger: false,
      disabled: false,
    },
    active: true,
  },
  {
    _id: "antd-AntCard",
    name: "AntCard",
    displayName: "Card",
    category: "antd",
    baseComponent: "AntCard",
    description: "Ant Design Card",
    propsSchema: [
      { key: "title", type: "text", label: "Title" },
      { key: "content", type: "text", label: "Content" },
      { key: "extra", type: "text", label: "Extra" },
    ],
    defaultProps: { title: "", content: "Card content", extra: "" },
    active: true,
  },
  {
    _id: "antd-AntInput",
    name: "AntInput",
    displayName: "Input",
    category: "antd",
    baseComponent: "AntInput",
    description: "Ant Design Input",
    propsSchema: [
      { key: "placeholder", type: "text", label: "Placeholder" },
      { key: "value", type: "text", label: "Default value" },
      {
        key: "size",
        type: "select",
        label: "Size",
        options: ["large", "middle", "small"],
      },
      { key: "disabled", type: "boolean", label: "Disabled" },
    ],
    defaultProps: {
      placeholder: "Placeholder",
      value: "",
      size: "middle",
      disabled: false,
    },
    active: true,
  },
  {
    _id: "antd-AntDivider",
    name: "AntDivider",
    displayName: "Divider",
    category: "antd",
    baseComponent: "AntDivider",
    description: "Ant Design Divider",
    propsSchema: [
      { key: "text", type: "text", label: "Center text" },
      {
        key: "orientation",
        type: "select",
        label: "Orientation",
        options: ["left", "center", "right"],
      },
      {
        key: "type",
        type: "select",
        label: "Type",
        options: ["horizontal", "vertical"],
      },
      { key: "plain", type: "boolean", label: "Plain" },
    ],
    defaultProps: {
      text: "",
      orientation: "center",
      type: "horizontal",
      plain: true,
    },
    active: true,
  },
  {
    _id: "antd-AntAlert",
    name: "AntAlert",
    displayName: "Alert",
    category: "antd",
    baseComponent: "AntAlert",
    description: "Ant Design Alert",
    propsSchema: [
      { key: "message", type: "text", label: "Message" },
      { key: "description", type: "text", label: "Description" },
      {
        key: "type",
        type: "select",
        label: "Type",
        options: ["success", "info", "warning", "error"],
      },
      { key: "showIcon", type: "boolean", label: "Show icon" },
    ],
    defaultProps: {
      message: "Alert message",
      description: "",
      type: "info",
      showIcon: true,
    },
    active: true,
  },
  {
    _id: "antd-AntTypography",
    name: "AntTypography",
    displayName: "Typography",
    category: "antd",
    baseComponent: "AntTypography",
    description: "Ant Design Title / Paragraph",
    propsSchema: [
      {
        key: "variant",
        type: "select",
        label: "Variant",
        options: ["title", "paragraph", "text"],
      },
      { key: "level", type: "number", label: "Title level (1-5)" },
      { key: "title", type: "text", label: "Title text" },
      { key: "paragraph", type: "text", label: "Paragraph text" },
      { key: "text", type: "text", label: "Text" },
    ],
    defaultProps: {
      variant: "title",
      level: 3,
      title: "Title",
      paragraph: "",
      text: "",
    },
    active: true,
  },
  {
    _id: "antd-AntSpace",
    name: "AntSpace",
    displayName: "Space",
    category: "antd",
    baseComponent: "AntSpace",
    description: "Ant Design Space",
    propsSchema: [
      {
        key: "direction",
        type: "select",
        label: "Direction",
        options: ["horizontal", "vertical"],
      },
      {
        key: "size",
        type: "select",
        label: "Size",
        options: ["small", "middle", "large"],
      },
    ],
    defaultProps: { direction: "horizontal", size: "middle" },
    active: true,
  },
];

// ─── Schema Field Renderer ──────────────────────────────────

function ThemeColorInput({ value, onChange, themeColorOptions }) {
  const options = themeColorOptions || [];
  const matched = options.find(
    (o) =>
      o.value &&
      String(o.value).toLowerCase() === String(value || "").toLowerCase(),
  );
  const isCustom =
    !matched && (value === undefined || value === null || value === "");
  const selectValue = matched
    ? matched.value
    : isCustom
      ? "__custom__"
      : "__custom__";
  const showPicker = !matched || selectValue === "__custom__";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.length > 0 && (
        <Select
          value={matched ? matched.value : "__custom__"}
          onChange={(v) => {
            if (v !== "__custom__") onChange(v);
          }}
          options={[
            ...options.map((o) => ({ label: o.label, value: o.value })),
            { label: "Custom…", value: "__custom__" },
          ]}
          allowClear={false}
          style={{ width: "100%" }}
        />
      )}
      {showPicker && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ColorPicker
            value={value || undefined}
            onChange={(_, hexStr) => onChange(hexStr)}
            allowClear
            size="small"
          />
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. #333 or inherit"
            style={{ flex: 1 }}
            allowClear
          />
        </div>
      )}
    </div>
  );
}

/** Keeps nav item children array in form state without rendering; avoids Form overwriting array with string from hidden input. */
function ChildrenPreserver() {
  return null;
}

function ArrayEditor({ field, themeColorOptions }) {
  const { key, label, itemSchema = [], itemLabel = "Item" } = field;
  const defaultItem = itemSchema.reduce(
    (acc, f) => ({
      ...acc,
      [f.key]: f.default ?? (f.type === "boolean" ? false : ""),
    }),
    {},
  );

  return (
    <Form.Item label={label}>
      <Form.List name={key}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key: listKey, name }) => (
              <div
                key={listKey}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  background: "#fafafa",
                  borderRadius: 8,
                  border: "1px solid #e8e8e8",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: "#666" }}
                  >
                    {itemLabel} #{name + 1}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 0 }}
                >
                  {itemSchema.map((subField) => {
                    if (subField.type === "children") {
                      return (
                        <Form.Item
                          key={subField.key}
                          name={[name, "children"]}
                          noStyle
                          initialValue={[]}
                          preserve
                        >
                          <ChildrenPreserver />
                        </Form.Item>
                      );
                    }
                    return (
                      <Form.Item
                        key={subField.key}
                        name={[name, subField.key]}
                        label={subField.label}
                        style={{ marginBottom: 8 }}
                        valuePropName={
                          subField.type === "boolean" ? "checked" : undefined
                        }
                      >
                        {subField.type === "number" ? (
                          <InputNumber style={{ width: "100%" }} />
                        ) : null}
                        {subField.type === "boolean" ? <Switch /> : null}
                        {subField.type === "select" ? (
                          <Select
                            options={(subField.options || []).map((o) =>
                              typeof o === "object" && o && "value" in o
                                ? { value: o.value, label: o.label }
                                : { value: o, label: o },
                            )}
                            allowClear
                            style={{ width: "100%" }}
                          />
                        ) : null}
                        {subField.type === "color" ? (
                          <ThemeColorInput
                            themeColorOptions={themeColorOptions}
                          />
                        ) : null}
                        {(subField.type === "url" ||
                          subField.type === "image" ||
                          subField.type === "text") &&
                        subField.type !== "richtext" ? (
                          <Input
                            placeholder={
                              subField.type === "url" ||
                              subField.type === "image"
                                ? "https://..."
                                : ""
                            }
                          />
                        ) : null}
                      </Form.Item>
                    );
                  })}
                </div>
              </div>
            ))}
            <Button
              type="dashed"
              onClick={() => add(defaultItem)}
              block
              icon={<PlusOutlined />}
              style={{ marginTop: 4 }}
            >
              Add {itemLabel}
            </Button>
          </>
        )}
      </Form.List>
    </Form.Item>
  );
}

function renderSchemaField(field, themeColorOptions) {
  const { key, type, label } = field;
  if (type === "json" && field.itemSchema?.length > 0) {
    return (
      <ArrayEditor
        key={key}
        field={field}
        themeColorOptions={themeColorOptions}
      />
    );
  }
  switch (type) {
    case "number":
      return (
        <Form.Item key={key} name={key} label={label}>
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      );
    case "boolean":
      return (
        <Form.Item key={key} name={key} label={label} valuePropName="checked">
          <Switch />
        </Form.Item>
      );
    case "select":
      return (
        <Form.Item key={key} name={key} label={label}>
          <Select
            options={(field.options || []).map((o) =>
              typeof o === "object" && o && "value" in o
                ? { value: o.value, label: o.label }
                : { value: o, label: o },
            )}
            allowClear
          />
        </Form.Item>
      );
    case "color":
      return (
        <Form.Item key={key} name={key} label={label}>
          <ThemeColorInput themeColorOptions={themeColorOptions} />
        </Form.Item>
      );
    case "url":
    case "image":
      return (
        <Form.Item key={key} name={key} label={label}>
          <Input placeholder="https://..." />
        </Form.Item>
      );
    case "richtext":
      return (
        <Form.Item key={key} name={key} label={label}>
          <RichTextEditor />
        </Form.Item>
      );
    case "json":
      return (
        <Form.Item
          key={key}
          name={key}
          label={label}
          getValueFromEvent={(e) => {
            if (typeof e === "string") {
              try {
                return JSON.parse(e);
              } catch {
                return e;
              }
            }
            return e?.target?.value ?? e;
          }}
          getValueProps={(val) => ({
            value:
              typeof val === "object"
                ? JSON.stringify(val, null, 2)
                : (val ?? ""),
          })}
        >
          <Input.TextArea
            rows={5}
            style={{ fontFamily: "monospace", fontSize: 12 }}
          />
        </Form.Item>
      );
    case "text":
    default:
      return (
        <Form.Item key={key} name={key} label={label}>
          {type === "text" && key === "text" ? (
            <Input.TextArea rows={3} />
          ) : (
            <Input />
          )}
        </Form.Item>
      );
  }
}

const SECTION_SETTINGS_SCHEMA = [
  {
    key: "_containerType",
    type: "select",
    label: "Select container (when no section styles)",
    options: [
      { value: "container", label: "Container (max-width)" },
      { value: "container-fluid", label: "Container fluid (full width)" },
    ],
  },
  { key: "_sectionBg", type: "color", label: "Background" },
  { key: "_sectionPadding", type: "text", label: "Padding (e.g. 2rem 1rem)" },
  {
    key: "_sectionBorderSize",
    type: "text",
    label: "Border size (e.g. 1px 2px 3px 4px)",
    default: "0px 0px 0px 0px",
  },
  {
    key: "_sectionBorderStyle",
    type: "select",
    label: "Border type",
    options: [
      { value: "solid", label: "Solid" },
      { value: "dashed", label: "Dashed" },
      { value: "dotted", label: "Dotted" },
      { value: "double", label: "Double" },
      { value: "groove", label: "Groove" },
      { value: "ridge", label: "Ridge" },
      { value: "inset", label: "Inset" },
      { value: "outset", label: "Outset" },
      { value: "none", label: "None" },
    ],
  },
  {
    key: "_sectionBorderColor",
    type: "color",
    label: "Border color (from theme)",
  },
  {
    key: "_sectionShadow",
    type: "text",
    label: "Shadow (e.g. 0 2px 8px rgba(0,0,0,0.08))",
  },
];

/** Add itemSchema for list-like JSON fields so the drawer shows Add/Remove item UI instead of raw JSON. */
const SCHEMA_ENRICHMENT = {
  Header: {
    navItems: {
      itemLabel: "Nav item",
      itemSchema: [
        { key: "label", type: "text", label: "Label" },
        { key: "url", type: "url", label: "URL" },
        {
          key: "hasDropdown",
          type: "boolean",
          label: "Has dropdown",
          default: false,
        },
        { key: "children", type: "children", label: "", default: [] }, // preserve dropdown sub-items (loaded from /admin/menus)
      ],
    },
    actionButtons: {
      itemLabel: "Button",
      itemSchema: [
        { key: "label", type: "text", label: "Label" },
        { key: "url", type: "url", label: "URL" },
        {
          key: "image",
          type: "image",
          label: "Icon image (upload in Media, paste URL)",
        },
        {
          key: "imagePosition",
          type: "select",
          label: "Icon placement",
          options: [
            { value: "left", label: "Left of text" },
            { value: "right", label: "Right of text" },
          ],
        },
        {
          key: "imageHeight",
          type: "number",
          label: "Icon height (px) – leave empty for 1em",
        },
        { key: "fontSize", type: "number", label: "Font size (px)" },
        {
          key: "fontWeight",
          type: "select",
          label: "Font weight",
          options: [
            { value: "400", label: "400 (Normal)" },
            { value: "500", label: "500 (Medium)" },
            { value: "600", label: "600 (Semi-bold)" },
            { value: "700", label: "700 (Bold)" },
          ],
        },
        {
          key: "letterSpacing",
          type: "text",
          label: "Letter spacing (e.g. 0.5px or 0.02em)",
        },
        {
          key: "textTransform",
          type: "select",
          label: "Text transform",
          options: [
            { value: "none", label: "None" },
            { value: "uppercase", label: "Uppercase" },
            { value: "lowercase", label: "Lowercase" },
            { value: "capitalize", label: "Capitalize" },
          ],
        },
        { key: "background", type: "color", label: "Background color" },
        { key: "color", type: "color", label: "Text color" },
        { key: "borderColor", type: "color", label: "Border color" },
        { key: "borderRadius", type: "number", label: "Border radius (px)" },
        { key: "paddingY", type: "number", label: "Padding top/bottom (px)" },
        { key: "paddingX", type: "number", label: "Padding left/right (px)" },
        { key: "boxShadow", type: "text", label: "Box shadow (CSS)" },
      ],
    },
  },
  Buttons: {
    buttons: {
      itemLabel: "Button",
      itemSchema: [
        { key: "label", type: "text", label: "Label" },
        { key: "url", type: "url", label: "URL" },
        {
          key: "variant",
          type: "select",
          label: "Style",
          options: ["solid", "outline"],
        },
      ],
    },
  },
  CardGrid: {
    cards: {
      itemLabel: "Card",
      itemSchema: [
        { key: "title", type: "text", label: "Title" },
        { key: "description", type: "text", label: "Description" },
      ],
    },
  },
  Slider: {
    slides: {
      itemLabel: "Slide",
      itemSchema: [
        { key: "image", type: "image", label: "Image URL" },
        { key: "heading", type: "text", label: "Heading" },
        { key: "text", type: "text", label: "Text" },
      ],
    },
  },
};

/** Convert menu API item to header nav item (plain objects only); supports nested children (submenu of submenu). */
function menuItemsToNavItems(menuItems) {
  if (!Array.isArray(menuItems)) return [];
  return menuItems.map((it) => {
    const item = it && typeof it === "object" ? it : {};
    const url =
      typeof item.url === "string" && item.url
        ? item.url
        : item.type === "page" && item.pageSlug
          ? `/${String(item.pageSlug)}`
          : "#";
    const childList = Array.isArray(item.children) ? item.children : [];
    const children = menuItemsToNavItems(childList);
    const result = {
      label: String(item.label ?? ""),
      url,
      hasDropdown: children.length > 0,
    };
    if (children.length > 0) result.children = children;
    return result;
  });
}

/** React Bootstrap Navbar options – shown in Header edit drawer (see https://react-bootstrap.netlify.app/docs/components/navbar). */
const NAVBAR_SCHEMA = [
  {
    key: "navbarExpand",
    type: "select",
    label: "Expand (responsive breakpoint)",
    options: [
      { value: "lg", label: "lg (collapse below 992px)" },
      { value: "md", label: "md (collapse below 768px)" },
      { value: "sm", label: "sm (collapse below 576px)" },
      { value: "xl", label: "xl (collapse below 1200px)" },
      { value: "xxl", label: "xxl (collapse below 1400px)" },
      { value: "false", label: "Never expand (always collapsed)" },
    ],
  },
  {
    key: "navbarFixed",
    type: "select",
    label: "Fixed position",
    options: [
      { value: "", label: "None" },
      { value: "top", label: "Fixed to top" },
      { value: "bottom", label: "Fixed to bottom" },
    ],
  },
  {
    key: "navbarSticky",
    type: "select",
    label: "Sticky position",
    options: [
      { value: "", label: "None" },
      { value: "top", label: "Sticky top" },
      { value: "bottom", label: "Sticky bottom" },
    ],
  },
  {
    key: "collapseOnSelect",
    type: "boolean",
    label: "Collapse when link selected",
    default: false,
  },
  {
    key: "navbarMobileMenu",
    type: "select",
    label: "Mobile menu style",
    options: [
      { value: "collapse", label: "Collapse (dropdown below)" },
      { value: "offcanvas", label: "Offcanvas (overlay drawer)" },
    ],
  },
  {
    key: "navbarOffcanvasPlacement",
    type: "select",
    label: "Offcanvas slide from",
    options: [
      { value: "end", label: "Right (end)" },
      { value: "start", label: "Left (start)" },
    ],
  },
];

/** Responsive logo dimensions – desktop (≥992px), tablet (576–991px), mobile (<576px). */
const LOGO_RESPONSIVE_SCHEMA = [
  {
    key: "logoImageWidthDesktop",
    type: "number",
    label: "Logo width – desktop (px)",
  },
  {
    key: "logoImageHeightDesktop",
    type: "number",
    label: "Logo height – desktop (px)",
  },
  {
    key: "logoImageWidthTablet",
    type: "number",
    label: "Logo width – tablet (px)",
  },
  {
    key: "logoImageHeightTablet",
    type: "number",
    label: "Logo height – tablet (px)",
  },
  {
    key: "logoImageWidthMobile",
    type: "number",
    label: "Logo width – mobile (px)",
  },
  {
    key: "logoImageHeightMobile",
    type: "number",
    label: "Logo height – mobile (px)",
  },
];

const MENU_SCHEMA = [
  {
    key: "menuPosition",
    type: "select",
    label: "Menu position (desktop)",
    options: [
      { value: "left", label: "Left" },
      { value: "center", label: "Center" },
      { value: "right", label: "Right" },
    ],
  },
  { key: "navColor", type: "color", label: "Nav link color" },
  { key: "navFontSize", type: "number", label: "Nav font size (px)" },
  {
    key: "navFontWeight",
    type: "select",
    label: "Nav font weight",
    options: [
      { value: "400", label: "400 (Normal)" },
      { value: "500", label: "500 (Medium)" },
      { value: "600", label: "600 (Semi-bold)" },
      { value: "700", label: "700 (Bold)" },
    ],
  },
  { key: "navHoverColor", type: "color", label: "Nav hover color" },
  { key: "navItemBackground", type: "color", label: "Nav item background" },
  {
    key: "navItemHoverBackground",
    type: "color",
    label: "Nav item hover background",
  },
];

/** Header edit drawer: group field keys for Logo, Menu, Navbar, Buttons. Nav items set only via "Load from menu". */
const HEADER_FIELD_GROUPS = [
  {
    label: "Logo and link",
    keys: [
      "logoImage",
      "logoImageWidth",
      "logoImageHeight",
      "logoImageWidthDesktop",
      "logoImageHeightDesktop",
      "logoImageWidthTablet",
      "logoImageHeightTablet",
      "logoImageWidthMobile",
      "logoImageHeightMobile",
      "logoTitle",
      "logoTagline",
      "logoUrl",
      "logoColor",
      "logoFontSize",
      "taglineFontSize",
      "sectionsOrder",
    ],
  },
  {
    label: "Menu",
    keys: [
      "menuPosition",
      "navColor",
      "navFontSize",
      "navFontWeight",
      "navHoverColor",
      "navItemBackground",
      "navItemHoverBackground",
    ],
  },
  {
    label: "Navbar (Bootstrap)",
    keys: [
      "navbarExpand",
      "navbarFixed",
      "navbarSticky",
      "collapseOnSelect",
      "navbarMobileMenu",
      "navbarOffcanvasPlacement",
    ],
  },
  { label: "Custom buttons", keys: ["actionButtons"] },
];

/** Which props belong to which clickable element (for "click element → edit in drawer"). */
const BLOCK_ELEMENT_FIELDS = {
  Hero: {
    heading: { label: "Heading", fields: ["heading"] },
    subheading: { label: "Subheading", fields: ["subheading"] },
    primaryButton: {
      label: "Primary button",
      fields: ["buttonLabel", "buttonUrl", "buttonVariant"],
    },
    secondaryButton: {
      label: "Secondary button",
      fields: ["secondaryButtonLabel", "secondaryButtonUrl"],
    },
    background: {
      label: "Background image",
      fields: ["backgroundImage", "backgroundAlt"],
    },
  },
  CallToAction: {
    heading: { label: "Heading", fields: ["heading"] },
    text: { label: "Text", fields: ["text"] },
    button: {
      label: "Button",
      fields: ["buttonLabel", "buttonUrl", "buttonVariant"],
    },
  },
  Paragraph: { content: { label: "Text", fields: ["text", "color", "align"] } },
  Heading: {
    content: {
      label: "Heading",
      fields: ["level", "text", "style", "color", "align"],
    },
  },
};

// ─── Sortable Visual Block ──────────────────────────────────

function SortableVisualBlock({
  block,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onRemove,
  onElementClick,
  paletteComponents = [],
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.instanceId });

  const comp = paletteComponents.find(
    (c) => c.baseComponent === block.baseComponent,
  );
  const catKey = comp?.category || "content";
  const catMeta = CATEGORY_META[catKey] || CATEGORY_META.content;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        onClick={() => onSelect(index)}
        style={{
          position: "relative",
          border: isSelected
            ? `2px solid ${catMeta.color}`
            : "2px solid transparent",
          borderRadius: 6,
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: isSelected
            ? `0 0 0 3px ${catMeta.color}22`
            : isDragging
              ? "0 8px 24px rgba(0,0,0,0.15)"
              : "none",
        }}
        onMouseEnter={(e) => {
          if (!isSelected)
            e.currentTarget.style.border = `2px dashed ${catMeta.color}88`;
        }}
        onMouseLeave={(e) => {
          if (!isSelected)
            e.currentTarget.style.border = "2px solid transparent";
        }}
      >
        {/* Block label bar – inside block so not clipped when at top of canvas */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 12,
            display: isSelected || isDragging ? "flex" : "none",
            alignItems: "center",
            gap: 4,
            background: catMeta.color,
            color: "#fff",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            zIndex: 10,
            whiteSpace: "nowrap",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
          }}
        >
          <span
            {...listeners}
            style={{
              cursor: "grab",
              display: "flex",
              alignItems: "center",
              marginRight: 2,
            }}
          >
            <HolderOutlined style={{ fontSize: 12 }} />
          </span>
          {comp?.displayName || block.baseComponent}
        </div>

        {/* Floating toolbar – inside block so always visible (not clipped above) */}
        {isSelected && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 12,
              display: "flex",
              gap: 1,
              background: "#fff",
              border: `1px solid ${catMeta.color}`,
              borderRadius: 4,
              padding: "2px 4px",
              zIndex: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
          >
            <Tooltip title="Edit properties">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ fontSize: 13 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(index);
                }}
              />
            </Tooltip>
            <Tooltip title="Duplicate">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined style={{ fontSize: 13 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(index);
                }}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
              />
            </Tooltip>
          </div>
        )}

        {/* Live rendered block – allow pointer events when selected so user can click individual elements */}
        <div
          style={{ pointerEvents: isSelected ? "auto" : "none", minHeight: 20 }}
        >
          <ComponentRenderer
            layout={[{ ...block, order: 0 }]}
            onElementClick={
              isSelected && onElementClick
                ? (instanceId, elementKey) =>
                    onElementClick(instanceId, elementKey)
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

// ─── Add Block Button (with drop zone for drag-from-palette) ────────────────────────

function AddBlockButton({ onClick, dropIndex, isOver }) {
  const { setNodeRef, isOver: isOverDroppable } = useDroppable({
    id: `insert-${dropIndex}`,
  });
  const over = isOver !== undefined ? isOver : isOverDroppable;

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "8px 0",
        position: "relative",
        minHeight: 32,
        borderRadius: 6,
        background: over ? "rgba(24, 144, 255, 0.08)" : "transparent",
        border: over ? "2px dashed #1890ff" : "2px dashed transparent",
        transition: "background 0.15s, border 0.15s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: 1,
          background: "#e8e8e8",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      />
      <Tooltip title="Add component here or drag from palette">
        <Button
          type="default"
          size="small"
          shape="circle"
          icon={<PlusOutlined style={{ fontSize: 12 }} />}
          onClick={onClick}
          style={{
            zIndex: 1,
            width: 24,
            height: 24,
            minWidth: 24,
            background: over ? "#e6f4ff" : "#fff",
            border: over ? "1px solid #1890ff" : "1px solid #d9d9d9",
            opacity: over ? 1 : 0.5,
            transition: "opacity 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!over) {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.borderColor = "#1890ff";
            }
          }}
          onMouseLeave={(e) => {
            if (!over) {
              e.currentTarget.style.opacity = "0.5";
              e.currentTarget.style.borderColor = "#d9d9d9";
            }
          }}
        />
      </Tooltip>
    </div>
  );
}

// ─── Component Palette Item (draggable onto canvas) ─────────────────────────────────

/** API path map for components that use static (kebab-case) theme routes.
 *  Components not listed here use /api/theme/{componentId} (dynamic route). */
const PREVIEW_API_PATH = {
  Header: "/api/theme",
  Footer: "/api/theme",
  HomeHero: "/api/theme/home-hero",
  Marquee: "/api/theme/marquee",
  Subscribe: "/api/theme/subscribe",
};

/** Map global theme response to Header component props */
function mapThemeToHeaderProps(theme) {
  return {
    siteTitle: theme.siteTitle ?? "",
    logoType: theme.logoType ?? "text",
    logoImageUrl: theme.logoLightUrl || theme.logoImageUrl || "",
    logoLightUrl: theme.logoLightUrl || theme.logoImageUrl || "",
    logoMobileUrl: theme.logoMobileUrl ?? "",
    logoDarkUrl: theme.logoDarkUrl ?? "",
    volunteerLabel: theme.headerVolunteerLabel ?? "",
    volunteerHref: theme.headerVolunteerHref ?? "",
    volunteerIconUrl: theme.headerVolunteerIconUrl ?? "",
    volunteerIconUrlMobile: theme.headerVolunteerIconUrlMobile ?? "",
    donateLabel: theme.headerDonateLabel ?? "",
    donateHref: theme.headerDonateHref ?? "",
    donateIconUrl: theme.headerDonateIconUrl ?? "",
    donateIconUrlMobile: theme.headerDonateIconUrlMobile ?? "",
    menuItems: Array.isArray(theme.menuItems) ? theme.menuItems : [],
  };
}

/** Map global theme response to Footer component props */
function mapThemeToFooterProps(theme) {
  return {
    siteTitle: theme.siteTitle ?? "",
    footerLogoUrl: theme.footerLogoUrl ?? "",
    footerAddress: theme.footerAddress ?? "",
    footerEmail: theme.footerEmail ?? "",
    footerPhone: theme.footerPhone ?? "",
    footerCol1Links: Array.isArray(theme.footerCol1Links) ? theme.footerCol1Links : [],
    footerCol2Links: Array.isArray(theme.footerCol2Links) ? theme.footerCol2Links : [],
    footerCopyrightText: theme.footerCopyrightText ?? "",
    footerBackgroundImageUrl: theme.footerBackgroundImageUrl ?? "",
  };
}

/** Live mini-preview of a site component rendered at reduced scale.
 *  Fetches saved theme data for the component so the preview shows real content. */
const PREVIEW_SCALE = 0.25;
function ComponentPreviewContent({ componentId, defaultProps }) {
  const Comp = SiteComponents[componentId];
  const innerRef = useRef(null);
  const [scaledH, setScaledH] = useState(0);
  const [themeProps, setThemeProps] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  // fetch saved component data from theme API
  useEffect(() => {
    if (!componentId) return;
    setLoadingPreview(true);
    const apiPath = PREVIEW_API_PATH[componentId] || `/api/theme/${encodeURIComponent(componentId)}`;
    fetch(apiPath, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data === "object") {
          const { themePalette: _p, colors: _c, ...props } = data;
          if (componentId === "Header") setThemeProps(mapThemeToHeaderProps(data));
          else if (componentId === "Footer") setThemeProps(mapThemeToFooterProps(data));
          else setThemeProps(props);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPreview(false));
  }, [componentId]);

  // measure height after render
  useEffect(() => {
    if (loadingPreview || !innerRef.current) return;
    const measure = () => {
      if (!innerRef.current) return;
      const h = innerRef.current.scrollHeight;
      if (h > 0) setScaledH(h * PREVIEW_SCALE);
    };
    measure();
    const t1 = setTimeout(measure, 200);
    const t2 = setTimeout(measure, 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [componentId, loadingPreview, themeProps]);

  if (!Comp) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 13 }}>
        Preview not available
      </div>
    );
  }

  if (loadingPreview) {
    return (
      <div style={{ width: 420, padding: 40, textAlign: "center", background: "#fff", borderRadius: 8 }}>
        <Spin size="small" />
      </div>
    );
  }

  const mergedProps = { ...(defaultProps || {}), ...(themeProps || {}) };

  return (
    <div
      style={{
        width: 420,
        height: scaledH || "auto",
        maxHeight: "70vh",
        overflow: "hidden",
        borderRadius: 8,
        background: "#fff",
        position: "relative",
      }}
    >
      <div
        ref={innerRef}
        style={{
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: "top left",
          width: `${100 / PREVIEW_SCALE}%`,
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <Comp {...mergedProps} />
      </div>
    </div>
  );
}

function ComponentPaletteItem({ comp, onAdd, index, loading = false }) {
  const icon = BLOCK_ICON_MAP[comp.baseComponent] || <AppstoreOutlined />;
  const catKey = comp.category || "content";
  const catMeta = CATEGORY_META[catKey] || CATEGORY_META.content;
  const id = `palette-${comp._id}-${index ?? 0}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: "palette", comp },
  });

  const hasSiteComponent = !!SiteComponents[comp.baseComponent];

  const itemContent = (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => !loading && onAdd(comp)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        cursor: loading ? "wait" : isDragging ? "grabbing" : "grab",
        borderRadius: 8,
        transition: "background 0.15s, box-shadow 0.15s",
        border: "1px solid transparent",
        opacity: loading ? 0.7 : isDragging ? 0.8 : 1,
        boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f5f5f5";
        e.currentTarget.style.border = "1px solid #e8e8e8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.border = "1px solid transparent";
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: catMeta.color + "15",
          color: catMeta.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#333",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {comp.displayName || comp.baseComponent}
          {loading && <Spin size="small" />}
        </div>
        {comp.description && (
          <div
            style={{
              fontSize: 11,
              color: "#999",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {comp.description}
          </div>
        )}
      </div>
    </div>
  );

  if (!hasSiteComponent) return itemContent;

  return (
    <Popover
      trigger="hover"
      placement="leftTop"
      mouseEnterDelay={0.4}
      mouseLeaveDelay={0.15}
      overlayStyle={{ maxWidth: 500 }}
      overlayInnerStyle={{ padding: 0, overflow: "hidden", borderRadius: 8 }}
      getPopupContainer={() => document.body}
      content={
        <ComponentPreviewContent
          componentId={comp.baseComponent}
          defaultProps={comp.defaultProps}
        />
      }
    >
      {itemContent}
    </Popover>
  );
}

// ─── Empty canvas drop zone (for drag-from-palette) ─────────

function EmptyCanvasDropZone({ onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: "insert-0" });
  return (
    <div
      ref={setNodeRef}
      style={{
        padding: "60px 24px",
        textAlign: "center",
        borderRadius: 8,
        border: isOver ? "2px dashed #1890ff" : "2px dashed #e8e8e8",
        background: isOver ? "rgba(24, 144, 255, 0.04)" : "transparent",
        transition: "border 0.15s, background 0.15s",
      }}
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span style={{ color: "#999" }}>
            Drag components here or click <strong>Add Component</strong> to
            start
          </span>
        }
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add your first component
        </Button>
      </Empty>
    </div>
  );
}

// ─── Layers panel (layer list for selection & actions, drag-and-drop reorder) ────────

function SortableLayerRow({
  block,
  index,
  sorted,
  selectedIndex,
  onSelect,
  onEdit,
  onDuplicate,
  onRemove,
  paletteComponents,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.instanceId });
  const comp = paletteComponents.find(
    (c) => c.baseComponent === block.baseComponent,
  );
  const catKey = comp?.category || "content";
  const catMeta = CATEGORY_META[catKey] || CATEGORY_META.content;
  const isSelected = selectedIndex === index;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        margin: "2px 8px",
        borderRadius: 6,
        cursor: "pointer",
        background: isSelected ? catMeta.color + "18" : "transparent",
        borderLeft: isSelected
          ? `3px solid ${catMeta.color}`
          : "3px solid transparent",
      }}
      onClick={() => onSelect(index)}
    >
      <span
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          color: "#999",
          display: "flex",
          touchAction: "none",
        }}
        title="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <HolderOutlined style={{ fontSize: 12 }} />
      </span>
      <span style={{ color: "#999", fontSize: 12 }}>{index + 1}.</span>
      <span
        style={{
          flex: 1,
          fontSize: 12,
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {block.baseComponent === "AwardsRecognition"
          ? "Overview of Our Work"
          : comp?.displayName || block.baseComponent}
      </span>
      <div
        style={{ display: "flex", alignItems: "center", gap: 2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title="Edit">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(index)}
          />
        </Tooltip>
        <Tooltip title="Duplicate">
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => onDuplicate(index)}
          />
        </Tooltip>
        <Tooltip title="Delete">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onRemove(index)}
          />
        </Tooltip>
      </div>
    </div>
  );
}

function LayersPanel({
  sorted,
  selectedIndex,
  onSelect,
  onEdit,
  onDuplicate,
  onRemove,
  onReorder,
  onClose,
  paletteComponents = [],
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over == null || active.id === over.id) return;
    const oldIndex = sorted.findIndex((b) => b.instanceId === active.id);
    const newIndex = sorted.findIndex((b) => b.instanceId === over.id);
    if (oldIndex !== -1 && newIndex !== -1 && onReorder)
      onReorder(oldIndex, newIndex);
  };
  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        borderRight: "1px solid #e8e8e8",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: "12px 12px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: "#333" }}>
          Layers
        </span>
        {onClose && (
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        )}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        {sorted.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "#999",
              fontSize: 12,
            }}
          >
            No blocks yet. Add a block to see layers.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sorted.map((b) => b.instanceId)}
              strategy={verticalListSortingStrategy}
            >
              {sorted.map((block, index) => (
                <SortableLayerRow
                  key={block.instanceId}
                  block={block}
                  index={index}
                  sorted={sorted}
                  selectedIndex={selectedIndex}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onRemove={onRemove}
                  paletteComponents={paletteComponents}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

// ─── Responsive Preview Widths ──────────────────────────────

const PREVIEW_WIDTHS = {
  desktop: "100%",
  tablet: 768,
  mobile: 375,
};

// ═══════════════════════════════════════════════════════════
// Main PageBuilder Component
// ═══════════════════════════════════════════════════════════

export default function PageBuilder({
  layout = [],
  onChange,
  showLayers = true,
  includeAntdBlocks = false,
  componentBase = null,
}) {
  /** Palette loads all reusable components from DB (system + custom) via API. */
  const [components, setComponents] = useState([]);
  /** Site components from /admin/components – shown in Add Component drawer. */
  const [siteComponentsList, setSiteComponentsList] = useState([]);
  const [siteComponentsLoading, setSiteComponentsLoading] = useState(false);
  const [theme, setTheme] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewMode, setPreviewMode] = useState("desktop");
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const showLayersPanel = showLayers && layersPanelOpen;
  const [addToSectionBlockIndex, setAddToSectionBlockIndex] = useState(null);
  const [editingInnerBlock, setEditingInnerBlock] = useState(null);
  const [editingElement, setEditingElement] = useState(null);
  const [addBlockLoading, setAddBlockLoading] = useState(null);
  const [form] = Form.useForm();
  const [adminMenusList, setAdminMenusList] = useState([]);
  /** Last nav items loaded from selected menu – used at save so all children are persisted (form may not keep them). */
  const lastLoadedNavItemsRef = useRef(null);
  const canvasRef = useRef(null);
  const siteEditFormRef = useRef(null);

  const sectionSettingsDefaults = useMemo(() => {
    const d = {};
    SECTION_SETTINGS_SCHEMA.forEach((f) => {
      if (f.default !== undefined) d[f.key] = f.default;
    });
    return d;
  }, []);

  const themeColorOptions = useMemo(() => {
    const out = [];
    const structured = [
      ["Primary", theme?.primaryColor],
      ["Secondary", theme?.secondaryColor],
      ["Body Background", theme?.bodyBackground],
      ["Section Background", theme?.sectionBackground],
      ["Card Background", theme?.cardBackground],
      ["Header Background", theme?.headerBackground],
      ["Footer Background", theme?.footerBackground],
      ["Heading", theme?.headingColor],
      ["Paragraph", theme?.paragraphColor],
      ["Link", theme?.linkColor],
      ["Hover", theme?.hoverColor],
      ["Muted Text", theme?.mutedTextColor],
      ["Border", theme?.borderColor],
      ["Button", theme?.buttonBackground],
    ];
    structured.forEach(([label, value]) => {
      if (value) out.push({ label, value });
    });
    (theme?.colors || [])
      .filter((c) => c?.name && c?.value)
      .forEach((c) => out.push({ label: c.name, value: c.value }));
    return out;
  }, [theme]);

  /** Color options for site component EditForms — uses color names as values (components store names, resolve via getColor). */
  const siteEditFormColorOptions = useMemo(() => {
    const palette = theme?.themePalette || {};
    const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
    const names = [
      ...new Set([
        ...Object.keys(palette),
        ...customColors.map((c) => c?.name).filter(Boolean),
      ]),
    ].sort();
    return names.map((name) => ({ label: name, value: name }));
  }, [theme]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    fetch("/api/admin/components")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const mapped = (list || []).map((c) => ({
          _id: c._id,
          name: c.name,
          displayName: c.displayName || c.name,
          baseComponent: c.baseComponent,
          category: (c.category || "content").toLowerCase(),
          description: c.description || "",
          propsSchema: c.propsSchema || [],
          defaultProps: c.defaultProps || {},
          active: c.active !== false,
        }));
        const withAntd = includeAntdBlocks
          ? [...mapped, ...ANT_DESIGN_BLOCKS]
          : mapped;
        setComponents(withAntd);
      })
      .catch(() => setComponents([]));
  }, [includeAntdBlocks]);

  /** Single source for palette + schema: DB components + optional Ant Design blocks. */
  const fullPalette = useMemo(
    () =>
      includeAntdBlocks ? [...components, ...ANT_DESIGN_BLOCKS] : components,
    [components, includeAntdBlocks],
  );

  useEffect(() => {
    fetch("/api/theme")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTheme(data))
      .catch(() => setTheme(null));
  }, []);

  /** Load site components for Add Component drawer (from /admin/components). */
  useEffect(() => {
    if (!addDrawerOpen) return;
    setSiteComponentsLoading(true);
    fetch("/api/admin/site-components")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => setSiteComponentsList(Array.isArray(list) ? list : []))
      .catch(() => setSiteComponentsList([]))
      .finally(() => setSiteComponentsLoading(false));
  }, [addDrawerOpen]);

  const blocks = Array.isArray(layout) ? [...layout] : [];
  const sorted = blocks
    .map((b, i) => ({ ...b, _index: i }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const triggerChange = useCallback(
    (newLayout) => {
      const withOrder = newLayout.map(({ _index, ...b }, i) => ({
        ...b,
        order: i,
      }));
      onChange(withOrder);
    },
    [onChange],
  );

  /** Header/Footer blocks are not auto-added here. */

  const categorizedComponents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? components.filter(
          (c) =>
            (c.displayName || c.baseComponent).toLowerCase().includes(q) ||
            (c.description || "").toLowerCase().includes(q) ||
            (c.category || "").toLowerCase().includes(q),
        )
      : components;
    const groups = {};
    filtered.forEach((comp) => {
      const cat = comp.category || "content";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(comp);
    });
    return groups;
  }, [components, searchQuery]);

  /** Site components filtered by enabled + search (for Add Component drawer). Header/Footer always shown. */
  const filteredSiteComponents = useMemo(() => {
    const enabledOnly = siteComponentsList.filter(
      (c) =>
        c.enabled !== false ||
        c.componentId === "Header" ||
        c.componentId === "Footer",
    );
    const q = searchQuery.toLowerCase().trim();
    if (!q) return enabledOnly;
    return enabledOnly.filter(
      (c) =>
        (c.displayName || c.componentId || "").toLowerCase().includes(q) ||
        (c.componentId || "").toLowerCase().includes(q),
    );
  }, [siteComponentsList, searchQuery]);

  /** Add a block from the palette. Site components: load defaults from Components (API) so page gets exact same UI as under Admin → Components. */
  const applyAddBlock = useCallback(
    (newBlock) => {
      if (addToSectionBlockIndex !== null) {
        const sectionBlock = sorted[addToSectionBlockIndex];
        if (sectionBlock?.baseComponent === "Section") {
          const innerLayout = Array.isArray(sectionBlock.props?.layout)
            ? [...sectionBlock.props.layout]
            : [];
          innerLayout.push({ ...newBlock, order: innerLayout.length });
          const updated = blocks.map((b) =>
            b.instanceId === sectionBlock.instanceId
              ? { ...b, props: { ...b.props, layout: innerLayout } }
              : b,
          );
          triggerChange(updated);
        }
        setAddToSectionBlockIndex(null);
        setAddDrawerOpen(false);
        setSearchQuery("");
        return;
      }
      let newLayout;
      if (insertAtIndex !== null && insertAtIndex >= 0) {
        const arr = [...sorted];
        arr.splice(insertAtIndex, 0, newBlock);
        newLayout = arr;
      } else {
        newLayout = [...sorted, newBlock];
      }
      triggerChange(newLayout.map((b, i) => ({ ...b, order: i })));
      setAddDrawerOpen(false);
      setSearchQuery("");
      setInsertAtIndex(null);
      setSelectedIndex(insertAtIndex !== null ? insertAtIndex : sorted.length);
    },
    [addToSectionBlockIndex, blocks, insertAtIndex, sorted, triggerChange],
  );

  const handleAdd = (comp) => {
    const isSiteComponent = SITE_COMPONENT_IDS.includes(comp.baseComponent);
    if (isSiteComponent) {
      setAddBlockLoading(comp.baseComponent);
      fetch(`/api/theme/${comp.baseComponent}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : {}))
        .then((componentDefaults) => {
          const baseDefaults = getDefaultPropsForNewSiteComponentBlock(
            comp.baseComponent,
          );
          const props =
            componentDefaults && typeof componentDefaults === "object"
              ? { ...baseDefaults, ...componentDefaults }
              : baseDefaults;
          const newBlock = {
            instanceId: generateId(),
            componentId: comp._id,
            baseComponent: comp.baseComponent,
            props,
            order: 0,
          };
          applyAddBlock(newBlock);
        })
        .catch(() => {
          const baseDefaults = getDefaultPropsForNewSiteComponentBlock(
            comp.baseComponent,
          );
          const newBlock = {
            instanceId: generateId(),
            componentId: comp._id,
            baseComponent: comp.baseComponent,
            props: { ...baseDefaults },
            order: 0,
          };
          applyAddBlock(newBlock);
        })
        .finally(() => setAddBlockLoading(null));
      return;
    }
    const newBlock = {
      instanceId: generateId(),
      componentId: comp._id?.startsWith?.("core-") ? null : comp._id,
      baseComponent: comp.baseComponent,
      props: { ...(comp.defaultProps || {}) },
      order: 0,
    };
    applyAddBlock(newBlock);
  };

  const handleRemove = (index) => {
    AntModal.confirm({
      title: "Delete block?",
      content: `Remove this ${sorted[index]?.baseComponent || "block"}?`,
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        const newLayout = sorted.filter((_, i) => i !== index);
        triggerChange(newLayout.map((b, i) => ({ ...b, order: i })));
        setSelectedIndex(null);
      },
    });
  };

  const handleDuplicate = (index) => {
    const block = sorted[index];
    let props = { ...(block.props || {}) };
    if (block.baseComponent === "Section" && Array.isArray(props.layout)) {
      props = {
        ...props,
        layout: props.layout.map((b) => ({
          ...b,
          instanceId: generateId(),
          order: 0,
        })),
      };
    }
    const clone = {
      instanceId: generateId(),
      componentId: block.componentId,
      baseComponent: block.baseComponent,
      props,
      order: 0,
    };
    const arr = [...sorted];
    arr.splice(index + 1, 0, clone);
    triggerChange(arr.map((b, i) => ({ ...b, order: i })));
    setSelectedIndex(index + 1);
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    setEditingInnerBlock(null);
    setEditingElement(null);
    const block = sorted[index];
    form.resetFields();
    form.setFieldsValue({ ...sectionSettingsDefaults, ...(block.props || {}) });
    setDrawerOpen(true);
  };

  const openEditElement = (blockIndex, elementKey) => {
    const block = sorted[blockIndex];
    const elementMeta =
      BLOCK_ELEMENT_FIELDS[block?.baseComponent]?.[elementKey];
    if (!block || !elementMeta) return;
    setEditingIndex(blockIndex);
    setEditingInnerBlock(null);
    setEditingElement({ blockIndex, elementKey });
    form.resetFields();
    form.setFieldsValue({ ...sectionSettingsDefaults, ...(block.props || {}) });
    setDrawerOpen(true);
  };

  const openEditInner = (sectionIndex, innerIndex) => {
    setEditingInnerBlock({ sectionIndex, innerIndex });
    const sectionBlock = sorted[sectionIndex];
    const innerLayout = Array.isArray(sectionBlock?.props?.layout)
      ? sectionBlock.props.layout
      : [];
    const inner = innerLayout[innerIndex];
    form.resetFields();
    form.setFieldsValue(inner?.props || {});
  };

  const handleEditSave = () => {
    form.validateFields().then(() => {
      let values = form.getFieldsValue(true);
      if (
        editingInnerBlock === null &&
        editingElement === null &&
        sorted[editingIndex]?.baseComponent === "Header" &&
        Array.isArray(values?.navItems)
      ) {
        const loaded = lastLoadedNavItemsRef.current;
        const formItems = values.navItems;
        const mergedNavItems =
          Array.isArray(loaded) && loaded.length === formItems.length
            ? formItems.map((item, i) => ({
                label: item?.label ?? loaded[i]?.label ?? "",
                url: item?.url ?? loaded[i]?.url ?? "#",
                hasDropdown:
                  item?.hasDropdown ?? loaded[i]?.hasDropdown ?? false,
                children: Array.isArray(loaded[i]?.children)
                  ? loaded[i].children
                  : Array.isArray(item?.children)
                    ? item.children
                    : [],
              }))
            : formItems.map((item) => {
                let children = item?.children;
                if (typeof children === "string") {
                  try {
                    children = JSON.parse(children);
                  } catch {
                    children = [];
                  }
                }
                if (!Array.isArray(children)) children = [];
                return { ...item, children };
              });
        values = { ...values, navItems: mergedNavItems };
      }
      if (editingInnerBlock !== null) {
        const { sectionIndex, innerIndex } = editingInnerBlock;
        const sectionBlock = sorted[sectionIndex];
        const innerLayout = Array.isArray(sectionBlock?.props?.layout)
          ? [...sectionBlock.props.layout]
          : [];
        if (innerLayout[innerIndex]) {
          innerLayout[innerIndex] = {
            ...innerLayout[innerIndex],
            props: values,
          };
          const updated = blocks.map((b) =>
            b.instanceId === sectionBlock.instanceId
              ? { ...b, props: { ...b.props, layout: innerLayout } }
              : b,
          );
          triggerChange(updated);
        }
        setEditingInnerBlock(null);
      } else if (editingElement !== null) {
        const { blockIndex, elementKey } = editingElement;
        const block = sorted[blockIndex];
        const elementMeta =
          BLOCK_ELEMENT_FIELDS[block?.baseComponent]?.[elementKey];
        const keys = elementMeta?.fields ?? [];
        const patch = {};
        keys.forEach((k) => {
          if (values[k] !== undefined) patch[k] = values[k];
        });
        const newProps = { ...(block.props || {}), ...patch };
        const newLayout = blocks.map((b) =>
          b.instanceId === block.instanceId ? { ...b, props: newProps } : b,
        );
        triggerChange(newLayout);
        setEditingElement(null);
      } else {
        const block = sorted[editingIndex];
        const newProps =
          block.baseComponent === "Section"
            ? { ...block.props, ...values, layout: block.props?.layout ?? [] }
            : { ...(block.props || {}), ...values };
        const newLayout = blocks.map((b) =>
          b.instanceId === block.instanceId ? { ...b, props: newProps } : b,
        );
        triggerChange(newLayout);
      }
      setDrawerOpen(false);
      setEditingIndex(null);
    });
  };

  const handleRemoveInner = (sectionIndex, innerIndex) => {
    const sectionBlock = sorted[sectionIndex];
    const innerLayout = Array.isArray(sectionBlock?.props?.layout)
      ? [...sectionBlock.props.layout]
      : [];
    innerLayout.splice(innerIndex, 1);
    const updated = blocks.map((b) =>
      b.instanceId === sectionBlock.instanceId
        ? { ...b, props: { ...b.props, layout: innerLayout } }
        : b,
    );
    triggerChange(updated);
    setEditingInnerBlock(null);
  };

  const enrichSchema = (baseComponent, schema) => {
    if (!Array.isArray(schema)) return schema;
    const enrichment = SCHEMA_ENRICHMENT[baseComponent];
    if (!enrichment) return schema;
    return schema.map((f) => ({ ...f, ...(enrichment[f.key] || {}) }));
  };

  const getPropsFields = (baseComponent) => {
    const comp = fullPalette.find((c) => c.baseComponent === baseComponent);
    const raw = comp?.propsSchema ?? [];
    if (raw.length === 0)
      return (
        <Form.Item name="text" label="Content">
          <Input.TextArea rows={2} />
        </Form.Item>
      );
    const schema = enrichSchema(baseComponent, raw);
    return schema.map((f) => renderSchemaField(f, themeColorOptions));
  };

  const getPropsFieldsForElement = (baseComponent, elementKey) => {
    const keys = BLOCK_ELEMENT_FIELDS[baseComponent]?.[elementKey]?.fields;
    if (!keys?.length) return null;
    const comp = fullPalette.find((c) => c.baseComponent === baseComponent);
    const raw = comp?.propsSchema ?? [];
    const schema = enrichSchema(baseComponent, raw);
    const byKey = Object.fromEntries(schema.map((f) => [f.key, f]));
    const fields = keys.map((k) => byKey[k]).filter(Boolean);
    if (fields.length === 0) return null;
    return fields.map((f) => renderSchemaField(f, themeColorOptions));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    // Drag from palette onto canvas drop zone
    const paletteData = active.data?.current;
    if (
      paletteData?.type === "palette" &&
      typeof over.id === "string" &&
      String(over.id).startsWith("insert-")
    ) {
      const comp = paletteData.comp;
      const dropIndex =
        parseInt(String(over.id).replace("insert-", ""), 10) || 0;
      const newBlock = {
        instanceId: generateId(),
        componentId: comp._id?.startsWith?.("core-") ? null : comp._id,
        baseComponent: comp.baseComponent,
        props: { ...(comp.defaultProps || {}) },
        order: 0,
      };
      const arr = [...sorted];
      arr.splice(dropIndex, 0, newBlock);
      triggerChange(arr.map((b, i) => ({ ...b, order: i })));
      setSelectedIndex(dropIndex);
      setAddDrawerOpen(false);
      return;
    }

    // Reorder existing blocks
    if (active.id === over.id) return;
    const oldIndex = sorted.findIndex((b) => b.instanceId === active.id);
    const newIndex = sorted.findIndex((b) => b.instanceId === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(sorted, oldIndex, newIndex);
      triggerChange(reordered.map((b, i) => ({ ...b, order: i })));
      if (selectedIndex === oldIndex) setSelectedIndex(newIndex);
    }
  };

  const openAddAt = (index) => {
    setInsertAtIndex(index);
    setAddDrawerOpen(true);
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const reordered = arrayMove(sorted, index, index - 1);
    triggerChange(reordered.map((b, i) => ({ ...b, order: i })));
    setSelectedIndex(index - 1);
  };

  const handleMoveDown = (index) => {
    if (index >= sorted.length - 1) return;
    const reordered = arrayMove(sorted, index, index + 1);
    triggerChange(reordered.map((b, i) => ({ ...b, order: i })));
    setSelectedIndex(index + 1);
  };

  const handleLayersReorder = (oldIndex, newIndex) => {
    if (oldIndex === newIndex) return;
    const reordered = arrayMove(sorted, oldIndex, newIndex);
    triggerChange(reordered.map((b, i) => ({ ...b, order: i })));
    if (selectedIndex === oldIndex) setSelectedIndex(newIndex);
  };

  const editingBlock = editingIndex !== null ? sorted[editingIndex] : null;
  const pw = PREVIEW_WIDTHS[previewMode];

  const loadMenuIntoNavItems = useCallback(
    (menuName) => {
      if (!menuName || typeof menuName !== "string") return;
      const name = String(menuName).trim();
      if (!name) return;
      fetch(`/api/admin/menus/${encodeURIComponent(name)}`)
        .then((res) => {
          if (!res.ok)
            throw new Error(
              res.status === 404
                ? "Menu not found"
                : `Failed to load menu (${res.status})`,
            );
          return res.json();
        })
        .then((menu) => {
          if (!menu || typeof menu !== "object")
            throw new Error("Invalid menu response");
          const items = Array.isArray(menu.items) ? menu.items : [];
          const navItems = menuItemsToNavItems(items);
          form.setFieldValue("navItems", navItems);
          form.setFieldValue("menuName", name);
          lastLoadedNavItemsRef.current = JSON.parse(JSON.stringify(navItems));
          message.success(
            `Loaded "${name}" (${navItems.length} item${navItems.length !== 1 ? "s" : ""}). Click Apply to save.`,
          );
        })
        .catch((err) => {
          message.error(err?.message || "Could not load menu");
        });
    },
    [form],
  );

  useEffect(() => {
    if (!drawerOpen || editingBlock?.baseComponent !== "Header") return;
    let cancelled = false;
    fetch("/api/admin/menus")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const menus = Array.isArray(list) ? list : [];
        setAdminMenusList(menus);
        if (cancelled || menus.length === 0) return null;
        const savedName = editingBlock?.props?.menuName;
        const preferred = savedName
          ? menus.find((m) => m.name === savedName)
          : menus.find(
              (m) => m.name && /header|main|primary/i.test(String(m.name)),
            ) || menus[0];
        const menuName = preferred?.name;
        if (!menuName) return null;
        return fetch(`/api/admin/menus/${encodeURIComponent(menuName)}`).then(
          (r) => (r.ok ? r.json() : null),
        );
      })
      .then((menu) => {
        if (cancelled) return;
        if (menu?.items?.length) {
          const navItems = menuItemsToNavItems(menu.items);
          form.setFieldValue("navItems", navItems);
          form.setFieldValue(
            "menuName",
            editingBlock?.props?.menuName ?? menu.name,
          );
          lastLoadedNavItemsRef.current = JSON.parse(JSON.stringify(navItems));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [
    drawerOpen,
    editingIndex,
    editingBlock?.baseComponent,
    editingBlock?.props?.menuName,
    form,
  ]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            minHeight: 400,
          }}
        >
          {/* ── Toolbar ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              background: "#fafafa",
              borderRadius: "8px 8px 0 0",
              border: "1px solid #e8e8e8",
              borderBottom: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <EyeOutlined style={{ fontSize: 16, color: "#1890ff" }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
                Visual Editor
              </span>
              {sorted.length > 0 && (
                <Badge
                  count={sorted.length}
                  style={{ backgroundColor: "#1890ff" }}
                />
              )}
              {showLayers && (
                <Button
                  type={showLayersPanel ? "primary" : "default"}
                  size="small"
                  icon={<UnorderedListOutlined />}
                  onClick={() => setLayersPanelOpen((v) => !v)}
                >
                  Layers
                </Button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Segmented
                size="small"
                value={previewMode}
                onChange={setPreviewMode}
                options={[
                  { value: "desktop", icon: <DesktopOutlined /> },
                  { value: "tablet", icon: <TabletOutlined /> },
                  { value: "mobile", icon: <MobileOutlined /> },
                ]}
              />
              {componentBase !== "Header" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setInsertAtIndex(null);
                    setAddDrawerOpen(true);
                  }}
                  size="middle"
                >
                  Add Component
                </Button>
              )}
            </div>
          </div>

          {/* ── Layers panel + Canvas ── */}
          <div
            style={{
              display: "flex",
              flex: 1,
              minHeight: 300,
              border: "1px solid #e8e8e8",
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              overflow: "hidden",
            }}
          >
            {showLayersPanel && (
              <LayersPanel
                sorted={sorted}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
                onEdit={openEdit}
                onDuplicate={handleDuplicate}
                onRemove={handleRemove}
                onReorder={handleLayersReorder}
                onClose={() => setLayersPanelOpen(false)}
                paletteComponents={fullPalette}
              />
            )}
            <div
              ref={canvasRef}
              onClick={(e) => {
                if (
                  e.target === e.currentTarget ||
                  e.target === canvasRef.current?.firstChild
                )
                  setSelectedIndex(null);
              }}
              style={{
                flex: 1,
                background: previewMode === "desktop" ? "#fff" : "#f0f0f0",
                padding: previewMode === "desktop" ? 0 : "16px",
                minWidth: 0,
                transition: "background 0.2s",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  maxWidth: typeof pw === "number" ? pw : "none",
                  margin: "0 auto",
                  background: "#fff",
                  minHeight: 300,
                  boxShadow:
                    previewMode !== "desktop"
                      ? "0 2px 12px rgba(0,0,0,0.08)"
                      : "none",
                  borderRadius: previewMode !== "desktop" ? 8 : 0,
                  overflow: "hidden",
                  transition: "max-width 0.3s",
                }}
              >
                {sorted.length === 0 ? (
                  <EmptyCanvasDropZone
                    onAdd={() => {
                      setInsertAtIndex(null);
                      setAddDrawerOpen(true);
                    }}
                  />
                ) : (
                  <SortableContext
                    items={sorted.map((b) => b.instanceId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div style={{ padding: "8px 0" }}>
                      {sorted.map((block, index) => (
                        <div key={block.instanceId}>
                          {componentBase !== "Header" && (
                            <AddBlockButton
                              onClick={() => openAddAt(index)}
                              dropIndex={index}
                            />
                          )}
                          <SortableVisualBlock
                            block={block}
                            index={index}
                            isSelected={selectedIndex === index}
                            onSelect={setSelectedIndex}
                            onEdit={openEdit}
                            onDuplicate={handleDuplicate}
                            onRemove={handleRemove}
                            onElementClick={(instanceId, elementKey) => {
                              const idx = sorted.findIndex(
                                (b) => b.instanceId === instanceId,
                              );
                              if (idx !== -1) openEditElement(idx, elementKey);
                            }}
                            paletteComponents={fullPalette}
                          />
                        </div>
                      ))}
                      {componentBase !== "Header" && (
                        <AddBlockButton
                          onClick={() => openAddAt(sorted.length)}
                          dropIndex={sorted.length}
                        />
                      )}
                    </div>
                  </SortableContext>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Component Palette Drawer ── */}
        <Drawer
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AppstoreOutlined style={{ color: "#1890ff" }} />
              <span>
                {addToSectionBlockIndex !== null
                  ? "Add element to section"
                  : "Add Component"}
              </span>
            </div>
          }
          open={addDrawerOpen}
          onClose={() => {
            setAddDrawerOpen(false);
            setSearchQuery("");
            setInsertAtIndex(null);
            setAddToSectionBlockIndex(null);
          }}
          width={400}
          styles={{ body: { padding: "0 16px 16px" } }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#fff",
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            <Input
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
              size="large"
            />
          </div>
          {siteComponentsLoading ? (
            <div style={{ textAlign: "center", marginTop: 60 }}>
              <Spin size="large" />
              <div style={{ marginTop: 12, color: "#999", fontSize: 13 }}>Loading components...</div>
            </div>
          ) : filteredSiteComponents.length === 0 ? (
            <Empty
              description={
                siteComponentsList.length === 0
                  ? "No components yet. Add components under Admin → Components."
                  : "No components match your search"
              }
              style={{ marginTop: 40 }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginTop: 12,
              }}
            >
              {filteredSiteComponents.map((item) => {
                const comp = {
                  _id: item.componentId,
                  baseComponent: item.componentId,
                  displayName: item.displayName || item.componentId,
                  defaultProps:
                    item.componentId === "Testimonials"
                      ? TESTIMONIALS_DEFAULT_PROPS
                      : getDefaultPropsForNewSiteComponent(item.componentId),
                };
                return (
                  <ComponentPaletteItem
                    key={item.componentId}
                    comp={comp}
                    onAdd={handleAdd}
                    index={item.componentId}
                    loading={addBlockLoading === item.componentId}
                  />
                );
              })}
            </div>
          )}
        </Drawer>

        {/* ── Edit Block Drawer ── */}
        <Drawer
          title={
            editingElement !== null && editingBlock ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {BLOCK_ICON_MAP[editingBlock.baseComponent] || <EditOutlined />}
                <span>
                  Edit{" "}
                  {BLOCK_ELEMENT_FIELDS[editingBlock.baseComponent]?.[
                    editingElement.elementKey
                  ]?.label ?? editingElement.elementKey}
                </span>
              </div>
            ) : editingInnerBlock !== null && editingBlock ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {BLOCK_ICON_MAP[
                  sorted[editingInnerBlock.sectionIndex]?.props?.layout?.[
                    editingInnerBlock.innerIndex
                  ]?.baseComponent
                ] || <EditOutlined />}
                <span>Edit element</span>
                <Button
                  type="text"
                  size="small"
                  onClick={() => setEditingInnerBlock(null)}
                >
                  ← Back to section
                </Button>
              </div>
            ) : editingBlock ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {BLOCK_ICON_MAP[editingBlock.baseComponent] || <EditOutlined />}
                <span>
                  {editingBlock.baseComponent === "AwardsRecognition"
                    ? "Overview of Our Work"
                    : EDITABLE_SITE_COMPONENTS.includes(
                          editingBlock.baseComponent,
                        )
                      ? editingBlock.baseComponent
                      : fullPalette.find(
                          (c) =>
                            c.baseComponent === editingBlock?.baseComponent,
                        )?.displayName || editingBlock?.baseComponent}
                </span>
              </div>
            ) : (
              "Edit block"
            )
          }
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setEditingIndex(null);
            setEditingInnerBlock(null);
            setEditingElement(null);
          }}
          width={520}
          extra={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              {editingElement !== null && (
                <Button onClick={() => setEditingElement(null)}>
                  ← Whole block
                </Button>
              )}
              {editingInnerBlock !== null && (
                <Button onClick={() => setEditingInnerBlock(null)}>
                  ← Back
                </Button>
              )}
              {!(
                editingBlock &&
                editingInnerBlock === null &&
                editingElement === null &&
                EDITABLE_SITE_COMPONENTS.includes(editingBlock.baseComponent)
              ) && (
                <>
                  <Button
                    onClick={() => {
                      setDrawerOpen(false);
                      setEditingIndex(null);
                      setEditingInnerBlock(null);
                      setEditingElement(null);
                    }}
                    icon={<CloseOutlined />}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleEditSave}
                    icon={<CheckOutlined />}
                  >
                    Apply
                  </Button>
                </>
              )}
              {editingBlock &&
                editingInnerBlock === null &&
                editingElement === null &&
                EDITABLE_SITE_COMPONENTS.includes(
                  editingBlock.baseComponent,
                ) && (
                  <>
                    <span style={{ flex: 1, minWidth: 8 }} />
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => siteEditFormRef.current?.update?.()}
                    >
                      Update
                    </Button>
                  </>
                )}
            </div>
          }
        >
          <Form form={form} layout="vertical">
            {editingInnerBlock === null &&
              editingElement === null &&
              editingBlock &&
              (EDITABLE_SITE_COMPONENTS.includes(editingBlock.baseComponent) ||
                editingBlock.baseComponent === "AwardsRecognition") &&
              (() => {
                const isLegacyAwards =
                  editingBlock.baseComponent === "AwardsRecognition";
                const EditFormComp =
                  EDITABLE_SITE_EDIT_FORMS[editingBlock.baseComponent] ??
                  (isLegacyAwards
                    ? EDITABLE_SITE_EDIT_FORMS["OverviewOfOurWork"]
                    : null);
                if (!EditFormComp) return null;
                const isPageContext = !componentBase;
                const handleSaveToPage = (payload) => {
                  if (editingIndex == null) return;
                  const block = sorted[editingIndex];
                  if (!block) return;
                  if (block.baseComponent === "AwardsRecognition") {
                    const newLayout = blocks.map((b) =>
                      b.instanceId === block.instanceId
                        ? {
                            ...b,
                            baseComponent: "OverviewOfOurWork",
                            props: payload,
                          }
                        : b,
                    );
                    triggerChange(newLayout);
                  } else {
                    const newProps = { ...(block.props || {}), ...payload };
                    const newLayout = blocks.map((b) =>
                      b.instanceId === block.instanceId
                        ? { ...b, props: newProps }
                        : b,
                    );
                    triggerChange(newLayout);
                  }
                };
                const initialData = isPageContext
                  ? isLegacyAwards
                    ? normalizeAwardsBlockPropsToOverview(editingBlock?.props)
                    : editingBlock?.props
                  : undefined;
                return (
                  <EditFormComp
                    ref={siteEditFormRef}
                    source={isPageContext ? "page" : undefined}
                    initialData={initialData}
                    onSaveToPage={isPageContext ? handleSaveToPage : undefined}
                    themeColorOptions={siteEditFormColorOptions}
                    onSuccess={() => {
                      setDrawerOpen(false);
                      setEditingIndex(null);
                      setEditingInnerBlock(null);
                      setEditingElement(null);
                      if (!isPageContext)
                        fetch("/api/theme")
                          .then((r) => (r.ok ? r.json() : null))
                          .then(setTheme);
                    }}
                    onCancel={() => {
                      setDrawerOpen(false);
                      setEditingIndex(null);
                      setEditingInnerBlock(null);
                      setEditingElement(null);
                    }}
                  />
                );
              })()}

            {editingElement !== null &&
              editingBlock &&
              getPropsFieldsForElement(
                editingBlock.baseComponent,
                editingElement.elementKey,
              )}

            {editingInnerBlock !== null &&
              editingBlock &&
              editingElement === null &&
              (() => {
                const sectionBlock = sorted[editingInnerBlock.sectionIndex];
                const innerBlock =
                  sectionBlock?.props?.layout?.[editingInnerBlock.innerIndex];
                return innerBlock
                  ? getPropsFields(innerBlock.baseComponent)
                  : null;
              })()}

            {editingInnerBlock === null &&
              editingElement === null &&
              editingBlock &&
              editingBlock.baseComponent === "Section" && (
                <Collapse
                  accordion
                  defaultActiveKey={[]}
                  items={[
                    {
                      key: "section-settings",
                      label: "Section settings",
                      children: (
                        <>
                          {renderSchemaField(
                            {
                              key: "backgroundColor",
                              type: "color",
                              label: "Background color",
                            },
                            themeColorOptions,
                          )}
                          {renderSchemaField(
                            {
                              key: "padding",
                              type: "text",
                              label: "Padding (e.g. 2rem 1rem)",
                            },
                            themeColorOptions,
                          )}
                        </>
                      ),
                    },
                    {
                      key: "section-content",
                      label: "Content - add elements inside this section",
                      children: (
                        <div style={{ marginBottom: 12 }}>
                          {(Array.isArray(editingBlock?.props?.layout)
                            ? editingBlock.props.layout
                            : []
                          ).map((inner, idx) => {
                            const comp = fullPalette.find(
                              (c) => c.baseComponent === inner.baseComponent,
                            );
                            const displayName =
                              comp?.displayName || inner.baseComponent;
                            return (
                              <div
                                key={inner.instanceId || idx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 12px",
                                  background: "#fafafa",
                                  borderRadius: 6,
                                  marginBottom: 6,
                                }}
                              >
                                <span style={{ flex: 1, fontSize: 13 }}>
                                  {displayName}
                                </span>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() =>
                                    openEditInner(editingIndex, idx)
                                  }
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() =>
                                    handleRemoveInner(editingIndex, idx)
                                  }
                                >
                                  Delete
                                </Button>
                              </div>
                            );
                          })}
                          <Button
                            type="dashed"
                            block
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setAddToSectionBlockIndex(editingIndex);
                              setDrawerOpen(false);
                              setAddDrawerOpen(true);
                            }}
                            style={{ marginTop: 8 }}
                          >
                            Add element (text, image, icon…)
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              )}

            {editingInnerBlock === null &&
              editingElement === null &&
              editingBlock &&
              !EDITABLE_SITE_COMPONENTS.includes(editingBlock.baseComponent) &&
              editingBlock.baseComponent !== "Section" &&
              (editingBlock.baseComponent === "Header" ? (
                (() => {
                  const comp = fullPalette.find(
                    (c) => c.baseComponent === "Header",
                  );
                  const raw = [
                    ...(Array.isArray(comp?.propsSchema)
                      ? comp.propsSchema
                      : []),
                    ...NAVBAR_SCHEMA,
                    ...LOGO_RESPONSIVE_SCHEMA,
                    ...MENU_SCHEMA,
                  ];
                  const schema = enrichSchema("Header", raw);
                  const byKey = Object.fromEntries(
                    schema.map((f) => [f.key, f]),
                  );
                  const headerItems = [
                    ...HEADER_FIELD_GROUPS.map((grp) => ({
                      key: grp.label
                        .replace(/\s+/g, "-")
                        .toLowerCase()
                        .replace(/&/g, "and"),
                      label: grp.label,
                      children: (
                        <>
                          {grp.label === "Menu" && (
                            <Form.Item
                              key="select-menu"
                              label="Select menu"
                              name="menuName"
                            >
                              <Select
                                placeholder="Choose a menu…"
                                allowClear
                                options={adminMenusList.map((m) => ({
                                  value: m.name,
                                  label: m.name,
                                }))}
                                onChange={(name) => {
                                  if (name) loadMenuIntoNavItems(name);
                                }}
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          )}
                          {grp.keys
                            .map((k) =>
                              byKey[k]
                                ? renderSchemaField(byKey[k], themeColorOptions)
                                : null,
                            )
                            .filter(Boolean)}
                        </>
                      ),
                    })),
                    {
                      key: "section-settings",
                      label: "Section Settings",
                      children: (
                        <>
                          {SECTION_SETTINGS_SCHEMA.map((f) =>
                            renderSchemaField(f, themeColorOptions),
                          )}
                        </>
                      ),
                    },
                  ];
                  return (
                    <Collapse
                      accordion
                      defaultActiveKey={[]}
                      items={headerItems}
                    />
                  );
                })()
              ) : (
                <>
                  {getPropsFields(editingBlock.baseComponent)}
                  <Collapse
                    accordion
                    defaultActiveKey={[]}
                    items={[
                      {
                        key: "section-settings",
                        label: "Section Settings",
                        children: (
                          <>
                            {SECTION_SETTINGS_SCHEMA.map((f) =>
                              renderSchemaField(f, themeColorOptions),
                            )}
                          </>
                        ),
                      },
                    ]}
                  />
                </>
              ))}
          </Form>
        </Drawer>
      </>
    </DndContext>
  );
}
