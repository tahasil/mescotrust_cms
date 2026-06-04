import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin } from "@/lib/permissions";
import {
  getAdminAiChatbotConfig,
  saveAiChatbotSettings,
} from "@/lib/aiChatbotService";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return { "Cache-Control": "no-store, no-cache, must-revalidate" };
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const payload = await getAdminAiChatbotConfig();
    return NextResponse.json(payload, { headers: noStoreHeaders() });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to load AI chatbot settings" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    await saveAiChatbotSettings(body || {}, session?.email || "");
    const payload = await getAdminAiChatbotConfig();
    revalidatePath("/", "layout");
    return NextResponse.json(payload, { headers: noStoreHeaders() });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to save AI chatbot settings" },
      { status: 500 },
    );
  }
}
