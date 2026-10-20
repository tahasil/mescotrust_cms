const { getTitleAndColorsConfig } = require('../lib/titleAndColorsConfig.js');
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

const paraAudit = [];

for (const name of components) {
  const cfg = getTitleAndColorsConfig(name);
  const paraItem = cfg?.titleListItems?.find(it => it.key === 'paragraphAlign' || it.name?.toLowerCase().includes('paragraphalign'));

  const editFormPath = path.join('components/site', name, 'EditForm.js');
  const compPath = path.join('components/site', name, name + '.js');

  const editContent = fs.existsSync(editFormPath) ? fs.readFileSync(editFormPath, 'utf8') : '';
  const compContent = fs.existsSync(compPath) ? fs.readFileSync(compPath, 'utf8') : '';

  if (paraItem || editContent.includes('paragraphAlign') || compContent.includes('paragraphAlign') || compContent.includes('getParagraphAlign')) {
    paraAudit.push({
      name,
      configItem: paraItem ? { key: paraItem.key, name: paraItem.name, label: paraItem.label } : null,
      inEditForm: editContent.includes('paragraphAlign'),
      inComp: compContent.includes('paragraphAlign') || compContent.includes('getParagraphAlign'),
    });
  }
}

console.log('Components with paragraph alignment:', JSON.stringify(paraAudit, null, 2));
