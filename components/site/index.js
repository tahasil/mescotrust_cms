/**
 * Site components: one file (or folder) per component.
 * EDITABLE_SITE_EDIT_FORMS: drawer content lives in component; PageBuilder only calls these.
 * PageBuilder → save to pages. Components edit page → save to components collection.
 */
export { default as Header, HeaderEditForm } from "./Header";
export { default as Footer, FooterEditForm } from "./Footer/index";
export { default as HomeHero, HomeHeroEditForm } from "./HomeHero/index";
export { default as Marquee, MarqueeEditForm } from "./Marquee/index";
export { default as Subscribe, SubscribeEditForm } from "./Subscribe/index";
export { default as Testimonials, TestimonialsEditForm } from "./Testimonials/index";
export { default as LatestEvents1, LatestEvents1EditForm } from "./LatestEvents1/index";
import HomeHeroEditForm from "./HomeHero/EditForm";
import MarqueeEditForm from "./Marquee/EditForm";
import SubscribeEditForm from "./Subscribe/EditForm";
import TestimonialsEditForm from "./Testimonials/EditForm";
import LatestEvents1EditForm from "./LatestEvents1/EditForm";
import HeaderEditForm from "./Header/EditForm";
import FooterEditForm from "./Footer/EditForm";
/** componentId -> EditForm for drawer. Add new editable site components here. */
export const EDITABLE_SITE_EDIT_FORMS = {
  Header: HeaderEditForm,
  Footer: FooterEditForm,
  HomeHero: HomeHeroEditForm,
  Marquee: MarqueeEditForm,
  Subscribe: SubscribeEditForm,
  LatestEvents1: LatestEvents1EditForm,
  Testimonials: TestimonialsEditForm,
};
