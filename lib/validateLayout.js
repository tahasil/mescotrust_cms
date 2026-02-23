import { connectDB } from "@/lib/db";
import Component from "@/models/Component";

export async function validateLayoutProps(layout) {
  const errors = [];
  if (!Array.isArray(layout) || layout.length === 0) return errors;

  await connectDB();
  const components = await Component.find({ active: true }).lean();
  const compMap = {};
  for (const c of components) compMap[c.baseComponent] = c;

  for (const block of layout) {
    const comp = compMap[block.baseComponent];
    if (!comp?.propsSchema?.length) continue;

    const label = block.instanceId
      ? `Block "${block.baseComponent}" (${block.instanceId})`
      : `Block "${block.baseComponent}"`;

    for (const field of comp.propsSchema) {
      const val = block.props?.[field.key];
      if (field.required && (val === undefined || val === "")) {
        errors.push(`${label}: "${field.label || field.key}" is required`);
      }
      if (field.maxLength && typeof val === "string" && val.length > field.maxLength) {
        errors.push(`${label}: "${field.label || field.key}" exceeds max length ${field.maxLength}`);
      }
    }
  }
  return errors;
}
