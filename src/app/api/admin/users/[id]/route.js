import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcryptjs from 'bcryptjs';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { id } = await params;
    const user = await User.findById(id).select('-password').lean();

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    // Hash password if provided
    if (body.password) {
      body.password = await bcryptjs.hash(body.password, 12);
    } else {
      delete body.password;
    }

    const updated = await User.findByIdAndUpdate(id, body, { new: true, runValidators: true })
      .select('-password');

    if (!updated) {
      return errorResponse('User not found', 404);
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

    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return errorResponse('Cannot delete your own account', 400);
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({ message: 'User deleted successfully' });
  } catch (error) {
    return errorResponse(error.message);
  }
}
