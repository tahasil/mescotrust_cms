import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import Component from "@/models/Component";
import { validateCommitteeMembersImages } from "@/lib/committeeMembersImageValidation";

export const dynamic = "force-dynamic";

const DEFAULT_MEMBERS = [
  {
    name: "Prof. M. Farhaan Makba",
    qualification: "M.Sc., PGDME",
    title: "President",
    imageDesktop: "/images/members-1.png",
    image: "/images/members-1.png",
    imageMobile: "",
    bio: "",
    order: 1,
  },
  {
    name: "MR. MASUD MEMON",
    qualification: "B.Com",
    title: "Vice-President",
    imageDesktop: "/images/members-2.png",
    image: "/images/members-2.png",
    imageMobile: "",
    bio: "",
    order: 2,
  },
  {
    name: "MR. SALMAN KARDAME",
    qualification: "General Secretary",
    title: "",
    imageDesktop: "/images/members-3.png",
    image: "/images/members-3.png",
    imageMobile: "",
    bio: "",
    order: 3,
  },
  {
    name: "MR. SHAKIL AHMED RANGREJ",
    qualification: "Treasurer",
    title: "",
    imageDesktop: "/images/members-4.png",
    image: "/images/members-4.png",
    imageMobile: "",
    bio: "",
    order: 4,
  },
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "team";
}

async function generateUniqueShortcode(name, currentId = null) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;
  while (true) {
    const query = { shortcode: candidate };
    if (currentId) query._id = { $ne: currentId };
    const existing = await Team.findOne(query).lean();
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

async function ensureDefaultTeam() {
  const count = await Team.countDocuments();
  if (count > 0) return;

  const compDoc = await Component.findOne({ baseComponent: "CommitteeMembers" }).lean();
  const compProps = compDoc?.defaultProps || {};

  const items = Array.isArray(compProps?.committeeMembersItems) && compProps.committeeMembersItems.length > 0
    ? compProps.committeeMembersItems.map((item, idx) => ({
        name: String(item?.name || "").trim(),
        qualification: String(item?.qualification || "").trim(),
        title: String(item?.title || "").trim(),
        imageDesktop: String(item?.imageDesktop || item?.image || "").trim(),
        imageMobile: String(item?.imageMobile || "").trim(),
        image: String(item?.imageDesktop || item?.image || "").trim(),
        bio: String(item?.bio || "").trim(),
        order: idx + 1,
      }))
    : DEFAULT_MEMBERS;

  await Team.create({
    name: "Committee Members",
    slug: "committee-members",
    shortcode: "committee-members",
    description: "Executive committee & trustees",
    status: "published",
    subTitle: compProps?.committeeMembersSubTitle ?? "The People",
    mainTitle: compProps?.committeeMembersMainTitle ?? "Committee Members",
    subTitleColorKey: compProps?.committeeMembersSubTitleColorKey ?? "",
    titleColorKey: compProps?.committeeMembersTitleColorKey ?? "",
    cardTitleColorKey: compProps?.committeeMembersCardTitleColorKey ?? "",
    cardDescriptionColorKey: compProps?.committeeMembersCardDescriptionColorKey ?? "",
    buttonBgColorKey: compProps?.committeeMembersButtonBgColorKey ?? "",
    buttonTextColorKey: compProps?.committeeMembersButtonTextColorKey ?? "",
    buttonBorderColorKey: compProps?.committeeMembersButtonBorderColorKey ?? "",
    buttonHoverBgColorKey: compProps?.committeeMembersButtonHoverBgColorKey ?? "",
    buttonHoverTextColorKey: compProps?.committeeMembersButtonHoverTextColorKey ?? "",
    buttonHoverBorderColorKey: compProps?.committeeMembersButtonHoverBorderColorKey ?? "",
    modalBgColorKey: compProps?.committeeMembersModalBgColorKey ?? "",
    modalNameColorKey: compProps?.committeeMembersModalNameColorKey ?? "",
    modalQualificationColorKey: compProps?.committeeMembersModalQualificationColorKey ?? "",
    modalRoleColorKey: compProps?.committeeMembersModalRoleColorKey ?? "",
    modalBioColorKey: compProps?.committeeMembersModalBioColorKey ?? "",
    modalDividerColorKey: compProps?.committeeMembersModalDividerColorKey ?? "",
    modalImageBorderColorKey: compProps?.committeeMembersModalImageBorderColorKey ?? "",
    members: items,
  });
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureDefaultTeam();

    const { searchParams } = new URL(req.url);
    const search = String(searchParams.get("search") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortcode: { $regex: search, $options: "i" } },
        { subTitle: { $regex: search, $options: "i" } },
        { mainTitle: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Team.find(filter)
        .sort({ order: 1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Team.countDocuments(filter),
    ]);

    const formatted = items.map((doc, idx) => ({
      _id: doc._id,
      key: String(doc._id),
      order: doc.order || skip + idx + 1,
      name: doc.name,
      slug: doc.slug,
      shortcode: doc.shortcode,
      description: doc.description || "",
      status: doc.status || "published",
      subTitle: doc.subTitle || "",
      mainTitle: doc.mainTitle || "",
      memberCount: Array.isArray(doc.members) ? doc.members.length : 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return NextResponse.json({
      items: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[Team API GET error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load teams" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const body = await req.json();
    const name = String(body?.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const requestedShortcode = String(body?.shortcode || "").trim();
    const shortcode = await generateUniqueShortcode(requestedShortcode || name);
    const slug = slugify(name);

    const rawMembers = Array.isArray(body?.members) ? body.members : [];
    const members = rawMembers.map((m, idx) => ({
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

    const created = await Team.create({
      name,
      slug,
      shortcode,
      description: String(body?.description || "").trim(),
      status: body?.status || "published",
      subTitle: body?.subTitle ?? "",
      mainTitle: body?.mainTitle ?? name,
      subTitleColorKey: body?.subTitleColorKey ?? "",
      titleColorKey: body?.titleColorKey ?? "",
      cardTitleColorKey: body?.cardTitleColorKey ?? "",
      cardDescriptionColorKey: body?.cardDescriptionColorKey ?? "",
      buttonBgColorKey: body?.buttonBgColorKey ?? "",
      buttonTextColorKey: body?.buttonTextColorKey ?? "",
      buttonBorderColorKey: body?.buttonBorderColorKey ?? "",
      buttonHoverBgColorKey: body?.buttonHoverBgColorKey ?? "",
      buttonHoverTextColorKey: body?.buttonHoverTextColorKey ?? "",
      buttonHoverBorderColorKey: body?.buttonHoverBorderColorKey ?? "",
      modalBgColorKey: body?.modalBgColorKey ?? "",
      modalNameColorKey: body?.modalNameColorKey ?? "",
      modalQualificationColorKey: body?.modalQualificationColorKey ?? "",
      modalRoleColorKey: body?.modalRoleColorKey ?? "",
      modalBioColorKey: body?.modalBioColorKey ?? "",
      modalDividerColorKey: body?.modalDividerColorKey ?? "",
      modalImageBorderColorKey: body?.modalImageBorderColorKey ?? "",
      sectionBgType: body?.sectionBgType ?? "default",
      sectionBgImage: body?.sectionBgImage ?? "",
      sectionBgColorKey: body?.sectionBgColorKey ?? "",
      sectionPaddingTop: body?.sectionPaddingTop != null ? Number(body.sectionPaddingTop) : null,
      sectionPaddingBottom: body?.sectionPaddingBottom != null ? Number(body.sectionPaddingBottom) : null,
      sectionMarginTop: body?.sectionMarginTop != null ? Number(body.sectionMarginTop) : null,
      sectionMarginBottom: body?.sectionMarginBottom != null ? Number(body.sectionMarginBottom) : null,
      pageContainerBgType: body?.pageContainerBgType ?? "default",
      pageContainerBgImage: body?.pageContainerBgImage ?? "",
      pageContainerBgColorKey: body?.pageContainerBgColorKey ?? "",
      containerPaddingTop: body?.containerPaddingTop != null ? Number(body.containerPaddingTop) : null,
      containerPaddingRight: body?.containerPaddingRight != null ? Number(body.containerPaddingRight) : null,
      containerPaddingBottom: body?.containerPaddingBottom != null ? Number(body.containerPaddingBottom) : null,
      containerPaddingLeft: body?.containerPaddingLeft != null ? Number(body.containerPaddingLeft) : null,
      containerMarginTop: body?.containerMarginTop != null ? Number(body.containerMarginTop) : null,
      containerMarginBottom: body?.containerMarginBottom != null ? Number(body.containerMarginBottom) : null,
      members: members.length > 0 ? members : DEFAULT_MEMBERS,
      createdBy: String(session?.id || ""),
      updatedBy: String(session?.id || ""),
    });

    return NextResponse.json(created.toObject(), { status: 201 });
  } catch (err) {
    console.error("[Team API POST error]:", err);
    return NextResponse.json({ error: err.message || "Failed to create team" }, { status: 500 });
  }
}
