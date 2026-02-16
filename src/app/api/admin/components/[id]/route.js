import dbConnect from '@/lib/db';
import Component from '@/models/Component';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { id } = await params;
    const component = await Component.findById(id).populate('createdBy', 'name email').lean();

    if (!component) {
      return errorResponse('Component not found', 404);
    }

    return successResponse(component);
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

    const component = await Component.findById(id);
    if (!component) {
      return errorResponse('Component not found', 404);
    }

    // Cannot modify system component source code - only toggle active
    if (component.type === 'system') {
      const allowedFields = ['isActive'];
      const updateData = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }
      const updated = await Component.findByIdAndUpdate(id, updateData, { new: true });
      return successResponse(updated);
    }

    // Custom components can be fully edited
    const updated = await Component.findByIdAndUpdate(id, body, { new: true, runValidators: true });
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
    const component = await Component.findById(id);

    if (!component) {
      return errorResponse('Component not found', 404);
    }

    // Cannot delete system components
    if (component.type === 'system') {
      return errorResponse('System components cannot be deleted', 400);
    }

    await Component.findByIdAndDelete(id);
    return successResponse({ message: 'Component deleted successfully' });
  } catch (error) {
    return errorResponse(error.message);
  }
}
