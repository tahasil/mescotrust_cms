import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/admin/dashboardData";
import CommonDashboard from "@/components/admin/dashboard/CommonDashboard";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const permissionKeys = Array.isArray(session?.user?.permissionKeys)
    ? session.user.permissionKeys
    : [];
  const data = await getDashboardData(permissionKeys);

  return <CommonDashboard data={data} />;
}
