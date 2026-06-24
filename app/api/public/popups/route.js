import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Popup from "@/models/Popup";
import {
  sanitizePopupPayload,
  isValidPopupLinkUrl,
  normalizePopupLinkTarget,
} from "@/lib/popupValidation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolvePopupImageUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";

  const directMediaMatch = value.match(
    /^\/media\/([a-fA-F0-9]{24})(?:$|[/?#])/,
  );
  if (directMediaMatch?.[1]) {
    return `/api/media/${directMediaMatch[1]}?size=original&format=jpg`;
  }

  try {
    const parsed = new URL(value, "http://popup.local");
    const mediaPathMatch = parsed.pathname.match(
      /^\/media\/([a-fA-F0-9]{24})(?:$|[/?#])/,
    );
    if (mediaPathMatch?.[1]) {
      return `/api/media/${mediaPathMatch[1]}?size=original&format=jpg`;
    }
  } catch {}

  return value;
}

export async function GET() {
  try {
    await connectDB();
    const rows = await Popup.find({
      enabled: true,
      status: "published",
    }).lean();

    const payload = rows
      .map((doc) => {
        const componentId = String(doc?.componentId || "").trim();
        if (!componentId) return null;

        let props = {};
        try {
          props = sanitizePopupPayload(doc?.defaultProps || {}, {
            requireTargetRoutes: true,
            requireImageUrl: true,
          });
        } catch {
          return null;
        }

        const link =
          props?.link?.enabled && isValidPopupLinkUrl(props?.link?.url)
            ? {
                enabled: true,
                url: String(props.link.url || "").trim(),
                target: normalizePopupLinkTarget(props.link.target),
              }
            : {
                enabled: false,
                url: "",
                target: "_self",
              };

        return {
          componentId,
          displayName: String(doc?.displayName || componentId),
          updatedAt: doc?.updatedAt || null,
          defaultProps: {
            ...props,
            imageUrl: resolvePopupImageUrl(props.imageUrl),
            link,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const pa = Number(a?.defaultProps?.priority) || 100;
        const pb = Number(b?.defaultProps?.priority) || 100;
        if (pa !== pb) return pa - pb;
        const ta = new Date(a?.updatedAt || 0).getTime();
        const tb = new Date(b?.updatedAt || 0).getTime();
        if (tb !== ta) return tb - ta;
        return String(a?.componentId || "").localeCompare(
          String(b?.componentId || ""),
        );
      });

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
