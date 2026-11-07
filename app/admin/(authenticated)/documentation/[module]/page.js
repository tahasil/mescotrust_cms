import DocumentGuideSheet from "@/components/admin/documentation/DocumentGuideSheet";
import { getGuideById } from "@/lib/documentation/adminGuidesData";
import { plainGuideText } from "@/components/admin/documentation/guideText";

export function generateMetadata({ params }) {
  const guide = getGuideById(params?.module);
  return {
    title: `${guide?.title || "Guide"} | Documentation`,
    description: plainGuideText(guide?.summary) || "MESCO Trust admin guide",
  };
}

export default function DocumentModulePage({ params }) {
  return <DocumentGuideSheet moduleKey={params?.module} />;
}

