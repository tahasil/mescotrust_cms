import dbConnect from '@/lib/db';
import Page from '@/models/Page';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Page.countDocuments(query);
    const pages = await Page.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean();

    return successResponse({ pages, total, page, limit });
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const body = await request.json();
    const { title, slug, status, metaTitle, metaDescription, layout } = body;

    if (!title || !slug) {
      return errorResponse('Title and slug are required', 400);
    }

    const existingPage = await Page.findOne({ slug });
    if (existingPage) {
      return errorResponse('A page with this slug already exists', 400);
    }

    const newPage = await Page.create({
      title,
      slug,
      status: status || 'draft',
      metaTitle,
      metaDescription,
      layout: layout || [],
      createdBy: session.user.id,
    });

    return successResponse(newPage, 201);
  } catch (error) {
    return errorResponse(error.message);
  }
}
