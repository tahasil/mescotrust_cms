import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import {
  canAccessFormBuilder,
  canDeleteFormBuilderData,
} from "@/lib/formBuilder/permissions";
import { FormBuilderError } from "@/lib/formBuilder/errors";
import { deleteForm, getFormBundle, updateFormMeta } from "@/lib/formBuilder/service";

function noStoreJson(payload, init = {}) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...(init.headers || {}),
    },
  });
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const data = await getFormBundle(params.formId);
    if (!data) return NextResponse.json({ error: "Form not found" }, { status: 404 });
    return noStoreJson(data);
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to load form" },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const data = await updateFormMeta(
      params.formId,
      { name: body?.name, status: body?.status },
      session.email || session.name || "",
    );
    return noStoreJson(data);
  } catch (error) {
    if (error instanceof FormBuilderError) {
      return NextResponse.json(
        { error: error.message, details: error.details || undefined },
        { status: error.status || 400 },
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to update form" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canDeleteFormBuilderData(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    await connectDB();
    const data = await deleteForm(params.formId);
    return noStoreJson(data);
  } catch (error) {
    if (error instanceof FormBuilderError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 400 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to delete form" },
      { status: 500 },
    );
  }
}

