import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { sanitizeHtml, sanitizePlainText } from "@/lib/security/sanitize";
import Faq from "@/models/Faq";
import { DEFAULT_FAQS, DEFAULT_FAQ_CATEGORIES } from "@/lib/faqDefaults";

export const dynamic = "force-dynamic";

async function ensureDefaultFaqs() {
  const count = await Faq.countDocuments();
  if (count === 0) {
    try {
      await Faq.insertMany(DEFAULT_FAQS, { ordered: false });
    } catch (err) {
      console.error("[faqs] Error inserting default FAQs:", err);
    }
  }
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureDefaultFaqs();

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const query = {};

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { answer: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      query.category = { $regex: `^${category}$`, $options: "i" };
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const [faqs, total, distinctCategories] = await Promise.all([
      Faq.find(query)
        .sort({ category: 1, order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Faq.countDocuments(query),
      Faq.distinct("category"),
    ]);

    // Merge distinct categories with defaults so admin always has complete options
    const allCategories = Array.from(
      new Set([...DEFAULT_FAQ_CATEGORIES, ...(distinctCategories || [])].filter(Boolean))
    ).sort();

    return NextResponse.json({
      faqs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      categories: allCategories,
    });
  } catch (error) {
    console.error("[api/admin/faqs] GET error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const body = await req.json();

    const question = sanitizePlainText(body.question);
    const answer = sanitizeHtml(String(body.answer || "").trim());
    const category = sanitizePlainText(body.category) || "General";
    const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;
    const status = ["published", "draft", "archived"].includes(body.status)
      ? body.status
      : "published";
    const tags = Array.isArray(body.tags)
      ? body.tags.map((t) => sanitizePlainText(t)).filter(Boolean)
      : [];
    const isFeatured = Boolean(body.isFeatured);

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!answer) {
      return NextResponse.json(
        { error: "Answer is required" },
        { status: 400 }
      );
    }

    const newFaq = await Faq.create({
      question,
      answer,
      category: category || "General",
      order,
      status,
      tags,
      isFeatured,
    });

    return NextResponse.json(
      { faq: newFaq, message: "FAQ created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/admin/faqs] POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create FAQ" },
      { status: 500 }
    );
  }
}

