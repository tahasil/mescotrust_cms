import { Hero } from "@/components/builder/Hero";
import { CardBlock } from "@/components/builder/Card";
import { TextBlock } from "@/components/builder/Text";
import { ImageBlock } from "@/components/builder/Image";
import { Buttons } from "@/components/builder/Buttons";
import { Spacer } from "@/components/builder/Spacer";
import { ContactFormBlock } from "@/components/builder/ContactForm";

export const BUILDER_COMPONENT_MAP: Record<
  string,
  React.ComponentType<Record<string, unknown>>
> = {
  Hero,
  Card: CardBlock,
  Text: TextBlock,
  Image: ImageBlock,
  Buttons,
  Spacer,
  ContactForm: ContactFormBlock,
};

export function UnavailableBlock() {
  return (
    <div className="rounded border border-dashed border-gray-400 bg-gray-50 p-4 text-center text-gray-500">
      Unavailable block
    </div>
  );
}
