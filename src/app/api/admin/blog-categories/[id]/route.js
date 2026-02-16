import dbConnect from '@/lib/db';
import BlogCategory from '@/models/BlogCategory';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';
import slugify from 'slugify';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { id } = await params;
    const category = await BlogCategory.findById(id).lean();

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    return successResponse(category);
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

    if (body.name) {
      body.slug = slugify(body.name, { lower: true, strict: true });
      const existing = await BlogCategory.findOne({ slug: body.slug, _id: { $ne: id } });
      if (existing) {
        return errorResponse('A category with this name already exists', 400);
      }
    }

    const updated = await BlogCategory.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updated) {
      return errorResponse('Category not found', 404);
    }

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
    const category = await BlogCategory.findByIdAndDelete(id);

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    return successResponse({ message: 'Category deleted successfully' });
  } catch (error) {
    return errorResponse(error.message);
  }
}
