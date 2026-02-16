import dbConnect from '@/lib/db';
import Page from '@/models/Page';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { id } = await params;
    const page = await Page.findById(id)
      .populate('createdBy', 'name email')
      .populate('layout.componentId')
      .lean();

    if (!page) {
      return errorResponse('Page not found', 404);
    }

    return successResponse(page);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const page = await Page.findById(id);
    if (!page) {
      return errorResponse('Page not found', 404);
    }

    // Check slug uniqueness if changed
    if (body.slug && body.slug !== page.slug) {
      const existing = await Page.findOne({ slug: body.slug, _id: { $ne: id } });
      if (existing) {
        return errorResponse('A page with this slug already exists', 400);
      }
    }

    const updated = await Page.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    return successResponse(updated);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { id } = await params;
    const page = await Page.findByIdAndDelete(id);

    if (!page) {
      return errorResponse('Page not found', 404);
    }

    return successResponse({ message: 'Page deleted successfully' });
  } catch (error) {
    return errorResponse(error.message);
  }
}
