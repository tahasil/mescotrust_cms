import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";

const DEFAULT_COMPONENTS = [
  { name: "Paragraph", displayName: "Paragraph", type: "system", category: "Content", baseComponent: "Paragraph", propsSchema: [{ key: "text", type: "text", label: "Text" }], defaultProps: { text: "" } },
  { name: "Heading", displayName: "Heading", type: "system", category: "Content", baseComponent: "Heading", propsSchema: [{ key: "level", type: "number", label: "Level (1-6)" }, { key: "text", type: "text", label: "Text" }], defaultProps: { level: 2, text: "" } },
  { name: "Image", displayName: "Image", type: "system", category: "Media", baseComponent: "Image", propsSchema: [{ key: "src", type: "url", label: "Image URL" }, { key: "alt", type: "text", label: "Alt text" }], defaultProps: { src: "", alt: "" } },
];

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const created = [];
    for (const comp of DEFAULT_COMPONENTS) {
      const existing = await Component.findOne({ baseComponent: comp.baseComponent });
      if (!existing) {
        await Component.create(comp);
        created.push(comp.baseComponent);
      }
    }
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
