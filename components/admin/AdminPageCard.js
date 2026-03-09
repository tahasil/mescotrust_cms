"use client";

import { ThemeAdminCard } from "@/styles/Theme";

/** Client wrapper so server components (e.g. dashboard) can use ThemeAdminCard. */
export default function AdminPageCard({ title, extra, children }) {
  return (
    <ThemeAdminCard title={title} extra={extra}>
      {children}
    </ThemeAdminCard>
  );
}
