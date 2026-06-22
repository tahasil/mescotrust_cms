const mongoose = require("mongoose");

/**
 * EventRegistration — visitor submissions for events.
 *
 * The "event" itself is NOT a separate document. Events live as items inside
 * the props of a `LatestEvents1` (or similar) block on a Page. To avoid
 * coupling registrations to a fragile primary key, we store the event title
 * and date as plain strings (`eventTitle`, `eventDate`) at submission time —
 * effectively a snapshot. If the editor later renames or removes the event
 * from the page block, existing registration records still show the original
 * event details in the admin inbox.
 *
 * Optional `eventId` is reserved for a future "stable IDs on event items"
 * upgrade (Category C item C4 in the plan).
 *
 * Field shape mirrors ContactSubmission so the admin inbox can use the same
 * pattern: top-level `isRead` flag + nested `payload` for the applicant.
 */
const eventRegistrationSchema = new mongoose.Schema(
  {
    // Event snapshot (filled by the public form at submit time)
    eventTitle: { type: String, required: true, trim: true },
    eventDate: { type: String, default: "", trim: true }, // free-text date as the editor entered it
    eventId: { type: String, default: "", trim: true, index: true }, // optional stable ID
    eventSlug: { type: String, default: "", trim: true, lowercase: true, index: true },

    // Applicant info
    payload: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, default: "", trim: true },
      // Some events accept students — capture optional school details
      school: { type: String, default: "", trim: true },
      classOrYear: { type: String, default: "", trim: true },
      // General-purpose notes / cover message
      message: { type: String, default: "", trim: true },
    },

    // Inbox metadata
    page: { type: String, default: "", trim: true }, // URL where the form was submitted
    source: { type: String, default: "", trim: true }, // e.g. "EventRegistrationForm"
    isRead: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["new", "confirmed", "waitlisted", "cancelled"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true },
);

eventRegistrationSchema.index({ eventTitle: 1, createdAt: -1 });
eventRegistrationSchema.index({ createdAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.EventRegistration) ||
  mongoose.model("EventRegistration", eventRegistrationSchema);
