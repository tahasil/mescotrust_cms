import Link from "next/link";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import FormBuilderEditor from "@/components/admin/form-builder/FormBuilderEditor";

export default function AdminFormBuilderDetailPage({ params, searchParams }) {
  const formId = params?.formId;
  const readOnly = String(searchParams?.mode || "").toLowerCase() === "view";

  return (
    <ThemeAdminCard
      title={
        <>
          <Link href="/admin/form-builder" style={{ textDecoration: "none", marginRight: 8 }}>
            <Button icon={<ArrowLeftOutlined />} type="text" aria-label="Back to form builder" />
          </Link>
          <span>{readOnly ? "View Form" : "Edit Form"}</span>
        </>
      }
    >
      <FormBuilderEditor formId={formId} readOnly={readOnly} />
    </ThemeAdminCard>
  );
}

