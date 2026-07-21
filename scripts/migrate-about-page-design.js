require("dotenv").config();
const { MongoClient } = require("mongodb");

const PAGE_SLUG = "about-us/mesco-at-glance";
const DEFAULT_MISSION_VISION = {
  missionVisionSectionBgType: "default",
  missionVisionSectionBgImage: "",
  missionVisionSectionBgColorKey: "",
  missionVisionPageContainerBgType: "default",
  missionVisionPageContainerBgImage: "",
  missionVisionPageContainerBgColorKey: "",
  missionVisionVisionTitle: "Vision",
  missionVisionVisionDescription: "To help the underprivileged and marginalised live a better tomorrow through various interventions.",
  missionVisionMissionTitle: "Mission",
  missionVisionMissionDescription: "Strive to improve the quality of life of the financially disadvantaged by promoting meaningful education and health.",
  missionVisionCardBgColorKey: "Surface",
  missionVisionCardBorderColorKey: "Border",
  missionVisionIconColorKey: "Primary",
  missionVisionTitleColorKey: "Black",
  missionVisionTextColorKey: "Black Light",
  _disableFadeAnimation: false,
};

function blockBy(layout, component) {
  return layout.find((block) => block.baseComponent === component);
}

function pageBlock(source, baseComponent, order, props) {
  return {
    ...(source || {}),
    instanceId: source?.instanceId || `block_${baseComponent.toLowerCase()}_about`,
    baseComponent,
    order,
    props,
  };
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db();
    const pages = db.collection("pages");
    const page = await pages.findOne({ slug: PAGE_SLUG });
    if (!page) throw new Error(`Page not found: ${PAGE_SLUG}`);
    const layout = Array.isArray(page.layout) ? [...page.layout] : [];
    const hero = blockBy(layout, "InnerPageHero");
    const impact = blockBy(layout, "ImpactShowcase");
    const aims = blockBy(layout, "AimsObjectives");
    const people = blockBy(layout, "Helpingpeople");
    const registered = blockBy(layout, "Registered");
    const shortcode = blockBy(layout, "ShortCode");
    if (!hero || !impact || !aims || !people || !registered) {
      throw new Error("The About page is missing one or more expected source blocks");
    }

    const impactProps = {
      ...impact.props,
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
    };
    const missionVisionProps = {
      ...DEFAULT_MISSION_VISION,
      missionVisionVisionTitle: "Vision",
      missionVisionVisionDescription: "To help the underprivileged and marginalised live a better tomorrow through various interventions.",
      missionVisionMissionTitle: "Mission",
      missionVisionMissionDescription: "Strive to improve the quality of life of the financially disadvantaged by promoting meaningful education and health.",
    };
    const aimsProps = {
      ...aims.props,
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
    };
    const peopleProps = {
      ...people.props,
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
    };
    const registeredProps = {
      ...registered.props,
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
    };
    const heroProps = {
      ...hero.props,
      title: "MESCO at *a glance.*",
      breadcrumbItems: [
        { label: "Home", href: "/" },
        { label: "About Us", href: "" },
      ],
    };
    const nextLayout = [
      pageBlock(hero, "InnerPageHero", 0, heroProps),
      pageBlock(impact, "ImpactShowcase", 1, impactProps),
      pageBlock(null, "MissionVision", 2, missionVisionProps),
      pageBlock(aims, "AimsObjectives", 3, aimsProps),
      pageBlock(people, "Helpingpeople", 4, peopleProps),
      pageBlock(registered, "Registered", 5, registeredProps),
      ...(shortcode ? [pageBlock(shortcode, "ShortCode", 6, shortcode.props)] : []),
    ];

    await pages.updateOne({ _id: page._id }, { $set: { layout: nextLayout, updatedAt: new Date() } });
    const components = db.collection("components");
    await components.updateOne(
      { baseComponent: "MissionVision" },
      {
        $set: { name: "MissionVision", displayName: "Mission & Vision", type: "custom", category: "content", active: true, updatedAt: new Date() },
        $setOnInsert: { baseComponent: "MissionVision", defaultProps: DEFAULT_MISSION_VISION, propsSchema: [], layout: [], createdAt: new Date() },
      },
      { upsert: true },
    );
    await db.collection("sitecomponentmetas").updateOne(
      { componentId: "MissionVision" },
      { $set: { displayName: "Mission & Vision", enabled: true, global: false, position: "after", updatedAt: new Date() }, $setOnInsert: { componentId: "MissionVision", createdAt: new Date() } },
      { upsert: true },
    );
    console.log(`Updated ${PAGE_SLUG}: ${nextLayout.map((block) => block.baseComponent).join(" > ")}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
