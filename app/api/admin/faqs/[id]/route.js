import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { sanitizeHtml, sanitizePlainText } from "@/lib/security/sanitize";
import Faq from "@/models/Faq";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const { id } = params;
  try {
    await connectDB();
    const faq = await Faq.findById(id).lean();
    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }
    return NextResponse.json({ faq });
  } catch (error) {
    console.error(`[api/admin/faqs/${id}] GET error:`, error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch FAQ" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const { id } = params;
  try {
    await connectDB();
    const body = await req.json();

    const faq = await Faq.findById(id);
    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    if (body.question !== undefined) {
      const q = sanitizePlainText(body.question);
      if (!q) {
        return NextResponse.json(
          { error: "Question cannot be empty" },
          { status: 400 }
        );
      }
      faq.question = q;
    }

    if (body.answer !== undefined) {
      const a = sanitizeHtml(String(body.answer || "").trim());
      if (!a) {
        return NextResponse.json(
          { error: "Answer cannot be empty" },
          { status: 400 }
        );
      }
      faq.answer = a;
    }

    if (body.category !== undefined) {
      faq.category = sanitizePlainText(body.category) || "General";
    }

    if (body.order !== undefined) {
      const ord = Number(body.order);
      if (Number.isFinite(ord)) faq.order = ord;
    }

    if (body.status !== undefined) {
      if (["published", "draft", "archived"].includes(body.status)) {
        faq.status = body.status;
      }
    }

    if (body.tags !== undefined && Array.isArray(body.tags)) {
      faq.tags = body.tags.map((t) => sanitizePlainText(t)).filter(Boolean);
    }

    if (body.isFeatured !== undefined) {
      faq.isFeatured = Boolean(body.isFeatured);
    }

    await faq.save();

    return NextResponse.json({
      faq,
      message: "FAQ updated successfully",
    });
  } catch (error) {
    console.error(`[api/admin/faqs/${id}] PUT error:`, error);
    return NextResponse.json(
      { error: error?.message || "Failed to update FAQ" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const { id } = params;
  try {
    await connectDB();
    const deleted = await Faq.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }
    return NextResponse.json({
      message: "FAQ deleted successfully",
      id,
    });
  } catch (error) {
    console.error(`[api/admin/faqs/${id}] DELETE error:`, error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete FAQ" },
      { status: 500 }
    );
  }
}

