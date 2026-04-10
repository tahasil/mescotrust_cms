"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin, Select, Switch } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/SocialMediaWall";
const PREFIX = "socialMediaWall";

const PLATFORM_OPTIONS = [
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "YouTube", value: "youtube" },
  { label: "X (Twitter)", value: "twitter" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Google Maps", value: "googlemaps" },
  { label: "Other", value: "other" },
];

const DEFAULT_POSTS = [
  { platform: "instagram", username: "@mescotrust", caption: "", image: "", date: "", postUrl: "", enabled: true },
  { platform: "facebook", username: "MESCO Trust", caption: "", image: "", date: "", postUrl: "", enabled: true },
  { platform: "youtube", username: "MESCO Trust", caption: "", image: "", date: "", postUrl: "", enabled: true },
];

function normalizePost(it) {
  return {
    platform: it?.platform != null ? String(it.platform).trim() : "other",
    username: it?.username != null ? String(it.username).trim() : "",
    caption: it?.caption != null ? String(it.caption).trim() : "",
    image: it?.image != null ? String(it.image).trim() : "",
    date: it?.date != null ? String(it.date).trim() : "",
    postUrl: it?.postUrl != null ? String(it.postUrl).trim() : "",
    enabled: it?.enabled !== false,
  };
}

function SocialMediaWallEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      const posts = Array.isArray(data?.socialMediaWallPosts)
        ? data.socialMediaWallPosts.map(normalizePost)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "Social Media Wall",
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        socialMediaWallTitleEnabled: data?.socialMediaWallTitleEnabled !== false,
        socialMediaWallSubTitleEnabled: data?.socialMediaWallSubTitleEnabled !== false,
        socialMediaWallSubTitleColorKey: data?.socialMediaWallSubTitleColorKey != null ? String(data.socialMediaWallSubTitleColorKey).trim() : "",
        socialMediaWallPosts: posts.length > 0 ? posts : DEFAULT_POSTS.map(normalizePost),
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
      .catch(() => message.error("Failed to load Social Media Wall"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawPosts = values.socialMediaWallPosts ?? [];
      const posts = Array.isArray(rawPosts) ? rawPosts.map(normalizePost) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "Social Media Wall",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        socialMediaWallTitleEnabled: values.socialMediaWallTitleEnabled !== false,
        socialMediaWallSubTitleEnabled: values.socialMediaWallSubTitleEnabled !== false,
        socialMediaWallSubTitleColorKey: values.socialMediaWallSubTitleColorKey != null ? String(values.socialMediaWallSubTitleColorKey).trim() : "",
        socialMediaWallPosts: posts,
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
        .then(() => { message.success("Social Media Wall saved"); onSuccess?.(); })
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
        defaultActiveKey={["posts"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("SocialMediaWall")} />,
          },
          {
            key: "posts",
            label: "Manage Posts",
            children: (
              <Form.List name="socialMediaWallPosts">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Post"
                    addButtonText="Add post"
                    defaultAddPayload={{
                      platform: "instagram",
                      username: "",
                      caption: "",
                      image: "",
                      date: "",
                      postUrl: "",
                      enabled: true,
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
                        <Col span={10}>
                          <Form.Item {...restField} name={[name, "platform"]} label="Platform">
                            <Select options={PLATFORM_OPTIONS} size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={11}>
                          <Form.Item {...restField} name={[name, "username"]} label="Username / Source">
                            <Input placeholder="e.g. @mescotrust" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Form.Item {...restField} name={[name, "enabled"]} label="Active" valuePropName="checked">
                            <Switch />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "image"]} label="Image URL">
                            <Input placeholder="/uploads/post-image.webp or https://..." size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "caption"]} label="Caption / Text">
                            <Input.TextArea rows={3} placeholder="Post caption or description..." size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "date"]} label="Date">
                            <Input placeholder="e.g. 14 Apr, 2025" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "postUrl"]}
                            label="Post URL"
                            tooltip="Link to the original post. Opens in modal 'View on Platform' button."
                          >
                            <Input placeholder="https://www.instagram.com/p/ABC123/" size="large" />
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

export default forwardRef(SocialMediaWallEditForm);
