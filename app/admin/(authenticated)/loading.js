import AdminPageSkeleton from "@/components/admin/loading/AdminLoading";

/**
 * Single admin route loader.
 *
 * Previously this rendered a bare full-screen ring spinner, which looked
 * different from the skeleton used by Social Wall / Chatbot and from the
 * antd spin indicators inside admin tables. It now renders the shared
 * skeleton from `components/admin/loading/AdminLoading.js`, so every admin
 * page shows the same loader and it follows Admin Settings → Admin Loader.
 */
export default function AdminLoading() {
  return <AdminPageSkeleton />;
}
