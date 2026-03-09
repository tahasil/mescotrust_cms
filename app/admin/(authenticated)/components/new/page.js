"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * New component flow now lives in a modal on /admin/components.
 * Redirect and open the modal via query so old links still work.
 */
export default function AdminComponentNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/components?new=1");
  }, [router]);
  return null;
}
