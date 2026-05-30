import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { canAccessFormBuilder } from "@/lib/formBuilder/permissions";
import { FormBuilderError } from "@/lib/formBuilder/errors";
import { saveFormSchema } from "@/lib/formBuilder/service";

function noStoreJson(payload, init = {}) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...(init.headers || {}),
    },
  });
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
    const data = await saveFormSchema(
      params.formId,
      {
        name: body?.name,
        status: body?.status,
        fields: body?.fields,
        configuration: body?.configuration,
      },
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
      { error: error?.message || "Failed to save form schema" },
      { status: 500 },
    );
  }
}

