import FormRenderer from "@/components/forms/FormRenderer";

/**
 * Page-builder block to render a dynamic form by immutable `formId` or shortcode.
 * Stored block props should keep only references (no duplicated schema).
 */
export default function FormEmbedBlock({ formId = "", shortcode = "", source = "FormEmbed" }) {
  if (!formId && !shortcode) return null;
  return <FormRenderer formId={formId} shortcode={shortcode} source={source} />;
}

