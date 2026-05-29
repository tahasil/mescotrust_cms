import Slider from "@/models/Slider";
import { toText } from "@/lib/teamUtils";
import { isTeamMemberMappingSupported } from "@/lib/teamSliderSupport";

function normalizeMappedEntry(member, categoryName = "") {
  return {
    memberId: toText(member?._id),
    name: toText(member?.name || member?.title),
    slug: toText(member?.slug),
    designation: toText(member?.designation),
    image: toText(member?.image),
    bio: toText(member?.bio),
    categoryId: toText(member?.categoryId),
    categoryName: toText(categoryName),
    socialLinks: Array.isArray(member?.socialLinks) ? member.socialLinks : [],
    order: Number.isFinite(Number(member?.order)) ? Number(member.order) : 0,
    status: member?.status !== false,
    updatedAt: new Date().toISOString(),
  };
}

function getCurrentMappedSlider(member) {
  return toText(
    member?.features?.mappedSliderComponentId || member?.mappedSliderComponentId,
  );
}

export async function removeMemberFromSlider(componentId, memberId) {
  const sliderId = toText(componentId);
  const safeMemberId = toText(memberId);
  if (!sliderId || !safeMemberId) return;

  const slider = await Slider.findOne({ componentId: sliderId }).lean();
  if (!slider) return;
  const defaultProps =
    slider?.defaultProps && typeof slider.defaultProps === "object"
      ? slider.defaultProps
      : {};
  const mapped = Array.isArray(defaultProps.teamMembersMapped)
    ? defaultProps.teamMembersMapped
    : [];
  const nextMapped = mapped.filter(
    (item) => toText(item?.memberId) !== safeMemberId,
  );
  if (nextMapped.length === mapped.length) return;

  await Slider.findOneAndUpdate(
    { componentId: sliderId },
    {
      $set: {
        defaultProps: {
          ...defaultProps,
          teamMembersMapped: nextMapped,
        },
      },
    },
    { strict: false },
  );
}

export async function upsertMemberInSlider(componentId, member, categoryName = "") {
  const sliderId = toText(componentId);
  if (!sliderId || !member?._id || !isTeamMemberMappingSupported(sliderId)) return;

  const slider = await Slider.findOne({ componentId: sliderId }).lean();
  if (!slider) return;
  const defaultProps =
    slider?.defaultProps && typeof slider.defaultProps === "object"
      ? slider.defaultProps
      : {};
  const mapped = Array.isArray(defaultProps.teamMembersMapped)
    ? [...defaultProps.teamMembersMapped]
    : [];

  const nextEntry = normalizeMappedEntry(member, categoryName);
  const idx = mapped.findIndex(
    (item) => toText(item?.memberId) === toText(member?._id),
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
          teamMembersMapped: mapped,
        },
      },
    },
    { strict: false },
  );
}

export async function syncMemberSliderMapping({
  member,
  previousSliderComponentId = "",
  categoryName = "",
}) {
  const oldSliderId = toText(previousSliderComponentId);
  const currentSliderId = getCurrentMappedSlider(member);
  const memberId = toText(member?._id);
  if (!memberId) return;

  if (oldSliderId && oldSliderId !== currentSliderId) {
    await removeMemberFromSlider(oldSliderId, memberId);
  }

  if (currentSliderId && isTeamMemberMappingSupported(currentSliderId)) {
    await upsertMemberInSlider(currentSliderId, member, categoryName);
    return;
  }

  if (oldSliderId && !currentSliderId) {
    await removeMemberFromSlider(oldSliderId, memberId);
  }
}
