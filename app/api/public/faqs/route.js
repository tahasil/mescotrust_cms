import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Faq from "@/models/Faq";
import { DEFAULT_FAQS, DEFAULT_FAQ_CATEGORIES } from "@/lib/faqDefaults";

export const dynamic = "force-dynamic";

async function ensureDefaultFaqs() {
  const count = await Faq.countDocuments();
  if (count === 0) {
    try {
      await Faq.insertMany(DEFAULT_FAQS, { ordered: false });
    } catch (err) {
      console.error("[public/faqs] Error inserting default FAQs:", err);
    }
  }
}

export async function GET(req) {
  try {
    await connectDB();
    await ensureDefaultFaqs();

    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") || "").trim();
    const search = (searchParams.get("search") || "").trim();
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const query = { status: "published" };

    if (category && category.toLowerCase() !== "all") {
      query.category = { $regex: `^${category}$`, $options: "i" };
    }

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { answer: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const [faqs, distinctCategories] = await Promise.all([
      Faq.find(query)
        .sort({ order: 1, createdAt: 1 })
        .limit(Math.min(limit, 200))
        .select("question answer category order tags isFeatured createdAt")
        .lean(),
      Faq.distinct("category", { status: "published" }),
    ]);

    const activeCategories = Array.from(
      new Set([...distinctCategories, ...DEFAULT_FAQ_CATEGORIES].filter(Boolean))
    );

    return NextResponse.json({
      faqs: faqs.map((f) => ({
        _id: String(f._id),
        question: f.question,
        answer: f.answer,
        category: f.category,
        order: f.order,
        tags: f.tags || [],
        isFeatured: Boolean(f.isFeatured),
      })),
      categories: activeCategories,
      total: faqs.length,
    });
  } catch (error) {
    console.error("[api/public/faqs] GET error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch FAQs", faqs: [], categories: [] },
      { status: 500 }
    );
  }
}

