import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';
import slugify from 'slugify';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { id } = await params;
    const blog = await Blog.findById(id)
      .populate('author', 'name email')
      .populate('category', 'name slug')
      .lean();

    if (!blog) {
      return errorResponse('Blog post not found', 404);
    }

    // Editors can only see their own posts
    if (session.user.role === 'editor' && blog.author._id.toString() !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    return successResponse(blog);
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

    const blog = await Blog.findById(id);
    if (!blog) {
      return errorResponse('Blog post not found', 404);
    }

    // Editors can only edit their own posts
    if (session.user.role === 'editor' && blog.author.toString() !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Auto-generate slug if title changed
    if (body.title && body.title !== blog.title) {
      body.slug = slugify(body.title, { lower: true, strict: true });
      const existing = await Blog.findOne({ slug: body.slug, _id: { $ne: id } });
      if (existing) {
        return errorResponse('A blog post with this slug already exists', 400);
      }
    }

    const updated = await Blog.findByIdAndUpdate(id, body, { new: true, runValidators: true });
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
    const blog = await Blog.findById(id);

    if (!blog) {
      return errorResponse('Blog post not found', 404);
    }

    // Editors can only delete their own posts
    if (session.user.role === 'editor' && blog.author.toString() !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Blog.findByIdAndDelete(id);
    return successResponse({ message: 'Blog post deleted successfully' });
  } catch (error) {
    return errorResponse(error.message);
  }
}
