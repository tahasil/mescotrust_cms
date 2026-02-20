import { ContactFormBlock } from "@/components/builder/ContactForm";

export default function ContactPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-xl">
        <ContactFormBlock title="Get in touch" />
      </div>
    </main>
  );
}
