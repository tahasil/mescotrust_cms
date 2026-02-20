import { connectDB } from "@/lib/db";
import { Component } from "@/models";

type Section = { id: string; component: string; props?: Record<string, unknown> };

export async function validatePageContent(contentJSON: string): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  let data: { sections?: Section[] };
  try {
    data = JSON.parse(contentJSON || "{}");
  } catch {
    return { valid: false, errors: ["Invalid JSON"] };
  }
  await connectDB();
  const sections = data.sections ?? [];
  const components = await Component.find({ isActive: true }).select("name slug schemaJSON").lean();
  const byName = new Map(components.map((c) => [c.name, c]));
  const bySlug = new Map(components.map((c) => [c.slug, c]));

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const comp = byName.get(s.component) ?? bySlug.get(s.component);
    if (!comp) {
      errors.push(`Section ${i + 1}: unknown or inactive component "${s.component}"`);
      continue;
    }
    try {
      const schema = JSON.parse((comp as { schemaJSON?: string }).schemaJSON || "[]") as { key: string; required?: boolean }[];
      const props = s.props ?? {};
      for (const field of schema) {
        if (field.required && (props[field.key] === undefined || props[field.key] === "")) {
          errors.push(`Section ${i + 1} (${s.component}): missing required "${field.key}"`);
        }
      }
    } catch {
      // skip schema validation if schema invalid
    }
  }
  return { valid: errors.length === 0, errors };
}
