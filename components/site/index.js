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
export { default as ImpactShowcase, ImpactShowcaseEditForm } from "./ImpactShowcase/index";
export { default as InnerPageHero, InnerPageHeroEditForm } from "./InnerPageHero/index";
export { default as HelpingEvents, HelpingEventsEditForm } from "./HelpingEvents/index";
export { default as Notices, NoticesEditForm } from "./Notices/index";
export { default as VideoPlaying, VideoPlayingEditForm } from "./VideoPlaying/index";
export { default as WelcometoMESCO, WelcometoMESCOEditForm } from "./WelcometoMESCO/index";
export { default as HomeHero2, HomeHero2EditForm } from "./HomeHero2/index";
export { default as OverviewOfOurWork, OverviewOfOurWorkEditForm } from "./OverviewOfOurWork/index";
export { default as Testimonials, TestimonialsEditForm } from "./Testimonials/index";
export { default as LatestEvents1, LatestEvents1EditForm } from "./LatestEvents1/index";
import HomeHeroEditForm from "./HomeHero/EditForm";
import MarqueeEditForm from "./Marquee/EditForm";
import SubscribeEditForm from "./Subscribe/EditForm";
import ImpactShowcaseEditForm from "./ImpactShowcase/EditForm";
import InnerPageHeroEditForm from "./InnerPageHero/EditForm";
import HelpingEventsEditForm from "./HelpingEvents/EditForm";
import NoticesEditForm from "./Notices/EditForm";
import VideoPlayingEditForm from "./VideoPlaying/EditForm";
import WelcometoMESCOEditForm from "./WelcometoMESCO/EditForm";
import HomeHero2EditForm from "./HomeHero2/EditForm";
import OverviewOfOurWorkEditForm from "./OverviewOfOurWork/EditForm";
import TestimonialsEditForm from "./Testimonials/EditForm";
import LatestEvents1EditForm from "./LatestEvents1/EditForm";
import HeaderEditForm from "./Header/EditForm";
import FooterEditForm from "./Footer/EditForm";
/** componentId -> EditForm for drawer (Admin → Components and Page Builder use same form). Add new editable site components here. */
export const EDITABLE_SITE_EDIT_FORMS = {
  Header: HeaderEditForm,
  Footer: FooterEditForm,
  HomeHero: HomeHeroEditForm,
  Marquee: MarqueeEditForm,
  Subscribe: SubscribeEditForm,
  LatestEvents1: LatestEvents1EditForm,
  Testimonials: TestimonialsEditForm,
  OverviewOfOurWork: OverviewOfOurWorkEditForm,
  HomeHero2: HomeHero2EditForm,
  WelcometoMESCO: WelcometoMESCOEditForm,
  VideoPlaying: VideoPlayingEditForm,
  Notices: NoticesEditForm,
  HelpingEvents: HelpingEventsEditForm,
  InnerPageHero: InnerPageHeroEditForm,
  ImpactShowcase: ImpactShowcaseEditForm,
};
