/**
 * Contract tests for event RSVP (UAT NEW-06). Fully offline: no database, no
 * server, no email.
 *
 * Run with: npm run test:event-rsvp
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { test } = require("node:test");

const {
  ATTENDANCE_VALUES,
  SEAT_ATTENDANCE,
  buildEventIcs,
  getAttendanceLabel,
  getRsvpState,
  getSeatFilter,
  holdsSeat,
  normalizeAttendance,
  normalizeRsvpCapacity,
} = require("../lib/events/rsvp.js");
const { getRsvpKey, issueRsvpToken, readRsvpToken } = require("../lib/events/rsvpToken.js");
const { signToken } = require("../lib/donations/signedToken.js");
const { renderEventRsvpEmail } = require("../lib/emailTemplates/eventRsvp.js");

const root = path.join(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");

const NOW = new Date("2027-01-10T04:30:00.000Z");
const hoursFromNow = (hours) => new Date(NOW.getTime() + hours * 3_600_000);

test("1. Only yes, maybe and no are accepted", () => {
  assert.deepStrictEqual(ATTENDANCE_VALUES, ["yes", "maybe", "no"]);
  assert.strictEqual(normalizeAttendance(" YES "), "yes");
  for (const bad of ["", "attending", null, undefined, 1]) {
    assert.strictEqual(normalizeAttendance(bad), "");
  }
  assert.strictEqual(getAttendanceLabel("maybe"), "Maybe");
  assert.strictEqual(getAttendanceLabel(undefined), "");
});

test("2. Capacity is a positive whole number or no limit", () => {
  assert.strictEqual(normalizeRsvpCapacity(50), 50);
  assert.strictEqual(normalizeRsvpCapacity("50"), 50);
  for (const none of [null, undefined, "", 0, -3, 1.5, "lots"]) {
    assert.strictEqual(normalizeRsvpCapacity(none), null);
  }
});

test("3. Yes and Maybe hold seats, No never does", () => {
  assert.deepStrictEqual(SEAT_ATTENDANCE, ["yes", "maybe"]);
  assert.strictEqual(holdsSeat({ attendance: "yes", status: "new" }), true);
  assert.strictEqual(holdsSeat({ attendance: "maybe", status: "confirmed" }), true);
  assert.strictEqual(holdsSeat({ attendance: "no", status: "confirmed" }), false);
});

test("4. Cancelled and waitlisted replies free their seat", () => {
  assert.strictEqual(holdsSeat({ attendance: "yes", status: "cancelled" }), false);
  assert.strictEqual(holdsSeat({ attendance: "maybe", status: "waitlisted" }), false);
  const filter = getSeatFilter("abc");
  assert.strictEqual(filter.eventId, "abc");
  assert.deepStrictEqual(filter.status.$in, ["new", "confirmed"]);
});

test("5. Replies close at the closing date or the event end, whichever is first", () => {
  const event = { rsvpEnabled: true };
  const state = (overrides, endAt) =>
    getRsvpState({ event: { ...event, ...overrides }, endAt, now: NOW });

  assert.strictEqual(state({}, hoursFromNow(1)).open, true);
  assert.strictEqual(state({}, hoursFromNow(-1)).open, false);
  assert.strictEqual(state({ rsvpClosesAt: hoursFromNow(-1) }, hoursFromNow(5)).open, false);
  assert.strictEqual(state({ rsvpClosesAt: hoursFromNow(9) }, hoursFromNow(-1)).open, false);
  assert.strictEqual(state({}, null).open, true);
  assert.strictEqual(state({}, NOW).open, false);
});

test("5b. An event already under way still takes replies", () => {
  const running = { rsvpEnabled: true, startDate: hoursFromNow(-2400) };
  assert.strictEqual(getRsvpState({ event: running, endAt: hoursFromNow(1200), now: NOW }).open, true);

  const route = source("app/api/public/event-rsvp/route.js");
  assert.match(route, /endAt: getEventEndAt\(event\)/);
});

test("6. Disabled events are never open, and full means seats reach capacity", () => {
  assert.strictEqual(getRsvpState({ event: {}, now: NOW }).open, false);
  const event = { rsvpEnabled: true, rsvpCapacity: 3 };
  assert.strictEqual(getRsvpState({ event, seatsTaken: 2, now: NOW }).full, false);
  assert.strictEqual(getRsvpState({ event, seatsTaken: 3, now: NOW }).full, true);
  assert.strictEqual(
    getRsvpState({ event: { rsvpEnabled: true }, seatsTaken: 9999, now: NOW }).full,
    false,
  );
});

test("7. Change links only verify for their purpose and key", () => {
  const key = getRsvpKey({ NEXTAUTH_SECRET: "one" });
  const token = issueRsvpToken("row1", "event1", key);
  assert.deepStrictEqual(readRsvpToken(token, key), { registrationId: "row1", eventId: "event1" });

  assert.strictEqual(readRsvpToken(token, getRsvpKey({ NEXTAUTH_SECRET: "two" })), null);
  assert.strictEqual(readRsvpToken(`${token}x`, key), null);
  assert.strictEqual(readRsvpToken(signToken({ p: "donor-history", r: "a", e: "b" }, key), key), null);
  assert.notStrictEqual(key, "one");
});

test("8. Tokens fail closed without a secret", () => {
  assert.strictEqual(getRsvpKey({}), "");
  assert.strictEqual(readRsvpToken("anything.here", ""), null);
});

test("9. Timed events get exact times, and all-day events get exclusive end dates", () => {
  const timed = buildEventIcs({
    event: { _id: "e1", title: "Felicitation" },
    startAt: "2027-02-01T04:30:00.000Z",
    endAt: "2027-02-01T07:30:00.000Z",
    now: NOW,
  });
  assert.match(timed, /DTSTART:20270201T043000Z\r\n/);
  assert.match(timed, /DTEND:20270201T073000Z\r\n/);
  assert.match(timed, /METHOD:PUBLISH\r\n/);

  const noEnd = buildEventIcs({ event: { title: "x" }, startAt: "2027-02-01T04:30:00.000Z", now: NOW });
  assert.match(noEnd, /DTEND:20270201T063000Z\r\n/);

  const allDay = buildEventIcs({
    event: { title: "x" },
    startAt: "2027-02-01T00:00:00.000Z",
    endAt: "2027-02-02T23:59:59.999Z",
    now: NOW,
  });
  assert.match(allDay, /DTSTART;VALUE=DATE:20270201\r\n/);
  assert.match(allDay, /DTEND;VALUE=DATE:20270203\r\n/);

  assert.strictEqual(buildEventIcs({ event: { title: "x" }, startAt: null }), "");
});

test("10. Calendar text is escaped and long lines are folded", () => {
  const ics = buildEventIcs({
    event: {
      title: "Dinner, awards; and\nmore",
      description: "ताज ".repeat(40),
      location: "Hall, Mumbai",
    },
    startAt: "2027-02-01T04:30:00.000Z",
    now: NOW,
  });
  assert.match(ics, /SUMMARY:Dinner\\, awards\\; and\\nmore\r\n/);
  assert.match(ics, /LOCATION:Hall\\, Mumbai\r\n/);
  for (const line of ics.split("\r\n")) {
    assert.ok(Buffer.byteLength(line) <= 75, `line too long: ${line.slice(0, 30)}`);
  }
});

test("11. Emails escape user text and match the reply", () => {
  const yes = renderEventRsvpEmail({
    name: "<img src=x onerror=alert(1)>",
    attendance: "yes",
    eventTitle: "Gala\r\nBcc: someone@example.com",
    changeUrl: "https://example.org/events/a?rsvp=t",
    calendarUrl: "https://example.org/cal",
  });
  assert.ok(!yes.html.includes("<img"));
  assert.ok(!/[\r\n]/.test(yes.subject), "subject must stay on one line");
  assert.ok(yes.html.includes("Add to calendar"));
  assert.ok(yes.text.includes("Change your reply: https://example.org/events/a?rsvp=t"));

  const no = renderEventRsvpEmail({ attendance: "no", calendarUrl: "https://example.org/cal" });
  assert.ok(!no.html.includes("Add to calendar"), "a No gets no calendar link");

  const link = renderEventRsvpEmail({ kind: "change_link", attendance: "yes", changeUrl: "https://e.org/x" });
  assert.match(link.subject, /^Change your reply/);
  assert.ok(!link.html.includes("Add to calendar"));
});

test("11b. RSVP emails use the same layout as the other MESCO emails", () => {
  const { DONATION_RECEIPT_BRAND } = require("../lib/emailTemplates/donationReceipt.js");
  for (const kind of ["confirmed", "change_link"]) {
    const { html } = renderEventRsvpEmail({ kind, attendance: "yes", name: "A", eventTitle: "Gala", changeUrl: "https://e.org/x" });
    assert.ok(html.includes(`bgcolor="${DONATION_RECEIPT_BRAND.navy}"`), "navy header band");
    assert.ok(html.includes('role="presentation"'), "table-based layout");
    assert.ok(html.includes("max-width:600px"), "same card width as the receipt");
    assert.ok(html.includes("MESCO Trust"), "text wordmark");
    assert.ok(!/<img/i.test(html), "no remote logo, which most clients block");
  }
});

test("12. The public route trusts the event record, not the browser", () => {
  const route = source("app/api/public/event-rsvp/route.js");
  assert.ok(!/body\.(eventTitle|eventDate|eventId|capacity)/.test(route));
  assert.match(route, /eventTitle: event\.title/);
  assert.match(route, /status: "published"/);
  assert.match(route, /website/, "keeps the honeypot");
  assert.match(route, /checkRateLimit/);
  assert.match(route, /sanitizePlainText/);
});

test("13. A repeat reply can't overwrite without the signed link", () => {
  const route = source("app/api/public/event-rsvp/route.js");
  assert.match(route, /emailReply\("change_link", existing, event, key\)/);
  assert.match(route, /err\?\.code === 11000/);

  const model = source("models/EventRegistration.js");
  assert.match(model, /unique: true, partialFilterExpression: \{ attendance: \{ \$exists: true \} \}/);
});

test("14. RSVP settings survive the Author revision workflow", () => {
  const put = source("app/api/admin/events/[id]/route.js");
  assert.match(put, /\.\.\.cleanRsvp,/, "pending revision keeps RSVP settings");

  const workflow = source("app/api/admin/events/[id]/workflow/route.js");
  for (const field of ["rsvpEnabled", "rsvpCapacity", "rsvpClosesAt"]) {
    const copies = workflow.split(`doc.${field} = revData.${field}`).length - 1;
    assert.strictEqual(copies, 2, `${field} must copy in both publish paths`);
  }
});

test("14b. Models load what they point to, so populate works on a fresh server", () => {
  assert.match(source("models/Blog.js"), /require\("\.\/BlogCategory"\)/);
  assert.match(source("models/BlogComment.js"), /require\("\.\/Blog"\)/);
});

test("14c. Same-named events stay separate, and repeat replies can't flood an inbox", () => {
  const page = source("app/admin/(authenticated)/event-registrations/page.js");
  assert.match(page, /getEventKey\(r\) === eventFilter/);
  assert.match(page, /item\.eventId === eventFilter/);
  assert.match(source("app/api/admin/event-registrations/export/route.js"), /\{ eventId: eventKey \}/);

  const route = source("app/api/public/event-rsvp/route.js");
  assert.match(route, /CHANGE_LINK_COOLDOWN_MS/);
  assert.match(route, /if \(claimed\) await emailReply\("change_link"/);
});

test("15. Admin totals come from the server, and RSVP stays out of browser bundles' crypto", () => {
  const page = source("app/admin/(authenticated)/event-registrations/page.js");
  assert.match(page, /event-registrations\/summary/);
  assert.match(page, /page <= totalPages/, "the list must load every page");

  assert.ok(!source("lib/events/rsvp.js").includes('from "crypto"'));
  assert.ok(!source("components/events/EventRsvp.js").includes("rsvpToken"));
});
