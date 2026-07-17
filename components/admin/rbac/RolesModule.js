"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";

function slugifyRoleKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function fetchJson(url, options) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function RolesModule() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingRoleKey, setEditingRoleKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const watchedName = Form.useWatch("name", form);
  const watchedKey = Form.useWatch("key", form);
  const selectedPermissions = Form.useWatch("permissionKeys", form) || [];

  const groupedPermissions = useMemo(() => {
    const groups = new Map();
    for (const permission of permissions) {
      const key = permission.module || "system";
      if (!groups.has(key)) {
        groups.set(key, { key, label: permission.moduleLabel || key, permissions: [] });
      }
      groups.get(key).permissions.push(permission);
    }
    return Array.from(groups.values());
  }, [permissions]);

  const roleKeyInModal = modalMode === "edit"
    ? editingRoleKey
    : String(watchedKey || slugifyRoleKey(watchedName)).trim().toLowerCase();

  const loadData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [roleData, permissionData] = await Promise.all([
        fetchJson("/api/admin/rbac/roles"),
        fetchJson("/api/admin/rbac/permissions"),
      ]);
      setRoles(Array.isArray(roleData) ? roleData : []);
      setPermissions(Array.isArray(permissionData) ? permissionData : []);
    } catch (error) {
      setLoadError(error.message || "Failed to load roles and permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setEditingRoleKey("");
    form.resetFields();
    form.setFieldsValue({ priority: 50, isActive: true, permissionKeys: [] });
    setModalOpen(true);
  };

  const openEdit = (role) => {
    setModalMode("edit");
    setEditingRoleKey(role.key);
    form.resetFields();
    form.setFieldsValue({
      name: role.name,
      key: role.key,
      description: role.description || "",
      priority: Number(role.priority || 50),
      isActive: role.isActive !== false,
      permissionKeys: Array.isArray(role.permissionKeys) ? role.permissionKeys : [],
    });
    setModalOpen(true);
  };

  const toggleModule = (modulePermissions, checked) => {
    const moduleKeys = modulePermissions
      .filter((permission) => permission.assignable !== false)
      .map((permission) => permission.key);
    const next = new Set(selectedPermissions);
    moduleKeys.forEach((key) => (checked ? next.add(key) : next.delete(key)));
    form.setFieldValue("permissionKeys", Array.from(next));
  };

  const saveRole = async () => {
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
      const isEdit = modalMode === "edit";
      await fetchJson(
        isEdit
          ? `/api/admin/rbac/roles/${encodeURIComponent(editingRoleKey)}`
          : "/api/admin/rbac/roles",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      message.success(isEdit ? "Role updated" : "Role created");
      setModalOpen(false);
      await loadData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role) => {
    try {
      await fetchJson(`/api/admin/rbac/roles/${encodeURIComponent(role.key)}`, { method: "DELETE" });
      message.success("Role deleted");
      await loadData();
    } catch (error) {
      message.error(error.message || "Failed to delete role");
    }
  };

  return (
    <ThemeAdminCard
      title="Roles & Permissions"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Create role
        </Button>
      }
    >
      <Typography.Paragraph style={{ marginBottom: 16 }}>
        Create reusable roles and control access to the current Mesco Trust admin modules.
      </Typography.Paragraph>
      {loadError ? (
        <Alert type="error" showIcon message={loadError} action={<Button onClick={loadData}>Retry</Button>} style={{ marginBottom: 16 }} />
      ) : null}
      <Table
        rowKey="key"
        loading={loading}
        dataSource={roles}
        scroll={{ x: 850 }}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        columns={[
          { title: "Role", dataIndex: "name", key: "name", fixed: "left", width: 180 },
          { title: "Key", dataIndex: "key", key: "key", width: 170, render: (value) => <Typography.Text code>{value}</Typography.Text> },
          { title: "Priority", dataIndex: "priority", key: "priority", width: 100 },
          { title: "Type", key: "type", width: 110, render: (_, role) => <Tag color={role.isSystem ? "purple" : "blue"}>{role.isSystem ? "System" : "Custom"}</Tag> },
          { title: "Status", key: "status", width: 110, render: (_, role) => <Tag color={role.isActive === false ? "default" : "green"}>{role.isActive === false ? "Inactive" : "Active"}</Tag> },
          { title: "Permissions", key: "permissions", width: 110, render: (_, role) => role.permissionKeys?.length || 0 },
          {
            title: "Actions",
            key: "actions",
            fixed: "right",
            width: 170,
            render: (_, role) => (
              <Space>
                <Button size="small" disabled={role.canEdit === false} onClick={() => openEdit(role)}>Edit</Button>
                <Popconfirm title="Delete this role?" description="Users must be reassigned first." okText="Delete" okButtonProps={{ danger: true }} disabled={role.canDelete === false} onConfirm={() => deleteRole(role)}>
                  <Button size="small" danger disabled={role.canDelete === false}>Delete</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        className="rbac-role-modal"
        title={modalMode === "edit" ? "Edit Role" : "Create Role"}
        open={modalOpen}
        onOk={saveRole}
        onCancel={() => setModalOpen(false)}
        okText={modalMode === "edit" ? "Save changes" : "Create role"}
        confirmLoading={saving}
        width={940}
        styles={{
          body: {
            maxHeight: "calc(100vh - 220px)",
            overflowY: "auto",
            overflowX: "hidden",
          },
        }}
      >
        <Form form={form} layout="vertical">
          <div className="rbac-form-grid">
            <Form.Item name="name" label="Role name" rules={[{ required: true, message: "Role name is required" }]}>
              <Input placeholder="Content Manager" />
            </Form.Item>
            <Form.Item
              name="key"
              label="Role key"
              tooltip="Generated from the role name when left blank."
              rules={[{ pattern: /^[a-z0-9_]*$/, message: "Use lowercase letters, numbers, and underscores" }]}
            >
              <Input placeholder="content_manager" disabled={modalMode === "edit"} />
            </Form.Item>
            <Form.Item name="priority" label="Priority">
              <InputNumber min={1} max={2000} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="isActive" label="Status" valuePropName="checked">
              <Checkbox>Role is active</Checkbox>
            </Form.Item>
          </div>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional role description" />
          </Form.Item>

          <Divider>Permission Matrix</Divider>
          <Form.Item name="permissionKeys" style={{ marginBottom: 0 }}>
            <Checkbox.Group style={{ width: "100%" }}>
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                {groupedPermissions.map((group) => {
                  const assignableKeys = group.permissions.filter((permission) => permission.assignable !== false).map((permission) => permission.key);
                  const selectedCount = assignableKeys.filter((key) => selectedPermissions.includes(key)).length;
                  return (
                    <div key={group.key} className="rbac-permission-group">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <Typography.Text strong>{group.label}</Typography.Text>
                        <Space size={4}>
                          <Button type="link" size="small" disabled={assignableKeys.length === 0 || selectedCount === assignableKeys.length} onClick={() => toggleModule(group.permissions, true)}>Select all</Button>
                          <Button type="link" size="small" disabled={selectedCount === 0} onClick={() => toggleModule(group.permissions, false)}>Clear</Button>
                        </Space>
                      </div>
                      <div className="rbac-permission-grid">
                        {group.permissions.map((permission) => (
                          <div key={permission.key} className="rbac-permission-item">
                            <Checkbox value={permission.key} disabled={permission.assignable === false}>
                              {permission.label.replace(`${group.label} - `, "")}
                            </Checkbox>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Space>
            </Checkbox.Group>
          </Form.Item>
          {roleKeyInModal ? <Typography.Text type="secondary">Role key: {roleKeyInModal}</Typography.Text> : null}
        </Form>
      </Modal>
      <style jsx global>{`
        .ant-modal.rbac-role-modal .ant-modal-body {
          max-width: 100%;
          overflow-x: hidden !important;
        }
        .rbac-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: 12px;
        }
        .rbac-permission-group {
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.09);
          border-radius: 10px;
          padding: 14px;
          box-sizing: border-box;
        }
        .rbac-permission-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 10px;
        }
        .rbac-permission-item {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .rbac-permission-item .ant-checkbox-wrapper {
          min-width: 0;
          max-width: 100%;
          white-space: normal;
        }
        @media (max-width: 767px) {
          .rbac-form-grid,
          .rbac-permission-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 575px) {
          .rbac-role-modal { padding-bottom: 0; }
          .ant-modal.rbac-role-modal { width: calc(100vw - 16px) !important; max-width: none; top: 8px; margin: 0 8px; padding-bottom: 8px; }
          .ant-modal.rbac-role-modal .ant-modal-content { padding: 16px 12px; }
          .ant-modal.rbac-role-modal .ant-modal-body { max-height: calc(100vh - 180px) !important; }
        }
      `}</style>
    </ThemeAdminCard>
  );
}
