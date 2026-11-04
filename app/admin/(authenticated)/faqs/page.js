"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  BgColorsOutlined,
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";
import { resolveAdminStoredFilter } from "@/lib/adminSearchState";
import { DEFAULT_FAQ_CATEGORIES } from "@/lib/faqDefaults";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import RichTextEditor from "@/components/admin/RichTextEditor";

const { Text, Paragraph } = Typography;

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FAQ_SEARCH_STORAGE_KEY = "admin-faq-search-query-v1";

const CATEGORY_COLORS = {
  "About MESCO": "blue",
  "Donations": "green",
  "Scholarships": "purple",
  "Medical Assistance": "red",
  "Relief of Poverty": "orange",
  "Volunteering": "cyan",
  "Partnerships": "geekblue",
  "Contact": "gold",
};

export default function AdminFaqsPage() {
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_FAQ_CATEGORIES);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Drawer State for FAQ item CRUD
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Edit Colors Drawer State
  const [colorsDrawerOpen, setColorsDrawerOpen] = useState(false);
  const [colorsForm] = Form.useForm();
  const [loadingColors, setLoadingColors] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState([]);

  // Copy state
  const [copiedKey, setCopiedKey] = useState("");

  const copyToClipboard = (text, key) => {
    if (!navigator?.clipboard) {
      message.error("Clipboard access not available");
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedKey(key);
        message.success(`Copied: ${text}`);
        setTimeout(() => setCopiedKey(""), 2000);
      },
      () => message.error("Failed to copy shortcode")
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get("search") || urlParams.get("q");
    const resolvedSearch = resolveAdminStoredFilter(FAQ_SEARCH_STORAGE_KEY, urlSearch);
    if (resolvedSearch) setSearch(resolvedSearch);
  }, []);

  const fetchFaqs = useCallback(
    async (
      currentPage = page,
      currentSearch = search,
      currentCategory = categoryFilter,
      currentStatus = statusFilter
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(pageSize));
        if (currentSearch) params.set("search", currentSearch);
        if (currentCategory && currentCategory !== "all") params.set("category", currentCategory);
        if (currentStatus && currentStatus !== "all") params.set("status", currentStatus);

        const res = await fetch(`/api/admin/faqs?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || "Failed to load FAQs");
        }
        const data = await res.json();
        setFaqs(Array.isArray(data?.faqs) ? data.faqs : []);
        setTotal(data?.total || 0);
        if (Array.isArray(data?.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      } catch (err) {
        message.error(err?.message || "Failed to load FAQs");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, search, categoryFilter, statusFilter]
  );

  useEffect(() => {
    fetchFaqs(page, search, categoryFilter, statusFilter);
  }, [fetchFaqs, page, search, categoryFilter, statusFilter]);

  // Synchronize Form fields whenever drawerOpen or editingFaq changes
  useEffect(() => {
    if (drawerOpen) {
      if (editingFaq) {
        form.setFieldsValue({
          question: editingFaq.question || "",
          answer: editingFaq.answer || "",
          category: editingFaq.category || "General",
          order: editingFaq.order ?? 0,
          status: editingFaq.status || "published",
          tags: Array.isArray(editingFaq.tags) ? editingFaq.tags : [],
          isFeatured: Boolean(editingFaq.isFeatured),
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          category: categoryFilter !== "all" ? categoryFilter : "About MESCO",
          status: "published",
          order: (faqs.length || 0) + 1,
          isFeatured: false,
          tags: [],
        });
      }
    }
  }, [drawerOpen, editingFaq, form, categoryFilter, faqs.length]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    if (typeof window !== "undefined") {
      if (val) {
        sessionStorage.setItem(FAQ_SEARCH_STORAGE_KEY, val);
      } else {
        sessionStorage.removeItem(FAQ_SEARCH_STORAGE_KEY);
      }
      const params = new URLSearchParams(window.location.search);
      if (val) {
        params.set("search", val);
      } else {
        params.delete("search");
        params.delete("q");
      }
      const newSearch = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}`);
    }
  };

  const openCreateDrawer = () => {
    setEditingFaq(null);
    form.resetFields();
    form.setFieldsValue({
      category: categoryFilter !== "all" ? categoryFilter : "About MESCO",
      status: "published",
      order: (faqs.length || 0) + 1,
      isFeatured: false,
      tags: [],
    });
    setDrawerOpen(true);
  };
  const openCreateModal = openCreateDrawer;

  const openEditDrawer = (faq) => {
    setEditingFaq(faq);
    form.setFieldsValue({
      question: faq.question || "",
      answer: faq.answer || "",
      category: faq.category || "General",
      order: faq.order ?? 0,
      status: faq.status || "published",
      tags: Array.isArray(faq.tags) ? faq.tags : [],
      isFeatured: Boolean(faq.isFeatured),
    });
    setDrawerOpen(true);
  };
  const openEditModal = openEditDrawer;

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const url = editingFaq ? `/api/admin/faqs/${editingFaq._id}` : "/api/admin/faqs";
      const method = editingFaq ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save FAQ");

      message.success(editingFaq ? "FAQ updated successfully" : "FAQ created successfully");
      setDrawerOpen(false);
      form.resetFields();
      fetchFaqs(page, search, categoryFilter, statusFilter);
    } catch (err) {
      if (err?.errorFields) return; // Form validation error
      message.error(err?.message || "Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faqId) => {
    try {
      const res = await fetch(`/api/admin/faqs/${faqId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete FAQ");
      message.success("FAQ deleted successfully");
      fetchFaqs(page, search, categoryFilter, statusFilter);
    } catch (err) {
      message.error(err?.message || "Failed to delete FAQ");
    }
  };

  const handleToggleStatus = async (faq, newChecked) => {
    const newStatus = newChecked ? "published" : "draft";
    try {
      const res = await fetch(`/api/admin/faqs/${faq._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setFaqs((current) =>
        current.map((item) => (item._id === faq._id ? { ...item, status: newStatus } : item))
      );
      message.success(`Status updated to ${newStatus}`);
    } catch (err) {
      message.error(err?.message || "Failed to update status");
    }
  };

  // Open Edit Colors Drawer
  const openColorsDrawer = async () => {
    setColorsDrawerOpen(true);
    setLoadingColors(true);
    try {
      const res = await fetch("/api/theme/Faqs", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      const palette = data?.themePalette || {};
      const custom = Array.isArray(data?.colors) ? data.colors : [];
      const names = [
        ...new Set([
          ...Object.keys(palette),
          ...custom.map((entry) => entry?.name).filter(Boolean),
        ]),
      ].sort();
      setThemeColorOptions(names.map((name) => ({ label: name, value: name })));

      colorsForm.setFieldsValue({
        faqsCategoryBtnBgColorKey: data?.faqsCategoryBtnBgColorKey || "",
        faqsCategoryBtnTextColorKey: data?.faqsCategoryBtnTextColorKey || "",
        faqsCategoryActiveBtnBgColorKey: data?.faqsCategoryActiveBtnBgColorKey || "",
        faqsCategoryActiveBtnTextColorKey: data?.faqsCategoryActiveBtnTextColorKey || "",
        faqsQuestionTextColorKey: data?.faqsQuestionTextColorKey || "",
        faqsAnswerTextColorKey: data?.faqsAnswerTextColorKey || "",
        faqsCardBgColorKey: data?.faqsCardBgColorKey || "",
        faqsCardBorderColorKey: data?.faqsCardBorderColorKey || "",
        faqsCardHoverBorderColorKey: data?.faqsCardHoverBorderColorKey || "",
        faqsActiveQuestionTextColorKey: data?.faqsActiveQuestionTextColorKey || "",
        faqsActiveIconBgColorKey: data?.faqsActiveIconBgColorKey || "",
        faqsActiveIconTextColorKey: data?.faqsActiveIconTextColorKey || "",
      });
    } catch (err) {
      message.error("Failed to load FAQ colors");
    } finally {
      setLoadingColors(false);
    }
  };

  // Save Colors from Drawer
  const handleSaveColors = async () => {
    setSavingColors(true);
    try {
      const values = await colorsForm.validateFields();
      const res = await fetch("/api/theme/Faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || "Failed to save colors");
      }
      message.success("FAQ colors updated successfully");
      setColorsDrawerOpen(false);
    } catch (err) {
      message.error(err?.message || "Failed to save FAQ colors");
    } finally {
      setSavingColors(false);
    }
  };

  const categoryOptions = useMemo(() => {
    const merged = Array.from(new Set([...categories, ...DEFAULT_FAQ_CATEGORIES])).filter(Boolean).sort();
    return merged.map((c) => ({ label: c, value: c }));
  }, [categories]);

  const columns = [
    {
      title: "#",
      dataIndex: "order",
      key: "order",
      width: 65,
      align: "center",
      render: (val) => <Text style={{ color: "#888", fontWeight: 600 }}>{val ?? 0}</Text>,
    },
    {
      title: "Question & Answer",
      key: "qa",
      render: (_, record) => (
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontWeight: 600, color: "#111827", fontSize: 14, marginBottom: 4 }}>
            {record.question}
            {record.isFeatured && (
              <Tag color="orange" style={{ marginLeft: 8, fontSize: 11, padding: "0 6px" }}>
                Featured
              </Tag>
            )}
          </div>
          <Paragraph
            ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
            style={{ color: "#4b5563", margin: 0, fontSize: 13, lineHeight: 1.5 }}
          >
            {stripHtml(record.answer)}
          </Paragraph>
          {Array.isArray(record.tags) && record.tags.length > 0 && (
            <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {record.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 11,
                    background: "#f3f4f6",
                    color: "#6b7280",
                    padding: "1px 6px",
                    borderRadius: 4,
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 170,
      render: (cat) => (
        <Tag
          color={CATEGORY_COLORS[cat] || "default"}
          style={{ fontWeight: 500, fontSize: 12, padding: "2px 8px" }}
        >
          {cat || "General"}
        </Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 140,
      render: (_, record) => {
        const isPub = record.status === "published";
        return (
          <Space direction="horizontal" size="small">
            <Switch
              size="small"
              checked={isPub}
              onChange={(checked) => handleToggleStatus(record, checked)}
            />
            <Tag color={isPub ? "green" : "default"} style={{ margin: 0 }}>
              {isPub ? "Published" : "Draft"}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "Contextual Shortcode",
      key: "shortcode",
      width: 220,
      render: (_, record) => {
        const code = `[shortcode="faqs:${record.category}"]`;
        const isCopied = copiedKey === `row_${record._id}`;
        return (
          <Tooltip title="Click to copy contextual shortcode for this category">
            <Button
              size="small"
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                borderColor: isCopied ? "#10b981" : "#d1d5db",
                color: isCopied ? "#10b981" : "#374151",
              }}
              onClick={() => copyToClipboard(code, `row_${record._id}`)}
              icon={isCopied ? <CheckOutlined /> : <CopyOutlined />}
            >
              {code}
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete FAQ"
            description="Are you sure you want to delete this FAQ?"
            okText="Yes, delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ThemeAdminCard
      title="FAQs Management"
      extra={
        <Space wrap align="center">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search questions or answers..."
            allowClear
            style={{ width: 250 }}
            value={search}
            onChange={handleSearchChange}
          />
          <Tooltip title="Click to copy global shortcode [shortcode=&quot;faqs&quot;]">
            <Button
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                fontWeight: 600,
                background: "#e6f4ea",
                borderColor: copiedKey === "global" ? "#10b981" : "#b7e1cd",
                color: copiedKey === "global" ? "#10b981" : "#137333",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
              onClick={() => copyToClipboard('[shortcode="faqs"]', "global")}
              icon={copiedKey === "global" ? <CheckOutlined /> : <CopyOutlined />}
            >
              [shortcode="faqs"]
            </Button>
          </Tooltip>
          <Tooltip title="Refresh FAQ list">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchFaqs(page, search, categoryFilter, statusFilter)}
            />
          </Tooltip>
          <Button
            icon={<BgColorsOutlined />}
            onClick={openColorsDrawer}
          >
            Edit Colors
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Add FAQ
          </Button>
        </Space>
      }
    >
      {/* Filter Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Space wrap size="middle">
          <Select
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
            style={{ width: 190 }}
            options={[{ label: "All Categories", value: "all" }, ...categoryOptions]}
          />
          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            style={{ width: 140 }}
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
            ]}
          />
        </Space>
      </div>

      {/* Data Table */}
      <Table
        columns={columns}
        dataSource={faqs}
        rowKey="_id"
        loading={adminTableLoading(loading)}
        locale={adminTableLocale(loading)}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showTotal: (tot) => `${tot} FAQ(s)`,
        }}
      />

      {/* Add / Edit FAQ Drawer */}
      <Drawer
        title={editingFaq ? "Edit FAQ" : "Add New FAQ"}
        open={drawerOpen}
        onClose={() => {
          if (!saving) {
            setDrawerOpen(false);
            setEditingFaq(null);
            form.resetFields();
          }
        }}
        width={680}
        extra={
          <Space>
            <Button
              onClick={() => {
                setDrawerOpen(false);
                setEditingFaq(null);
                form.resetFields();
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={saving}
            >
              {editingFaq ? "Update FAQ" : "Create FAQ"}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="question"
            label="Question"
            rules={[{ required: true, message: "Please enter the question" }]}
          >
            <Input placeholder="e.g. Does MESCO provide scholarships?" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: "Please select or enter category" }]}
                extra="Select existing or type a new category"
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="Select or enter category"
                  options={categoryOptions}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="order"
                label="Display Order"
                extra="Lower number appears first"
              >
                <InputNumber min={0} max={9999} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="answer"
            label="Answer"
            rules={[{ required: true, message: "Please enter the answer" }]}
            extra="Rich text formatting, lists, links, and bold text are supported."
          >
            <RichTextEditor placeholder="Provide a clear, detailed answer..." minHeight={220} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="tags"
                label="Tags / Keywords"
                extra="Helps users find this question in search"
              >
                <Select mode="tags" placeholder="Add keyword tags..." tokenSeparators={[","]} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="Status">
                <Select
                  options={[
                    { label: "Published", value: "published" },
                    { label: "Draft", value: "draft" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="isFeatured" label="Featured" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      {/* Edit Frontend Colors Drawer */}
      <Drawer
        title="Edit FAQ Frontend Colors & Settings"
        open={colorsDrawerOpen}
        onClose={() => setColorsDrawerOpen(false)}
        width={540}
        extra={
          <Button
            type="primary"
            onClick={handleSaveColors}
            loading={savingColors}
          >
            Save Colors
          </Button>
        }
      >
        {loadingColors ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin />
          </div>
        ) : (
          <Form form={colorsForm} layout="vertical">
            <TitleAndColorsSection
              form={colorsForm}
              themeColorOptions={themeColorOptions}
              {...getTitleAndColorsConfig("Faqs")}
            />
          </Form>
        )}
      </Drawer>
    </ThemeAdminCard>
  );
}
