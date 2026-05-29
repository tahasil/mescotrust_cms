export { default as HomeHero, HomeHeroEditForm } from "./HomeHero";
export { default as CircularSlider, CircularSliderEditForm } from "./CircularSlider";
export { default as StoriesSlider, StoriesSliderEditForm } from "./StoriesSlider";
export { default as EventsSlider, EventsSliderEditForm } from "./EventsSlider";
export { default as NewsFeedSlider, NewsFeedSliderEditForm } from "./NewsFeedSlider";

// Backward-compatible alias used by site component registry/component IDs.
export {
  default as ImageSlider,
  CircularSliderEditForm as ImageSliderEditForm,
} from "./CircularSlider";
