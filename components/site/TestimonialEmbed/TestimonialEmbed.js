"use client";

import { useEffect, useState } from "react";
import DonorTestimonials from "@/components/site/DonorTestimonials/DonorTestimonials";
import Testimonials from "@/components/site/Testimonials/Testimonials";

// A ShortCode block ships the component factory defaults until the admin edits
// them; those literal defaults mean "not customized", so the record's own
// titles take over instead of rendering the placeholder texts.
const SHORTCODE_FACTORY_MAIN_TITLE = "Section Title";
const SHORTCODE_FACTORY_SUBTITLE = "Subtitle";

function normalizeItems(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => ({
      quote: String(item?.quote ?? "").trim(),
      name: String(item?.name ?? "").trim(),
      role: String(item?.role ?? "").trim(),
    }))
    .filter((item) => item.quote && item.name);
}

function pickHeadingValue(blockValue, recordValue, factoryDefault) {
  const fromBlock = String(blockValue ?? "").trim();
  if (fromBlock && fromBlock !== factoryDefault) return fromBlock;
  return String(recordValue ?? "").trim();
}

// ShortCode card colors ship "Transparent" as the factory default; an empty or
// transparent value means "no override", so the component design is preserved.
function pickCardColorOverride(value) {
  const key = String(value ?? "").trim();
  if (!key || key.toLowerCase() === "transparent") return "";
  return key;
}

function optionalNumber(value) {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalKey(value) {
  const key = String(value ?? "").trim();
  return key || undefined;
}

/**
 * Maps a Testimonial record to the props of the two existing site components
 * so the rendered output keeps their exact design:
 *  - style "card"   -> DonorTestimonials (card grid; item `role` stays `role`)
 *  - style "slider" -> Testimonials (slider; item `role` maps to `title`)
 *
 * extraProps carries an enclosing ShortCode block's heading configuration
 * (mainTitle / subTitle / shortCode*Enabled / shortCode*ColorKey). Block values
 * win over the record's titles (except untouched factory defaults), and the
 * enable toggles control the component's own heading visibility so the block
 * "Title & Colors" switches keep working.
 */
export function buildTestimonialComponentProps(record, extraProps = {}, poolItems = null) {
  const style = (record?.style || "card") === "slider" ? "slider" : "card";
  // All testimonials are fetched from "Manage Testimonials" (the shared pool).
  // Slider View renders only items with "Show in Slider" toggle turned on.
  // Card View renders all testimonials.
  const rawPool = Array.isArray(poolItems) ? poolItems : [];
  const items = normalizeItems(
    style === "slider"
      ? rawPool.filter((item) => item?.showInSlider === true)
      : rawPool,
  );
  const mainTitle = pickHeadingValue(
    extraProps?.mainTitle,
    record?.mainTitle,
    SHORTCODE_FACTORY_MAIN_TITLE,
  );
  const subTitle = pickHeadingValue(
    extraProps?.subTitle,
    record?.subTitle,
    SHORTCODE_FACTORY_SUBTITLE,
  );
  const titleEnabled = extraProps?.shortCodeTitleEnabled !== false;
  const subTitleEnabled = extraProps?.shortCodeSubTitleEnabled !== false;
  const titleColorKey = String(
    extraProps?.shortCodeMainTitleColorKey ?? extraProps?.titleColorKey ?? "",
  ).trim();
  const subTitleColorKey = String(extraProps?.shortCodeSubTitleColorKey ?? "").trim();
  const highlightColorKey = String(extraProps?.titleHighlightColorKey ?? "").trim();
  const cardBgColorKey = pickCardColorOverride(extraProps?.shortCodeCardBgColorKey);
  const cardBorderColorKey = pickCardColorOverride(extraProps?.shortCodeCardBorderColorKey);
  const cardTextColorKey = pickCardColorOverride(extraProps?.shortCodeCardTextColorKey);

  if (style === "slider") {
    // For slider view, the heading is the small uppercase subtitle (e.g. "DONOR TESTIMONIALS")
    // Always render in primary theme color (#E03C33) matching the home page design.
    const sliderSmallTitle =
      (subTitle && subTitle !== SHORTCODE_FACTORY_SUBTITLE ? subTitle : "") ||
      (mainTitle && mainTitle !== SHORTCODE_FACTORY_MAIN_TITLE ? mainTitle : "") ||
      record?.subTitle ||
      record?.mainTitle ||
      "Donor Testimonials";

    return {
      testimonialsTitle: sliderSmallTitle,
      testimonialsTitleEnabled: true,
      testimonialsTitleColorKey: "primary",
      testimonialsQuoteMarkColorKey: "primary",
      testimonialsQuoteFontSize: optionalNumber(record?.quoteTextFontSize),
      testimonialsQuoteMarkFontSize: optionalNumber(record?.quoteIconFontSize),
      testimonialsNameFontSize: optionalNumber(record?.nameFontSize),
      testimonialsRoleFontSize: optionalNumber(record?.roleFontSize),
      testimonialsSectionPaddingTop: optionalNumber(record?.sectionPaddingTop) ?? 40,
      testimonialsSectionPaddingBottom: optionalNumber(record?.sectionPaddingBottom) ?? 56,
      testimonialsItems: items.map((item) => ({
        quote: item.quote,
        name: item.name,
        title: item.role,
      })),
    };
  }

  return {
    subTitle,
    mainTitle,
    titleColorKey,
    titleHighlightColorKey: highlightColorKey,
    titleAlign: extraProps?.titleAlign,
    donorTestimonialsTitleAlign: extraProps?.titleAlign,
    donorTestimonialsTitleEnabled: titleEnabled,
    donorTestimonialsSubTitleEnabled: subTitleEnabled,
    donorTestimonialsSubTitleColorKey: subTitleColorKey,
    donorTestimonialsCardBgColorKey: cardBgColorKey,
    donorTestimonialsCardBorderColorKey: cardBorderColorKey,
    // Card text typography from the record (mirrors the component settings).
    donorTestimonialsQuoteIconFontSize: optionalNumber(record?.quoteIconFontSize),
    donorTestimonialsQuoteTextFontSize: optionalNumber(record?.quoteTextFontSize),
    donorTestimonialsNameFontSize: optionalNumber(record?.nameFontSize),
    donorTestimonialsRoleFontSize: optionalNumber(record?.roleFontSize),
    donorTestimonialsQuoteIconColorKey: optionalKey(record?.quoteIconColorKey),
    donorTestimonialsQuoteTextColorKey: optionalKey(record?.quoteTextColorKey),
    donorTestimonialsNameColorKey: optionalKey(record?.nameColorKey),
    donorTestimonialsRoleColorKey: optionalKey(record?.roleColorKey),
    donorTestimonialsParagraphAlign: optionalKey(record?.paragraphAlign),
    ...(cardTextColorKey
      ? {
          donorTestimonialsQuoteTextColorKey: cardTextColorKey,
          donorTestimonialsNameColorKey: cardTextColorKey,
          donorTestimonialsRoleColorKey: cardTextColorKey,
        }
      : {}),
    donorTestimonialsItems: items,
  };
}

/**
 * Site Component / Renderer: TestimonialEmbed.
 * Renders a testimonial group (style + titles + typography from the record)
 * with its items fetched from the shared global testimonial pool, falling
 * back to the record's own items while the pool loads.
 */
export default function TestimonialEmbed(props) {
  const rawShortcode = String(
    props?.shortcode ||
      props?.shortCode ||
      props?.testimonialShortcode ||
      props?.testimonialId ||
      "",
  ).trim();

  const [data, setData] = useState(props?.initialTestimonial || null);
  const [loading, setLoading] = useState(Boolean(!props?.initialTestimonial && rawShortcode));
  const [error, setError] = useState("");
  const [poolItems, setPoolItems] = useState(
    Array.isArray(props?.initialItems) ? props.initialItems : null,
  );

  useEffect(() => {
    if (props?.initialTestimonial) {
      setData(props.initialTestimonial);
      setLoading(false);
      return;
    }

    if (!rawShortcode) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`/api/public/testimonials/${encodeURIComponent(rawShortcode)}`, {
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Testimonial "${rawShortcode}" not found`);
        }
        return res.json();
      })
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rawShortcode, props?.initialTestimonial]);

  useEffect(() => {
    if (poolItems !== null) return undefined;
    let cancelled = false;
    fetch("/api/public/testimonial-items", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!cancelled) {
          setPoolItems(Array.isArray(payload?.items) ? payload.items : []);
        }
      })
      .catch(() => {
        if (!cancelled) setPoolItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [poolItems]);

  const effectiveData = data || props?.initialTestimonial || null;

  if (loading || poolItems === null) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(0,0,0,0.45)" }}>
        Loading testimonials...
      </div>
    );
  }

  if (error && !effectiveData) {
    return <div style={{ padding: "20px 0", color: "#b42318" }}>{error}</div>;
  }

  if (!effectiveData) {
    return null;
  }

  const componentProps = buildTestimonialComponentProps(effectiveData, props, poolItems);
  const ComponentToRender =
    (effectiveData?.style || "card") === "slider" ? Testimonials : DonorTestimonials;

  return <ComponentToRender {...componentProps} />;
}
