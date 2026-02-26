import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import systemComponents from "@/lib/systemComponents";
const { SYSTEM_COMPONENTS } = systemComponents;

/** GET /api/admin/components/ensure/Header or /ensure/Footer
 * Returns the Header or Footer component, creating it from system defaults if it doesn't exist.
 */
export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const base = params?.base;
  if (base !== "Header" && base !== "Footer") {
    return NextResponse.json({ error: "base must be Header or Footer" }, { status: 400 });
  }

  try {
    await connectDB();
    // Prefer the component that has saved layout (length > 0), then most recently updated
    const all = await Component.find({ baseComponent: base }).lean();
    let component = all.length === 0 ? null : all.sort((a, b) => {
      const aHasLayout = Array.isArray(a.layout) && a.layout.length > 0;
      const bHasLayout = Array.isArray(b.layout) && b.layout.length > 0;
      if (aHasLayout && !bHasLayout) return -1;
      if (!aHasLayout && bHasLayout) return 1;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    })[0];
    if (!component) {
      const template = SYSTEM_COMPONENTS.find((c) => c.baseComponent === base);
      if (!template) {
        return NextResponse.json({ error: `No template for ${base}` }, { status: 404 });
      }
      const created = await Component.create({
        name: base.toLowerCase(),
        displayName: template.displayName || base,
        type: "custom",
        category: template.category || "layout",
        baseComponent: base,
        propsSchema: template.propsSchema || [],
        defaultProps: template.defaultProps || {},
        layout: [],
        container: "container-fluid",
        active: true,
      });
      component = created.toObject ? created.toObject() : created;
    }
    return NextResponse.json(component);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
