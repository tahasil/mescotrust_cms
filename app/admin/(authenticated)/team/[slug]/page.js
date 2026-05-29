"use client";

import { useParams } from "next/navigation";
import { TeamMemberForm } from "@/components/admin/team";

export default function AdminTeamEditMemberPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  return <TeamMemberForm slug={slug} />;
}

