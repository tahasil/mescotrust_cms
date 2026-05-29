"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Checkbox,
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
import PortfolioImagePickerInput from "@/components/admin/Portfolio/PortfolioImagePickerInput";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { toText } from "@/lib/portfolioUtils";
import { ensureMailto, normalizeLinkTarget } from "@/lib/linkUtils";

function toInitialValues(item) {
  const source = item && typeof item === "object" ? item : {};
  const rawSocialLinks = Array.isArray(source?.socialLinks)
    ? source.socialLinks
    : [];
  const firstSocialLink =
    rawSocialLinks.find(
      (entry) => toText(entry?.label || entry?.platform) || toText(entry?.url),
    ) || null;
  const defaultSocialLink = {
    label: "",
    url: "",
    linkEnabled: false,
    target: "_self",
    openInNewTab: false,
  };
  const normalizedSocialLink = firstSocialLink
    ? {
        label: toText(firstSocialLink?.label || firstSocialLink?.platform),
        url: toText(firstSocialLink?.url),
        linkEnabled:
          firstSocialLink?.linkEnabled == null
            ? false
            : firstSocialLink?.linkEnabled === true,
        target: normalizeLinkTarget(
          firstSocialLink?.target ??
            firstSocialLink?.sourceTarget ??
            firstSocialLink?.openInNewTab,
          "_self",
        ),
        openInNewTab:
          firstSocialLink?.openInNewTab === true ||
          toText(firstSocialLink?.target) === "_blank" ||
          toText(firstSocialLink?.sourceTarget) === "_blank",
      }
    : defaultSocialLink;

  return {
    name: toText(source?.name),
    categoryId: toText(source?.categoryId),
    designation: toText(source?.designation),
    image: toText(source?.image),
    logo: toText(source?.logo),
    bio: toText(source?.bio),
    feature:
      source?.feature === true ||
      source?.features?.featuredPortfolio === true ||
      source?.features?.showInSlider === true,
    socialLinks: [normalizedSocialLink],
    order: Number.isFinite(Number(source?.order)) ? Number(source.order) : 0,
    status: source?.status !== false,
  };
}

export default function PortfolioItemForm({ slug = "" }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const isEdit = toText(slug) !== "";
  const linkEnabled = Form.useWatch(["socialLinks", 0, "linkEnabled"], form);
  const isLinkEnabled = linkEnabled === true;

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const categoriesReq = fetch("/api/admin/portfolio-categories")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => (Array.isArray(data?.items) ? data.items : []))
      .catch(() => []);

    const itemReq = isEdit
      ? fetch(`/api/admin/portfolio/slug/${encodeURIComponent(slug)}`)
          .then(async (res) => {
            if (res.status === 404) return null;
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || "Failed to load portfolio item");
            }
            return res.json();
          })
          .catch((err) => {
            message.error(err?.message || "Failed to load portfolio item");
            return null;
          })
      : Promise.resolve(null);

    Promise.all([categoriesReq, itemReq])
      .then(([categoryItems, itemData]) => {
        if (ignore) return;
        setCategories(categoryItems);
        setItem(itemData);
        if (isEdit && !itemData) {
          router.replace("/admin/portfolio");
          return;
        }
        form.setFieldsValue(
          isEdit
            ? toInitialValues(itemData)
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
        logo: values.logo,
        bio: values.bio,
        feature: values.feature === true,
        socialLinks: Array.isArray(values.socialLinks)
          ? values.socialLinks
              .map((entry) => {
                const target = normalizeLinkTarget(
                  entry?.target ?? entry?.openInNewTab,
                  "_self",
                );
                return {
                  label: toText(entry?.label || entry?.platform),
                  url: ensureMailto(entry?.url),
                  linkEnabled: entry?.linkEnabled === true,
                  target,
                  openInNewTab: target === "_blank",
                };
              })
              .filter((entry) => entry.label || entry.url)
              .slice(0, 1)
          : [],
        order:
          values.order != null && Number.isFinite(Number(values.order))
            ? Number(values.order)
            : 0,
        status: values.status !== false,
      };

      const endpoint = isEdit
        ? `/api/admin/portfolio/${encodeURIComponent(item?._id || "")}`
        : "/api/admin/portfolio";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to save portfolio item");
        return;
      }

      message.success(isEdit ? "Portfolio updated" : "Portfolio created");
      if (!isEdit) {
        router.push("/admin/portfolio");
        return;
      }
      setItem(data);
      form.setFieldsValue(toInitialValues(data));
      if (toText(data.slug) && toText(data.slug) !== toText(slug)) {
        router.replace(`/admin/portfolio/${encodeURIComponent(data.slug)}`);
      }
    } catch (err) {
      message.error(err?.message || "Failed to save portfolio item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !item?._id) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/portfolio/${encodeURIComponent(item._id)}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to delete portfolio item");
        return;
      }
      message.success("Portfolio deleted");
      router.push("/admin/portfolio");
    } catch {
      message.error("Failed to delete portfolio item");
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
          <Link href="/admin/portfolio">
            <Button type="text" icon={<ArrowLeftOutlined />} />
          </Link>
          <span>{isEdit ? "Edit Portfolio" : "Add Portfolio"}</span>
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
            <Link href="/admin/portfolio/categories">
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
                <Form.Item name="feature" label="Feature" valuePropName="checked">
                  <Checkbox />
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
                  label="Portfolio Image"
                  style={{ marginBottom: 0 }}
                >
                  <PortfolioImagePickerInput
                    uiVariant="stacked"
                    showVariants={false}
                    requiredResolution={{ width: 680, height: 600 }}
                  />
                </Form.Item>
                <Form.Item
                  name="logo"
                  label="Portfolio Logo"
                  style={{ marginBottom: 0, marginTop: 12 }}
                >
                  <PortfolioImagePickerInput
                    uiVariant="stacked"
                    showVariants={false}
                    requiredResolution={{ width: 100, height: 100 }}
                    libraryTitle="Logo Media Library"
                  />
                </Form.Item>
              </Card>
              <Card size="small" title="Link">
                <Space direction="vertical" style={{ width: "100%" }} size={12}>
                  <Form.Item
                    name={["socialLinks", 0, "linkEnabled"]}
                    label="Enable Link"
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    name={["socialLinks", 0, "label"]}
                    label="Label"
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="e.g. Website" disabled={!isLinkEnabled} />
                  </Form.Item>
                  <Form.Item
                    name={["socialLinks", 0, "url"]}
                    label="Link URL"
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="https://..." disabled={!isLinkEnabled} />
                  </Form.Item>
                  <Form.Item
                    name={["socialLinks", 0, "target"]}
                    label="Target"
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      options={[
                        { label: "Same tab (_self)", value: "_self" },
                        { label: "New tab (_blank)", value: "_blank" },
                      ]}
                      disabled={!isLinkEnabled}
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

