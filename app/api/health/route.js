import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err?.message || "Database unavailable" },
      { status: 503 }
    );
  }
}
