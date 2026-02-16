import dbConnect from '@/lib/db';
import ContactSubmission from '@/models/ContactSubmission';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { id } = await params;
    const submission = await ContactSubmission.findById(id).lean();

    if (!submission) {
      return errorResponse('Submission not found', 404);
    }

    return successResponse(submission);
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

    const updated = await ContactSubmission.findByIdAndUpdate(
      id,
      { isRead: body.isRead },
      { new: true }
    );

    if (!updated) {
      return errorResponse('Submission not found', 404);
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
    const submission = await ContactSubmission.findByIdAndDelete(id);

    if (!submission) {
      return errorResponse('Submission not found', 404);
    }

    return successResponse({ message: 'Submission deleted successfully' });
  } catch (error) {
    return errorResponse(error.message);
  }
}
