import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { canAccessFormBuilder } from "@/lib/formBuilder/permissions";
import { FormBuilderError } from "@/lib/formBuilder/errors";
import { createForm, listForms } from "@/lib/formBuilder/service";

function noStoreJson(payload, init = {}) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...(init.headers || {}),
    },
  });
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const data = await listForms({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      status: searchParams.get("status"),
      includeArchived: searchParams.get("includeArchived") !== "false",
    });
    return noStoreJson(data);
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to list forms" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canAccessFormBuilder(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const created = await createForm({
      name: body?.name,
      status: body?.status,
      actor: session.email || session.name || "",
    });
    return noStoreJson(created, { status: 201 });
  } catch (error) {
    if (error instanceof FormBuilderError) {
      return NextResponse.json(
        { error: error.message, details: error.details || undefined },
        { status: error.status || 400 },
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to create form" },
      { status: 500 },
    );
  }
}

