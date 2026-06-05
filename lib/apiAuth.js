import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

let _UserModel = null;
async function getUserModel() {
  if (!_UserModel) {
    _UserModel = (await import("@/models/User")).default;
  }
  return _UserModel;
}

export async function requireAuth(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const User = await getUserModel();
    const user = await User.findById(token.id).select("status").lean();
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
    }
  } catch {
    return NextResponse.json(
      { error: "Authentication verification unavailable" },
      { status: 503 },
    );
  }

  return token;
}
