require("dotenv").config();
const { MongoClient } = require("mongodb");

const PAGE_SLUG = "about-us/good-governance";
const ACCORDION_ITEMS = [
  {
    label: "Board of Trustees",
    content:
      "The Board of Trustees set the vision and broad guidelines for the organisation and ensure good governance in liaison with the Advisory Board and various committees. The direction and control of the organisation is with the Board for social relevance, financial sustainability, monitoring and evaluation, and overall growth of the organisation.",
    imageDesktop: "/media/6a3660f0a2f58516de401ec8",
    imageMobile: "",
    imageAlt: "MESCO Board of Trustees",
  },
  {
    label: "Managing Committee",
    content:
      "Members of the Managing Committee are dedicated professionals and individuals from diverse backgrounds and experts in social engineering. They are involved in developing and reviewing policies and schemes with an aim to optimise resources for our beneficiaries. Strategic and operational matters are discussed among the members of the committee, which comprises 8 members. Detailed agendas and proceedings of these meetings are documented for future reference. The Managing Committee formulates the structure of authority and responsibilities, delegated to the concerned staff members of the organisation.",
    imageDesktop: "/media/6a366283a2f58516de4025c1",
    imageMobile: "",
    imageAlt: "MESCO Managing Committee",
  },
  {
    label: "Sub-Committee",
    content:
      "Sub-committee members work alongside the Managing Committee on specific schemes and programmes. Many were themselves once touched by MESCO's work, and bring both professional skill and lived experience to selection interviews, home visits and programme reviews.",
    imageDesktop: "",
    imageMobile: "",
    imageAlt: "",
  },
  {
    label: "Advisory Board",
    content:
      "Eminent well-wishers from medicine, law, education, finance and industry guide the trust on direction and standards. The Advisory Board works with the Board of Trustees to keep MESCO's work socially relevant and its governance sound.",
    imageDesktop: "",
    imageMobile: "",
    imageAlt: "",
  },
  {
    label: "Portfolio Committees",
    content:
      "Each area of work — education, medical aid, clinics, relief of poverty and fund-raising — is reviewed regularly by a dedicated portfolio committee, so that outcomes are measured, learnings are recorded and schemes keep improving.",
    imageDesktop: "",
    imageMobile: "",
    imageAlt: "",
  },
  {
    label: "Department",
    content:
      "Day-to-day delivery rests with departments run by qualified, full-time professionals — education, accounts, medical, clinics, CSR and fund-raising — each with clearly delegated authority and responsibility.",
    imageDesktop: "",
    imageMobile: "",
    imageAlt: "",
  },
  {
    label: "Management Process",
    content:
      "A plan-do-review cycle runs through the organisation: schemes are planned with clear criteria, delivered by staff and volunteers, and reviewed against documented outcomes. Meticulous documentation and audited accounts keep MESCO answerable to its donors and beneficiaries alike.",
    imageDesktop: "",
    imageMobile: "",
    imageAlt: "",
  },
];

const ACCORDION_PROPS = {
  accordionSubTitle: "How We Are Governed",
  accordionMainTitle: "Seven layers of *oversight.*",
  accordionDefaultOpenIndex: 0,
  accordionExpandIconUrl: "",
  accordionSubTitleColorKey: "Primary",
  accordionTitleColorKey: "Black",
  accordionTitleAccentColorKey: "Black",
  accordionHeaderColorKey: "Black",
  accordionContentColorKey: "Black Light",
  accordionContentStrongColorKey: "Black",
  accordionLinkColorKey: "Primary",
  accordionLinkHoverColorKey: "Primary Dark",
  accordionBgColorKey: "Transparent",
  accordionBorderColorKey: "Border",
  accordionIconColorKey: "Primary",
  accordionOpenIconColorKey: "Primary",
  accordionFocusColorKey: "Primary",
  accordionImageBgColorKey: "Surface",
  accordionImageBorderColorKey: "Border",
  accordionSectionBgType: "color",
  accordionSectionBgColorKey: "Cream",
  accordionItems: ACCORDION_ITEMS,
};

function withoutPageContainerProps(props) {
  const next = { ...(props || {}) };
  Object.keys(next).forEach((key) => {
    if (key.startsWith("accordionPageContainer")) delete next[key];
  });
  return next;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const pages = client.db().collection("pages");
    const page = await pages.findOne({ slug: PAGE_SLUG });
    if (!page) throw new Error(`Page not found: ${PAGE_SLUG}`);

    let changed = false;
    const layout = (page.layout || []).map((block) => {
      if (block.baseComponent !== "Accordion" || changed) return block;
      changed = true;
      return {
        ...block,
        props: withoutPageContainerProps({
          ...(block.props || {}),
          ...ACCORDION_PROPS,
        }),
      };
    });
    if (!changed) throw new Error(`Accordion block not found: ${PAGE_SLUG}`);

    await pages.updateOne(
      { _id: page._id },
      { $set: { layout, updatedAt: new Date() } },
    );
    await client.db().collection("components").updateMany(
      { baseComponent: "Accordion" },
      {
        $set: {
          defaultProps: withoutPageContainerProps(ACCORDION_PROPS),
          updatedAt: new Date(),
        },
      },
    );
    console.log(`Updated ${PAGE_SLUG} Accordion with ${ACCORDION_ITEMS.length} panels.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
