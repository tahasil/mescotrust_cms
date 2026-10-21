const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const FaqNode = mongoose.model("FaqNode", new mongoose.Schema({}, { strict: false }));
  const allFaqs = await FaqNode.find({}).lean();
  console.log("Total FAQs:", allFaqs.length);

  let cleanedFaqCount = 0;
  for (const doc of allFaqs) {
    const raw = String(doc.answerHtml || "");
    const needsClean =
      /&nbsp;/i.test(raw) ||
      raw.includes("\u00A0") ||
      /background-color/i.test(raw) ||
      /font-family/i.test(raw) ||
      /color:\s*(?:rgb\(\s*(?:102|0|32|34|17)|#666|#000|#202020|#222|black)/i.test(raw);
    if (needsClean) {
      const cleaned = raw
        .replace(/&nbsp;/gi, " ")
        .replace(/\u00A0/g, " ")
        .replace(/\s*background-color:\s*(?:rgb\(\s*255,\s*255,\s*255\s*\)|#ffffff|#fff|white)\s*;?/gi, "")
        .replace(/\s*font-family:\s*[^;"]+;?/gi, "")
        .replace(/\s*color:\s*(?:rgb\(\s*(?:102|0|32|34|17),\s*(?:102|0|32|34|17),\s*(?:102|0|32|34|17)\s*\)|#666(?:666)?|#000(?:000)?|#202020|#222(?:222)?|#111(?:111)?|black)\s*;?/gi, "")
        .trim();
      await FaqNode.updateOne({ _id: doc._id }, { $set: { answerHtml: cleaned } });
      cleanedFaqCount += 1;
      console.log("Cleaned FAQ:", doc.question);
    }
  }
  console.log("Total cleaned FAQs:", cleanedFaqCount);

  const ChatbotMessage = mongoose.model(
    "ChatbotMessage",
    new mongoose.Schema({}, { strict: false }),
  );
  const allMsgs = await ChatbotMessage.find({}).lean();
  let cleanedMsgCount = 0;
  for (const doc of allMsgs) {
    const raw = String(doc.contentHtml || "");
    const rawContent = String(doc.content || "");
    const needsClean =
      /&nbsp;/i.test(raw) ||
      raw.includes("\u00A0") ||
      /background-color/i.test(raw) ||
      /font-family/i.test(raw) ||
      /color:\s*(?:rgb\(\s*(?:102|0|32|34|17)|#666|#000|#202020|#222|black)/i.test(raw) ||
      /&nbsp;/i.test(rawContent) ||
      rawContent.includes("\u00A0");

    if (needsClean) {
      const cleanedHtml = raw
        .replace(/&nbsp;/gi, " ")
        .replace(/\u00A0/g, " ")
        .replace(/\s*background-color:\s*(?:rgb\(\s*255,\s*255,\s*255\s*\)|#ffffff|#fff|white)\s*;?/gi, "")
        .replace(/\s*font-family:\s*[^;"]+;?/gi, "")
        .replace(/\s*color:\s*(?:rgb\(\s*(?:102|0|32|34|17),\s*(?:102|0|32|34|17),\s*(?:102|0|32|34|17)\s*\)|#666(?:666)?|#000(?:000)?|#202020|#222(?:222)?|#111(?:111)?|black)\s*;?/gi, "")
        .trim();
      const cleanedContent = rawContent
        .replace(/&nbsp;/gi, " ")
        .replace(/\u00A0/g, " ")
        .trim();
      await ChatbotMessage.updateOne(
        { _id: doc._id },
        { $set: { contentHtml: cleanedHtml, content: cleanedContent } },
      );
      cleanedMsgCount += 1;
    }
  }
  console.log("Total cleaned messages:", cleanedMsgCount);

  await mongoose.disconnect();
  console.log("Database cleanup completed successfully.");
}

run().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
