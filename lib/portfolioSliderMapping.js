import Slider from "@/models/Slider";
import { toText } from "@/lib/portfolioUtils";
import { isPortfolioItemMappingSupported } from "@/lib/portfolioSliderSupport";

function normalizeMappedEntry(item, categoryName = "") {
  return {
    itemId: toText(item?._id),
    name: toText(item?.name || item?.title),
    slug: toText(item?.slug),
    designation: toText(item?.designation),
    image: toText(item?.image),
    bio: toText(item?.bio),
    categoryId: toText(item?.categoryId),
    categoryName: toText(categoryName),
    socialLinks: Array.isArray(item?.socialLinks) ? item.socialLinks : [],
    order: Number.isFinite(Number(item?.order)) ? Number(item.order) : 0,
    status: item?.status !== false,
    updatedAt: new Date().toISOString(),
  };
}

function getCurrentMappedSlider(item) {
  return toText(
    item?.features?.mappedSliderComponentId || item?.mappedSliderComponentId,
  );
}

export async function removePortfolioItemFromSlider(componentId, itemId) {
  const sliderId = toText(componentId);
  const safeItemId = toText(itemId);
  if (!sliderId || !safeItemId) return;

  const slider = await Slider.findOne({ componentId: sliderId }).lean();
  if (!slider) return;
  const defaultProps =
    slider?.defaultProps && typeof slider.defaultProps === "object"
      ? slider.defaultProps
      : {};
  const mapped = Array.isArray(defaultProps.portfolioItemsMapped)
    ? defaultProps.portfolioItemsMapped
    : [];
  const nextMapped = mapped.filter(
    (item) => toText(item?.itemId) !== safeItemId,
  );
  if (nextMapped.length === mapped.length) return;

  await Slider.findOneAndUpdate(
    { componentId: sliderId },
    {
      $set: {
        defaultProps: {
          ...defaultProps,
          portfolioItemsMapped: nextMapped,
        },
      },
    },
    { strict: false },
  );
}

export async function upsertPortfolioItemInSlider(componentId, item, categoryName = "") {
  const sliderId = toText(componentId);
  if (!sliderId || !item?._id || !isPortfolioItemMappingSupported(sliderId)) return;

  const slider = await Slider.findOne({ componentId: sliderId }).lean();
  if (!slider) return;
  const defaultProps =
    slider?.defaultProps && typeof slider.defaultProps === "object"
      ? slider.defaultProps
      : {};
  const mapped = Array.isArray(defaultProps.portfolioItemsMapped)
    ? [...defaultProps.portfolioItemsMapped]
    : [];

  const nextEntry = normalizeMappedEntry(item, categoryName);
  const idx = mapped.findIndex(
    (entry) => toText(entry?.itemId) === toText(item?._id),
  );
  if (idx >= 0) mapped[idx] = nextEntry;
  else mapped.push(nextEntry);
  mapped.sort(
    (a, b) =>
      (Number(a?.order) || 0) - (Number(b?.order) || 0) ||
      toText(a?.name).localeCompare(toText(b?.name)),
  );

  await Slider.findOneAndUpdate(
    { componentId: sliderId },
    {
      $set: {
        defaultProps: {
          ...defaultProps,
          portfolioItemsMapped: mapped,
        },
      },
    },
    { strict: false },
  );
}

export async function syncPortfolioSliderMapping({
  item,
  previousSliderComponentId = "",
  categoryName = "",
}) {
  const oldSliderId = toText(previousSliderComponentId);
  const currentSliderId = getCurrentMappedSlider(item);
  const itemId = toText(item?._id);
  if (!itemId) return;

  if (oldSliderId && oldSliderId !== currentSliderId) {
    await removePortfolioItemFromSlider(oldSliderId, itemId);
  }

  if (currentSliderId && isPortfolioItemMappingSupported(currentSliderId)) {
    await upsertPortfolioItemInSlider(currentSliderId, item, categoryName);
    return;
  }

  if (oldSliderId && !currentSliderId) {
    await removePortfolioItemFromSlider(oldSliderId, itemId);
  }
}

