import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Popup from "@/models/Popup";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import { inferComponentModule } from "@/lib/sliderComponentRegistry";
import { normalizePopupTargetRoutes } from "@/lib/popupRouteUtils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeModalWidthPreset(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (
    value === "small" ||
    value === "medium" ||
    value === "large" ||
    value === "full" ||
    value === "custom"
  ) {
    return value;
  }
  return "medium";
}

function normalizeCustomModalWidthPx(raw, fallback = 560) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(280, Math.min(1600, Math.round(value)));
}

function normalizePopupLinkTarget(raw) {
  return String(raw || "").trim().toLowerCase() === "_blank" ? "_blank" : "_self";
}

function isValidPopupLinkUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return false;
  if (value.startsWith("/")) return true;
  if (value.startsWith("#")) return true;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return true;
  return false;
}

function resolvePopupImageUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";

  const directMediaMatch = value.match(/^\/media\/([a-fA-F0-9]{24})(?:$|[/?#])/);
  if (directMediaMatch?.[1]) {
    return `/api/media/${directMediaMatch[1]}?format=original`;
  }

  try {
    const parsed = new URL(value, "http://popup.local");
    const mediaPathMatch = parsed.pathname.match(
      /^\/media\/([a-fA-F0-9]{24})(?:$|[/?#])/,
    );
    if (mediaPathMatch?.[1]) {
      return `/api/media/${mediaPathMatch[1]}?format=original`;
    }
  } catch {}

  return value;
}

function normalizePopupCtaStyle(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "secondary" || value === "outline") return value;
  return "primary";
}

function sanitizePopupCtaButtons(rawButtons) {
  const list = Array.isArray(rawButtons) ? rawButtons : [];
  return list
    .slice(0, 3)
    .map((button, index) => {
      const label = String(button?.label || "").trim();
      if (!label) return null;
      return {
        id: String(button?.id || `cta_${index + 1}`),
        label: label.slice(0, 48),
        enabled: button?.enabled !== false,
        style: normalizePopupCtaStyle(button?.style),
      };
    })
    .filter(Boolean);
}

export async function GET() {
  try {
    await connectDB();

    const popupDocs = await Popup.find({ enabled: true }).lean();
    const ids = popupDocs
      .map((doc) => String(doc?.componentId || "").trim())
      .filter(Boolean);

    if (ids.length === 0) return NextResponse.json([]);

    const metas = await SiteComponentMeta.find({
      componentId: { $in: ids },
    }).lean();
    const metaById = new Map(
      (metas || []).map((m) => [String(m?.componentId || "").trim(), m]),
    );

    const payload = popupDocs
      .map((doc) => {
        const componentId = String(doc?.componentId || "").trim();
        if (!componentId) return null;
        const meta = metaById.get(componentId);
        const moduleOwner = inferComponentModule(componentId, meta?.module);
        if (moduleOwner !== "popups") return null;
        if (meta?.enabled === false) return null;

        const props =
          doc?.defaultProps && typeof doc.defaultProps === "object"
            ? doc.defaultProps
            : {};
        const targetRoutes = normalizePopupTargetRoutes(props.targetRoutes);
        if (targetRoutes.length === 0) return null;

        const imageUrl = String(props.imageUrl || "").trim();
        if (!imageUrl) return null;

        const link = {
          enabled:
            props?.link?.enabled === true || props?.linkEnabled === true,
          url: String(
            props?.link?.url != null && String(props.link.url).trim()
              ? props.link.url
              : props?.linkUrl || "",
          ).trim(),
          target: normalizePopupLinkTarget(
            props?.link?.target || props?.linkTarget,
          ),
        };

        return {
          componentId,
          displayName: String(doc?.displayName || componentId),
          updatedAt: doc?.updatedAt || null,
          defaultProps: {
            targetRoutes,
            imageUrl: resolvePopupImageUrl(imageUrl),
            openOnPageLoad: props.openOnPageLoad !== false,
            dismissible: props.dismissible !== false,
            reShowBehavior:
              props.reShowBehavior === "session_until_browser_close"
                ? "session_until_browser_close"
                : "always",
            priority:
              Number.isFinite(Number(props.priority))
                ? Number(props.priority)
                : 100,
            animation:
              props.animation && typeof props.animation === "object"
                ? props.animation
                : {},
            modalWidthPreset: normalizeModalWidthPreset(props.modalWidthPreset),
            customModalWidthPx: normalizeCustomModalWidthPx(
              props.customModalWidthPx,
              560,
            ),
            link:
              link.enabled && isValidPopupLinkUrl(link.url)
                ? link
                : {
                    enabled: false,
                    url: "",
                    target: "_self",
                  },
            title: String(props.title || ""),
            description: String(props.description || ""),
            ctaButtons: sanitizePopupCtaButtons(props.ctaButtons),
            delayMs:
              Number.isFinite(Number(props.delayMs)) &&
              Number(props.delayMs) >= 0
                ? Number(props.delayMs)
                : 0,
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
