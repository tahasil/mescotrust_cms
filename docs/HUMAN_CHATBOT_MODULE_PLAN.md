# MESCO Human Chatbot Plan (Website-Aligned, Planning Only)

Reference patterns:
- Amazon Help Center
- Flipkart Support
- Myntra Help Center

Module type:
- Human FAQ chatbot (not AI chatbot)
- Menu-based predefined questions and predefined answers

## 1. Objective

Create a fully admin-configurable support chatbot where users select FAQ options and receive predefined answers with follow-up questions.

## 2. Website Content Analysis Evidence

This plan maps chatbot roots to current MESCO website content domains so the seed tree is traceable.

| Website content domain | Chatbot root | Mapped URL path | Seeded subtopics |
|---|---|---|---|
| Scholarships | Scholarship Information | `/scholarship-information` (CMS slug route) | School, college, professional, EAS, HCES, eligibility, documents, process, result |
| Educational Support Programmes | Educational Support Programmes | `/educational-support-programmes` (CMS slug route) | Educational aid, sponsorship, vocational support, counseling, apply, eligibility |
| Medical Aid | Medical Aid | `/medical-aid` (CMS slug route) | General aid, dialysis, life-saving aid, diagnostics, medicine support, eligibility |
| Clinics and Dispensaries | Clinics and Dispensaries | `/clinics-and-dispensaries` (CMS slug route) | Locations, timings, services, consultation, camps, registration |
| Relief of Poverty | Poverty Relief | `/poverty-relief` (CMS slug route) | Ration, sewing machine sponsorship, emergency assistance, family support |
| Donations | Donations | `/donation` (existing static route) | Online, bank transfer, FCRA, sponsor categories, CSR partnership, in-kind donations |
| Notices + Events + News | Events and News | `/events` + `/blog` (existing static routes) | Upcoming events, scholarship announcements, notices, reports |
| Careers | Career Opportunities | `/career-opportunities` (CMS slug route) | Jobs, internships, volunteering, resume upload, recruitment process |
| Contact Information | Contact Us | `/contact` (existing static route) | Address, phone, email, timings, inquiry, call request |

Content audit checklist before implementation:
- Confirm page URLs for each domain and store source URL per FAQ root.
- Validate wording against current website copy.
- Mark each answer with `contentReviewedAt` and reviewer name in admin ops log.

Route evidence from codebase:
- Confirmed static site routes: `/contact`, `/donation`, `/events`, `/blog`.
- Other mapped domain pages are handled through CMS dynamic route pattern `/(site)/[...slug]`.

## 3. Welcome Experience

Welcome message:
- "Welcome to MESCO Trust"
- "How can we help you today?"

Quick options:
- Scholarship Information
- Educational Support Programmes
- Medical Aid
- Poverty Relief
- Donations
- Clinics and Dispensaries
- Career Opportunities
- Events and News
- Contact Us

## 4. Ready-to-Use FAQ Tree (Predefined Q&A Seed)

## 4.1 Scholarship Information

Root answer:
- MESCO supports students through multiple scholarship and educational assistance programs based on eligibility and document verification.

Child Q&A:
- School Scholarship: Financial support is available for eligible school students. Submit student details, income proof, and academic records through the scholarship application flow.
- College Scholarship: Eligible college students can apply for educational assistance by providing admission proof, fee details, and required documents.
- Professional Course Scholarship: Support may be available for professional courses based on merit, need, and seat confirmation.
- Education Adoption Scheme (EAS): EAS supports students through sustained educational assistance under sponsor-backed adoption.
- High Cost Education Scholarship (HCES): HCES is intended for students pursuing high-cost higher education where documented financial need exists.
- Orphan Education Support: Orphan students may receive priority educational support subject to verification documents.
- Scholarship Eligibility: Eligibility is based on educational stage, financial background, and required supporting documentation.
- Scholarship Documents Required: Typical documents include ID, income proof, admission records, fee structure, and academic marksheets.
- Scholarship Application Process: Complete the application form, upload required documents, and track status after submission.
- Scholarship Result Status: Scholarship status is shared after review and approval workflows are completed.

## 4.2 Educational Support Programmes

Root answer:
- MESCO runs structured educational support initiatives for students requiring financial and mentoring assistance.

Child Q&A:
- Educational Aid: Educational Aid provides basic support for continuing studies where financial constraints exist.
- Education Adoption Scheme: The scheme connects students to sustained sponsor-based support.
- High Cost Education Scholarship: Targeted support for eligible students in high-fee courses.
- Vocational Training Support: Skill-based training support may be provided for employability-focused education.
- Student Sponsorship: Sponsorship opportunities are available for students matching program criteria.
- Educational Counseling: Guidance is provided for course decisions, documentation, and program fit.
- How to Apply: Use the official application process and submit all required proofs for screening.
- Eligibility Criteria: Eligibility depends on academic need, socio-economic status, and available program capacity.

## 4.3 Medical Aid

Root answer:
- MESCO medical support programs assist deserving patients through multiple healthcare aid categories.

Child Q&A:
- General Medical Aid: Financial assistance is available for eligible routine and non-routine medical needs.
- Dialysis Support: Regular dialysis support may be provided for approved long-term patients.
- Life Saving Medical Aid: Emergency and critical treatment support is considered based on urgency and documentation.
- Diagnostic Test Support: Assistance may cover required diagnostic tests for eligible applicants.
- Monthly Medicine Support: Monthly medicine assistance may be available for chronic conditions after review.
- Medical Aid Eligibility: Eligibility is assessed using medical records, financial need, and supporting certificates.
- Required Documents: Prescriptions, medical reports, estimates, identity proofs, and income documents are typically required.
- Application Process: Submit medical aid request with documents and await screening and approval communication.

## 4.4 Clinics and Dispensaries

Root answer:
- MESCO clinics and dispensaries provide community healthcare access and support services.

Child Q&A:
- Clinic Locations: Clinic and dispensary locations are shared through official contact channels and published notices.
- Timings: Service timings vary by location and should be confirmed before visit.
- Available Services: Services may include consultation, basic treatment guidance, and referral support.
- Free Consultation: Free consultation availability depends on location schedules and specific program days.
- Medical Camps: MESCO organizes medical camps periodically for targeted communities.
- Patient Registration: Patients should complete registration details at the clinic or through designated processes.

## 4.5 Poverty Relief

Root answer:
- MESCO poverty relief programs support vulnerable families through essential aid and livelihood assistance.

Child Q&A:
- Monthly Ration Support: Eligible households may receive monthly ration assistance under relief programs.
- Sewing Machine Sponsorship: Livelihood support may include sewing machine sponsorship for eligible beneficiaries.
- Emergency Assistance: Emergency relief support is considered for urgent family hardship cases.
- Financial Support: Limited financial aid may be provided after eligibility and need assessment.
- Family Assistance Program: Family-focused aid programs support essential needs and social stability.
- Eligibility Criteria: Relief eligibility depends on income condition, case urgency, and document verification.

## 4.6 Donations

Root answer:
- MESCO accepts monetary and in-kind donations for education, medical aid, and poverty relief programs.

Child Q&A:
- Online Donation: Donations can be made through official online payment channels.
- Bank Transfer: Donors can contribute using approved bank transfer details.
- Foreign Donation (FCRA): Foreign donations are accepted only through compliant FCRA-approved channels.
- Sponsor a Student: Donors can sponsor student education support programs.
- Sponsor Medical Treatment: Donors can support treatment costs for verified patient cases.
- Sponsor Dialysis Patient: Donors can contribute to recurring dialysis support programs.
- Sponsor Monthly Ration: Donors can sponsor monthly ration for eligible families.
- Donate Old Newspapers: In-kind recycling-based donation drives may accept old newspapers.
- Donate Old Clothes: Usable clothes may be accepted through relief donation channels.
- CSR Partnership: Organizations can connect for CSR partnerships aligned to MESCO initiatives.

## 4.7 Events and News

Root answer:
- Stay updated with MESCO events, notices, announcements, and annual communications.

Child Q&A:
- Upcoming Events: Upcoming event details are shared through official updates and notices.
- Scholarship Announcements: Scholarship notifications are published as per program cycle.
- Notices: Administrative and program notices are published through official communication channels.
- Educational Programs: Updates on educational drives and initiatives are posted periodically.
- Medical Camps: Medical camp schedules and outcomes are shared in updates.
- Annual Reports: Annual activity reports summarize major impact and program progress.

## 4.8 Career Opportunities

Root answer:
- MESCO offers opportunities across jobs, internships, and volunteer participation.

Child Q&A:
- Current Openings: Available roles are listed in current openings announcements.
- Internship Opportunities: Internship tracks may be available for eligible candidates.
- Volunteer Opportunities: Volunteers can contribute across education, health, and relief activities.
- Upload Resume: Candidates can submit resumes via the official application channel.
- Recruitment Process: Shortlisting, review, and communication follow the recruitment process policy.

## 4.9 Contact Us

Root answer:
- MESCO can be contacted for support, inquiries, program details, and assistance requests.

Child Q&A:
- Office Address: Official office address details are available under Contact information.
- Phone Numbers: Contact phone numbers are available for direct assistance.
- Email Address: Official email channels are available for written queries.
- Office Timings: Contact hours should be checked before calls or visits.
- Send Inquiry: Use inquiry forms/channels for structured support requests.
- Call Request: Users can submit call-back requests through contact workflows.

## 5. Smart Search Plan

Search sources:
- Question title
- Answer content
- Keywords
- Tags
- Synonyms

Sample keywords:
- scholarship, education, school aid, college aid, medical help, dialysis, donation, ration, career, job, volunteer, contact, office, address, csr, sponsorship, events, news

Ranking logic:
1. Exact match in question title
2. Prefix match in question title
3. Exact or prefix match in keywords/tags/synonyms
4. Match in answer content
5. Tie-breaker by `popularityScore desc`, then `sortOrder asc`

Behavior rules:
- Search active nodes only
- Enforce `minSearchChars` and `maxSearchResults`
- If no results, show:
  - "Didn't find your answer?"
  - Contact support buttons

## 6. Admin Configuration Plan

### 6.0 Admin Navigation Requirement

- Admin sidebar must include a dedicated menu item: `Chatbot`.
- Clicking `Chatbot` opens a single control page for all chatbot operations.
- Admin route for this page: `/admin/chatbot`.
- FAQ question/answer tree management must happen on this page itself (main content area), not inside settings drawer.
- Chatbot settings must be managed through a Settings Drawer pattern, consistent with other admin components.
- This page is the primary control center for:
  - FAQ tree management
  - Chatbot settings
  - Search configuration
  - Contact action button configuration
  - Featured/Popular question controls

### 6.1 Settings Drawer

General:
- Enable Chatbot
- Bot Name
- Welcome Message
- Welcome Subtitle
- Avatar Upload
- Theme Color
- Position (Left/Right)

Appearance:
- Width
- Height
- Border Radius
- Header Color
- Chat Background Color
- Bot Message Bubble Color
- Bot Message Text Color
- User Message Bubble Color
- User Message Text Color
- Quick Option Button Color
- Quick Option Button Text Color
- Link/Button Accent Color
- Border Color
- Font Size

Features:
- Enable Search
- Enable Breadcrumb
- Enable Home Button
- Enable Back Button
- Enable Related Questions
- Enable Typing Animation
- Enable Contact Block

Search settings:
- Minimum Search Characters
- Maximum Search Results
- Search Enabled Fields (Title, Answer, Keywords, Tags, Synonyms)

Contact buttons:
- Call Us
- WhatsApp
- Email
- Contact Page
- Donation Page

Contact button fields:
- Label
- URL
- Icon
- Target (Same Tab/New Tab)
- Enabled
- Sort Order

Welcome screen controls:
- Welcome Message
- Featured Questions
- Popular Questions
- Banner Image (Optional)

### 6.2 FAQ Management (Ant Design Tree)

Placement rule:
- All question/answer CRUD and tree operations are handled on the `Chatbot` page body (page panel), while global chatbot settings are handled via Settings Drawer.

Supported operations:
- Add Root Question
- Add Child Question
- Edit Question
- Delete Question
- Drag and Drop Sorting
- Duplicate Question
- Enable/Disable Question

Question form fields (required plan alignment):
- Question Title
- Slug
- Answer (Rich Text Editor)
- Keywords
- Search Tags
- Synonyms
- Icon
- Status
- Sort Order
- Parent Question

## 7. Data Model and Tree Rules

## 7.1 `FaqNode`

Fields:
- `_id`
- `parentId`
- `question`
- `slug`
- `answerHtml`
- `keywords[]`
- `tags[]`
- `synonyms[]`
- `icon`
- `status`
- `sortOrder`
- `popularityScore`
- `createdAt`
- `updatedAt`

Constraints:
- Unlimited nesting supported
- Cycle prevention mandatory
- Reorder only among siblings
- Slug uniqueness mandatory

Delete modes:
- `block` (default): deny delete if children exist
- `cascade`: delete subtree
- `reparent`: move children to deleted node parent

## 7.2 `ChatbotSettings`

Fields:
- `enabled`
- `botName`
- `welcomeMessage`
- `welcomeSubtitle`
- `avatarMediaId`
- `themeColor`
- `position`
- `width`
- `height`
- `borderRadius`
- `headerColor`
- `chatBackgroundColor`
- `botMessageBubbleColor`
- `botMessageTextColor`
- `userMessageBubbleColor`
- `userMessageTextColor`
- `quickOptionButtonColor`
- `quickOptionButtonTextColor`
- `linkAccentColor`
- `borderColor`
- `fontSize`
- `enableSearch`
- `minSearchChars`
- `maxSearchResults`
- `enableBreadcrumb`
- `enableHomeButton`
- `enableBackButton`
- `enableRelatedQuestions`
- `enableTypingAnimation`
- `enableContactBlock`
- `featuredQuestionIds[]`
- `popularQuestionIds[]`
- `welcomeBannerMediaId` (optional)
- `contactActions[]`

`contactActions[]` object schema:
- `id`
- `actionType` (`call|whatsapp|email|contact|donation|custom`)
- `label`
- `url`
- `icon`
- `target` (`_self|_blank`)
- `enabled`
- `sortOrder`

## 8. API Contracts (Detailed Planning)

Route groups:
- Admin: `/api/admin/chatbot/*`
- Public: `/api/public/chatbot/*`

Standard response:
- Success: `{ success: true, data, meta? }`
- Error: `{ success: false, error: { code, message, details? } }`

## 8.1 Admin APIs

1. `GET /api/admin/chatbot/faqs`
- Query: `parentId?`, `includeInactive?`, `page?`, `limit?`
- Returns: paginated list with `{ items, total, page, limit }`

2. `POST /api/admin/chatbot/faqs`
- Body: `{ question, slug, answerHtml, parentId, keywords, tags, synonyms, icon, status, sortOrder }`
- Returns: created node
- Status: `201`

3. `PUT /api/admin/chatbot/faqs/:id`
- Body: partial update of node fields
- Returns: updated node

4. `DELETE /api/admin/chatbot/faqs/:id`
- Query: `mode=block|cascade|reparent`
- Returns: delete summary `{ deletedCount, reparentedCount }`

5. `POST /api/admin/chatbot/faqs/reorder`
- Body: `{ parentId, orderedIds: [] }`
- Returns: reordered sibling list

6. `POST /api/admin/chatbot/faqs/:id/duplicate`
- Body: `{ includeChildren: boolean }`
- Returns: duplicated node summary

7. `PATCH /api/admin/chatbot/faqs/:id/status`
- Body: `{ status: "active"|"inactive" }`
- Returns: node with updated status

8. `GET /api/admin/chatbot/settings`
- Returns: settings document

9. `PUT /api/admin/chatbot/settings`
- Body: settings payload (full or partial)
- Payload groups:
  - `general`: `{ enabled, botName, welcomeMessage, welcomeSubtitle, avatarMediaId, themeColor, position }`
  - `appearance`: `{ width, height, borderRadius, headerColor, chatBackgroundColor, botMessageBubbleColor, botMessageTextColor, userMessageBubbleColor, userMessageTextColor, quickOptionButtonColor, quickOptionButtonTextColor, linkAccentColor, borderColor, fontSize }`
  - `features`: `{ enableSearch, enableBreadcrumb, enableHomeButton, enableBackButton, enableRelatedQuestions, enableTypingAnimation, enableContactBlock }`
  - `search`: `{ minSearchChars, maxSearchResults, enabledFields }`
  - `welcome`: `{ featuredQuestionIds, popularQuestionIds, welcomeBannerMediaId }`
  - `contactActions`: `Array<{ id, actionType, label, url, icon, target, enabled, sortOrder }>`
- Required keys on first save: `enabled`, `botName`, `welcomeMessage`, `position`, `width`, `height`.
- Defaults if omitted: `enableSearch=true`, `minSearchChars=2`, `maxSearchResults=8`, `enableBreadcrumb=true`, `enableBackButton=true`, `enableHomeButton=true`, `enableContactBlock=true`.
- Returns: updated settings

## 8.2 Public APIs

1. `GET /api/public/chatbot/settings`
- Returns: active public settings only

2. `GET /api/public/chatbot/faqs/root`
- Returns: active root nodes sorted by `sortOrder`

3. `GET /api/public/chatbot/faqs/:id`
- Returns: `{ node, children, breadcrumb }`

4. `GET /api/public/chatbot/faqs/by-slug/:slug`
- Returns: `{ node, children, breadcrumb }`

5. `GET /api/public/chatbot/search`
- Query: `q`, `page?`, `limit?`
- Returns: ranked results `{ items, total, page, limit }`

6. `GET /api/public/chatbot/featured`
- Returns: featured question list

7. `GET /api/public/chatbot/popular`
- Returns: popular question list

## 9. Error Code Map (Endpoint-Level)

| Error code | When triggered | Example endpoints |
|---|---|---|
| `VALIDATION_ERROR` | Missing/invalid required fields | POST/PUT FAQ, PUT settings |
| `SLUG_NOT_UNIQUE` | Duplicate slug on create/update | POST/PUT FAQ |
| `INVALID_PARENT` | Parent not found or invalid | POST/PUT FAQ |
| `TREE_CYCLE_DETECTED` | Parent assignment creates cycle | PUT FAQ |
| `HAS_CHILDREN_DELETE_BLOCKED` | Delete blocked in `block` mode | DELETE FAQ |
| `DUPLICATE_FAILED` | Duplicate operation cannot complete | POST duplicate |
| `INVALID_STATUS` | Status value outside allowed enum | PATCH status |
| `INVALID_SEARCH_QUERY` | Query below min length/invalid format | GET public search |
| `SETTINGS_NOT_FOUND` | Settings doc missing | GET/PUT settings |
| `UNAUTHORIZED` | Not authenticated | Any admin endpoint |
| `FORBIDDEN` | Authenticated but insufficient role | Admin endpoints with restricted actions |

HTTP status mapping:
- `200` success
- `201` resource created
- `400` validation failures
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict (slug/cycle conflicts)
- `500` server errors

## 10. Permission Matrix (Planning)

| Capability | Admin | Editor | Public |
|---|---|---|---|
| View FAQ tree | Yes | Yes | Active-only via public APIs |
| Create/Edit FAQ | Yes | Yes | No |
| Reorder FAQ | Yes | Yes | No |
| Duplicate FAQ | Yes | Yes | No |
| Delete with `block` mode | Yes | No | No |
| Delete with `cascade/reparent` | Yes | No | No |
| Change settings | Yes | No | No |
| Search FAQs | Yes | Yes | Yes |

## 11. Frontend Chat Flow Plan

Components:
- Chat Launcher Button
- Chat Window
- Welcome Screen
- Search Box
- Conversation Area
- Question Buttons
- Breadcrumb Navigation
- Back Button
- Home Button
- Contact Support Section

Flow rules:
- Open -> welcome + quick options
- User click -> predefined answer + follow-up buttons
- Leaf node -> show contact block
- No search result -> show contact block
- Responsive support for mobile and desktop

## 12. Analytics Plan (Event Schema Included)

Track metrics:
- Total chat opens
- Most clicked questions
- Most searched keywords
- No result searches
- Conversion to contact page
- Conversion to donation page

Event schema (phase definition):
- `chat_open`: `{ sessionId, timestamp, entryPage }`
- `question_click`: `{ sessionId, questionId, questionTitle, depth, timestamp }`
- `search_submit`: `{ sessionId, query, resultCount, timestamp }`
- `search_no_result`: `{ sessionId, query, timestamp }`
- `contact_action_click`: `{ sessionId, actionType, actionLabel, sourceNodeId, timestamp }`
- `donation_action_click`: `{ sessionId, actionLabel, sourceNodeId, timestamp }`
- `chat_close`: `{ sessionId, durationSeconds, lastNodeId, timestamp }`

Reports:
- Daily
- Weekly
- Monthly
- CSV/Excel export

## 13. Non-Implementation Rollout Plan

1. Freeze website source mapping and final wording.
2. Freeze FAQ tree and child-level predefined answers.
3. Freeze admin fields including `slug` and `synonyms`.
4. Freeze API payload contracts and endpoint-level error mapping.
5. Freeze role matrix and search ranking rules.
6. Freeze analytics event schema and report requirements.
