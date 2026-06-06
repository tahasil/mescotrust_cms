import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import { canAccessFormBuilder } from "@/lib/forms/access";
import { validateLifecycleAction } from "@/lib/forms/lifecycle";

export async function POST(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    await connectDB();
    const form = await Form.findOne({ formId: params.formId });
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const transition = validateLifecycleAction(form.status, "publish");
    if (!transition.ok) return NextResponse.json({ error: transition.error }, { status: 400 });

    form.status = transition.nextStatus;
    form.updatedBy = String(session?.id || "");
    await form.save();

    return NextResponse.json({ formId: form.formId, status: form.status, updatedAt: form.updatedAt });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to publish form" }, { status: 500 });
  }
}

