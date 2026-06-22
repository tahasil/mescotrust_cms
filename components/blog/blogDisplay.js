function toText(value) {
  return String(value || "").trim();
}

export function getBlogImageSources(post) {
  const desktop =
    toText(post?.featuredImageDesktop) ||
    toText(post?.featuredImage) ||
    toText(post?.featuredImageMobile);
  const mobile = toText(post?.featuredImageMobile) || desktop;
  return { desktop, mobile };
}
