import dbConnect from '@/lib/db';
import ContactSubmission from '@/models/ContactSubmission';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query = {};
    if (isRead !== null && isRead !== undefined) query.isRead = isRead === 'true';

    const total = await ContactSubmission.countDocuments(query);
    const submissions = await ContactSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return successResponse({ submissions, total, page, limit });
  } catch (error) {
    return errorResponse(error.message);
  }
}
