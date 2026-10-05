"use client";

import { useCallback, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  DatePicker,
  Dropdown,
  Modal,
  Select,
  Space,
  Tooltip,
  Typography,
  message,
} from "antd";
import { DownloadOutlined, LockOutlined } from "@ant-design/icons";
import { useAdminPermission } from "@/components/admin/AdminAuthContext";

const DATE_API_FORMAT = "YYYY-MM-DD";
const DATE_DISPLAY_FORMAT = "DD-MM-YYYY";

const EXPORT_MENU_ITEMS = [
  { key: "csv_filtered", label: "Export as CSV" },
  { key: "xlsx_all", label: "Export as Excel (All)" },
  { key: "custom", label: "Custom Export" },
];

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function toDateValue(value) {
  const text = normalizeText(value);
  if (!text) return null;
  const parsed = dayjs(text, DATE_API_FORMAT, true);
  return parsed.isValid() ? parsed : null;
}

function parseFilenameFromDisposition(value) {
  const text = normalizeText(value);
  if (!text) return "";
  const utfMatch = text.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const basicMatch = text.match(/filename="?([^"]+)"?/i);
  return normalizeText(basicMatch?.[1]);
}

function saveBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "export";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function triggerUrlDownload(url, fileName) {
  const anchor = document.createElement("a");
  anchor.href = url;
  if (fileName) anchor.download = fileName;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export default function AdminExportDropdown({
  exportUrl,
  filters = {},
  availableColumns = [],
  defaultFilename = "export",
  disabled = false,
  requiredPermission = "submissions.export_data",
}) {
  const canExport = useAdminPermission(requiredPermission);
  const [exportingType, setExportingType] = useState("");
  const [customExportOpen, setCustomExportOpen] = useState(false);
  const [customColumns, setCustomColumns] = useState(() =>
    availableColumns.map((col) => col.key || col.value || col),
  );
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  const customColumnOptions = availableColumns.map((col) => ({
    label: col.label || col.name || col.title || col.key,
    value: col.key || col.value || col,
  }));

  const handleOpenCustomExport = () => {
    if (!customColumns.length) {
      setCustomColumns(availableColumns.map((col) => col.key || col.value || col));
    }
    setCustomExportOpen(true);
  };

  const runExport = useCallback(
    async ({ type, columns, dateFrom, dateTo }) => {
      if (!exportUrl) return;
      try {
        setExportingType(type);
        const payload = { type };
        if (type === "csv_filtered") {
          payload.filters = filters;
          payload.format = "csv";
        } else if (type === "xlsx_all") {
          payload.format = "xlsx";
        } else if (type === "custom") {
          payload.format = "xlsx";
          payload.columns = Array.isArray(columns) ? columns : [];
          payload.dateFrom = dateFrom || "";
          payload.dateTo = dateTo || "";
        }

        const res = await fetch(exportUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const contentType = normalizeText(res.headers.get("content-type")).toLowerCase();
        if (!res.ok) {
          const errorPayload = contentType.includes("application/json")
            ? await res.json().catch(() => ({}))
            : {};
          throw new Error(errorPayload?.error || "Failed to export records");
        }

        if (contentType.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          if (!data?.downloadUrl) {
            throw new Error("Export file URL is missing");
          }
          triggerUrlDownload(data.downloadUrl, data.fileName);
          message.success("Large export is ready. Download started.");
          return;
        }

        const blob = await res.blob();
        const fallbackExt = type === "csv_filtered" ? "csv" : "xlsx";
        const fileName =
          parseFilenameFromDisposition(res.headers.get("content-disposition")) ||
          `${defaultFilename}-${type}.${fallbackExt}`;
        saveBlob(blob, fileName);
        message.success("Export downloaded");
      } catch (err) {
        message.error(err?.message || "Failed to export records");
      } finally {
        setExportingType("");
      }
    },
    [defaultFilename, exportUrl, filters],
  );

  const exportButton = (
    <Button icon={<DownloadOutlined />} loading={Boolean(exportingType)} disabled={disabled}>
      Export
    </Button>
  );

  if (!canExport) {
    return (
      <Tooltip title="Your role does not have export permission. An Admin can grant it from Roles & Permissions.">
        <Button icon={<LockOutlined />} disabled>
          Export
        </Button>
      </Tooltip>
    );
  }

  return (
    <>
      <Dropdown
        menu={{
          items: EXPORT_MENU_ITEMS,
          onClick: ({ key }) => {
            if (key === "custom") {
              handleOpenCustomExport();
              return;
            }
            runExport({ type: key });
          },
        }}
        trigger={["click"]}
        disabled={disabled}
      >
        {exportButton}
      </Dropdown>

      <Modal
        title="Custom Export"
        open={customExportOpen}
        onCancel={() => setCustomExportOpen(false)}
        onOk={async () => {
          if (!customColumns.length) {
            message.warning("Select at least one column for custom export");
            return;
          }
          await runExport({
            type: "custom",
            columns: customColumns,
            dateFrom: customDateFrom,
            dateTo: customDateTo,
          });
          setCustomExportOpen(false);
        }}
        confirmLoading={exportingType === "custom"}
        okText="Export"
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>Columns</Typography.Text>
            <Select
              mode="multiple"
              style={{ width: "100%", marginTop: 8 }}
              placeholder="Select columns"
              value={customColumns}
              options={customColumnOptions}
              maxTagCount="responsive"
              onChange={setCustomColumns}
            />
          </div>
          <div>
            <Typography.Text strong>Date Range</Typography.Text>
            <DatePicker.RangePicker
              style={{ width: "100%", marginTop: 8 }}
              format={DATE_DISPLAY_FORMAT}
              value={[toDateValue(customDateFrom), toDateValue(customDateTo)]}
              allowClear
              onChange={(value) => {
                const from = value?.[0];
                const to = value?.[1];
                setCustomDateFrom(from && from.isValid() ? from.format(DATE_API_FORMAT) : "");
                setCustomDateTo(to && to.isValid() ? to.format(DATE_API_FORMAT) : "");
              }}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
}
