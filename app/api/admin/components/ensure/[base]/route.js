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
    let component = await Component.findOne({ baseComponent: base }).sort({ updatedAt: -1 }).lean();
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
