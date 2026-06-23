import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/admin/dashboardData";
import CommonDashboard from "@/components/admin/dashboard/CommonDashboard";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || "";
  const data = await getDashboardData(userRole);

  return <CommonDashboard data={data} />;
}
