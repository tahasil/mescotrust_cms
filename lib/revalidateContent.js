import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Invalidate the public caches for the Blogs module after an admin mutation
 * (create / update / delete / publish-status change). The /blogs list is a
 * tagged unstable_cache (tag "blogs", revalidate 60) and /blogs/[slug] is a
 * route-level ISR page (revalidate 60); without these calls an admin change —
 * including unpublishing — would not appear on the site for up to 60s.
 */
export function revalidateBlogs(slug) {
  revalidateTag("blogs");
  revalidatePath("/blogs");
  if (slug) revalidatePath(`/blogs/${slug}`);
}

/** Same as revalidateBlogs, for the Events module (/events list + /events/[slug]). */
export function revalidateEvents(slug) {
  revalidateTag("events");
  revalidatePath("/events");
  if (slug) revalidatePath(`/events/${slug}`);
}
