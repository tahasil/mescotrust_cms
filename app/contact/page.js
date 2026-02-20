import ContactForm from "@/components/forms/ContactForm";

export const metadata = {
  title: "Contact",
  description: "Get in touch",
};

export default function ContactPage() {
  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Contact</h1>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>Send us a message.</p>
      <ContactForm page="contact" source="contact-page" />
    </main>
  );
}
