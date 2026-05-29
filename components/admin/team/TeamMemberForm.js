"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  message,
} from "antd";
import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { toText } from "@/lib/teamUtils";
import { isTeamMemberMappingSupported } from "@/lib/teamSliderSupport";
import { ensureMailto, normalizeLinkTarget } from "@/lib/linkUtils";

function toInitialValues(member) {
  const source = member && typeof member === "object" ? member : {};
  const rawSocialLinks = Array.isArray(source?.socialLinks)
    ? source.socialLinks
    : [];
  const firstSocialLink =
    rawSocialLinks.find(
      (item) => toText(item?.platform) || toText(item?.url),
    ) || null;

  return {
    name: toText(source?.name),
    categoryId: toText(source?.categoryId),
    designation: toText(source?.designation),
    image: toText(source?.image),
    bio: toText(source?.bio),
    mappedSliderComponentId: toText(
      source?.features?.mappedSliderComponentId ||
        source?.mappedSliderComponentId,
    ),
    socialLinks: firstSocialLink
      ? [
          {
            platform: toText(firstSocialLink?.platform),
            url: toText(firstSocialLink?.url),
            target: normalizeLinkTarget(
              firstSocialLink?.target ??
                firstSocialLink?.sourceTarget ??
                firstSocialLink?.openInNewTab,
              "_self",
            ),
          },
        ]
      : [],
    order: Number.isFinite(Number(source?.order)) ? Number(source.order) : 0,
    status: source?.status !== false,
  };
}

const SOCIAL_PLATFORM_OPTIONS = [
  { label: "Facebook", value: "Facebook" },
  { label: "Instagram", value: "Instagram" },
  { label: "LinkedIn", value: "LinkedIn" },
  { label: "X (Twitter)", value: "X" },
  { label: "YouTube", value: "YouTube" },
  { label: "WhatsApp", value: "WhatsApp" },
  { label: "Telegram", value: "Telegram" },
  { label: "Pinterest", value: "Pinterest" },
  { label: "Snapchat", value: "Snapchat" },
  { label: "Threads", value: "Threads" },
  { label: "GitHub", value: "GitHub" },
];

export default function TeamMemberForm({ slug = "" }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [member, setMember] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sliderOptions, setSliderOptions] = useState([]);
  const isEdit = toText(slug) !== "";

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const categoriesReq = fetch("/api/admin/team-categories")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => (Array.isArray(data?.items) ? data.items : []))
      .catch(() => []);

    const slidersReq = fetch("/api/admin/site-components")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) =>
        (Array.isArray(list) ? list : [])
          .filter((item) => item?.module === "sliders")
          .sort((a, b) => {
            const aOrder = Number.isFinite(Number(a?.order))
              ? Number(a.order)
              : 0;
            const bOrder = Number.isFinite(Number(b?.order))
              ? Number(b.order)
              : 0;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return toText(a?.displayName || a?.componentId).localeCompare(
              toText(b?.displayName || b?.componentId),
            );
          })
          .map((item) => {
            const sliderId = toText(item?.componentId);
            const supportsMapping = isTeamMemberMappingSupported(sliderId);
            const isEnabled = item?.enabled !== false;
            const disabledReason = !supportsMapping
              ? " (Feature not supported)"
              : !isEnabled
                ? " (Disabled)"
                : "";
            return {
              label: `${toText(item?.displayName) || sliderId}${disabledReason}`,
              value: sliderId,
              disabled: !supportsMapping || !isEnabled,
            };
          })
          .filter((item) => item.value),
      )
      .catch(() => []);

    const memberReq = isEdit
      ? fetch(`/api/admin/teams/slug/${encodeURIComponent(slug)}`)
          .then(async (res) => {
            if (res.status === 404) return null;
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || "Failed to load member");
            }
            return res.json();
          })
          .catch((err) => {
            message.error(err?.message || "Failed to load member");
            return null;
          })
      : Promise.resolve(null);

    Promise.all([categoriesReq, memberReq, slidersReq])
      .then(([categoryItems, memberData, sliders]) => {
        if (ignore) return;
        setCategories(categoryItems);
        setSliderOptions(sliders);
        setMember(memberData);
        if (isEdit && !memberData) {
          router.replace("/admin/team");
          return;
        }
        form.setFieldsValue(
          isEdit
            ? toInitialValues(memberData)
            : toInitialValues({ status: true }),
        );
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [form, isEdit, router, slug]);

  const categoryOptions = useMemo(
    () =>
      categories.map((item) => ({
        label: `${item.name}${item.isActive === false ? " (Inactive)" : ""}`,
        value: item._id,
      })),
    [categories],
  );

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        categoryId: values.categoryId,
        designation: values.designation,
        image: values.image,
        bio: values.bio,
        mappedSliderComponentId: toText(values.mappedSliderComponentId),
        socialLinks: Array.isArray(values.socialLinks)
          ? values.socialLinks
              .map((item) => {
                const target = normalizeLinkTarget(
                  item?.target ?? item?.openInNewTab,
                  "_self",
                );
                return {
                  platform: toText(item?.platform),
                  url: ensureMailto(item?.url),
                  target,
                  openInNewTab: target === "_blank",
                };
              })
              .filter((item) => item.platform || item.url)
              .slice(0, 1)
          : [],
        order:
          values.order != null && Number.isFinite(Number(values.order))
            ? Number(values.order)
            : 0,
        status: values.status !== false,
      };

      const endpoint = isEdit
        ? `/api/admin/teams/${encodeURIComponent(member?._id || "")}`
        : "/api/admin/teams";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to save member");
        return;
      }

      message.success(isEdit ? "Member updated" : "Member created");
      if (!isEdit) {
        router.push("/admin/team");
        return;
      }
      setMember(data);
      form.setFieldsValue(toInitialValues(data));
      if (toText(data.slug) && toText(data.slug) !== toText(slug)) {
        router.replace(`/admin/team/${encodeURIComponent(data.slug)}`);
      }
    } catch (err) {
      message.error(err?.message || "Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !member?._id) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/teams/${encodeURIComponent(member._id)}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to delete member");
        return;
      }
      message.success("Member deleted");
      router.push("/admin/team");
    } catch {
      message.error("Failed to delete member");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <ThemeAdminCard
      title={
        <Space>
          <Link href="/admin/team">
            <Button type="text" icon={<ArrowLeftOutlined />} />
          </Link>
          <span>{isEdit ? "Edit Member" : "Add Memebr"}</span>
        </Space>
      }
      extra={
        <Space>
          {isEdit ? (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              loading={deleting}
            >
              Delete
            </Button>
          ) : null}
          <Button type="primary" onClick={() => form.submit()} loading={saving}>
            {isEdit ? "Update" : "Create"}
          </Button>
        </Space>
      }
    >
      {categories.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="No categories available"
          description={
            <Link href="/admin/team/categories">
              Create a category first from Manage Categories.
            </Link>
          }
        />
      ) : null}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={toInitialValues({ status: true })}
      >
        <Row gutter={[20, 16]}>
          <Col xs={24} xl={18}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} xl={8}>
                <Form.Item
                  name="name"
                  label="Name"
                  rules={[{ required: true, message: "Name is required" }]}
                >
                  <Input placeholder="e.g. Name" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Form.Item
                  name="categoryId"
                  label="Category"
                  rules={[{ required: true, message: "Category is required" }]}
                >
                  <Select
                    placeholder="Select category"
                    options={categoryOptions}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Form.Item name="designation" label="Designation">
                  <Input placeholder="e.g. Director" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Form.Item name="order" label="Order">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Form.Item name="status" label="Status" valuePropName="checked">
                  <Switch
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Form.Item
                  name="mappedSliderComponentId"
                  label="Slider"
                  extra="Select a slider to map this member."
                >
                  <Select
                    allowClear
                    placeholder="Select slider"
                    options={sliderOptions}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="bio" label="Bio / Description">
                  <RichTextEditor />
                </Form.Item>
              </Col>
            </Row>
          </Col>

          <Col xs={24} xl={6}>
            <Space direction="vertical" style={{ width: "100%" }} size={16}>
              <Card size="small" title="Use Media Library">
                <Form.Item
                  name="image"
                  label="Member Image"
                  style={{ marginBottom: 0 }}
                >
                  <MediaPickerInput
                    uiVariant="stacked"
                    showVariants={false}
                    hintText="Select image from media library"
                  />
                </Form.Item>
              </Card>
              <Card size="small" title="Social Links">
                <Space direction="vertical" style={{ width: "100%" }} size={12}>
                  <Form.Item
                    name={["socialLinks", 0, "platform"]}
                    label="Platform"
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder="Select social media"
                      options={SOCIAL_PLATFORM_OPTIONS}
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>
                  <Form.Item
                    name={["socialLinks", 0, "url"]}
                    label="Link"
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="https://..." />
                  </Form.Item>
                  <Form.Item
                    name={["socialLinks", 0, "target"]}
                    label="Target"
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder="Select target"
                      options={[
                        { label: "Same tab (_self)", value: "_self" },
                        { label: "New tab (_blank)", value: "_blank" },
                      ]}
                    />
                  </Form.Item>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </Form>
    </ThemeAdminCard>
  );
}
