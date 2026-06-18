"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Progress,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import {
  AppstoreOutlined,
  CheckSquareOutlined,
  FilePdfOutlined,
  InboxOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import MediaDetailsDrawer from "./MediaDetailsDrawer";
import RasterCropConfirmModal from "./RasterCropConfirmModal";
import { isRasterUploadFile } from "./rasterMedia";
import {
  PAGE_SIZE,
  dimensionsText,
  formatBytes,
  formatDate,
  isImage,
  mergeById,
  monthLabel,
  previewUrl,
  readJson,
} from "./mediaUtils";
import styles from "./AdminMediaLibrary.module.css";

const { Dragger } = Upload;

function appendCropContractToFormData(formData, cropContract) {
  if (!cropContract?.crop) return;
  formData.append("crop", JSON.stringify(cropContract.crop));
  if (Number.isInteger(cropContract.width)) {
    formData.append("width", String(cropContract.width));
  }
  if (Number.isInteger(cropContract.height)) {
    formData.append("height", String(cropContract.height));
  }
}

function createUploadError(data, fallback = "Upload failed") {
  const error = new Error(data?.error || fallback);
  error.code = data?.code || "";
  return error;
}

export default function AdminMediaLibrary() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [monthOptions, setMonthOptions] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFileList, setUploadFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [activeMediaId, setActiveMediaId] = useState("");
  const [activeItem, setActiveItem] = useState(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [replacingFile, setReplacingFile] = useState(false);
  const [processingAction, setProcessingAction] = useState("");
  const [replaceFileList, setReplaceFileList] = useState([]);
  const [cropRequest, setCropRequest] = useState(null);
  const [detailsForm] = Form.useForm();

  const uploadStatsRef = useRef({ active: 0, success: 0, failed: 0 });
  const cropQueueRef = useRef([]);
  const activeCropRequestRef = useRef(null);

  const allVisibleIds = useMemo(() => items.map((item) => String(item._id)), [items]);
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));

  const uploadOverallPercent = useMemo(() => {
    if (!uploadFileList.length) return 0;
    const sum = uploadFileList.reduce((acc, file) => acc + (Number(file.percent) || 0), 0);
    return Math.round(sum / uploadFileList.length);
  }, [uploadFileList]);

  const finalizeUploadBatchIfDone = () => {
    if (uploadStatsRef.current.active !== 0) return;
    const success = uploadStatsRef.current.success;
    const failed = uploadStatsRef.current.failed;
    uploadStatsRef.current.success = 0;
    uploadStatsRef.current.failed = 0;
    setUploading(false);
    if (success > 0) message.success(`${success} file(s) uploaded and optimized`);
    if (failed > 0) message.error(`${failed} file(s) failed`);
    if (success > 0) {
      setPage(1);
      fetchMedia(1);
    }
  };

  const pumpCropQueue = () => {
    if (activeCropRequestRef.current) return;
    const next = cropQueueRef.current.shift();
    if (!next) return;
    activeCropRequestRef.current = next;
    setCropRequest({ file: next.file, title: next.title });
  };

  const requestRasterCrop = (file, title) =>
    new Promise((resolve, reject) => {
      cropQueueRef.current.push({
        file,
        title,
        resolve,
        reject,
      });
      pumpCropQueue();
    });

  const closeActiveCropRequest = () => {
    activeCropRequestRef.current = null;
    setCropRequest(null);
    pumpCropQueue();
  };

  const handleCropCancel = () => {
    const activeRequest = activeCropRequestRef.current;
    if (activeRequest) {
      activeRequest.reject(createUploadError({ code: "CROP_CONFIRMATION_REQUIRED", error: "Crop confirmation is required" }));
    }
    closeActiveCropRequest();
  };

  const handleCropConfirm = (cropContract) => {
    const activeRequest = activeCropRequestRef.current;
    if (activeRequest) activeRequest.resolve(cropContract);
    closeActiveCropRequest();
  };

  const fetchMedia = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_SIZE),
        includeFacets: "true",
      });
      if (searchQuery) params.set("q", searchQuery);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (monthFilter !== "all") params.set("month", monthFilter);
      const res = await fetch(`/api/admin/media?${params.toString()}`);
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Failed to load media");

      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total) || 0);
      const months = Array.isArray(data?.facets?.months) ? data.facets.months : [];
      setMonthOptions(
        months.map((m) => ({
          value: m.value,
          label: `${monthLabel(m.value)} (${Number(m.count) || 0})`,
        })),
      );
    } catch (err) {
      message.error(err.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveItem = async (id) => {
    if (!id) return;
    setDrawerLoading(true);
    try {
      const res = await fetch(`/api/admin/media/${id}`);
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Failed to load details");
      setActiveItem(data);
      setItems((prev) => mergeById(prev, [data]));
      detailsForm.setFieldsValue({
        title: data.title || data.originalName || "",
        alt: data.altText || data.alt || "",
        caption: data.caption || "",
        description: data.description || "",
      });
    } catch (err) {
      message.error(err.message || "Failed to load details");
    } finally {
      setDrawerLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchMedia(page);
  }, [page, searchQuery, typeFilter, monthFilter]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, searchQuery, typeFilter, monthFilter]);

  const runBulkAction = async ({ action, ids, force = false }) => {
    const targetIds = Array.from(new Set((ids || []).map((id) => String(id)).filter(Boolean)));
    if (!targetIds.length) return null;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: targetIds, force }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (Array.isArray(data.items) && data.items.length) {
        setItems((prev) => mergeById(prev, data.items));
      }
      return data;
    } finally {
      setBulkLoading(false);
    }
  };

  const openDrawer = async (item) => {
    const id = String(item?._id || "");
    if (!id) return;
    setDrawerOpen(true);
    setActiveItem(item);
    setActiveMediaId(id);
    setReplaceFileList([]);
    await refreshActiveItem(id);
  };

  const onSave = async () => {
    if (!activeMediaId) return;
    try {
      const values = await detailsForm.validateFields();
      setSavingDetails(true);
      const res = await fetch(`/api/admin/media/${activeMediaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Save failed");
      setActiveItem(data);
      setItems((prev) => mergeById(prev, [data]));
      message.success("Media details saved");
    } catch (err) {
      if (!err?.errorFields) message.error(err.message || "Save failed");
    } finally {
      setSavingDetails(false);
    }
  };

  const onReplace = async () => {
    const file = replaceFileList?.[0]?.originFileObj;
    if (!activeItem?._id || !file) {
      message.warning("Choose a replacement file first");
      return;
    }

    try {
      setReplacingFile(true);
      let cropContract = null;
      if (isRasterUploadFile(file)) {
        cropContract = await requestRasterCrop(file, "Crop replacement image");
      }

      const values = detailsForm.getFieldsValue();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", values.title || "");
      formData.append("altText", values.alt || "");
      appendCropContractToFormData(formData, cropContract);

      const res = await fetch(`/api/admin/media/${activeItem._id}/replace`, {
        method: "POST",
        body: formData,
      });
      const data = await readJson(res);
      if (!res.ok) throw createUploadError(data, "Replace failed");

      setActiveItem(data);
      setItems((prev) => mergeById(prev, [data]));
      setReplaceFileList([]);
      message.success("File replaced and optimized");
      fetchMedia(page);
    } catch (err) {
      if (err?.code === "CROP_CONFIRMATION_REQUIRED") return;
      message.error(err.message || "Replace failed");
    } finally {
      setReplacingFile(false);
    }
  };

  const onDelete = () => {
    if (!activeItem?._id) return;
    Modal.confirm({
      title: "Delete this file?",
      content: `Delete "${activeItem.originalName}". This cannot be undone.`,
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/media/${activeItem._id}`, { method: "DELETE" });
        const data = await readJson(res);
        if (!res.ok && data.code === "MEDIA_IN_USE") {
          Modal.confirm({
            title: "Media is in use",
            content: "This media is referenced in existing content. Force delete anyway?",
            okType: "danger",
            okText: "Force Delete",
            onOk: async () => {
              const forceRes = await fetch(`/api/admin/media/${activeItem._id}?force=true`, {
                method: "DELETE",
              });
              const forceData = await readJson(forceRes);
              if (!forceRes.ok) {
                message.error(forceData.error || "Force delete failed");
                return;
              }
              message.success("Media deleted");
              setDrawerOpen(false);
              fetchMedia(page);
            },
          });
          return;
        }
        if (!res.ok) {
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Media deleted");
        setDrawerOpen(false);
        fetchMedia(page);
      },
    });
  };

  const onProcess = async (action) => {
    if (!activeItem?._id) return;
    setProcessingAction(action);
    try {
      await runBulkAction({ action, ids: [activeItem._id] });
      await refreshActiveItem(activeItem._id);
      fetchMedia(page);
      message.success("Media processed");
    } catch (err) {
      message.error(err.message || "Processing failed");
    } finally {
      setProcessingAction("");
    }
  };

  const copyUrl = async (url) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      message.success("URL copied");
    } catch {
      message.error("Failed to copy URL");
    }
  };

  const onApplyBulk = async () => {
    if (!bulkAction || !selectedIds.length) {
      message.warning("Choose action and selection");
      return;
    }
    if (bulkAction === "export_metadata") {
      const data = await runBulkAction({ action: "export_metadata", ids: selectedIds });
      const blob = new Blob([JSON.stringify(data?.items || [], null, 2)], {
        type: "application/json",
      });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `media-metadata-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      message.success(
        `${Array.isArray(data?.items) ? data.items.length : 0} metadata records downloaded`,
      );
      return;
    }
    if (bulkAction === "delete") {
      Modal.confirm({
        title: `Delete ${selectedIds.length} selected file(s)?`,
        okType: "danger",
        onOk: async () => {
          const first = await runBulkAction({ action: "delete", ids: selectedIds });
          const inUse = (first?.results || []).filter((result) => result.code === "MEDIA_IN_USE");
          const showSummary = (result) => {
            const success = Number(result?.summary?.success) || 0;
            const failed = Number(result?.summary?.failed) || 0;
            const skipped = Number(result?.summary?.skipped) || 0;
            if (success > 0) message.success(`${success} file(s) deleted`);
            if (failed > 0 || skipped > 0) {
              message.warning(`${failed} failed, ${skipped} skipped`);
            }
          };

          if (inUse.length > 0) {
            showSummary(first);
            Modal.confirm({
              title: `${inUse.length} selected file(s) are in use`,
              content: "Force delete them anyway?",
              okType: "danger",
              okText: "Force Delete",
              onOk: async () => {
                const forced = await runBulkAction({
                  action: "delete",
                  ids: inUse.map((item) => item.id),
                  force: true,
                });
                showSummary(forced);
                setSelectedIds([]);
                setSelectionMode(false);
                fetchMedia(page);
              },
            });
            return;
          }

          showSummary(first);
          setSelectedIds([]);
          setSelectionMode(false);
          fetchMedia(page);
        },
      });
      return;
    }

    const result = await runBulkAction({ action: bulkAction, ids: selectedIds });
    const success = Number(result?.summary?.success) || 0;
    const failed = Number(result?.summary?.failed) || 0;
    const skipped = Number(result?.summary?.skipped) || 0;
    if (success > 0) message.success(`${success} file(s) processed`);
    if (failed > 0 || skipped > 0) message.warning(`${failed} failed, ${skipped} skipped`);
    fetchMedia(page);
  };

  const uploadFileToMediaApi = ({ file, cropContract, onProgress, onSuccess, onError }) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    appendCropContractToFormData(formData, cropContract);

    xhr.upload.onprogress = (event) => {
      if (event.total > 0) {
        onProgress?.({ percent: (event.loaded / event.total) * 100 });
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        data = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onSuccess?.(data);
      } else {
        onError?.(createUploadError(data));
      }
    };

    xhr.open("POST", "/api/admin/media");
    xhr.send(formData);
    return xhr;
  };

  const uploadRequest = ({ file, onProgress, onSuccess, onError }) => {
    uploadStatsRef.current.active += 1;
    setUploading(true);
    const controller = { xhr: null, finished: false };

    const markDone = (ok) => {
      if (controller.finished) return;
      controller.finished = true;
      uploadStatsRef.current.active = Math.max(0, uploadStatsRef.current.active - 1);
      if (ok) uploadStatsRef.current.success += 1;
      else uploadStatsRef.current.failed += 1;
      finalizeUploadBatchIfDone();
    };

    const run = async () => {
      try {
        let cropContract = null;
        if (isRasterUploadFile(file)) {
          cropContract = await requestRasterCrop(file, "Crop image before upload");
        }
        if (controller.finished) return;

        controller.xhr = uploadFileToMediaApi({
          file,
          cropContract,
          onProgress,
          onSuccess: (data) => {
            onSuccess?.(data);
            markDone(true);
          },
          onError: (err) => {
            onError?.(err);
            markDone(false);
          },
        });
      } catch (err) {
        if (!controller.finished) {
          onError?.(err);
          markDone(false);
        }
      }
    };

    run();

    return {
      abort: () => {
        if (controller.xhr) {
          controller.xhr.abort();
        }
        markDone(false);
      },
    };
  };

  const renderThumb = (item) => {
    if (!isImage(item)) return <FilePdfOutlined className={styles.pdfIcon} />;
    const src = previewUrl(item);
    if (!src) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />;
    return <img src={src} alt={item.originalName} className={styles.thumbImage} />;
  };

  return (
    <>
      <ThemeAdminCard
        title={
          <div>
            <div>Media Library</div>
            <div className={styles.headerSubtitle}>WordPress-style media manager</div>
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<CheckSquareOutlined />}
              type={selectionMode ? "primary" : "default"}
              onClick={() => {
                const next = !selectionMode;
                setSelectionMode(next);
                if (!next) setSelectedIds([]);
              }}
            >
              {selectionMode ? "Cancel Select" : "Bulk Select"}
            </Button>
            <Button
              icon={<UploadOutlined />}
              type="primary"
              onClick={() => setUploadModalOpen(true)}
            >
              Upload
            </Button>
          </Space>
        }
      >
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                {
                  label: (
                    <Tooltip title="Grid">
                      <AppstoreOutlined />
                    </Tooltip>
                  ),
                  value: "grid",
                },
                {
                  label: (
                    <Tooltip title="List">
                      <UnorderedListOutlined />
                    </Tooltip>
                  ),
                  value: "list",
                },
              ]}
            />
            <Select
              value={typeFilter}
              onChange={(value) => {
                setPage(1);
                setTypeFilter(value);
              }}
              options={[
                { value: "all", label: "All media items" },
                { value: "image", label: "Images" },
                { value: "document", label: "Documents" },
              ]}
              className={styles.selectControl}
            />
            <Select
              value={monthFilter}
              onChange={(value) => {
                setPage(1);
                setMonthFilter(value);
              }}
              options={[{ value: "all", label: "All dates" }, ...monthOptions]}
              className={styles.selectControl}
            />
          </div>
          <Input
            allowClear
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            prefix={<SearchOutlined style={{ color: "#999" }} />}
            placeholder="Search media"
            className={styles.searchInput}
          />
        </div>

        {selectionMode ? (
          <div className={styles.bulkBar}>
            <Space wrap>
              <Tag color="blue">{selectedIds.length} selected</Tag>
              <Button
                size="small"
                onClick={() =>
                  setSelectedIds(
                    allVisibleSelected
                      ? selectedIds.filter((id) => !allVisibleIds.includes(id))
                      : Array.from(new Set([...selectedIds, ...allVisibleIds])),
                  )
                }
              >
                {allVisibleSelected ? "Unselect page" : "Select page"}
              </Button>
              <Select
                value={bulkAction}
                onChange={setBulkAction}
                placeholder="Bulk actions"
                style={{ width: 220 }}
                options={[
                  { value: "delete", label: "Delete selected" },
                  { value: "optimize", label: "Optimize selected" },
                  { value: "convert", label: "Convert WebP / AVIF" },
                  { value: "export_metadata", label: "Download selected metadata" },
                ]}
              />
              <Button
                type="primary"
                onClick={onApplyBulk}
                loading={bulkLoading}
                disabled={!bulkAction || !selectedIds.length}
              >
                Apply
              </Button>
            </Space>
          </div>
        ) : null}

        {loading ? (
          <div className={styles.centerArea}>
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          <Empty description="No media found" />
        ) : viewMode === "grid" ? (
          <div className={styles.mediaGrid}>
            {items.map((item) => {
              const itemId = String(item._id);
              const selected = selectedIds.includes(itemId);
              return (
                <div
                  key={itemId}
                  className={`${styles.mediaCard} ${selected ? styles.mediaCardSelected : ""}`}
                  onClick={() =>
                    selectionMode
                      ? setSelectedIds((prev) =>
                          selected
                            ? prev.filter((id) => id !== itemId)
                            : Array.from(new Set([...prev, itemId])),
                        )
                      : openDrawer(item)
                  }
                >
                  {selectionMode ? (
                    <input
                      type="checkbox"
                      className={styles.selectionCheckbox}
                      checked={selected}
                      onChange={(event) => {
                        event.stopPropagation();
                        setSelectedIds((prev) =>
                          event.target.checked
                            ? Array.from(new Set([...prev, itemId]))
                            : prev.filter((id) => id !== itemId),
                        );
                      }}
                    />
                  ) : null}
                  <div className={styles.thumbWrap}>{renderThumb(item)}</div>
                  <div className={styles.cardMeta}>
                    <div className={styles.cardName} title={item.originalName}>
                      {item.originalName}
                    </div>
                    <div className={styles.cardInfo}>{formatBytes(item.size)}</div>
                    <div className={styles.cardInfo}>{dimensionsText(item)}</div>
                    {Number(item.savingsPercentage) > 0 ? (
                      <Tag color="green">{Number(item.savingsPercentage).toFixed(1)}% saved</Tag>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Table
            size="small"
            rowKey="_id"
            dataSource={items}
            pagination={false}
            rowSelection={
              selectionMode
                ? {
                    selectedRowKeys: selectedIds,
                    onChange: (keys) => setSelectedIds(keys.map((key) => String(key))),
                  }
                : undefined
            }
            onRow={(record) => ({
              onClick: () => !selectionMode && openDrawer(record),
            })}
            columns={[
              {
                title: "Preview",
                width: 84,
                render: (_, item) => <div className={styles.tablePreview}>{renderThumb(item)}</div>,
              },
              {
                title: "File",
                render: (_, item) => (
                  <Space direction="vertical" size={0}>
                    <Typography.Text strong ellipsis={{ tooltip: item.originalName }}>
                      {item.originalName}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {item.mimeType}
                    </Typography.Text>
                  </Space>
                ),
              },
              {
                title: "Size",
                width: 120,
                render: (_, item) => formatBytes(item.size),
              },
              {
                title: "Dimensions",
                width: 120,
                render: (_, item) => dimensionsText(item),
              },
              {
                title: "Optimized",
                width: 130,
                render: (_, item) =>
                  Number(item.savingsPercentage) > 0 ? (
                    <Tag color="green">{Number(item.savingsPercentage).toFixed(1)}%</Tag>
                  ) : (
                    <Tag>Not yet</Tag>
                  ),
              },
              {
                title: "Uploaded",
                width: 180,
                render: (_, item) => formatDate(item.createdAt),
              },
            ]}
          />
        )}

        {total > PAGE_SIZE ? (
          <div className={styles.paginationWrap}>
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(count) => `${count} files`}
            />
          </div>
        ) : null}
      </ThemeAdminCard>

      <Modal
        title="Upload media"
        open={uploadModalOpen}
        onCancel={() => !uploading && setUploadModalOpen(false)}
        width={720}
        footer={[
          <Button
            key="close"
            onClick={() => setUploadModalOpen(false)}
            disabled={uploading}
          >
            Close
          </Button>,
        ]}
      >
        <div className={styles.uploadHint}>
          Raster images require crop confirmation before upload.
        </div>
        <Dragger
          multiple
          accept=".jpg,.jpeg,.png,.webp,.avif,.svg,.pdf"
          customRequest={uploadRequest}
          fileList={uploadFileList}
          onChange={({ fileList }) => setUploadFileList(fileList.slice(-80))}
          showUploadList={{ showRemoveIcon: !uploading }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag files to upload</p>
        </Dragger>
        {uploading ? (
          <Progress percent={uploadOverallPercent} status="active" style={{ marginTop: 14 }} />
        ) : null}
      </Modal>

      <MediaDetailsDrawer
        open={drawerOpen}
        loading={drawerLoading}
        item={activeItem}
        form={detailsForm}
        saving={savingDetails}
        replacing={replacingFile}
        processingAction={processingAction}
        replaceFileList={replaceFileList}
        setReplaceFileList={setReplaceFileList}
        onClose={() => {
          setDrawerOpen(false);
          setActiveMediaId("");
          setActiveItem(null);
          setReplaceFileList([]);
          detailsForm.resetFields();
        }}
        onRefresh={() => refreshActiveItem(activeMediaId)}
        onSave={onSave}
        onDelete={onDelete}
        onReplace={onReplace}
        onProcess={onProcess}
        onCopyUrl={copyUrl}
      />

      <RasterCropConfirmModal
        open={Boolean(cropRequest?.file)}
        file={cropRequest?.file || null}
        title={cropRequest?.title || "Crop image before upload"}
        confirmText="Confirm crop"
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </>
  );
}
