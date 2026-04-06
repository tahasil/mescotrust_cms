import ContactForm from "@/components/forms/ContactForm";
import { getPageSeoMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return getPageSeoMetadata({
    slug: "contact",
    fallbackTitle: "Contact",
    fallbackDescription: "Get in touch",
    fallbackCanonical: "/contact",
    fallbackOpenGraphUrl: "/contact",
  });
}

export default function ContactPage() {
  return (
    <main>
      <h1>Contact</h1>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>Send us a message.</p>
      <ContactForm page="contact" source="contact-page" />
    </main>
  );
}
