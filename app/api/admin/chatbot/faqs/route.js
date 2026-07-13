import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin, isEditor } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import FaqNode from "@/models/FaqNode";
import {
  ChatbotError,
  createFaqNode,
  ensureChatbotBootstrap,
  errorPayload,
  okPayload,
} from "@/lib/chatbot/service";

export const dynamic = "force-dynamic";

function canManageFaq(session) {
  return isAdmin(session) || isEditor(session);
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canManageFaq(session)) {
    return NextResponse.json(errorPayload("FORBIDDEN", "Forbidden"), { status: 403 });
  }

  try {
    await connectDB();
    await ensureChatbotBootstrap();

    const { searchParams } = new URL(req.url);
    const parentIdParam = searchParams.get("parentId");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") || 100)));

    const query = {};
    if (!includeInactive) query.status = "active";
    if (parentIdParam != null && parentIdParam !== "") {
      if (parentIdParam === "null" || parentIdParam === "root") {
        query.parentId = null;
      } else if (mongoose.Types.ObjectId.isValid(parentIdParam)) {
        query.parentId = new mongoose.Types.ObjectId(parentIdParam);
      } else {
        return NextResponse.json(errorPayload("VALIDATION_ERROR", "Invalid parentId"), {
          status: 400,
        });
      }
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      FaqNode.find(query)
        .sort({ parentId: 1, sortOrder: 1, question: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FaqNode.countDocuments(query),
    ]);

    return NextResponse.json(
      okPayload({
        items,
        total,
        page,
        limit,
      }),
    );
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canManageFaq(session)) {
    return NextResponse.json(errorPayload("FORBIDDEN", "Forbidden"), { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const created = await createFaqNode(body);
    return NextResponse.json(okPayload(created), { status: 201 });
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    if (String(err?.message || "").toLowerCase().includes("duplicate key")) {
      return NextResponse.json(errorPayload("SLUG_NOT_UNIQUE", "Slug must be unique"), {
        status: 409,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}
