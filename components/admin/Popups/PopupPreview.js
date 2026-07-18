"use client";

import { useEffect, useMemo, useState } from "react";
import FormEmbed from "@/components/site/FormEmbed/FormEmbed";
import { resolvePopupFormShortcode } from "@/lib/popupShortcode";

export default function PopupPreview({
  imageUrl = "",
  title = "",
  description = "",
  formShortcode = "",
}) {
  const src = String(imageUrl || "").trim();
  const [hasError, setHasError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setHasError(false);
    setRefreshKey(Date.now());
  }, [src]);

  const previewSrc = useMemo(() => {
    if (!src) return "";
    const joiner = src.includes("?") ? "&" : "?";
    return `${src}${joiner}preview=${refreshKey}`;
  }, [src, refreshKey]);

  const titleText = String(title || "").trim();
  const descriptionText = String(description || "").trim();
  const hasImageSource = Boolean(previewSrc);
  const showImage = hasImageSource && !hasError;
  const popupFormShortcodeState = useMemo(
    () => resolvePopupFormShortcode(formShortcode),
    [formShortcode],
  );
  const showShortcodePlaceholder = !popupFormShortcodeState.isValid;
  const shortcodePlaceholderMessage = popupFormShortcodeState.hasValue
    ? 'Invalid Form Builder shortcode. Use format [shortcode="form-name"] to preview the form.'
    : "No Form Builder shortcode configured for this popup preview.";

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "20px 0",
      }}
    >
      <div
        style={{
          width: "min(760px, 100%)",
          borderRadius: 16,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 14px 40px rgba(17, 24, 39, 0.16)",
          border: "1px solid rgba(15, 23, 42, 0.08)",
        }}
      >
        {showImage ? (
          <div
            style={{
              width: "100%",
              padding: 12,
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                width: "100%",
                maxHeight: 460,
                minHeight: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 12,
                background: "#fff",
                border: "1px solid rgba(15, 23, 42, 0.06)",
              }}
            >
              <img
                src={previewSrc}
                alt={titleText || "Popup image"}
                onError={() => setHasError(true)}
                style={{
                  width: "100%",
                  height: "auto",
                  minWidth: 0,
                  maxWidth: "100%",
                  maxHeight: "min(72vh, 460px)",
                  display: "block",
                  objectFit: "contain",
                  objectPosition: "center center",
                }}
              />
            </div>
          </div>
        ) : hasImageSource ? (
          <div
            style={{
              height: 220,
              display: "grid",
              placeItems: "center",
              color: "#64748b",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.04), rgba(15,23,42,0.08))",
            }}
          >
            Unable to preview image
          </div>
        ) : null}
        {titleText || descriptionText ? (
          <div style={{ padding: 16 }}>
            {titleText ? (
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  lineHeight: 1.25,
                  color: "#0f172a",
                }}
              >
                {titleText}
              </h3>
            ) : null}
            {descriptionText ? (
              <p style={{ margin: "8px 0 0", color: "#475569", fontSize: 14 }}>
                {descriptionText}
              </p>
            ) : null}
          </div>
        ) : null}
        {popupFormShortcodeState.isValid ? (
          <div
            style={{
              padding: 16,
              borderTop: "1px solid rgba(15, 23, 42, 0.08)",
              background: "#fff",
            }}
          >
            <FormEmbed
              mode="shortcode"
              shortcode={popupFormShortcodeState.shortcode}
            />
          </div>
        ) : null}
        {showShortcodePlaceholder ? (
          <div
            style={{
              padding: "14px 16px 16px",
              borderTop: "1px solid rgba(15, 23, 42, 0.08)",
              color: "#475569",
              fontSize: 13,
              background: "#fff",
            }}
          >
            {shortcodePlaceholderMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}
