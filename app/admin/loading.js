import AdminPageSkeleton from "@/components/admin/loading/AdminLoading";

/**
 * Root-level admin loading boundary.
 *
 * Covers `/admin`, `/admin/login` and `/admin/forbidden` so those screens
 * share the exact same loader as the authenticated admin pages instead of
 * showing a different (or no) placeholder during navigation.
 */
export default function AdminRootLoading() {
  return <AdminPageSkeleton title={false} toolbar={false} rows={4} columns={2} />;
}