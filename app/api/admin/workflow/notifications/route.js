import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import Event from "@/models/Event";
import { isContentAdmin, isContentAuthor } from "@/lib/workflow/workflowEngine";
import { CONTENT_STATUSES } from "@/lib/workflow/constants";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const notifications = [];
    const isAdmin = isContentAdmin(session);
    const isAuthor = isContentAuthor(session);
    const email = String(session.email || "").trim();
    const userId = session.id || session.userId;

    if (isAdmin) {
      // Admin sees items that need attention: Pending Review or pending revisions
      const [pendingBlogs, pendingEvents] = await Promise.all([
        Blog.find({
          $or: [
            { status: CONTENT_STATUSES.PENDING_REVIEW },
            { "pendingRevision.hasPendingRevision": true },
          ],
        })
          .select("title slug status submittedAt updatedAt createdBy pendingRevision")
          .sort({ updatedAt: -1 })
          .limit(20)
          .lean(),
        Event.find({
          $or: [
            { status: CONTENT_STATUSES.PENDING_REVIEW },
            { "pendingRevision.hasPendingRevision": true },
          ],
        })
          .select("title slug status submittedAt updatedAt createdBy pendingRevision")
          .sort({ updatedAt: -1 })
          .limit(20)
          .lean(),
      ]);

      (pendingBlogs || []).forEach((b) => {
        const isRev = b.pendingRevision?.hasPendingRevision;
        notifications.push({
          id: `blog-review-${b._id}`,
          type: "workflow-review",
          title: isRev
            ? `Blog revision pending: "${b.title}" (${b.createdBy || "Author"})`
            : `Blog pending review: "${b.title}" (${b.createdBy || "Author"})`,
          time: b.submittedAt || b.updatedAt,
          link: `/admin/blogs/${b._id}`,
          status: "pending_review",
        });
      });

      (pendingEvents || []).forEach((e) => {
        const isRev = e.pendingRevision?.hasPendingRevision;
        notifications.push({
          id: `event-review-${e._id}`,
          type: "workflow-review",
          title: isRev
            ? `Event revision pending: "${e.title}" (${e.createdBy || "Author"})`
            : `Event pending review: "${e.title}" (${e.createdBy || "Author"})`,
          time: e.submittedAt || e.updatedAt,
          link: `/admin/events/${e._id}`,
          status: "pending_review",
        });
      });
    } else if (isAuthor) {
      // Authors see review feedback on their own submissions
      const userCondition = {
        $or: [{ createdBy: email }],
      };
      if (userId) {
        userCondition.$or.push({ creatorId: userId });
      }

      const statusConditions = [
        CONTENT_STATUSES.CHANGES_REQUESTED,
        CONTENT_STATUSES.APPROVED,
        CONTENT_STATUSES.REJECTED,
      ];

      const [myBlogs, myEvents] = await Promise.all([
        Blog.find({
          ...userCondition,
          $or: [
            { status: { $in: statusConditions } },
            { "pendingRevision.status": { $in: ["changes_requested", "rejected"] } },
          ],
        })
          .select("title slug status reviewComments rejectionReason updatedAt pendingRevision")
          .sort({ updatedAt: -1 })
          .limit(15)
          .lean(),
        Event.find({
          ...userCondition,
          $or: [
            { status: { $in: statusConditions } },
            { "pendingRevision.status": { $in: ["changes_requested", "rejected"] } },
          ],
        })
          .select("title slug status reviewComments rejectionReason updatedAt pendingRevision")
          .sort({ updatedAt: -1 })
          .limit(15)
          .lean(),
      ]);

      (myBlogs || []).forEach((b) => {
        let label = "Blog Status Update";
        if (b.status === CONTENT_STATUSES.CHANGES_REQUESTED) {
          label = `Changes requested for Blog: "${b.title}"`;
        } else if (b.status === CONTENT_STATUSES.APPROVED) {
          label = `Blog approved: "${b.title}"`;
        } else if (b.status === CONTENT_STATUSES.REJECTED) {
          label = `Blog rejected: "${b.title}"`;
        }
        notifications.push({
          id: `blog-feedback-${b._id}`,
          type: "workflow-feedback",
          title: label,
          time: b.updatedAt,
          link: `/admin/blogs/${b._id}`,
          status: b.status,
          comment: b.reviewComments || b.rejectionReason || "",
        });
      });

      (myEvents || []).forEach((e) => {
        let label = "Event Status Update";
        if (e.status === CONTENT_STATUSES.CHANGES_REQUESTED) {
          label = `Changes requested for Event: "${e.title}"`;
        } else if (e.status === CONTENT_STATUSES.APPROVED) {
          label = `Event approved: "${e.title}"`;
        } else if (e.status === CONTENT_STATUSES.REJECTED) {
          label = `Event rejected: "${e.title}"`;
        }
        notifications.push({
          id: `event-feedback-${e._id}`,
          type: "workflow-feedback",
          title: label,
          time: e.updatedAt,
          link: `/admin/events/${e._id}`,
          status: e.status,
          comment: e.reviewComments || e.rejectionReason || "",
        });
      });
    }

    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
    return NextResponse.json({ items: notifications });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
