import DocumentGuideSheet from "@/components/admin/documentation/DocumentGuideSheet";
import { getGuideById, ADMIN_MODULE_GUIDES } from "@/lib/documentation/adminGuidesData";

export function generateMetadata({ params }) {
  const guide = getGuideById(params?.module);
  return {
    title: `${guide?.documentTitle || guide?.title || "Guide"} | MESCO CMS Documentation`,
    description: guide?.summary || "MESCO Trust CMS Admin Documentation Guide",
  };
}

export default function DocumentModulePage({ params }) {
  return <DocumentGuideSheet moduleKey={params?.module} />;
}

