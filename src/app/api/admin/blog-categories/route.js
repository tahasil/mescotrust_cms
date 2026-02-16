import dbConnect from '@/lib/db';
import BlogCategory from '@/models/BlogCategory';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';
import slugify from 'slugify';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const categories = await BlogCategory.find().sort({ name: 1 }).lean();
    return successResponse(categories);
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
    const { name, description } = body;

    if (!name) {
      return errorResponse('Category name is required', 400);
    }

    const slug = slugify(name, { lower: true, strict: true });
    const existing = await BlogCategory.findOne({ slug });
    if (existing) {
      return errorResponse('A category with this name already exists', 400);
    }

    const category = await BlogCategory.create({ name, slug, description });
    return successResponse(category, 201);
  } catch (error) {
    return errorResponse(error.message);
  }
}
