import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import TeamCategory from "@/models/TeamCategory";
import { normalizeCategoryPayload, slugify, toText } from "@/lib/teamUtils";

export const dynamic = "force-dynamic";

function toCategoryResponse(doc) {
  const source = doc && typeof doc === "object" ? doc : {};
  return {
    _id: String(source?._id || ""),
    name: toText(source?.name),
    slug: toText(source?.slug),
    description: toText(source?.description),
    order: Number.isFinite(Number(source?.order)) ? Number(source.order) : 0,
    isActive: source?.isActive !== false,
  };
}

async function getUniqueSlug(baseSlug, ignoreId) {
  const safeBase = slugify(baseSlug || "category");
  let candidate = safeBase;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (
    await TeamCategory.findOne({
      slug: candidate,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    }).lean()
  ) {
    candidate = `${safeBase}-${i}`;
    i += 1;
  }
  return candidate;
}

export async function GET(req, { params }) {
  const session = await requirePermission(req, "team.view");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const id = toText(params?.id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }
    const doc = await TeamCategory.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(toCategoryResponse(doc));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requirePermission(req, "team.edit");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const id = toText(params?.id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    const existing = await TeamCategory.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await req.json();
    const normalized = normalizeCategoryPayload(
      { ...existing, ...(body && typeof body === "object" ? body : {}) },
      { fallbackName: existing?.name || "Category" },
    );

    if (!normalized.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const slug = await getUniqueSlug(
      toText(body?.slug) || normalized.slug || existing.slug,
      id,
    );

    const updated = await TeamCategory.findByIdAndUpdate(
      id,
      { $set: { ...normalized, slug } },
      { new: true, runValidators: true },
    ).lean();
    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(toCategoryResponse(updated));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requirePermission(req, "team.delete");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const id = toText(params?.id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    const inUseCount = await Team.countDocuments({ categoryId: id });
    if (inUseCount > 0) {
      return NextResponse.json(
        { error: "This category has members. Move members before deleting." },
        { status: 400 },
      );
    }

    const deleted = await TeamCategory.softDeleteById(id, {
      deletedBy: session.email || session.id || "",
    });
    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deleted: id, softDeleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
