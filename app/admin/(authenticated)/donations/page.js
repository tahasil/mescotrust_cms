"use client";

import { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Descriptions,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";
import AdminExportDropdown from "@/components/admin/AdminExportDropdown";

const STATUS_COLORS = {
  pending: "orange",
  success: "green",
  failed: "red",
  cancelled: "default",
  aborted: "default",
};

const DONATION_EXPORT_COLUMNS = [
  { key: "createdAt", label: "Submission Date & Time" },
  { key: "donor_name", label: "Donor Name" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" },
  { key: "pan", label: "PAN" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "pincode", label: "Pincode" },
  { key: "purpose", label: "Donation Purpose" },
  { key: "purposeId", label: "Purpose ID" },
  { key: "amount", label: "Donation Amount" },
  { key: "currency", label: "Currency" },
  { key: "status", label: "Payment Status" },
  { key: "zakat", label: "Zakat" },
  { key: "interestMoney", label: "Interest Money" },
  { key: "studentsCount", label: "Student Count" },
  { key: "donorType", label: "Donor Type" },
  { key: "orderId", label: "Order ID" },
  { key: "transactionId", label: "Transaction ID" },
  { key: "paymentId", label: "Payment ID" },
  { key: "trackingId", label: "Tracking ID" },
  { key: "bankRefNo", label: "Bank Reference" },
  { key: "paymentMode", label: "Payment Mode" },
  { key: "orderStatus", label: "Gateway Status" },
  { key: "verificationStatus", label: "Verification Status" },
  { key: "completedAt", label: "Completed Date & Time" },
  { key: "note", label: "Note" },
];

function formatStatus(status) {
  if (["aborted", "cancelled"].includes(String(status || "").toLowerCase())) {
    return "CANCELLED";
  }
  return String(status || "unknown").toUpperCase();
}

function formatInr(amount) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return "₹0";
  return `₹${parsed.toLocaleString("en-IN")}`;
}

function renderMaybeText(value) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function buildDonationQueryParams({
  page,
  search,
  status,
  dateRange,
  includePagination = true,
}) {
  const params = new URLSearchParams();
  if (includePagination) {
    params.set("page", String(page || 1));
    params.set("limit", "20");
  }
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (dateRange?.[0]) {
    params.set("from", dateRange[0].startOf("day").toISOString());
  }
  if (dateRange?.[1]) {
    params.set("to", dateRange[1].endOf("day").toISOString());
  }
  return params;
}

const DONATIONS_SEARCH_STORAGE_KEY = "admin-donations-search-query-v1";
const DONATIONS_STATUS_STORAGE_KEY = "admin-donations-status-filter-v1";

export default function AdminDonationsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("status") || sessionStorage.getItem(DONATIONS_STATUS_STORAGE_KEY) || "";
  });
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("search") || sessionStorage.getItem(DONATIONS_SEARCH_STORAGE_KEY) || "";
  });
  const [dateRange, setDateRange] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (search.trim()) {
      sessionStorage.setItem(DONATIONS_SEARCH_STORAGE_KEY, search);
      url.searchParams.set("search", search);
    } else {
      sessionStorage.removeItem(DONATIONS_SEARCH_STORAGE_KEY);
      url.searchParams.delete("search");
    }
    if (statusFilter) {
      sessionStorage.setItem(DONATIONS_STATUS_STORAGE_KEY, statusFilter);
      url.searchParams.set("status", statusFilter);
    } else {
      sessionStorage.removeItem(DONATIONS_STATUS_STORAGE_KEY);
      url.searchParams.delete("status");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [search, statusFilter]);

  const fetchDonations = (
    nextPage = page,
    nextSearch = search,
    nextStatus = statusFilter,
    nextDateRange = dateRange,
  ) => {
    setLoading(true);
    const params = buildDonationQueryParams({
      page: nextPage,
      search: nextSearch,
      status: nextStatus,
      dateRange: nextDateRange,
    });

    fetch(`/api/admin/donations?${params}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load donations");
        return data;
      })
      .then((data) => {
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total) || 0);
      })
      .catch((error) => message.error(error.message || "Failed to load donations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDonations(1, search, statusFilter, dateRange);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, dateRange]);

  const deleteDonation = async (record) => {
    setDeletingId(record._id);
    try {
      const response = await fetch(`/api/admin/donations/${record._id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result?.softDeleted) {
        throw new Error(result?.error || "Failed to delete donation");
      }
      if (viewItem?._id === record._id) setViewItem(null);
      message.success("Donation deleted");
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      fetchDonations(nextPage, search, statusFilter, dateRange);
    } catch (error) {
      message.error(error.message || "Failed to delete donation");
    } finally {
      setDeletingId("");
    }
  };

  const columns = [
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
          {formatStatus(status)}
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
          <div>Transaction: {renderMaybeText(row?.payment?.transactionId)}</div>
          <div>Tracking: {renderMaybeText(row?.payment?.trackingId)}</div>
          <div>Bank Ref: {renderMaybeText(row?.payment?.bankRefNo)}</div>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View donation">
            <Button
              type="text"
              size="small"
              aria-label="View donation"
              icon={<EyeOutlined />}
              onClick={() => setViewItem(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this donation submission?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            onConfirm={() => deleteDonation(record)}
          >
            <Tooltip title="Delete donation">
              <Button
                danger
                type="text"
                size="small"
                aria-label="Delete donation"
                loading={deletingId === record._id}
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ThemeAdminCard
      title="Donate Submissions"
      extra={
        <Space wrap style={{ justifyContent: "flex-end" }}>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            allowClear
            format="DD MMM YYYY"
            placeholder={["Start date", "End date"]}
            style={{ width: 260 }}
          />
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
              { value: "cancelled", label: "Cancelled" },
              { value: "aborted", label: "Cancelled (legacy)" },
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
          <AdminExportDropdown
            exportUrl="/api/admin/donations/export"
            filters={{
              search,
              status: statusFilter,
              dateFrom: dateRange?.[0] ? dateRange[0].startOf("day").toISOString() : "",
              dateTo: dateRange?.[1] ? dateRange[1].endOf("day").toISOString() : "",
            }}
            availableColumns={DONATION_EXPORT_COLUMNS}
            defaultFilename="donations-export"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchDonations(page, search, statusFilter, dateRange)}
          >
            Refresh
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={items}
        size="middle"
        scroll={{ x: 1320 }}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (nextPage) => {
            setPage(nextPage);
            fetchDonations(nextPage, search, statusFilter, dateRange);
          },
          showTotal: (count) => `${count} submissions`,
          showSizeChanger: false,
          responsive: true,
          showLessItems: true,
        }}
        columns={columns}
      />

      <Modal
        open={Boolean(viewItem)}
        onCancel={() => setViewItem(null)}
        footer={null}
        title="Donation Details"
        width={760}
      >
        {viewItem ? (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Submission Date & Time" span={2}>
              {formatDateTime(viewItem.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Donor Name">{renderMaybeText(viewItem.donor?.name)}</Descriptions.Item>
            <Descriptions.Item label="Email">{renderMaybeText(viewItem.donor?.email)}</Descriptions.Item>
            <Descriptions.Item label="Mobile">{renderMaybeText(viewItem.donor?.mobile)}</Descriptions.Item>
            <Descriptions.Item label="PAN">{renderMaybeText(viewItem.donor?.pan)}</Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>{renderMaybeText(viewItem.donor?.address)}</Descriptions.Item>
            <Descriptions.Item label="City">{renderMaybeText(viewItem.donor?.city)}</Descriptions.Item>
            <Descriptions.Item label="State">{renderMaybeText(viewItem.donor?.state)}</Descriptions.Item>
            <Descriptions.Item label="Country">{renderMaybeText(viewItem.donor?.country)}</Descriptions.Item>
            <Descriptions.Item label="Pincode">{renderMaybeText(viewItem.donor?.pincode)}</Descriptions.Item>
            <Descriptions.Item label="Purpose">{renderMaybeText(viewItem.purpose)}</Descriptions.Item>
            <Descriptions.Item label="Purpose ID">{renderMaybeText(viewItem.purposeId)}</Descriptions.Item>
            <Descriptions.Item label="Amount">{formatInr(viewItem.amount)}</Descriptions.Item>
            <Descriptions.Item label="Payment Status">
              <Tag color={STATUS_COLORS[viewItem.status] || "default"}>
                {formatStatus(viewItem.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Zakat">{renderMaybeText(viewItem.zakat)}</Descriptions.Item>
            <Descriptions.Item label="Interest Money">{renderMaybeText(viewItem.interestMoney)}</Descriptions.Item>
            <Descriptions.Item label="Student Count">{renderMaybeText(viewItem.studentsCount)}</Descriptions.Item>
            <Descriptions.Item label="Donor Type">{renderMaybeText(viewItem.donorType)}</Descriptions.Item>
            <Descriptions.Item label="Order ID">{renderMaybeText(viewItem.orderId)}</Descriptions.Item>
            <Descriptions.Item label="Transaction ID">{renderMaybeText(viewItem.payment?.transactionId)}</Descriptions.Item>
            <Descriptions.Item label="Payment ID">{renderMaybeText(viewItem.payment?.paymentId)}</Descriptions.Item>
            <Descriptions.Item label="Tracking ID">{renderMaybeText(viewItem.payment?.trackingId)}</Descriptions.Item>
            <Descriptions.Item label="Bank Reference">{renderMaybeText(viewItem.payment?.bankRefNo)}</Descriptions.Item>
            <Descriptions.Item label="Payment Mode">{renderMaybeText(viewItem.payment?.paymentMode)}</Descriptions.Item>
            <Descriptions.Item label="Gateway Status">{renderMaybeText(viewItem.payment?.orderStatus)}</Descriptions.Item>
            <Descriptions.Item label="Verification Status">{renderMaybeText(viewItem.payment?.verificationStatus)}</Descriptions.Item>
            <Descriptions.Item label="Completed At" span={2}>
              {viewItem.completedAt ? formatDateTime(viewItem.completedAt) : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Note" span={2}>{renderMaybeText(viewItem.note)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </ThemeAdminCard>
  );
}
