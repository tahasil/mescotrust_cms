const path = require("path");
const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { connectDB } = require("../lib/db");
const Page = require("../models/Page");
const Form = require("../models/Form");
const FormSubmission = require("../models/FormSubmission");
const SubmissionFile = require("../models/SubmissionFile");
const User = require("../models/User");
const ContactSubmission = require("../models/ContactSubmission");
const EventRegistration = require("../models/EventRegistration");
const VolunteersFeedbackSubmission = require("../models/VolunteersFeedbackSubmission");
const DonateNowSubmission = require("../models/DonateNowSubmission");

const BASE_URL = process.env.FORM_QA_BASE_URL || "http://localhost:4010";
const QA_PREFIX = `FORM_QA_${Date.now()}`;
const QA_PAGE_SLUG = `qa-form-embed-${Date.now()}`;
const QA_ADMIN_EMAIL = `form-qa-admin+${Date.now()}@example.com`;
const QA_ADMIN_PASSWORD = `QaPass!${Date.now()}`;
const QA_CONTACT_EMAIL = `qa-contact-${Date.now()}@example.com`;
const QA_EVENT_EMAIL = `qa-event-${Date.now()}@example.com`;
const QA_VOLUNTEER_EMAIL = `qa-volunteer-${Date.now()}@example.com`;

const qaState = {
  contactId: "",
  eventRegistrationId: "",
  volunteerId: "",
  donationId: "",
  donationOrderId: "",
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function toUrl(pathname) {
  return `${BASE_URL.replace(/\/$/, "")}${pathname}`;
}

function buildCookieHeader(jar) {
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

function appendSetCookieToJar(headers, jar) {
  let values = [];
  if (typeof headers.getSetCookie === "function") {
    values = headers.getSetCookie();
  } else {
    const raw = headers.get("set-cookie");
    if (raw) values = [raw];
  }

  for (const line of values) {
    const chunk = normalizeText(line).split(";")[0];
    const eq = chunk.indexOf("=");
    if (eq <= 0) continue;
    const name = chunk.slice(0, eq).trim();
    const value = chunk.slice(eq + 1).trim();
    if (name) jar.set(name, value);
  }
}

async function requestJson(pathname, options = {}, cookieJar = null) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = {
    ...(options.headers || {}),
  };
  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    headers.Origin = BASE_URL;
    headers.Referer = `${BASE_URL}/admin`;
  }
  if (cookieJar && cookieJar.size > 0) {
    headers.Cookie = buildCookieHeader(cookieJar);
  }

  const res = await fetch(toUrl(pathname), {
    ...options,
    redirect: options.redirect || "manual",
    headers,
  });

  if (cookieJar) appendSetCookieToJar(res.headers, cookieJar);

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { res, data, text };
}

async function checkServerAvailable() {
  const health = await requestJson("/api/health");
  assert(health.res.status === 200, `Expected /api/health 200, got ${health.res.status}`);
}

async function loginAsAdmin(cookieJar) {
  const csrfResponse = await requestJson("/api/auth/csrf", { method: "GET" }, cookieJar);
  assert(csrfResponse.res.status === 200, `Expected csrf 200, got ${csrfResponse.res.status}`);
  const csrfToken = normalizeText(csrfResponse.data?.csrfToken);
  assert(csrfToken, "Missing csrfToken from /api/auth/csrf response");

  const params = new URLSearchParams();
  params.set("csrfToken", csrfToken);
  params.set("email", QA_ADMIN_EMAIL);
  params.set("password", QA_ADMIN_PASSWORD);
  params.set("callbackUrl", `${BASE_URL}/admin`);
  params.set("json", "true");

  const loginRes = await fetch(toUrl("/api/auth/callback/credentials?json=true"), {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: BASE_URL,
      Referer: `${BASE_URL}/admin/login`,
      Cookie: buildCookieHeader(cookieJar),
    },
    body: params.toString(),
  });
  appendSetCookieToJar(loginRes.headers, cookieJar);

  const bodyText = await loginRes.text();
  let body = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = { raw: bodyText };
  }

  const hasSessionCookie = [...cookieJar.keys()].some((k) => k.includes("next-auth.session-token") || k.includes("__Secure-next-auth.session-token"));
  assert(hasSessionCookie, `Admin login did not set session cookie. Status=${loginRes.status} Body=${bodyText}`);

  const sessionRes = await requestJson("/api/auth/session", { method: "GET" }, cookieJar);
  assert(sessionRes.res.status === 200, `Expected /api/auth/session 200, got ${sessionRes.res.status}`);
  assert(normalizeText(sessionRes.data?.user?.email).toLowerCase() === normalizeText(QA_ADMIN_EMAIL).toLowerCase(), "Logged-in user email mismatch in session");
}

async function ensureQaAdminUser() {
  await connectDB();
  const passwordHash = await bcrypt.hash(QA_ADMIN_PASSWORD, 10);
  await User.updateOne(
    { email: QA_ADMIN_EMAIL },
    {
      $set: {
        name: "Form QA Admin",
        role: "Admin",
        status: "active",
        password: passwordHash,
      },
    },
    { upsert: true },
  );
}

async function runRegressionPublicChecks(results) {
  const contact = await requestJson("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "QA Contact",
      email: QA_CONTACT_EMAIL,
      message: "Form Builder regression smoke",
    }),
  });
  assert(contact.res.status === 201, `Expected /api/contact 201, got ${contact.res.status}`);
  qaState.contactId = normalizeText(contact.data?.id);
  assert(qaState.contactId, "Contact response missing id");

  const event = await requestJson("/api/public/event-registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: "qa-event",
      eventTitle: "QA Event",
      eventDate: "2026-06-05",
      name: "QA Event",
      email: QA_EVENT_EMAIL,
      phone: "9999999999",
    }),
  });
  assert(event.res.status === 201, `Expected /api/public/event-registrations 201, got ${event.res.status}`);
  qaState.eventRegistrationId = normalizeText(event.data?.id);
  assert(qaState.eventRegistrationId, "Event registration response missing id");

  const volunteers = await requestJson("/api/public/volunteers-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "QA Volunteer",
      email: QA_VOLUNTEER_EMAIL,
      phone: "9999999999",
      message: "Form Builder regression smoke",
    }),
  });
  assert(volunteers.res.status === 201, `Expected /api/public/volunteers-feedback 201, got ${volunteers.res.status}`);
  qaState.volunteerId = normalizeText(volunteers.data?.id);
  assert(qaState.volunteerId, "Volunteers feedback response missing id");

  const donationGuard = await requestJson("/api/payment/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert(donationGuard.res.status === 400, `Expected /api/payment/initiate 400 for invalid payload, got ${donationGuard.res.status}`);

  const callbackGuard = await fetch(toUrl("/api/payment/callback"), {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: BASE_URL,
      Referer: `${BASE_URL}/donation`,
    },
    body: "",
  });
  assert(callbackGuard.status === 303, `Expected /api/payment/callback missing encResp to redirect 303, got ${callbackGuard.status}`);
  const callbackLocation = callbackGuard.headers.get("location") || "";
  assert(callbackLocation.includes("/donation/failed?reason=no-response"), `Unexpected callback redirect location: ${callbackLocation}`);

  await connectDB();
  const orderId = `QA_ORDER_${Date.now()}`;
  const donation = await DonateNowSubmission.create({
    orderId,
    amount: 500,
    currency: "INR",
    purpose: "QA Purpose",
    purposeId: "qa-purpose",
    donor: {
      name: "QA Donor",
      email: `qa-donor-${Date.now()}@example.com`,
      mobile: "9999999999",
    },
    status: "success",
    source: "DonateNow-QA",
  });
  qaState.donationId = String(donation._id);
  qaState.donationOrderId = orderId;

  results.push("Contact/Event/Volunteer public submit paths and Donation initiate/callback guardrails validated, with donation fixture seeded for admin inbox checks");
}

async function runRegressionAdminChecks(cookieJar, results) {
  const contacts = await requestJson("/api/admin/contacts?page=1&limit=20", { method: "GET" }, cookieJar);
  assert(contacts.res.status === 200, `Expected /api/admin/contacts 200, got ${contacts.res.status}`);
  const contactItem = (contacts.data?.items || []).find((item) => String(item?._id) === qaState.contactId);
  assert(Boolean(contactItem), "Contact submission not visible in admin contacts list");

  const contactPatch = await requestJson(`/api/admin/contacts/${encodeURIComponent(qaState.contactId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isRead: true }),
  }, cookieJar);
  assert(contactPatch.res.status === 200, `Expected contact PATCH 200, got ${contactPatch.res.status}`);

  const events = await requestJson("/api/admin/event-registrations?page=1&limit=20", { method: "GET" }, cookieJar);
  assert(events.res.status === 200, `Expected /api/admin/event-registrations 200, got ${events.res.status}`);
  const eventItem = (events.data?.items || []).find((item) => String(item?._id) === qaState.eventRegistrationId);
  assert(Boolean(eventItem), "Event registration not visible in admin list");

  const eventDetail = await requestJson(`/api/admin/event-registrations/${encodeURIComponent(qaState.eventRegistrationId)}`, { method: "GET" }, cookieJar);
  assert(eventDetail.res.status === 200, `Expected event registration detail 200, got ${eventDetail.res.status}`);

  const eventPatch = await requestJson(`/api/admin/event-registrations/${encodeURIComponent(qaState.eventRegistrationId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isRead: true, status: "confirmed" }),
  }, cookieJar);
  assert(eventPatch.res.status === 200, `Expected event registration PATCH 200, got ${eventPatch.res.status}`);

  const volunteers = await requestJson("/api/admin/volunteers-feedback?page=1&limit=20", { method: "GET" }, cookieJar);
  assert(volunteers.res.status === 200, `Expected /api/admin/volunteers-feedback 200, got ${volunteers.res.status}`);
  const volunteerItem = (volunteers.data?.items || []).find((item) => String(item?._id) === qaState.volunteerId);
  assert(Boolean(volunteerItem), "Volunteer feedback not visible in admin list");

  const volunteerDetail = await requestJson(`/api/admin/volunteers-feedback/${encodeURIComponent(qaState.volunteerId)}`, { method: "GET" }, cookieJar);
  assert(volunteerDetail.res.status === 200, `Expected volunteer feedback detail 200, got ${volunteerDetail.res.status}`);

  const volunteerPatch = await requestJson(`/api/admin/volunteers-feedback/${encodeURIComponent(qaState.volunteerId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isRead: true }),
  }, cookieJar);
  assert(volunteerPatch.res.status === 200, `Expected volunteer feedback PATCH 200, got ${volunteerPatch.res.status}`);

  const donations = await requestJson(`/api/admin/donations?page=1&limit=20&search=${encodeURIComponent(qaState.donationOrderId)}`, { method: "GET" }, cookieJar);
  assert(donations.res.status === 200, `Expected /api/admin/donations 200, got ${donations.res.status}`);
  const donationItem = (donations.data?.items || []).find((item) => String(item?._id) === qaState.donationId);
  assert(Boolean(donationItem), "Donation fixture not visible in admin donation list");

  const donationDetail = await requestJson(`/api/admin/donations/${encodeURIComponent(qaState.donationId)}`, { method: "GET" }, cookieJar);
  assert(donationDetail.res.status === 200, `Expected donation detail 200, got ${donationDetail.res.status}`);

  const contactDelete = await requestJson(`/api/admin/contacts/${encodeURIComponent(qaState.contactId)}`, { method: "DELETE" }, cookieJar);
  assert(contactDelete.res.status === 200, `Expected contact delete 200, got ${contactDelete.res.status}`);

  const eventDelete = await requestJson(`/api/admin/event-registrations/${encodeURIComponent(qaState.eventRegistrationId)}`, { method: "DELETE" }, cookieJar);
  assert(eventDelete.res.status === 200, `Expected event registration delete 200, got ${eventDelete.res.status}`);

  const volunteerDelete = await requestJson(`/api/admin/volunteers-feedback/${encodeURIComponent(qaState.volunteerId)}`, { method: "DELETE" }, cookieJar);
  assert(volunteerDelete.res.status === 200, `Expected volunteer feedback delete 200, got ${volunteerDelete.res.status}`);

  results.push("Admin regression checks passed for contacts, event registrations, donations, and volunteers feedback inbox APIs");
}

function buildSchemaPayload() {
  return {
    schema: {
      sections: [
        {
          sectionId: `${QA_PREFIX}_S1`,
          title: "QA Section",
          description: "Automated QA section",
          order: 1,
        },
      ],
      questions: [
        {
          fieldKey: `${QA_PREFIX}_Q1`,
          sectionId: `${QA_PREFIX}_S1`,
          type: "short_text",
          fieldName: "full_name",
          label: "Full Name",
          description: "Your name",
          required: true,
          order: 1,
        },
        {
          fieldKey: `${QA_PREFIX}_Q2`,
          sectionId: `${QA_PREFIX}_S1`,
          type: "email",
          fieldName: "email",
          label: "Email",
          description: "Your email",
          required: true,
          order: 2,
        },
      ],
      defaults: {
        submitLabel: "Send",
        successMessage: "Thanks for submitting",
      },
    },
  };
}

async function runFormBuilderEndToEnd(cookieJar, results) {
  const create = await requestJson("/api/admin/forms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `${QA_PREFIX} Form` }),
  }, cookieJar);
  assert(create.res.status === 201, `Expected form create 201, got ${create.res.status}`);
  const formId = normalizeText(create.data?.formId);
  const shortcode = normalizeText(create.data?.shortcode);
  assert(formId, "Missing formId from create response");
  assert(shortcode, "Missing shortcode from create response");

  const schemaSave = await requestJson(`/api/admin/forms/${encodeURIComponent(formId)}/schema`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildSchemaPayload()),
  }, cookieJar);
  assert(schemaSave.res.status === 200, `Expected schema save 200, got ${schemaSave.res.status}`);

  const publish = await requestJson(`/api/admin/forms/${encodeURIComponent(formId)}/publish`, {
    method: "POST",
  }, cookieJar);
  assert(publish.res.status === 200, `Expected publish 200, got ${publish.res.status}`);
  assert(normalizeText(publish.data?.status) === "published", "Form did not transition to published");

  const publicById = await requestJson(`/api/public/forms/${encodeURIComponent(formId)}`);
  assert(publicById.res.status === 200, `Expected public form by id 200, got ${publicById.res.status}`);

  const publicByShortcode = await requestJson(`/api/public/forms/resolve?shortcode=${encodeURIComponent(shortcode)}`);
  assert(publicByShortcode.res.status === 200, `Expected public form resolve 200, got ${publicByShortcode.res.status}`);

  const submit = await requestJson(`/api/public/forms/${encodeURIComponent(formId)}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "qa-script",
      pagePath: `/${QA_PAGE_SLUG}`,
      answersByFieldKey: {
        [`${QA_PREFIX}_Q1`]: "QA Tester",
        [`${QA_PREFIX}_Q2`]: `qa-${Date.now()}@example.com`,
      },
    }),
  });
  assert(submit.res.status === 201, `Expected form submit 201, got ${submit.res.status}`);

  const unread = await requestJson("/api/admin/forms/submissions/unread?limit=10", { method: "GET" }, cookieJar);
  assert(unread.res.status === 200, `Expected unread endpoint 200, got ${unread.res.status}`);
  const unreadItem = (unread.data?.items || []).find((item) => normalizeText(item?.formId) === formId);
  assert(Boolean(unreadItem), `Unread endpoint did not include submission for ${formId}`);

  const list = await requestJson(`/api/admin/forms/${encodeURIComponent(formId)}/submissions?page=1&limit=20&isRead=false`, { method: "GET" }, cookieJar);
  assert(list.res.status === 200, `Expected submissions list 200, got ${list.res.status}`);
  assert(Array.isArray(list.data?.items), "Submissions list response missing items array");
  const row = (list.data.items || [])[0];
  assert(Boolean(row?._id), "Submissions list missing row id");

  const detail = await requestJson(`/api/admin/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(row._id)}`, { method: "GET" }, cookieJar);
  assert(detail.res.status === 200, `Expected submission detail 200, got ${detail.res.status}`);
  assert(normalizeText(detail.data?.fieldSnapshot?.[`${QA_PREFIX}_Q1`]?.fieldName) === "full_name", "fieldSnapshot was not persisted correctly");

  const markRead = await requestJson(`/api/admin/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(row._id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isRead: true }),
  }, cookieJar);
  assert(markRead.res.status === 200, `Expected mark-read 200, got ${markRead.res.status}`);
  assert(markRead.data?.isRead === true, "Submission isRead did not update to true");

  const deleteSubmission = await requestJson(`/api/admin/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(row._id)}`, {
    method: "DELETE",
  }, cookieJar);
  assert(deleteSubmission.res.status === 200, `Expected submission delete 200, got ${deleteSubmission.res.status}`);

  const deleteForm = await requestJson(`/api/admin/forms/${encodeURIComponent(formId)}`, {
    method: "DELETE",
  }, cookieJar);
  assert(deleteForm.res.status === 200, `Expected form delete 200 after submission cleanup, got ${deleteForm.res.status}`);

  results.push(`Admin-authenticated create -> schema -> publish -> submit -> inbox -> mark-read -> delete flow validated for ${formId}`);

  return { formId, shortcode };
}

async function runEmbedRenderVerification(cookieJar, results) {
  const create = await requestJson("/api/admin/forms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `${QA_PREFIX} Embed Form` }),
  }, cookieJar);
  assert(create.res.status === 201, `Expected embed form create 201, got ${create.res.status}`);
  const formId = normalizeText(create.data?.formId);
  assert(formId, "Missing embed formId");

  const schemaSave = await requestJson(`/api/admin/forms/${encodeURIComponent(formId)}/schema`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildSchemaPayload()),
  }, cookieJar);
  assert(schemaSave.res.status === 200, `Expected embed schema save 200, got ${schemaSave.res.status}`);

  const publish = await requestJson(`/api/admin/forms/${encodeURIComponent(formId)}/publish`, { method: "POST" }, cookieJar);
  assert(publish.res.status === 200, `Expected embed publish 200, got ${publish.res.status}`);

  await connectDB();
  await Page.deleteMany({ slug: QA_PAGE_SLUG });
  await Page.create({
    title: `QA Embed ${QA_PAGE_SLUG}`,
    slug: QA_PAGE_SLUG,
    status: "published",
    layout: [
      {
        instanceId: `${QA_PREFIX}_EMBED`,
        baseComponent: "FormEmbed",
        props: {
          mode: "formId",
          formId,
          heading: "QA Embedded Form",
          description: "Embedded via automated QA",
        },
        order: 1,
      },
    ],
    meta: {
      metaTitle: `QA ${QA_PAGE_SLUG}`,
      metaDescription: "QA embed page",
    },
  });

  const pageResponse = await fetch(toUrl(`/${QA_PAGE_SLUG}`), { redirect: "manual" });
  const html = await pageResponse.text();
  assert(pageResponse.status === 200, `Expected embed page 200, got ${pageResponse.status}`);
  assert(html.includes("QA Embedded Form"), "Embed page HTML missing FormEmbed heading");
  assert(html.toLowerCase().includes("full name"), "Embed page HTML missing question label");

  const submit = await requestJson(`/api/public/forms/${encodeURIComponent(formId)}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "qa-embed",
      pagePath: `/${QA_PAGE_SLUG}`,
      answersByFieldKey: {
        [`${QA_PREFIX}_Q1`]: "Embed Tester",
        [`${QA_PREFIX}_Q2`]: `embed-${Date.now()}@example.com`,
      },
    }),
  });
  assert(submit.res.status === 201, `Expected embed form submit 201, got ${submit.res.status}`);

  const list = await requestJson(`/api/admin/forms/${encodeURIComponent(formId)}/submissions?page=1&limit=10`, { method: "GET" }, cookieJar);
  assert(list.res.status === 200, `Expected embed submissions list 200, got ${list.res.status}`);
  assert((list.data?.items || []).length >= 1, "Embed submission was not visible in admin list");

  results.push(`Embed page render + submit + admin inbox verification passed for /${QA_PAGE_SLUG}`);

  return { formId };
}

async function cleanupQaArtifacts() {
  await connectDB();

  const qaFormIds = await Form.find(
    { formId: { $regex: "^FORM_QA_" } },
    { _id: 0, formId: 1 },
  ).lean();
  const ids = qaFormIds.map((entry) => entry.formId);

  if (ids.length > 0) {
    await SubmissionFile.deleteMany({ formId: { $in: ids } });
    await FormSubmission.deleteMany({ formId: { $in: ids } });
    await Form.deleteMany({ formId: { $in: ids } });
  }

  await Page.deleteMany({ slug: /^qa-form-embed-/i });
  await User.deleteMany({ email: /^form-qa-admin\+/i });
  if (qaState.contactId) {
    await ContactSubmission.deleteOne({ _id: qaState.contactId }).catch(() => {});
  }
  if (qaState.eventRegistrationId) {
    await EventRegistration.deleteOne({ _id: qaState.eventRegistrationId }).catch(() => {});
  }
  if (qaState.volunteerId) {
    await VolunteersFeedbackSubmission.deleteOne({ _id: qaState.volunteerId }).catch(() => {});
  }
  if (qaState.donationId) {
    await DonateNowSubmission.deleteOne({ _id: qaState.donationId }).catch(() => {});
  }
  if (qaState.donationOrderId) {
    await DonateNowSubmission.deleteMany({ orderId: qaState.donationOrderId }).catch(() => {});
  }
}

async function main() {
  const results = [];
  const cookieJar = new Map();

  try {
    await checkServerAvailable();
    await ensureQaAdminUser();
    await loginAsAdmin(cookieJar);

    await runRegressionPublicChecks(results);
    await runRegressionAdminChecks(cookieJar, results);
    await runFormBuilderEndToEnd(cookieJar, results);
    await runEmbedRenderVerification(cookieJar, results);

    await cleanupQaArtifacts();

    console.log("FORM_BUILDER_QA_STATUS: PASS");
    for (const line of results) {
      console.log(`- ${line}`);
    }
  } catch (err) {
    console.error("FORM_BUILDER_QA_STATUS: FAIL");
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  } finally {
    try {
      await cleanupQaArtifacts();
    } catch {
      // no-op cleanup best effort
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

main();
