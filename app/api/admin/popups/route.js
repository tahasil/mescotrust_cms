import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Popup from "@/models/Popup";
import { isAdmin, isEditor } from "@/lib/permissions";
import {
  derivePopupComponentId,
  isCorePopupComponentId,
  getDefaultPopupProps,
} from "@/lib/popupConstants";
import { ensureCorePopupsExist } from "@/lib/popupCore";
import { normalizePopupStatus } from "@/lib/popupValidation";

export const dynamic = "force-dynamic";

function hasPopupAccess(session) {
  return isAdmin(session) || isEditor(session);
}

function serializePopup(doc) {
  if (!doc) return null;
  const defaultProps =
    doc.defaultProps && typeof doc.defaultProps === "object"
      ? doc.defaultProps
      : {};
  return {
    _id: String(doc._id || ""),
    componentId: String(doc.componentId || ""),
    displayName: String(doc.displayName || doc.componentId || ""),
    enabled: doc.enabled !== false,
    status: normalizePopupStatus(doc.status, "draft"),
    isSystem: doc.isSystem === true,
    defaultProps: { ...getDefaultPopupProps(), ...defaultProps },
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!hasPopupAccess(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || 50),
    );
    const skip = (page - 1) * limit;
    const search = String(searchParams.get("search") || "").trim();
    const status = normalizePopupStatus(searchParams.get("status"), "");
    const enabledParam = String(searchParams.get("enabled") || "")
      .trim()
      .toLowerCase();

    const query = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { displayName: { $regex: escaped, $options: "i" } },
        { componentId: { $regex: escaped, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (enabledParam === "true" || enabledParam === "false") {
      query.enabled = enabledParam === "true";
    }

    await connectDB();
    await ensureCorePopupsExist(Popup);

    const [rows, total] = await Promise.all([
      Popup.find(query)
        .sort({ isSystem: -1, createdAt: 1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Popup.countDocuments(query),
    ]);

    return NextResponse.json({
      items: rows.map(serializePopup).filter(Boolean),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!hasPopupAccess(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const displayName = String(body?.displayName || "").trim();
    if (!displayName) {
      return NextResponse.json(
        { error: "Popup name is required" },
        { status: 400 },
      );
    }

    await connectDB();
    await ensureCorePopupsExist(Popup);

    const base = derivePopupComponentId(displayName);
    if (!base) {
      return NextResponse.json(
        { error: "Popup name must contain letters or numbers" },
        { status: 400 },
      );
    }

    let componentId = base;
    let suffix = 0;
    while (
      isCorePopupComponentId(componentId) ||
      (await Popup.findOne({ componentId }).lean())
    ) {
      suffix += 1;
      componentId = `${base}${suffix}`;
    }

    const created = await Popup.create({
      componentId,
      displayName,
      defaultProps: getDefaultPopupProps(),
      enabled: true,
      status: "draft",
      isSystem: false,
    });

    return NextResponse.json(serializePopup(created.toObject()), {
      status: 201,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
