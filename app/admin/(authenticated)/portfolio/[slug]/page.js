"use client";

import { useParams } from "next/navigation";
import { PortfolioItemForm } from "@/components/admin/Portfolio";

export default function AdminPortfolioEditPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  return <PortfolioItemForm slug={slug} />;
}


