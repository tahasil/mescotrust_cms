/**
 * Site components: one file (or folder) per component.
 * Add new components here when you create them in components/site/.
 * Used for global components (header, footer) and for listing in admin.
 *
 * EDITABLE_SITE_EDIT_FORMS: map componentId -> EditForm component for page builder drawer.
 * Only components with edit flow (excluding Header/Footer) are listed.
 */
export { default as Header } from "./Header";
export { default as Footer } from "./Footer/index";
export { default as HomeHero, HomeHeroEditForm } from "./HomeHero/index";
export { default as Marquee, MarqueeEditForm } from "./Marquee/index";

import HomeHeroEditForm from "./HomeHero/EditForm";
import MarqueeEditForm from "./Marquee/EditForm";

/** componentId -> EditForm for page builder drawer. Add new editable site components here. */
export const EDITABLE_SITE_EDIT_FORMS = {
  HomeHero: HomeHeroEditForm,
  Marquee: MarqueeEditForm,
};
