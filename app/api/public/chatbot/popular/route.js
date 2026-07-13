import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FaqNode from "@/models/FaqNode";
import { ChatbotError, errorPayload, getSettings, okPayload } from "@/lib/chatbot/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const settings = await getSettings({ bootstrap: true });
    const ids = Array.isArray(settings?.popularQuestionIds)
      ? settings.popularQuestionIds
          .map((id) => String(id || "").trim())
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
      : [];

    let items = [];
    if (ids.length > 0) {
      const docs = await FaqNode.find({ _id: { $in: ids }, status: "active" }).lean();
      const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
      items = ids.map((id) => byId.get(id)).filter(Boolean);
    } else {
      items = await FaqNode.find({ status: "active" })
        .sort({ popularityScore: -1, sortOrder: 1, question: 1 })
        .limit(6)
        .lean();
    }

    return NextResponse.json(okPayload(items));
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}
