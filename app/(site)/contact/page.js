import ContactForm from "@/components/forms/ContactForm";

export const metadata = {
  title: "Contact",
  description: "Get in touch",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact",
    description: "Get in touch",
    url: "/contact",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <main>
      <h1>Contact</h1>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>Send us a message.</p>
      <ContactForm page="contact" source="contact-page" />
    </main>
  );
}
