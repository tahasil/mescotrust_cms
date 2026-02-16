import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcryptjs from 'bcryptjs';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    // Only admin can view users
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(users);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    // Only admin can create users
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required', 400);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return errorResponse('A user with this email already exists', 400);
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'editor',
      isActive: true,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return successResponse(userObj, 201);
  } catch (error) {
    return errorResponse(error.message);
  }
}
