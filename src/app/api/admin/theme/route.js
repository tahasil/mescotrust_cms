import dbConnect from '@/lib/db';
import ThemeConfig from '@/models/ThemeConfig';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET(request) {
  try {
    await dbConnect();

    const theme = await ThemeConfig.findOne({ isActive: true }).lean();
    if (!theme) {
      return successResponse({
        mode: 'light',
        primaryColor: '#CF372F',
        secondaryColor: '#691C18',
        fontFamily: 'Inter',
        fontSize: { base: '16px', heading: '36px' },
        layoutWidth: '1400px',
      });
    }

    return successResponse(theme);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function PUT(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    // Only admin can modify theme
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    body.updatedBy = session.user.id;

    let theme = await ThemeConfig.findOne({ isActive: true });
    if (!theme) {
      theme = await ThemeConfig.create({ ...body, isActive: true });
    } else {
      theme = await ThemeConfig.findByIdAndUpdate(theme._id, body, { new: true, runValidators: true });
    }

    return successResponse(theme);
  } catch (error) {
    return errorResponse(error.message);
  }
}
