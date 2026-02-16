import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';
import slugify from 'slugify';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Editors can only see their own posts
    if (session.user.role === 'editor') {
      query.author = session.user.id;
    }

    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'name email')
      .populate('category', 'name slug')
      .lean();

    return successResponse({ blogs, total, page, limit });
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
    const { title, content, excerpt, featuredImage, category, status, metaTitle, metaDescription, tags } = body;

    if (!title) {
      return errorResponse('Title is required', 400);
    }

    const slug = slugify(title, { lower: true, strict: true });

    // Check slug uniqueness
    const existing = await Blog.findOne({ slug });
    if (existing) {
      return errorResponse('A blog post with this title/slug already exists', 400);
    }

    const blog = await Blog.create({
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      category,
      status: status || 'draft',
      metaTitle: metaTitle || title,
      metaDescription,
      author: session.user.id,
      tags: tags || [],
    });

    return successResponse(blog, 201);
  } catch (error) {
    return errorResponse(error.message);
  }
}
