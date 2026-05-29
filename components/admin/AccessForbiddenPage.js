"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowLeftOutlined,
  HomeOutlined,
  LockOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Button, Descriptions, Result, Space, Tag, Typography } from "antd";
import { ThemeAdminCard } from "@/styles/Theme";
import { roleLabelFromKey } from "@/lib/rbac/constants";

function toLabel(value, fallback) {
  const v = String(value || "").trim();
  return v || fallback;
}

export default function AccessForbiddenPage({
  currentRole = "",
  currentRoleKey = "",
  requiredRole = "",
  requiredPermission = "",
  requestedPath = "",
}) {
  const router = useRouter();
  const currentRoleLabel = toLabel(currentRole, roleLabelFromKey(currentRoleKey || currentRole) || "Unknown");
  const requiredRoleLabel = toLabel(requiredRole, "Admin");
  const requiredPermissionLabel = toLabel(requiredPermission, "");
  const attemptedPath = String(requestedPath || "").startsWith("/")
    ? String(requestedPath)
    : "";

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/admin");
  };

  return (
    <ThemeAdminCard>
      <Result
        status="403"
        icon={<LockOutlined style={{ color: "#ff4d4f" }} />}
        title="Access Forbidden"
        subTitle="You do not have permission to access this page."
        extra={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
              Go Back
            </Button>
            <Link href="/admin">
              <Button type="primary" icon={<HomeOutlined />}>
                Go to Dashboard
              </Button>
            </Link>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
            >
              Logout
            </Button>
          </Space>
        }
      />

      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Typography.Title level={5} style={{ marginBottom: 12 }}>
          Access details
        </Typography.Title>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Current user role">
            <Tag color={currentRoleLabel === "Admin" ? "blue" : "gold"}>
              {currentRoleLabel}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Required access level">
            <Tag color="red">{requiredRoleLabel}</Tag>
          </Descriptions.Item>
          {requiredPermissionLabel && (
            <Descriptions.Item label="Required permission">
              <Typography.Text code>{requiredPermissionLabel}</Typography.Text>
            </Descriptions.Item>
          )}
          {attemptedPath && (
            <Descriptions.Item label="Attempted route">
              <Typography.Text code>{attemptedPath}</Typography.Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    </ThemeAdminCard>
  );
}
