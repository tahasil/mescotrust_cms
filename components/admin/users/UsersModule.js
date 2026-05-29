"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Button, Space, message, Modal, Form, Input, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { signOut } from "next-auth/react";
import { ThemeAdminCard } from "@/styles/Theme";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { canCreate, canDelete, canEdit, hasPermission, isSuperAdmin } from "@/lib/rbac/clientPermissions";

function getDefaultAssignableRoles(canAssignSuperAdmin = false) {
  const base = [
    { value: "admin", label: "Admin" },
    { value: "editor", label: "Editor" },
  ];
  return canAssignSuperAdmin
    ? [{ value: "super_admin", label: "Super Admin" }, ...base]
    : base;
}

function normalizeRoleValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeUserTypeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export default function AdminUsersPage() {
  const auth = useAdminAuth();
  const canAssignSuperAdmin = isSuperAdmin(auth);
  const isSuperAdminRow = (user) =>
    normalizeUserTypeValue(user?.userType) === "superadmin" ||
    normalizeRoleValue(user?.roleKey || user?.role || "") === "super_admin";
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [roles, setRoles] = useState(getDefaultAssignableRoles(canAssignSuperAdmin));
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterRole, setFilterRole] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const canManageUsers = hasPermission(auth, "users.user_management");
  const canCreateUsers = canManageUsers && (canCreate(auth, "users") || hasPermission(auth, "users.user_management"));
  const canEditUsers = canManageUsers && (canEdit(auth, "users") || hasPermission(auth, "users.user_management"));
  const canDeleteUsers = canManageUsers && (canDelete(auth, "users") || hasPermission(auth, "users.user_management"));

  const canManageUserRecord = (record) => {
    if (canAssignSuperAdmin) return true;
    return !isSuperAdminRow(record);
  };

  const fetchList = () => {
    setLoading(true);
    setForbidden(false);
    fetch("/api/admin/users")
      .then((res) => {
        if (res.status === 403) {
          setForbidden(true);
          return [];
        }
        return res.ok ? res.json() : [];
      })
      .then((rows) => {
        const normalizedRows = Array.isArray(rows) ? rows : [];
        setList(canAssignSuperAdmin ? normalizedRows : normalizedRows.filter((row) => !isSuperAdminRow(row)));
      })
      .catch(() => message.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  const fetchRoles = () => {
    fetch("/api/admin/rbac/roles?scope=assignable")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        const normalized = Array.isArray(rows)
          ? rows
              .map((item) => ({
                value: String(item?.key || "").trim(),
                label: String(item?.name || item?.key || "").trim(),
              }))
              .filter((item) => item.value && item.label)
              .filter((item) => canAssignSuperAdmin || item.value !== "super_admin")
          : [];
        if (normalized.length > 0) {
          setRoles(normalized);
          return;
        }
        setRoles(getDefaultAssignableRoles(canAssignSuperAdmin));
      })
      .catch(() => {
        setRoles(getDefaultAssignableRoles(canAssignSuperAdmin));
      });
  };

  useEffect(() => {
    fetchList();
    fetchRoles();
  }, [canAssignSuperAdmin]);

  useEffect(() => {
    let result = list;
    if (filterRole) {
      result = result.filter((u) => normalizeRoleValue(u?.roleKey || u?.role || "") === filterRole);
    }
    if (filterStatus) result = result.filter((u) => u.status === filterStatus);
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [list, filterRole, filterStatus, searchText]);

  const handleAdd = () => {
    form.resetFields();
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          roleKey: values.roleKey,
          status: values.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to create");
        return;
      }
      message.success("User created");
      setAddModalOpen(false);
      fetchList();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    }
  };

  const handleEdit = (record) => {
    if (!record || !record._id) {
      message.error("Invalid user record.");
      return;
    }
    if (!canManageUserRecord(record)) {
      message.error("You are not allowed to edit this user.");
      return;
    }
    setEditingId(record._id);
    editForm.setFieldsValue({
      name: record?.name || "",
      email: record?.email || "",
      password: "",
      roleKey: normalizeRoleValue(record?.roleKey || record?.role || "editor"),
      status: record?.status || "active",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingId) return;
    try {
      const values = await editForm.validateFields();
      const body = {
        name: values.name,
        email: values.email,
        roleKey: normalizeRoleValue(values?.roleKey || "editor"),
        status: values.status,
      };
      if (values.password) body.password = values.password;
      const res = await fetch(`/api/admin/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to update");
        return;
      }
      if (data?.reloginRequired) {
        message.success(data.reloginMessage || "User updated. Re-login is required for this user.");
      } else {
        message.success("User updated");
      }
      editForm.resetFields();
      setEditModalOpen(false);
      setEditingId(null);
      fetchList();
      if (data?.affectsCurrentSession) {
        await signOut({ callbackUrl: "/admin/login?reason=role-updated" });
      }
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    }
  };

  const handleDelete = (record) => {
    if (!canManageUserRecord(record)) {
      message.error("You are not allowed to delete this user.");
      return;
    }
    Modal.confirm({
      title: "Delete user?",
      content: `Remove ${record.name} (${record.email})? This cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/users/${record._id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("User deleted");
        fetchList();
      },
    });
  };

  if (forbidden) {
    return (
      <ThemeAdminCard title="Users">
        <p style={{ color: "#c00" }}>You do not have permission to access user management.</p>
      </ThemeAdminCard>
    );
  }

  if (!canManageUsers) {
    return (
      <ThemeAdminCard title="Users">
        <p style={{ color: "#c00" }}>You do not have permission to manage users.</p>
      </ThemeAdminCard>
    );
  }

  return (
    <ThemeAdminCard
      title="Users"
      extra={
        canCreateUsers ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add user
          </Button>
        ) : null
      }
    >
      <p style={{ color: "#666", marginBottom: 16 }}>
        User assignment is role-based only. Direct per-user permission overrides are blocked by backend policy.
      </p>
      <Input.Search
          placeholder="Search name or email"
          allowClear
          style={{ width: 220, marginBottom: 16 }}
          onSearch={setSearchText}
          onChange={(e) => { if (!e.target.value) setSearchText(""); }}
        />
        <Select
          placeholder="Role"
          allowClear
          style={{ width: 130, marginLeft: 8, marginBottom: 16 }}
          value={filterRole}
          onChange={setFilterRole}
          options={roles.map((item) => ({ value: item.value, label: item.label }))}
        />
        <Select
          placeholder="Status"
          allowClear
          style={{ width: 130, marginLeft: 8, marginBottom: 16 }}
          value={filterStatus}
          onChange={setFilterStatus}
          options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
        />
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={filtered}
        columns={[
          { title: "Name", dataIndex: "name", key: "name" },
          { title: "Email", dataIndex: "email", key: "email" },
          {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (r, record) => (
              <Tag color={record?.roleKey === "super_admin" ? "volcano" : record?.roleKey === "admin" ? "blue" : "default"}>
                {r}
              </Tag>
            ),
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (s) => (s === "active" ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space>
                {canEditUsers && canManageUserRecord(record) ? (
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                    Edit
                  </Button>
                ) : null}
                {canDeleteUsers && canManageUserRecord(record) ? (
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                    Delete
                  </Button>
                ) : null}
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title="Add user"
        open={addModalOpen}
        onOk={handleAddSubmit}
        onCancel={() => setAddModalOpen(false)}
        okText="Create"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input type="email" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="roleKey" label="Role" initialValue="editor">
            <Select options={roles} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="active">
            <Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit user"
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => {
          editForm.resetFields();
          setEditModalOpen(false);
          setEditingId(null);
        }}
        okText="Save"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input type="email" />
          </Form.Item>
          <Form.Item name="password" label="New password (leave blank to keep)">
            <Input.Password autoComplete="new-password" placeholder="Min 6 characters" />
          </Form.Item>
          <Form.Item name="roleKey" label="Role">
            <Select options={roles} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
          </Form.Item>
        </Form>
      </Modal>
    </ThemeAdminCard>
  );
}

