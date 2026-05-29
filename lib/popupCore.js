import {
  CORE_POPUP_COMPONENT_IDS,
  CORE_POPUP_LABELS,
  getDefaultPopupProps,
} from "@/lib/popupConstants";

export async function ensureCorePopupsExist(PopupModel) {
  for (const componentId of CORE_POPUP_COMPONENT_IDS) {
    const displayName = CORE_POPUP_LABELS[componentId] || componentId;
    await PopupModel.findOneAndUpdate(
      { componentId },
      {
        $setOnInsert: {
          componentId,
          defaultProps: getDefaultPopupProps(),
          enabled: true,
          status: "draft",
        },
        $set: {
          isSystem: true,
          displayName,
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  }
}
