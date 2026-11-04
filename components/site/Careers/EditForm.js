"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin, Select } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Careers";
const PREFIX = "careers";

const DEFAULT_CAREERS_UPLOAD_POSITIONS = [
  "Programme Coordinator",
  "Medical Officer",
  "Accounts Executive",
  "Content & Communications Executive",
];

function extractPositionsFromData(data) {
  if (!data || typeof data !== "object") return [];
  const raw = data?.careersUploadPositions ?? data?.positions;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  const text = data?.careersUploadPositionsText ?? data?.positionsText;
  if (typeof text === "string" && text.trim()) {
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function findMatchingPosition(val, positions) {
  if (!val || typeof val !== "string" || !Array.isArray(positions) || positions.length === 0) {
    return null;
  }
  const raw = val.trim();
  const exact = positions.find((p) => p.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;

  let rolePart = raw;
  if (raw.includes("role=")) {
    try {
      const q = raw.includes("?") ? raw.split("?")[1] : raw;
      const sp = new URLSearchParams(q);
      if (sp.get("role")) rolePart = sp.get("role");
    } catch {}
  }
  const cleanRole = rolePart.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleanRole) return null;
  const match = positions.find((p) => {
    const cleanPos = p.toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleanPos === cleanRole;
  });
  return match || null;
}

const DEFAULT_ITEMS = [
  { title: "Programme Coordinator", department: "Education Dept.", location: "Mumbai", type: "Full-time", applyUrl: "Programme Coordinator", btnText: "Apply Now" },
  { title: "Medical Officer", department: "Healthcare", location: "Mumbai", type: "Full-time", applyUrl: "Medical Officer", btnText: "Apply Now" },
  { title: "Content & Communications Executive", department: "Media", location: "Mumbai", type: "Full-time", applyUrl: "Content & Communications Executive", btnText: "Apply Now" },
];

function normalizeItem(it) {
  return {
    title: it?.title != null ? String(it.title).trim() : "",
    department: it?.department != null ? String(it.department).trim() : "",
    location: it?.location != null ? String(it.location).trim() : "",
    type: it?.type != null ? String(it.type).trim() : "",
    applyUrl: it?.applyUrl != null ? String(it.applyUrl).trim() : "",
    btnText: it?.btnText != null ? String(it.btnText).trim() : "Apply Now",
  };
}

function CareersEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [], allPageBlocks = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const [careersUploadPositions, setCareersUploadPositions] = useState(DEFAULT_CAREERS_UPLOAD_POSITIONS);
  const [fetchingPositions, setFetchingPositions] = useState(false);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  const loadPositions = () => {
    let fromBlocks = [];
    if (Array.isArray(allPageBlocks)) {
      const cuBlock = allPageBlocks.find(
        (b) => b?.baseComponent === "CareersUpload" || b?.componentId === "CareersUpload"
      );
      if (cuBlock?.props) {
        fromBlocks = extractPositionsFromData(cuBlock.props);
      }
    }

    if (fromBlocks.length > 0) {
      setCareersUploadPositions(fromBlocks);
    }

    setFetchingPositions(true);
    fetch("/api/theme/CareersUpload", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((themeData) => {
        const fromTheme = extractPositionsFromData(themeData);
        if (fromBlocks.length > 0) {
          setCareersUploadPositions(fromBlocks);
        } else if (fromTheme.length > 0) {
          setCareersUploadPositions(fromTheme);
        } else {
          setCareersUploadPositions(DEFAULT_CAREERS_UPLOAD_POSITIONS);
        }
      })
      .catch(() => {
        if (fromBlocks.length === 0) {
          setCareersUploadPositions(DEFAULT_CAREERS_UPLOAD_POSITIONS);
        }
      })
      .finally(() => setFetchingPositions(false));
  };

  useEffect(() => {
    loadPositions();
  }, [allPageBlocks]);

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    const setFormAndColors = (data, theme) => {
      const items = Array.isArray(data?.careersItems)
        ? data.careersItems.map((it) => {
            const normalized = normalizeItem(it);
            const matched = findMatchingPosition(normalized.applyUrl, careersUploadPositions);
            if (matched) {
              normalized.applyUrl = matched;
            }
            return normalized;
          })
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "",
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        careersTitleEnabled: data?.careersTitleEnabled !== false,
        careersSubTitleEnabled: data?.careersSubTitleEnabled !== false,
        careersSubTitleColorKey: data?.careersSubTitleColorKey != null ? String(data.careersSubTitleColorKey).trim() : "",
        careersJobTitleColorKey: data?.careersJobTitleColorKey != null ? String(data.careersJobTitleColorKey).trim() : "",
        careersMetaIconColorKey: data?.careersMetaIconColorKey != null ? String(data.careersMetaIconColorKey).trim() : "",
        careersMetaTextColorKey: data?.careersMetaTextColorKey != null ? String(data.careersMetaTextColorKey).trim() : "",
        careersBtnBgColorKey: data?.careersBtnBgColorKey != null ? String(data.careersBtnBgColorKey).trim() : "",
        careersBtnTextColorKey: data?.careersBtnTextColorKey != null ? String(data.careersBtnTextColorKey).trim() : "",
        careersItems: items.length > 0 ? items : DEFAULT_ITEMS.map(normalizeItem),
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
      .catch(() => message.error("Failed to load Careers"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.careersItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        careersTitleEnabled: values.careersTitleEnabled !== false,
        careersSubTitleEnabled: values.careersSubTitleEnabled !== false,
        careersSubTitleColorKey: values.careersSubTitleColorKey != null ? String(values.careersSubTitleColorKey).trim() : "",
        careersJobTitleColorKey: values.careersJobTitleColorKey != null ? String(values.careersJobTitleColorKey).trim() : "",
        careersMetaIconColorKey: values.careersMetaIconColorKey != null ? String(values.careersMetaIconColorKey).trim() : "",
        careersMetaTextColorKey: values.careersMetaTextColorKey != null ? String(values.careersMetaTextColorKey).trim() : "",
        careersBtnBgColorKey: values.careersBtnBgColorKey != null ? String(values.careersBtnBgColorKey).trim() : "",
        careersBtnTextColorKey: values.careersBtnTextColorKey != null ? String(values.careersBtnTextColorKey).trim() : "",
        careersItems: items,
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
        .then(() => { message.success("Careers saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  return (
    <Form preserve={true} form={form} layout="vertical">
      <Collapse
        destroyInactivePanel={false}
        defaultActiveKey={[]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Careers")} />,
          },
          {
            key: "items",
            label: "Manage Jobs",
            children: (
              <Form.List name="careersItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Job"
                    addButtonText="Add job"
                    defaultAddPayload={{
                      title: "",
                      department: "",
                      location: "",
                      type: "Full-time",
                      applyUrl: careersUploadPositions[0] || "",
                      btnText: "Apply Now",
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
                            name={[name, "title"]}
                            label="Job Title"
                            rules={[{ required: true, message: "Title is required" }]}
                          >
                            <Input placeholder="e.g. Programme Coordinator" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "department"]} label="Department">
                            <Input placeholder="e.g. Education Dept." size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "location"]} label="Location">
                            <Input placeholder="e.g. Mumbai" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "type"]} label="Job Type">
                            <Input placeholder="e.g. Full-time" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "btnText"]} label="Button Text">
                            <Input placeholder="Apply Now" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            noStyle
                            shouldUpdate={(prev, cur) =>
                              prev?.careersItems?.[name]?.applyUrl !== cur?.careersItems?.[name]?.applyUrl
                            }
                          >
                            {() => {
                              const curVal = form.getFieldValue(["careersItems", name, "applyUrl"]);
                              const baseOptions = careersUploadPositions.map((pos) => ({
                                label: pos,
                                value: pos,
                              }));
                              const matched = findMatchingPosition(curVal, careersUploadPositions);
                              if (curVal && !careersUploadPositions.includes(curVal) && !matched) {
                                baseOptions.push({
                                  label: `${curVal} (Custom / External)`,
                                  value: curVal,
                                });
                              }
                              return (
                                <Form.Item
                                  {...restField}
                                  name={[name, "applyUrl"]}
                                  label={
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                      <span>Apply URL</span>
                                      <span
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          loadPositions();
                                          message.info("Positions refreshed from Careers Upload");
                                        }}
                                        style={{
                                          fontSize: 12,
                                          color: "#1890ff",
                                          cursor: "pointer",
                                          fontWeight: "normal",
                                          marginLeft: 8,
                                        }}
                                      >
                                        ↻ Refresh Positions
                                      </span>
                                    </div>
                                  }
                                  extra="Select the position from Careers Upload. Clicking Apply on the job card will scroll to the form and auto-select this role."
                                >
                                  <Select
                                    size="large"
                                    showSearch
                                    allowClear
                                    placeholder="Select position from Careers Upload..."
                                    loading={fetchingPositions}
                                    options={baseOptions}
                                  />
                                </Form.Item>
                              );
                            }}
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

export default forwardRef(CareersEditForm);
