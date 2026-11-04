const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

/* Helper simulating the exact active opening calculation logic in CareersUpload */
function computeActiveOpenings(rawPositions) {
  const DUMMY_OR_GENERIC_ROLES = new Set([
    "general application",
    "general",
    "other",
    "others",
    "select",
    "select position",
    "select role",
    "none",
    "n/a",
    "--",
  ]);

  const INACTIVE_ROLE_PATTERNS = [
    /\(closed\)/i,
    /\[closed\]/i,
    /\(inactive\)/i,
    /\[inactive\]/i,
    /\(expired\)/i,
    /\[expired\]/i,
  ];

  let candidatePositions = [];
  if (Array.isArray(rawPositions)) {
    candidatePositions = rawPositions;
  } else if (typeof rawPositions === "string" && rawPositions.trim()) {
    candidatePositions = rawPositions.includes("\n")
      ? rawPositions.split("\n")
      : rawPositions.split(",");
  }

  const seenKeys = new Set();
  const activeOpenings = [];

  for (const candidate of candidatePositions) {
    if (!candidate) continue;
    let title = "";
    let value = "";

    if (typeof candidate === "object") {
      if (
        candidate.active === false ||
        candidate.isClosed ||
        candidate.isExpired ||
        candidate.status === "closed" ||
        candidate.status === "inactive" ||
        candidate.status === "expired" ||
        candidate.status === "draft"
      ) {
        continue;
      }
      title = String(candidate.title || candidate.name || "").trim();
      value = String(candidate.id || candidate._id || candidate.slug || candidate.value || title).trim();
    } else if (typeof candidate === "string") {
      title = candidate.trim();
      value = title;
    }

    if (!title) continue;
    if (INACTIVE_ROLE_PATTERNS.some((pat) => pat.test(title))) continue;
    if (DUMMY_OR_GENERIC_ROLES.has(title.toLowerCase())) continue;

    const dedupeKey = title.toLowerCase();
    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);

    activeOpenings.push({
      label: title,
      value: value || title,
      title,
    });
  }

  return {
    activeOpenings,
    positionOptions: [
      ...activeOpenings.map((o) => ({ label: o.label, value: o.value })),
      { label: "Other", value: "Other" },
    ],
  };
}

/* Helper simulating the URL query parameter matching logic */
function resolveInitialSelection({ activeOpenings, searchParam }) {
  if (searchParam) {
    const cleanParam = searchParam.trim().toLowerCase();
    const matched = activeOpenings.find((o) => {
      const titleLower = o.title.toLowerCase();
      const valueLower = String(o.value).toLowerCase();
      const slugHyphen = titleLower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const slugUnderscore = titleLower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      return (
        titleLower === cleanParam ||
        valueLower === cleanParam ||
        slugHyphen === cleanParam ||
        slugUnderscore === cleanParam
      );
    });

    if (matched) {
      return matched.value;
    } else {
      return undefined; // Invalid or expired -> leave empty
    }
  }

  // Single active opening -> automatically select
  if (activeOpenings.length === 1) {
    return activeOpenings[0].value;
  }

  // Multiple openings -> undefined
  return undefined;
}

test("1. Multiple active openings – eligible positions and Other are displayed, generic dummy filtered", () => {
  const raw = [
    "General Application",
    "Programme Coordinator",
    "Medical Officer",
    "Accounts Executive (Closed)",
    "Content & Communications Executive",
  ];
  const { activeOpenings, positionOptions } = computeActiveOpenings(raw);

  assert.equal(activeOpenings.length, 3);
  assert.deepEqual(
    activeOpenings.map((o) => o.label),
    ["Programme Coordinator", "Medical Officer", "Content & Communications Executive"]
  );

  // Excluded "General Application" and closed
  assert.equal(positionOptions.length, 4);
  assert.equal(positionOptions[positionOptions.length - 1].value, "Other");
});

test("2. One active opening – that opening is automatically selected as default value", () => {
  const raw = ["Programme Coordinator"];
  const { activeOpenings, positionOptions } = computeActiveOpenings(raw);

  assert.equal(activeOpenings.length, 1);
  assert.equal(positionOptions.length, 2);
  assert.equal(positionOptions[0].label, "Programme Coordinator");
  assert.equal(positionOptions[1].label, "Other");

  const selected = resolveInitialSelection({ activeOpenings, searchParam: null });
  assert.equal(selected, "Programme Coordinator");
});

test("3. No active openings – only Other is displayed", () => {
  const raw = [];
  const { activeOpenings, positionOptions } = computeActiveOpenings(raw);

  assert.equal(activeOpenings.length, 0);
  assert.equal(positionOptions.length, 1);
  assert.equal(positionOptions[0].label, "Other");
  assert.equal(positionOptions[0].value, "Other");
});

test("4. User arrives through a valid job-specific Apply link – correct position is preselected", () => {
  const raw = ["Programme Coordinator", "Medical Officer"];
  const { activeOpenings } = computeActiveOpenings(raw);

  // Test hyphen slug
  const selHyphen = resolveInitialSelection({ activeOpenings, searchParam: "programme-coordinator" });
  assert.equal(selHyphen, "Programme Coordinator");

  // Test underscore slug
  const selUnderscore = resolveInitialSelection({ activeOpenings, searchParam: "medical_officer" });
  assert.equal(selUnderscore, "Medical Officer");

  // Test exact case-insensitive title
  const selTitle = resolveInitialSelection({ activeOpenings, searchParam: "Programme coordinator" });
  assert.equal(selTitle, "Programme Coordinator");
});

test("5. User arrives with an invalid or expired job reference – invalid position is not selected", () => {
  const raw = ["Programme Coordinator", "Medical Officer"];
  const { activeOpenings } = computeActiveOpenings(raw);

  const selInvalid = resolveInitialSelection({ activeOpenings, searchParam: "expired_role_2024" });
  assert.equal(selInvalid, undefined, "Invalid role reference should not be selected");
});

test("6. Multiple active openings without job query param keeps selection empty", () => {
  const raw = ["Programme Coordinator", "Medical Officer", "Accounts Executive"];
  const { activeOpenings } = computeActiveOpenings(raw);

  const sel = resolveInitialSelection({ activeOpenings, searchParam: null });
  assert.equal(sel, undefined, "Multiple openings must let applicant choose without arbitrary preselection");
});

test("7. CareersUpload component contract defines conditional customPosition input with validation", () => {
  const source = readFile("components/site/CareersUpload/CareersUpload.js");

  // Dynamic openings computation
  assert.match(source, /compute|activeOpenings/i);
  assert.match(source, /DUMMY_OR_GENERIC_ROLES/);
  assert.match(source, /INACTIVE_ROLE_PATTERNS/);

  // Other option inclusion
  assert.match(source, /\{ label: "Other", value: "Other" \}/);

  // Watch for position "Other"
  assert.match(source, /Form\.useWatch\("position", form\)/);
  assert.match(source, /isOtherSelected = watchedPosition === "Other"/);

  // Clear custom position on switch away from Other
  assert.match(source, /form\.setFieldsValue\(\{ customPosition: undefined \}\)/);

  // Conditional input field and label
  assert.match(source, /name="customPosition"/);
  assert.match(source, /label="Specify Role \/ Position Name"/);
  assert.match(source, /placeholder="Enter the role or position you are interested in"/);
  assert.match(source, /Role \/ position name cannot be empty/);

  // Anchor and role event listener
  assert.match(source, /id="careers-application-form"/);
  assert.match(source, /careers-select-role/);
});

test("8. CareersUpload submission payload separates Other custom position vs active opening", () => {
  const source = readFile("components/site/CareersUpload/CareersUpload.js");

  assert.match(source, /payload\.append\("position", customPosition\)/);
  assert.match(source, /payload\.append\("customPosition", customPosition\)/);
  assert.match(source, /payload\.append\("positionCategory", "Other"\)/);
  assert.match(source, /payload\.append\("positionCategory", "ActiveOpening"\)/);
});

test("9. Backend API validates custom role when Other is selected and rejects invalid/expired active references", () => {
  const source = readFile("app/api/public/careers-upload/route.js");

  // Category and customPosition parsing
  assert.match(source, /formData\.get\("positionCategory"\)/);
  assert.match(source, /formData\.get\("customPosition"\)/);

  // Empty custom role check for Other
  assert.match(source, /Please specify the role or position name/);

  // Inactive / expired reject check
  assert.match(source, /The selected position is no longer accepting applications/);

  // Page active opening validation check
  assert.match(source, /The selected position is not currently accepting applications/);
});

test("10. CareerSubmission model persists positionCategory and customPosition safely", () => {
  const source = readFile("models/CareerSubmission.js");

  assert.match(source, /position:\s*\{\s*type:\s*String/);
  assert.match(source, /positionCategory:\s*\{\s*type:\s*String/);
  assert.match(source, /customPosition:\s*\{\s*type:\s*String/);
});

test("11. Admin Career Submissions page renders Other tag for custom position applications", () => {
  const source = readFile("app/admin/(authenticated)/career-submissions/page.js");

  // Table rendering
  assert.match(source, /r\?\.positionCategory === "Other"/);
  assert.match(source, /<Tag color="purple">Other<\/Tag>/);

  // Modal rendering
  assert.match(source, /viewItem\.positionCategory === "Other"/);
});

test("12. Careers job card Apply button links to application form with role selection event", () => {
  const source = readFile("components/site/Careers/Careers.js");

  assert.match(source, /#careers-application-form/);
  assert.match(source, /careers-select-role/);
});

test("13. Careers card hover animation is smooth and light without jerky padding shift", () => {
  const source = readFile("components/site/Careers/Careers.js");

  // Renders career-job-card instead of fable-row-link to prevent jerky global padding shift
  assert.match(source, /className="career-job-card"/);
  assert.doesNotMatch(source, /<JobCard className="fable-row-link"/);

  // Smooth translateY lift and subtle shadow on hover
  assert.match(source, /transform:\s*translateY\(-3px\)/);
  assert.match(source, /cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/);
  assert.match(source, /padding-left:\s*32px/);
});

test("14. Careers EditForm Apply URL is a dropdown connected to CareersUpload positions", () => {
  const source = readFile("components/site/Careers/EditForm.js");

  // Select component imported and used for Apply URL
  assert.match(source, /import\s*\{[^}]*Select[^}]*\}\s*from\s*"antd"/);
  assert.match(source, /<Select[^>]*placeholder="Select position from Careers Upload\.\.\."/);

  // Extracts positions from CareersUpload and fetches /api/theme/CareersUpload
  assert.match(source, /extractPositionsFromData/);
  assert.match(source, /\/api\/theme\/CareersUpload/);
  assert.match(source, /Refresh Positions/);

  // Accepts allPageBlocks prop for cross-block sibling sync in PageBuilder
  assert.match(source, /allPageBlocks/);
  assert.match(source, /findMatchingPosition/);
});

test("15. Frontend Apply button scrolls to CareersUpload form and preselects the configured role", () => {
  const careersSource = readFile("components/site/Careers/Careers.js");
  const uploadSource = readFile("components/site/CareersUpload/CareersUpload.js");

  // Careers dispatches targetRole from applyUrl or title with smooth scroll offset
  assert.match(careersSource, /detail:\s*\{\s*role:\s*targetRole/);
  assert.match(careersSource, /window\.scrollTo\(\{\s*top:\s*Math\.max\(0,\s*y\),\s*behavior:\s*"smooth"\s*\}\)/);

  // CareersUpload listens and selects the position in the Ant Design form
  assert.match(uploadSource, /window\.addEventListener\("careers-select-role"/);
  assert.match(uploadSource, /form\.setFieldsValue\(\{\s*position:\s*matched\.value\s*\}\)/);
});
