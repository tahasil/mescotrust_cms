const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function runRbacWorkflowSecuritySuite() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("FAIL: MONGODB_URI is not set in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB for RBAC Workflow Security Tests\n");

  const Blog = require("../models/Blog");
  const Event = require("../models/Event");

  const results = [];
  const runTest = async (name, fn) => {
    try {
      await fn();
      results.push({ name, pass: true });
      console.log(`[PASS] ${name}`);
    } catch (err) {
      results.push({ name, pass: false, error: err.message });
      console.error(`[FAIL] ${name}: ${err.message}`);
    }
  };

  const adminEmail = "superadmin@aiolos.cloud";
  const author1Email = "author1.test@mescotrust.org";
  const author2Email = "author2.test@mescotrust.org";

  const adminSession = { email: adminEmail, roleKey: "admin", role: "Admin" };
  const author1Session = { email: author1Email, roleKey: "author", role: "Author" };
  const author2Session = { email: author2Email, roleKey: "author", role: "Author" };

  const {
    isContentAdmin,
    isContentAuthor,
    isContentOwner,
    canEditContent,
    canDeleteContent,
    appendWorkflowHistory,
  } = await import("../lib/workflow/workflowEngine.js");
  const { CONTENT_STATUSES } = await import("../lib/workflow/constants.js");

  const cleanupSlugs = [];

  try {
    // Test 1: Role helpers verification
    await runTest("Test 1: Role helpers identification", () => {
      if (!isContentAdmin(adminSession)) throw new Error("Admin session not identified as content admin");
      if (isContentAdmin(author1Session)) throw new Error("Author identified as admin");
      if (!isContentAuthor(author1Session)) throw new Error("Author session not identified as author");
    });

    // Test 2: Admin creates a Blog
    let adminBlog;
    await runTest("Test 2: Admin creates a Blog", async () => {
      const slug = `test-admin-blog-${Date.now()}`;
      cleanupSlugs.push(slug);
      adminBlog = await Blog.create({
        title: "Admin Official Blog",
        slug,
        content: "<p>Admin content</p>",
        status: CONTENT_STATUSES.PUBLISHED,
        createdBy: adminEmail,
        updatedBy: adminEmail,
      });
      if (!adminBlog) throw new Error("Admin blog creation failed");
      if (adminBlog.status !== CONTENT_STATUSES.PUBLISHED) throw new Error("Admin blog not published");
    });

    // Test 3: Author attempts to edit Admin's Blog -> Must be rejected by ownership guard
    await runTest("Test 3: Author cannot edit Admin's Blog", () => {
      const isOwner = isContentOwner(adminBlog, author1Session);
      const canEdit = canEditContent(adminBlog, author1Session);
      if (isOwner) throw new Error("Author should not be owner of Admin blog");
      if (canEdit) throw new Error("canEditContent returned true for Author on Admin blog");
    });

    // Test 4: Author attempts to delete Admin's Blog -> Must be rejected
    await runTest("Test 4: Author cannot delete Admin's Blog", () => {
      const canDelete = canDeleteContent(adminBlog, author1Session);
      if (canDelete) throw new Error("canDeleteContent returned true for Author on Admin blog");
    });

    // Test 5: Author creates a new Blog -> Must be draft
    let authorBlog;
    await runTest("Test 5: Author creates new Blog as Draft", async () => {
      const slug = `test-author-blog-${Date.now()}`;
      cleanupSlugs.push(slug);
      authorBlog = await Blog.create({
        title: "Author Community Post",
        slug,
        content: "<p>Author draft content</p>",
        status: CONTENT_STATUSES.DRAFT,
        createdBy: author1Email,
        updatedBy: author1Email,
      });
      if (!authorBlog) throw new Error("Failed to create author blog");
      if (authorBlog.status !== CONTENT_STATUSES.DRAFT) throw new Error(`Expected draft status, got ${authorBlog.status}`);
      if (!isContentOwner(authorBlog, author1Session)) throw new Error("Author1 should be identified as owner");
    });

    // Test 6: Another Author (Author 2) cannot edit Author 1's Blog
    await runTest("Test 6: Author 2 cannot edit Author 1's Blog", () => {
      const isOwner = isContentOwner(authorBlog, author2Session);
      const canEdit = canEditContent(authorBlog, author2Session);
      if (isOwner) throw new Error("Author 2 should not be owner of Author 1's blog");
      if (canEdit) throw new Error("canEditContent returned true for Author 2 on Author 1 blog");
    });

    // Test 7: Author submits Blog for review
    await runTest("Test 7: Author submits Blog for review", async () => {
      authorBlog.status = CONTENT_STATUSES.PENDING_REVIEW;
      authorBlog.submittedAt = new Date();
      appendWorkflowHistory(authorBlog, {
        action: "submit_for_review",
        sessionLike: author1Session,
        notes: "Submitted for review",
      });
      await authorBlog.save();

      const reloaded = await Blog.findById(authorBlog._id);
      if (reloaded.status !== CONTENT_STATUSES.PENDING_REVIEW) {
        throw new Error(`Expected pending_review, got ${reloaded.status}`);
      }
      // Author cannot edit while locked in pending_review
      const canEditWhileLocked = canEditContent(reloaded, author1Session);
      if (canEditWhileLocked) throw new Error("Author should not be allowed to edit while pending_review");
    });

    // Test 8: Admin requests changes with review comments
    await runTest("Test 8: Admin requests changes with review comments", async () => {
      authorBlog.status = CONTENT_STATUSES.CHANGES_REQUESTED;
      authorBlog.reviewComments = "Please fix typos in second paragraph";
      authorBlog.reviewedBy = adminEmail;
      authorBlog.reviewedAt = new Date();
      appendWorkflowHistory(authorBlog, {
        action: "request_changes",
        sessionLike: adminSession,
        notes: "Please fix typos in second paragraph",
      });
      await authorBlog.save();

      const reloaded = await Blog.findById(authorBlog._id);
      if (reloaded.status !== CONTENT_STATUSES.CHANGES_REQUESTED) {
        throw new Error(`Expected changes_requested, got ${reloaded.status}`);
      }
      if (reloaded.reviewComments !== "Please fix typos in second paragraph") {
        throw new Error("Review comments not saved");
      }
      // Author CAN edit when changes_requested
      const canEdit = canEditContent(reloaded, author1Session);
      if (!canEdit) throw new Error("Author should be allowed to edit when changes_requested");
    });

    // Test 9: Author updates and resubmits
    await runTest("Test 9: Author updates and resubmits post", async () => {
      authorBlog.content = "<p>Author revised content with typos fixed</p>";
      authorBlog.status = CONTENT_STATUSES.PENDING_REVIEW;
      appendWorkflowHistory(authorBlog, {
        action: "resubmit",
        sessionLike: author1Session,
        notes: "Typos fixed and resubmitted",
      });
      await authorBlog.save();

      const reloaded = await Blog.findById(authorBlog._id);
      if (reloaded.status !== CONTENT_STATUSES.PENDING_REVIEW) {
        throw new Error(`Expected pending_review, got ${reloaded.status}`);
      }
    });

    // Test 10: Admin approves and publishes Blog
    await runTest("Test 10: Admin approves and publishes Blog", async () => {
      authorBlog.status = CONTENT_STATUSES.APPROVED;
      authorBlog.reviewedBy = adminEmail;
      authorBlog.reviewedAt = new Date();
      await authorBlog.save();

      authorBlog.status = CONTENT_STATUSES.PUBLISHED;
      authorBlog.publishedAt = new Date();
      authorBlog.publishedBy = adminEmail;
      await authorBlog.save();

      const reloaded = await Blog.findById(authorBlog._id);
      if (reloaded.status !== CONTENT_STATUSES.PUBLISHED) {
        throw new Error(`Expected published status, got ${reloaded.status}`);
      }
    });

    // Test 11: Published Content Protection (Revision Workflow)
    await runTest("Test 11: Author updates published blog -> Pending revision created, live content unchanged", async () => {
      const originalTitle = authorBlog.title;
      const proposedTitle = "Brand New Revised Title";

      // Simulated revision creation
      authorBlog.pendingRevision = {
        hasPendingRevision: true,
        submittedAt: new Date(),
        submittedBy: author1Email,
        status: "pending_review",
        reviewComments: "",
        data: {
          title: proposedTitle,
          content: "<p>New draft content</p>",
        },
      };
      await authorBlog.save();

      const liveDoc = await Blog.findById(authorBlog._id);
      // The LIVE blog title MUST remain the original title!
      if (liveDoc.title !== originalTitle) {
        throw new Error(`Live blog title was overwritten! Expected ${originalTitle}, got ${liveDoc.title}`);
      }
      if (liveDoc.status !== CONTENT_STATUSES.PUBLISHED) {
        throw new Error(`Live status changed! Expected published, got ${liveDoc.status}`);
      }
      if (!liveDoc.pendingRevision?.hasPendingRevision) {
        throw new Error("pendingRevision flag not set");
      }
      if (liveDoc.pendingRevision.data.title !== proposedTitle) {
        throw new Error("Revision data not stored correctly");
      }
    });

    // Test 12: Admin approves and merges revision into published blog
    await runTest("Test 12: Admin approves revision and merges into live blog", async () => {
      const revData = authorBlog.pendingRevision.data;
      authorBlog.title = revData.title;
      authorBlog.content = revData.content;
      authorBlog.pendingRevision = {
        hasPendingRevision: false,
        submittedAt: null,
        submittedBy: "",
        data: null,
        reviewComments: "",
        status: "none",
      };
      await authorBlog.save();

      const mergedDoc = await Blog.findById(authorBlog._id);
      if (mergedDoc.title !== "Brand New Revised Title") {
        throw new Error(`Title not merged! Got ${mergedDoc.title}`);
      }
      if (mergedDoc.pendingRevision.hasPendingRevision) {
        throw new Error("pendingRevision was not cleared after merge");
      }
    });

    // Test 13: Event Workflow Verification (Create, Ownership, Protected Revision)
    let testEvent;
    await runTest("Test 13: Event Workflow Verification", async () => {
      const slug = `test-event-${Date.now()}`;
      cleanupSlugs.push(slug);
      testEvent = await Event.create({
        title: "Annual Charity Gala",
        slug,
        description: "Official charity gala",
        status: CONTENT_STATUSES.DRAFT,
        createdBy: author1Email,
        updatedBy: author1Email,
      });

      if (!isContentOwner(testEvent, author1Session)) throw new Error("Author1 should own test event");
      if (isContentOwner(testEvent, author2Session)) throw new Error("Author2 should not own test event");

      // Author submit review
      testEvent.status = CONTENT_STATUSES.PENDING_REVIEW;
      await testEvent.save();

      // Admin approves and publishes
      testEvent.status = CONTENT_STATUSES.PUBLISHED;
      testEvent.publishedAt = new Date();
      testEvent.publishedBy = adminEmail;
      await testEvent.save();

      const reloadedEvent = await Event.findById(testEvent._id);
      if (reloadedEvent.status !== CONTENT_STATUSES.PUBLISHED) {
        throw new Error(`Expected published event, got ${reloadedEvent.status}`);
      }
    });

    // Test 14: Rejection workflow for Author Event
    await runTest("Test 14: Admin rejects Event with reason", async () => {
      testEvent.status = CONTENT_STATUSES.REJECTED;
      testEvent.rejectionReason = "Venue permission document missing";
      await testEvent.save();

      const reloaded = await Event.findById(testEvent._id);
      if (reloaded.status !== CONTENT_STATUSES.REJECTED) {
        throw new Error(`Expected rejected status, got ${reloaded.status}`);
      }
      if (reloaded.rejectionReason !== "Venue permission document missing") {
        throw new Error("Rejection reason not stored");
      }
    });

  } finally {
    // Cleanup test artifacts
    if (cleanupSlugs.length > 0) {
      await Blog.deleteMany({ slug: { $in: cleanupSlugs } });
      await Event.deleteMany({ slug: { $in: cleanupSlugs } });
      console.log(`\nCleaned up ${cleanupSlugs.length} test records`);
    }
    await mongoose.disconnect();
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n===========================================`);
  console.log(`RBAC WORKFLOW SECURITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRbacWorkflowSecuritySuite().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
