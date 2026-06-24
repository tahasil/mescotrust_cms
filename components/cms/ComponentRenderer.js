import ParagraphBlock from "@/components/cms/blocks/Paragraph";
import HeadingBlock from "@/components/cms/blocks/Heading";
import ImageBlock from "@/components/cms/blocks/Image";
import ButtonsBlock from "@/components/cms/blocks/Buttons";
import SpacerBlock from "@/components/cms/blocks/Spacer";
import ColumnsBlock from "@/components/cms/blocks/Columns";
import ListBlock from "@/components/cms/blocks/List";
import QuoteBlock from "@/components/cms/blocks/Quote";
import CodeSnippetBlock from "@/components/cms/blocks/CodeSnippet";
import GalleryBlock from "@/components/cms/blocks/Gallery";
import VideoBlock from "@/components/cms/blocks/Video";
import FileDownloadBlock from "@/components/cms/blocks/FileDownload";
import CoverBlock from "@/components/cms/blocks/Cover";
import CallToActionBlock from "@/components/cms/blocks/CallToAction";
import EmbedBlock from "@/components/cms/blocks/Embed";
import BreadcrumbsBlock from "@/components/cms/blocks/Breadcrumbs";
import CardBlock from "@/components/cms/blocks/Card";
import CardGridBlock from "@/components/cms/blocks/CardGrid";
import AccordionBlock from "@/components/cms/blocks/Accordion";
import TabsBlock from "@/components/cms/blocks/Tabs";
import HeroBlock from "@/components/cms/blocks/Hero";
import StatsBlock from "@/components/cms/blocks/Stats";
import TestimonialBlock from "@/components/cms/blocks/Testimonial";
import PricingBlock from "@/components/cms/blocks/Pricing";
import TeamBlock from "@/components/cms/blocks/Team";
import TimelineBlock from "@/components/cms/blocks/Timeline";
import AlertBlock from "@/components/cms/blocks/Alert";
import IconBoxBlock from "@/components/cms/blocks/IconBox";
import SliderBlock from "@/components/cms/blocks/Slider";
import ModalBlock from "@/components/cms/blocks/Modal";
import SocialLinksBlock from "@/components/cms/blocks/SocialLinks";
import DividerBlock from "@/components/cms/blocks/Divider";
import TableBlock from "@/components/cms/blocks/Table";
import FeatureGridBlock from "@/components/cms/blocks/FeatureGrid";
import HeaderBlock from "@/components/cms/blocks/Header";
import FooterBlock from "@/components/cms/blocks/Footer";
import SectionBlock from "@/components/cms/blocks/Section";
import AntButtonBlock from "@/components/cms/blocks/antd/AntButton";
import AntCardBlock from "@/components/cms/blocks/antd/AntCard";
import AntInputBlock from "@/components/cms/blocks/antd/AntInput";
import AntDividerBlock from "@/components/cms/blocks/antd/AntDivider";
import AntAlertBlock from "@/components/cms/blocks/antd/AntAlert";
import AntTypographyBlock from "@/components/cms/blocks/antd/AntTypography";
import AntSpaceBlock from "@/components/cms/blocks/antd/AntSpace";
import * as SiteComponents from "@/components/site/publicComponents";
import { PageContainer } from "@/styles/Theme";
import FadeInSection from "@/components/cms/FadeInSection";

const COMPONENT_MAP = {
  Paragraph: ParagraphBlock,
  Heading: HeadingBlock,
  Image: ImageBlock,
  Buttons: ButtonsBlock,
  Spacer: SpacerBlock,
  Columns: ColumnsBlock,
  List: ListBlock,
  Quote: QuoteBlock,
  CodeSnippet: CodeSnippetBlock,
  Gallery: GalleryBlock,
  Video: VideoBlock,
  FileDownload: FileDownloadBlock,
  Cover: CoverBlock,
  CallToAction: CallToActionBlock,
  Embed: EmbedBlock,
  Breadcrumbs: BreadcrumbsBlock,
  Card: CardBlock,
  CardGrid: CardGridBlock,
  Accordion: AccordionBlock,
  Tabs: TabsBlock,
  Hero: HeroBlock,
  Stats: StatsBlock,
  Testimonial: TestimonialBlock,
  Pricing: PricingBlock,
  Team: TeamBlock,
  Timeline: TimelineBlock,
  Alert: AlertBlock,
  IconBox: IconBoxBlock,
  Slider: SliderBlock,
  Modal: ModalBlock,
  SocialLinks: SocialLinksBlock,
  Divider: DividerBlock,
  Table: TableBlock,
  FeatureGrid: FeatureGridBlock,
  Header: HeaderBlock,
  Footer: FooterBlock,
  Section: SectionBlock,
  AntButton: AntButtonBlock,
  AntCard: AntCardBlock,
  AntInput: AntInputBlock,
  AntDivider: AntDividerBlock,
  AntAlert: AntAlertBlock,
  AntTypography: AntTypographyBlock,
  AntSpace: AntSpaceBlock,
};

// Register site components (e.g. HeroBanner) so blocks added from Admin → Components render on the frontend.
// Site components take priority over CMS block components when names collide.
Object.entries(SiteComponents || {}).forEach(([name, Comp]) => {
  if (Comp) COMPONENT_MAP[name] = Comp;
});

const SECTION_PROPS = [
  "_containerType",
  "_sectionBg",
  "_sectionPadding",
  "_sectionBorderSize",
  "_sectionBorderStyle",
  "_sectionBorderColor",
  "_sectionShadow",
];

/** Legacy: AwardsRecognition was renamed to OverviewOfOurWork. Map old prop keys to new. */
const AWARDS_TO_OVERVIEW_PROP_KEYS = {
  awardsRecognitionItems: "overviewOfOurWorkItems",
  awardsRecognitionSectionBgType: "overviewOfOurWorkSectionBgType",
  awardsRecognitionSectionBgImage: "overviewOfOurWorkSectionBgImage",
  awardsRecognitionSectionBgColorKey: "overviewOfOurWorkSectionBgColorKey",
  awardsRecognitionSectionPaddingTop: "overviewOfOurWorkSectionPaddingTop",
  awardsRecognitionSectionPaddingBottom: "overviewOfOurWorkSectionPaddingBottom",
  awardsRecognitionSectionMarginTop: "overviewOfOurWorkSectionMarginTop",
  awardsRecognitionSectionMarginBottom: "overviewOfOurWorkSectionMarginBottom",
  awardsRecognitionPageContainerBgType: "overviewOfOurWorkPageContainerBgType",
  awardsRecognitionPageContainerBgImage: "overviewOfOurWorkPageContainerBgImage",
  awardsRecognitionPageContainerBgColorKey: "overviewOfOurWorkPageContainerBgColorKey",
  awardsRecognitionPageContainerPaddingTop: "overviewOfOurWorkPageContainerPaddingTop",
  awardsRecognitionPageContainerPaddingRight: "overviewOfOurWorkPageContainerPaddingRight",
  awardsRecognitionPageContainerPaddingBottom: "overviewOfOurWorkPageContainerPaddingBottom",
  awardsRecognitionPageContainerPaddingLeft: "overviewOfOurWorkPageContainerPaddingLeft",
  awardsRecognitionPageContainerMarginTop: "overviewOfOurWorkPageContainerMarginTop",
  awardsRecognitionPageContainerMarginBottom: "overviewOfOurWorkPageContainerMarginBottom",
  awardsRecognitionCardTitleColorKey: "overviewOfOurWorkCardTitleColorKey",
  awardsRecognitionCardBorderColorKey: "overviewOfOurWorkCardBorderColorKey",
  awardsRecognitionButtonColorKey: "overviewOfOurWorkButtonColorKey",
  awardsRecognitionIconHoverColorKey: "overviewOfOurWorkIconHoverColorKey",
  awardsRecognitionHoverColorKey: "overviewOfOurWorkHoverColorKey",
};

function normalizePropsForOverviewOfOurWork(props) {
  if (!props || typeof props !== "object") return props;
  const out = { ...props };
  for (const [oldK, newK] of Object.entries(AWARDS_TO_OVERVIEW_PROP_KEYS)) {
    if (oldK in out && !(newK in out)) {
      out[newK] = out[oldK];
    }
  }
  return out;
}

/** Site components that must not be wrapped in PageContainer so their background can be full viewport width. */
const FULL_BLEED_SITE_COMPONENTS = ["HomeHero", "HomeHero2", "Marquee", "Subscribe"];

/** Components that should NOT get the FadeInSection scroll animation. */
const NO_FADE_COMPONENTS = ["Header", "Footer", "HomeHero"];

function extractSectionProps(props) {
  const section = {};
  const clean = {};
  for (const [k, v] of Object.entries(props || {})) {
    if (SECTION_PROPS.includes(k)) {
      section[k] = v;
    } else {
      clean[k] = v;
    }
  }
  return { section, clean };
}

function UnavailableBlock({ baseComponent }) {
  return (
    <div
      style={{
        padding: "1rem",
        background: "#f5f5f5",
        color: "#666",
        borderRadius: 4,
      }}
    >
      Unavailable block: {baseComponent || "unknown"}
    </div>
  );
}

/**
 * Renders page layout from the pages collection only.
 * layout = page.layout (blocks with baseComponent, props, order). All block content comes from block.props (page document).
 */
export default function ComponentRenderer({
  layout,
  wrapperContainer,
  onElementClick,
}) {
  if (!Array.isArray(layout) || layout.length === 0) return null;

  const sorted = [...layout].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const wrapperClass =
    wrapperContainer === "container-fluid"
      ? "cms-container-fluid"
      : wrapperContainer === "container"
        ? "cms-container"
        : null;

  const content = (
    <div className="cms-layout">
      {sorted.map((block) => {
        let baseComponent =
          block.baseComponent ||
          (block.componentId &&
            typeof block.componentId === "object" &&
            block.componentId.baseComponent) ||
          "Paragraph";
        let allProps = block.props || {};
        if (baseComponent === "AwardsRecognition") {
          baseComponent = "OverviewOfOurWork";
          allProps = normalizePropsForOverviewOfOurWork(allProps);
        }
        const Component = COMPONENT_MAP[baseComponent];
        const key =
          block.instanceId ||
          block._id?.toString() ||
          Math.random().toString(36);

        const { section, clean } = extractSectionProps(allProps);
        const sectionBg = section._sectionBg || "";
        const sectionPadding = section._sectionPadding || "";
        const sectionBorderSize = section._sectionBorderSize || "";
        const sectionBorderStyle = section._sectionBorderStyle || "solid";
        const sectionBorderColor = section._sectionBorderColor || "";
        const sectionShadow = section._sectionShadow || "";

        if (!Component) {
          return <UnavailableBlock key={key} baseComponent={baseComponent} />;
        }

        const sectionStyle = {};
        if (sectionBg) sectionStyle.background = sectionBg;
        if (sectionPadding) sectionStyle.padding = sectionPadding;
        const borderSizeTrimmed = String(sectionBorderSize || "").trim();
        const borderParts = borderSizeTrimmed
          ? borderSizeTrimmed.split(/[\s,]+/).filter(Boolean)
          : [];
        const isAllZeroBorder =
          borderParts.length === 0 ||
          borderParts.every((p) => /^0(px|em|rem)?$/i.test(p.trim()));
        const hasBorderSize = borderSizeTrimmed && !isAllZeroBorder;
        if (
          hasBorderSize ||
          (sectionBorderStyle &&
            sectionBorderStyle !== "none" &&
            sectionBorderColor)
        ) {
          if (hasBorderSize) sectionStyle.borderWidth = borderSizeTrimmed;
          sectionStyle.borderStyle =
            sectionBorderStyle === "none"
              ? "solid"
              : sectionBorderStyle || "solid";
          sectionStyle.borderColor = sectionBorderColor || "currentColor";
          if (!hasBorderSize) sectionStyle.borderWidth = "1px";
        }
        if (sectionShadow) sectionStyle.boxShadow = sectionShadow;

        const hasSectionStyle =
          sectionBg ||
          sectionPadding ||
          (sectionBorderSize && sectionBorderSize !== "0") ||
          (sectionBorderStyle &&
            sectionBorderStyle !== "none" &&
            sectionBorderColor) ||
          sectionShadow;

        const elementClickProp = onElementClick
          ? {
              onElementClick: (elementKey) =>
                onElementClick(block.instanceId, elementKey),
            }
          : {};

        const isFullBleed = FULL_BLEED_SITE_COMPONENTS.includes(baseComponent);
        const useFade = !NO_FADE_COMPONENTS.includes(baseComponent) && allProps._disableFadeAnimation !== true;

        if (isFullBleed) {
          const inner = (
            <div key={key} className="cms-full-bleed" style={{ width: "100%" }}>
              <Component {...clean} {...elementClickProp} />
            </div>
          );
          return useFade ? <FadeInSection key={key}>{inner}</FadeInSection> : inner;
        }

        // section (data-component) > PageContainer > component for every block
        const sectionClassName = `site-component-${String(baseComponent).toLowerCase()}`;
        const inner = (
          <section
            key={key}
            className={sectionClassName}
            data-component={baseComponent}
            style={hasSectionStyle ? sectionStyle : undefined}
          >
            <>
              <Component {...clean} {...elementClickProp} />
            </>
          </section>
        );
        return useFade ? <FadeInSection key={key}>{inner}</FadeInSection> : inner;
      })}
    </div>
  );

  if (wrapperClass) {
    return <div className={wrapperClass}>{content}</div>;
  }
  return content;
}
