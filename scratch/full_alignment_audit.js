const fs = require('fs');
const path = require('path');
const { getTitleAndColorsConfig } = require('../lib/titleAndColorsConfig.js');
const { getManageSectionInitialValues, getManageSectionPayload, MANAGE_SECTION_PREFIX_BY_COMPONENT_ID } = require('../lib/manageSectionFields.js');

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

const results = [];

for (const name of components) {
  const cfg = getTitleAndColorsConfig(name);
  const titleAlignItem = cfg?.titleListItems?.find(it => it.key === 'titleAlign');
  const paraAlignItem = cfg?.titleListItems?.find(it => it.key === 'paragraphAlign');

  const editFormPath = path.join('components/site', name, 'EditForm.js');
  const compPath = path.join('components/site', name, name + '.js');

  const hasEditForm = fs.existsSync(editFormPath);
  const hasComp = fs.existsSync(compPath);

  const editContent = hasEditForm ? fs.readFileSync(editFormPath, 'utf8') : '';
  const compContent = hasComp ? fs.readFileSync(compPath, 'utf8') : '';

  const prefixMatch = editContent.match(/const PREFIX\s*=\s*["']([^"']+)["']/);
  const prefix = prefixMatch ? prefixMatch[1] : (MANAGE_SECTION_PREFIX_BY_COMPONENT_ID[name] || name.charAt(0).toLowerCase() + name.slice(1));

  // --- Check Title Alignment Issue ---
  let titleAlignIssue = null;
  if (!titleAlignItem) {
    titleAlignIssue = 'Missing titleAlign in TitleAndColorsConfig';
  } else {
    const fieldName = titleAlignItem.name;
    // Simulate initial load with 'left'
    const initData = { [fieldName]: 'left', [`${prefix}TitleAlign`]: 'left', titleAlign: 'left' };
    const initValues = getManageSectionInitialValues(prefix, initData);

    // Simulate user changing dropdown to 'center'
    const changedValues = { ...initValues, [fieldName]: 'center' };

    let payload = {};
    if (editContent.includes('getManageSectionPayload')) {
      payload = { ...getManageSectionPayload(prefix, changedValues) };
    }
    // Check if component explicitly overrides titleAlign in payload
    const titleRegex = new RegExp(`(?:${fieldName}|${prefix}TitleAlign|titleAlign)\\s*:\\s*([^,\\n}]+)`);
    const explicitMatch = editContent.match(titleRegex);

    const savedVal = payload[fieldName] ?? payload[`${prefix}TitleAlign`] ?? payload.titleAlign;

    if (savedVal !== 'center') {
      titleAlignIssue = `Dropdown field is '${fieldName}', but getManageSectionPayload returns '${savedVal}' (overwritten by stale '${prefix}TitleAlign' in getManageSectionPayload)`;
    } else if (!compContent.includes('getTitleAlign') && !compContent.includes('titleAlign')) {
      titleAlignIssue = `Component JSX does not read titleAlign`;
    } else if (!compContent.includes('getTitleAlignStyles') && !compContent.includes('getHeaderAlignStyles') && !compContent.includes('textAlign: titleAlign') && !compContent.includes('textAlign:align')) {
      titleAlignIssue = `Component JSX does not apply title alignment styles`;
    }
  }

  // --- Check Paragraph Alignment Issue ---
  let paraAlignIssue = null;
  if (paraAlignItem) {
    const pFieldName = paraAlignItem.name;
    const initData = { [pFieldName]: 'left', paragraphAlign: 'left' };
    // Check if EditForm sets and saves it
    if (!editContent.includes(pFieldName) && !editContent.includes('paragraphAlign')) {
      paraAlignIssue = `EditForm does not handle '${pFieldName}'`;
    } else if (!compContent.includes('getParagraphAlign') && !compContent.includes('paragraphAlign')) {
      paraAlignIssue = `Component JSX does not read paragraphAlign`;
    }
  }

  // --- Check duplicate paragraph alignment ---
  let duplicateParaAlign = false;
  const countParaInEditForm = (editContent.match(/Paragraph Alignment/gi) || []).length;
  if (countParaInEditForm > 0 && !editContent.includes('TitleAndColorsSection')) {
    // defined separately
  } else if (countParaInEditForm > 0 && editContent.includes('TitleAndColorsSection')) {
    // If it's written in both TitleAndColorsSection and another Tab/Card
    const otherMatches = editContent.match(/label=["']Paragraph Alignment["']/gi) || [];
    if (otherMatches.length > 0) {
      duplicateParaAlign = true;
    }
  }

  results.push({
    name,
    titleAlignField: titleAlignItem?.name || null,
    titleAlignIssue,
    paraAlignField: paraAlignItem?.name || null,
    paraAlignIssue,
    duplicateParaAlign,
  });
}

const withTitleIssue = results.filter(r => r.titleAlignIssue);
const withParaIssue = results.filter(r => r.paraAlignIssue);
const withDuplicate = results.filter(r => r.duplicateParaAlign);

console.log('=== SUMMARY ===');
console.log('Components with Title Alignment Issue:', withTitleIssue.length);
withTitleIssue.forEach(r => console.log(`- ${r.name}: ${r.titleAlignIssue}`));

console.log('\nComponents with Paragraph Alignment Issue:', withParaIssue.length);
withParaIssue.forEach(r => console.log(`- ${r.name}: ${r.paraAlignIssue}`));

console.log('\nComponents with Duplicate Paragraph Alignment in Drawer:', withDuplicate.length);
withDuplicate.forEach(r => console.log(`- ${r.name}`));
