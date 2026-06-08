import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FAQChatbotNode from "@/models/FAQChatbotNode";
import { serializeFaqChatbotNode } from "@/lib/faqChatbot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function mapQuestionOption(node) {
  return {
    nodeId: node.nodeId,
    questionText: node.questionText,
    order: node.order,
    pathText: node.pathText || node.questionText,
    depth: node.depth,
  };
}

function mapAnswer(node) {
  return {
    nodeId: node.nodeId,
    answerText: node.answerText,
    order: node.order,
    pathText: node.pathText || node.answerText,
    depth: node.depth,
  };
}

export async function GET(_req, { params }) {
  const id = String(params?.id || "").trim();
  if (!id) {
    return NextResponse.json({ error: "Node ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const nodeDoc = await FAQChatbotNode.findOne({ nodeId: id, isActive: true }).lean();
    if (!nodeDoc) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    const node = serializeFaqChatbotNode(nodeDoc);
    if (node.type === "answer") {
      return NextResponse.json(
        {
          node: {
            nodeId: node.nodeId,
            type: node.type,
            questionText: node.questionText,
            answerText: node.answerText,
            pathText: node.pathText,
            depth: node.depth,
            parentNodeId: node.parentNodeId,
            pathNodeIds: node.pathNodeIds,
          },
          childQuestions: [],
          terminalAnswers: [mapAnswer(node)],
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    const children = await FAQChatbotNode.find({
      parentNodeId: node.nodeId,
      isActive: true,
    })
      .sort({ order: 1, nodeId: 1 })
      .lean();
    const serializedChildren = children.map((child) => serializeFaqChatbotNode(child));

    const childQuestions = serializedChildren
      .filter((child) => child.type === "question")
      .map(mapQuestionOption);
    const terminalAnswers = serializedChildren
      .filter((child) => child.type === "answer")
      .map(mapAnswer);

    return NextResponse.json(
      {
        node: {
          nodeId: node.nodeId,
          type: node.type,
          questionText: node.questionText,
          answerText: node.answerText,
          pathText: node.pathText,
          depth: node.depth,
          parentNodeId: node.parentNodeId,
          pathNodeIds: node.pathNodeIds,
        },
        childQuestions,
        terminalAnswers,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load node data" }, { status: 500 });
  }
}
