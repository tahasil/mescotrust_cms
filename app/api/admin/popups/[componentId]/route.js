import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Popup from "@/models/Popup";
import { isAdmin, isEditor } from "@/lib/permissions";
import {
  CORE_POPUP_LABELS,
  isCorePopupComponentId,
  getDefaultPopupProps,
} from "@/lib/popupConstants";
import { ensureCorePopupsExist } from "@/lib/popupCore";
import {
  hasPopupPayloadShape,
  normalizePopupStatus,
  sanitizePopupPayload,
} from "@/lib/popupValidation";

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

function getComponentId(params) {
  return decodeURIComponent(String(params?.componentId || "")).trim();
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!hasPopupAccess(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const componentId = getComponentId(params);
  if (!componentId) {
    return NextResponse.json({ error: "Invalid popup id" }, { status: 400 });
  }

  try {
    await connectDB();
    await ensureCorePopupsExist(Popup);

    let doc = await Popup.findOne({ componentId }).lean();
    if (!doc && isCorePopupComponentId(componentId)) {
      // Safety fallback in case a core popup was deleted manually in DB.
      await Popup.create({
        componentId,
        displayName: CORE_POPUP_LABELS[componentId] || componentId,
        defaultProps: getDefaultPopupProps(),
        enabled: true,
        status: "draft",
        isSystem: true,
      });
      doc = await Popup.findOne({ componentId }).lean();
    }

    if (!doc) {
      return NextResponse.json({ error: "Popup not found" }, { status: 404 });
    }
    return NextResponse.json(serializePopup(doc));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!hasPopupAccess(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const componentId = getComponentId(params);
  if (!componentId) {
    return NextResponse.json({ error: "Invalid popup id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    await connectDB();
    await ensureCorePopupsExist(Popup);

    let doc = await Popup.findOne({ componentId });
    if (!doc) {
      return NextResponse.json({ error: "Popup not found" }, { status: 404 });
    }

    const patch = {};

    if (typeof body?.displayName === "string" && doc.isSystem !== true) {
      const nextName = body.displayName.trim();
      if (nextName) patch.displayName = nextName;
    }
    if (typeof body?.enabled === "boolean") {
      patch.enabled = body.enabled;
    }
    if (body?.status !== undefined) {
      const nextStatus = normalizePopupStatus(body.status, "");
      if (!nextStatus) {
        return NextResponse.json({ error: "Invalid popup status" }, { status: 400 });
      }
      patch.status = nextStatus;
    }

    const settingsPayload =
      body?.defaultProps && typeof body.defaultProps === "object"
        ? body.defaultProps
        : hasPopupPayloadShape(body)
          ? body
          : null;
    if (settingsPayload) {
      try {
        patch.defaultProps = sanitizePopupPayload(settingsPayload, {
          requireTargetRoutes: true,
          requireImageUrl: true,
        });
      } catch (validationErr) {
        return NextResponse.json(
          { error: validationErr?.message || "Invalid popup payload" },
          { status: 400 },
        );
      }
    }

    if (patch.status === "published") {
      try {
        sanitizePopupPayload(patch.defaultProps || doc.defaultProps, {
          requireTargetRoutes: true,
          requireImageUrl: true,
        });
      } catch (validationErr) {
        return NextResponse.json(
          {
            error:
              validationErr?.message ||
              "Popup must have valid settings before publishing",
          },
          { status: 400 },
        );
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(serializePopup(doc.toObject()));
    }

    Object.assign(doc, patch);
    if (patch.defaultProps) doc.markModified("defaultProps");
    await doc.save();

    return NextResponse.json(serializePopup(doc.toObject()));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!hasPopupAccess(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const componentId = getComponentId(params);
  if (!componentId) {
    return NextResponse.json({ error: "Invalid popup id" }, { status: 400 });
  }
  if (isCorePopupComponentId(componentId)) {
    return NextResponse.json(
      { error: "System popups cannot be deleted" },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    const deleted = await Popup.deleteOne({ componentId });
    if (!deleted?.deletedCount) {
      return NextResponse.json({ error: "Popup not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deleted: componentId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
