import { getDashboardData } from "@/lib/admin/dashboardData";
import CommonDashboard from "@/components/admin/dashboard/CommonDashboard";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return <CommonDashboard data={data} />;
}
