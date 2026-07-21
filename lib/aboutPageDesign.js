const ABOUT_SLUG = "about-us/mesco-at-glance";
const ABOUT_CTA_PROPS = {
  ctaBannerTitle: "Be someone's *tomorrow.*",
  ctaBannerDonateText: "Donate Now",
  ctaBannerDonateLink: "/donate-now",
  ctaBannerDonateTarget: "_self",
  ctaBannerVolunteerText: "Become a Volunteer",
  ctaBannerVolunteerLink: "/about-us/volunteer",
  ctaBannerVolunteerTarget: "_self",
};

function findBlock(layout, baseComponent) {
  return layout.find((block) => block?.baseComponent === baseComponent);
}

function withOrder(block, order, props) {
  return { ...block, order, props: { ...(block?.props || {}), ...props } };
}

/**
 * Keeps the public About page on the approved Fable18 block composition while
 * legacy admin tabs may still contain the former AnimationsText/Vision/Mission
 * sequence. Source blocks remain stored and editable; this only normalizes the
 * published rendering until the idempotent DB migration is saved.
 */
export function normalizeAboutPageDesign(slug, rawLayout) {
  if (slug !== ABOUT_SLUG || !Array.isArray(rawLayout)) return rawLayout;
  const layout = [...rawLayout].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const hero = findBlock(layout, "InnerPageHero");
  const impact = findBlock(layout, "ImpactShowcase");
  const existingCombined = findBlock(layout, "MissionVision");
  const aims = findBlock(layout, "AimsObjectives");
  const people = findBlock(layout, "Helpingpeople");
  const registered = findBlock(layout, "Registered");
  const existingCta = findBlock(layout, "CTABanner");
  if (!hero || !impact || !aims || !people || !registered) return rawLayout;

  // Once the new blocks have been saved through Page Builder, keep every
  // drawer value intact and only enforce the approved public block order.
  if (existingCombined) {
    const modern = [
      withOrder(hero, 0, {}),
      withOrder(impact, 1, {}),
      withOrder(existingCombined, 2, {}),
      withOrder(aims, 3, {}),
      withOrder(people, 4, {}),
      withOrder(registered, 5, {}),
      withOrder(
        existingCta || {
          instanceId: "block_ctabanner_about",
          baseComponent: "CTABanner",
          props: ABOUT_CTA_PROPS,
        },
        6,
        {},
      ),
    ];
    return modern;
  }

  const missionVision = {
    instanceId: "block_missionvision_about",
    baseComponent: "MissionVision",
    props: {},
  };
  const blocks = [
    withOrder(hero, 0, {
      title: "MESCO at *a glance.*",
      breadcrumbItems: [{ label: "Home", href: "/" }, { label: "About Us", href: "" }],
    }),
    withOrder(impact, 1, {
      impactShowcaseSubTitle: "Who We Are",
      impactShowcaseMainTitle: "Education first, *then everything else.*",
      impactShowcaseBody1: "‘Education’ was identified as the core theme for human development, and the work later expanded to medical assistance and poverty relief. Well strategised schemes, programmes and institutions carry the mission.",
      impactShowcaseBody2: "The approach has always been to uphold ethical values in delivering, and to be a channel from those who want to give to those who need it most. MESCO is trusted by individuals, families, foundations, charities and corporates in India and abroad.",
      impactShowcaseStatValue: "15,000+",
      impactShowcaseStatLabel: "families touched every year",
      impactShowcaseImageDesktop: "https://mescotrust.org/assets/img/common/about.png",
      impactShowcaseImageMobile: "",
      impactShowcaseImageAlt: "MESCO: helping people live a better tomorrow",
      impactShowcaseSubTitleColorKey: "Primary",
      impactShowcaseTitleColorKey: "Black",
      impactShowcaseBodyColorKey: "Black Light",
      impactShowcaseStatValueColorKey: "Black",
      impactShowcaseStatLabelColorKey: "Black Muted",
    }),
    withOrder(missionVision, 2, {
      missionVisionSectionBgType: "default",
      missionVisionPageContainerBgType: "default",
      missionVisionVisionTitle: "Vision",
      missionVisionVisionDescription: "To help the underprivileged and marginalised live a better tomorrow through various interventions.",
      missionVisionMissionTitle: "Mission",
      missionVisionMissionDescription: "Strive to improve the quality of life of the financially disadvantaged by promoting meaningful education and health.",
      missionVisionCardBgColorKey: "Surface",
      missionVisionCardBorderColorKey: "Border",
      missionVisionIconColorKey: "Primary",
      missionVisionTitleColorKey: "Black",
      missionVisionTextColorKey: "Black Light",
    }),
    withOrder(aims, 3, {
      aimsObjectivesSubTitle: "Aims & Objectives",
      aimsObjectivesHeading: "What we *work toward.*",
      aimsObjectivesSubTitleColorKey: "Primary",
      aimsObjectivesHeadingColorKey: "Black",
      aimsObjectivesNumberColorKey: "Primary",
      aimsObjectivesBorderColorKey: "Border",
      aimsObjectivesItems: [
        { text: "Promote education amongst the weaker sections of society, including the promotion of science and literature." },
        { text: "Work for the social upliftment of the backward sections of society." },
        { text: "Bring about a better understanding and appreciation of universal cultural values." },
      ],
    }),
    withOrder(people, 4, {
      helpingpeopleSubTitle: "The People",
      helpingpeopleMainTitle: "A committee that *volunteers.*",
      helpingpeopleSubTitleColorKey: "Primary",
      helpingpeopleTitleColorKey: "Black",
      helpingpeopleTextColorKey: "Black Light",
      helpingpeopleParagraph: "<p>The Managing Committee comprises professionals who have devoted their lives to building a trusted name in humanitarian support. They volunteer alongside sub-committee members, some of whom were themselves touched by MESCO.</p><p>Portfolio committees review the work regularly, while day-to-day delivery rests with qualified professionals who identify with the mission. MESCO's openness, meticulous documentation and plan-do-review approach has earned deep respect in society.</p>",
      helpingpeopleImageDesktop: "https://mescotrust.org/uploads/104202310629672_1.jpg",
      helpingpeopleImageUrl: "https://mescotrust.org/uploads/104202310629672_1.jpg",
      helpingpeopleImageMobile: "",
      helpingpeopleImageAlt: "MESCO's impact in the community",
    }),
    withOrder(registered, 5, {
      registeredSubTitle: "Registered Under",
      registeredHeading: "Accountable, *by design.*",
      registeredSubTitleColorKey: "Primary",
      registeredHeadingColorKey: "Black",
      registeredCardBgColorKey: "Dark",
      registeredCardTextColorKey: "Cream",
      registeredIconColorKey: "Primary Soft",
      registeredItems: [
        { text: "The Societies Registration Act, 1860" },
        { text: "The Bombay Public Trust Act, 1950" },
        { text: "Section 80-G of the Income Tax Act, 1961" },
        { text: "Foreign Contribution Regulation Act (FCRA), 2010" },
      ],
    }),
    withOrder(
      {
        instanceId: "block_ctabanner_about",
        baseComponent: "CTABanner",
        props: ABOUT_CTA_PROPS,
      },
      6,
      {},
    ),
  ];
  return blocks;
}
