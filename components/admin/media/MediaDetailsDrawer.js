"use client";

import {
  Badge,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  List,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  SaveOutlined,
  SwapOutlined,
  SyncOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  GENERATED_SIZE_ORDER,
  dimensionsText,
  formatBytes,
  formatDate,
  isImage,
  publicMediaUrl,
} from "./mediaUtils";
import styles from "./AdminMediaLibrary.module.css";

export default function MediaDetailsDrawer({
  open,
  loading,
  item,
  form,
  saving,
  replacing,
  processingAction,
  replaceFileList,
  setReplaceFileList,
  onClose,
  onRefresh,
  onSave,
  onDelete,
  onReplace,
  onProcess,
  onCopyUrl,
}) {
  return (
    <Drawer
      title="Attachment details"
      placement="right"
      width={560}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onRefresh} icon={<ReloadOutlined />}>
            Refresh
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={onSave} loading={saving}>
            Save
          </Button>
        </Space>
      }
    >
      {loading || !item ? (
        <div className={styles.centerArea}>
          <Spin />
        </div>
      ) : (
        <>
          <div className={styles.drawerPreview}>
            {isImage(item) ? (
              <img
                src={item.url || item.originalUrl}
                alt={item.altText || item.alt || item.originalName}
                className={styles.drawerPreviewImage}
              />
            ) : (
              <FilePdfOutlined className={styles.drawerPdfIcon} />
            )}
          </div>

          <Descriptions column={1} size="small" bordered style={{ marginBottom: 12 }}>
            <Descriptions.Item label="File name">{item.originalName}</Descriptions.Item>
            <Descriptions.Item label="Dimensions">{dimensionsText(item)}</Descriptions.Item>
            <Descriptions.Item label="File size">{formatBytes(item.size)}</Descriptions.Item>
            <Descriptions.Item label="Upload date">{formatDate(item.createdAt)}</Descriptions.Item>
          </Descriptions>

          <Form form={form} layout="vertical">
            <Form.Item label="Title" name="title">
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item label="ALT text" name="alt">
              <Input.TextArea rows={2} maxLength={400} showCount />
            </Form.Item>
            <Form.Item label="Caption" name="caption">
              <Input.TextArea rows={2} maxLength={400} showCount />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={3} maxLength={1000} showCount />
            </Form.Item>
          </Form>

          <div className={styles.drawerActions}>
            <Space wrap>
              <Button icon={<CopyOutlined />} onClick={() => onCopyUrl(publicMediaUrl(item))}>
                Copy URL
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = item.originalUrl || item.url;
                  a.download = item.originalName || "download";
                  a.target = "_blank";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
              >
                Download original
              </Button>
            </Space>

            <Space wrap>
              <Upload
                beforeUpload={() => false}
                accept=".jpg,.jpeg,.png,.webp,.avif,.pdf"
                fileList={replaceFileList}
                onChange={({ fileList }) => setReplaceFileList(fileList.slice(-1))}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Choose replacement</Button>
              </Upload>
              <Button
                icon={<SwapOutlined />}
                loading={replacing}
                onClick={onReplace}
                disabled={!replaceFileList.length}
              >
                Replace image
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
                Delete image
              </Button>
            </Space>
          </div>

          <Divider />

          <Typography.Title level={5} style={{ margin: 0 }}>
            Optimization
          </Typography.Title>
          <Space wrap style={{ marginTop: 8, marginBottom: 8 }}>
            <Badge color="#1d9d4c" text={`Original: ${formatBytes(item.originalSize || item.size)}`} />
            <Badge color="#1677ff" text={`Optimized: ${formatBytes(item.optimizedSize || item.size)}`} />
            <Badge color="#722ed1" text={`Savings: ${Number(item.savingsPercentage || 0).toFixed(1)}%`} />
          </Space>
          <Space wrap style={{ marginBottom: 8 }}>
            <Tag color={item.webpUrl ? "green" : "default"}>WebP {item.webpUrl ? "available" : "missing"}</Tag>
            <Tag color={item.avifUrl ? "green" : "default"}>AVIF {item.avifUrl ? "available" : "missing"}</Tag>
          </Space>
          <Space wrap>
            <Button
              icon={<SyncOutlined />}
              onClick={() => onProcess("optimize")}
              loading={processingAction === "optimize"}
            >
              Re-optimize
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => onProcess("regenerate")}
              loading={processingAction === "regenerate"}
            >
              Regenerate sizes
            </Button>
            <Button
              icon={<SwapOutlined />}
              onClick={() => onProcess("convert")}
              loading={processingAction === "convert"}
              disabled={Boolean(item.webpUrl) && Boolean(item.avifUrl)}
            >
              Convert WebP / AVIF
            </Button>
          </Space>

          <Divider style={{ margin: "14px 0" }} />
          <Typography.Text strong>Generated sizes</Typography.Text>
          <List
            size="small"
            dataSource={GENERATED_SIZE_ORDER}
            renderItem={([key, label]) => {
              const size = item.generatedSizes?.[key] || {};
              const hasAny = Boolean(size.jpgUrl || size.webpUrl || size.avifUrl);
              return (
                <List.Item>
                  <div className={styles.sizeRow}>
                    <div>
                      <div className={styles.sizeName}>{label}</div>
                      <div className={styles.sizeMeta}>
                        {hasAny
                          ? `${size.width || 0} x ${size.height || 0} - ${formatBytes(size.size || 0)}`
                          : "Not generated"}
                      </div>
                    </div>
                    <Space size={4}>
                      <Tag color={size.jpgUrl ? "blue" : "default"}>JPG</Tag>
                      <Tag color={size.webpUrl ? "green" : "default"}>WebP</Tag>
                      <Tag color={size.avifUrl ? "purple" : "default"}>AVIF</Tag>
                    </Space>
                  </div>
                </List.Item>
              );
            }}
          />
        </>
      )}
    </Drawer>
  );
}
