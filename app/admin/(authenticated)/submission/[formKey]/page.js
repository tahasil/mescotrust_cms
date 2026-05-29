import { FormSubmissionsPage } from "@/components/admin/submissions";
import { redirect } from "next/navigation";
import { isContactSubmissionIdentifier } from "@/lib/contactSubmissionIdentifiers";

function decodeRouteParam(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const plusNormalized = raw.replace(/\+/g, " ");
  try {
    return decodeURIComponent(plusNormalized);
  } catch {
    return plusNormalized;
  }
}

export default function AdminFormSubmissionPage({ params }) {
  const identifier = decodeRouteParam(params?.formKey);
  if (isContactSubmissionIdentifier(identifier)) {
    redirect("/admin/contacts");
  }
  return <FormSubmissionsPage />;
}
