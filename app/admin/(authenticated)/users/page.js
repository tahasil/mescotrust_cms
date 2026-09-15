"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";

async function fetchJson(url, options) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function isSuperAdminUser(user) {
  return user?.roleKey === "super_admin";
}

const USERS_SEARCH_STORAGE_KEY = "admin-users-search-query-v1";
const USERS_ROLE_STORAGE_KEY = "admin-users-role-filter-v1";
const USERS_STATUS_STORAGE_KEY = "admin-users-status-filter-v1";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterRole, setFilterRole] = useState(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    return params.get("role") || sessionStorage.getItem(USERS_ROLE_STORAGE_KEY) || undefined;
  });
  const [filterStatus, setFilterStatus] = useState(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    return params.get("status") || sessionStorage.getItem(USERS_STATUS_STORAGE_KEY) || undefined;
  });
  const [searchText, setSearchText] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("search") || sessionStorage.getItem(USERS_SEARCH_STORAGE_KEY) || "";
  });
  const [form] = Form.useForm();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (searchText.trim()) {
      sessionStorage.setItem(USERS_SEARCH_STORAGE_KEY, searchText);
      url.searchParams.set("search", searchText);
    } else {
      sessionStorage.removeItem(USERS_SEARCH_STORAGE_KEY);
      url.searchParams.delete("search");
    }
    if (filterRole) {
      sessionStorage.setItem(USERS_ROLE_STORAGE_KEY, filterRole);
      url.searchParams.set("role", filterRole);
    } else {
      sessionStorage.removeItem(USERS_ROLE_STORAGE_KEY);
      url.searchParams.delete("role");
    }
    if (filterStatus) {
      sessionStorage.setItem(USERS_STATUS_STORAGE_KEY, filterStatus);
      url.searchParams.set("status", filterStatus);
    } else {
      sessionStorage.removeItem(USERS_STATUS_STORAGE_KEY);
      url.searchParams.delete("status");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [searchText, filterRole, filterStatus]);

  const roleOptions = useMemo(
    () => roles.filter((role) => role.isActive !== false).map((role) => ({ value: role.key, label: role.name })),
    [roles],
  );

  const filteredUsers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return users.filter((user) => {
      if (filterRole && user.roleKey !== filterRole) return false;
      if (filterStatus && user.status !== filterStatus) return false;
      if (query && !String(user.name || "").toLowerCase().includes(query) && !String(user.email || "").toLowerCase().includes(query)) return false;
      return true;
    });
  }, [users, filterRole, filterStatus, searchText]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, roleData] = await Promise.all([
        fetchJson("/api/admin/users"),
        fetchJson("/api/admin/rbac/roles?scope=assignable"),
      ]);
      setUsers(Array.isArray(userData) ? userData : []);
      setRoles(Array.isArray(roleData) ? roleData : []);
    } catch (error) {
      message.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ roleKey: roleOptions.find((role) => role.value === "editor")?.value || roleOptions[0]?.value, status: "active" });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setModalMode("edit");
    setEditingUser(user);
    form.resetFields();
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      roleKey: user.roleKey,
      status: user.status,
    });
    setModalOpen(true);
  };

  const saveUser = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const isEdit = modalMode === "edit";
      const body = {
        name: values.name,
        email: values.email,
        roleKey: values.roleKey,
        status: values.status,
      };
      if (!isEdit || values.password) body.password = values.password;
      const data = await fetchJson(
        isEdit ? `/api/admin/users/${editingUser._id}` : "/api/admin/users",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      message.success(isEdit ? "User updated" : "User created");
      setModalOpen(false);
      await loadData();
      if (data.affectsCurrentSession && data.reloginRequired) {
        message.warning("Your access changed. Sign in again to continue with the new role.");
      }
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = (user) => {
    Modal.confirm({
      title: "Delete user?",
      content: `Remove ${user.name} (${user.email})? This cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await fetchJson(`/api/admin/users/${user._id}`, { method: "DELETE" });
          message.success("User deleted");
          await loadData();
        } catch (error) {
          message.error(error.message || "Delete failed");
        }
      },
    });
  };

  const superAdminEditing = isSuperAdminUser(editingUser);

  return (
    <ThemeAdminCard
      title="Users"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add user</Button>}
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search name or email"
          allowClear
          style={{ width: 240 }}
          value={searchText}
          onSearch={setSearchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <Select placeholder="Role" allowClear style={{ width: 160 }} value={filterRole} onChange={setFilterRole} options={roleOptions} />
        <Select placeholder="Status" allowClear style={{ width: 140 }} value={filterStatus} onChange={setFilterStatus} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
      </Space>
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={filteredUsers}
        scroll={{ x: 760 }}
        columns={[
          { title: "Name", dataIndex: "name", key: "name", width: 180 },
          { title: "Email", dataIndex: "email", key: "email", width: 230 },
          { title: "Role", key: "role", width: 150, render: (_, user) => <Tag color={isSuperAdminUser(user) ? "gold" : user.roleKey === "admin" ? "blue" : "default"}>{user.role}</Tag> },
          { title: "Status", dataIndex: "status", key: "status", width: 100, render: (status) => <Tag color={status === "active" ? "green" : "default"}>{status === "active" ? "Active" : "Inactive"}</Tag> },
          {
            title: "Actions",
            key: "actions",
            width: 180,
            render: (_, user) => (
              <Space>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(user)}>Edit</Button>
                {!isSuperAdminUser(user) ? <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => deleteUser(user)}>Delete</Button> : null}
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={modalMode === "edit" ? "Edit user" : "Add user"}
        open={modalOpen}
        onOk={saveUser}
        onCancel={() => setModalOpen(false)}
        okText={modalMode === "edit" ? "Save" : "Create"}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          {superAdminEditing ? <p style={{ color: "#8a6d3b" }}>The Super Admin email, role, and status are protected.</p> : null}
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}><Input type="email" disabled={superAdminEditing} /></Form.Item>
          <Form.Item name="password" label={modalMode === "edit" ? "New password (leave blank to keep)" : "Password"} rules={modalMode === "create" ? [{ required: true, min: 6 }] : [{ min: 6 }]}><Input.Password /></Form.Item>
          <Form.Item name="roleKey" label="Role" rules={[{ required: true }]}><Select options={roleOptions} disabled={superAdminEditing} /></Form.Item>
          <Form.Item name="status" label="Status"><Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} disabled={superAdminEditing} /></Form.Item>
        </Form>
      </Modal>
    </ThemeAdminCard>
  );
}
