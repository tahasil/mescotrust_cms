import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import FormModel from "@/models/Form";
import FormEmbed from "@/components/site/FormEmbed/FormEmbed";
import { FullWidthBackground, PageContainer } from "@/styles/Theme";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const slug = params?.slug ? String(params.slug).trim() : "";
  if (!slug) return { title: "Form" };

  try {
    await connectDB();
    const form = await FormModel.findOne({
      $or: [
        { formId: slug },
        { shortcode: slug.toLowerCase() },
        { "settings.publicSlug": slug.toLowerCase() },
      ],
      status: { $ne: "archived" },
    }).lean();

    if (!form) return { title: "Form Not Found" };

    return {
      title: `${form.name || "Form"} | MESCO Trust`,
      description: form.description || form.submissionSettings?.confirmationMessage || "Online application and submission form",
    };
  } catch {
    return { title: "Form | MESCO Trust" };
  }
}

export default async function StandaloneFormPage({ params }) {
  const slug = params?.slug ? String(params.slug).trim() : "";
  if (!slug) notFound();

  await connectDB();
  const form = await FormModel.findOne({
    $or: [
      { formId: slug },
      { shortcode: slug.toLowerCase() },
      { "settings.publicSlug": slug.toLowerCase() },
    ],
    status: { $ne: "archived" },
  }).lean();

  if (!form) notFound();

  return (
    <FullWidthBackground className="defaultBackground">
      <PageContainer style={{ paddingTop: "clamp(32px, 5vw, 64px)", paddingBottom: "clamp(48px, 6vw, 84px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FormEmbed formId={form.formId} />
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
