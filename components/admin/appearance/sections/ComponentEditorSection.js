"use client";

import { useRef, useState } from "react";
import { CheckOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Drawer, Grid, Space, Typography, message } from "antd";

const { useBreakpoint } = Grid;

export default function ComponentEditorSection({
  title,
  description,
  EditFormComponent,
  themeColorOptions = [],
  onSaved,
}) {
  const editorRef = useRef(null);
  const screens = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const updateFn = editorRef.current?.update;
      if (typeof updateFn !== "function") {
        message.error("Editor is not ready yet");
        return;
      }
      await Promise.resolve(updateFn());
    } catch {
      // Edit form already handles error notification.
    } finally {
      setUpdating(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setUpdating(false);
  };

  return (
    <>
      <div
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: 10,
          padding: 16,
          background: "#fff",
        }}
      >
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {title} Editor
          </Typography.Title>
          {description ? (
            <Typography.Text type="secondary">{description}</Typography.Text>
          ) : null}
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setDrawerOpen(true)}
            style={{ alignSelf: "flex-start" }}
          >
            Open {title} Editor
          </Button>
        </Space>
      </div>

      <Drawer
        title={`Edit ${title}`}
        placement="right"
        width={screens.md ? 560 : "100%"}
        open={drawerOpen}
        onClose={closeDrawer}
        extra={
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={updating}
            disabled={updating}
            onClick={handleUpdate}
          >
            Update
          </Button>
        }
      >
        {EditFormComponent ? (
          <EditFormComponent
            ref={editorRef}
            themeColorOptions={themeColorOptions}
            onSuccess={(payload) => {
              closeDrawer();
              onSaved?.(payload);
            }}
            onCancel={closeDrawer}
          />
        ) : (
          <Typography.Text type="secondary">
            Editor component not available.
          </Typography.Text>
        )}
      </Drawer>
    </>
  );
}

