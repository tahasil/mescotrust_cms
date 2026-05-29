import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /blog/[slug] → /blogs/[slug] (TSUV→MESCO Phase 10). */
export default function BlogPostRedirect({ params }) {
  permanentRedirect(`/blogs/${params.slug}`);
}
