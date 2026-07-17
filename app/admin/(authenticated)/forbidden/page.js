import Link from "next/link";
import { Alert, Button } from "antd";
import { ThemeAdminCard } from "@/styles/Theme";

export const metadata = { title: "Access denied" };

export default function AdminForbiddenPage({ searchParams }) {
  const requiredPermission = String(searchParams?.requiredPermission || "").trim();
  return (
    <ThemeAdminCard title="Access denied">
      <Alert
        type="warning"
        showIcon
        message="You do not have permission to open this admin page."
        description={requiredPermission ? `Required permission: ${requiredPermission}` : undefined}
        style={{ marginBottom: 16 }}
      />
      <Link href="/admin">
        <Button type="primary">Back to dashboard</Button>
      </Link>
    </ThemeAdminCard>
  );
}
