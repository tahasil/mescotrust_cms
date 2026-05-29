"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { canAccessMenu, hasPermission, isSuperAdmin } from "@/lib/rbac/clientPermissions";

const EDITOR_BLOCKED_PERMISSION_KEYS = new Set([
  "components.create",
  "forms.create",
  "sliders.create",
  "popups.create",
]);

const ROLE_PREVIEW_MENU_GROUPS = [
  {
    key: "core",
    label: "Core Modules",
    items: [
      { key: "/admin", label: "Dashboard" },
      { key: "/admin/pages", label: "Pages" },
      { key: "/admin/components/theme-components", label: "Components" },
      { key: "/admin/forms", label: "Forms" },
      { key: "/admin/sliders", label: "Sliders" },
      { key: "/admin/popups", label: "Popups" },
      { key: "/admin/media", label: "Media" },
      { key: "/admin/submissions", label: "Submissions" },
    ],
  },
  {
    key: "content",
    label: "Content Groups",
    items: [
      { key: "/admin/team", label: "Team" },
      { key: "/admin/team/new", label: "Team - Add Member" },
      { key: "/admin/team/categories", label: "Team - Manage Categories" },
      { key: "/admin/portfolio", label: "Portfolio" },
      { key: "/admin/portfolio/new", label: "Portfolio - Add" },
      { key: "/admin/portfolio/categories", label: "Portfolio - Categories" },
      { key: "/admin/blogs", label: "Blogs" },
      { key: "/admin/blogs/new", label: "Blogs - Add Post" },
      { key: "/admin/blog-categories", label: "Blogs - Categories" },
      { key: "/admin/blog-comments", label: "Blogs - Comments" },
    ],
  },
  {
    key: "admin",
    label: "Admin Controls",
    items: [
      { key: "/admin/appearance/header", label: "Appearance" },
      { key: "/admin/users", label: "Users" },
      { key: "/admin/rbac/roles", label: "Roles & Permissions" },
    ],
  },
];

function slugifyRoleKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function RolesModule() {
  const auth = useAdminAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingRoleKey, setEditingRoleKey] = useState("");
  const [form] = Form.useForm();
  const watchedRoleKey = Form.useWatch("key", form);
  const watchedRoleName = Form.useWatch("name", form);
  const watchedPermissionKeys = Form.useWatch("permissionKeys", form);

  const canManageRoles = hasPermission(auth, "rbac.role_management");
  const canAssignProtectedPermissions = isSuperAdmin(auth);

  const groupedPermissions = useMemo(() => {
    const map = new Map();
    for (const permission of permissions) {
      const module = String(permission?.module || "system");
      if (!map.has(module)) map.set(module, []);
      map.get(module).push(permission);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  const roleKeyInModal = useMemo(() => {
    if (modalMode === "edit") {
      return String(editingRoleKey || watchedRoleKey || "").trim().toLowerCase();
    }
    const fromKey = String(watchedRoleKey || "").trim().toLowerCase();
    if (fromKey) return fromKey;
    return slugifyRoleKey(watchedRoleName || "");
  }, [modalMode, editingRoleKey, watchedRoleKey, watchedRoleName]);

  const roleAccessPreview = useMemo(() => {
    if (!modalOpen) return [];
    const previewPermissionKeys = Array.isArray(watchedPermissionKeys) ? watchedPermissionKeys : [];
    const previewAuthContext = {
      roleKey: roleKeyInModal || "custom",
      permissionKeys: previewPermissionKeys,
    };

    return ROLE_PREVIEW_MENU_GROUPS.map((group) => {
      const items = group.items.map((item) => ({
        ...item,
        allowed: canAccessMenu(previewAuthContext, item.key),
      }));
      return {
        ...group,
        items,
        visibleCount: items.filter((item) => item.allowed).length,
      };
    });
  }, [modalOpen, roleKeyInModal, watchedPermissionKeys]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/rbac/roles").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/admin/rbac/permissions").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([rolesRes, permissionsRes]) => {
        setRoles(Array.isArray(rolesRes) ? rolesRes : []);
        setPermissions(Array.isArray(permissionsRes) ? permissionsRes : []);
      })
      .catch(() => {
        message.error("Failed to load RBAC data");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateRole = () => {
    setModalMode("create");
    setEditingRoleKey("");
    form.resetFields();
    form.setFieldsValue({
      priority: 50,
      permissionKeys: [],
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditRole = (record) => {
    setModalMode("edit");
    setEditingRoleKey(String(record?.key || ""));
    form.resetFields();
    form.setFieldsValue({
      name: record?.name || "",
      key: record?.key || "",
      description: record?.description || "",
      priority: Number(record?.priority || 50),
      isActive: record?.isActive !== false,
      permissionKeys: Array.isArray(record?.permissionKeys) ? record.permissionKeys : [],
    });
    setModalOpen(true);
  };

  const handleSaveRole = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        name: values.name,
        key: values.key || slugifyRoleKey(values.name),
        description: values.description || "",
        priority: Number(values.priority || 50),
        isActive: values.isActive !== false,
        permissionKeys: Array.isArray(values.permissionKeys) ? values.permissionKeys : [],
      };
      if (String(payload.key || "").trim().toLowerCase() === "editor") {
        payload.permissionKeys = payload.permissionKeys.filter(
          (permissionKey) => !EDITOR_BLOCKED_PERMISSION_KEYS.has(permissionKey),
        );
      }

      const isEdit = modalMode === "edit";
      const targetKey = isEdit ? editingRoleKey : payload.key;
      const endpoint = isEdit
        ? `/api/admin/rbac/roles/${encodeURIComponent(targetKey)}`
        : "/api/admin/rbac/roles";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to create role");
        return;
      }

      message.success(isEdit ? "Role updated" : "Role created");
      setModalOpen(false);
      setEditingRoleKey("");
      fetchData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (record) => {
    const roleKey = String(record?.key || "").trim();
    if (!roleKey) return;

    const res = await fetch(`/api/admin/rbac/roles/${encodeURIComponent(roleKey)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      message.error(data.error || "Failed to delete role");
      return;
    }
    message.success("Role deleted");
    fetchData();
  };

  if (!canManageRoles) {
    return (
      <ThemeAdminCard title="Roles & Permissions">
        <Alert
          type="warning"
          showIcon
          message="Access denied"
          description="You do not have the required permission to manage roles and permissions."
        />
      </ThemeAdminCard>
    );
  }

  return (
    <ThemeAdminCard
      title="Roles & Permissions"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateRole}>
          Create role
        </Button>
      }
    >
      <Typography.Paragraph style={{ marginBottom: 16 }}>
        Create custom roles and attach granular permission sets. System roles are locked for safety.
      </Typography.Paragraph>

      <Table
        rowKey="_id"
        loading={loading}
        dataSource={roles}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: "Role", dataIndex: "name", key: "name" },
          { title: "Key", dataIndex: "key", key: "key", render: (value) => <Typography.Text code>{value}</Typography.Text> },
          { title: "Priority", dataIndex: "priority", key: "priority", width: 120 },
          {
            title: "Type",
            key: "type",
            width: 130,
            render: (_, record) => <Tag color={record?.isSystem ? "purple" : "geekblue"}>{record?.isSystem ? "System" : "Custom"}</Tag>,
          },
          {
            title: "Status",
            key: "status",
            width: 120,
            render: (_, record) => (
              <Tag color={record?.isActive === false ? "default" : "green"}>
                {record?.isActive === false ? "Inactive" : "Active"}
              </Tag>
            ),
          },
          {
            title: "Permissions",
            key: "permissions",
            width: 140,
            render: (_, record) => record?.permissionKeys?.length || 0,
          },
          {
            title: "Actions",
            key: "actions",
            width: 200,
            render: (_, record) => (
              <Space size={8}>
                <Button size="small" onClick={() => openEditRole(record)}>
                  Edit
                </Button>
                <Popconfirm
                  title="Delete this role?"
                  description="This action cannot be undone."
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDeleteRole(record)}
                  disabled={record?.isSystem}
                >
                  <Button size="small" danger disabled={record?.isSystem}>
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={modalMode === "edit" ? "Edit Role" : "Create Role"}
        open={modalOpen}
        onOk={handleSaveRole}
        onCancel={() => {
          setModalOpen(false);
          setEditingRoleKey("");
        }}
        okText={modalMode === "edit" ? "Save changes" : "Create role"}
        confirmLoading={saving}
        width={920}
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Role name" rules={[{ required: true, message: "Role name is required" }]}>
                <Input placeholder="Content Manager" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="key"
                label="Role key"
                tooltip="If empty, the key is generated from role name."
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const ok = /^[a-z0-9_]+$/.test(String(value));
                      return ok ? Promise.resolve() : Promise.reject(new Error("Use lowercase letters, numbers, and underscores"));
                    },
                  },
                ]}
              >
                <Input placeholder="content_manager" disabled={modalMode === "edit"} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="priority" label="Priority">
                <InputNumber min={1} max={999} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="isActive" label="Status" valuePropName="checked" initialValue={true}>
                <Checkbox>Role is active</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional role description" />
          </Form.Item>

          <Divider style={{ marginTop: 8, marginBottom: 16 }}>Permission Matrix</Divider>
          <Form.Item name="permissionKeys" style={{ marginBottom: 0 }}>
            <Checkbox.Group style={{ width: "100%" }}>
              <Space direction="vertical" style={{ width: "100%" }} size={14}>
                {groupedPermissions.map(([moduleKey, modulePermissions]) => (
                  <div key={moduleKey} style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, padding: 12 }}>
                    <Typography.Text strong style={{ textTransform: "capitalize", display: "block", marginBottom: 8 }}>
                      {moduleKey.replace(/_/g, " ")}
                    </Typography.Text>
                    <Row gutter={[8, 8]}>
                      {modulePermissions.map((permission) => (
                        <Col key={permission.key} xs={24} sm={12} md={8}>
                          <Checkbox
                            value={permission.key}
                            disabled={
                              (Boolean(permission.isProtected) && !canAssignProtectedPermissions) ||
                              (roleKeyInModal === "editor" &&
                                EDITOR_BLOCKED_PERMISSION_KEYS.has(permission.key))
                            }
                          >
                            {permission.label}
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Divider style={{ marginTop: 20, marginBottom: 16 }}>Sidebar Access Preview</Divider>
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            {roleAccessPreview.map((group) => (
              <div key={group.key} style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, padding: 12 }}>
                <Space style={{ marginBottom: 8 }}>
                  <Typography.Text strong>{group.label}</Typography.Text>
                  <Tag color={group.visibleCount > 0 ? "green" : "default"}>
                    {group.visibleCount} visible
                  </Tag>
                </Space>
                <Row gutter={[8, 8]}>
                  {group.items.map((item) => (
                    <Col key={item.key} xs={24} sm={12} md={8}>
                      <Space size={8}>
                        <Tag color={item.allowed ? "green" : "default"}>
                          {item.allowed ? "Visible" : "Hidden"}
                        </Tag>
                        <Typography.Text type={item.allowed ? undefined : "secondary"}>
                          {item.label}
                        </Typography.Text>
                      </Space>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}
          </Space>
        </Form>
      </Modal>
    </ThemeAdminCard>
  );
}
