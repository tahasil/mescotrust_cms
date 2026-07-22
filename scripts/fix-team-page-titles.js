require("dotenv").config();
const { MongoClient } = require("mongodb");

const PAGE_UPDATES = {
  "about-us/managing-committee": {
    hero: {
      title: "The committee that *volunteers.*",
      description:
        "Professionals from diverse fields who give their time, expertise and judgement so that every rupee entrusted to MESCO works harder.",
      breadcrumbItems: [
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about-us/mesco-at-glance" },
        { label: "Managing Committee", href: "" },
      ],
    },
    committee: {
      committeeMembersSubTitle: "The People",
      committeeMembersMainTitle: "Guided by *experience.*",
    },
  },
  "about-us/our-team": {
    hero: {
      title: "The hands that *deliver.*",
      description:
        "Day-to-day delivery rests with qualified professionals who identify with the mission and carry it into classrooms, clinics and homes.",
      breadcrumbItems: [
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about-us/mesco-at-glance" },
        { label: "Our Team", href: "" },
      ],
    },
    committee: {
      committeeMembersSubTitle: "Senior Staff",
      committeeMembersMainTitle: "Professionals with a *purpose.*",
    },
  },
};

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  try {
    const pages = client.db().collection("pages");

    for (const [slug, updates] of Object.entries(PAGE_UPDATES)) {
      const result = await pages.updateOne(
        {
          slug,
          layout: {
            $all: [
              { $elemMatch: { baseComponent: "InnerPageHero" } },
              { $elemMatch: { baseComponent: "CommitteeMembers" } },
            ],
          },
        },
        {
          $set: {
            "layout.$[hero].props.title": updates.hero.title,
            "layout.$[hero].props.description": updates.hero.description,
            "layout.$[hero].props.breadcrumbItems": updates.hero.breadcrumbItems,
            "layout.$[committee].props.committeeMembersSubTitle":
              updates.committee.committeeMembersSubTitle,
            "layout.$[committee].props.committeeMembersMainTitle":
              updates.committee.committeeMembersMainTitle,
            updatedAt: new Date(),
          },
          $unset: {
            "layout.$[committee].props.committeeMembersTitleFontSize": "",
            "layout.$[committee].props.committeeMembersTitleFontWeight": "",
          },
        },
        {
          arrayFilters: [
            { "hero.baseComponent": "InnerPageHero" },
            { "committee.baseComponent": "CommitteeMembers" },
          ],
        },
      );

      if (result.matchedCount !== 1) {
        throw new Error(`Expected page blocks missing for ${slug}`);
      }
      console.log(`Updated page titles: ${slug}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
