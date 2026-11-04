import { connectDB } from "@/lib/db";
import DonateNowSubmission from "@/models/DonateNowSubmission";
import {
  HISTORY_PAGE_SIZE,
  HISTORY_PROJECTION,
  getHistoryFilter,
  toHistoryItem,
} from "@/lib/donations/donorHistoryAuth";
import {
  getHistorySession,
  historyUnavailable,
  jsonNoStore,
  signedOutResponse,
} from "@/lib/donations/donorHistoryServer";

export const dynamic = "force-dynamic";

/**
 * Successful donations for the verified email, newest first.
 *
 * The page calls this on load to find out whether the donor is already
 * signed in, so "no session" is a normal 200 `{ signedIn: false }` (like
 * NextAuth's session endpoint) rather than a 401 in every visitor's console.
 */
export async function GET(req) {
  const { key, session } = getHistorySession(req);
  if (!key) return historyUnavailable("NEXTAUTH_SECRET is not set");
  if (!session) return signedOutResponse(req, { signedIn: false }, 200);

  const requested = Number(new URL(req.url).searchParams.get("page"));
  const page = Number.isFinite(requested) ? Math.min(Math.max(1, Math.floor(requested)), 1000) : 1;

  try {
    await connectDB();
    const filter = getHistoryFilter(session.email);
    const [total, docs] = await Promise.all([
      DonateNowSubmission.countDocuments(filter),
      DonateNowSubmission.find(filter, HISTORY_PROJECTION)
        .sort({ completedAt: -1, createdAt: -1 })
        .skip((page - 1) * HISTORY_PAGE_SIZE)
        .limit(HISTORY_PAGE_SIZE)
        .lean(),
    ]);

    return jsonNoStore({
      signedIn: true,
      email: session.email,
      sessionExpiresAt: new Date(session.exp).toISOString(),
      page,
      pageSize: HISTORY_PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)),
      items: docs.map(toHistoryItem),
    });
  } catch (err) {
    console.error("[donor-history] list failed:", err?.message || err);
    return jsonNoStore(
      { error: "We couldn't load your donations right now. Please try again." },
      { status: 500 },
    );
  }
}

/** Sign out: clears the session cookie. */
export async function DELETE(req) {
  return signedOutResponse(req, { signedIn: false }, 200);
}
