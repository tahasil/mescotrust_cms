"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Collapse, Form, Input, Select, Spin, message } from "antd";
import {
  AimOutlined,
  BookOutlined,
  BulbOutlined,
  GlobalOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  CelebrationsMilestonesIcon,
  CharitablePhysiotherapyIcon,
  FigmaMissionIcon,
  FigmaVisionIcon,
  GuidanceMotivationIcon,
  MedicalAidDispensaryIcon,
  MumbaiCityUnitIcon,
  MumbaiSuburbanUnitIcon,
  SaturdayActivitiesIcon,
  SportsFacilitiesIcon,
  ThaneUnitIcon,
} from "./icons";

const API_PATH = "/api/theme/MissionVision";
const PREFIX = "missionVision";
const ICON_OPTIONS = [
  ["mumbai-city-unit", "Mumbai City Unit", MumbaiCityUnitIcon],
  ["mumbai-suburban-unit", "Mumbai Suburban Unit", MumbaiSuburbanUnitIcon],
  ["thane-unit", "Thane Unit", ThaneUnitIcon],
  ["celebrations-milestones", "Celebrations & Milestones", CelebrationsMilestonesIcon],
  ["guidance-motivation", "Guidance & Motivation", GuidanceMotivationIcon],
  ["sports-facilities", "Sports Facilities", SportsFacilitiesIcon],
  ["saturday-activities", "Saturday Activities", SaturdayActivitiesIcon],
  ["medical-aid-dispensary", "Medical Aid Dispensary", MedicalAidDispensaryIcon],
  ["charitable-physiotherapy", "Charitable Physiotherapy Centre", CharitablePhysiotherapyIcon],
  ["eye", "Vision Eye", FigmaVisionIcon],
  ["compass", "Mission Compass", FigmaMissionIcon],
  ["aim", "Aim", AimOutlined],
  ["heart", "Heart", HeartOutlined],
  ["bulb", "Idea", BulbOutlined],
  ["team", "Team", TeamOutlined],
  ["book", "Education", BookOutlined],
  ["medicine", "Medical", MedicineBoxOutlined],
  ["safety", "Trust", SafetyCertificateOutlined],
  ["global", "Global", GlobalOutlined],
].map(([value, text, Icon]) => ({
  value,
  label: (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <Icon style={{ display: "block", flex: "0 0 18px", width: 18, height: 18 }} />
      <span>{text}</span>
    </span>
  ),
}));
const ICON_VALUES = new Set(ICON_OPTIONS.map((item) => item.value));
const normalizeIcon = (value, fallback) => ICON_VALUES.has(clean(value)) ? clean(value) : fallback;
const DEFAULTS = { mainTitle: "", subTitle: "" };
const CARDS_PER_ROW_OPTIONS = [1, 2, 3, 4].map((value) => ({
  value,
  label: `${value} ${value === 1 ? "Card" : "Cards"}`,
}));
const DEFAULT_CARDS = [
  {
    title: "Vision",
    description: "To help the underprivileged and marginalised live a better tomorrow through various interventions.",
    icon: "eye",
  },
  {
    title: "Mission",
    description: "Strive to improve the quality of life of the financially disadvantaged by promoting meaningful education and health.",
    icon: "compass",
  },
];
const BOOLEAN_FIELDS = ["missionVisionTitleEnabled", "missionVisionSubTitleEnabled"];
const COLOR_FIELDS = [
  "missionVisionSubTitleColorKey",
  "missionVisionMainTitleColorKey",
  "missionVisionCardBgColorKey",
  "missionVisionCardHoverBgColorKey",
  "missionVisionCardBorderColorKey",
  "missionVisionCardHoverBorderColorKey",
  "missionVisionIconColorKey",
  "missionVisionIconBgColorKey",
  "missionVisionIconHoverColorKey",
  "missionVisionIconHoverBgColorKey",
  "missionVisionTitleColorKey",
  "missionVisionTextColorKey",
  "missionVisionMobileColorKey",
];
const clean = (value) => value == null ? "" : String(value).trim();

function normalizeCard(item, index = 0) {
  const fallback = DEFAULT_CARDS[index] || { title: "", description: "", icon: "aim" };
  return {
    title: clean(item?.title) || fallback.title,
    description: clean(item?.description) || fallback.description,
    icon: normalizeIcon(item?.icon, fallback.icon),
    mobileNumber: clean(item?.mobileNumber),
  };
}

function resolveCards(data = {}) {
  if (Array.isArray(data.missionVisionItems)) {
    return data.missionVisionItems.map(normalizeCard);
  }
  return [
    normalizeCard({
      title: data.missionVisionVisionTitle,
      description: data.missionVisionVisionDescription,
      icon: data.missionVisionVisionIcon,
    }, 0),
    normalizeCard({
      title: data.missionVisionMissionTitle,
      description: data.missionVisionMissionDescription,
      icon: data.missionVisionMissionIcon,
    }, 1),
  ];
}

function MissionVisionEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, themeColorOptions: suppliedColors = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(suppliedColors);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const fetchedRef = useRef(false);
  const isPageBlock = source === "page";
  const applyValues = useCallback((data = {}) => form.setFieldsValue({
    ...DEFAULTS,
    ...Object.fromEntries(Object.keys(DEFAULTS).map((field) => [field, data[field] != null ? clean(data[field]) : DEFAULTS[field]])),
    missionVisionItems: resolveCards(data),
    missionVisionCardsPerRow: Math.max(1, Math.min(4, Number(data.missionVisionCardsPerRow) || 2)),
    ...Object.fromEntries(BOOLEAN_FIELDS.map((field) => [field, data[field] !== false])),
    ...Object.fromEntries(COLOR_FIELDS.map((field) => [field, clean(data[field])])),
    ...getManageSectionInitialValues(PREFIX, data),
  }), [form]);
  const applyColors = useCallback((theme = {}) => {
    const names = [...new Set([
      ...Object.keys(theme.themePalette || {}),
      ...(Array.isArray(theme.colors) ? theme.colors.map((item) => item?.name).filter(Boolean) : []),
    ])].sort();
    setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
  }, []);
  useEffect(() => { if (suppliedColors.length) setThemeColorOptions(suppliedColors); }, [suppliedColors]);
  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyValues(initialDataProp || {});
      if (!fetchedRef.current) {
        fetchedRef.current = true;
        fetch("/api/theme", { cache: "no-store" }).then((r) => r.ok ? r.json() : {}).then(applyColors).catch(() => {}).finally(() => setLoading(false));
      } else setLoading(false);
      return;
    }
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((r) => r.ok ? r.json() : {}),
      fetch("/api/theme", { cache: "no-store" }).then((r) => r.ok ? r.json() : {}),
    ]).then(([data, theme]) => { applyValues(data); applyColors(theme); })
      .catch(() => message.error("Failed to load Mission & Vision"))
      .finally(() => setLoading(false));
  }, [applyColors, applyValues, initialDataProp, isPageBlock]);
  const payloadFrom = (values) => {
    const cards = Array.isArray(values.missionVisionItems)
      ? values.missionVisionItems.map(normalizeCard)
      : [];
    return {
      ...Object.fromEntries([...Object.keys(DEFAULTS), ...COLOR_FIELDS].map((field) => [field, clean(values[field])])),
      ...Object.fromEntries(BOOLEAN_FIELDS.map((field) => [field, values[field] !== false])),
      missionVisionItems: cards,
      missionVisionCardsPerRow: Math.max(1, Math.min(4, Number(values.missionVisionCardsPerRow) || 2)),
      // Keep legacy fields synchronized for existing integrations and saved defaults.
      missionVisionVisionTitle: cards[0]?.title || "",
      missionVisionVisionDescription: cards[0]?.description || "",
      missionVisionVisionIcon: cards[0]?.icon || "eye",
      missionVisionMissionTitle: cards[1]?.title || "",
      missionVisionMissionDescription: cards[1]?.description || "",
      missionVisionMissionIcon: cards[1]?.icon || "compass",
      ...getManageSectionPayload(PREFIX, values),
    };
  };
  const handleUpdate = () => form.validateFields().then(() => {
    const payload = payloadFrom(form.getFieldsValue(true));
    if (isPageBlock && onSaveToPage) { onSaveToPage(payload); message.success("Changes will be saved with the page"); onSuccess?.(); return; }
    setSaving(true);
    fetch(API_PATH, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then((r) => r.ok ? undefined : r.json().then((data) => Promise.reject(data)))
      .then(() => { message.success("Mission & Vision saved"); onSuccess?.(); })
      .catch((error) => message.error(error?.error || "Failed to save"))
      .finally(() => setSaving(false));
  }).catch(() => {});
  useImperativeHandle(ref, () => ({ update: handleUpdate }));
  if (loading || saving) return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  return (
    <Form form={form} layout="vertical">
      <Collapse defaultActiveKey={["content"]} items={[
        { key: "section", label: "Manage Section", children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} /> },
        { key: "content", label: "Content", children: (
          <>
          <Form.Item
            name="missionVisionCardsPerRow"
            label="Cards Per Row"
            tooltip="Number of cards displayed in each desktop row. Tablet and mobile adjust automatically."
          >
            <Select options={CARDS_PER_ROW_OPTIONS} />
          </Form.Item>
          <Form.List name="missionVisionItems">
            {(fields, { add, remove, move }) => (
              <SortableFormList
                fields={fields}
                add={add}
                remove={remove}
                move={move}
                itemLabel="Card"
                addButtonText="Add card"
                defaultAddPayload={{ title: "New card", description: "", icon: "aim", mobileNumber: "" }}
                reorderMovedIndex={reorderMovedIndex}
                reorderDirection={reorderDirection}
                resolveItemTitle={(index) => form.getFieldValue(["missionVisionItems", index, "title"]) || `Card ${index + 1}`}
                onMoveWithTransition={(from, to) => {
                  setReorderDirection(to < from ? "up" : "down");
                  setReorderMovedIndex(to);
                  setTimeout(() => setReorderMovedIndex(-1), 400);
                }}
                renderItemContent={(name, restField) => (
                  <>
                    <Form.Item
                      {...restField}
                      name={[name, "title"]}
                      label="Card title"
                      rules={[{ required: true, message: "Card title is required" }]}
                    >
                      <Input placeholder="Enter card title" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "description"]}
                      label="Card description"
                      rules={[{ required: true, message: "Card description is required" }]}
                    >
                      <Input.TextArea rows={3} placeholder="Enter card description" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "icon"]} label="Card icon">
                      <Select options={ICON_OPTIONS} placeholder="Select card icon" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "mobileNumber"]}
                      label="Mobile Number (optional)"
                    >
                      <Input type="tel" placeholder="e.g. +91 99699 37812" />
                    </Form.Item>
                  </>
                )}
              />
            )}
          </Form.List>
          </>
        ) },
        { key: "title-colors", label: "Title & Colors", children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("MissionVision")} /> },
      ]} />
    </Form>
  );
}

export default forwardRef(MissionVisionEditForm);
