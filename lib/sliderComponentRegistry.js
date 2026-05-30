/**
 * Core slider components that belong to the Sliders admin module.
 */
export const CORE_SLIDER_COMPONENT_IDS = [
  "HomeHero",
  "ImageSlider",
  "StoriesSlider",
  "EventsSlider",
  "NewsFeedSlider",
];

export const CORE_SLIDER_LABELS = {
  HomeHero: "Home Hero",
  ImageSlider: "Circular Slider",
  StoriesSlider: "Stories Slider",
  EventsSlider: "Events Slider",
  NewsFeedSlider: "News Feed Slider",
};

/**
 * Core popup components that belong to the Popups admin module.
 */
export const CORE_POPUP_COMPONENT_IDS = ["MarketingPopup"];

export const CORE_POPUP_LABELS = {
  MarketingPopup: "Marketing Popup",
};

export function isCoreSliderComponentId(componentId) {
  return CORE_SLIDER_COMPONENT_IDS.includes((componentId || "").trim());
}

export function isCorePopupComponentId(componentId) {
  return CORE_POPUP_COMPONENT_IDS.includes((componentId || "").trim());
}

export function inferComponentModule(componentId, storedModule) {
  // A core slider/popup ID ALWAYS owns its module, even if a stale stored value
  // says otherwise. HomeHero predates the slider relocation (M7 moved its data to
  // the sliders collection but left SiteComponentMeta.module = "components"), so
  // trusting the stored value would mis-route it back to the components module.
  // Making the core check authoritative self-corrects without needing an M6 backfill.
  if (isCoreSliderComponentId(componentId)) return "sliders";
  if (isCorePopupComponentId(componentId)) return "popups";
  if (
    storedModule === "sliders" ||
    storedModule === "components" ||
    storedModule === "popups"
  ) {
    return storedModule;
  }
  return "components";
}
