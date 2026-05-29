import { notFound } from "next/navigation";
import AppearanceModule from "@/components/admin/appearance/AppearanceModule";
import {
  APPEARANCE_SECTION_KEYS,
  normalizeAppearanceSection,
} from "@/components/admin/appearance/config";

export default function AppearanceSectionPage({ params }) {
  const section = normalizeAppearanceSection(params?.section);
  if (!APPEARANCE_SECTION_KEYS.includes(section)) notFound();
  return <AppearanceModule section={section} />;
}
