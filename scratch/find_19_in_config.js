const fs = require('fs');
const content = fs.readFileSync('lib/titleAndColorsConfig.js', 'utf8');

const targets = [
  'Alerts', 'Cards', 'Cards1', 'Careers', 'Images',
  'InMedia', 'Internshiplifecycle', 'LeaveusamessageModal', 'Marquee', 'Newsletters',
  'OverlayCards', 'Reports', 'SectionIntro', 'ShortCode', 'MissionVision',
  'SocialMediaWall', 'SocialWallFeed', 'FormEmbed', 'TeamEmbed'
];

for (const t of targets) {
  const lines = content.split('\n');
  let inBlock = false;
  let blockLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (new RegExp('^\\s*' + t + ':\\s*\\{').test(line)) {
      inBlock = true;
    }
    if (inBlock) {
      blockLines.push({ num: i + 1, text: line });
      if (line.includes('key: "titleAlign"') || line.includes("key: 'titleAlign'")) {
        // Look ahead for name
        for (let j = i; j < i + 10 && j < lines.length; j++) {
          if (lines[j].includes('name:')) {
            console.log(`${t} (line ${j + 1}): ${lines[j].trim()}`);
            break;
          }
        }
      }
      if (/^\s*\},?\s*$/.test(line) && blockLines.length > 10) {
        break;
      }
    }
  }
}
