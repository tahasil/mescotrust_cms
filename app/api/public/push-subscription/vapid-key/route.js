import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/webPush";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({ publicKey });
}
