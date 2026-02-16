import { unlink } from 'fs/promises';
import dbConnect from '@/lib/db';
import Media from '@/models/Media';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { id } = await params;
    const media = await Media.findById(id).populate('uploadedBy', 'name email').lean();

    if (!media) {
      return errorResponse('Media not found', 404);
    }

    return successResponse(media);
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

    const updated = await Media.findByIdAndUpdate(
      id,
      { altText: body.altText, caption: body.caption, folder: body.folder },
      { new: true }
    );

    if (!updated) {
      return errorResponse('Media not found', 404);
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

    // Only admin can delete media
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { id } = await params;
    const media = await Media.findById(id);

    if (!media) {
      return errorResponse('Media not found', 404);
    }

    // Delete file from disk
    try {
      await unlink(media.path);
    } catch {
      // File may already be deleted
    }

    await Media.findByIdAndDelete(id);
    return successResponse({ message: 'Media deleted successfully' });
  } catch (error) {
    return errorResponse(error.message);
  }
}
