"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";

const STATUS_COLORS = {
  pending: "orange",
  success: "green",
  failed: "red",
  aborted: "default",
};

function formatInr(amount) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return "₹0";
  return `₹${parsed.toLocaleString("en-IN")}`;
}

function renderMaybeText(value) {
  const text = String(value ?? "").trim();
  return text || "—";
}

export default function AdminDonationsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState(null);

  const fetchDonations = (nextPage = page, nextSearch = search, nextStatus = statusFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(nextPage), limit: "20" });
    if (nextStatus) params.set("status", nextStatus);
    if (nextSearch) params.set("search", nextSearch);

    fetch(`/api/admin/donations?${params}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total) || 0);
      })
      .catch(() => message.error("Failed to load donations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDonations(1, search, statusFilter);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search]);

  const columns = useMemo(
    () => [
      {
        title: "Submission Date & Time",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 190,
        render: (value) => formatDateTime(value),
      },
      {
        title: "Donor Information",
        key: "donor",
        width: 260,
        render: (_, row) => (
          <div>
            <div style={{ fontWeight: 600 }}>{renderMaybeText(row?.donor?.name)}</div>
            <div style={{ fontSize: 12, color: "#777" }}>{renderMaybeText(row?.donor?.email)}</div>
            <div style={{ fontSize: 12, color: "#777" }}>{renderMaybeText(row?.donor?.mobile)}</div>
          </div>
        ),
      },
      {
        title: "Donation Purpose",
        key: "purpose",
        width: 220,
        render: (_, row) => (
          <div>
            <div>{renderMaybeText(row?.purpose)}</div>
            {row?.purposeId ? (
              <div style={{ fontSize: 11, color: "#888" }}>ID: {row.purposeId}</div>
            ) : null}
          </div>
        ),
      },
      {
        title: "Donation Amount",
        dataIndex: "amount",
        key: "amount",
        width: 140,
        render: (amount) => formatInr(amount),
      },
      {
        title: "Payment Status",
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (status) => (
          <Tag color={STATUS_COLORS[status] || "default"}>
            {String(status || "unknown").toUpperCase()}
          </Tag>
        ),
      },
      {
        title: "Transaction Details",
        key: "transaction",
        width: 210,
        render: (_, row) => (
          <div style={{ fontSize: 12 }}>
            <div>Order: {renderMaybeText(row?.orderId)}</div>
            <div>Tracking: {renderMaybeText(row?.payment?.trackingId)}</div>
            <div>Bank Ref: {renderMaybeText(row?.payment?.bankRefNo)}</div>
          </div>
        ),
      },
      {
        title: "",
        key: "actions",
        width: 60,
        render: (_, record) => (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setViewItem(record)}
          />
        ),
      },
    ],
    [],
  );

  return (
    <ThemeAdminCard
      title="Donate Now Submissions"
      extra={
        <Space>
          <Select
            placeholder="All status"
            allowClear
            style={{ width: 140 }}
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value || "")}
            options={[
              { value: "pending", label: "Pending" },
              { value: "success", label: "Success" },
              { value: "failed", label: "Failed" },
              { value: "aborted", label: "Aborted" },
            ]}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search donor/order/purpose..."
            allowClear
            style={{ width: 260 }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={items}
        scroll={{ x: 1220 }}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (nextPage) => {
            setPage(nextPage);
            fetchDonations(nextPage, search, statusFilter);
          },
          showTotal: (count) => `${count} submissions`,
        }}
        columns={columns}
      />

      <Modal
        open={Boolean(viewItem)}
        onCancel={() => setViewItem(null)}
        footer={null}
        title="Donation Details"
        width={860}
      >
        {viewItem ? (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Submission Date & Time" span={2}>
              {formatDateTime(viewItem.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Order ID">{renderMaybeText(viewItem.orderId)}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLORS[viewItem.status] || "default"}>
                {String(viewItem.status || "unknown").toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Purpose">{renderMaybeText(viewItem.purpose)}</Descriptions.Item>
            <Descriptions.Item label="Purpose ID">{renderMaybeText(viewItem.purposeId)}</Descriptions.Item>
            <Descriptions.Item label="Amount">{formatInr(viewItem.amount)}</Descriptions.Item>
            <Descriptions.Item label="Currency">{renderMaybeText(viewItem.currency || "INR")}</Descriptions.Item>
            <Descriptions.Item label="Zakat">{renderMaybeText(viewItem.zakat)}</Descriptions.Item>
            <Descriptions.Item label="Interest Money">
              {renderMaybeText(viewItem.interestMoney)}
            </Descriptions.Item>
            <Descriptions.Item label="Students Count">
              {renderMaybeText(viewItem.studentsCount)}
            </Descriptions.Item>
            <Descriptions.Item label="Terms Accepted">
              {viewItem.termsAccepted ? "Yes" : "No"}
            </Descriptions.Item>

            <Descriptions.Item label="Donor Name">{renderMaybeText(viewItem?.donor?.name)}</Descriptions.Item>
            <Descriptions.Item label="Email">{renderMaybeText(viewItem?.donor?.email)}</Descriptions.Item>
            <Descriptions.Item label="Mobile">{renderMaybeText(viewItem?.donor?.mobile)}</Descriptions.Item>
            <Descriptions.Item label="PAN">{renderMaybeText(viewItem?.donor?.pan)}</Descriptions.Item>
            <Descriptions.Item label="Address">{renderMaybeText(viewItem?.donor?.address)}</Descriptions.Item>
            <Descriptions.Item label="City">{renderMaybeText(viewItem?.donor?.city)}</Descriptions.Item>
            <Descriptions.Item label="State">{renderMaybeText(viewItem?.donor?.state)}</Descriptions.Item>
            <Descriptions.Item label="Country">{renderMaybeText(viewItem?.donor?.country)}</Descriptions.Item>
            <Descriptions.Item label="Pincode">{renderMaybeText(viewItem?.donor?.pincode)}</Descriptions.Item>

            <Descriptions.Item label="Tracking ID">
              {renderMaybeText(viewItem?.payment?.trackingId)}
            </Descriptions.Item>
            <Descriptions.Item label="Bank Reference">
              {renderMaybeText(viewItem?.payment?.bankRefNo)}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Mode">
              {renderMaybeText(viewItem?.payment?.paymentMode)}
            </Descriptions.Item>
            <Descriptions.Item label="Card Name">
              {renderMaybeText(viewItem?.payment?.cardName)}
            </Descriptions.Item>
            <Descriptions.Item label="Status Code">
              {renderMaybeText(viewItem?.payment?.statusCode)}
            </Descriptions.Item>
            <Descriptions.Item label="Status Message">
              {renderMaybeText(viewItem?.payment?.statusMsg)}
            </Descriptions.Item>

            <Descriptions.Item label="Additional Fields" span={2}>
              {viewItem?.additionalFields && Object.keys(viewItem.additionalFields).length > 0 ? (
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: 12,
                  }}
                >
                  {JSON.stringify(viewItem.additionalFields, null, 2)}
                </pre>
              ) : (
                "—"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Note" span={2}>
              {renderMaybeText(viewItem.note)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </ThemeAdminCard>
  );
}

