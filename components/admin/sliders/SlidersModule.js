"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Form, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { useAdminAuth } from "@/components/admin/AdminAuthContext";
import { canCreate, canDelete, canEdit } from "@/lib/rbac/clientPermissions";
import SliderCreateModal from "./SliderCreateModal";
import SlidersTable from "./SlidersTable";
import {
  SYSTEM_SLIDER_COMPONENT_IDS,
  SYSTEM_SLIDER_LABELS,
} from "./constants";

export default function SlidersModule() {
  const auth = useAdminAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [form] = Form.useForm();
  const canCreateSliders = canCreate(auth, "sliders");
  const canEditSliders = canEdit(auth, "sliders");
  const canDeleteSliders = canDelete(auth, "sliders");

  const fetchSliders = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/site-components")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => message.error("Failed to load sliders"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSliders();
  }, [fetchSliders]);

  const rows = useMemo(() => {
    const byId = new Map(
      list.map((item) => [String(item.componentId || "").trim(), item]),
    );

    const systemRows = SYSTEM_SLIDER_COMPONENT_IDS.map((componentId, index) => {
      const item = byId.get(componentId) || {};
      return {
        key: componentId,
        componentId,
        displayName:
          item.displayName || SYSTEM_SLIDER_LABELS[componentId] || componentId,
        enabled: item.enabled !== false,
        module: "sliders",
        isSystem: true,
        order: index + 1,
      };
    });

    const customRows = list
      .filter(
        (item) =>
          item?.module === "sliders" &&
          !SYSTEM_SLIDER_COMPONENT_IDS.includes(item.componentId),
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
        module: "sliders",
        isSystem: false,
        order: systemRows.length + idx + 1,
      }));

    return [...systemRows, ...customRows];
  }, [list]);

  const handleCreate = async () => {
    if (!canCreateSliders) {
      message.warning("You do not have permission to create sliders.");
      return;
    }
    try {
      const values = await form.validateFields();
      setCreating(true);

      const maxOrder = list
        .filter(
          (item) =>
            item?.module === "sliders" ||
            SYSTEM_SLIDER_COMPONENT_IDS.includes(item?.componentId),
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
          module: "sliders",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to create slider");
        return;
      }

      message.success("Slider created");
      setCreateOpen(false);
      form.resetFields();
      form.setFieldsValue({ displayName: "", _derivedId: "" });
      fetchSliders();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || "Failed to create slider");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (record) => {
    if (!canEditSliders) {
      message.warning("You do not have permission to update sliders.");
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
            module: "sliders",
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to update slider");
        return;
      }
      message.success(`Slider ${record.enabled ? "disabled" : "enabled"}`);
      fetchSliders();
    } catch {
      message.error("Failed to update slider");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (record) => {
    if (!canDeleteSliders) {
      message.warning("You do not have permission to delete sliders.");
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
        message.error(data.error || "Failed to delete slider");
        return;
      }
      message.success("Slider deleted");
      fetchSliders();
    } catch {
      message.error("Failed to delete slider");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <>
      <ThemeAdminCard
        title="Sliders"
        extra={
          canCreateSliders ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              Add Slider
            </Button>
          ) : null
        }
      >
        <SlidersTable
          rows={rows}
          loading={loading}
          updatingId={updatingId}
          deletingId={deletingId}
          editEnabled={canEditSliders}
          toggleEnabled={canEditSliders}
          deleteEnabled={canDeleteSliders}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      </ThemeAdminCard>

      {canCreateSliders && (
        <SliderCreateModal
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
