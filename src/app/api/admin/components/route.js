import dbConnect from '@/lib/db';
import Component from '@/models/Component';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (active !== null && active !== undefined) query.isActive = active === 'true';

    const components = await Component.find(query)
      .sort({ type: 1, displayName: 1 })
      .populate('createdBy', 'name email')
      .lean();

    return successResponse(components);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    // Only admin can create components
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, displayName, category, propsSchema, defaultProps } = body;

    if (!name || !displayName) {
      return errorResponse('Name and display name are required', 400);
    }

    const existing = await Component.findOne({ name });
    if (existing) {
      return errorResponse('A component with this name already exists', 400);
    }

    const component = await Component.create({
      name,
      displayName,
      type: 'custom', // Only custom components can be created via API
      category: category || 'content',
      baseComponent: 'DynamicSectionRenderer',
      propsSchema: propsSchema || [],
      defaultProps: defaultProps || {},
      isActive: true,
      createdBy: session.user.id,
    });

    return successResponse(component, 201);
  } catch (error) {
    return errorResponse(error.message);
  }
}
