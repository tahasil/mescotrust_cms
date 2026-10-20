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

for (const name of components) {
  const formPath = path.join('components/site', name, 'EditForm.js');
  if (!fs.existsSync(formPath)) {
    console.log(name, 'NO EditForm.js');
    continue;
  }
  const content = fs.readFileSync(formPath, 'utf8');
  const match = content.match(/defaultActiveKey=\{([^}]+)\}/);
  if (match) {
    console.log(name, 'defaultActiveKey =', match[1].replace(/\s+/g, ' '));
  } else if (content.includes('<Collapse')) {
    console.log(name, 'has <Collapse but no defaultActiveKey');
  } else {
    console.log(name, 'no <Collapse');
  }
}
