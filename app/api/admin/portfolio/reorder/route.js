import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import PortfolioItem from "@/models/Portfolio";

function toId(value) {
  return String(value || "").trim();
}

export async function POST(req) {
  const session = await requirePermission(req, "portfolio.manage");
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json().catch(() => ({}));
    const categoryId = toId(body?.categoryId);
    const orderedIdsRaw = Array.isArray(body?.orderedIds) ? body.orderedIds : [];
    const orderedIds = orderedIdsRaw.map(toId).filter(Boolean);

    if (orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds is required" }, { status: 400 });
    }

    const unique = new Set(orderedIds);
    if (unique.size !== orderedIds.length) {
      return NextResponse.json({ error: "orderedIds contains duplicates" }, { status: 400 });
    }

    if (!orderedIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return NextResponse.json({ error: "orderedIds contains invalid ids" }, { status: 400 });
    }

    const hasCategoryScope = categoryId.length > 0;
    if (hasCategoryScope && !mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    await connectDB();

    if (hasCategoryScope) {
      const [existingInCategoryCount, categoryItemCount] = await Promise.all([
        PortfolioItem.countDocuments({
          _id: { $in: orderedIds },
          categoryId,
        }),
        PortfolioItem.countDocuments({ categoryId }),
      ]);

      if (existingInCategoryCount !== orderedIds.length) {
        return NextResponse.json(
          { error: "One or more portfolio items do not belong to the selected category" },
          { status: 400 },
        );
      }
      if (categoryItemCount !== orderedIds.length) {
        return NextResponse.json(
          { error: "orderedIds must include all items in the selected category" },
          { status: 400 },
        );
      }
    } else {
      const existingCount = await PortfolioItem.countDocuments({
        _id: { $in: orderedIds },
      });
      if (existingCount !== orderedIds.length) {
        return NextResponse.json({ error: "One or more portfolio items not found" }, { status: 404 });
      }
    }

    const operations = orderedIds.map((id, index) => ({
      updateOne: {
        filter: hasCategoryScope ? { _id: id, categoryId } : { _id: id },
        update: { $set: { order: index } },
      },
    }));

    if (operations.length > 0) {
      await PortfolioItem.bulkWrite(operations);
    }

    return NextResponse.json({
      ok: true,
      updated: operations.length,
      categoryId: hasCategoryScope ? categoryId : undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
