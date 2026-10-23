import React from "react";
import { buildBreadcrumbSchema, serializeJsonLd } from "@/lib/breadcrumbSchema";

/**
 * Reusable Breadcrumb Schema Component.
 *
 * Emits a valid Schema.org BreadcrumbList <script type="application/ld+json"> tag.
 * Works seamlessly in both Next.js Server Components and Client Components.
 *
 * @param {Object} props
 * @param {Array<{ label?: string, name?: string, title?: string, href?: string, url?: string, item?: string }>} props.items - Breadcrumb items list
 * @param {string} [props.baseUrl] - Optional site domain override
 * @param {string} [props.currentUrl] - Optional canonical URL of the active page
 */
export default function BreadcrumbJsonLd({ items = [], baseUrl, currentUrl }) {
  const schema = buildBreadcrumbSchema(items, { baseUrl, currentUrl });
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}
