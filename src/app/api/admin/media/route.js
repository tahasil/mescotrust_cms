import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import dbConnect from '@/lib/db';
import Media from '@/models/Media';
import { getAuthSession, unauthorizedResponse, errorResponse, successResponse } from '@/lib/apiAuth';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // image, video, document
    const folder = searchParams.get('folder');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');

    const query = {};
    if (type) {
      if (type === 'image') query.mimetype = { $regex: /^image\// };
      else if (type === 'video') query.mimetype = { $regex: /^video\// };
      else if (type === 'document') query.mimetype = { $nin: [/^image\//, /^video\//] };
    }
    if (folder) query.folder = folder;
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { altText: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Media.countDocuments(query);
    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('uploadedBy', 'name email')
      .lean();

    return successResponse({ media, total, page, limit });
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();

    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file');
    const altText = formData.get('altText') || '';
    const caption = formData.get('caption') || '';
    const folder = formData.get('folder') || 'general';

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', String(year), month);

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9-_]/g, '-');
    const uniqueName = `${baseName}-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);
    const url = `/uploads/${year}/${month}/${uniqueName}`;

    await writeFile(filePath, buffer);

    const media = await Media.create({
      filename: uniqueName,
      originalName: file.name,
      path: filePath,
      url,
      mimetype: file.type,
      size: file.size,
      altText,
      caption,
      folder,
      uploadedBy: session.user.id,
    });

    return successResponse(media, 201);
  } catch (error) {
    return errorResponse(error.message);
  }
}
