function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class DonationQueryError extends Error {
  constructor(message) {
    super(message);
    this.name = "DonationQueryError";
  }
}

export function buildDonationFilter(searchParams) {
  const status = searchParams.get("status") || "";
  const search = (searchParams.get("search") || "").trim();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const filter = { isDeleted: { $ne: true } };

  if (
    status &&
    ["pending", "success", "failed", "cancelled", "aborted"].includes(status)
  ) {
    filter.status = status;
  }

  if (search) {
    const safeSearch = escapeRegex(search.slice(0, 120));
    filter.$or = [
      { "donor.name": { $regex: safeSearch, $options: "i" } },
      { "donor.email": { $regex: safeSearch, $options: "i" } },
      { "donor.mobile": { $regex: safeSearch, $options: "i" } },
      { orderId: { $regex: safeSearch, $options: "i" } },
      { purpose: { $regex: safeSearch, $options: "i" } },
      { "payment.transactionId": { $regex: safeSearch, $options: "i" } },
      { "payment.bankRefNo": { $regex: safeSearch, $options: "i" } },
    ];
  }

  if (from || to) {
    const createdAt = {};
    if (from) {
      const fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        throw new DonationQueryError("Invalid start date");
      }
      createdAt.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        throw new DonationQueryError("Invalid end date");
      }
      createdAt.$lte = toDate;
    }
    if (createdAt.$gte && createdAt.$lte && createdAt.$gte > createdAt.$lte) {
      throw new DonationQueryError("Start date cannot be after end date");
    }
    filter.createdAt = createdAt;
  }

  return filter;
}
