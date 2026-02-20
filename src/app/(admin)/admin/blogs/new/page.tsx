"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminNewBlogPage() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/admin/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: "Untitled post", status: "draft" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) router.replace(`/admin/blogs/${data.id}`);
        else router.replace("/admin/blogs");
      })
      .catch(() => router.replace("/admin/blogs"));
  }, [router]);
  return <div className="p-4">Creating post…</div>;
}
