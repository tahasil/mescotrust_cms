"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, message, Progress, Space, Table, Tag, Typography } from "antd";
import { ThemeAdminCard } from "@/styles/Theme";
import { formatDateTime } from "@/lib/formatDate";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";

const JOB_LABELS = {
  bulk_optimize: "Bulk Optimize",
  convert_formats: "Convert Formats",
};

function statusColor(status) {
  if (status === "completed") return "green";
  if (status === "running") return "blue";
  if (status === "failed") return "red";
  if (status === "cancelled") return "orange";
  return "default";
}

export default function AdminMediaBulkOptimizePage() {
  const [jobs, setJobs] = useState([]);
  const [runningJobId, setRunningJobId] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const loadJobs = async () => {
    try {
      const res = await fetch("/api/admin/media/jobs");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load jobs");
      const items = Array.isArray(data.items) ? data.items : [];
      setJobs(items);
      const running = items.find((j) => j.status === "running" || j.status === "queued");
      setRunningJobId(running?._id || "");
    } catch (err) {
      message.error(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!runningJobId) return undefined;
    const t = setInterval(loadJobs, 2000);
    return () => clearInterval(t);
  }, [runningJobId]);

  const startJob = async (jobType) => {
    setStarting(true);
    try {
      const res = await fetch("/api/admin/media/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to start job");
      message.success(`${JOB_LABELS[jobType] || "Job"} started`);
      setRunningJobId(data._id || "");
      loadJobs();
    } catch (err) {
      message.error(err.message || "Failed to start job");
    } finally {
      setStarting(false);
    }
  };

  const cancelJob = async (jobId) => {
    try {
      const res = await fetch(`/api/admin/media/jobs/${jobId}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to cancel job");
      message.success("Job cancelled");
      loadJobs();
    } catch (err) {
      message.error(err.message || "Failed to cancel job");
    }
  };

  const latestJob = useMemo(() => (jobs.length > 0 ? jobs[0] : null), [jobs]);
  const progressPercent = latestJob?.total
    ? Math.min(100, Math.round(((latestJob.processed || 0) / latestJob.total) * 100))
    : 0;

  return (
    <ThemeAdminCard
      title="Bulk Optimize"
      extra={
        <Space>
          <Button onClick={loadJobs} loading={loading}>Refresh</Button>
          <Button
            onClick={() => startJob("convert_formats")}
            loading={starting}
            disabled={Boolean(runningJobId)}
          >
            Convert Missing Formats
          </Button>
          <Button
            type="primary"
            onClick={() => startJob("bulk_optimize")}
            loading={starting}
            disabled={Boolean(runningJobId)}
          >
            Optimize All
          </Button>
        </Space>
      }
    >
      {latestJob && (
        <div style={{ marginBottom: 18 }}>
          <Typography.Text strong>
            Current job: {JOB_LABELS[latestJob.jobType] || latestJob.jobType}
          </Typography.Text>
          <Progress
            style={{ marginTop: 8 }}
            percent={progressPercent}
            status={latestJob.status === "failed" ? "exception" : "active"}
          />
          <Space size={16}>
            <Typography.Text type="secondary">
              Processed: {latestJob.processed || 0}/{latestJob.total || 0}
            </Typography.Text>
            <Typography.Text type="secondary">Success: {latestJob.success || 0}</Typography.Text>
            <Typography.Text type="secondary">Failed: {latestJob.failed || 0}</Typography.Text>
            <Typography.Text type="secondary">Skipped: {latestJob.skipped || 0}</Typography.Text>
            {(latestJob.status === "running" || latestJob.status === "queued") && (
              <Button size="small" danger onClick={() => cancelJob(latestJob._id)}>
                Cancel
              </Button>
            )}
          </Space>
        </div>
      )}

      <Table
        rowKey="_id"
        loading={adminTableLoading(loading)}
        locale={adminTableLocale(loading)}
        dataSource={jobs}
        pagination={{ pageSize: 10 }}
        columns={[
          {
            title: "Type",
            dataIndex: "jobType",
            render: (v) => JOB_LABELS[v] || v,
          },
          {
            title: "Status",
            dataIndex: "status",
            render: (v) => <Tag color={statusColor(v)}>{String(v || "").toUpperCase()}</Tag>,
          },
          {
            title: "Progress",
            key: "progress",
            render: (_, r) => `${r.processed || 0}/${r.total || 0}`,
          },
          { title: "Success", dataIndex: "success" },
          { title: "Failed", dataIndex: "failed" },
          { title: "Skipped", dataIndex: "skipped" },
          {
            title: "Created",
            dataIndex: "createdAt",
            render: (v) => formatDateTime(v),
          },
        ]}
      />
    </ThemeAdminCard>
  );
}
