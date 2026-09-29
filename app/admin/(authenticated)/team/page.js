"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { formatDateTime } from "@/lib/formatDate";

const STATUS_COLORS = {
  draft: "default",
  published: "green",
  archived: "orange",
};

const TEAM_SEARCH_STORAGE_KEY = "admin-team-search-query-v1";

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

export default function AdminTeamListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createShortcode, setCreateShortcode] = useState("");
  const [createSubTitle, setCreateSubTitle] = useState("");
  const [createMainTitle, setCreateMainTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get("search") || urlParams.get("q");
    const storedSearch = sessionStorage.getItem(TEAM_SEARCH_STORAGE_KEY);
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
        sessionStorage.setItem(TEAM_SEARCH_STORAGE_KEY, val);
      } else {
        sessionStorage.removeItem(TEAM_SEARCH_STORAGE_KEY);
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

  const fetchTeams = useCallback(
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
        const res = await fetch(`/api/admin/teams?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load teams");
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total) || 0);
      } catch (err) {
        message.error(err?.message || "Failed to load teams");
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [page, search],
  );

  useEffect(() => {
    fetchTeams(1, search);
    setPage(1);
  }, [search, fetchTeams]);

  const handleCreateNameChange = (e) => {
    const val = e.target.value;
    setCreateName(val);
    setCreateShortcode(slugify(val));
    if (!createMainTitle || createMainTitle === createName) {
      setCreateMainTitle(val);
    }
  };

  const onCreate = async () => {
    const trimmedName = createName.trim();
    if (!trimmedName) {
      message.error("Please enter a team name");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          shortcode: createShortcode.trim() || slugify(trimmedName),
          subTitle: createSubTitle.trim(),
          mainTitle: createMainTitle.trim() || trimmedName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create team");
      message.success("Team created successfully");
      setCreateOpen(false);
      setCreateName("");
      setCreateShortcode("");
      setCreateSubTitle("");
      setCreateMainTitle("");

      if (data?._id) {
        router.push(`/admin/team/${encodeURIComponent(data._id)}/edit`);
        return;
      }
      fetchTeams(1, search);
      setPage(1);
    } catch (err) {
      message.error(err?.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/teams/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete team");
      message.success("Team deleted");
      fetchTeams(page, search);
    } catch (err) {
      message.error(err?.message || "Failed to delete team");
    }
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
        title: "Team Name",
        dataIndex: "name",
        key: "name",
        render: (name, record) => (
          <Link
            href={`/admin/team/${encodeURIComponent(record._id)}/edit`}
            style={{ fontWeight: 600, color: "#2A283E", fontSize: "14.5px" }}
          >
            {name}
          </Link>
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
        title: "Members",
        dataIndex: "memberCount",
        key: "memberCount",
        width: 140,
        render: (count) => (
          <Tag icon={<TeamOutlined />} color="blue">
            {count} {count === 1 ? "member" : "members"}
          </Tag>
        ),
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
        width: 200,
        render: (_, record) => (
          <Space size={6}>
            <Link href={`/admin/team/${encodeURIComponent(record._id)}/edit`}>
              <Button type="link" size="small" icon={<EditOutlined />} style={{ color: "#2A283E" }}>
                Edit Team
              </Button>
            </Link>
            <Popconfirm
              title="Delete this team?"
              description="This will permanently delete the team and its member entries."
              okText="Delete"
              okType="danger"
              onConfirm={() => onDelete(record._id)}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label="Delete team"
                title="Delete"
              />
            </Popconfirm>
          </Space>
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
    <ThemeAdminCard
      title="Team Management"
      extra={
        <Space>
          <Input.Search
            allowClear
            placeholder="Search teams by name, title, or shortcode"
            style={{ width: 300 }}
            value={search}
            onChange={handleSearchChange}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchTeams(page, search)}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCreateName("");
              setCreateShortcode("");
              setCreateSubTitle("");
              setCreateMainTitle("");
              setCreateOpen(true);
            }}
          >
            Add New Team
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          showTotal: (val) => `${val} team(s)`,
          onChange: (nextPage) => {
            setPage(nextPage);
            fetchTeams(nextPage, search);
          },
        }}
      />

      <Modal
        title="Add New Team"
        open={createOpen}
        onCancel={() => {
          if (creating) return;
          setCreateOpen(false);
        }}
        onOk={onCreate}
        okText="Create Team"
        confirmLoading={creating}
        width={560}
      >
        <Space orientation="vertical" direction="vertical" style={{ width: "100%" }} size={16}>
          <Typography.Text type="secondary">
            Create a team to manage member profiles and generate a reusable frontend shortcode.
          </Typography.Text>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Team Name <span style={{ color: "#E03C33" }}>*</span>
            </label>
            <Input
              placeholder="e.g. Senior Staff, Executive Committee"
              value={createName}
              maxLength={120}
              onChange={handleCreateNameChange}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Shortcode <span style={{ color: "#E03C33" }}>*</span>
            </label>
            <Input
              placeholder="e.g. senior-staff"
              value={createShortcode}
              maxLength={80}
              onChange={(e) => setCreateShortcode(slugify(e.target.value))}
              addonBefore='[shortcode="'
              addonAfter='"]'
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Subtitle (Optional)
            </label>
            <Input
              placeholder="e.g. The People, Leadership"
              value={createSubTitle}
              maxLength={120}
              onChange={(e) => setCreateSubTitle(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Section Heading (Main Title)
            </label>
            <Input
              placeholder="e.g. Professionals with a *purpose.*"
              value={createMainTitle}
              maxLength={160}
              onChange={(e) => setCreateMainTitle(e.target.value)}
            />
          </div>
        </Space>
      </Modal>
    </ThemeAdminCard>
  );
}
