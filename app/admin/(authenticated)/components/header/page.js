"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";

export default function AdminHeaderComponentPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/components/ensure/Header");
        if (cancelled) return;
        if (!res.ok) {
          router.replace("/admin/components");
          return;
        }
        const component = await res.json();
        router.replace(`/admin/components/${component._id}/edit`);
      } catch {
        if (!cancelled) router.replace("/admin/components");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 280 }}>
      <Spin size="large" tip="Opening Header editor…" />
    </div>
  );
}
