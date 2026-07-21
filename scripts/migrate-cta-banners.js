require("dotenv").config();
const { MongoClient } = require("mongodb");

const DEFAULTS = {
  ctaBannerTitle: "Be someone's *tomorrow.*",
  ctaBannerDonateText: "Donate Now",
  ctaBannerDonateLink: "/donate-now",
  ctaBannerDonateTarget: "_self",
  ctaBannerVolunteerText: "Become a Volunteer",
  ctaBannerVolunteerLink: "/about-us/volunteer",
  ctaBannerVolunteerTarget: "_self",
};

const PAGE_CTA = {
  "about-us/mesco-at-glance": ["Be someone's *tomorrow.*", "Donate Now", "/donate-now"],
  "about-us/awards-recognition": ["Back a trust *you can trust.*", "Donate Now", "/donate-now"],
  "about-us/good-governance": ["Give with *confidence.*", "Donate Now", "/donate-now"],
  "about-us/managing-committee": ["Serve alongside *them.*", "Become a Volunteer", "/about-us/volunteer"],
  "about-us/our-team": ["Work that *means more.*", "See Open Roles", "/get-involved/careers"],
  "about-us/volunteer": ["Prefer to give *another way?*", "Donate Now", "/donate-now"],
  "donate-now": ["Ready when *you are.*", "Proceed to Donate", "https://mesco-demo.aiolos.cloud/donate-now"],
  "get-involved/careers": ["Do your best work *here.*", "Apply via Contact", "/get-involved/contact-us"],
  "get-involved/contact-us": ["Rather just *give?*", "Donate Now", "/donate-now"],
  "get-involved/csr": ["Make your mandate *matter.*", "Talk to Us", "/get-involved/contact-us"],
  "get-involved/notices": ["Questions about a *notice?*", "Contact Us", "/get-involved/contact-us"],
  "impact/donor-testimonials-stories": ["Join *them.*", "Donate Now", "/donate-now"],
  "impact/success-stories": ["Start someone's *story.*", "Donate Now", "/donate-now"],
  "media/annual-reports": ["Fund the next *chapter.*", "Donate Now", "/donate-now"],
  "media/image-gallery": ["Be part of the *next moment.*", "Donate Now", "/donate-now"],
  "media/in-media": ["Make the next *headline.*", "Donate Now", "/donate-now"],
  "media/newsletter": ["Be in the next *issue.*", "Donate Now", "/donate-now"],
  "media/video-gallery": ["Seen enough to *believe?*", "Donate Now", "/donate-now"],
  "our-works/clinics-dispensaries": ["Keep the clinic *doors open.*", "Support the Clinics", "/donate-now"],
  "our-works/educational-support": ["Keep a student *in the classroom.*", "Sponsor a Scholarship", "/donate-now"],
  "our-works/medical-aid": ["Fund a *recovery.*", "Sponsor Medical Aid", "/donate-now"],
  "our-works/old-newspaper-units": ["Old news, *new beginnings.*", "Donate Now", "/donate-now"],
  "our-works/relief-of-poverty": ["Put food on *a table.*", "Sponsor a Family", "/donate-now"],
  "our-works/school-adoption": ["Adopt a student's *school year.*", "Sponsor a Student", "/donate-now"],
  "our-works/event-registration": ["Be part of the *next one.*", "Donate Now", "/donate-now"],
  "privacy-policy": ["Support work that *matters.*", "Donate Now", "/donate-now"],
  "refund-cancellation-policy": ["Help build a better *tomorrow.*", "Donate Now", "/donate-now"],
};

const isSubscribeShortCode = (block) =>
  block?.baseComponent === "ShortCode" &&
  /\[shortcode=["']Subscribe["']\]/i.test(String(block?.props?.shortcode || ""));

function propsFor(slug) {
  const [title, donateText, donateLink] = PAGE_CTA[slug];
  return {
    ...DEFAULTS,
    ctaBannerTitle: title,
    ctaBannerDonateText: donateText,
    ctaBannerDonateLink: donateLink,
  };
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db();
    const pages = db.collection("pages");
    const homeBefore = await pages.findOne({ slug: "home" }, { projection: { layout: 1, updatedAt: 1 } });
    const records = await pages.find({ slug: { $in: Object.keys(PAGE_CTA) } }).toArray();
    let updated = 0;

    for (const page of records) {
      const layout = Array.isArray(page.layout) ? page.layout : [];
      const existing = layout.find((block) => block?.baseComponent === "CTABanner");
      const retained = layout.filter(
        (block) => block?.baseComponent !== "CTABanner" && !isSubscribeShortCode(block),
      );
      const cta = {
        ...(existing || {}),
        instanceId:
          existing?.instanceId ||
          `block_ctabanner_${page.slug.replace(/[^a-z0-9]+/gi, "_")}`,
        baseComponent: "CTABanner",
        order: retained.length,
        props: existing?.props || propsFor(page.slug),
      };
      const nextLayout = [
        ...retained.map((block, order) => ({ ...block, order })),
        cta,
      ];
      await pages.updateOne(
        { _id: page._id },
        { $set: { layout: nextLayout, updatedAt: new Date() } },
      );
      updated += 1;
    }

    await db.collection("components").updateOne(
      { baseComponent: "CTABanner" },
      {
        $set: {
          name: "CTABanner",
          displayName: "CTA Banner",
          type: "custom",
          category: "content",
          active: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          baseComponent: "CTABanner",
          defaultProps: DEFAULTS,
          propsSchema: [],
          layout: [],
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    await db.collection("sitecomponentmetas").updateOne(
      { componentId: "CTABanner" },
      {
        $set: {
          displayName: "CTA Banner",
          enabled: true,
          global: false,
          position: "after",
          updatedAt: new Date(),
        },
        $setOnInsert: { componentId: "CTABanner", createdAt: new Date() },
      },
      { upsert: true },
    );

    const homeAfter = await pages.findOne({ slug: "home" }, { projection: { layout: 1, updatedAt: 1 } });
    if (JSON.stringify(homeBefore) !== JSON.stringify(homeAfter)) {
      throw new Error("Home page guard failed: Home changed during CTA migration");
    }
    console.log(`CTA Banner registered; updated ${updated} inner pages; Home unchanged.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
