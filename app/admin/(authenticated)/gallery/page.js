"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { formatDateTime } from "@/lib/formatDate";

const GALLERY_SEARCH_STORAGE_KEY = "admin-gallery-search-query-v1";

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

export default function AdminGalleryListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [updatingStatusId, setUpdatingStatusId] = useState("");

  // Create Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState("image"); // "image" | "video"
  const [createName, setCreateName] = useState("");
  const [createShortcode, setCreateShortcode] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get("search") || urlParams.get("q");
    const storedSearch = sessionStorage.getItem(GALLERY_SEARCH_STORAGE_KEY);
    const resolvedSearch = urlSearch ?? storedSearch ?? "";
    if (resolvedSearch) {
      setSearch(resolvedSearch);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (typeof window !== "undefined") {
      if (val) {
        sessionStorage.setItem(GALLERY_SEARCH_STORAGE_KEY, val);
      } else {
        sessionStorage.removeItem(GALLERY_SEARCH_STORAGE_KEY);
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

  const fetchGalleries = useCallback(
    async (nextPage = page, nextSearch = search, nextType = typeFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: "20",
        });
        if (String(nextSearch || "").trim()) {
          params.set("search", String(nextSearch).trim());
        }
        if (nextType && nextType !== "all") {
          params.set("type", nextType);
        }
        const res = await fetch(`/api/admin/galleries?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load galleries");
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total) || 0);
      } catch (err) {
        message.error(err?.message || "Failed to load galleries");
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [page, search, typeFilter],
  );

  useEffect(() => {
    fetchGalleries(1, search, typeFilter);
    setPage(1);
  }, [search, typeFilter, fetchGalleries]);

  const handleCreateNameChange = (e) => {
    setCreateName(e.target.value);
  };

  const onCreate = async () => {
    const trimmedName = createName.trim();
    if (!trimmedName) {
      message.error("Please enter a gallery name");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          type: createType,
          shortcode: slugify(trimmedName),
          description: "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create gallery");
      message.success("Gallery created successfully");
      setCreateOpen(false);
      setCreateName("");
      setCreateShortcode("");
      setCreateDescription("");
      setCreateType("image");

      if (data?._id) {
        router.push(`/admin/gallery/${encodeURIComponent(data._id)}/edit`);
        return;
      }
      fetchGalleries(1, search, typeFilter);
      setPage(1);
    } catch (err) {
      message.error(err?.message || "Failed to create gallery");
    } finally {
      setCreating(false);
    }
  };

  const onToggleStatus = async (record, checked) => {
    const nextStatus = checked ? "published" : "draft";
    setUpdatingStatusId(record._id);
    try {
      const res = await fetch(`/api/admin/galleries/${encodeURIComponent(record._id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update status");
      setItems((prev) =>
        prev.map((item) => (item._id === record._id ? { ...item, status: nextStatus } : item)),
      );
      message.success(`Gallery ${checked ? "published" : "moved to draft"}`);
    } catch (err) {
      message.error(err?.message || "Failed to update status");
    } finally {
      setUpdatingStatusId("");
    }
  };

  const onDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/galleries/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete gallery");
      message.success("Gallery deleted");
      fetchGalleries(page, search, typeFilter);
    } catch (err) {
      message.error(err?.message || "Failed to delete gallery");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "#",
        dataIndex: "order",
        key: "order",
        width: 60,
        render: (_, __, index) => (page - 1) * 20 + index + 1,
      },
      {
        title: "Gallery Name",
        dataIndex: "name",
        key: "name",
        render: (name, record) => (
          <div>
            <Link
              href={`/admin/gallery/${encodeURIComponent(record._id)}/edit`}
              style={{ fontWeight: 600, color: "#2A283E", fontSize: "14.5px" }}
            >
              {name}
            </Link>
            {record.description ? (
              <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>
                {record.description}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        width: 140,
        render: (type) =>
          type === "video" ? (
            <Tag color="purple" icon={<VideoCameraOutlined />}>
              Video Gallery
            </Tag>
          ) : (
            <Tag color="blue" icon={<PictureOutlined />}>
              Image Gallery
            </Tag>
          ),
      },
      {
        title: "Shortcode",
        dataIndex: "shortcode",
        key: "shortcode",
        width: 250,
        render: (shortcode) => {
          const shortCodeValue = String(shortcode || "").trim();
          const snippet = getShortcodeSnippet(shortCodeValue);
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
                    message.success("Shortcode copied to clipboard!");
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
        title: "Items",
        dataIndex: "itemsCount",
        key: "itemsCount",
        width: 90,
        render: (count, record) => (
          <span>
            {count} {record.type === "video" ? "videos" : "albums"}
          </span>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status, record) => {
          const isPublished = status === "published";
          return (
            <Space size={8}>
              <Switch
                size="small"
                checked={isPublished}
                loading={updatingStatusId === record._id}
                onChange={(checked) => onToggleStatus(record, checked)}
              />
              <Tag color={isPublished ? "green" : "default"}>
                {isPublished ? "Published" : "Draft"}
              </Tag>
            </Space>
          );
        },
      },
      {
        title: "Updated",
        dataIndex: "updatedAt",
        key: "updatedAt",
        width: 160,
        render: (date) => (date ? formatDateTime(date) : "—"),
      },
      {
        title: "Actions",
        key: "actions",
        width: 130,
        render: (_, record) => (
          <Space size={4}>
            <Link href={`/admin/gallery/${encodeURIComponent(record._id)}/edit`}>
              <Button type="link" size="small" icon={<EditOutlined />} style={{ color: "#2A283E" }}>
                Edit
              </Button>
            </Link>
            <Popconfirm
              title="Delete Gallery"
              description={`Are you sure you want to delete "${record.name}"?`}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(record._id)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [page, updatingStatusId],
  );

  return (
    <ThemeAdminCard
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PictureOutlined style={{ fontSize: "20px" }} />
          <span>Galleries</span>
        </div>
      }
      extra={
        <Space wrap>
          <Input.Search
            placeholder="Search galleries..."
            allowClear
            value={search}
            onChange={handleSearchChange}
            style={{ width: 220 }}
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            options={[
              { label: "All Galleries", value: "all" },
              { label: "Image Galleries", value: "image" },
              { label: "Video Galleries", value: "video" },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchGalleries(page, search, typeFilter)}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            Create Gallery
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          showTotal: (t) => `Total ${t} galleries`,
          onChange: (p) => {
            setPage(p);
            fetchGalleries(p, search, typeFilter);
          },
        }}
      />

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlusOutlined />
            <span>Create New Gallery</span>
          </div>
        }
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={onCreate}
        confirmLoading={creating}
        okText="Create & Configure"
        width={560}
        destroyOnClose
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 16 }}>
          {/* Type selection */}
          <div>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              Select Gallery Type <span style={{ color: "#ff4d4f" }}>*</span>
            </div>
            <Select
              size="large"
              value={createType}
              onChange={setCreateType}
              style={{ width: "100%" }}
              options={[
                {
                  value: "image",
                  label: (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <PictureOutlined style={{ color: "var(--primary-color, #E03C33)" }} />
                      <span>Image Gallery</span>
                    </span>
                  ),
                },
                {
                  value: "video",
                  label: (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <VideoCameraOutlined style={{ color: "#722ed1" }} />
                      <span>Video Gallery</span>
                    </span>
                  ),
                },
              ]}
            />
          </div>

          <div>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              Gallery Name <span style={{ color: "#ff4d4f" }}>*</span>
            </div>
            <Input
              size="large"
              placeholder="e.g. Annual Sports Meet 2025"
              value={createName}
              onChange={handleCreateNameChange}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </ThemeAdminCard>
  );
}
