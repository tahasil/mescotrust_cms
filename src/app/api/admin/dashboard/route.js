import dbConnect from '@/lib/db';
import Page from '@/models/Page';
import Blog from '@/models/Blog';
import Component from '@/models/Component';
import Media from '@/models/Media';
import ContactSubmission from '@/models/ContactSubmission';
import User from '@/models/User';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const [
      totalPages,
      publishedPages,
      draftPages,
      totalBlogs,
      publishedBlogs,
      totalComponents,
      systemComponents,
      customComponents,
      totalMedia,
      totalContacts,
      unreadContacts,
      totalUsers,
    ] = await Promise.all([
      Page.countDocuments(),
      Page.countDocuments({ status: 'published' }),
      Page.countDocuments({ status: 'draft' }),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Component.countDocuments(),
      Component.countDocuments({ type: 'system' }),
      Component.countDocuments({ type: 'custom' }),
      Media.countDocuments(),
      ContactSubmission.countDocuments(),
      ContactSubmission.countDocuments({ isRead: false }),
      User.countDocuments(),
    ]);

    const recentPages = await Page.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title slug status updatedAt')
      .lean();

    const recentBlogs = await Blog.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title slug status updatedAt')
      .lean();

    const recentContacts = await ContactSubmission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return successResponse({
      stats: {
        pages: { total: totalPages, published: publishedPages, draft: draftPages },
        blogs: { total: totalBlogs, published: publishedBlogs },
        components: { total: totalComponents, system: systemComponents, custom: customComponents },
        media: totalMedia,
        contacts: { total: totalContacts, unread: unreadContacts },
        users: totalUsers,
      },
      recent: {
        pages: recentPages,
        blogs: recentBlogs,
        contacts: recentContacts,
      },
    });
  } catch (error) {
    return errorResponse(error.message);
  }
}
