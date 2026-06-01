export const APPEARANCE_SECTIONS = [
  { key: "header", label: "Header" },
  { key: "footer", label: "Footer" },
  { key: "subscribe", label: "Subscribe" },
  { key: "menu", label: "Menu" },
  { key: "background", label: "Background" },
  { key: "colors", label: "Colors" },
  { key: "layouts", label: "Layouts" },
  { key: "effects", label: "Effects" },
  { key: "loader", label: "Loader" },
  { key: "advanced", label: "Advanced" },
  { key: "branding", label: "Branding" },
];

export const APPEARANCE_SECTION_KEYS = APPEARANCE_SECTIONS.map((s) => s.key);

export function normalizeAppearanceSection(section) {
  const key = String(section || "").toLowerCase().trim();
  return APPEARANCE_SECTION_KEYS.includes(key) ? key : "header";
}
