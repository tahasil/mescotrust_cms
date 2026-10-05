"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, Button, Space, message, Modal, Input, Select, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { resolveAdminStoredFilter } from "@/lib/adminSearchState";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";

const BLOGS_SEARCH_STORAGE_KEY = "admin-blogs-search-query-v1";
const BLOGS_STATUS_STORAGE_KEY = "admin-blogs-status-filter-v1";
const BLOGS_CATEGORY_STORAGE_KEY = "admin-blogs-category-filter-v1";

export default function AdminBlogsPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get("search") || urlParams.get("q");
    const resolvedSearch = resolveAdminStoredFilter(BLOGS_SEARCH_STORAGE_KEY, urlSearch);
    if (resolvedSearch) {
      setSearchText(resolvedSearch);
    }

    const urlStatus = urlParams.get("status");
    const resolvedStatus = resolveAdminStoredFilter(BLOGS_STATUS_STORAGE_KEY, urlStatus);
    if (resolvedStatus) {
      setFilterStatus(resolvedStatus);
    }

    const urlCat = urlParams.get("category");
    const resolvedCat = resolveAdminStoredFilter(BLOGS_CATEGORY_STORAGE_KEY, urlCat);
    if (resolvedCat) {
      setFilterCategory(resolvedCat);
    }
  }, []);

  const updateUrlParams = (newSearch, newStatus, newCat) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (newSearch) params.set("search", newSearch);
    else { params.delete("search"); params.delete("q"); }
    if (newStatus) params.set("status", newStatus);
    else params.delete("status");
    if (newCat) params.set("category", newCat);
    else params.delete("category");
    const qs = params.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    if (typeof window !== "undefined") {
      if (val) sessionStorage.setItem(BLOGS_SEARCH_STORAGE_KEY, val);
      else sessionStorage.removeItem(BLOGS_SEARCH_STORAGE_KEY);
      updateUrlParams(val, filterStatus, filterCategory);
    }
  };

  const handleStatusChange = (val) => {
    setFilterStatus(val);
    if (typeof window !== "undefined") {
      if (val) sessionStorage.setItem(BLOGS_STATUS_STORAGE_KEY, val);
      else sessionStorage.removeItem(BLOGS_STATUS_STORAGE_KEY);
      updateUrlParams(searchText, val, filterCategory);
    }
  };

  const handleCategoryChange = (val) => {
    setFilterCategory(val);
    if (typeof window !== "undefined") {
      if (val) sessionStorage.setItem(BLOGS_CATEGORY_STORAGE_KEY, val);
      else sessionStorage.removeItem(BLOGS_CATEGORY_STORAGE_KEY);
      updateUrlParams(searchText, filterStatus, val);
    }
  };

  const fetchBlogs = async () => {
    const res = await fetch("/api/admin/blogs");
    if (res.ok) {
      const data = await res.json();
      setList(Array.isArray(data) ? data : data.items || []);
    }
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/blog-categories");
    if (res.ok) setCategories(await res.json());
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBlogs(), fetchCategories()]).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = list;
    if (filterStatus) result = result.filter((p) => p.status === filterStatus);
    if (filterCategory) {
      result = result.filter((p) => (p.category?._id || p.category) === filterCategory);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [list, filterStatus, filterCategory, searchText]);

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete post?",
      content: `Delete "${record.title}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/blogs/${record._id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Post deleted");
        fetchBlogs();
      },
    });
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (t) => t || "-",
    },
    { title: "Slug", dataIndex: "slug", key: "slug" },
    { title: "Category", dataIndex: ["category", "name"], key: "category" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => <Tag color={s === "published" ? "green" : "default"}>{s}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/blogs/${record._id}`)}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <ThemeAdminCard
      title="Blog posts"
      extra={
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search title or slug"
            allowClear
            style={{ width: 220 }}
            value={searchText}
            onChange={handleSearchChange}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 120 }}
            value={filterStatus}
            onChange={handleStatusChange}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ]}
          />
          <Select
            placeholder="Category"
            allowClear
            style={{ width: 160 }}
            value={filterCategory}
            onChange={handleCategoryChange}
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/admin/blogs/new")}
          >
            Add post
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filtered}
        loading={adminTableLoading(loading)}
        locale={adminTableLocale(loading)}
        pagination={{ pageSize: 20 }}
      />
    </ThemeAdminCard>
  );
}
