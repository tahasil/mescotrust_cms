import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Faq from "@/models/Faq";
import { DEFAULT_FAQS } from "@/lib/faqDefaults";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "append"; // "append" or "reset"

    if (mode === "reset") {
      await Faq.deleteMany({});
      await Faq.insertMany(DEFAULT_FAQS);
      return NextResponse.json({
        message: "All FAQs reset to default requirements (12 FAQs)",
        count: DEFAULT_FAQS.length,
      });
    }

    // Append mode: insert only missing default FAQs by question
    let insertedCount = 0;
    for (const item of DEFAULT_FAQS) {
      const exists = await Faq.findOne({
        question: { $regex: `^${item.question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      });
      if (!exists) {
        await Faq.create(item);
        insertedCount += 1;
      }
    }

    const totalCount = await Faq.countDocuments();
    return NextResponse.json({
      message: `Default FAQs checked. Inserted ${insertedCount} missing item(s). Total: ${totalCount}`,
      insertedCount,
      totalCount,
    });
  } catch (error) {
    console.error("[api/admin/faqs/seed] POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to seed default FAQs" },
      { status: 500 }
    );
  }
}

