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
  HomeHero: "HomeHero",
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
  if (
    storedModule === "sliders" ||
    storedModule === "components" ||
    storedModule === "popups"
  ) {
    return storedModule;
  }
  if (isCoreSliderComponentId(componentId)) return "sliders";
  if (isCorePopupComponentId(componentId)) return "popups";
  return "components";
}
