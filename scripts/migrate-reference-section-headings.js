require("dotenv").config();
const { MongoClient } = require("mongodb");

const UPDATES = [
  ["about-us/awards-recognition", "Cards", 0, { subTitle: "Accreditation", mainTitle: "Credibility, certified.", cardsSubTitleEnabled: true, cardsTitleEnabled: true, cardsSubTitleColorKey: "Primary", cardsMainTitleColorKey: "Black" }],
  ["about-us/managing-committee", "CommitteeMembers", 0, { committeeMembersSubTitle: "The People", committeeMembersMainTitle: "Guided by *experience.*", committeeMembersSubTitleColorKey: "Primary", committeeMembersTitleColorKey: "Black" }],
  ["about-us/our-team", "CommitteeMembers", 0, { committeeMembersSubTitle: "Senior Staff", committeeMembersMainTitle: "Professionals with a *purpose.*", committeeMembersSubTitleColorKey: "Primary", committeeMembersTitleColorKey: "Black" }],
  ["get-involved/careers", "Careers", 0, { subTitle: "Open Positions", mainTitle: "We're hiring.", careersSubTitleEnabled: true, careersTitleEnabled: true, careersSubTitleColorKey: "Primary", titleColorKey: "Black" }],
  ["get-involved/csr", "Alerts", 0, { subTitle: "Recognition", mainTitle: "Certified, empanelled, awarded.", alertsSubTitleEnabled: true, alertsTitleEnabled: true, alertsSubTitleColorKey: "Primary", titleColorKey: "Black" }],
  ["get-involved/notices", "Notices", 0, { noticesTitleEnabled: true, noticesSubTitle: "Important Notices", noticesHeading: "Current announcements.", noticesHeadingAccent: "", noticesSubTitleColorKey: "Primary", noticesHeadingColorKey: "Black" }],
  ["impact/donor-testimonials-stories", "DonorTestimonials", 0, { subTitle: "Testimonials", mainTitle: "Trust, returned.", donorTestimonialsSubTitleEnabled: true, donorTestimonialsTitleEnabled: true, donorTestimonialsSubTitleColorKey: "Primary", titleColorKey: "Black" }],
  ["media/annual-reports", "Reports", 0, { subTitle: "Annual Reports", mainTitle: "Six years, open books.", reportsSubTitleEnabled: true, reportsTitleEnabled: true, reportsSubTitleColorKey: "Primary", titleColorKey: "Black" }],
  ["media/in-media", "InMedia", 0, { subTitle: "Press Clippings", mainTitle: "In print, on record.", inMediaSubTitleEnabled: true, inMediaTitleEnabled: true, inMediaSubTitleColorKey: "Primary", titleColorKey: "Black" }],
  ["media/newsletter", "Reports", 0, { subTitle: "Latest Issues", mainTitle: "Read the round-up.", reportsSubTitleEnabled: true, reportsTitleEnabled: true, reportsSubTitleColorKey: "Primary", titleColorKey: "Black" }],
  ["media/video-gallery", "Videogallery", 0, { videogallerySubTitle: "Video Gallery", videogalleryMainTitle: "Watch, *then act.*", videogallerySubTitleColorKey: "Primary", videogalleryTitleColorKey: "Black" }],
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const pages = client.db().collection("pages");
    for (const [slug, baseComponent, occurrence, props] of UPDATES) {
      const page = await pages.findOne({ slug });
      if (!page) { console.warn(`Skipped missing page: ${slug}`); continue; }
      let seen = 0;
      let changed = false;
      const layout = (page.layout || []).map((block) => {
        if (block.baseComponent !== baseComponent) return block;
        if (seen++ !== occurrence) return block;
        changed = true;
        return { ...block, props: { ...(block.props || {}), ...props } };
      });
      if (!changed) { console.warn(`Skipped missing block: ${slug} / ${baseComponent}`); continue; }
      await pages.updateOne({ _id: page._id }, { $set: { layout, updatedAt: new Date() } });
      console.log(`Updated ${slug} / ${baseComponent}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
