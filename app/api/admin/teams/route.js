import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import TeamCategory from "@/models/TeamCategory";
import { syncMemberSliderMapping } from "@/lib/teamSliderMapping";
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

async function getUniqueSlug(baseSlug, ignoreId) {
  const safeBase = slugify(baseSlug || "member");
  let candidate = safeBase;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (
    await Team.findOne({
      slug: candidate,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    }).lean()
  ) {
    candidate = `${safeBase}-${i}`;
    i += 1;
  }
  return candidate;
}

export async function GET(req) {
  const session = await requirePermission(req, "team.view");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = toText(searchParams.get("q")).toLowerCase();
    const categoryId = toText(searchParams.get("categoryId"));
    const status = toText(searchParams.get("status"));

    const query = {
      name: { $exists: true, $ne: "" },
    };

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.categoryId = categoryId;
    }
    if (status === "active") query.status = true;
    if (status === "inactive") query.status = false;

    const [docs, categories] = await Promise.all([
      Team.find(query)
        .populate("categoryId", "name slug isActive order")
        .sort({ order: 1, createdAt: -1 })
        .lean(),
      TeamCategory.find({})
        .sort({ order: 1, name: 1 })
        .lean(),
    ]);

    const items = docs
      .map(toMemberResponse)
      .filter((item) => {
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.designation.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q)
        );
      });

    return NextResponse.json({
      items,
      categories: categories.map((category) => ({
        _id: String(category._id),
        name: toText(category.name),
        slug: toText(category.slug),
        description: toText(category.description),
        order: Number.isFinite(Number(category.order)) ? Number(category.order) : 0,
        isActive: category.isActive !== false,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requirePermission(req, "team.create");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const body = await req.json();
    const normalized = normalizeMemberPayload(body || {}, {
      fallbackName: "Member",
    });
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

    const slug = await getUniqueSlug(normalized.slug || normalized.name);
    const created = await Team.create({
      ...normalized,
      title: normalized.name,
      slug,
    });

    await syncMemberSliderMapping({
      member: created,
      categoryName: toText(category?.name),
    });

    const out = await Team.findById(created._id)
      .populate("categoryId", "name slug isActive order")
      .lean();

    return NextResponse.json(
      toMemberResponse(out),
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
