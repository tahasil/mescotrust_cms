const { getTitleAndColorsConfig } = require('../lib/titleAndColorsConfig.js');
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

const broken = [];
const working = [];

for (const name of components) {
  const cfg = getTitleAndColorsConfig(name);
  const alignItem = cfg?.titleListItems?.find(it => it.key === 'titleAlign');
  if (!alignItem) {
    broken.push({ name, reason: 'No titleAlign item in TitleAndColorsConfig' });
    continue;
  }
  const formFieldName = alignItem.name;

  const editFormPath = path.join('components/site', name, 'EditForm.js');
  if (!fs.existsSync(editFormPath)) {
    broken.push({ name, reason: 'EditForm.js does not exist' });
    continue;
  }
  const editContent = fs.readFileSync(editFormPath, 'utf8');

  const prefixMatch = editContent.match(/const PREFIX\s*=\s*["']([^"']+)["']/);
  const prefix = prefixMatch ? prefixMatch[1] : (MANAGE_SECTION_PREFIX_BY_COMPONENT_ID[name] || name.charAt(0).toLowerCase() + name.slice(1));

  // Simulate opening form with initial 'left'
  const initialData = { [formFieldName]: 'left', [`${prefix}TitleAlign`]: 'left', titleAlign: 'left' };
  const initialValues = getManageSectionInitialValues(prefix, initialData);

  // User changes form field to 'center'
  const formValues = { ...initialValues, [formFieldName]: 'center' };

  let payload = {};
  if (editContent.includes('getManageSectionPayload')) {
    payload = { ...getManageSectionPayload(prefix, formValues) };
  }

  // Check what titleAlign is in payload
  const resultAlign = payload[formFieldName] ?? payload[`${prefix}TitleAlign`] ?? payload.titleAlign;

  if (resultAlign !== 'center') {
    broken.push({
      name,
      prefix,
      formFieldName,
      resultAlign,
      reason: `Form field is '${formFieldName}'. User changed it to 'center', but getManageSectionPayload returned '${resultAlign}' because prefix is '${prefix}' and '${prefix}TitleAlign' was evaluated first!`
    });
  } else {
    working.push({ name, formFieldName, prefix });
  }
}

console.log('Broken components count:', broken.length);
console.log('Broken:', JSON.stringify(broken, null, 2));
console.log('\nWorking components count:', working.length);
