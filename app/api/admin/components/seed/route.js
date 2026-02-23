import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import systemComponentsLib from "@/lib/systemComponents";
const { SYSTEM_COMPONENTS } = systemComponentsLib;

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const created = [];
    for (const comp of SYSTEM_COMPONENTS) {
      const existing = await Component.findOne({ baseComponent: comp.baseComponent, type: "system" });
      if (!existing) {
        await Component.create({
          ...comp,
          layout: [],
          container: "container",
          active: true,
        });
        created.push(comp.baseComponent);
      }
    }
    return NextResponse.json({ ok: true, created, total: SYSTEM_COMPONENTS.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
