import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import TestimonialItem from "@/models/TestimonialItem";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const items = await TestimonialItem.find({})
      .sort({ order: 1, updatedAt: -1 })
      .lean();

    return NextResponse.json(
      {
        items: items.map((item) => ({
          quote: item.quote,
          name: item.name,
          role: item.role || "",
          showInSlider: item.showInSlider === true,
        })),
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    console.error("[Public Testimonial Items API error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load testimonial items" },
      { status: 500 },
    );
  }
}
