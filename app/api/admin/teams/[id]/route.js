import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import { validateCommitteeMembersImages } from "@/lib/committeeMembersImageValidation";

export const dynamic = "force-dynamic";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "team";
}

async function findTeamByIdOrShortcode(idOrCode) {
  const query = mongoose.Types.ObjectId.isValid(idOrCode)
    ? { _id: idOrCode }
    : { shortcode: String(idOrCode).toLowerCase() };
  return Team.findOne(query);
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await findTeamByIdOrShortcode(id);
    if (!doc) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const team = doc.toObject();
    if (Array.isArray(team.members)) {
      team.members.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    }

    return NextResponse.json(team);
  } catch (err) {
    console.error("[Team API GET Detail error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load team" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await findTeamByIdOrShortcode(id);
    if (!doc) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const body = await req.json();
    const rawMembers = Array.isArray(body?.members) ? body.members : [];
    const members = rawMembers.map((m, idx) => ({
      _id: m?._id || new mongoose.Types.ObjectId(),
      name: String(m?.name || "").trim(),
      qualification: String(m?.qualification || "").trim(),
      title: String(m?.title || "").trim(),
      imageDesktop: String(m?.imageDesktop || m?.image || "").trim(),
      imageMobile: String(m?.imageMobile || "").trim(),
      image: String(m?.imageDesktop || m?.image || "").trim(),
      bio: String(m?.bio || "").trim(),
      order: m?.order != null ? Number(m.order) : idx + 1,
    })).filter((m) => m.name);

    if (members.length > 0) {
      const validationErrors = await validateCommitteeMembersImages({ members });
      if (validationErrors.length > 0) {
        return NextResponse.json({ error: validationErrors[0] }, { status: 400 });
      }
    }

    if (body.name) doc.name = String(body.name).trim();
    if (body.shortcode) {
      const newShortcode = slugify(body.shortcode);
      const existing = await Team.findOne({
        shortcode: newShortcode,
        _id: { $ne: doc._id },
      }).lean();
      if (existing) {
        return NextResponse.json(
          { error: `Shortcode "${newShortcode}" is already in use by another team` },
          { status: 400 },
        );
      }
      doc.shortcode = newShortcode;
    }
    if (body.description !== undefined) doc.description = String(body.description).trim();
    if (body.status !== undefined) doc.status = body.status;
    if (body.order !== undefined) doc.order = Number(body.order) || 0;

    // Title & colors
    if (body.subTitle !== undefined) doc.subTitle = String(body.subTitle).trim();
    if (body.mainTitle !== undefined) doc.mainTitle = String(body.mainTitle).trim();
    if (body.subTitleColorKey !== undefined) doc.subTitleColorKey = String(body.subTitleColorKey).trim();
    if (body.titleColorKey !== undefined) doc.titleColorKey = String(body.titleColorKey).trim();
    if (body.titleHighlightColorKey !== undefined) doc.titleHighlightColorKey = String(body.titleHighlightColorKey).trim();
    if (body.cardTitleColorKey !== undefined) doc.cardTitleColorKey = String(body.cardTitleColorKey).trim();
    if (body.cardDescriptionColorKey !== undefined) doc.cardDescriptionColorKey = String(body.cardDescriptionColorKey).trim();
    if (body.buttonBgColorKey !== undefined) doc.buttonBgColorKey = String(body.buttonBgColorKey).trim();
    if (body.buttonTextColorKey !== undefined) doc.buttonTextColorKey = String(body.buttonTextColorKey).trim();
    if (body.buttonBorderColorKey !== undefined) doc.buttonBorderColorKey = String(body.buttonBorderColorKey).trim();
    if (body.buttonHoverBgColorKey !== undefined) doc.buttonHoverBgColorKey = String(body.buttonHoverBgColorKey).trim();
    if (body.buttonHoverTextColorKey !== undefined) doc.buttonHoverTextColorKey = String(body.buttonHoverTextColorKey).trim();
    if (body.buttonHoverBorderColorKey !== undefined) doc.buttonHoverBorderColorKey = String(body.buttonHoverBorderColorKey).trim();
    if (body.modalBgColorKey !== undefined) doc.modalBgColorKey = String(body.modalBgColorKey).trim();
    if (body.modalNameColorKey !== undefined) doc.modalNameColorKey = String(body.modalNameColorKey).trim();
    if (body.modalQualificationColorKey !== undefined) doc.modalQualificationColorKey = String(body.modalQualificationColorKey).trim();
    if (body.modalRoleColorKey !== undefined) doc.modalRoleColorKey = String(body.modalRoleColorKey).trim();
    if (body.modalBioColorKey !== undefined) doc.modalBioColorKey = String(body.modalBioColorKey).trim();
    if (body.modalDividerColorKey !== undefined) doc.modalDividerColorKey = String(body.modalDividerColorKey).trim();
    if (body.modalImageBorderColorKey !== undefined) doc.modalImageBorderColorKey = String(body.modalImageBorderColorKey).trim();

    // Manage section
    if (body.sectionBgType !== undefined) doc.sectionBgType = body.sectionBgType;
    if (body.sectionBgImage !== undefined) doc.sectionBgImage = body.sectionBgImage;
    if (body.sectionBgColorKey !== undefined) doc.sectionBgColorKey = body.sectionBgColorKey;
    if (body.sectionPaddingTop !== undefined) doc.sectionPaddingTop = body.sectionPaddingTop;
    if (body.sectionPaddingBottom !== undefined) doc.sectionPaddingBottom = body.sectionPaddingBottom;
    if (body.sectionMarginTop !== undefined) doc.sectionMarginTop = body.sectionMarginTop;
    if (body.sectionMarginBottom !== undefined) doc.sectionMarginBottom = body.sectionMarginBottom;

    if (body.pageContainerBgType !== undefined) doc.pageContainerBgType = body.pageContainerBgType;
    if (body.pageContainerBgImage !== undefined) doc.pageContainerBgImage = body.pageContainerBgImage;
    if (body.pageContainerBgColorKey !== undefined) doc.pageContainerBgColorKey = body.pageContainerBgColorKey;
    if (body.containerPaddingTop !== undefined) doc.containerPaddingTop = body.containerPaddingTop;
    if (body.containerPaddingRight !== undefined) doc.containerPaddingRight = body.containerPaddingRight;
    if (body.containerPaddingBottom !== undefined) doc.containerPaddingBottom = body.containerPaddingBottom;
    if (body.containerPaddingLeft !== undefined) doc.containerPaddingLeft = body.containerPaddingLeft;
    if (body.containerMarginTop !== undefined) doc.containerMarginTop = body.containerMarginTop;
    if (body.containerMarginBottom !== undefined) doc.containerMarginBottom = body.containerMarginBottom;

    doc.members = members;
    doc.updatedBy = String(session?.id || "");
    doc.markModified("members");

    await doc.save();

    return NextResponse.json(doc.toObject());
  } catch (err) {
    console.error("[Team API PUT Detail error]:", err);
    return NextResponse.json({ error: err.message || "Failed to update team" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await findTeamByIdOrShortcode(id);
    if (!doc) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    await Team.deleteOne({ _id: doc._id });
    return NextResponse.json({ success: true, message: "Team deleted successfully" });
  } catch (err) {
    console.error("[Team API DELETE Detail error]:", err);
    return NextResponse.json({ error: err.message || "Failed to delete team" }, { status: 500 });
  }
}
