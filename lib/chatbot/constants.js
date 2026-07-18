export const CHATBOT_DEFAULT_SETTINGS = {
  enabled: true,
  botName: "MESCO Help Desk",
  welcomeMessage: "Welcome to MESCO Trust",
  welcomeSubtitle: "How can we help you today?",
  avatarMediaId: "",
  themeColor: "#1677ff",
  position: "right",
  width: 360,
  height: 560,
  borderRadius: 16,
  headerColor: "#1677ff",
  chatBackgroundColor: "#ffffff",
  botMessageBubbleColor: "#f5f5f5",
  botMessageTextColor: "#1f1f1f",
  userMessageBubbleColor: "#1677ff",
  userMessageTextColor: "#ffffff",
  quickOptionButtonColor: "#f0f5ff",
  quickOptionButtonTextColor: "#0958d9",
  linkAccentColor: "#1677ff",
  borderColor: "#e8e8e8",
  launcherShadow: "0 10px 26px rgba(0,0,0,0.25)",
  windowShadow: "0 14px 38px rgba(0,0,0,0.22)",
  bubbleShadow: "0 3px 10px rgba(0,0,0,0.08)",
  chipShadow: "0 3px 10px rgba(0,0,0,0.08)",
  contentPadding: 14,
  footerPadding: 10,
  elementGap: 8,
  fontSize: 14,
  enableSearch: true,
  minSearchChars: 2,
  maxSearchResults: 8,
  searchEnabledFields: {
    title: true,
    answer: true,
    keywords: true,
    tags: true,
    synonyms: true,
  },
  enableBreadcrumb: true,
  enableHomeButton: true,
  enableBackButton: true,
  enableRelatedQuestions: true,
  enableTypingAnimation: true,
  enableContactBlock: true,
  featuredQuestionIds: [],
  popularQuestionIds: [],
  welcomeBannerMediaId: "",
  contactActions: [
    {
      id: "contact-page",
      actionType: "contact",
      label: "Contact Us",
      url: "/contact",
      icon: "mail",
      target: "_self",
      enabled: true,
      sortOrder: 1,
    },
    {
      id: "donation-page",
      actionType: "donation",
      label: "Donate Now",
      url: "/donation",
      icon: "heart",
      target: "_self",
      enabled: true,
      sortOrder: 2,
    },
  ],
};

const makeNode = ({
  question,
  slug,
  answer,
  keywords = [],
  tags = [],
  synonyms = [],
  icon = "",
  children = [],
}) => ({
  question,
  slug,
  answerHtml: `<p>${String(answer || "").trim()}</p>`,
  keywords,
  tags,
  synonyms,
  icon,
  status: "active",
  children,
});

export const CHATBOT_SEED_TREE = [
  makeNode({
    question: "Scholarship Information",
    slug: "scholarship-information",
    answer:
      "MESCO supports students through multiple scholarship and educational assistance programs based on eligibility and document verification.",
    tags: ["scholarship", "education"],
    keywords: ["school scholarship", "college scholarship", "hces", "eas"],
    children: [
      makeNode({
        question: "School Scholarship",
        slug: "school-scholarship",
        answer:
          "Financial support is available for eligible school students. Submit student details, income proof, and academic records through the scholarship application flow.",
      }),
      makeNode({
        question: "College Scholarship",
        slug: "college-scholarship",
        answer:
          "Eligible college students can apply for educational assistance by providing admission proof, fee details, and required documents.",
      }),
      makeNode({
        question: "Professional Course Scholarship",
        slug: "professional-course-scholarship",
        answer:
          "Support may be available for professional courses based on merit, need, and seat confirmation.",
      }),
      makeNode({
        question: "Education Adoption Scheme (EAS)",
        slug: "education-adoption-scheme-eas",
        answer:
          "EAS supports students through sustained educational assistance under sponsor-backed adoption.",
      }),
      makeNode({
        question: "High Cost Education Scholarship (HCES)",
        slug: "high-cost-education-scholarship-hces",
        answer:
          "HCES is intended for students pursuing high-cost higher education where documented financial need exists.",
      }),
      makeNode({
        question: "Orphan Education Support",
        slug: "orphan-education-support",
        answer:
          "Orphan students may receive priority educational support subject to verification documents.",
      }),
      makeNode({
        question: "Scholarship Eligibility",
        slug: "scholarship-eligibility",
        answer:
          "Eligibility is based on educational stage, financial background, and required supporting documentation.",
      }),
      makeNode({
        question: "Scholarship Documents Required",
        slug: "scholarship-documents-required",
        answer:
          "Typical documents include ID, income proof, admission records, fee structure, and academic marksheets.",
      }),
      makeNode({
        question: "Scholarship Application Process",
        slug: "scholarship-application-process",
        answer:
          "Complete the application form, upload required documents, and track status after submission.",
      }),
      makeNode({
        question: "Scholarship Result Status",
        slug: "scholarship-result-status",
        answer:
          "Scholarship status is shared after review and approval workflows are completed.",
      }),
    ],
  }),
  makeNode({
    question: "Educational Support Programmes",
    slug: "educational-support-programmes",
    answer:
      "MESCO runs structured educational support initiatives for students requiring financial and mentoring assistance.",
    tags: ["education", "support"],
    children: [
      makeNode({
        question: "Educational Aid",
        slug: "educational-aid",
        answer:
          "Educational Aid provides basic support for continuing studies where financial constraints exist.",
      }),
      makeNode({
        question: "Education Adoption Scheme",
        slug: "education-adoption-scheme",
        answer: "The scheme connects students to sustained sponsor-based support.",
      }),
      makeNode({
        question: "High Cost Education Scholarship",
        slug: "high-cost-education-scholarship",
        answer: "Targeted support for eligible students in high-fee courses.",
      }),
      makeNode({
        question: "Vocational Training Support",
        slug: "vocational-training-support",
        answer:
          "Skill-based training support may be provided for employability-focused education.",
      }),
      makeNode({
        question: "Student Sponsorship",
        slug: "student-sponsorship",
        answer:
          "Sponsorship opportunities are available for students matching program criteria.",
      }),
      makeNode({
        question: "Educational Counseling",
        slug: "educational-counseling",
        answer:
          "Guidance is provided for course decisions, documentation, and program fit.",
      }),
      makeNode({
        question: "How to Apply",
        slug: "how-to-apply",
        answer:
          "Use the official application process and submit all required proofs for screening.",
      }),
      makeNode({
        question: "Eligibility Criteria",
        slug: "eligibility-criteria",
        answer:
          "Eligibility depends on academic need, socio-economic status, and available program capacity.",
      }),
    ],
  }),
  makeNode({
    question: "Medical Aid",
    slug: "medical-aid",
    answer:
      "MESCO medical support programs assist deserving patients through multiple healthcare aid categories.",
    tags: ["medical", "healthcare"],
    children: [
      makeNode({
        question: "General Medical Aid",
        slug: "general-medical-aid",
        answer:
          "Financial assistance is available for eligible routine and non-routine medical needs.",
      }),
      makeNode({
        question: "Dialysis Support",
        slug: "dialysis-support",
        answer:
          "Regular dialysis support may be provided for approved long-term patients.",
      }),
      makeNode({
        question: "Life Saving Medical Aid",
        slug: "life-saving-medical-aid",
        answer:
          "Emergency and critical treatment support is considered based on urgency and documentation.",
      }),
      makeNode({
        question: "Diagnostic Test Support",
        slug: "diagnostic-test-support",
        answer:
          "Assistance may cover required diagnostic tests for eligible applicants.",
      }),
      makeNode({
        question: "Monthly Medicine Support",
        slug: "monthly-medicine-support",
        answer:
          "Monthly medicine assistance may be available for chronic conditions after review.",
      }),
      makeNode({
        question: "Medical Aid Eligibility",
        slug: "medical-aid-eligibility",
        answer:
          "Eligibility is assessed using medical records, financial need, and supporting certificates.",
      }),
      makeNode({
        question: "Required Documents",
        slug: "medical-required-documents",
        answer:
          "Prescriptions, medical reports, estimates, identity proofs, and income documents are typically required.",
      }),
      makeNode({
        question: "Application Process",
        slug: "medical-application-process",
        answer:
          "Submit medical aid request with documents and await screening and approval communication.",
      }),
    ],
  }),
  makeNode({
    question: "Poverty Relief",
    slug: "poverty-relief",
    answer:
      "MESCO poverty relief programs support vulnerable families through essential aid and livelihood assistance.",
    tags: ["relief", "ration", "poverty"],
    children: [
      makeNode({
        question: "Monthly Ration Support",
        slug: "monthly-ration-support",
        answer:
          "Eligible households may receive monthly ration assistance under relief programs.",
      }),
      makeNode({
        question: "Sewing Machine Sponsorship",
        slug: "sewing-machine-sponsorship",
        answer:
          "Livelihood support may include sewing machine sponsorship for eligible beneficiaries.",
      }),
      makeNode({
        question: "Emergency Assistance",
        slug: "emergency-assistance",
        answer:
          "Emergency relief support is considered for urgent family hardship cases.",
      }),
      makeNode({
        question: "Financial Support",
        slug: "financial-support",
        answer:
          "Limited financial aid may be provided after eligibility and need assessment.",
      }),
      makeNode({
        question: "Family Assistance Program",
        slug: "family-assistance-program",
        answer:
          "Family-focused aid programs support essential needs and social stability.",
      }),
      makeNode({
        question: "Eligibility Criteria",
        slug: "poverty-relief-eligibility-criteria",
        answer:
          "Relief eligibility depends on income condition, case urgency, and document verification.",
      }),
    ],
  }),
  makeNode({
    question: "Donations",
    slug: "donations",
    answer:
      "MESCO accepts monetary and in-kind donations for education, medical aid, and poverty relief programs.",
    tags: ["donation", "csr"],
    children: [
      makeNode({
        question: "Online Donation",
        slug: "online-donation",
        answer: "Donations can be made through official online payment channels.",
      }),
      makeNode({
        question: "Bank Transfer",
        slug: "bank-transfer",
        answer: "Donors can contribute using approved bank transfer details.",
      }),
      makeNode({
        question: "Foreign Donation (FCRA)",
        slug: "foreign-donation-fcra",
        answer:
          "Foreign donations are accepted only through compliant FCRA-approved channels.",
      }),
      makeNode({
        question: "Sponsor a Student",
        slug: "sponsor-a-student",
        answer: "Donors can sponsor student education support programs.",
      }),
      makeNode({
        question: "Sponsor Medical Treatment",
        slug: "sponsor-medical-treatment",
        answer: "Donors can support treatment costs for verified patient cases.",
      }),
      makeNode({
        question: "Sponsor Dialysis Patient",
        slug: "sponsor-dialysis-patient",
        answer: "Donors can contribute to recurring dialysis support programs.",
      }),
      makeNode({
        question: "Sponsor Monthly Ration",
        slug: "sponsor-monthly-ration",
        answer: "Donors can sponsor monthly ration for eligible families.",
      }),
      makeNode({
        question: "Donate Old Newspapers",
        slug: "donate-old-newspapers",
        answer:
          "In-kind recycling-based donation drives may accept old newspapers.",
      }),
      makeNode({
        question: "Donate Old Clothes",
        slug: "donate-old-clothes",
        answer: "Usable clothes may be accepted through relief donation channels.",
      }),
      makeNode({
        question: "CSR Partnership",
        slug: "csr-partnership",
        answer:
          "Organizations can connect for CSR partnerships aligned to MESCO initiatives.",
      }),
    ],
  }),
  makeNode({
    question: "Clinics and Dispensaries",
    slug: "clinics-and-dispensaries",
    answer:
      "MESCO clinics and dispensaries provide community healthcare access and support services.",
    tags: ["clinic", "dispensary"],
    children: [
      makeNode({
        question: "Clinic Locations",
        slug: "clinic-locations",
        answer:
          "Clinic and dispensary locations are shared through official contact channels and published notices.",
      }),
      makeNode({
        question: "Timings",
        slug: "clinic-timings",
        answer:
          "Service timings vary by location and should be confirmed before visit.",
      }),
      makeNode({
        question: "Available Services",
        slug: "clinic-available-services",
        answer:
          "Services may include consultation, basic treatment guidance, and referral support.",
      }),
      makeNode({
        question: "Free Consultation",
        slug: "free-consultation",
        answer:
          "Free consultation availability depends on location schedules and specific program days.",
      }),
      makeNode({
        question: "Medical Camps",
        slug: "clinic-medical-camps",
        answer:
          "MESCO organizes medical camps periodically for targeted communities.",
      }),
      makeNode({
        question: "Patient Registration",
        slug: "patient-registration",
        answer:
          "Patients should complete registration details at the clinic or through designated processes.",
      }),
    ],
  }),
  makeNode({
    question: "Career Opportunities",
    slug: "career-opportunities",
    answer:
      "MESCO offers opportunities across jobs, internships, and volunteer participation.",
    tags: ["career", "jobs", "volunteer"],
    children: [
      makeNode({
        question: "Current Openings",
        slug: "current-openings",
        answer: "Available roles are listed in current openings announcements.",
      }),
      makeNode({
        question: "Internship Opportunities",
        slug: "internship-opportunities",
        answer: "Internship tracks may be available for eligible candidates.",
      }),
      makeNode({
        question: "Volunteer Opportunities",
        slug: "volunteer-opportunities",
        answer:
          "Volunteers can contribute across education, health, and relief activities.",
      }),
      makeNode({
        question: "Upload Resume",
        slug: "upload-resume",
        answer:
          "Candidates can submit resumes via the official application channel.",
      }),
      makeNode({
        question: "Recruitment Process",
        slug: "recruitment-process",
        answer:
          "Shortlisting, review, and communication follow the recruitment process policy.",
      }),
    ],
  }),
  makeNode({
    question: "Events and News",
    slug: "events-and-news",
    answer:
      "Stay updated with MESCO events, notices, announcements, and annual communications.",
    tags: ["events", "news", "notices"],
    children: [
      makeNode({
        question: "Upcoming Events",
        slug: "upcoming-events",
        answer:
          "Upcoming event details are shared through official updates and notices.",
      }),
      makeNode({
        question: "Scholarship Announcements",
        slug: "scholarship-announcements",
        answer:
          "Scholarship notifications are published as per program cycle.",
      }),
      makeNode({
        question: "Notices",
        slug: "events-notices",
        answer:
          "Administrative and program notices are published through official communication channels.",
      }),
      makeNode({
        question: "Educational Programs",
        slug: "events-educational-programs",
        answer:
          "Updates on educational drives and initiatives are posted periodically.",
      }),
      makeNode({
        question: "Medical Camps",
        slug: "events-medical-camps",
        answer:
          "Medical camp schedules and outcomes are shared in updates.",
      }),
      makeNode({
        question: "Annual Reports",
        slug: "annual-reports",
        answer:
          "Annual activity reports summarize major impact and program progress.",
      }),
    ],
  }),
  makeNode({
    question: "Contact Us",
    slug: "contact-us",
    answer:
      "MESCO can be contacted for support, inquiries, program details, and assistance requests.",
    tags: ["contact", "support"],
    children: [
      makeNode({
        question: "Office Address",
        slug: "office-address",
        answer: "Official office address details are available under Contact information.",
      }),
      makeNode({
        question: "Phone Numbers",
        slug: "phone-numbers",
        answer: "Contact phone numbers are available for direct assistance.",
      }),
      makeNode({
        question: "Email Address",
        slug: "email-address",
        answer: "Official email channels are available for written queries.",
      }),
      makeNode({
        question: "Office Timings",
        slug: "office-timings",
        answer: "Contact hours should be checked before calls or visits.",
      }),
      makeNode({
        question: "Send Inquiry",
        slug: "send-inquiry",
        answer: "Use inquiry forms/channels for structured support requests.",
      }),
      makeNode({
        question: "Call Request",
        slug: "call-request",
        answer:
          "Users can submit call-back requests through contact workflows.",
      }),
    ],
  }),
];
