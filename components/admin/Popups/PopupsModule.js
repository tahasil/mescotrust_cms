"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Form, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { canCreate, canDelete, canEdit } from "@/lib/rbac/clientPermissions";
import PopupCreateModal from "./PopupCreateModal";
import PopupsTable from "./PopupsTable";
import {
  SYSTEM_POPUP_COMPONENT_IDS,
  SYSTEM_POPUP_LABELS,
} from "./constants";

export default function PopupsModule() {
  const auth = useAdminAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [form] = Form.useForm();
  const canCreatePopups = canCreate(auth, "popups");
  const canEditPopups = canEdit(auth, "popups");
  const canDeletePopups = canDelete(auth, "popups");

  const fetchPopups = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/site-components")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => message.error("Failed to load popups"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPopups();
  }, [fetchPopups]);

  const rows = useMemo(() => {
    const byId = new Map(
      list.map((item) => [String(item.componentId || "").trim(), item]),
    );

    const systemRows = SYSTEM_POPUP_COMPONENT_IDS.map((componentId, index) => {
      const item = byId.get(componentId) || {};
      return {
        key: componentId,
        componentId,
        displayName:
          item.displayName || SYSTEM_POPUP_LABELS[componentId] || componentId,
        enabled: item.enabled !== false,
        module: "popups",
        isSystem: true,
        order: index + 1,
      };
    });

    const customRows = list
      .filter(
        (item) =>
          item?.module === "popups" &&
          !SYSTEM_POPUP_COMPONENT_IDS.includes(item.componentId),
      )
      .sort((a, b) =>
        (a.order ?? 0) !== (b.order ?? 0)
          ? (a.order ?? 0) - (b.order ?? 0)
          : String(a.componentId || "").localeCompare(String(b.componentId || "")),
      )
      .map((item, idx) => ({
        key: item.componentId,
        componentId: item.componentId,
        displayName: item.displayName || item.componentId,
        enabled: item.enabled !== false,
        module: "popups",
        isSystem: false,
        order: systemRows.length + idx + 1,
      }));

    return [...systemRows, ...customRows];
  }, [list]);

  const handleCreate = async () => {
    if (!canCreatePopups) {
      message.warning("You do not have permission to create popups.");
      return;
    }
    try {
      const values = await form.validateFields();
      setCreating(true);

      const maxOrder = list
        .filter(
          (item) =>
            item?.module === "popups" ||
            SYSTEM_POPUP_COMPONENT_IDS.includes(item?.componentId),
        )
        .reduce(
          (max, item) =>
            Math.max(max, Number.isFinite(Number(item?.order)) ? Number(item.order) : 0),
          0,
        );

      const res = await fetch("/api/admin/site-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: values.displayName?.trim(),
          global: false,
          position: "after",
          order: maxOrder + 1,
          module: "popups",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to create popup");
        return;
      }

      message.success("Popup created");
      setCreateOpen(false);
      form.resetFields();
      form.setFieldsValue({ displayName: "", _derivedId: "" });
      fetchPopups();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || "Failed to create popup");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (record) => {
    if (!canEditPopups) {
      message.warning("You do not have permission to update popups.");
      return;
    }
    try {
      setUpdatingId(record.componentId);
      const res = await fetch(
        `/api/admin/site-components/${encodeURIComponent(record.componentId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: !record.enabled,
            module: "popups",
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to update popup");
        return;
      }
      message.success(`Popup ${record.enabled ? "disabled" : "enabled"}`);
      fetchPopups();
    } catch {
      message.error("Failed to update popup");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (record) => {
    if (!canDeletePopups) {
      message.warning("You do not have permission to delete popups.");
      return;
    }
    if (record?.isSystem) return;
    try {
      setDeletingId(record.componentId);
      const res = await fetch(
        `/api/admin/site-components/${encodeURIComponent(record.componentId)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to delete popup");
        return;
      }
      message.success("Popup deleted");
      fetchPopups();
    } catch {
      message.error("Failed to delete popup");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <>
      <ThemeAdminCard
        title="Popups"
        extra={
          canCreatePopups ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              Add Popup
            </Button>
          ) : null
        }
      >
        <PopupsTable
          rows={rows}
          loading={loading}
          updatingId={updatingId}
          deletingId={deletingId}
          editEnabled={canEditPopups}
          toggleEnabled={canEditPopups}
          deleteEnabled={canDeletePopups}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      </ThemeAdminCard>

      {canCreatePopups && (
        <PopupCreateModal
          open={createOpen}
          saving={creating}
          form={form}
          onCancel={() => {
            if (creating) return;
            setCreateOpen(false);
            form.resetFields();
            form.setFieldsValue({ displayName: "", _derivedId: "" });
          }}
          onSubmit={handleCreate}
        />
      )}
    </>
  );
}
