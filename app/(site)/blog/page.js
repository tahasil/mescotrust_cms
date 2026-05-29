import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * /blog has moved to /blogs (TSUV→MESCO Phase 10). Permanent redirect, preserving
 * ?category / ?page so old links and bookmarks land on the right /blogs view.
 */
export default function BlogIndexRedirect({ searchParams }) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams || {})) {
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
    else if (v != null) params.set(k, String(v));
  }
  const qs = params.toString();
  permanentRedirect(qs ? `/blogs?${qs}` : "/blogs");
}
