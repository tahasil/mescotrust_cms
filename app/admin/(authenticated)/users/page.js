"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Button, Space, message, Modal, Form, Input, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";

const SUPER_ADMIN_EMAIL = "superadmin@aiolos.cloud";
const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin" },
  { value: "Editor", label: "Editor" },
  { value: "Author", label: "Author" },
];
const FILTER_ROLE_OPTIONS = [
  { value: "SuperAdmin", label: "Super Admin" },
  ...ROLE_OPTIONS,
];

function isSuperAdminUser(user) {
  return String(user?.email || "").trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

function getDisplayRole(user) {
  if (isSuperAdminUser(user)) return "SuperAdmin";
  return String(user?.role || "").trim();
}

export default function AdminUsersPage() {
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filterRole, setFilterRole] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

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
      .then(setList)
      .catch(() => message.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    let result = list;
    if (filterRole) {
      if (filterRole === "SuperAdmin") {
        result = result.filter((u) => isSuperAdminUser(u));
      } else {
        result = result.filter((u) => u.role === filterRole && !isSuperAdminUser(u));
      }
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
          role: values.role,
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
    setEditingId(record._id);
    editForm.setFieldsValue({
      name: record.name,
      email: record.email,
      role: record.role,
      status: record.status,
    });
    setEditModalOpen(true);
    setEditingRecord(record);
  };

  const handleEditSubmit = async () => {
    if (!editingId) return;
    try {
      const values = await editForm.validateFields();
      const body = { name: values.name, email: values.email, role: values.role, status: values.status };
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
      message.success("User updated");
      setEditModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      fetchList();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    }
  };

  const handleDelete = (record) => {
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
        <p style={{ color: "#c00" }}>Only Admins can access user management.</p>
      </ThemeAdminCard>
    );
  }

  return (
    <ThemeAdminCard
      title="Users"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add user
        </Button>
      }
    >
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
          options={FILTER_ROLE_OPTIONS}
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
            render: (_, record) => {
              const role = getDisplayRole(record);
              const color =
                role === "SuperAdmin"
                  ? "gold"
                  : role === "Admin"
                    ? "blue"
                    : role === "Author"
                      ? "purple"
                      : "default";
              return (
                <Tag color={color}>
                  {role === "SuperAdmin" ? "Super Admin" : role}
                </Tag>
              );
            },
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
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                  Edit
                </Button>
                {!isSuperAdminUser(record) ? (
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                    Delete
                  </Button>
                ) : null}
              </Space>
            ),
          },
        ]}
      />

      <Modal title="Add user" open={addModalOpen} onOk={handleAddSubmit} onCancel={() => setAddModalOpen(false)} okText="Create">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input type="email" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="Editor">
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="active">
            <Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Edit user" open={editModalOpen} onOk={handleEditSubmit} onCancel={() => { setEditModalOpen(false); setEditingId(null); setEditingRecord(null); }} okText="Save">
        <Form form={editForm} layout="vertical">
          {isSuperAdminUser(editingRecord) ? (
            <p style={{ color: "#8a6d3b", marginBottom: 12 }}>
              Super Admin account is protected. Email, role, and status cannot be changed.
            </p>
          ) : null}
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input type="email" disabled={isSuperAdminUser(editingRecord)} />
          </Form.Item>
          <Form.Item name="password" label="New password (leave blank to keep)">
            <Input.Password placeholder="Min 6 characters" />
          </Form.Item>
          <Form.Item name="role" label="Role">
            <Select options={ROLE_OPTIONS} disabled={isSuperAdminUser(editingRecord)} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} disabled={isSuperAdminUser(editingRecord)} />
          </Form.Item>
        </Form>
      </Modal>
    </ThemeAdminCard>
  );
}
