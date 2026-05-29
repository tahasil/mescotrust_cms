import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import TeamCategory from "@/models/TeamCategory";
import { syncMemberSliderMapping, removeMemberFromSlider } from "@/lib/teamSliderMapping";
import { isTeamMemberMappingSupported } from "@/lib/teamSliderSupport";
import {
  normalizeMemberPayload,
  slugify,
  toText,
} from "@/lib/teamUtils";
import { ensureMailto, normalizeLinkTarget } from "@/lib/linkUtils";

export const dynamic = "force-dynamic";

function toMemberResponse(doc) {
  const source = doc && typeof doc === "object" ? doc : {};
  const rawCategory = source?.categoryId;
  const category =
    rawCategory && typeof rawCategory === "object"
      ? rawCategory
      : null;
  return {
    _id: String(source?._id || ""),
    name: toText(source?.name || source?.title),
    slug: toText(source?.slug),
    categoryId: category?._id ? String(category._id) : toText(rawCategory),
    categoryName: toText(category?.name),
    categorySlug: toText(category?.slug),
    designation: toText(source?.designation),
    image: toText(source?.image),
    bio: toText(source?.bio),
    socialLinks: Array.isArray(source?.socialLinks)
      ? source.socialLinks.map((entry) => ({
          platform: toText(entry?.platform),
          url: ensureMailto(entry?.url),
          target: normalizeLinkTarget(
            entry?.target ?? entry?.sourceTarget ?? entry?.openInNewTab,
            "_self",
          ),
          openInNewTab:
            normalizeLinkTarget(
              entry?.target ?? entry?.sourceTarget ?? entry?.openInNewTab,
              "_self",
            ) === "_blank",
        }))
      : [],
    features:
      source?.features && typeof source.features === "object"
        ? source.features
        : {},
    order: Number.isFinite(Number(source?.order)) ? Number(source.order) : 0,
    status: source?.status !== false,
  };
}

async function ensureUniqueSlug(baseSlug, ignoreId) {
  const root = slugify(baseSlug || "member");
  let candidate = root;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (
    await Team.findOne({
      slug: candidate,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    }).lean()
  ) {
    candidate = `${root}-${i}`;
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
      return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
    }

    const doc = await Team.findById(id)
      .populate("categoryId", "name slug isActive order")
      .lean();
    if (!doc) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    return NextResponse.json(toMemberResponse(doc));
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
      return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
    }

    const existing = await Team.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const body = await req.json();
    const normalized = normalizeMemberPayload(
      {
        ...existing,
        ...(body && typeof body === "object" ? body : {}),
      },
      { fallbackName: existing?.name || "Member" },
    );

    if (!normalized.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!normalized.categoryId) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(normalized.categoryId)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    const selectedSliderId = toText(normalized?.features?.mappedSliderComponentId);
    if (selectedSliderId && !isTeamMemberMappingSupported(selectedSliderId)) {
      return NextResponse.json(
        { error: "Selected slider does not support Team mapping" },
        { status: 400 },
      );
    }

    const category = await TeamCategory.findById(normalized.categoryId).lean();
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const desiredSlug = toText(body?.slug) || normalized.slug || existing.slug || normalized.name;
    const slug = await ensureUniqueSlug(desiredSlug, id);

    const saved = await Team.findByIdAndUpdate(
      id,
      { $set: { ...normalized, title: normalized.name, slug } },
      { new: true, runValidators: true },
    ).lean();
    if (!saved) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const previousSliderId = toText(
      existing?.features?.mappedSliderComponentId || existing?.mappedSliderComponentId,
    );
    await syncMemberSliderMapping({
      member: saved,
      previousSliderComponentId: previousSliderId,
      categoryName: toText(category?.name),
    });

    const populated = await Team.findById(saved._id)
      .populate("categoryId", "name slug isActive order")
      .lean();
    return NextResponse.json(toMemberResponse(populated));
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
      return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
    }
    const existing = await Team.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    const previousSliderId = toText(
      existing?.features?.mappedSliderComponentId || existing?.mappedSliderComponentId,
    );

    const deleted = await Team.softDeleteById(id, {
      deletedBy: session.email || session.id || "",
    });
    if (!deleted) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (previousSliderId) {
      await removeMemberFromSlider(previousSliderId, id);
    }
    return NextResponse.json({ ok: true, deleted: id, softDeleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
