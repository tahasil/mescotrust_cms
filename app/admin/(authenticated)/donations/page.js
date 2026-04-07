"use client";

import { useState, useEffect } from "react";
import { Table, Button, Space, Tag, Input, Select, Modal, Descriptions, message } from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";

const STATUS_COLORS = {
  pending: "orange",
  success: "green",
  failed: "red",
  aborted: "default",
};

export default function AdminDonationsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState(null);

  const fetchDonations = (p = page, s = search, st = statusFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 20 });
    if (st) params.set("status", st);
    if (s) params.set("search", s);
    fetch(`/api/admin/donations?${params}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => message.error("Failed to load donations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDonations(1, search, statusFilter);
    setPage(1);
  }, [statusFilter, search]);

  return (
    <ThemeAdminCard
      title="Donations"
      extra={
        <Space>
          <Select
            placeholder="All status"
            allowClear
            style={{ width: 140 }}
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || "")}
            options={[
              { value: "pending", label: "Pending" },
              { value: "success", label: "Success" },
              { value: "failed", label: "Failed" },
              { value: "aborted", label: "Aborted" },
            ]}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search name/email..."
            allowClear
            style={{ width: 220 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={items}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (p) => { setPage(p); fetchDonations(p, search, statusFilter); },
          showTotal: (t) => `${t} donations`,
        }}
        columns={[
          {
            title: "Order ID",
            dataIndex: "orderId",
            key: "orderId",
            width: 180,
            ellipsis: true,
          },
          {
            title: "Donor",
            key: "donor",
            render: (_, r) => (
              <div>
                <div style={{ fontWeight: 600 }}>{r.donor?.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{r.donor?.email}</div>
              </div>
            ),
          },
          {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            width: 120,
            render: (amt) => `₹${Number(amt).toLocaleString("en-IN")}`,
          },
          {
            title: "Purpose",
            dataIndex: "purpose",
            key: "purpose",
            ellipsis: true,
            width: 160,
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 100,
            render: (s) => <Tag color={STATUS_COLORS[s] || "default"}>{s?.toUpperCase()}</Tag>,
          },
          {
            title: "Date",
            dataIndex: "createdAt",
            key: "date",
            width: 140,
            render: (d) => formatDate(d),
          },
          {
            title: "",
            key: "actions",
            width: 60,
            render: (_, record) => (
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewItem(record)} />
            ),
          },
        ]}
      />

      <Modal
        open={!!viewItem}
        onCancel={() => setViewItem(null)}
        footer={null}
        title="Donation Details"
        width={700}
      >
        {viewItem && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Order ID" span={2}>{viewItem.orderId}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={STATUS_COLORS[viewItem.status]}>{viewItem.status?.toUpperCase()}</Tag></Descriptions.Item>
            <Descriptions.Item label="Amount">₹{Number(viewItem.amount).toLocaleString("en-IN")}</Descriptions.Item>
            <Descriptions.Item label="Purpose">{viewItem.purpose || "—"}</Descriptions.Item>
            <Descriptions.Item label="Zakat">{viewItem.zakat || "—"}</Descriptions.Item>
            <Descriptions.Item label="Note" span={2}>{viewItem.note || "—"}</Descriptions.Item>

            <Descriptions.Item label="Name">{viewItem.donor?.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{viewItem.donor?.email}</Descriptions.Item>
            <Descriptions.Item label="Mobile">{viewItem.donor?.mobile}</Descriptions.Item>
            <Descriptions.Item label="PAN">{viewItem.donor?.pan || "—"}</Descriptions.Item>
            <Descriptions.Item label="Address">{viewItem.donor?.address || "—"}</Descriptions.Item>
            <Descriptions.Item label="City">{viewItem.donor?.city || "—"}</Descriptions.Item>
            <Descriptions.Item label="State">{viewItem.donor?.state || "—"}</Descriptions.Item>
            <Descriptions.Item label="Country">{viewItem.donor?.country || "—"}</Descriptions.Item>
            <Descriptions.Item label="Pincode">{viewItem.donor?.pincode || "—"}</Descriptions.Item>

            {viewItem.payment?.trackingId && (
              <>
                <Descriptions.Item label="Tracking ID">{viewItem.payment.trackingId}</Descriptions.Item>
                <Descriptions.Item label="Bank Ref">{viewItem.payment.bankRefNo || "—"}</Descriptions.Item>
                <Descriptions.Item label="Payment Mode">{viewItem.payment.paymentMode || "—"}</Descriptions.Item>
                <Descriptions.Item label="Card">{viewItem.payment.cardName || "—"}</Descriptions.Item>
              </>
            )}

            <Descriptions.Item label="Submitted" span={2}>
              {formatDateTime(viewItem.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </ThemeAdminCard>
  );
}
