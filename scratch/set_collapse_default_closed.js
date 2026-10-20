const fs = require('fs');
const path = require('path');

const components = [
  'Accordion', 'AimsObjectives', 'Alerts', 'Cards', 'Cards1',
  'Careers', 'CareersUpload', 'DonorTestimonials', 'Helpingpeople', 'Images',
  'ImpactShowcase', 'InMedia', 'Internshiplifecycle', 'LatestNews', 'LeaveusamessageModal',
  'ManagingCommittee', 'Marquee', 'Mission', 'Newsletters', 'Notices',
  'OverlayCards', 'OverviewOfOurWork', 'PhotoGallery', 'Registered', 'Reports',
  'SectionIntro', 'ShortCode', 'TitleParagraph', 'Videogallery', 'VideoPlaying',
  'Vision', 'WelcometoMESCO', 'OurImpact', 'VolunteerMesco', 'MissionVision',
  'LatestImageGallery', 'SocialMediaWall', 'EventsListing', 'EventRegistrationForm', 'SocialWallFeed',
  'FormEmbed', 'TeamEmbed', 'TimelineTrack'
];

let updatedCount = 0;

for (const name of components) {
  const formPath = path.join('components/site', name, 'EditForm.js');
  if (!fs.existsSync(formPath)) continue;

  let content = fs.readFileSync(formPath, 'utf8');
  let changed = false;

  // 1. Replace defaultActiveKey={[...]} with defaultActiveKey={[]}
  if (/defaultActiveKey=\{[^}]+\}/s.test(content)) {
    content = content.replace(/defaultActiveKey=\{[^}]+\}/s, 'defaultActiveKey={[]}');
    changed = true;
  }

  // 2. Ensure destroyInactivePanel={false} on <Collapse
  if (content.includes('<Collapse') && !content.includes('destroyInactivePanel=')) {
    content = content.replace(/<Collapse(\s+)/, '<Collapse$1destroyInactivePanel={false}$1');
    changed = true;
  }

  // 3. Ensure preserve={true} on <Form
  if (content.includes('<Form') && !content.includes('preserve=')) {
    content = content.replace(/<Form(\s+)/, '<Form$1preserve={true}$1');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(formPath, content, 'utf8');
    updatedCount++;
    console.log(`Updated ${name}`);
  }
}

console.log(`Total updated: ${updatedCount}`);
