const { getTitleAndColorsConfig } = require('../lib/titleAndColorsConfig.js');
const { getManageSectionInitialValues, MANAGE_SECTION_PREFIX_BY_COMPONENT_ID } = require('../lib/manageSectionFields.js');
const fs = require('fs');
const path = require('path');

// Test the new getManageSectionPayload logic:
function testPayload(prefix, values, initialData) {
  let alignVal = values?.[`${prefix}TitleAlign`];
  const initial = initialData?.[`${prefix}TitleAlign`] ?? initialData?.titleAlign;

  if (values?.titleAlign != null && values.titleAlign !== initial) {
    alignVal = values.titleAlign;
  } else if (values?.[`${prefix}TitleAlign`] != null && values[`${prefix}TitleAlign`] !== initial) {
    alignVal = values[`${prefix}TitleAlign`];
  } else if (values?.marqueePartnersTitleAlign != null && values.marqueePartnersTitleAlign !== initial) {
    alignVal = values.marqueePartnersTitleAlign;
  } else {
    alignVal = alignVal ?? values?.titleAlign ?? values?.marqueePartnersTitleAlign;
  }

  return {
    [`${prefix}TitleAlign`]: alignVal,
    titleAlign: alignVal,
    ...(prefix === 'marquee' ? { marqueePartnersTitleAlign: alignVal } : {})
  };
}

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
  const cfg = getTitleAndColorsConfig(name);
  const alignItem = cfg?.titleListItems?.find(it => it.key === 'titleAlign');
  if (!alignItem) continue;
  const fieldName = alignItem.name;

  const editFormPath = path.join('components/site', name, 'EditForm.js');
  if (!fs.existsSync(editFormPath)) continue;
  const editContent = fs.readFileSync(editFormPath, 'utf8');
  const prefixMatch = editContent.match(/const PREFIX\s*=\s*["']([^"']+)["']/);
  const prefix = prefixMatch ? prefixMatch[1] : (MANAGE_SECTION_PREFIX_BY_COMPONENT_ID[name] || name.charAt(0).toLowerCase() + name.slice(1));

  const initData = { [fieldName]: 'left', [`${prefix}TitleAlign`]: 'left', titleAlign: 'left' };
  const initValues = getManageSectionInitialValues(prefix, initData);

  // User changes dropdown to 'center':
  const changedValues = { ...initValues, [fieldName]: 'center' };

  const payload = testPayload(prefix, changedValues, initData);
  const result = payload[fieldName] ?? payload[`${prefix}TitleAlign`] ?? payload.titleAlign;

  if (result !== 'center') {
    console.log(`FAILED: ${name} -> ${result}`);
    failed++;
  }
}

console.log(`Test completed. Failed: ${failed} out of ${components.length}`);
