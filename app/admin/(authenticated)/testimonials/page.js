"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Collapse,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckOutlined,
  CopyOutlined,
  EditOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { formatDateTime } from "@/lib/formatDate";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";
import { resolveAdminStoredFilter } from "@/lib/adminSearchState";
import TestimonialEntriesTable from "@/components/admin/testimonials/TestimonialEntriesTable";

const STATUS_COLORS = {
  draft: "default",
  published: "green",
  archived: "orange",
};

const STYLE_LABELS = {
  card: "Card View",
  slider: "Slider View",
};

const TESTIMONIAL_SEARCH_STORAGE_KEY = "admin-testimonials-search-query-v1";
const GROUPS_TAB = "groups";
const MANAGE_TAB = "manage";

const DEFAULT_CARD_ITEMS = [
  {
    quote:
      "Would like to take this as an opportunity to thank MESCO for having accepted myself into its family and feel honoured to be associated now as a donor, proud to have been onboard with such a great organization since long back, and hope myself to carry and continue the same throughout.",
    name: "Mr. Mohsin Izhar Ahmed Shaikh",
    role: "Education Sponsor",
  },
  {
    quote:
      "MESCO is one such catalyst from the cluster of organizations working in development sector in Mumbai for last 50 years with an objective of working for the social upliftment of the backward section of the society.",
    name: "Ravinder S. Lohia",
    role: "PMO Manager, Nokia",
  },
  {
    quote:
      "It's almost 3 decades that I came to know about the good work MESCO was doing. I was impressed about their sincerity, transparency and passion.",
    name: "Mr. Kader Sopariwala",
    role: "Chairman Sopariwala Exports",
  },
];

const DEFAULT_SLIDER_ITEMS = [
  {
    quote:
      "Would like to take this as an opportunity to thank MESCO for having accepted myself into its family and feel honoured to be associated now as a donor, proud to have been onboard with such a great organization since long back, and hope myself to carry and continue the same throughout.",
    name: "Mr. Mohsin Izhar Ahmed Shaikh",
    role: "Education Sponsor",
  },
  {
    quote:
      "MESCO is one such catalyst from the cluster of organizations working in development sector in Mumbai for last 50 years with an objective of working for the social upliftment of the backward section of the society.",
    name: "Ravinder S. Lohia",
    role: "PMO Manager, Nokia",
  },
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getShortcodeSnippet(shortcode) {
  const value = String(shortcode || "").trim();
  if (!value) return "";
  return `[shortcode="${value}"]`;
}

function TestimonialFormDrawer({ open, record, onClose, onSaved }) {
  const isEdit = Boolean(record?._id);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const resetForRecord = useCallback(
    (data) => {
      form.setFieldsValue({
        name: data?.name ?? "",
        style: data?.style === "slider" ? "slider" : "card",
        shortcode: data?.shortcode ?? "",
        subTitle:
          data?.subTitle != null && data.subTitle !== ""
            ? data.subTitle
            : data?.style === "slider"
              ? "Donor Testimonials"
              : "",
        mainTitle: data?.mainTitle ?? "",
        status: ["published", "draft", "archived"].includes(data?.status)
          ? data.status
          : "published",
        quoteIconFontSize: data?.quoteIconFontSize ?? null,
        quoteTextFontSize: data?.quoteTextFontSize ?? null,
        nameFontSize: data?.nameFontSize ?? null,
        roleFontSize: data?.roleFontSize ?? null,
      });
    },
    [form],
  );

  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      resetForRecord(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);
    fetch(`/api/admin/testimonials/${encodeURIComponent(record._id)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (!cancelled) resetForRecord(data);
      })
      .catch(() => message.error("Failed to load testimonial"))
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, isEdit, record?._id, resetForRecord]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        name: values.name,
        style: values.style,
        shortcode: values.shortcode,
        subTitle: values.subTitle ?? "",
        mainTitle: values.mainTitle ?? "",
        status: values.status,
        quoteIconFontSize: values.quoteIconFontSize ?? null,
        quoteTextFontSize: values.quoteTextFontSize ?? null,
        nameFontSize: values.nameFontSize ?? null,
        roleFontSize: values.roleFontSize ?? null,
      };

      const res = await fetch(
        isEdit ? `/api/admin/testimonials/${encodeURIComponent(record._id)}` : "/api/admin/testimonials",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save testimonial");

      message.success(isEdit ? "Testimonial updated" : "Testimonial created");
      onSaved?.();
      onClose();
    } catch (err) {
      if (err?.errorFields) {
        message.error("Please fill in all required fields");
      } else {
        message.error(err?.message || "Failed to save testimonial");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <EditOutlined />
          <span>{isEdit ? record?.name || "Edit Testimonial" : "Edit Testimonial"}</span>
        </Space>
      }
      placement="right"
      width={Math.min(
        640,
        typeof window !== "undefined" ? window.innerWidth * 0.94 : 640,
      )}
      open={open}
      onClose={() => {
        if (saving) return;
        onClose();
      }}
      extra={
        <Button
          type="primary"
          icon={<CheckOutlined />}
          loading={saving}
          onClick={handleSave}
        >
          {isEdit ? "Update" : "Create"}
        </Button>
      }
    >
      {loadingDetail ? (
        <div style={{ padding: 60, textAlign: "center" }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form preserve={true} form={form} layout="vertical" initialValues={{ status: "published", style: "card" }}>
          <Collapse
            destroyInactivePanel={false}
            defaultActiveKey={["details"]}
            items={[
              {
                key: "details",
                forceRender: true,
                label: "Details",
                children: (
                  <Row gutter={[16, 0]}>
                    <Col span={24}>
                      <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: "Name is required" }]}
                      >
                        <Input
                          placeholder="e.g. Donor Testimonials"
                          maxLength={120}
                          size="large"
                          onChange={(e) => {
                            const values = form.getFieldsValue();
                            if (!isEdit && (values.shortcode === undefined || values.shortcode === "" || values.shortcode === slugify(values.name || ""))) {
                              form.setFieldValue("shortcode", slugify(e.target.value));
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="style"
                        label="Display Style"
                        rules={[{ required: true, message: "Display style is required" }]}
                        tooltip="Card View renders the Donor Testimonials card grid; Slider View renders the Testimonials slider."
                      >
                        <Select
                          size="large"
                          options={[
                            { label: "Card View", value: "card" },
                            { label: "Slider View", value: "slider" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="shortcode"
                        label="Shortcode"
                        rules={[{ required: true, message: "Shortcode is required" }]}
                      >
                        <Input
                          placeholder="e.g. donor-testimonials"
                          maxLength={80}
                          addonBefore='[shortcode="'
                          addonAfter='"]'
                          onChange={(e) =>
                            form.setFieldValue("shortcode", slugify(e.target.value))
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="subTitle"
                        label="Small Title / Subtitle"
                        tooltip="Shown above quote in Slider View (e.g. 'Donor Testimonials') and as small uppercase subtitle in Card View."
                      >
                        <Input
                          placeholder="e.g. Donor Testimonials"
                          maxLength={120}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="mainTitle" label="Section Heading (Main Title)">
                        <Input
                          placeholder="e.g. What our donors say"
                          maxLength={160}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="status" label="Status">
                        <Select
                          size="large"
                          options={[
                            { label: "Published", value: "published" },
                            { label: "Draft", value: "draft" },
                            { label: "Archived", value: "archived" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
              {
                key: "typography",
                forceRender: true,
                label: "Typography",
                children: (
                  <Row gutter={[16, 0]}>
                    <Col span={24}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Font sizes for Card &amp; Slider Views. Leave empty to use component defaults.
                      </Typography.Text>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="quoteIconFontSize" label="Quote mark size">
                        <InputNumber min={16} max={72} addonAfter="px" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="quoteTextFontSize" label="Quote text size">
                        <InputNumber min={11} max={32} addonAfter="px" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="nameFontSize" label="Name size">
                        <InputNumber min={10} max={28} addonAfter="px" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="roleFontSize" label="Role size">
                        <InputNumber min={9} max={24} addonAfter="px" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        </Form>
      )}
    </Drawer>
  );
}

export default function AdminTestimonialsListPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState(GROUPS_TAB);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("tab") === MANAGE_TAB) {
      setActiveTab(MANAGE_TAB);
    }
    const urlSearch = urlParams.get("search") || urlParams.get("q");
    const resolvedSearch = resolveAdminStoredFilter(TESTIMONIAL_SEARCH_STORAGE_KEY, urlSearch);
    if (resolvedSearch) {
      setSearch(resolvedSearch);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (typeof window !== "undefined") {
      if (val) {
        sessionStorage.setItem(TESTIMONIAL_SEARCH_STORAGE_KEY, val);
      } else {
        sessionStorage.removeItem(TESTIMONIAL_SEARCH_STORAGE_KEY);
      }
      const params = new URLSearchParams(window.location.search);
      if (val) {
        params.set("search", val);
      } else {
        params.delete("search");
        params.delete("q");
      }
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === MANAGE_TAB) {
      params.set("tab", MANAGE_TAB);
    } else {
      params.delete("tab");
    }
    const nextSearch = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`,
    );
  };

  const fetchTestimonials = useCallback(
    async (nextPage = page, nextSearch = search) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: "20",
        });
        if (String(nextSearch || "").trim()) {
          params.set("search", String(nextSearch).trim());
        }
        const res = await fetch(`/api/admin/testimonials?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load testimonials");
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total) || 0);
      } catch (err) {
        message.error(err?.message || "Failed to load testimonials");
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [page, search],
  );

  useEffect(() => {
    fetchTestimonials(1, search);
    setPage(1);
  }, [search, fetchTestimonials]);

  const openEditDrawer = (record) => {
    setEditingRecord(record);
    setDrawerOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        title: "#",
        dataIndex: "order",
        key: "order",
        width: 70,
        render: (_, __, index) => (page - 1) * 20 + index + 1,
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (name, record) => (
          <Button
            type="link"
            size="small"
            onClick={() => openEditDrawer(record)}
            style={{
              fontWeight: 600,
              color: "#2A283E",
              fontSize: "14.5px",
              padding: 0,
              height: "auto",
            }}
          >
            {name}
          </Button>
        ),
      },
      {
        title: "Style",
        dataIndex: "style",
        key: "style",
        width: 130,
        render: (style) => (
          <Tag color={style === "slider" ? "purple" : "geekblue"}>
            {STYLE_LABELS[style] || "Card View"}
          </Tag>
        ),
      },
      {
        title: "Shortcode",
        dataIndex: "shortcode",
        key: "shortcode",
        width: 260,
        render: (shortcode) => {
          const snippet = getShortcodeSnippet(shortcode);
          return (
            <Space size={8}>
              <Typography.Text code copyable={false}>
                {snippet}
              </Typography.Text>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                disabled={!snippet}
                aria-label="Copy shortcode"
                title="Copy shortcode"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(snippet);
                    message.success("Shortcode copied");
                  } catch {
                    message.error("Copy failed");
                  }
                }}
              />
            </Space>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => (
          <Tag color={STATUS_COLORS[status] || "default"}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Published"}
          </Tag>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 100,
        render: (_, record) => (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            style={{ color: "#2A283E" }}
            onClick={() => openEditDrawer(record)}
          >
            Edit
          </Button>
        ),
      },
      {
        title: "Updated",
        dataIndex: "updatedAt",
        key: "updatedAt",
        width: 180,
        render: (value) => formatDateTime(value),
      },
    ],
    [page],
  );

  return (
    <ThemeAdminCard title="Testimonials Management">
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: GROUPS_TAB,
            label: "Testimonial Groups",
            children: (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                  <Space wrap>
                    <Input.Search
                      allowClear
                      placeholder="Search testimonials by name, title, or shortcode"
                      style={{ width: 300, maxWidth: "100%" }}
                      value={search}
                      onChange={handleSearchChange}
                    />
                    <Button icon={<ReloadOutlined />} onClick={() => fetchTestimonials(page, search)}>
                      Refresh
                    </Button>
                  </Space>
                </div>
                <Table
                  rowKey="_id"
                  loading={adminTableLoading(loading)}
                  locale={adminTableLocale(loading)}
                  columns={columns}
                  dataSource={items}
                  pagination={{
                    current: page,
                    pageSize: 20,
                    total,
                    showTotal: (val) => `${val} testimonial(s)`,
                    onChange: (nextPage) => {
                      setPage(nextPage);
                      fetchTestimonials(nextPage, search);
                    },
                  }}
                />
              </>
            ),
          },
          {
            key: MANAGE_TAB,
            label: "Manage Testimonials",
            children: <TestimonialEntriesTable />,
          },
        ]}
      />

      <TestimonialFormDrawer
        open={drawerOpen}
        record={editingRecord}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => fetchTestimonials(page, search)}
      />
    </ThemeAdminCard>
  );
}
