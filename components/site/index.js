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
export { default as Volunteer, VolunteerEditForm } from "./Volunteer/index";
export { default as Cards, CardsEditForm } from "./Cards/index";
export { default as ContactUs, ContactUsEditForm } from "./ContactUs/index";
export { default as DonateNow, DonateNowEditForm } from "./DonateNow/index";
export { default as Careers, CareersEditForm } from "./Careers/index";
export { default as Alerts, AlertsEditForm } from "./Alerts/index";
export { default as Newsletters, NewslettersEditForm } from "./Newsletters/index";
export { default as DonorTestimonials, DonorTestimonialsEditForm } from "./DonorTestimonials/index";
export { default as StoriesSlider, StoriesSliderEditForm } from "./StoriesSlider/index";
export { default as Reports, ReportsEditForm } from "./Reports/index";
export { default as OverlayCards, OverlayCardsEditForm } from "./OverlayCards/index";
export { default as InMedia, InMediaEditForm } from "./InMedia/index";
export { default as Images, ImagesEditForm } from "./Images/index";
export { default as TitleParagraph, TitleParagraphEditForm } from "./TitleParagraph/index";
export { default as Videogallery, VideogalleryEditForm } from "./Videogallery/index";
export { default as PhotoGallery, PhotoGalleryEditForm } from "./PhotoGallery/index";
export { default as Accordion, AccordionEditForm } from "./Accordion/index";
export { default as ManagingCommittee, ManagingCommitteeEditForm } from "./ManagingCommittee/index";
export { default as CommitteeMembers, CommitteeMembersEditForm } from "./CommitteeMembers/index";
export { default as Mission, MissionEditForm } from "./Mission/index";
export { default as Vision, VisionEditForm } from "./Vision/index";
export { default as AimsObjectives, AimsObjectivesEditForm } from "./AimsObjectives/index";
export { default as Registered, RegisteredEditForm } from "./Registered/index";
export { default as Helpingpeople, HelpingpeopleEditForm } from "./Helpingpeople/index";
export { default as AnimationsText, AnimationsTextEditForm } from "./AnimationsText/index";
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
export { default as EventsSlider, EventsSliderEditForm } from "./EventsSlider/index";
export { default as ImageSlider, ImageSliderEditForm } from "./ImageSlider/index";
export { default as EventRegistrationForm, EventRegistrationFormEditForm } from "./EventRegistrationForm/index";
export { default as SocialMediaWall, SocialMediaWallEditForm } from "./SocialMediaWall/index";
// TSUV→MESCO Phase 5: reusable theme components ported into components/site/.
export { default as HighlightCardsGrid, HighlightCardsGridEditForm } from "./HighlightCardsGrid/index";
export { default as InfoStatsGrid, InfoStatsGridEditForm } from "./InfoStatsGrid/index";
export { default as JourneyTimeline, JourneyTimelineEditForm } from "./JourneyTimeline/index";
export { default as CallToActionBanner, CallToActionBannerEditForm } from "./CallToActionBanner/index";
export { default as Milestones, MilestonesEditForm } from "./Milestones/index";
export { default as MultiLevelMarquee, MultiLevelMarqueeEditForm } from "./MultiLevelMarquee/index";
export { default as MediaControl, MediaControlEditForm } from "./MediaControl/index";
export { default as VideoModalControl, VideoModalControlEditForm } from "./VideoModalControl/index";
import HomeHeroEditForm from "./HomeHero/EditForm";
import MarqueeEditForm from "./Marquee/EditForm";
import SubscribeEditForm from "./Subscribe/EditForm";
import VolunteerEditForm from "./Volunteer/EditForm";
import CardsEditForm from "./Cards/EditForm";
import CareersEditForm from "./Careers/EditForm";
import ContactUsEditForm from "./ContactUs/EditForm";
import DonateNowEditForm from "./DonateNow/EditForm";
import AlertsEditForm from "./Alerts/EditForm";
import NewslettersEditForm from "./Newsletters/EditForm";
import DonorTestimonialsEditForm from "./DonorTestimonials/EditForm";
import StoriesSliderEditForm from "./StoriesSlider/EditForm";
import ReportsEditForm from "./Reports/EditForm";
import OverlayCardsEditForm from "./OverlayCards/EditForm";
import InMediaEditForm from "./InMedia/EditForm";
import ImagesEditForm from "./Images/EditForm";
import TitleParagraphEditForm from "./TitleParagraph/EditForm";
import VideogalleryEditForm from "./Videogallery/EditForm";
import PhotoGalleryEditForm from "./PhotoGallery/EditForm";
import AccordionEditForm from "./Accordion/EditForm";
import ManagingCommitteeEditForm from "./ManagingCommittee/EditForm";
import CommitteeMembersEditForm from "./CommitteeMembers/EditForm";
import MissionEditForm from "./Mission/EditForm";
import VisionEditForm from "./Vision/EditForm";
import AimsObjectivesEditForm from "./AimsObjectives/EditForm";
import RegisteredEditForm from "./Registered/EditForm";
import HelpingpeopleEditForm from "./Helpingpeople/EditForm";
import AnimationsTextEditForm from "./AnimationsText/EditForm";
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
import EventsSliderEditForm from "./EventsSlider/EditForm";
import ImageSliderEditForm from "./ImageSlider/EditForm";
import EventRegistrationFormEditForm from "./EventRegistrationForm/EditForm";
import SocialMediaWallEditForm from "./SocialMediaWall/EditForm";
import HeaderEditForm from "./Header/EditForm";
import FooterEditForm from "./Footer/EditForm";
import HighlightCardsGridEditForm from "./HighlightCardsGrid/EditForm";
import InfoStatsGridEditForm from "./InfoStatsGrid/EditForm";
import JourneyTimelineEditForm from "./JourneyTimeline/EditForm";
import CallToActionBannerEditForm from "./CallToActionBanner/EditForm";
import MilestonesEditForm from "./Milestones/EditForm";
import MultiLevelMarqueeEditForm from "./MultiLevelMarquee/EditForm";
import MediaControlEditForm from "./MediaControl/EditForm";
import VideoModalControlEditForm from "./VideoModalControl/EditForm";
/** componentId -> EditForm for drawer (Admin → Components and Page Builder use same form). Add new editable site components here. */
export const EDITABLE_SITE_EDIT_FORMS = {
  HighlightCardsGrid: HighlightCardsGridEditForm,
  InfoStatsGrid: InfoStatsGridEditForm,
  JourneyTimeline: JourneyTimelineEditForm,
  CallToActionBanner: CallToActionBannerEditForm,
  Milestones: MilestonesEditForm,
  MultiLevelMarquee: MultiLevelMarqueeEditForm,
  MediaControl: MediaControlEditForm,
  VideoModalControl: VideoModalControlEditForm,
  Header: HeaderEditForm,
  Footer: FooterEditForm,
  HomeHero: HomeHeroEditForm,
  Marquee: MarqueeEditForm,
  Subscribe: SubscribeEditForm,
  Volunteer: VolunteerEditForm,
  Cards: CardsEditForm,
  LatestEvents1: LatestEvents1EditForm,
  EventsSlider: EventsSliderEditForm,
  Testimonials: TestimonialsEditForm,
  OverviewOfOurWork: OverviewOfOurWorkEditForm,
  HomeHero2: HomeHero2EditForm,
  WelcometoMESCO: WelcometoMESCOEditForm,
  VideoPlaying: VideoPlayingEditForm,
  Notices: NoticesEditForm,
  HelpingEvents: HelpingEventsEditForm,
  InnerPageHero: InnerPageHeroEditForm,
  ImpactShowcase: ImpactShowcaseEditForm,
  AnimationsText: AnimationsTextEditForm,
  Helpingpeople: HelpingpeopleEditForm,
  Registered: RegisteredEditForm,
  AimsObjectives: AimsObjectivesEditForm,
  Vision: VisionEditForm,
  Mission: MissionEditForm,
  CommitteeMembers: CommitteeMembersEditForm,
  ManagingCommittee: ManagingCommitteeEditForm,
  Accordion: AccordionEditForm,
  PhotoGallery: PhotoGalleryEditForm,
  Videogallery: VideogalleryEditForm,
  ImageSlider: ImageSliderEditForm,
  TitleParagraph: TitleParagraphEditForm,
  Images: ImagesEditForm,
  InMedia: InMediaEditForm,
  OverlayCards: OverlayCardsEditForm,
  Reports: ReportsEditForm,
  StoriesSlider: StoriesSliderEditForm,
  DonorTestimonials: DonorTestimonialsEditForm,
  Newsletters: NewslettersEditForm,
  Alerts: AlertsEditForm,
  Careers: CareersEditForm,
  ContactUs: ContactUsEditForm,
  DonateNow: DonateNowEditForm,
  EventRegistrationForm: EventRegistrationFormEditForm,
  SocialMediaWall: SocialMediaWallEditForm,
};
