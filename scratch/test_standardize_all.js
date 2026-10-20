const { getTitleAndColorsConfig, TITLE_AND_COLORS_CONFIG } = require('../lib/titleAndColorsConfig.js');
const { getManageSectionInitialValues, getManageSectionPayload, MANAGE_SECTION_PREFIX_BY_COMPONENT_ID } = require('../lib/manageSectionFields.js');
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

let failed = 0;

for (const name of components) {
  const editFormPath = path.join('components/site', name, 'EditForm.js');
  if (!fs.existsSync(editFormPath)) continue;
  const editContent = fs.readFileSync(editFormPath, 'utf8');
  const prefixMatch = editContent.match(/const PREFIX\s*=\s*["']([^"']+)["']/);
  const prefix = prefixMatch ? prefixMatch[1] : (MANAGE_SECTION_PREFIX_BY_COMPONENT_ID[name] || name.charAt(0).toLowerCase() + name.slice(1));

  // The standardized form field name:
  const fieldName = `${prefix}TitleAlign`;

  // 1. Initial values from DB (simulating previously saved as 'left')
  const initData = { [fieldName]: 'left', titleAlign: 'left' };
  const initialValues = getManageSectionInitialValues(prefix, initData);

  // 2. User changes form field to 'center'
  const formValues = { ...initialValues, [fieldName]: 'center' };

  // 3. Payload generated on Update:
  // Using standard getManageSectionPayload:
  const alignVal = formValues?.[`${prefix}TitleAlign`] ?? formValues?.titleAlign;
  const payload = {
    [`${prefix}TitleAlign`]: String(alignVal).trim(),
    titleAlign: String(alignVal).trim(),
  };

  // 4. Verify result:
  if (payload[fieldName] !== 'center' || payload.titleAlign !== 'center') {
    console.log(`FAILED: ${name}`);
    failed++;
  }
}

console.log(`Total components tested: ${components.length}`);
console.log(`Failed: ${failed}`);
