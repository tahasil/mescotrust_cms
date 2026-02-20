import { BUILDER_COMPONENT_MAP, UnavailableBlock } from "./ComponentMap";

type Section = {
  id: string;
  component: string;
  props?: Record<string, unknown>;
  order?: number;
};

type LayoutData = {
  sections?: Section[];
  modals?: Section[];
  overlays?: Section[];
};

export function DynamicRenderer({ contentJSON }: { contentJSON: string }) {
  let data: LayoutData = { sections: [], modals: [], overlays: [] };
  try {
    data = JSON.parse(contentJSON || "{}");
  } catch {
    return null;
  }
  const sections = (data.sections ?? []).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const Comp = BUILDER_COMPONENT_MAP[section.component];
        if (!Comp) return <UnavailableBlock key={section.id} />;
        return (
          <Comp
            key={section.id}
            {...((section.props ?? {}) as Record<string, unknown>)}
          />
        );
      })}
    </div>
  );
}
