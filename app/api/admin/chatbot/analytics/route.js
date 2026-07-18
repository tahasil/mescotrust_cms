import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin, isEditor } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import ChatbotEvent from "@/models/ChatbotEvent";

export const dynamic = "force-dynamic";

function getStartDate(range) {
  const now = new Date();
  const key = String(range || "daily").toLowerCase();
  if (key === "weekly") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (key === "monthly") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - 24 * 60 * 60 * 1000);
}

function toCsv(rows, columns) {
  const header = columns.join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const value = row[col] == null ? "" : String(row[col]);
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\n");
  return `${header}\n${body}`;
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session) && !isEditor(session)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Forbidden" } },
      { status: 403 },
    );
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "daily";
    const format = searchParams.get("format") || "json";
    const start = getStartDate(range);
    const filter = { createdAt: { $gte: start } };

    const [
      totalChatOpens,
      totalNoResultSearches,
      totalContactClicks,
      totalDonationClicks,
      topQuestions,
      topSearches,
      trend,
    ] = await Promise.all([
      ChatbotEvent.countDocuments({ ...filter, eventType: "chat_open" }),
      ChatbotEvent.countDocuments({ ...filter, eventType: "search_no_result" }),
      ChatbotEvent.countDocuments({ ...filter, eventType: "contact_action_click" }),
      ChatbotEvent.countDocuments({ ...filter, eventType: "donation_action_click" }),
      ChatbotEvent.aggregate([
        { $match: { ...filter, eventType: "question_click" } },
        {
          $group: {
            _id: "$questionTitle",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ChatbotEvent.aggregate([
        { $match: { ...filter, eventType: "search_submit" } },
        {
          $group: {
            _id: "$query",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ChatbotEvent.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              day: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              eventType: "$eventType",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.day": 1 } },
      ]),
    ]);

    const payload = {
      range,
      from: start.toISOString(),
      to: new Date().toISOString(),
      totals: {
        totalChatOpens,
        totalNoResultSearches,
        totalContactClicks,
        totalDonationClicks,
      },
      mostClickedQuestions: topQuestions.map((row) => ({
        questionTitle: row._id || "Unknown",
        count: row.count || 0,
      })),
      mostSearchedKeywords: topSearches.map((row) => ({
        query: row._id || "",
        count: row.count || 0,
      })),
      trend: trend.map((row) => ({
        day: row._id.day,
        eventType: row._id.eventType,
        count: row.count || 0,
      })),
    };

    if (format === "csv") {
      const rows = payload.trend.map((item) => ({
        day: item.day,
        eventType: item.eventType,
        count: item.count,
      }));
      const csv = toCsv(rows, ["day", "eventType", "count"]);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="chatbot-analytics-${range}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: payload });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message } },
      { status: 500 },
    );
  }
}
